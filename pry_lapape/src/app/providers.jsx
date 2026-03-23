

"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import AuthProvider from "@/components/AuthProvider";

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || "";

export default function Providers({ children }) {
  const content = <AuthProvider>{children}</AuthProvider>;

  if (!GOOGLE_CLIENT_ID) {
    return content;
  }

  return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{content}</GoogleOAuthProvider>;
}
