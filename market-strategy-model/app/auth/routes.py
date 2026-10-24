import json
from fastapi import APIRouter, Request

from app.auth.schemas import AuthRequest, AuthResponse, PinChangeRequest, ShopProfileRequest
from app.auth.service import change_pin, current_user, login, logout, register, save_profile
from app.db.database import SessionLocal
from app.db.models import ShopProfile

router = APIRouter(prefix="/api/v1/auth")


@router.post("/register", response_model=AuthResponse)
def register_user(payload: AuthRequest):
    with SessionLocal() as session:
        user, token = register(session, payload.phone_number, payload.pin)
        session.commit()
        return AuthResponse(access_token=token, user_id=user.user_id, onboarding_complete=user.onboarding_complete, onboarding_skipped=user.onboarding_skipped)


@router.post("/login", response_model=AuthResponse)
def login_user(payload: AuthRequest):
    with SessionLocal() as session:
        user, token = login(session, payload.phone_number, payload.pin)
        return AuthResponse(access_token=token, user_id=user.user_id, onboarding_complete=user.onboarding_complete, onboarding_skipped=user.onboarding_skipped)


@router.get("/me")
def get_me(request: Request):
    with SessionLocal() as session:
        user = current_user(request, session)
        return {"user_id": user.user_id, "phone_number": user.phone_number, "onboarding_complete": user.onboarding_complete, "onboarding_skipped": user.onboarding_skipped}


@router.post("/onboarding/skip")
def skip_onboarding(request: Request):
    with SessionLocal() as session:
        user = current_user(request, session)
        user.onboarding_skipped = True
        session.commit()
        return {"onboarding_complete": user.onboarding_complete, "onboarding_skipped": True}


@router.post("/logout", status_code=204)
def logout_user(request: Request):
    with SessionLocal() as session:
        logout(request, session)


@router.patch("/pin", status_code=204)
def update_pin(payload: PinChangeRequest, request: Request):
    with SessionLocal() as session:
        user = current_user(request, session)
        change_pin(session, user, payload.current_pin, payload.new_pin)


profile_router = APIRouter(prefix="/api/v1")


@profile_router.get("/profile")
def get_profile(request: Request):
    with SessionLocal() as session:
        user = current_user(request, session)
        profile = session.query(ShopProfile).filter_by(user_id=user.user_id).first()
        return {"profile": json.loads(profile.profile_json), "version": profile.version} if profile else {"profile": None, "version": 0}


@profile_router.put("/profile")
@profile_router.patch("/profile")
def update_profile(payload: ShopProfileRequest, request: Request):
    with SessionLocal() as session:
        user = current_user(request, session)
        profile = save_profile(session, user, payload.model_dump())
        return {"profile": json.loads(profile.profile_json), "version": profile.version}


@profile_router.post("/profile/logo")
async def upload_logo(request: Request):
    from fastapi import UploadFile, File
    from app.promotion.service import save_uploaded_asset
    from app.db.models import AssetRecord

    form = await request.form()
    file = form.get("file")
    if not isinstance(file, UploadFile):
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="file is required")

    content = await file.read()
    with SessionLocal() as session:
        user = current_user(request, session)
        asset = save_uploaded_asset(session, user.user_id, "logo", file.filename or "logo.png", content)
        asset.user_id = user.user_id
        profile = session.query(ShopProfile).filter_by(user_id=user.user_id).first()
        if profile:
            data = json.loads(profile.profile_json)
            data["logo_asset_id"] = asset.asset_id
            data["logo_url"] = f"/api/v1/promotions/assets/{asset.asset_id}"
            profile.profile_json = json.dumps(data)
            profile.version += 1
        session.commit()
        return {
            "asset_id": asset.asset_id,
            "logo_url": f"/api/v1/promotions/assets/{asset.asset_id}",
            "filename": asset.filename,
        }

