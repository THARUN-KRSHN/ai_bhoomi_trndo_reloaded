from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse

from app.config import get_settings
from app.db.database import SessionLocal
from app.db.models import AssetRecord, OrderRecord, PromotionRecord
from app.orders.schemas import OrderCreate, OrderResponse, OrderStatus
from app.orders.service import create_order, transition_order
from app.payments.qr_generator import create_qr
from app.payments.upi import build_upi_uri
from app.promotion.schemas import PromotionRequest, PromotionResponse
from app.promotion.service import create_promotion, save_uploaded_asset
from app.telegram.client import TelegramClient
from app.db.models import TelegramBinding
from app.auth.service import current_user

router = APIRouter(prefix="/api/v1")


@router.post("/promotions/assets")
async def upload_asset(request: Request, merchant_id: str = Form(...), asset_type: str = Form(...), file: UploadFile = File(...)):
    content = await file.read()
    with SessionLocal() as session:
        asset = save_uploaded_asset(session, merchant_id, asset_type, file.filename or "asset", content)
        if request.headers.get("Authorization"):
            asset.user_id = current_user(request, session).user_id
            session.commit()
        return {"asset_id": asset.asset_id, "asset_type": asset.asset_type, "width": asset.width, "height": asset.height}


@router.get("/promotions/assets/{asset_id}")
def get_asset(asset_id: str):
    with SessionLocal() as session:
        asset = session.query(AssetRecord).filter_by(asset_id=asset_id).first()
    if not asset or not Path(asset.path).is_file():
        raise HTTPException(status_code=404, detail="Asset not found")
    return FileResponse(asset.path, media_type=asset.mime_type, filename=asset.filename)


@router.post("/promotions/generate", response_model=PromotionResponse)
async def generate_promotion(request: PromotionRequest, http_request: Request):
    with SessionLocal() as session:
        response = await create_promotion(session, request)
        if http_request.headers.get("Authorization"):
            user = current_user(http_request, session)
            record = session.query(PromotionRecord).filter_by(promotion_id=response.promotion_id).first()
            if record:
                record.user_id = user.user_id
                session.query(AssetRecord).filter_by(promotion_id=record.promotion_id).update({"user_id": user.user_id})
                session.commit()
        return response


@router.get("/promotions/{promotion_id}", response_model=PromotionResponse)
def get_promotion(promotion_id: str, request: Request):
    with SessionLocal() as session:
        query = session.query(PromotionRecord).filter_by(promotion_id=promotion_id)
        if request.headers.get("Authorization"):
            query = query.filter_by(user_id=current_user(request, session).user_id)
        record = query.first()
        if not record:
            raise HTTPException(status_code=404, detail="Promotion not found")
        from app.promotion.service import _response
        return _response(session, record)


@router.get("/promotions/{promotion_id}/assets")
def list_promotion_assets(promotion_id: str):
    with SessionLocal() as session:
        assets = session.query(AssetRecord).filter_by(promotion_id=promotion_id).all()
        return [{"asset_id": asset.asset_id, "url": f"/api/v1/promotions/assets/{asset.asset_id}", "format": asset.asset_type, "width": asset.width, "height": asset.height} for asset in assets]


@router.post("/promotions/{promotion_id}/telegram/send")
async def send_promotion_to_merchant(promotion_id: str, merchant_id: str, request: Request):
    with SessionLocal() as session:
        user = current_user(request, session) if request.headers.get("Authorization") else None
        binding = session.query(TelegramBinding).filter_by(merchant_id=merchant_id).first()
        promotion_query = session.query(PromotionRecord).filter_by(promotion_id=promotion_id, merchant_id=merchant_id)
        asset_query = session.query(AssetRecord).filter_by(promotion_id=promotion_id, merchant_id=merchant_id)
        if user:
            binding = session.query(TelegramBinding).filter_by(merchant_id=merchant_id, user_id=user.user_id).first()
            promotion_query = promotion_query.filter_by(user_id=user.user_id)
            asset_query = asset_query.filter_by(user_id=user.user_id)
        promotion = promotion_query.first()
        assets = asset_query.all()
        if not promotion or not binding:
            raise HTTPException(status_code=404, detail="Promotion or linked merchant chat not found")
        content = __import__("json").loads(promotion.content_json)
    settings = get_settings()
    if not settings.public_base_url:
        raise HTTPException(status_code=503, detail="PUBLIC_BASE_URL is required for Telegram asset delivery")
    client = TelegramClient()
    if not client.configured:
        raise HTTPException(status_code=503, detail="Telegram bot is not configured")
    sent = []
    for asset in assets:
        url = f"{settings.public_base_url.rstrip('/')}/api/v1/promotions/assets/{asset.asset_id}"
        sent.append(await client.send_photo(binding.chat_id, url, content["primary_caption"]))
    return {"promotion_id": promotion_id, "merchant_id": merchant_id, "sent_assets": len(sent)}


@router.post("/orders", response_model=OrderResponse)
def create_customer_order(request: OrderCreate, http_request: Request):
    with SessionLocal() as session:
        order = create_order(session, request)
        if http_request.headers.get("Authorization"):
            order.user_id = current_user(http_request, session).user_id
            session.commit()
        return _order_response(order)


@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(order_id: str, merchant_id: str, request: Request):
    with SessionLocal() as session:
        query = session.query(__import__("app.db.models", fromlist=["OrderRecord"]).OrderRecord).filter_by(order_id=order_id, merchant_id=merchant_id)
        if request.headers.get("Authorization"):
            query = query.filter_by(user_id=current_user(request, session).user_id)
        order = query.first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return _order_response(order)


@router.post("/orders/{order_id}/transition", response_model=OrderResponse)
def update_order(order_id: str, merchant_id: str, status: OrderStatus, request: Request):
    with SessionLocal() as session:
        if request.headers.get("Authorization"):
            current_user(request, session)
        return _order_response(transition_order(session, order_id, status, merchant_id))


@router.get("/orders")
def list_orders(request: Request, merchant_id: str | None = None):
    with SessionLocal() as session:
        query = session.query(__import__("app.db.models", fromlist=["OrderRecord"]).OrderRecord)
        if request.headers.get("Authorization"):
            query = query.filter_by(user_id=current_user(request, session).user_id)
        elif merchant_id:
            query = query.filter_by(merchant_id=merchant_id)
        return [_order_response(order) for order in query.order_by(__import__("app.db.models", fromlist=["OrderRecord"]).OrderRecord.created_at.desc()).all()]


@router.post("/orders/{order_id}/payment-instructions")
def payment_instructions(order_id: str, merchant_id: str):
    settings = get_settings()
    if not settings.effective_upi_vpa or not settings.effective_upi_payee_name:
        raise HTTPException(status_code=503, detail="merchant UPI configuration is not configured")
    with SessionLocal() as session:
        order = session.query(__import__("app.db.models", fromlist=["OrderRecord"]).OrderRecord).filter_by(order_id=order_id, merchant_id=merchant_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        if order.status not in {OrderStatus.confirmed.value, OrderStatus.awaiting_payment.value} or order.total_amount is None:
            raise HTTPException(status_code=409, detail="order is not eligible for payment instructions")
        from decimal import Decimal
        uri = build_upi_uri(settings.effective_upi_vpa, settings.effective_upi_payee_name, Decimal(str(order.total_amount)), order.order_id, settings.payment_currency)
        path = Path(settings.effective_asset_storage_dir) / f"payment-{order.order_id}.png"
        create_qr(uri, path)
        order.status = OrderStatus.awaiting_payment.value
        order.payment_status = "pending"
        session.commit()
        return {"order_id": order.order_id, "upi_uri": uri, "qr_url": f"/api/v1/payments/qr/{order.order_id}", "verification_note": "UPI intent does not verify payment; merchant must independently verify it."}


@router.get("/payments/qr/{order_id}")
def payment_qr(order_id: str, merchant_id: str):
    path = Path(get_settings().effective_asset_storage_dir) / f"payment-{order_id}.png"
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Payment QR not found")
    return FileResponse(path, media_type="image/png", filename=f"{order_id}.png")


def _order_response(order) -> OrderResponse:
    return OrderResponse(order_id=order.order_id, merchant_id=order.merchant_id, status=order.status, product_name=order.product_name, quantity=order.quantity, unit_price=order.unit_price, total_amount=order.total_amount, currency=order.currency, payment_status=order.payment_status)
