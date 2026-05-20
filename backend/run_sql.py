"""
Ejecuta un archivo SQL contra DATABASE_URL del .env.

Uso:
    cd backend && python run_sql.py reset_db.sql
"""

import asyncio
import sys
from pathlib import Path

import asyncpg
from dotenv import load_dotenv

load_dotenv()

from app.config import settings  # noqa: E402


def _to_asyncpg_dsn(url: str) -> str:
    """Convierte postgresql+asyncpg:// → postgresql://"""
    return url.replace("postgresql+asyncpg://", "postgresql://")


async def run(sql_file: Path) -> None:
    sql = sql_file.read_text()
    dsn = _to_asyncpg_dsn(str(settings.DATABASE_URL))

    conn = await asyncpg.connect(dsn, statement_cache_size=0)
    try:
        await conn.execute(sql)
        print(f"OK — {sql_file.name} ejecutado correctamente.")
    finally:
        await conn.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python run_sql.py <archivo.sql>")
        sys.exit(1)

    path = Path(sys.argv[1])
    if not path.exists():
        print(f"Archivo no encontrado: {path}")
        sys.exit(1)

    asyncio.run(run(path))
