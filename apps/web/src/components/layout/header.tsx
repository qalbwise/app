import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/api";
import { LoginSheet } from "@/modules/auth/components/login-sheet";
import { useMe } from "@/modules/auth/data/queries";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);

  const me = useMe();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isLoggedIn =
    Boolean(localStorage.getItem("access_token")) && Boolean(me.data);
  const user = me.data;

  function handleSignOut() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    queryClient.invalidateQueries({ queryKey: queryKeys.me });
    queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.all });
    navigate({ to: "/" });
    setMobileOpen(false);
  }

  function openSignIn() {
    setLoginSheetOpen(true);
    setMobileOpen(false);
  }

  function openRegister() {
    setLoginSheetOpen(true);
    setMobileOpen(false);
  }

  return (
    <>
      <header className="main-wrap sticky top-0 z-50 border-foreground/5 border-b bg-background/95 backdrop-blur-sm">
        <nav className="flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <span className="font-semibold text-[15px] text-foreground tracking-[-0.2px]">
              Qalbwise
            </span>
            <span
              className="font-normal text-[13px] text-muted-foreground"
              style={{ fontFamily: "var(--font-arabic)" }}
            >
              قلب
            </span>
          </Link>

          <Button>{isLoggedIn ? "Sign out" : "Get started"}</Button>
        </nav>
      </header>

      <LoginSheet
        open={loginSheetOpen}
        onOpenChange={setLoginSheetOpen}
        onSuccess={() => {
          setLoginSheetOpen(false);
          queryClient.invalidateQueries({ queryKey: queryKeys.me });
        }}
      />
    </>
  );
}
