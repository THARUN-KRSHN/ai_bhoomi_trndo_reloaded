import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError
from fastapi import HTTPException, Request

from app.config import get_settings
from app.db.models import AuthSession, ShopProfile, UserRecord

_hasher = PasswordHasher()


def normalize_phone(phone: str) -> str:
    normalized = "".join(char for char in phone.strip() if char.isdigit() or char == "+")
    if len(normalized.replace("+", "")) < 7:
        raise ValueError("invalid phone number")
    return normalized


def register(session, phone: str, pin: str) -> tuple[UserRecord, str]:
    phone = normalize_phone(phone)
    if session.query(UserRecord).filter_by(phone_number=phone).first():
        raise HTTPException(status_code=409, detail="phone number is already registered")
    user = UserRecord(user_id=f"user-{uuid.uuid4().hex}", phone_number=phone, pin_hash=_hasher.hash(pin))
    session.add(user)
    session.flush()
    return user, _create_session(session, user.user_id)


def login(session, phone: str, pin: str) -> tuple[UserRecord, str]:
    phone = normalize_phone(phone)
    user = session.query(UserRecord).filter_by(phone_number=phone).first()
    now = datetime.now(timezone.utc)
    if not user or (user.locked_until and _aware(user.locked_until) > now):
        raise HTTPException(status_code=401, detail="invalid phone number or PIN")
    try:
        _hasher.verify(user.pin_hash, pin)
    except VerifyMismatchError:
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= get_settings().auth_max_login_attempts:
            user.locked_until = now + timedelta(minutes=get_settings().auth_lockout_minutes)
            user.failed_login_attempts = 0
        session.commit()
        raise HTTPException(status_code=401, detail="invalid phone number or PIN")
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login_at = now
    token = _create_session(session, user.user_id)
    session.commit()
    return user, token


def _create_session(session, user_id: str) -> str:
    raw = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw.encode()).hexdigest()
    session.add(AuthSession(token_hash=token_hash, user_id=user_id, expires_at=datetime.now(timezone.utc) + timedelta(hours=get_settings().auth_session_ttl_hours)))
    session.flush()
    return raw


def current_user(request: Request, session) -> UserRecord:
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bearer authentication is required")
    token_hash = hashlib.sha256(header[7:].strip().encode()).hexdigest()
    auth_session = session.query(AuthSession).filter_by(token_hash=token_hash).first()
    if not auth_session or _aware(auth_session.expires_at) <= datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="session is invalid or expired")
    user = session.query(UserRecord).filter_by(user_id=auth_session.user_id, is_active=True).first()
    if not user:
        raise HTTPException(status_code=401, detail="account is unavailable")
    return user


def logout(request: Request, session) -> None:
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return
    token_hash = hashlib.sha256(header[7:].strip().encode()).hexdigest()
    session.query(AuthSession).filter_by(token_hash=token_hash).delete()
    session.commit()


def change_pin(session, user: UserRecord, current_pin: str, new_pin: str) -> None:
    try:
        _hasher.verify(user.pin_hash, current_pin)
    except (VerifyMismatchError, VerificationError) as exc:
        raise HTTPException(status_code=401, detail="current PIN is invalid") from exc
    user.pin_hash = _hasher.hash(new_pin)
    session.commit()


def save_profile(session, user: UserRecord, payload: dict) -> ShopProfile:
    profile = session.query(ShopProfile).filter_by(user_id=user.user_id).first()
    if profile:
        profile.version += 1
        profile.profile_json = __import__("json").dumps(payload)
    else:
        profile = ShopProfile(profile_id=f"profile-{uuid.uuid4().hex}", user_id=user.user_id, profile_json=__import__("json").dumps(payload))
        session.add(profile)
    user.onboarding_complete = True
    session.commit()
    return profile


def _aware(value):
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value
