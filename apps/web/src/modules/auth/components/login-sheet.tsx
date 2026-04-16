import { type TokenResponse, useGoogleLogin } from "@react-oauth/google";
import { useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLogin } from "@/modules/auth/queries/use-login";

interface LoginSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptContext?: string;
  onSuccess?: () => void;
}

export const LoginSheet = ({
  open,
  onOpenChange,
  promptContext,
  onSuccess,
}: LoginSheetProps) => {
  const login = useLogin();
  const hasError = login.isError;

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse: TokenResponse) => {
      try {
        await login.mutateAsync({
          access_token: tokenResponse.access_token,
        });
        onSuccess?.();
        onOpenChange(false);
      } catch (error: unknown) {
        console.error("Login failed:", error);
      }
    },
    onError: (error) => {
      console.error("Google login error:", error);
    },
    scope: "openid email profile",
    flow: "implicit",
  });

  const handleOpenChange = useCallback(
    (v: boolean) => {
      if (!v) {
        login.reset();
      }
      onOpenChange(v);
    },
    [login, onOpenChange]
  );

  const title = promptContext ?? "Welcome back";

  const subtitle =
    promptContext != null
      ? "Sign in to build your personal Quran journal — free forever."
      : "Sign in to your Qalbwise account.";

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="mx-auto max-w-sm">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <p
            className="text-[15px] leading-relaxed"
            style={{ color: "#777169", letterSpacing: "0.15px" }}
          >
            {subtitle}
          </p>
        </SheetHeader>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => googleLogin()}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-[15px] font-medium text-gray-700 transition-shadow hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-200"
            style={{ boxShadow: "var(--shadow-soft)" }}
          >
            <span className="flex items-center justify-center gap-2">
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                  fill="#4285F4"
                />
                <path
                  d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                  fill="#34A853"
                />
                <path
                  d="M4.964 10.71A5.41 5.41 0 0 1 4.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                  fill="#FBBC05"
                />
                <path
                  d="M9 3.618c1.355 0 2.578.464 3.545 1.375l2.868-2.867A8.97 8.97 0 0 0 9 0 8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.618 9 3.618z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </span>
          </button>

          {hasError && (
            <p
              className="mt-3 text-[13px]"
              style={{ color: "#dc2626", letterSpacing: "0.13px" }}
            >
              Sign-in failed. Please try again.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
