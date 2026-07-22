from fastapi import FastAPI

app = FastAPI(
    title="NyayaSetu AI",
    description="Smart Legal Documents & Rights Assistant",
    version="1.0.0"
)

@app.get("/")
def home():
    return {
        "message": "Welcome to NyayaSetu AI"
    }

@app.get("/health")
def health():
    return {
        "status": "Server is running successfully"
    }