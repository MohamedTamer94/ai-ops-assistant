from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1.api import api_router
from app.config import settings
from app.security.rate_limit import limiter
from app.security.headers import SecurityHeadersMiddleware, RequestTimeoutMiddleware

app = FastAPI(title="AI-Ops Assistant", version="0.1.0")

# Apply rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add security middleware stack

# 1. Security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# 3. Request timeout tracking middleware
app.add_middleware(RequestTimeoutMiddleware, timeout_seconds=settings.request_timeout_seconds)

# 4. CORS middleware - should be last
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
@limiter.limit("60/minute")
async def health_check(request: Request):
    return {"status": "ok", "version": "0.1.0"}
