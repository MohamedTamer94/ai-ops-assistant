import time
import redis
from fastapi import HTTPException, status
from app.config import settings

r = redis.Redis.from_url(settings.redis_url, decode_responses=True)

def user_minute_bucket():
    return int(time.time() // 60)

def enforce_user_limit(user_id: str, limit: int = 2, prefix: str = "rl:insights"):
    bucket = user_minute_bucket()
    key = f"{prefix}:{user_id}:{bucket}"
    count = r.incr(key)
    if count == 1:
        r.expire(key, 70)  # little buffer
    if count > limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded ({limit}/minute)"
        )
