import logging
from decimal import Decimal

from app.config import get_settings
from app.db.database import SessionLocal
from app.db.models import OrderRecord, PromotionRecord, ShopProfile, TelegramBinding
from app.orders.schemas import OrderCreate, OrderStatus
from app.orders.service import create_order, transition_order
from app.payments.upi import build_upi_uri
from app.telegram.client import TelegramClient
from app.telegram.service import (
    clear_conversation_state,
    consume_link_token,
    find_product,
    get_active_merchant,
    get_binding_by_chat_id,
    get_conversation_state,
    get_customer_orders,
    get_merchant_binding,
    get_shop_catalog,
    record_update_once,
    set_conversation_state,
)
from app.telegram.templates import render_template

logger = logging.getLogger(__name__)


async def handle_update(update: dict, client: TelegramClient) -> dict:
    """Entrypoint for all Telegram updates (messages and callbacks)."""
    update_id = str(update.get("update_id", ""))
    with SessionLocal() as session:
        if not update_id or not record_update_once(session, update_id):
            return {"status": "duplicate_ignored"}

        if update.get("callback_query"):
            return await _handle_callback(session, update["callback_query"], client)

        message = update.get("message", {})
        chat_id = str(message.get("chat", {}).get("id", ""))
        text = str(message.get("text", "")).strip()

        if not chat_id:
            return {"status": "ignored_no_chat"}

        # Empty text message
        if not text:
            await _send_safe(client, chat_id, "Please send a valid text message or choose an option from the menu.")
            return {"status": "empty_text"}

        # Route Command or Conversation Text
        if text.startswith("/"):
            return await _handle_command(session, chat_id, text, client)

        return await _handle_conversation_message(session, chat_id, text, client)


async def _handle_command(session, chat_id: str, text: str, client: TelegramClient) -> dict:
    """Handles bot commands: /start, /help, /products, /orders, /cancel, /order."""
    parts = text.split(maxsplit=1)
    command = parts[0].lower()
    arg = parts[1].strip() if len(parts) > 1 else ""

    # Command: /start
    if command == "/start":
        if arg:
            # Check if arg is merchant linking token
            linked = consume_link_token(session, arg, chat_id)
            if linked:
                await _send_safe(client, chat_id, "Merchant Telegram account linked.")
                return {"status": "linked"}

            # Check if arg is campaign / promotion deep link
            promo = session.query(PromotionRecord).filter(
                (PromotionRecord.promotion_id == arg) |
                (PromotionRecord.promotion_id == arg.replace("promo_", "").replace("campaign_", ""))
            ).first()
            if promo:
                clear_conversation_state(session, chat_id)
                m_id, profile = get_active_merchant(session, campaign_id=promo.promotion_id)
                shop_name = profile.get("shop_name", "TRNDO Shop")
                prod_title = promo.promotion_id
                try:
                    c_json = __import__("json").loads(promo.content_json)
                    prod_title = c_json.get("promotion_title") or c_json.get("poster_headline") or prod_title
                except Exception:
                    pass

                text_resp = f"Welcome to {shop_name}!\n\nYou opened our campaign for: {prod_title}.\n\nHow would you like to proceed?"
                markup = {
                    "inline_keyboard": [
                        [{"text": f"🛍️ Order {prod_title}", "callback_data": f"order_prod:{prod_title}"}],
                        [{"text": "💬 Ask a Question", "callback_data": f"enquire_prod:{prod_title}"}],
                        [{"text": "📖 Browse All Products", "callback_data": "browse_products"}],
                    ]
                }
                await _send_safe(client, chat_id, text_resp, reply_markup=markup)
                return {"status": "campaign_welcome", "promotion_id": promo.promotion_id}

            # Unrecognized token
            await _send_safe(client, chat_id, "This link is invalid or expired.")
            return {"status": "invalid_link"}

        # Normal Welcome Message
        clear_conversation_state(session, chat_id)
        m_id, profile = get_active_merchant(session)
        shop_name = profile.get("shop_name", "TRNDO AI Shop")

        welcome_text = (
            f"Welcome to TRNDO AI Merchant Assistant!\n\n"
            f"Discover products, ask questions and place orders directly with {shop_name}.\n\n"
            f"Choose an option below to continue."
        )
        markup = {
            "inline_keyboard": [
                [
                    {"text": "🛍️ Browse Products", "callback_data": "browse_products"},
                    {"text": "📦 My Orders", "callback_data": "my_orders"},
                ],
                [
                    {"text": "💬 Contact Shop", "callback_data": "contact_shop"},
                    {"text": "❓ Help", "callback_data": "cmd_help"},
                ],
            ]
        }
        await _send_safe(client, chat_id, welcome_text, reply_markup=markup)
        return {"status": "welcome"}

    # Command: /help
    if command == "/help":
        help_text = (
            "TRNDO AI Customer Guide:\n\n"
            "• /products — Browse verified product catalog and current prices.\n"
            "• Ask Questions — Inquire about ingredients, customization, or pickup.\n"
            "• Place an Order — Select an item, confirm quantity, and submit your request.\n"
            "• /orders — Check status and payment instructions for your orders.\n"
            "• /cancel — Cancel an active inquiry or draft order."
        )
        markup = {
            "inline_keyboard": [
                [
                    {"text": "🛍️ Browse Products", "callback_data": "browse_products"},
                    {"text": "📦 My Orders", "callback_data": "my_orders"},
                ]
            ]
        }
        await _send_safe(client, chat_id, help_text, reply_markup=markup)
        return {"status": "help"}

    # Command: /products
    if command == "/products":
        return await _show_products_catalog(session, chat_id, client)

    # Command: /orders
    if command == "/orders":
        return await _show_customer_orders(session, chat_id, client)

    # Command: /cancel
    if command == "/cancel":
        state, _ = get_conversation_state(session, chat_id)
        if state != "idle":
            clear_conversation_state(session, chat_id)
            await _send_safe(
                client,
                chat_id,
                "Your current enquiry or draft order request has been cancelled.",
                reply_markup={"inline_keyboard": [[{"text": "🛍️ Browse Products", "callback_data": "browse_products"}]]},
            )
            return {"status": "cancelled"}
        else:
            await _send_safe(
                client,
                chat_id,
                "No active draft to cancel. If you need to cancel a confirmed order, please contact the shop directly.",
            )
            return {"status": "no_active_draft"}

    # Command: /order (Shorthand: /order Product | Qty | Notes | Merchant)
    if command == "/order":
        return await _handle_shorthand_order(session, chat_id, text, client)

    # Fallback response for unrecognized command
    await _send_fallback(client, chat_id)
    return {"status": "unknown_command"}


async def _handle_conversation_message(session, chat_id: str, text: str, client: TelegramClient) -> dict:
    """Handles stateful conversational input (e.g. quantity, fulfillment notes, inquiry text)."""
    state, context = get_conversation_state(session, chat_id)

    if state == "awaiting_quantity":
        try:
            qty = int(text.strip())
            if qty <= 0:
                raise ValueError()
        except ValueError:
            await _send_safe(client, chat_id, "Quantity must be a positive whole number. Please enter quantity (e.g. 1, 2, 5):")
            return {"status": "invalid_quantity"}

        context["quantity"] = qty
        set_conversation_state(session, chat_id, "awaiting_fulfillment", context)
        await _send_safe(
            client,
            chat_id,
            f"Quantity set to {qty}.\n\nPlease enter your delivery address, pickup date, or fulfillment notes (or send 'None'):",
        )
        return {"status": "quantity_recorded", "quantity": qty}

    if state == "awaiting_fulfillment":
        notes = "" if text.lower().strip() in ("none", "no", "-", "nil") else text.strip()
        context["fulfillment_notes"] = notes
        set_conversation_state(session, chat_id, "awaiting_confirmation", context)

        prod_name = context.get("product_name", "Selected Product")
        qty = context.get("quantity", 1)
        unit_price = context.get("unit_price")
        currency = context.get("currency", "INR")
        total = round(unit_price * qty, 2) if unit_price is not None else None

        price_line = f"₹{unit_price:.2f}" if unit_price is not None else "Price to be confirmed by shop"
        total_line = f"₹{total:.2f}" if total is not None else "To be calculated"
        notes_line = notes if notes else "None specified"

        summary = (
            f"📋 Please review your order request:\n\n"
            f"• Product: {prod_name}\n"
            f"• Quantity: {qty}\n"
            f"• Unit Price: {price_line}\n"
            f"• Total: {total_line} ({currency})\n"
            f"• Notes: {notes_line}\n\n"
            f"Confirm this order request?"
        )
        markup = {
            "inline_keyboard": [
                [
                    {"text": "✅ Confirm Order Request", "callback_data": "confirm_order_draft"},
                    {"text": "❌ Cancel", "callback_data": "cancel_order_draft"},
                ]
            ]
        }
        await _send_safe(client, chat_id, summary, reply_markup=markup)
        return {"status": "summary_presented"}

    if state == "awaiting_enquiry_text":
        prod_name = context.get("product_name", "Product")
        m_id, profile = get_active_merchant(session)
        shop_name = profile.get("shop_name", "Shop")

        # Answer with verified catalog info if available
        prod = find_product(session, prod_name)
        clear_conversation_state(session, chat_id)

        reply_msg = render_template("enquiry_received", shop_name=shop_name, product_name=prod_name)
        if prod and prod.get("description"):
            reply_msg += f"\n\nVerified Product Details:\n{prod['description']}"
            if prod.get("price") is not None:
                reply_msg += f"\nVerified Price: ₹{prod['price']:.2f}"

        await _send_safe(
            client,
            chat_id,
            reply_msg,
            reply_markup={
                "inline_keyboard": [
                    [{"text": f"🛍️ Order {prod_name}", "callback_data": f"order_prod:{prod_name}"}],
                    [{"text": "📖 Browse Catalogue", "callback_data": "browse_products"}],
                ]
            },
        )

        # Notify Merchant
        binding = get_merchant_binding(session, m_id)
        if binding:
            notif = f"💬 New Customer Enquiry\n\n• Product: {prod_name}\n• Customer Chat: #{chat_id}\n• Question: {text}"
            await _send_safe(client, binding.chat_id, notif)

        return {"status": "enquiry_processed"}

    # Fallback response for unhandled message in idle state
    await _send_fallback(client, chat_id)
    return {"status": "fallback"}


async def _handle_callback(session, callback: dict, client: TelegramClient) -> dict:
    """Handles inline keyboard button callbacks for both customers and merchants."""
    data = str(callback.get("data", ""))
    chat_id = str(callback.get("message", {}).get("chat", {}).get("id", ""))
    if not chat_id or not data:
        return {"status": "ignored"}

    # Customer Callbacks
    if data == "browse_products":
        return await _show_products_catalog(session, chat_id, client)

    if data == "my_orders":
        return await _show_customer_orders(session, chat_id, client)

    if data == "cmd_help":
        return await _handle_command(session, chat_id, "/help", client)

    if data == "contact_shop":
        m_id, profile = get_active_merchant(session)
        shop_name = profile.get("shop_name", "Shop")
        city = profile.get("city", "Kerala")
        contact_info = (
            f"📞 Contact {shop_name}:\n\n"
            f"• Location: {city}\n"
            f"• Hours: Open for customer orders & inquiries\n"
            f"• Direct support: Reply right here in this chat to reach the shop owner."
        )
        await _send_safe(client, chat_id, contact_info)

        binding = get_merchant_binding(session, m_id)
        if binding:
            await _send_safe(client, binding.chat_id, f"Customer from chat #{chat_id} requested shop contact.")
        return {"status": "contact_shown"}

    if data.startswith("order_prod:"):
        prod_name = data.replace("order_prod:", "").strip()
        prod = find_product(session, prod_name)
        if not prod:
            await _send_safe(client, chat_id, "This product is currently unavailable in the shop catalogue.")
            return {"status": "product_unavailable"}

        m_id, _ = get_active_merchant(session)
        context = {
            "product_name": prod["name"],
            "unit_price": prod["price"],
            "currency": prod["currency"],
            "merchant_id": m_id,
        }
        set_conversation_state(session, chat_id, "awaiting_quantity", context)

        price_desc = f"₹{prod['price']:.2f}" if prod["price"] is not None else "Price to be quoted"
        msg = f"Ordering: {prod['name']} ({price_desc})\n\nHow many would you like to order? Please enter the quantity (e.g. 1):"
        await _send_safe(client, chat_id, msg)
        return {"status": "ordering_started", "product": prod["name"]}

    if data.startswith("enquire_prod:"):
        prod_name = data.replace("enquire_prod:", "").strip()
        context = {"product_name": prod_name}
        set_conversation_state(session, chat_id, "awaiting_enquiry_text", context)
        msg = f"What would you like to know about {prod_name}? (e.g. custom flavors, ingredients, delivery dates):"
        await _send_safe(client, chat_id, msg)
        return {"status": "enquiry_started", "product": prod_name}

    if data == "confirm_order_draft":
        state, context = get_conversation_state(session, chat_id)
        if state != "awaiting_confirmation" or not context.get("product_name"):
            await _send_safe(client, chat_id, "No active draft order to confirm. Start by browsing /products.")
            return {"status": "no_draft"}

        m_id = context.get("merchant_id") or "development-merchant"
        prod_name = context.get("product_name")
        qty = context.get("quantity", 1)
        unit_price = context.get("unit_price")
        notes = context.get("fulfillment_notes")

        # Create Order with server-calculated total
        order = create_order(
            session,
            OrderCreate(
                merchant_id=m_id,
                product_name=prod_name,
                quantity=qty,
                telegram_chat_id=chat_id,
                fulfillment_notes=notes,
                unit_price=unit_price,
            ),
        )
        clear_conversation_state(session, chat_id)

        # Send customer confirmation using template
        m_id, profile = get_active_merchant(session)
        shop_name = profile.get("shop_name", "the shop")
        cust_msg = render_template("order_received", order_reference=order.order_id)
        await _send_safe(client, chat_id, cust_msg)

        # Send notification to merchant
        binding = get_merchant_binding(session, m_id)
        if binding:
            price_str = f"₹{order.total_amount:.2f}" if order.total_amount is not None else "To quote"
            notif = (
                f"🚨 New Order Request Received!\n\n"
                f"• Reference: {order.order_id}\n"
                f"• Product: {order.product_name}\n"
                f"• Quantity: {order.quantity}\n"
                f"• Total: {price_str}\n"
                f"• Customer Notes: {order.fulfillment_notes or 'None'}\n"
                f"• Status: {order.status}"
            )
            merchant_markup = {
                "inline_keyboard": [
                    [
                        {"text": "✅ Confirm Order", "callback_data": f"confirm:{order.order_id}"},
                        {"text": "❌ Reject Order", "callback_data": f"reject:{order.order_id}"},
                    ],
                    [
                        {"text": "💳 Send Payment Instructions", "callback_data": f"send_upi:{order.order_id}"},
                    ],
                ]
            }
            await _send_safe(client, binding.chat_id, notif, reply_markup=merchant_markup)

        return {"status": "order_created", "order_id": order.order_id}

    if data == "cancel_order_draft":
        clear_conversation_state(session, chat_id)
        await _send_safe(client, chat_id, "Draft order request cancelled.")
        return {"status": "draft_cancelled"}

    if data.startswith("pay_order:"):
        order_id = data.replace("pay_order:", "").strip()
        order = session.query(OrderRecord).filter_by(order_id=order_id).first()
        if not order or order.telegram_chat_id != chat_id:
            await _send_safe(client, chat_id, "Order not found.")
            return {"status": "order_not_found"}

        return await _send_upi_instructions_to_customer(session, order, client)

    if data.startswith("paid_claim:"):
        order_id = data.replace("paid_claim:", "").strip()
        order = session.query(OrderRecord).filter_by(order_id=order_id).first()
        if not order or order.telegram_chat_id != chat_id:
            await _send_safe(client, chat_id, "Order not found.")
            return {"status": "order_not_found"}

        # Mark payment_reported without marking paid
        try:
            transition_order(session, order_id, OrderStatus.payment_reported, order.merchant_id)
        except Exception:
            pass

        # Send template: payment awaiting verification
        msg = render_template("payment_reported", order_reference=order_id)
        await _send_safe(client, chat_id, msg)

        # Notify merchant to verify in bank account
        binding = get_merchant_binding(session, order.merchant_id)
        if binding:
            notif = (
                f"💰 Customer Reported Payment!\n\n"
                f"• Order: {order.order_id}\n"
                f"• Amount: ₹{order.total_amount}\n"
                f"Please verify receipt in your merchant bank account before marking as paid."
            )
            markup = {
                "inline_keyboard": [
                    [{"text": "✅ Verify & Mark Paid", "callback_data": f"confirm_paid:{order.order_id}"}],
                ]
            }
            await _send_safe(client, binding.chat_id, notif, reply_markup=markup)

        return {"status": "payment_reported"}

    # Merchant Action Callbacks (confirm, reject, send_upi, confirm_paid, ready, fulfilled)
    return await _handle_merchant_callback(session, chat_id, data, client)


async def _handle_merchant_callback(session, chat_id: str, data: str, client: TelegramClient) -> dict:
    """Validates merchant identity and handles order state machine updates."""
    binding = get_binding_by_chat_id(session, chat_id)
    if not binding:
        await _send_safe(client, chat_id, "This action is not authorized.")
        return {"status": "unauthorized"}

    action, _, order_id = data.partition(":")
    order = session.query(OrderRecord).filter_by(order_id=order_id, merchant_id=binding.merchant_id).first()
    if not order:
        await _send_safe(client, chat_id, "This action is not authorized.")
        return {"status": "unauthorized"}

    m_id, profile = get_active_merchant(session)
    shop_name = profile.get("shop_name", "the shop")

    try:
        if action == "confirm":
            transition_order(session, order_id, OrderStatus.confirmed, binding.merchant_id)
            await _send_safe(client, chat_id, f"Order {order_id} confirmed.")

            # Notify customer
            if order.telegram_chat_id:
                cust_msg = render_template(
                    "order_confirmed",
                    order_reference=order_id,
                    currency=order.currency,
                    total_amount=order.total_amount or 0.0,
                )
                markup = {"inline_keyboard": [[{"text": "💳 Pay via UPI", "callback_data": f"pay_order:{order_id}"}]]}
                await _send_safe(client, order.telegram_chat_id, cust_msg, reply_markup=markup)
            return {"status": "confirmed"}

        if action == "reject":
            transition_order(session, order_id, OrderStatus.rejected, binding.merchant_id)
            await _send_safe(client, chat_id, f"Order {order_id} rejected.")

            if order.telegram_chat_id:
                cust_msg = render_template("order_rejected", order_reference=order_id)
                await _send_safe(client, order.telegram_chat_id, cust_msg)
            return {"status": "rejected"}

        if action == "send_upi":
            # Transition to awaiting_payment if confirmed
            if order.status == OrderStatus.confirmed.value:
                try:
                    transition_order(session, order_id, OrderStatus.awaiting_payment, binding.merchant_id)
                except Exception:
                    pass

            res = await _send_upi_instructions_to_customer(session, order, client)
            if res.get("status") == "upi_sent":
                await _send_safe(client, chat_id, f"Payment instructions sent to customer for order {order_id}.")
            else:
                await _send_safe(client, chat_id, f"Could not generate UPI instructions: {res.get('reason')}")
            return res

        if action == "confirm_paid":
            # Manually set payment_status to verified before transitioning to paid
            order.payment_status = "verified"
            session.commit()
            transition_order(session, order_id, OrderStatus.paid, binding.merchant_id)
            await _send_safe(client, chat_id, f"Order {order_id} marked as paid.")

            if order.telegram_chat_id:
                await _send_safe(
                    client,
                    order.telegram_chat_id,
                    f"Payment for order {order_id} has been verified by the shop! We are preparing your order.",
                )
            return {"status": "paid"}

        if action == "ready":
            transition_order(session, order_id, OrderStatus.ready, binding.merchant_id)
            await _send_safe(client, chat_id, f"Order {order_id} marked as ready.")

            if order.telegram_chat_id:
                cust_msg = render_template("order_ready", order_reference=order_id)
                await _send_safe(client, order.telegram_chat_id, cust_msg)
            return {"status": "ready"}

        if action == "fulfilled":
            transition_order(session, order_id, OrderStatus.fulfilled, binding.merchant_id)
            await _send_safe(client, chat_id, f"Order {order_id} marked as fulfilled.")

            if order.telegram_chat_id:
                cust_msg = render_template("order_completed", shop_name=shop_name, order_reference=order_id)
                await _send_safe(client, order.telegram_chat_id, cust_msg)
            return {"status": "fulfilled"}

    except Exception as e:
        logger.exception("Merchant order action failed")
        await _send_safe(client, chat_id, f"Action could not be completed: {str(e)}")
        return {"status": "error", "error": str(e)}

    await _send_safe(client, chat_id, "Unknown action.")
    return {"status": "unknown_action"}


async def _show_products_catalog(session, chat_id: str, client: TelegramClient) -> dict:
    """Displays verified product catalogue or reports unavailable."""
    catalog = get_shop_catalog(session)
    if not catalog:
        await _send_safe(client, chat_id, "The shop's catalogue is currently unavailable.")
        return {"status": "catalog_empty"}

    msg_lines = ["🛍️ *Available Product Catalogue:*\n"]
    keyboard = []
    for item in catalog:
        price_str = f"₹{item['price']:.2f}" if item["price"] is not None else "Price to be confirmed"
        desc = f"  _{item['description']}_\n" if item["description"] else ""
        msg_lines.append(f"• *{item['name']}* — {price_str}\n{desc}")
        keyboard.append([
            {"text": f"🛍️ Order {item['name']}", "callback_data": f"order_prod:{item['name']}"},
            {"text": f"💬 Ask Question", "callback_data": f"enquire_prod:{item['name']}"},
        ])

    keyboard.append([{"text": "📦 My Orders", "callback_data": "my_orders"}])
    await _send_safe(client, chat_id, "\n".join(msg_lines), reply_markup={"inline_keyboard": keyboard})
    return {"status": "catalog_shown", "count": len(catalog)}


async def _show_customer_orders(session, chat_id: str, client: TelegramClient) -> dict:
    """Shows only orders belonging to this Telegram customer identity."""
    orders = get_customer_orders(session, chat_id)
    if not orders:
        await _send_safe(
            client,
            chat_id,
            "You have no active or past orders with this shop.",
            reply_markup={"inline_keyboard": [[{"text": "🛍️ Browse Products", "callback_data": "browse_products"}]]},
        )
        return {"status": "no_orders"}

    lines = ["📦 *Your Order History:*\n"]
    keyboard = []
    for o in orders:
        total_str = f"₹{o.total_amount:.2f}" if o.total_amount is not None else "Quote pending"
        lines.append(
            f"• *Order #{o.order_id[:8]}*\n"
            f"  Item: {o.product_name} (x{o.quantity})\n"
            f"  Total: {total_str} | Status: `{o.status}`\n"
            f"  Payment: `{o.payment_status}`\n"
        )
        if o.status in (OrderStatus.confirmed.value, OrderStatus.awaiting_payment.value):
            keyboard.append([{"text": f"💳 Pay Order #{o.order_id[:8]}", "callback_data": f"pay_order:{o.order_id}"}])

    keyboard.append([{"text": "🛍️ Browse Products", "callback_data": "browse_products"}])
    await _send_safe(client, chat_id, "\n".join(lines), reply_markup={"inline_keyboard": keyboard})
    return {"status": "orders_shown", "count": len(orders)}


async def _send_upi_instructions_to_customer(session, order: OrderRecord, client: TelegramClient) -> dict:
    """Generates and delivers UPI payment instructions for eligible order."""
    settings = get_settings()
    vpa = settings.effective_upi_vpa
    payee_name = settings.effective_upi_payee_name or "Shop Merchant"

    if not vpa or "@" not in vpa:
        return {"status": "error", "reason": "Merchant UPI VPA is not configured."}

    if not order.total_amount or order.total_amount <= 0:
        return {"status": "error", "reason": "Order amount is not confirmed."}

    amount_dec = Decimal(str(order.total_amount))
    upi_uri = build_upi_uri(
        vpa=vpa,
        payee_name=payee_name,
        amount=amount_dec,
        order_reference=order.order_id,
        currency=order.currency,
    )

    instructions_text = (
        f"💳 *UPI Payment Instructions*\n\n"
        f"• Order Reference: `{order.order_id}`\n"
        f"• Merchant Payee: *{payee_name}*\n"
        f"• Total Amount: *₹{order.total_amount:.2f}*\n"
        f"• UPI ID (VPA): `{vpa}`\n\n"
        f"Tap the UPI link below or copy the UPI ID into Google Pay, PhonePe, or Paytm:\n"
        f"`{upi_uri}`\n\n"
        f"⚠️ *Important:* After completing your transfer, tap the button below so the shop can verify your receipt."
    )
    markup = {
        "inline_keyboard": [
            [{"text": "✅ I Have Paid", "callback_data": f"paid_claim:{order.order_id}"}],
        ]
    }
    await _send_safe(client, order.telegram_chat_id, instructions_text, reply_markup=markup)
    return {"status": "upi_sent", "upi_uri": upi_uri}


async def _handle_shorthand_order(session, chat_id: str, text: str, client: TelegramClient) -> dict:
    """Handles legacy /order product | quantity | notes shorthand."""
    parts = text.split("|")
    if len(parts) < 3:
        await _send_safe(client, chat_id, "Use: /order product | quantity | optional notes")
        return {"status": "invalid_order"}
    try:
        quantity = int(parts[1].strip())
        if quantity <= 0:
            raise ValueError()
    except ValueError:
        await _send_safe(client, chat_id, "Quantity must be a positive whole number.")
        return {"status": "invalid_order"}

    merchant_id = parts[3].strip() if len(parts) > 3 else "development-merchant"
    prod_name = parts[0].replace("/order", "").strip()
    notes = parts[2].strip()

    # Look up verified unit price if product exists
    prod = find_product(session, prod_name, merchant_id)
    unit_price = prod.get("price") if prod else None

    order = create_order(
        session,
        OrderCreate(
            merchant_id=merchant_id,
            product_name=prod_name,
            quantity=quantity,
            telegram_chat_id=chat_id,
            fulfillment_notes=notes,
            unit_price=unit_price,
        ),
    )
    binding = session.query(TelegramBinding).filter_by(merchant_id=merchant_id).first()
    await _send_safe(client, chat_id, f"Order request {order.order_id} received; it is awaiting shop confirmation.")
    if binding:
        price_str = f"₹{order.total_amount:.2f}" if order.total_amount is not None else "Quote pending"
        await _send_safe(client, binding.chat_id, f"New enquiry {order.order_id}: {order.product_name}, quantity {order.quantity} ({price_str}).")
    return {"status": "order_created", "order_id": order.order_id}


async def _send_fallback(client: TelegramClient, chat_id: str):
    """Sends the standardized fallback message with helpful menu buttons."""
    fallback_msg = render_template("fallback")
    markup = {
        "inline_keyboard": [
            [
                {"text": "🛍️ Browse Products", "callback_data": "browse_products"},
                {"text": "📦 My Orders", "callback_data": "my_orders"},
            ],
            [
                {"text": "💬 Contact Shop", "callback_data": "contact_shop"},
                {"text": "❓ Help", "callback_data": "cmd_help"},
            ],
        ]
    }
    await _send_safe(client, chat_id, fallback_msg, reply_markup=markup)


async def _send_safe(client: TelegramClient, chat_id: str, text: str, reply_markup: dict | None = None) -> bool:
    """Dispatches Telegram message safely, logging failure truthfully."""
    try:
        await client.send_message(chat_id, text, reply_markup=reply_markup)
        return True
    except Exception as e:
        logger.warning(f"Failed to dispatch Telegram message to chat {chat_id}: {e}")
        return False
