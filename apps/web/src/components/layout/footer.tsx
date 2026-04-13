export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer
      className="py-10 px-4"
      style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}
    >
      <div className="page-wrap flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="flex items-center gap-1.5">
          <span className="text-[14px]" style={{ color: "#777169" }}>
            © {year} Qalbwise
          </span>
          <span className="text-[14px]" style={{ color: "#e5e5e5" }}>
            ·
          </span>
          <span className="text-[14px]" style={{ color: "#777169" }}>
            Built for the Quran Foundation Hackathon
          </span>
        </div>
        <a
          href="https://github.com/qalbwise/app"
          target="_blank"
          rel="noreferrer"
          className="text-[13px] no-underline transition-colors hover:text-black"
          style={{ color: "#777169" }}
        >
          GitHub
        </a>
      </div>
    </footer>
  );
};
