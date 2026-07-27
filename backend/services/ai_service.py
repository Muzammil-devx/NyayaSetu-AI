import os
from dotenv import load_dotenv
from google import genai
from backend.prompts.system_prompt import SYSTEM_PROMPT
from backend.prompts.document_prompt import LEGAL_DOCUMENT_PROMPT


# Load .env file
load_dotenv()

# Read API key and Model name from .env file
API_KEY = os.getenv("GEMINI_API_KEY")
MODEL=os.getenv("GEMINI_MODEL", "models/gemini-flash-latest")  # Default to a specific model if not set model at .env file

# Create a Gemini client
client = genai.Client(api_key=API_KEY)

def ask_gemini(prompt: str) -> str:

    full_prompt = f"""
    {SYSTEM_PROMPT}

    User Question:
    {prompt}
    """
    
    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=full_prompt
        )
        return response.text
    
    except Exception as e:
        return f"Gemini API Error: {str(e)}"

def analyze_document(document_text: str) -> str:

    full_prompt = f"""
    {LEGAL_DOCUMENT_PROMPT}

    Legal Document:
    {document_text}
    """

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=full_prompt,
        )
        return response.text

    except Exception as e:
        return f"Gemini API Error: {str(e)}"

