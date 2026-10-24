import textwrap
from pathlib import Path
from uuid import uuid4

from PIL import Image, ImageDraw, ImageFont, ImageOps

from app.promotion.schemas import PromotionContent, PromotionFormat

DIMENSIONS = {
    PromotionFormat.portrait: (1080, 1350),
    PromotionFormat.square: (1080, 1080),
    PromotionFormat.story: (1080, 1920),
}


def _get_font(name_candidates: list[str], size: int) -> ImageFont.ImageFont:
    for name in name_candidates:
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            continue
    try:
        return ImageFont.load_default(size=size)
    except Exception:
        return ImageFont.load_default()


def _wrap_text(text: str, font: ImageFont.ImageFont, max_width: int, draw: ImageDraw.ImageDraw) -> list[str]:
    lines: list[str] = []
    paragraphs = text.replace("\r", "").split("\n")
    for para in paragraphs:
        if not para.strip():
            continue
        words = para.split()
        if not words:
            continue
        current_line = words[0]
        for word in words[1:]:
            test_line = f"{current_line} {word}"
            bbox = draw.textbbox((0, 0), test_line, font=font)
            if (bbox[2] - bbox[0]) <= max_width:
                current_line = test_line
            else:
                lines.append(current_line)
                current_line = word
        if current_line:
            lines.append(current_line)
    return lines


def render_poster(
    content: PromotionContent,
    target_dir: Path,
    format: PromotionFormat,
    logo: Path | None = None,
    product_image: Path | None = None,
) -> tuple[str, int, int]:
    width, height = DIMENSIONS[format]

    # Create base canvas with deep luxury obsidian-forest tone
    base_bg = Image.new("RGBA", (width, height), (7, 23, 18, 255))

    # Fonts
    font_bold = _get_font(["arialbd.ttf", "segoeuib.ttf"], 58 if format != PromotionFormat.story else 66)
    font_sub = _get_font(["segoeui.ttf", "arial.ttf"], 32 if format != PromotionFormat.story else 36)
    font_badge = _get_font(["segoeuib.ttf", "arialbd.ttf"], 22)
    font_cta = _get_font(["arialbd.ttf", "segoeuib.ttf"], 28)
    font_footer = _get_font(["segoeui.ttf", "arial.ttf"], 18)

    # Calculate layout zones
    if format == PromotionFormat.portrait:
        hero_height = int(height * 0.65)
        text_start_y = int(height * 0.60)
    elif format == PromotionFormat.square:
        hero_height = int(height * 0.58)
        text_start_y = int(height * 0.54)
    else:  # story (1080x1920)
        hero_height = int(height * 0.64)
        text_start_y = int(height * 0.60)

    # 1. Product Artwork / Visual
    has_custom_visual = False
    if product_image and product_image.exists():
        try:
            with Image.open(product_image).convert("RGBA") as source:
                # Resize source image to fill the hero area cleanly
                fitted = ImageOps.fit(source, (width, hero_height), method=Image.Resampling.LANCZOS)
                base_bg.paste(fitted, (0, 0), fitted)
                has_custom_visual = True
        except Exception:
            has_custom_visual = False

    if not has_custom_visual:
        # Render dynamic luxury gradient & editorial aesthetic backdrop
        gradient = Image.new("RGBA", (width, height))
        g_draw = ImageDraw.Draw(gradient)
        top_color = (12, 61, 45)      # Rich emerald
        bottom_color = (6, 17, 13)    # Obsidian forest
        for y in range(height):
            ratio = y / float(height)
            r = int(top_color[0] + (bottom_color[0] - top_color[0]) * ratio)
            g = int(top_color[1] + (bottom_color[1] - top_color[1]) * ratio)
            b = int(top_color[2] + (bottom_color[2] - top_color[2]) * ratio)
            g_draw.line([(0, y), (width, y)], fill=(r, g, b, 255))
        base_bg = gradient

        # Add stylized geometric glass cards in hero zone
        hero_draw = ImageDraw.Draw(base_bg)
        hero_draw.rounded_rectangle(
            (60, 140, width - 60, hero_height - 20),
            radius=32,
            fill=(16, 48, 37, 180),
            outline=(112, 240, 166, 70),
            width=2,
        )
        # Visual spotlight indicator
        hero_draw.text(
            (width // 2, (140 + hero_height) // 2 - 20),
            content.promotion_title.upper(),
            font=font_bold,
            fill=(244, 250, 246, 255),
            anchor="mm",
        )
        hero_draw.text(
            (width // 2, (140 + hero_height) // 2 + 50),
            "VERIFIED MARKET OPPORTUNITY",
            font=font_badge,
            fill=(112, 240, 166, 230),
            anchor="mm",
        )

    # 2. Add Dark Gradient Scrim over the hero bottom to guarantee text contrast
    scrim = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    scrim_draw = ImageDraw.Draw(scrim)
    scrim_top = max(0, hero_height - 280)
    scrim_bottom = hero_height + 40
    for y in range(scrim_top, height):
        if y < scrim_bottom:
            factor = (y - scrim_top) / float(scrim_bottom - scrim_top)
            alpha = int(255 * (factor ** 1.5))
        else:
            alpha = 255
        scrim_draw.line([(0, y), (width, y)], fill=(7, 23, 18, alpha))
    base_bg = Image.alpha_composite(base_bg, scrim)

    draw = ImageDraw.Draw(base_bg)

    # 3. Top Header Bar: Logo & Campaign Badge
    header_y = 50
    if logo and logo.exists():
        try:
            with Image.open(logo).convert("RGBA") as mark:
                mark.thumbnail((260, 90), Image.Resampling.LANCZOS)
                # Glass backdrop pill for logo
                pill_padding = 14
                pill_x1 = 60
                pill_y1 = header_y
                pill_x2 = pill_x1 + mark.width + (pill_padding * 2)
                pill_y2 = pill_y1 + mark.height + (pill_padding * 2)
                draw.rounded_rectangle(
                    (pill_x1, pill_y1, pill_x2, pill_y2),
                    radius=20,
                    fill=(7, 23, 18, 210),
                    outline=(255, 255, 255, 40),
                    width=1,
                )
                base_bg.paste(mark, (pill_x1 + pill_padding, pill_y1 + pill_padding), mark)
        except Exception:
            pass

    # Top Right Campaign Indicator
    badge_text = "TREND-ALIGNED CAMPAIGN"
    badge_bbox = draw.textbbox((0, 0), badge_text, font=font_badge)
    b_width = badge_bbox[2] - badge_bbox[0]
    b_height = badge_bbox[3] - badge_bbox[1]
    b_x2 = width - 60
    b_x1 = b_x2 - b_width - 32
    b_y1 = header_y + 10
    b_y2 = b_y1 + b_height + 20
    draw.rounded_rectangle(
        (b_x1, b_y1, b_x2, b_y2),
        radius=16,
        fill=(12, 61, 45, 220),
        outline=(112, 240, 166, 120),
        width=1,
    )
    draw.text((b_x1 + 16, b_y1 + 10), badge_text, font=font_badge, fill=(112, 240, 166, 255))

    # 4. Lower Typography & Content Section
    margin_x = 70
    content_width = width - (margin_x * 2)
    curr_y = text_start_y + 20

    # Category Pill
    category_label = (content.campaign_angle or "LIMITED RELEASE").upper()
    cat_bbox = draw.textbbox((0, 0), category_label, font=font_badge)
    cat_w = cat_bbox[2] - cat_bbox[0]
    cat_h = cat_bbox[3] - cat_bbox[1]
    draw.rounded_rectangle(
        (margin_x, curr_y, margin_x + cat_w + 24, curr_y + cat_h + 16),
        radius=12,
        fill=(112, 240, 166, 35),
        outline=(112, 240, 166, 90),
        width=1,
    )
    draw.text((margin_x + 12, curr_y + 8), category_label, font=font_badge, fill=(112, 240, 166, 255))
    curr_y += cat_h + 32

    # Headline
    headline_lines = _wrap_text(content.poster_headline, font_bold, content_width, draw)
    for line in headline_lines[:3]:  # max 3 lines
        draw.text((margin_x, curr_y), line, font=font_bold, fill=(248, 250, 247, 255))
        line_bbox = draw.textbbox((0, 0), line, font=font_bold)
        curr_y += (line_bbox[3] - line_bbox[1]) + 14

    curr_y += 8

    # Subheadline / Strategic Benefit
    if content.poster_subheadline:
        sub_lines = _wrap_text(content.poster_subheadline, font_sub, content_width, draw)
        for line in sub_lines[:2]:
            draw.text((margin_x, curr_y), line, font=font_sub, fill=(194, 214, 204, 240))
            sub_bbox = draw.textbbox((0, 0), line, font=font_sub)
            curr_y += (sub_bbox[3] - sub_bbox[1]) + 10

    # 5. Call to Action Pill Button
    cta_text = content.call_to_action or "ORDER VIA WHATSAPP"
    if not cta_text.startswith("→"):
        cta_text = f"→  {cta_text.upper()}"
    cta_bbox = draw.textbbox((0, 0), cta_text, font=font_cta)
    cta_w = cta_bbox[2] - cta_bbox[0]
    cta_h = cta_bbox[3] - cta_bbox[1]
    cta_btn_h = 72
    cta_y = height - 160
    cta_x1 = margin_x
    cta_x2 = min(width - margin_x, cta_x1 + cta_w + 64)

    # CTA glow/shadow
    draw.rounded_rectangle(
        (cta_x1, cta_y, cta_x2, cta_y + cta_btn_h),
        radius=36,
        fill=(112, 240, 166, 255),
    )
    draw.text(
        ((cta_x1 + cta_x2) // 2, cta_y + (cta_btn_h // 2)),
        cta_text,
        font=font_cta,
        fill=(7, 23, 18, 255),
        anchor="mm",
    )

    # 6. Bottom Brand Watermark
    footer_text = "TRNDO STUDIO · VERIFIED LOCAL RETAIL CAMPAIGN"
    draw.text(
        (margin_x, height - 60),
        footer_text,
        font=font_footer,
        fill=(120, 150, 138, 200),
    )

    # Convert to RGB and save
    target_dir.mkdir(parents=True, exist_ok=True)
    asset_id = str(uuid4())
    final_image = base_bg.convert("RGB")
    final_image.save(target_dir / f"{asset_id}.png", "PNG", optimize=True)
    return asset_id, width, height
