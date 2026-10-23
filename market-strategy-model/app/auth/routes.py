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
