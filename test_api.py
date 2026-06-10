import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

print(f"API Key exists: {api_key is not None}")
print(f"API Key length: {len(api_key) if api_key else 0}")
print(f"API Key prefix: {api_key[:10] if api_key else 'None'}")

if api_key:
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="Katakan 'Halo, API bekerja!'"
    )
    print("RESPONSE:", response.text)
else:
    print("API Key TIDAK DITEMUKAN!")