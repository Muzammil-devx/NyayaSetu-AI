import {auth } from "../firebase/firebase";

// Backend API URL
const API_URL = "http://127.0.0.1:8000";

// Upload and analyze PDF
export const uploadDocument = async (file) => {
    //Check Firebase Login
    const user = auth.currentUser;

    if (!user) {
        throw new Error("Please login before uploading a document.");
    }

    // Get fresh Firebase ID token
    const idToken = await user.getIdToken();

    // Create FormData for PDF upload
    const formData = new FormData();
    formData.append("file", file);

    // Send PDF to FastAPI
    const response = await fetch(
        `${API_URL}/api/documents/upload`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${idToken}`,
            },
            body: formData,
        }
    );

    // Handle backend errors
    if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
            errorData.detail || "Failed to upload document."
        );
    }

    // Return AI analysis response
    return await response.json();
};

// Get documents of the logged-in user
export const getUserDocuments = async () => {
    // Check Firebase Login
    const user = auth.currentUser;

    if (!user) {
        throw new Error("Please login before fetching documents.");
    }

    // Get fresh Firebase ID token
    const idToken = await user.getIdToken();

    // Request user's documents from FastAPI
    const response = await fetch(
        `${API_URL}/api/documents`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${idToken}`,
            },
        }
    );

    // Handle backend errors
    if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
            errorData.detail || "Failing to fetch documents."
        );
    }

    // Return documents
    return await response.json();
};