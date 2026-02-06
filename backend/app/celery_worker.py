from celery import Celery
import time
from app.config import settings

REDIS_URL = settings.redis_url

# Configure Celery to use Redis as the message broker
celery = Celery(
    "worker", 
    broker=REDIS_URL,
    backend=REDIS_URL, 
)

from app.tasks import ingestion_processing