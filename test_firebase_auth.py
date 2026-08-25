import json
import os
import urllib.error
import urllib.parse
import urllib.request

from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("FIREBASE_WEB_API_KEY")
EMAIL = os.getenv("FIREBASE_TEST_EMAIL")
PASSWORD = os.getenv("FIREBASE_TEST_PASSWORD")

if not API_KEY:
    raise RuntimeError("FIREBASE_WEB_API_KEY is missing from .env")

if not EMAIL:
    raise RuntimeError("FIREBASE_TEST_EMAIL is missing from .env")

if not PASSWORD:
    raise RuntimeError("FIREBASE_TEST_PASSWORD is missing from .env")

url = (
    "https://identitytoolkit.googleapis.com/v1/"
    "accounts:signInWithPassword?"
    + urllib.parse.urlencode({"key": API_KEY})
)

payload = {
    "email": EMAIL,
    "password": PASSWORD,
    "returnSecureToken": True,
}

request = urllib.request.Request(
    url,
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST",
)

try:
    with urllib.request.urlopen(request) as response:
        data = json.loads(response.read().decode("utf-8"))
        
        print("\nFirebase login successful!")
        print("Email:", data.get("email"))
        print("Local ID:", data.get("localId"))

        print("\nID Token:")
        print(data.get("idToken"))
    
except urllib.error.HTTPError as e:
    error_body = e.read().decode("utf-8")
    print("\nFirebase login failed:")
    print(error_body)

    