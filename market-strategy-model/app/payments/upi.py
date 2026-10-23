from decimal import Decimal, ROUND_HALF_UP
from urllib.parse import urlencode


def build_upi_uri(vpa: str, payee_name: str, amount: Decimal, order_reference: str, currency: str = "INR") -> str:
    if "@" not in vpa or not vpa.strip():
        raise ValueError("a valid merchant UPI VPA is required")
    if amount <= 0:
        raise ValueError("payment amount must be positive")
    if currency.upper() != "INR":
        raise ValueError("UPI payment instructions currently support INR only")
    normalized = Decimal(str(amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    query = urlencode(
        {
            "pa": vpa.strip(),
            "pn": payee_name.strip(),
            "am": f"{normalized:.2f}",
            "cu": currency.upper(),
            "tn": order_reference,
        }
    )
    return f"upi://pay?{query}"
