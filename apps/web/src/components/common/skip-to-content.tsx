export function SkipToContent() {
  return (
    <a
      href="#main-content"
      aria-label="Skip to content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-999 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-md focus:outline-none focus:ring-[3px] focus:ring-ring"
    >
      Skip to content
    </a>
  );
}
