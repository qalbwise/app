import { DashRing } from "@/components/loading-ui/dash-ring";

interface SearchLoadingProps {
  query: string;
}

export function SearchLoading({ query }: SearchLoadingProps) {
  return (
    <div>
      <div className="mx-auto flex size-30 items-center justify-center rounded-full border border-border bg-muted">
        <DashRing className="size-16 text-teal-500" />
      </div>

      <div className="mt-8 flex flex-col items-center gap-4 text-balance text-center">
        <p>Searching the best result that your qalb feels about:</p>
        <span className="font-medium font-sans text-2xl italic">“{query}”</span>
      </div>
    </div>
  );
}
