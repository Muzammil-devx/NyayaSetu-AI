import os

from dotenv import load_dotenv
from google import genai

from backend.models.rights import RightsAnalysis


MODELS = (
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-2.0-flash-lite-001",
    "gemini-flash-latest",
)

QUESTION = "My landlord is not returning my security deposit. What are my rights?"


def main():
    try:
        load_dotenv()
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    except Exception:
        print("Gemini smoke test could not initialize the client.")
        return 1

    all_passed = True
    for model in MODELS:
        print(f"Testing {model}: normal text generation")
        try:
            client.models.generate_content(
                model=model,
                contents="Say Hello in one short sentence.",
            )
            print(f"PASS {model}: normal text generation")
        except Exception:
            all_passed = False
            print(f"FAIL {model}: normal text generation")

    prompt = f"""
You are an Indian Legal Rights Assistant.

Answer the user's legal rights question in simple English.

User's Legal Rights Question:
{QUESTION}
"""

    for model in MODELS:
        print(f"Testing {model}: structured rights analysis")
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": RightsAnalysis,
                },
            )
            RightsAnalysis.model_validate_json(response.text)
            print(f"PASS {model}: structured rights analysis")
        except Exception:
            all_passed = False
            print(f"FAIL {model}: structured rights analysis")

    if all_passed:
        print("All Gemini smoke checks passed.")
        return 0

    print("One or more Gemini smoke checks failed.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
