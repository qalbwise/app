const year = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="main-wrap flex flex-wrap justify-between gap-x-6 gap-y-4 border-foreground/5 border-t bg-background/95 py-5 text-muted-foreground text-sm backdrop-blur-sm">
      <p className="order-1 md:order-0">&copy; {year} Qalbwise</p>

      <p className="order-2 md:order-1">
        Built for the{" "}
        <a
          href="https://launch.provisioncapital.com/quran-hackathon"
          target="_blank"
          rel="noreferrer"
          className="transition-all hover:text-foreground hover:underline"
        >
          Quran Foundation
        </a>{" "}
        Hackathon
      </p>

      <a
        href="https://github.com/qalbwise/app"
        target="_blank"
        rel="noreferrer"
        className="order-0 transition-all hover:text-foreground hover:underline md:order-2"
      >
        GitHub
      </a>
    </footer>
  );
}
