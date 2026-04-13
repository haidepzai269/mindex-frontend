"use client";

import React, { Suspense } from "react";
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';
import GlobalLoadingOverlay from "@/components/ui/GlobalLoadingOverlay";

import { GoogleOAuthProvider } from "@react-oauth/google";

export function Providers({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Suspense fallback={null}>
        <ProgressBar
          height="2px"
          color="#ffffff"
          options={{ showSpinner: false }}
          shallowRouting
        />
      </Suspense>
      <GlobalLoadingOverlay />
      {children}
    </GoogleOAuthProvider>
  );
}
