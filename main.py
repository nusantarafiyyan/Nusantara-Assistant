from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import os

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
    return {"status": "OK", "message": "Nusantara Assistant API is running"}

@app.post("/chat")
def chat(req: ChatRequest):
    try:
        api_key = os.environ.get("GROQ_API_KEY")
        
        if not api_key:
            return {"reply": "Error: GROQ_API_KEY tidak ditemukan. Silakan cek environment variable."}
        
        client = Groq(api_key=api_key)
        
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "user", "content": req.message}
            ],
            temperature=0.7,
            max_tokens=1024,
        )
        
        reply = completion.choices[0].message.content
        return {"reply": reply}
        
    except Exception as e:
        return {"reply": f"Error: {str(e)}"}
