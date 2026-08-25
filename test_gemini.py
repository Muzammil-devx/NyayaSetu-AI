import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

MODELS = [
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-2.0-flash-lite-001",
    "gemini-flash-latest",
]

for model in MODELS:
    print("\n" + "=" * 60)
    print(f"\nTesting: {model}")
    print("=" * 60)

    try:
        response = client.models.generate_content(
            model=model,
            contents="Say Hello in one short sentence."
        )

        print("SUCCESS")
        print(response.text)

    except Exception as e:
        print("FAILED")
        print("Error type:", type(e).__name__)
        print("Error:", e)

        