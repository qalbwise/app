import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchHeaderProps {
  totalResults: number;
}

export function SearchHeader({ totalResults }: SearchHeaderProps) {
  return (
    <div className="relative flex flex-col gap-y-2 md:flex-row md:justify-center">
      <Button
        className="left-0 self-start md:absolute"
        variant="outline"
        size="sm"
        nativeButton={false}
        render={
          <Link to="/">
            <ChevronLeft />
            New Search
          </Link>
        }
      />

      <h1 className="relative">
        Showing <span className="font-bold">{totalResults} results </span>
        of:
      </h1>
    </div>
  );
}

export function SearchTopicDisplay({ topic }: { topic: string }) {
  return (
    <span className="text-balance text-center font-medium font-sans text-2xl italic">
      "{topic}"
    </span>
  );
}
