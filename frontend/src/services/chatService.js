import { auth } from "../firebase/firebase";

// Backend API URL
const API_URL = "http://127.0.0.1:8000";

// Ask Legal Rights Question
export const askLegalQuestion = async (message) => {

    // Check if Firebase user is Logged in
    const user = auth.currentUser;

    if (!user) {
        throw new Error("Please login to use the legal rights assistant.");
    }

    // Get fresh Firebase ID Token
    const idToken = await user.getIdToken();

    // Send question to FastAPI
    const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
            message: message,
        }),
    });

    // Check backend response
    if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
            errorData.detail || "Failed to get legal rights response."
        );
    }

    // Return AI response
    return await response.json();
};


// Get Chat History
export const getChatHistory = async () => {

    // Check if Firebase user is Logged in
    const user = auth.currentUser;

    if (!user) {
        throw new Error("Please login to view chat history.");
    }

    // Get fresh Firebase ID Token
    const idToken = await user.getIdToken();

    // Request chat history from FastAPI
    const response = await fetch(`${API_URL}/api/chats`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${idToken}`,
        },
    });

    // Check backend response
    if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
            errorData.detail || "Failed to fetch chat history."
        );
    }

    // Return chat history
    const data = await response.json();

    return data.chats;
};