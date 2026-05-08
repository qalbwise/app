import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface SheetContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SheetHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface SheetTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    if (open) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 w-full cursor-default bg-black/20 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      {/* Sheet panel */}
      <div
        ref={sheetRef}
        className="slide-in-from-bottom absolute right-0 bottom-0 left-0 max-h-[90vh] animate-in overflow-y-auto rounded-t-[20px] bg-background shadow-[rgba(0,0,0,0.3)_0_-4px_40px,rgba(0,0,0,0.06)_0_0_0_1px] duration-300"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>
        {children}
      </div>
    </div>
  );
}

export function SheetContent({ children, className }: SheetContentProps) {
  return <div className={cn("px-6 pt-2 pb-8", className)}>{children}</div>;
}

export function SheetHeader({ children, className }: SheetHeaderProps) {
  return <div className={cn("mb-6 space-y-1.5", className)}>{children}</div>;
}

export function SheetTitle({ children, className }: SheetTitleProps) {
  return (
    <h2
      className={cn(
        "font-light text-[24px] text-black leading-tight tracking-[-0.4px]",
        className
      )}
    >
      {children}
    </h2>
  );
}
