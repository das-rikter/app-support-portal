"use client";

import { signIn } from "next-auth/react";

export function SignInButton() {
  return (
    <button
      onClick={() => signIn("microsoft-entra-id", { callbackUrl: "/" })}
      className="flex w-full items-center justify-center gap-3 rounded-md border px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{
        backgroundColor: "#0078D4",
        color: "#ffffff",
        borderColor: "#006CBE",
      }}
      aria-label="Sign in with Microsoft"
    >
      {/* Microsoft logo — hardcoded brand colours are authorised per design system */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 21 21"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect x="1" y="1" width="9" height="9" fill="#F35325" />
        <rect x="11" y="1" width="9" height="9" fill="#81BC06" />
        <rect x="1" y="11" width="9" height="9" fill="#05A6F0" />
        <rect x="11" y="11" width="9" height="9" fill="#FFBA08" />
      </svg>
      Sign in with Microsoft
    </button>
  );
}
