import { auth } from "../firebase/firebase";
import { apiUrl } from "./api";

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
    const response = await fetch(apiUrl("/api/chat"), {
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
        let errorMessage = "Failed to get legal rights response.";

        try {
            const errorData = await response.json();

            if (Array.isArray(errorData.detail)) {
                const validationError = errorData.detail.find(
                    (error) => error.type === "string_too_long"
                );

                if (validationError) {
                    errorMessage =
                        "Question is too long. Please keep your question within 1000 characters.";
                } else {
                    errorMessage =
                        "Invalid request. Please check your question and try again.";
                }
            } else if (typeof errorData.detail === "string") {
                errorMessage = errorData.detail;
            } else if (errorData.detail) {
                errorMessage =
                    "Invalid request. Please check your question and try again.";
            }
        } catch (error) {
            console.error("Failed to read error response:", error);
        }

        throw new Error(errorMessage);
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
    const response = await fetch(apiUrl("/api/chats"), {
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