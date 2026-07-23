from fastapi import FastAPI
from backend.api.chat import router as chat_router

app = FastAPI(
    title="NyayaSetu AI",
    description="Smart Legal Documents & Rights Assistant",
    version="1.0.0"
)

app.include_router(chat_router)

@app.get("/")
def home():
    return {"message": "Welcome to NyayaSetu AI"}

@app.get("/health")
def health():
    return {"status": "Server is running successfully"}