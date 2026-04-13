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
        className="absolute bottom-0 left-0 right-0 animate-in slide-in-from-bottom duration-300"
        style={{
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          boxShadow:
            "rgba(0,0,0,0.3) 0px -4px 40px, rgba(0,0,0,0.06) 0px 0px 0px 1px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div
            className="h-1 w-10 rounded-full"
            style={{ background: "#e5e5e5" }}
          />
        </div>
        {children}
      </div>
    </div>
  );
}

export function SheetContent({ children, className }: SheetContentProps) {
  return <div className={cn("px-6 pb-8 pt-2", className)}>{children}</div>;
}

export function SheetHeader({ children, className }: SheetHeaderProps) {
  return <div className={cn("mb-6 space-y-1.5", className)}>{children}</div>;
}

export function SheetTitle({ children, className }: SheetTitleProps) {
  return (
    <h2
      className={cn(
        "text-[24px] font-light leading-tight tracking-[-0.4px] text-black",
        className
      )}
    >
      {children}
    </h2>
  );
}
