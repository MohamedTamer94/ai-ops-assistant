"""Rate limiting utilities for the API."""
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from functools import lru_cache

# Create limiter instance using IP-based key function
limiter = Limiter(key_func=get_remote_address)


@lru_cache(maxsize=1)
def get_rate_limit_config():
    """Get rate limit configuration."""
    return {
        "default": "100/minute",
        "auth_login": "10/minute",
        "auth_register": "5/minute",
        "ingestions": "30/minute",
        "analyses": "20/minute",
    }


def get_rate_limit(endpoint_type: str = "default") -> str:
    """Get rate limit for specific endpoint type."""
    config = get_rate_limit_config()
    return config.get(endpoint_type, config["default"])
