import { useState } from "react";

const VERSES_PER_PAGE = 1;

interface UseSearchPaginationResult<T> {
  currentPage: number;
  totalPages: number;
  normalizedCurrentPage: number;
  pageStart: number;
  visibleResults: T[];
  goToPage: (page: number) => void;
}

interface UseSearchPaginationOptions<T> {
  results: T[];
  versesPerPage?: number;
}

export function useSearchPagination<T>({
  results,
  versesPerPage = VERSES_PER_PAGE,
}: UseSearchPaginationOptions<T>): UseSearchPaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(1);

  const totalResults = results.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / versesPerPage));
  const normalizedCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (normalizedCurrentPage - 1) * versesPerPage;
  const visibleResults = results.slice(pageStart, pageStart + versesPerPage);

  function goToPage(page: number) {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  }

  return {
    currentPage,
    totalPages,
    normalizedCurrentPage,
    pageStart,
    visibleResults,
    goToPage,
  };
}
