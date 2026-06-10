from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import os
from dotenv import load_dotenv

# Load API key
load_dotenv()
api_key = os.getenv("GROQ_API_KEY")

# Inisialisasi Groq client
client = Groq(api_key=api_key)

app = FastAPI()

# CORS
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
        # Panggil Groq API dengan model llama-3.3-70b-versatile (gratis & cepat)
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "user", "content": request.message}
            ],
            temperature=0.7,
            max_tokens=1024,
        )
        
        reply = completion.choices[0].message.content
        return {"reply": reply}
        
    except Exception as e:
        print(f"Error: {e}")
        return {"reply": f"Maaf, terjadi kesalahan. Error: {str(e)}"}