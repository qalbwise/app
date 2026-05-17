import { type TokenResponse, useGoogleLogin } from "@react-oauth/google";
import { useCallback, useState } from "react";
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
import { QuranIcon } from "@/components/ui/svgs/quran";
import { api } from "@/lib/api";
import { useLogin } from "@/modules/auth/data/mutations";

interface LoginSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptContext?: string;
  onSuccess?: () => void;
}

const hasGoogleClientId = false; // temporarily disabled — re-enable by setting back to Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)
const hasQfClientId = Boolean(import.meta.env.VITE_QF_CLIENT_ID);

export function LoginDrawer(props: LoginSheetProps) {
  if (hasGoogleClientId || hasQfClientId) {
    return <LoginDrawerContent {...props} />;
  }
  return <LoginDrawerDevPlaceholder {...props} />;
}

function LoginDrawerContent({
  open,
  onOpenChange,
  promptContext,
  onSuccess,
}: LoginSheetProps) {
  const login = useLogin();
  const [qfLoading, setQfLoading] = useState(false);

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

  const handleQfLogin = useCallback(async () => {
    setQfLoading(true);
    try {
      const res = await api.auth.qfAuthorize();
      if (res.error || !res.data) {
        toast.error("Failed to initiate Quran Foundation login");
        setQfLoading(false);
        return;
      }
      window.location.href = res.data.auth_url;
    } catch {
      toast.error("Failed to initiate login");
      setQfLoading(false);
    }
  }, []);

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

  const hasError = login.isError;

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="bottom">
      <DrawerContent>
        <DrawerHeader className="mx-auto max-w-md text-pretty">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{subtitle}</DrawerDescription>
        </DrawerHeader>

        <DrawerFooter className="mx-auto w-full max-w-md">
          {hasGoogleClientId && (
            <Button variant="outline" size="lg" onClick={() => googleLogin()}>
              <Google />
              Continue with Google
            </Button>
          )}

          {hasQfClientId && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleQfLogin}
              disabled={qfLoading}
            >
              <QuranIcon className="size-5 shrink-0" />
              Continue with Quran Foundation
            </Button>
          )}

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
  const title = promptContext ?? "Sign-In Not Configured";

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>
            No sign-in methods are configured for this environment.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="flex-row">
          Add{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
            VITE_GOOGLE_CLIENT_ID
          </code>{" "}
          or{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
            VITE_QF_CLIENT_ID
          </code>{" "}
          to your{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">.env</code>{" "}
          file, then restart the dev server.
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
