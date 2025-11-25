from contextlib import asynccontextmanager
from typing import AsyncGenerator, Annotated
from pathlib import Path

from fastapi import FastAPI, Body, status, HTTPException, Depends
from fastapi.responses import RedirectResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from sqlalchemy.ext.asyncio import AsyncSession

from src.database.db import engine, new_session
from src.database.models import Base
from src.service import generate_short_url, get_url_by_slug
from src.exceptions import NoLongUrlFoundError, SlugAlreadyExistsError

BASE_DIR = Path(__file__).resolve().parent.parent  

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.mount("/static", StaticFiles(directory=BASE_DIR / "frontend" / "static"), name="static")

@app.get("/")
async def root():
    return FileResponse(BASE_DIR / "frontend" / "index.html")

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with new_session() as session:
        yield session

@app.post("/short_url")
async def generate_slug(
    session: Annotated[AsyncSession, Depends(get_session)],
    long_url: Annotated[str, Body(embed=True)]
):
    try:
        new_slug = await generate_short_url(long_url, session)
    except SlugAlreadyExistsError:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Не удалось сгенерировать ссылку")
    return {"data": new_slug}

@app.get("/{slug}")
async def redirect(
    slug: str,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    try:
        long_url = await get_url_by_slug(slug, session)
    except NoLongUrlFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ссылка не существует")
    return RedirectResponse(url=long_url, status_code=status.HTTP_302_FOUND)
