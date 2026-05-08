const year = new Date().getFullYear();

export const Footer = () => {
  return (
    <footer className="main-wrap flex flex-col gap-4 border-black/5 border-t bg-white/95 py-5 text-muted-foreground text-sm backdrop-blur-sm md:gap-1 lg:gap-0">
      <div className="flex flex-col justify-between gap-2 md:flex-row">
        <p>&copy; {year} Qalbwise</p>

        <a
          href="https://github.com/qalbwise/app"
          target="_blank"
          rel="noreferrer"
          className="transition-all hover:text-foreground hover:underline"
        >
          GitHub
        </a>
      </div>

      <p className="md:text-center">
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
    </footer>
  );
};
