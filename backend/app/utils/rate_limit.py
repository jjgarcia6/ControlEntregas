from collections import defaultdict
from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import DefaultDict

from app.utils.exceptions import LimiteSolicitudes


class _SlidingWindow:
    """Thread-safe sliding-window counter keyed by arbitrary strings."""

    def __init__(self, max_calls: int, window_seconds: int, message: str) -> None:
        self._max = max_calls
        self._window = timedelta(seconds=window_seconds)
        self._message = message
        self._calls: DefaultDict[str, list[datetime]] = defaultdict(list)
        self._lock = Lock()

    def _prune(self, key: str, now: datetime) -> list[datetime]:
        recent = [t for t in self._calls[key] if now - t < self._window]
        self._calls[key] = recent
        return recent

    def check_and_record(self, key: str) -> None:
        """Record a call; raise LimiteSolicitudes if the limit is exceeded."""
        now = datetime.now(timezone.utc)
        with self._lock:
            recent = self._prune(key, now)
            if len(recent) >= self._max:
                raise LimiteSolicitudes(self._message)
            self._calls[key].append(now)

    def record_failure(self, key: str) -> None:
        """Count only failures (used for email-based tracking)."""
        now = datetime.now(timezone.utc)
        with self._lock:
            self._prune(key, now)
            self._calls[key].append(now)

    def is_blocked(self, key: str) -> bool:
        now = datetime.now(timezone.utc)
        with self._lock:
            return len(self._prune(key, now)) >= self._max

    def reset(self, key: str) -> None:
        with self._lock:
            self._calls.pop(key, None)

    def clear_all(self) -> None:
        with self._lock:
            self._calls.clear()


# 10 intentos por minuto por IP (ataques de spray / automatizados)
ip_login_limiter = _SlidingWindow(
    max_calls=10,
    window_seconds=60,
    message="Demasiados intentos de inicio de sesión. Intente de nuevo en un minuto.",
)

# 5 fallos por 15 minutos por email (fuerza bruta dirigida)
email_failure_tracker = _SlidingWindow(
    max_calls=5,
    window_seconds=900,
    message="Cuenta temporalmente bloqueada por múltiples intentos fallidos. Intente de nuevo en 15 minutos.",
)
