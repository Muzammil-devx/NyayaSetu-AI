import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

MODELS = [
    "models/gemini-2.0-flash-lite-001",
    "models/gemini-flash-latest",
    "models/gemini-3.5-flash-lite",
]

for model in MODELS:
    print(f"\nTesting: {model}")

    try:
        response = client.models.generate_content(
            model=model,
            contents="Say Hello"
        )

        print("SUCCESS")
        print(response.text)

    except Exception as e:
        print("FAILED")
        print(type(e).__name__)
        print(e)

        