from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def home():
    return {"status": "OK", "message": "API is running"}

@app.post("/chat")
def chat(req: ChatRequest):
    # Dummy response dulu
    return {"reply": f"Backend berhasil! Pesan Anda: {req.message}"}