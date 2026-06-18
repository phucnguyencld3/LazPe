"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { ReactNode } from "react";

export default function GoogleProvider({ children }: { children: ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  
  if (!clientId) {
    console.warn("Google Client ID is missing. Google Login will not work.");
  }

  return (
    <GoogleOAuthProvider clientId={clientId || "missing-client-id"}>
      {children}
    </GoogleOAuthProvider>
  );
}
