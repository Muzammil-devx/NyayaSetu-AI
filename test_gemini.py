import os
from dotenv import load_dotenv
from google import genai

from backend.models.rights import RightsAnalysis


# Load .env file
load_dotenv()


# Create Gemini client
client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


# Models to test
MODELS = [
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-2.0-flash-lite-001",
    "gemini-flash-latest",
]


# ============================================================
# TEST 1: NORMAL TEXT GENERATION
# ============================================================

print("\n")
print("#" * 60)
print("TEST 1: NORMAL TEXT GENERATION")
print("#" * 60)


for model in MODELS:

    print("\n" + "=" * 60)
    print(f"Testing: {model}")
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


# ============================================================
# TEST 2: RIGHTS ANALYSIS WITH STRUCTURED OUTPUT
# ============================================================

print("\n\n")
print("#" * 60)
print("TEST 2: RIGHTS ANALYSIS WITH STRUCTURED OUTPUT")
print("#" * 60)


question = "My landlord is not returning my security deposit. What are my rights?"


for model in MODELS:

    print("\n" + "=" * 60)
    print(f"Testing RightsAnalysis: {model}")
    print("=" * 60)

    prompt = f"""
You are an Indian Legal Rights Assistant.

Answer the user's legal rights question in simple English.

User's Legal Rights Question:
{question}
"""

    try:

        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": RightsAnalysis,
            },
        )

        # Convert Gemini JSON response into RightsAnalysis model
        analysis = RightsAnalysis.model_validate_json(
            response.text
        )

        print("SUCCESS")

        print("\nQuestion:")
        print(analysis.question)

        print("\nAnswer:")
        print(analysis.answer)

        print("\nRights:")
        for right in analysis.rights:
            print("-", right)

        print("\nImportant Points:")
        for point in analysis.important_points:
            print("-", point)

        print("\nDisclaimer:")
        print(analysis.disclaimer)

    except Exception as e:

        print("FAILED")
        print("Error type:", type(e).__name__)
        print("Error:", e)


print("\n")
print("#" * 60)
print("ALL TESTS COMPLETED")
print("#" * 60)