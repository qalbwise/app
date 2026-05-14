import { type TokenResponse, useGoogleLogin } from "@react-oauth/google";
import { useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Google } from "@/components/ui/svgs/google";
import { useLogin } from "@/modules/auth/data/mutations";

interface LoginSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptContext?: string;
  onSuccess?: () => void;
}

const hasGoogleClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

export function LoginDrawer(props: LoginSheetProps) {
  if (hasGoogleClientId) {
    return <LoginDrawerGoogle {...props} />;
  }
  return <LoginDrawerDevPlaceholder {...props} />;
}

/** Renders under `GoogleOAuthProvider` when `VITE_GOOGLE_CLIENT_ID` is set. */
function LoginDrawerGoogle({
  open,
  onOpenChange,
  promptContext,
  onSuccess,
}: LoginSheetProps) {
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
        if (error instanceof Error) {
          toast.error(`Login failed: ${error.message}`);
        }
      }
    },
    onError: () => {
      toast.error("Google login error");
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

  const title = promptContext ?? "Get started with Qalbwise";

  const subtitle =
    promptContext != null
      ? "Sign in to continue save your favorite Quranic verses and stories. Free forever."
      : "Sign in to your Qalbwise account, so you can save your favorite Quranic verses and stories.";

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="bottom">
      <DrawerContent>
        <DrawerHeader className="mx-auto max-w-md text-pretty">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{subtitle}</DrawerDescription>
        </DrawerHeader>

        <DrawerFooter className="mx-auto w-full max-w-md">
          <Button variant="outline" size="lg" onClick={() => googleLogin()}>
            <Google />
            Continue with Google
          </Button>
          {hasError && (
            <p className="text-center text-destructive">
              Sign-in failed. Please try again.
            </p>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function LoginDrawerDevPlaceholder({
  open,
  onOpenChange,
  promptContext,
}: LoginSheetProps) {
  const title = promptContext ?? "Google Sign-In Not Configured";

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>
            Google Sign-In is not configured for this environment.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="flex-row">
          Add{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
            VITE_GOOGLE_CLIENT_ID
          </code>{" "}
          to{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
            apps/web/.env
          </code>{" "}
          (see{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
            .env.example
          </code>
          ), then restart the dev server.
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
