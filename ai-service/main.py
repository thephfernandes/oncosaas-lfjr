import json
import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from src.api.routes import router
"""
AI Service - Plataforma Oncológica
Serviço de IA para priorização de casos e agente conversacional
"""


# Load environment variables early, before importing modules that may read os.getenv.
# Priority order:
# 1) Project root .env (../.env) for shared local dev config
# 2) ai-service/.env for service-specific overrides
BASE_DIR = Path(__file__).resolve().parent
ROOT_ENV_PATH = BASE_DIR.parent / ".env"
LOCAL_ENV_PATH = BASE_DIR / ".env"

if ROOT_ENV_PATH.exists():
    load_dotenv(ROOT_ENV_PATH, override=True)
if LOCAL_ENV_PATH.exists():
    load_dotenv(LOCAL_ENV_PATH, override=True)

class _JsonFormatter(logging.Formatter):
    """Emit log records as single-line JSON for structured log ingestion."""
    def format(self, record: logging.LogRecord) -> str:
        return json.dumps({
            "time": self.formatTime(record, "%Y-%m-%dT%H:%M:%S"),
            "level": record.levelname,
            "name": record.name,
            "message": record.getMessage(),
        })

_handler = logging.StreamHandler()
_handler.setFormatter(_JsonFormatter())
logging.basicConfig(level=logging.INFO, handlers=[_handler])
logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    google_cloud_project_id: str = ""
    backend_url: str = "http://localhost:3002"
    cors_origins: str = "http://localhost:3000,http://localhost:3002"

    class Config:
        env_file = ".env"


settings = Settings()

if not settings.openai_api_key and not settings.anthropic_api_key:
    logger.warning(
        "No LLM API key configured (OPENAI_API_KEY or ANTHROPIC_API_KEY). "
        "Agent will use fallback mock responses. Set at least one key for production."
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("[AI Service] Starting...")

    # Load priority model inside lifespan to avoid blocking the import phase
    try:
        from src.models.train_priority import load_or_train
        load_or_train()
        from src.models.priority_model import priority_model
        logger.info("Priority model loaded: is_trained=%s", priority_model.is_trained)
    except Exception as e:
        logger.warning("Priority model initialization deferred: %s", e, exc_info=True)

    try:
        from src.agent.rag import knowledge_rag
        knowledge_rag.initialize()
    except Exception as e:
        logger.warning("RAG initialization deferred: %s", e, exc_info=True)

    yield
    # Shutdown
    logger.info("[AI Service] Shutting down...")

app = FastAPI(
    title="ONCONAV AI Service",
    description="Serviço de IA para priorização e agente conversacional",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — configure CORS_ORIGINS env var for production (comma-separated list)
_cors_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rotas
app.include_router(router, prefix="/api/v1", tags=["ai"])

@app.get("/")
async def root():
    return {"message": "ONCONAV AI Service"}

@app.get("/health")
async def health():
    from src.models.priority_model import priority_model
    return {
        "status": "ok",
        "service": "onconav-ai-service",
        "model_trained": priority_model.is_trained,
        "llm_configured": bool(settings.openai_api_key or settings.anthropic_api_key),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

