from pathlib import Path

import qrcode


def create_qr(uri: str, target: Path) -> Path:
    target.parent.mkdir(parents=True, exist_ok=True)
    image = qrcode.make(uri)
    image.save(target, format="PNG")
    return target
