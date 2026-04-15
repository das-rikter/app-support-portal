import { SignInButton } from "@/components/auth/SignInButton";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-shuttle-gray-900 px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <img
            src="/das-logo.png"
            alt="DAS Technology"
          />
        </div>

        {/* Sign-in card */}
        <div className="rounded-xl border border-border bg-card p-8 shadow-xs space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              App Support Portal
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in with your Microsoft account to continue.
            </p>
          </div>
          <SignInButton />
        </div>
      </div>
    </div>
  );
}
