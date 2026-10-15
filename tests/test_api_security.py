import importlib
import io
import json
import os
import sys
import tempfile
import types
import unittest
from contextlib import contextmanager
from contextlib import redirect_stdout
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
import urllib.error

from fastapi import FastAPI
from fastapi.testclient import TestClient
from firebase_admin import auth
from firebase_admin.exceptions import FirebaseError

import test_firebase_auth
import test_gemini


@contextmanager
def load_routes_with_service_stubs():
    fake_db = MagicMock()
    fake_ai = types.ModuleType("backend.services.ai_service")
    fake_ai.analyze_document = MagicMock()
    fake_ai.analyze_rights = MagicMock()
    fake_firebase = types.ModuleType("backend.services.firebase_service")
    fake_firebase.db = fake_db

    route_names = (
        "backend.api.rights",
        "backend.api.chat",
        "backend.api.documents",
    )
    replacements = {
        "backend.services.ai_service": fake_ai,
        "backend.services.firebase_service": fake_firebase,
    }

    original_backend_modules = {
        name: module
        for name, module in sys.modules.items()
        if name == "backend" or name.startswith("backend.")
    }
    original_package_namespaces = {
        name: (module, vars(module).copy())
        for name, module in original_backend_modules.items()
        if hasattr(module, "__path__")
    }

    try:
        for name in route_names:
            sys.modules.pop(name, None)
        sys.modules.update(replacements)

        rights = importlib.import_module("backend.api.rights")
        chat = importlib.import_module("backend.api.chat")
        documents = importlib.import_module("backend.api.documents")
        yield rights, chat, documents, fake_db, fake_ai
    finally:
        for name in tuple(sys.modules):
            if (
                (name == "backend" or name.startswith("backend."))
                and name not in original_backend_modules
            ):
                sys.modules.pop(name, None)
        sys.modules.update(original_backend_modules)
        for module, namespace in original_package_namespaces.values():
            module.__dict__.clear()
            module.__dict__.update(namespace)


class ApiSecurityTests(unittest.TestCase):
    def setUp(self):
        self.routes_context = load_routes_with_service_stubs()
        self.rights, self.chat, self.documents, self.fake_db, self.fake_ai = (
            self.routes_context.__enter__()
        )
        self.addCleanup(self.routes_context.__exit__, None, None, None)

        self.fake_db.collection = MagicMock(return_value=MagicMock())
        self.fake_ai.analyze_document.reset_mock()
        self.fake_ai.analyze_rights.reset_mock()
        self.analysis = {
            "question": "What are my rights?",
            "answer": "General information.",
            "rights": [],
        }
        self.document_analysis = {
            "document_type": "Agreement",
            "summary": "A short agreement.",
            "important_clauses": [],
            "rights": [],
            "obligations": [],
            "risks": [],
            "clause_risks": [],
            "completeness_check": [],
            "important_dates": [],
            "disclaimer": "Informational only.",
        }
        self.fake_ai.analyze_rights.return_value = SimpleNamespace(
            model_dump=lambda: self.analysis
        )
        self.fake_ai.analyze_document.return_value = SimpleNamespace(
            model_dump=lambda: self.document_analysis
        )

        verify_patch = patch.object(
            auth,
            "verify_id_token",
            return_value={"uid": "user-a"},
        )
        self.verify_token = verify_patch.start()
        self.addCleanup(verify_patch.stop)

        app = FastAPI()
        app.include_router(self.rights.router)
        app.include_router(self.chat.router)
        app.include_router(self.documents.router)
        self.client = TestClient(app, raise_server_exceptions=False)
        self.addCleanup(self.client.close)

    def test_route_loader_restores_module_cache_after_exit_and_import_failure(self):
        module_names = (
            "backend.api.rights",
            "backend.api.chat",
            "backend.api.documents",
            "backend.services.ai_service",
            "backend.services.firebase_service",
        )
        original_modules = {
            name: sys.modules.get(name)
            for name in module_names
        }

        with load_routes_with_service_stubs() as routes:
            for name, route in zip(module_names[:3], routes[:3]):
                self.assertIs(route, sys.modules[name])
                self.assertIsNot(route, original_modules[name])

        for name, module in original_modules.items():
            self.assertIs(sys.modules.get(name), module)

        with patch.object(importlib, "import_module", side_effect=RuntimeError):
            with self.assertRaises(RuntimeError):
                with load_routes_with_service_stubs():
                    self.fail("The failing import should not yield routes")

        for name, module in original_modules.items():
            self.assertIs(sys.modules.get(name), module)

    def test_firebase_smoke_script_never_prints_credentials_or_error_body(self):
        config = {
            "FIREBASE_WEB_API_KEY": "test-api-key-secret",
            "FIREBASE_TEST_EMAIL": "test-user@example.invalid",
            "FIREBASE_TEST_PASSWORD": "test-password-secret",
        }
        get_env = lambda name: config.get(name)
        success_response = MagicMock()
        success_response.__enter__.return_value.read.return_value = json.dumps(
            {
                "email": config["FIREBASE_TEST_EMAIL"],
                "localId": "test-user-id-secret",
                "idToken": "test-id-token-secret",
            }
        ).encode()
        success_output = io.StringIO()

        with (
            patch.object(test_firebase_auth, "load_dotenv"),
            patch.object(test_firebase_auth.os, "getenv", side_effect=get_env),
            patch.object(
                test_firebase_auth.urllib.request,
                "urlopen",
                return_value=success_response,
            ),
            redirect_stdout(success_output),
        ):
            self.assertEqual(test_firebase_auth.main(), 0)

        for secret in config.values():
            self.assertNotIn(secret, success_output.getvalue())
        self.assertNotIn("test-user-id-secret", success_output.getvalue())
        self.assertNotIn("test-id-token-secret", success_output.getvalue())

        error_body = b"sensitive response body"
        http_error = urllib.error.HTTPError(
            "https://example.invalid", 400, "Bad Request", None, io.BytesIO(error_body)
        )
        failure_output = io.StringIO()
        with (
            patch.object(test_firebase_auth, "load_dotenv"),
            patch.object(test_firebase_auth.os, "getenv", side_effect=get_env),
            patch.object(
                test_firebase_auth.urllib.request,
                "urlopen",
                side_effect=http_error,
            ),
            redirect_stdout(failure_output),
        ):
            self.assertEqual(test_firebase_auth.main(), 1)

        self.assertNotIn("sensitive response body", failure_output.getvalue())

    def test_smoke_script_imports_do_not_load_credentials_or_create_clients(self):
        output = io.StringIO()
        with (
            patch.object(test_firebase_auth, "load_dotenv") as firebase_env,
            patch.object(
                test_firebase_auth.urllib.request, "urlopen"
            ) as firebase_request,
            patch.object(test_gemini, "load_dotenv") as gemini_env,
            patch.object(test_gemini.genai, "Client") as gemini_client,
            redirect_stdout(output),
        ):
            importlib.reload(test_firebase_auth)
            importlib.reload(test_gemini)

        firebase_env.assert_not_called()
        firebase_request.assert_not_called()
        gemini_env.assert_not_called()
        gemini_client.assert_not_called()
        self.assertEqual(output.getvalue(), "")

    def test_gemini_smoke_returns_success_only_when_all_checks_pass(self):
        client = MagicMock()
        client.models.generate_content.return_value = SimpleNamespace(text="{}")
        output = io.StringIO()

        with (
            patch.object(test_gemini, "load_dotenv"),
            patch.object(test_gemini.genai, "Client", return_value=client),
            patch.object(
                test_gemini.RightsAnalysis,
                "model_validate_json",
                return_value=MagicMock(),
            ),
            redirect_stdout(output),
        ):
            result = test_gemini.main()

        self.assertEqual(result, 0)
        self.assertEqual(client.models.generate_content.call_count, 12)
        self.assertIn("All Gemini smoke checks passed.", output.getvalue())

    def test_gemini_smoke_failure_returns_nonzero_without_provider_details(self):
        client = MagicMock()
        client.models.generate_content.side_effect = RuntimeError(
            "provider-private-detail"
        )
        output = io.StringIO()

        with (
            patch.object(test_gemini, "load_dotenv"),
            patch.object(test_gemini.genai, "Client", return_value=client),
            redirect_stdout(output),
        ):
            result = test_gemini.main()

        self.assertEqual(result, 1)
        self.assertIn("One or more Gemini smoke checks failed.", output.getvalue())
        self.assertNotIn("provider-private-detail", output.getvalue())

    def test_gemini_client_initialization_failure_returns_nonzero_safely(self):
        output = io.StringIO()
        with (
            patch.object(test_gemini, "load_dotenv"),
            patch.object(
                test_gemini.genai,
                "Client",
                side_effect=RuntimeError("client-private-detail"),
            ),
            redirect_stdout(output),
        ):
            result = test_gemini.main()

        self.assertEqual(result, 1)
        self.assertIn("could not initialize", output.getvalue())
        self.assertNotIn("client-private-detail", output.getvalue())

    def protected_requests(self, headers):
        return [
            self.client.post(
                "/api/rights", json={"question": "q"}, headers=headers
            ),
            self.client.post(
                "/api/chat", json={"message": "q"}, headers=headers
            ),
            self.client.get("/api/chats", headers=headers),
            self.client.get("/api/documents", headers=headers),
            self.client.delete("/api/documents/doc-1", headers=headers),
        ]

    def test_protected_routes_reject_missing_and_invalid_tokens(self):
        malformed_headers = [
            {},
            {"Authorization": "Basic dummy-token"},
            {"Authorization": "Bearer"},
        ]
        for headers in malformed_headers:
            for response in self.protected_requests(headers):
                self.assertEqual(response.status_code, 401)
        self.verify_token.assert_not_called()

        self.verify_token.side_effect = auth.InvalidIdTokenError("not-a-token")
        headers = {"Authorization": "Bearer dummy-token"}
        for response in self.protected_requests(headers):
            self.assertEqual(response.status_code, 401)
            self.assertNotIn("not-a-token", response.text)

    def test_rights_rejects_firebase_authentication_exceptions(self):
        failures = [
            auth.InvalidIdTokenError("invalid-token"),
            auth.ExpiredIdTokenError("expired-token", None),
            auth.RevokedIdTokenError("revoked-token"),
            auth.UserDisabledError("disabled-user"),
            auth.UserNotFoundError("deleted-user"),
        ]

        for failure in failures:
            with self.subTest(exception=type(failure).__name__):
                self.verify_token.side_effect = failure
                response = self.client.post(
                    "/api/rights",
                    json={"question": "q"},
                    headers={"Authorization": "Bearer dummy-token"},
                )
                self.assertEqual(response.status_code, 401)
                self.assertEqual(
                    response.json()["detail"],
                    "Invalid or expired Firebase ID token",
                )
                self.assertNotIn(failure.args[0], response.text)

    def test_rights_maps_verification_infrastructure_failures_safely(self):
        cases = [
            (auth.CertificateFetchError("certificate-private", None), 503),
            (FirebaseError("INTERNAL", "firebase-private"), 500),
        ]

        for failure, expected_status in cases:
            with self.subTest(exception=type(failure).__name__):
                self.verify_token.side_effect = failure
                response = self.client.post(
                    "/api/rights",
                    json={"question": "q"},
                    headers={"Authorization": "Bearer dummy-token"},
                )
                self.assertEqual(response.status_code, expected_status)
                self.assertNotIn("private", response.text)

    def test_unexpected_verification_error_is_not_classified_as_auth_failure(self):
        self.verify_token.side_effect = RuntimeError("programming-private")
        response = self.client.post(
            "/api/rights",
            json={"question": "q"},
            headers={"Authorization": "Bearer dummy-token"},
        )

        self.assertEqual(response.status_code, 500)
        self.assertNotIn("programming-private", response.text)

    def test_rights_question_boundary_whitespace_and_success_shape(self):
        headers = {"Authorization": "Bearer dummy-token"}
        question = "q" * 1000
        response = self.client.post(
            "/api/rights", json={"question": question}, headers=headers
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "message": "Legal rights analyzed successfully",
                "question": self.analysis,
            },
        )
        self.fake_ai.analyze_rights.assert_called_once_with(question)
        self.verify_token.assert_called_with(
            "dummy-token", check_revoked=True
        )

        self.fake_ai.analyze_rights.reset_mock()
        oversized = self.client.post(
            "/api/rights", json={"question": "q" * 1001}, headers=headers
        )
        whitespace = self.client.post(
            "/api/rights", json={"question": "   "}, headers=headers
        )

        self.assertEqual(oversized.status_code, 422)
        self.assertEqual(whitespace.status_code, 400)
        self.fake_ai.analyze_rights.assert_not_called()

    def test_chat_success_saves_authenticated_owner(self):
        response = self.client.post(
            "/api/chat",
            json={"message": "What are my rights?"},
            headers={"Authorization": "Bearer dummy-token"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["uid"], "user-a")
        saved_record = (
            self.fake_db.collection.return_value.document.return_value.set.call_args.args[0]
        )
        self.assertEqual(saved_record["userId"], "user-a")

    def test_document_list_query_is_scoped_to_authenticated_owner(self):
        document = MagicMock()
        document.id = "doc-a"
        document.to_dict.return_value = {
            "userId": "user-a",
            "filename": "agreement.pdf",
            "analysis": {},
            "status": "analyzed",
        }
        self.fake_db.collection.return_value.where.return_value.stream.return_value = [
            document
        ]

        response = self.client.get(
            "/api/documents",
            headers={"Authorization": "Bearer dummy-token"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [item["id"] for item in response.json()["documents"]], ["doc-a"]
        )
        query_filter = self.fake_db.collection.return_value.where.call_args.kwargs["filter"]
        self.assertEqual(query_filter.field_path, "userId")
        self.assertEqual(query_filter.op_string, "==")
        self.assertEqual(query_filter.value, "user-a")

    def test_document_delete_hides_and_preserves_another_owners_record(self):
        document_ref = self.fake_db.collection.return_value.document.return_value
        snapshot = MagicMock()
        snapshot.exists = True
        snapshot.to_dict.return_value = {"userId": "user-b"}
        document_ref.get.return_value = snapshot

        response = self.client.delete(
            "/api/documents/doc-b",
            headers={"Authorization": "Bearer dummy-token"},
        )

        self.assertEqual(response.status_code, 404)
        document_ref.delete.assert_not_called()

    def test_document_owner_can_delete_saved_analysis_record(self):
        document_ref = self.fake_db.collection.return_value.document.return_value
        snapshot = MagicMock()
        snapshot.exists = True
        snapshot.to_dict.return_value = {"userId": "user-a"}
        document_ref.get.return_value = snapshot

        response = self.client.delete(
            "/api/documents/doc-a",
            headers={"Authorization": "Bearer dummy-token"},
        )

        self.assertEqual(response.status_code, 200)
        document_ref.delete.assert_called_once_with()

    def test_document_upload_saves_owner_analysis_and_cleans_pdf_on_success(self):
        with tempfile.TemporaryDirectory() as upload_dir:
            with (
                patch.object(self.documents, "UPLOAD_FOLDER", upload_dir),
                patch.object(
                    self.documents,
                    "extract_text_from_pdf",
                    return_value="Extracted contract text.",
                ) as extract_text,
            ):
                response = self.client.post(
                    "/api/documents/upload",
                    headers={"Authorization": "Bearer dummy-token"},
                    files={
                        "file": (
                            "agreement.pdf",
                            b"%PDF-1.7 test content",
                            "application/pdf",
                        )
                    },
                )
            files_after_request = os.listdir(upload_dir)

        self.assertEqual(response.status_code, 200, response.text)
        extract_text.assert_called_once()
        self.fake_ai.analyze_document.assert_called_once_with(
            "Extracted contract text."
        )
        saved_record = (
            self.fake_db.collection.return_value.document.return_value.set.call_args.args[0]
        )
        self.assertEqual(saved_record["userId"], "user-a")
        self.assertEqual(saved_record["filename"], "agreement.pdf")
        self.assertEqual(saved_record["analysis"], self.document_analysis)
        self.assertEqual(files_after_request, [])

    def test_invalid_uploads_are_rejected_and_temporary_files_are_cleaned(self):
        with tempfile.TemporaryDirectory() as upload_dir:
            with patch.object(self.documents, "UPLOAD_FOLDER", upload_dir):
                wrong_extension = self.client.post(
                    "/api/documents/upload",
                    headers={"Authorization": "Bearer dummy-token"},
                    files={
                        "file": ("agreement.txt", b"not a pdf", "text/plain")
                    },
                )
                invalid_signature = self.client.post(
                    "/api/documents/upload",
                    headers={"Authorization": "Bearer dummy-token"},
                    files={
                        "file": ("agreement.pdf", b"not a pdf", "application/pdf")
                    },
                )

            with (
                patch.object(self.documents, "UPLOAD_FOLDER", upload_dir),
                patch.object(self.documents, "MAX_FILE_SIZE", 5),
            ):
                oversized = self.client.post(
                    "/api/documents/upload",
                    headers={"Authorization": "Bearer dummy-token"},
                    files={
                        "file": (
                            "large.pdf",
                            b"%PDF-oversize",
                            "application/pdf",
                        )
                    },
                )

            self.assertEqual(os.listdir(upload_dir), [])

        self.assertEqual(wrong_extension.status_code, 400)
        self.assertEqual(invalid_signature.status_code, 400)
        self.assertEqual(oversized.status_code, 400)
        self.fake_ai.analyze_document.assert_not_called()

    def test_document_upload_cleans_pdf_after_analysis_failure(self):
        with tempfile.TemporaryDirectory() as upload_dir:
            with (
                patch.object(self.documents, "UPLOAD_FOLDER", upload_dir),
                patch.object(
                    self.documents,
                    "extract_text_from_pdf",
                    return_value="Extracted contract text.",
                ),
                patch.object(
                    self.documents,
                    "analyze_document",
                    side_effect=RuntimeError("simulated analysis failure"),
                ),
            ):
                response = self.client.post(
                    "/api/documents/upload",
                    headers={"Authorization": "Bearer dummy-token"},
                    files={
                        "file": (
                            "agreement.pdf",
                            b"%PDF-1.7 test content",
                            "application/pdf",
                        )
                    },
                )

            self.assertEqual(os.listdir(upload_dir), [])

        self.assertEqual(response.status_code, 500)
        self.assertEqual(
            response.json()["detail"],
            "Document processing failed. Please try again later.",
        )

    def test_document_upload_cleanup_failure_does_not_expose_exception_details(self):
        with tempfile.TemporaryDirectory() as upload_dir:
            with (
                patch.object(self.documents, "UPLOAD_FOLDER", upload_dir),
                patch.object(
                    self.documents,
                    "extract_text_from_pdf",
                    return_value="Extracted contract text.",
                ),
                patch.object(
                    self.documents.os,
                    "remove",
                    side_effect=OSError("cleanup-private-detail"),
                ) as remove_file,
            ):
                response = self.client.post(
                    "/api/documents/upload",
                    headers={"Authorization": "Bearer dummy-token"},
                    files={
                        "file": (
                            "agreement.pdf",
                            b"%PDF-1.7 test content",
                            "application/pdf",
                        )
                    },
                )
                remaining_files = os.listdir(upload_dir)

            remove_file.assert_called_once()
            self.assertEqual(len(remaining_files), 1)

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["message"], "PDF analyzed successfully")
        self.assertNotIn("cleanup-private-detail", response.text)

    def test_chat_history_query_is_scoped_to_authenticated_owner(self):
        chat = MagicMock()
        chat.id = "chat-a"
        chat.to_dict.return_value = {"userId": "user-a", "createdAt": None}
        self.fake_db.collection.return_value.where.return_value.stream.return_value = [chat]

        response = self.client.get(
            "/api/chats",
            headers={"Authorization": "Bearer dummy-token"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [item["id"] for item in response.json()["chats"]], ["chat-a"]
        )
        query_filter = self.fake_db.collection.return_value.where.call_args.kwargs["filter"]
        self.assertEqual(query_filter.field_path, "userId")
        self.assertEqual(query_filter.op_string, "==")
        self.assertEqual(query_filter.value, "user-a")


if __name__ == "__main__":
    unittest.main()
