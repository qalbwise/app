import { cn } from "@/lib/utils";

type PatternLayerProps = {
  color: string;
  image: string;
  position: string;
  zIndex?: number;
  id: string;
  className?: string;
  repeat?: string;
  maskSize?: string;
};

export function PatternLayer({
  className,
  color,
  image,
  position,
  zIndex = 0,
  repeat = "no-repeat",
  maskSize = "auto",
}: PatternLayerProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        backgroundColor: color,
        WebkitMaskImage: `url(${image})`,
        WebkitMaskPosition: position,
        WebkitMaskRepeat: repeat,
        WebkitMaskSize: maskSize,
        maskImage: `url(${image})`,
        maskPosition: position,
        maskRepeat: repeat,
        maskSize: maskSize,
        zIndex,
      }}
    />
  );
}
