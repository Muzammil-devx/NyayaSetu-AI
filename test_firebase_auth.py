import json
import os
import urllib.error
import urllib.parse
import urllib.request

from dotenv import load_dotenv

def main():
    load_dotenv()

    api_key = os.getenv("FIREBASE_WEB_API_KEY")
    email = os.getenv("FIREBASE_TEST_EMAIL")
    password = os.getenv("FIREBASE_TEST_PASSWORD")

    missing_values = [
        name
        for name, value in (
            ("FIREBASE_WEB_API_KEY", api_key),
            ("FIREBASE_TEST_EMAIL", email),
            ("FIREBASE_TEST_PASSWORD", password),
        )
        if not value
    ]
    if missing_values:
        raise RuntimeError(
            "Missing required Firebase smoke-test configuration: "
            + ", ".join(missing_values)
        )

    url = (
        "https://identitytoolkit.googleapis.com/v1/"
        "accounts:signInWithPassword?"
        + urllib.parse.urlencode({"key": api_key})
    )
    payload = {
        "email": email,
        "password": password,
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
            if not data.get("idToken"):
                print("Firebase login failed: response did not contain an ID token.")
                return 1

        print("Firebase login successful.")
        return 0
    except urllib.error.HTTPError as error:
        error.close()
        print(f"Firebase login failed (HTTP {error.code}).")
        return 1
    except urllib.error.URLError:
        print("Firebase login failed due to a connection error.")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

    