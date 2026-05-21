from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings

_IS_DEVELOPMENT = settings.ENVIRONMENT.strip().lower() == "development"

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=_IS_DEVELOPMENT,
)

AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    engine,
    expire_on_commit=False,
)
