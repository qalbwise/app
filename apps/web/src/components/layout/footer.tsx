import { Link } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { GithubDark } from "@/components/ui/svgs/githubDark";
import { GithubLight } from "@/components/ui/svgs/githubLight";

const year = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="main-wrap flex flex-col-reverse justify-between gap-4 border-foreground/5 border-t bg-background/95 py-5 text-muted-foreground text-sm backdrop-blur-sm sm:flex-row">
      <div className="flex flex-col gap-4">
        <p>&copy; {year} Qalbwise</p>
        <p>
          Built for the{" "}
          <a
            href="https://launch.provisioncapital.com/quran-hackathon"
            aria-label="Quran Foundation Hackathon (opens in new tab)"
            target="_blank"
            rel="noreferrer"
            className="transition-all hover:text-foreground hover:underline"
          >
            Quran Foundation Hackathon
          </a>
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:items-end">
        <div className="flex items-center gap-4">
          <Link
            to="/privacy"
            aria-label="Privacy policy"
            className="transition-all hover:text-foreground hover:underline"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            aria-label="Terms of service"
            className="transition-all hover:text-foreground hover:underline"
          >
            Terms
          </Link>
          <a
            href="https://github.com/qalbwise/app"
            aria-label="GitHub repository (opens in new tab)"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 transition-all hover:text-foreground hover:underline"
          >
            <GithubLight className="block size-4 dark:hidden" />
            <GithubDark className="hidden size-4 dark:block" />
            GitHub
          </a>
        </div>

        <a
          href="https://uptime.qalbwise.app/status/qalbwise"
          aria-label="Uptime status (opens in new tab)"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 transition-all hover:text-foreground hover:underline"
        >
          <Activity size={16} />
          Uptime status
        </a>
      </div>
    </footer>
  );
}
