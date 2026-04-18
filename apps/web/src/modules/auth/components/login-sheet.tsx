import { useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LoginSheetWithGoogle } from "@/modules/auth/components/login-sheet-with-google";

interface LoginSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptContext?: string;
  onSuccess?: () => void;
}

const hasGoogleClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

export const LoginSheet = (props: LoginSheetProps) => {
  if (hasGoogleClientId) {
    return <LoginSheetWithGoogle {...props} />;
  }
  return <LoginSheetDevPlaceholder {...props} />;
};

function LoginSheetDevPlaceholder({
  open,
  onOpenChange,
  promptContext,
}: LoginSheetProps) {
  const handleOpenChange = useCallback(
    (v: boolean) => {
      onOpenChange(v);
    },
    [onOpenChange]
  );

  const title = promptContext ?? "Welcome back";

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="mx-auto max-w-sm">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <p
            className="text-[15px] leading-relaxed"
            style={{ color: "#777169", letterSpacing: "0.15px" }}
          >
            Google Sign-In is not configured for this environment.
          </p>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          <p
            className="text-[14px] leading-relaxed"
            style={{ color: "#4e4e4e" }}
          >
            Add{" "}
            <code className="rounded bg-[#f5f5f5] px-1.5 py-0.5 text-[13px]">
              VITE_GOOGLE_CLIENT_ID
            </code>{" "}
            to{" "}
            <code className="rounded bg-[#f5f5f5] px-1.5 py-0.5 text-[13px]">
              apps/web/.env
            </code>{" "}
            (see{" "}
            <code className="rounded bg-[#f5f5f5] px-1.5 py-0.5 text-[13px]">
              .env.example
            </code>
            ), then restart the dev server.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
