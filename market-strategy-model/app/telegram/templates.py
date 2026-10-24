"""Predefined customer message templates for TRNDO AI Telegram Bot."""

TEMPLATES = {
    "welcome": "Welcome to {shop_name}! How can we help you today?",
    "enquiry_received": "Thank you for contacting {shop_name}. We've received your enquiry about {product_name}. The shop will review it and get back to you.",
    "order_received": "Your order request {order_reference} has been received. It is awaiting confirmation from the shop.",
    "order_confirmed": "Your order {order_reference} has been confirmed. Total amount: {currency} {total_amount}. Please review the payment instructions below.",
    "order_rejected": "Unfortunately, the shop could not accept order {order_reference}. Please contact the shop if you need further assistance.",
    "payment_instructions": "Payment instructions for order {order_reference} are available below. Verify the merchant name and amount before paying.",
    "payment_reported": "We have recorded your payment notification for order {order_reference}. Payment is awaiting verification by the shop.",
    "order_ready": "Your order {order_reference} is ready. Please follow the pickup or fulfilment instructions confirmed by the shop.",
    "order_completed": "Thank you for ordering from {shop_name}. Your order {order_reference} has been marked as completed.",
    "fallback": "Sorry, I couldn't understand that request. Please choose one of the options below or contact the shop.",
}

REQUIRED_VARS = {
    "welcome": {"shop_name"},
    "enquiry_received": {"shop_name", "product_name"},
    "order_received": {"order_reference"},
    "order_confirmed": {"order_reference", "currency", "total_amount"},
    "order_rejected": {"order_reference"},
    "payment_instructions": {"order_reference"},
    "payment_reported": {"order_reference"},
    "order_ready": {"order_reference"},
    "order_completed": {"shop_name", "order_reference"},
    "fallback": set(),
}


def render_template(template_name: str, **kwargs) -> str:
    """Renders a predefined customer message template after validating required variables."""
    if template_name not in TEMPLATES:
        raise KeyError(f"Unknown template: {template_name}")

    required = REQUIRED_VARS.get(template_name, set())
    missing = [k for k in required if kwargs.get(k) is None or str(kwargs.get(k)).strip() == ""]
    if missing:
        raise ValueError(f"Missing required template variables for '{template_name}': {', '.join(missing)}")

    # Format numeric values nicely
    formatted_kwargs = {}
    for k, v in kwargs.items():
        if isinstance(v, (float, int)) and k in ("total_amount", "amount", "price"):
            formatted_kwargs[k] = f"{v:.2f}"
        else:
            formatted_kwargs[k] = str(v)

    return TEMPLATES[template_name].format(**formatted_kwargs)
