

"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import AuthProvider from "@/components/AuthProvider";

// 👇 Pega aquí tu Client ID EXACTO desde Google Cloud
const GOOGLE_CLIENT_ID =
  "678280118186-sgo2bb9vjj23hdppc90vaa01r4qmpq9g.apps.googleusercontent.com";

export default function Providers({ children }) {
  console.log("GOOGLE CLIENT ID FRONT:", GOOGLE_CLIENT_ID);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>{children}</AuthProvider>
    </GoogleOAuthProvider>
  );
}
