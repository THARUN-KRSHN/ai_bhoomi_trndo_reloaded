from pathlib import Path
from uuid import uuid4

from PIL import Image, ImageDraw, ImageFont

from app.promotion.schemas import PromotionContent, PromotionFormat


DIMENSIONS = {
    PromotionFormat.portrait: (1080, 1350),
    PromotionFormat.square: (1080, 1080),
    PromotionFormat.story: (1080, 1920),
}


def render_poster(content: PromotionContent, target_dir: Path, format: PromotionFormat, logo: Path | None = None, product_image: Path | None = None) -> tuple[str, int, int]:
    width, height = DIMENSIONS[format]
    image = Image.new("RGB", (width, height), "#f7efe5")
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default(size=56)
    small = ImageFont.load_default(size=30)
    if product_image and product_image.exists():
        with Image.open(product_image).convert("RGB") as source:
            source.thumbnail((width - 120, height // 2))
            image.paste(source, ((width - source.width) // 2, 100))
    else:
        draw.rounded_rectangle((60, 80, width - 60, height // 2), radius=36, fill="#d7b899")
        draw.text((width // 2, height // 4), "Illustrative layout", font=small, fill="#513c2b", anchor="mm")
    draw.text((70, height // 2 + 70), content.poster_headline, font=font, fill="#2d2118")
    draw.multiline_text((70, height // 2 + 170), content.poster_subheadline or "", font=small, fill="#513c2b", spacing=12)
    draw.multiline_text((70, height - 220), content.call_to_action, font=small, fill="#2d2118", spacing=10)
    if logo and logo.exists():
        with Image.open(logo).convert("RGBA") as mark:
            mark.thumbnail((220, 120))
            image.paste(mark, (width - mark.width - 60, 40), mark)
    target_dir.mkdir(parents=True, exist_ok=True)
    asset_id = str(uuid4())
    image.save(target_dir / f"{asset_id}.png", "PNG")
    return asset_id, width, height
