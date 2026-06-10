from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import os

# Ambil API key dari environment variable
api_key = os.environ.get("GROQ_API_KEY")

print(f"API Key loaded: {'Yes' if api_key else 'No'}")  # Debug di log Railway

if not api_key:
    raise ValueError("GROQ_API_KEY tidak ditemukan di environment variable")

client = Groq(api_key=api_key)

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
def root():
    return {"status": "OK", "message": "Nusantara Assistant with Groq is running!"}

@app.post("/chat")
def chat(request: ChatRequest):
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": request.message}],
            temperature=0.7,
            max_tokens=1024,
        )
        reply = completion.choices[0].message.content
        return {"reply": reply}
    except Exception as e:
        print(f"Error: {e}")
        return {"reply": f"Maaf, terjadi kesalahan. Error: {str(e)}"}