import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLogin } from "@/modules/auth/queries/use-login";
import { useRegister } from "@/modules/auth/queries/use-register";

interface LoginSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Headline copy when triggering from a "save verse" context */
  promptContext?: string;
  /** Which tab to open first */
  initialMode?: "signin" | "register";
  onSuccess?: () => void;
}

export const LoginSheet = ({
  open,
  onOpenChange,
  promptContext,
  initialMode = "signin",
  onSuccess,
}: LoginSheetProps) => {
  const [mode, setMode] = useState<"signin" | "register">(initialMode);

  /* Sync to initialMode every time the sheet opens so "Get started" = register tab */
  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");

  const login = useLogin();
  const register = useRegister();

  const isLoading = login.isPending || register.isPending;
  const hasError = login.isError || register.isError;

  /* Reset form when sheet closes */
  function handleOpenChange(v: boolean) {
    if (!v) {
      setEmail("");
      setFullName("");
      setPassword("");
      login.reset();
      register.reset();
    }
    onOpenChange(v);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login.mutateAsync({ email, password });
      onSuccess?.();
      handleOpenChange(false);
    } catch {
      /* error rendered inline */
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    try {
      await register.mutateAsync({ email, full_name: fullName, password });
      /* Auto-login after successful registration */
      await login.mutateAsync({ email, password });
      onSuccess?.();
      handleOpenChange(false);
    } catch {
      /* error rendered inline */
    }
  }

  const title =
    promptContext ??
    (mode === "signin" ? "Welcome back" : "Create your account");

  const subtitle =
    promptContext != null
      ? "Sign in to build your personal Quran journal — free forever."
      : mode === "signin"
        ? "Sign in to your Qalbwise account."
        : "Your personal Quran journal, free forever.";

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

        {/* Mode toggle */}
        <div
          className="mb-5 flex rounded-xl p-1"
          style={{ background: "#f5f5f5" }}
        >
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              login.reset();
              register.reset();
            }}
            className="flex-1 rounded-lg py-2 text-[13px] font-medium transition-all"
            style={{
              background: mode === "signin" ? "#fff" : "transparent",
              color: mode === "signin" ? "#000" : "#777169",
              boxShadow: mode === "signin" ? "var(--shadow-card)" : "none",
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              login.reset();
              register.reset();
            }}
            className="flex-1 rounded-lg py-2 text-[13px] font-medium transition-all"
            style={{
              background: mode === "register" ? "#fff" : "transparent",
              color: mode === "register" ? "#000" : "#777169",
              boxShadow: mode === "register" ? "var(--shadow-card)" : "none",
            }}
          >
            Sign up
          </button>
        </div>

        {mode === "signin" ? (
          <form onSubmit={handleSignIn} className="flex flex-col gap-3">
            <AuthInput
              type="email"
              placeholder="Email address"
              value={email}
              onChange={setEmail}
            />
            <AuthInput
              type="password"
              placeholder="Password"
              value={password}
              onChange={setPassword}
            />
            {hasError && <ErrorMsg />}
            <SubmitButton loading={isLoading} label="Sign in" />
          </form>
        ) : (
          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            <AuthInput
              type="email"
              placeholder="Email address"
              value={email}
              onChange={setEmail}
            />
            <AuthInput
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={setFullName}
            />
            <AuthInput
              type="password"
              placeholder="Password"
              value={password}
              onChange={setPassword}
            />
            {hasError && <ErrorMsg isRegister />}
            <SubmitButton loading={isLoading} label="Create account" />
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
};

/* ── Sub-components ── */

const AuthInput = ({
  type,
  placeholder,
  value,
  onChange,
}: {
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    required
    className="w-full rounded-xl px-4 py-3 text-[15px] outline-none transition-shadow"
    style={{
      border: "1px solid #e5e5e5",
      boxShadow: "var(--shadow-soft)",
      color: "#000",
      background: "#fff",
    }}
    onFocus={(e) => {
      e.currentTarget.style.borderColor = "rgba(0,0,0,0.2)";
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = "#e5e5e5";
    }}
  />
);

const ErrorMsg = ({ isRegister = false }: { isRegister?: boolean }) => (
  <p
    className="text-[13px]"
    style={{ color: "#dc2626", letterSpacing: "0.13px" }}
  >
    {isRegister
      ? "Registration failed. This email may already be in use."
      : "Invalid email or password. Please try again."}
  </p>
);

const SubmitButton = ({
  loading,
  label,
}: {
  loading: boolean;
  label: string;
}) => (
  <button
    type="submit"
    disabled={loading}
    className="pill-btn-black mt-1 w-full disabled:opacity-40"
    style={{ height: "48px", fontSize: "15px" }}
  >
    {loading ? (
      <span className="flex items-center justify-center gap-2">
        <svg
          className="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            strokeOpacity="0.3"
          />
          <path
            d="M12 2a10 10 0 0 1 10 10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        Loading…
      </span>
    ) : (
      label
    )}
  </button>
);
