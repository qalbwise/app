import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { queryKeys } from "@/lib/api";
import { LoginSheet } from "@/modules/auth/components/login-sheet";
import { useMe } from "@/modules/auth/queries/use-me";

export const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);

  const me = useMe();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isLoggedIn =
    Boolean(localStorage.getItem("access_token")) && Boolean(me.data?.data);
  const user = me.data?.data;

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
      <header
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
      >
        <nav className="page-wrap flex h-14 items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 no-underline">
            <span
              className="text-[15px] font-semibold"
              style={{ color: "#000", letterSpacing: "-0.2px" }}
            >
              Qalbwise
            </span>
            <span
              className="text-[13px] font-normal"
              style={{ color: "#777169", fontFamily: "var(--font-arabic)" }}
            >
              قلب
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-4 lg:flex">
            {isLoggedIn ? (
              <>
                <Link
                  to="/journal"
                  className="nav-link text-[14px]"
                  style={{ color: "#4e4e4e" }}
                >
                  Journal
                </Link>
                <span
                  className="text-[13px]"
                  style={{
                    color: "#777169",
                    maxWidth: "140px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user?.email}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="pill-btn-white text-[14px]"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={openSignIn}
                  className="pill-btn-white text-[14px]"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={openRegister}
                  className="pill-btn-black text-[14px]"
                >
                  Get started
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="flex flex-col gap-[5px] p-2 lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span
              className="block h-[1.5px] w-5 transition-transform"
              style={{
                background: "#000",
                transformOrigin: "center",
                transform: mobileOpen
                  ? "translateY(6.5px) rotate(45deg)"
                  : "none",
              }}
            />
            <span
              className="block h-[1.5px] w-5 transition-opacity"
              style={{ background: "#000", opacity: mobileOpen ? 0 : 1 }}
            />
            <span
              className="block h-[1.5px] w-5 transition-transform"
              style={{
                background: "#000",
                transformOrigin: "center",
                transform: mobileOpen
                  ? "translateY(-6.5px) rotate(-45deg)"
                  : "none",
              }}
            />
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="border-t px-4 py-4 lg:hidden"
            style={{ borderColor: "rgba(0,0,0,0.05)" }}
          >
            <div className="flex flex-col gap-3">
              {isLoggedIn ? (
                <>
                  <span
                    className="py-1 text-[13px]"
                    style={{ color: "#777169" }}
                  >
                    {user?.email}
                  </span>
                  <Link
                    to="/journal"
                    className="nav-link py-2 text-[15px]"
                    style={{ color: "#4e4e4e" }}
                    onClick={() => setMobileOpen(false)}
                  >
                    Journal
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="pill-btn-white w-full text-[14px]"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={openSignIn}
                    className="pill-btn-white flex-1 text-[14px]"
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={openRegister}
                    className="pill-btn-black flex-1 text-[14px]"
                  >
                    Get started
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
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
};
