from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.chat import router as chat_router
from backend.api.documents import router as documents_router
from backend.api.rights import router as rights_router
from backend.api.auth import router as auth_router

app = FastAPI(
    title="NyayaSetu AI",
    description="Smart Legal Documents & Rights Assistant",
    version="1.0.0"
)

# Allow React frontend to communicate with FastAPI backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(documents_router)
app.include_router(rights_router)
app.include_router(auth_router)

@app.get("/")
def home():
    return {"message": "Welcome to NyayaSetu AI"}

@app.get("/health")
def health():
    return {"status": "Server is running successfully"}

