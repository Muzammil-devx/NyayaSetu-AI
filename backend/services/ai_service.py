import os
from dotenv import load_dotenv
from google import genai

# Load .env file
load_dotenv()

# Read API key and Model name from .env file
API_KEY = os.getenv("GEMINI_API_KEY")
MODEL=os.getenv("GEMINI_MODEL", "models/gemini-flash-latest")  # Default to a specific model if not set model at .env file

# Create a Gemini client
client = genai.Client(api_key=API_KEY)

def ask_gemini(prompt: str) -> str:
    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt
        )
        return response.text
    
    except Exception as e:
        return f"Gemini API Error: {str(e)}"

        