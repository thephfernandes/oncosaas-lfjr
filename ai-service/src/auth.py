"""
Autenticação do ai-service via BACKEND_SERVICE_TOKEN.

Todos os endpoints (exceto /health e /) requerem o header:
    Authorization: Bearer <BACKEND_SERVICE_TOKEN>

O token é comparado via secrets.compare_digest (tempo constante)
para evitar timing attacks.
"""

import logging
import os
import secrets

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

logger = logging.getLogger(__name__)

_bearer = HTTPBearer(auto_error=False)


def _get_service_token() -> str:
    """Lê o token a cada chamada para suportar rotação sem restart."""
    return os.getenv("BACKEND_SERVICE_TOKEN", "").strip()


def require_service_token(
    credentials: HTTPAuthorizationCredentials | None = Security(_bearer),
) -> None:
    """
    Dependency FastAPI: valida o BACKEND_SERVICE_TOKEN.

    Uso:
        @router.post("/rota", dependencies=[Depends(require_service_token)])
    """
    expected = _get_service_token()

    if not expected:
        # Token não configurado → bloquear em produção, avisar em dev
        env = os.getenv("ENVIRONMENT", os.getenv("NODE_ENV", "development"))
        if env == "production":
            logger.error(
                "BACKEND_SERVICE_TOKEN não configurado em produção. Bloqueando requisição."
            )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Service token not configured",
            )
        logger.warning(
            "BACKEND_SERVICE_TOKEN não configurado. "
            "Endpoint acessível sem autenticação (apenas em desenvolvimento)."
        )
        return

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header obrigatório",
            headers={"WWW-Authenticate": "Bearer"},
        )

    provided = credentials.credentials.strip()
    if not secrets.compare_digest(provided.encode(), expected.encode()):
        logger.warning("Tentativa de acesso com token inválido ao ai-service")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token inválido",
        )
