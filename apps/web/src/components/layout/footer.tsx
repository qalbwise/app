import { Link } from "@tanstack/react-router";
import { GithubDark } from "@/components/ui/svgs/githubDark";
import { GithubLight } from "@/components/ui/svgs/githubLight";

const year = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="main-wrap flex flex-col gap-4 border-foreground/5 border-t bg-background/95 py-5 text-muted-foreground text-sm backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p>&copy; {year} Qalbwise</p>

        <div className="flex items-center gap-4">
          <Link
            to="/privacy"
            className="transition-all hover:text-foreground hover:underline"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            className="transition-all hover:text-foreground hover:underline"
          >
            Terms
          </Link>
          <a
            href="https://github.com/qalbwise/app"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 transition-all hover:text-foreground hover:underline"
          >
            <GithubLight className="block size-4 dark:hidden" />
            <GithubDark className="hidden size-4 dark:block" />
            GitHub
          </a>
        </div>
      </div>

      <p>
        Built for the{" "}
        <a
          href="https://launch.provisioncapital.com/quran-hackathon"
          target="_blank"
          rel="noreferrer"
          className="transition-all hover:text-foreground hover:underline"
        >
          Quran Foundation Hackathon
        </a>
      </p>
    </footer>
  );
}
