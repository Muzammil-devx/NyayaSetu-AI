import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { auth } from "../firebase/firebase";


// Backend API URL
const API_URL = "http://127.0.0.1:8000";


// Signup
export const signupUser = async (email, password, name) => {
  // 1. Create Firebase account
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = userCredential.user;

  // 2. Get Firebase ID Token
  const idToken = await user.getIdToken();

  // 3. Send profile to FastAPI backend
  const response = await fetch(`${API_URL}/api/auth/profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      name: name,
      role: "user",
    }),
  });

  // 4. Check backend response
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.detail || "Failed to create user profile"
    );
  }

  const profile = await response.json();

  return {
    user,
    profile,
  };
};


// Login
export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  return userCredential.user;
};


// Logout
export const logoutUser = async () => {
  await signOut(auth);
};

// Get current user's profile from FastAPI
export const getCurrentUserProfile = async () => {
  const user = auth.currentUser;

  // No Firebase user is currently Logged in
  if (!user) {
    throw new Error("No user is currently logged in.");
  }

  // Get fresh Firebase ID token
  const idToken = await user.getIdToken();

  // Request profile from FastAPI
  const response = await fetch(`${API_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  // Check backend response
  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(
      errorData.detail || "Failed to fetch user profile"
    );
  }

  return await response.json();
};