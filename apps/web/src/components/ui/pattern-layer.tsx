import { cn } from "@/lib/utils";

type PatternLayerProps = {
  color: string;
  image: string;
  position: string;
  zIndex?: number;
  id: string;
  className?: string;
};

export function PatternLayer({
  className,
  color,
  image,
  position,
  zIndex = 0,
}: PatternLayerProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        backgroundColor: color,
        WebkitMaskImage: `url(${image})`,
        WebkitMaskPosition: position,
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskSize: "auto",
        maskImage: `url(${image})`,
        maskPosition: position,
        maskRepeat: "no-repeat",
        maskSize: "auto",
        zIndex,
      }}
    />
  );
}
