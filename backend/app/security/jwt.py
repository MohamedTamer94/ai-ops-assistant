from jose import jwt
from jose.exceptions import JWTError
from datetime import datetime, timedelta
from typing import Optional
from app.config import settings

ACCESS_TOKEN_EXPIRE_MINUTES = 30
JWT_ALGORITHM = "HS256"

def create_access_token(user_id: str, expires_delta: Optional[timedelta] = None):
    payload = {
        "sub": user_id
    }
    expires = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    payload.update({"exp": expires})
    token = jwt.encode(payload, settings.jwt_secret, algorithm=JWT_ALGORITHM)
    return token

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None