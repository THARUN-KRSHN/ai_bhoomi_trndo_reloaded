from datetime import datetime, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.auth.service import _hasher, current_user, login, register
from app.db.database import Base
from app.db.models import AuthSession, UserRecord


@pytest.fixture
def session(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'auth.db'}")
    Base.metadata.create_all(engine)
    with sessionmaker(bind=engine)() as db:
        yield db


def test_pin_is_argon2_hashed_and_login_returns_opaque_session(session):
    user, token = register(session, "+91 98765 43210", "123456")
    session.commit()
    assert user.pin_hash != "123456"
    assert user.pin_hash.startswith("$argon2")
    logged_in, login_token = login(session, "+919876543210", "123456")
    assert logged_in.user_id == user.user_id
    assert login_token != user.pin_hash
    assert session.query(AuthSession).count() == 2


def test_invalid_pin_is_rejected(session):
    register(session, "+919876543210", "123456")
    session.commit()
    with pytest.raises(Exception) as error:
        login(session, "+919876543210", "999999")
    assert getattr(error.value, "status_code", None) == 401
