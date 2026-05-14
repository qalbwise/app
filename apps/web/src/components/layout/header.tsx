import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ThemeSwitcher } from "@/components/common/theme-switcher";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/api";
import { LoginDrawer } from "@/modules/auth/components/login-drawer";
import { useMe } from "@/modules/auth/data/queries";
import { useAuth } from "@/modules/auth/hooks/use-auth";

export function Header() {
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);

  useMe();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth();

  function handleSignOut() {
    logout();
    queryClient.invalidateQueries({ queryKey: queryKeys.me });
    queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.all });
    navigate({ to: "/" });
  }

  function openSignIn() {
    setLoginSheetOpen(true);
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

          <ul className="flex items-center gap-2">
            <li>
              <ThemeSwitcher />
            </li>
            <li>
              <Button
                variant="ghost"
                className="hover:bg-secondary"
                render={<Link to="/bookmarks">Bookmarks</Link>}
              />
            </li>

            <li>
              <Button onClick={isLoggedIn ? handleSignOut : openSignIn}>
                {isLoggedIn ? "Sign out" : "Get started"}
              </Button>
            </li>
          </ul>
        </nav>
      </header>

      <LoginDrawer
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
