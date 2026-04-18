"""
Ismert, nem a projekthez tartozó HTTP próbálkozások korai elutasítása (botok / sebezhetőség-szkennerek).

A frontend Vite + React; a Next.js-hez (``/_next``, RSC) és hasonló pathok POST-jai nem lehetnek érvényes kérések.
A normál REST API útvonalak (``/api/majors``, ``/api/users/...`` stb.) **nem** esnek a tiltás alá, mert hosszabb elérési utak.

**Szabályok:**
- ``_BAD_PREFIXES``: 404, ha az útvonal ezekkel kezdődik (prefix egyezés).
- ``_EXACT_PATHS`` + író HTTP metódus: 404 a gyökérre, ``/api``, ``/app`` stb. irányuló zajos kérésekre.
"""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


_BAD_PREFIXES = (
    "/_next",
    "/api/route",
    "/api/action",
    "/api/graphql",
)
_EXACT_BODY_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})
_EXACT_PATHS = frozenset({"/", "/api", "/api/", "/app", "/app/"})


class ProbeBlockMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        for prefix in _BAD_PREFIXES:
            if path == prefix or path.startswith(prefix + "/"):
                return Response(status_code=404, media_type="text/plain", content="Not Found")
        m = request.method.upper()
        if m in _EXACT_BODY_METHODS and path in _EXACT_PATHS:
            return Response(status_code=404, media_type="text/plain", content="Not Found")
        return await call_next(request)