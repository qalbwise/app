import { Link } from "@tanstack/react-router";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/80">
      <nav className="mx-auto flex max-w-4xl items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-semibold text-emerald-700 dark:text-emerald-400"
        >
          <span className="text-2xl">☪</span>
          Qalbwise
        </Link>
      </nav>
    </header>
  );
};
