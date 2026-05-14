import type { components } from "@repo/core";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bookmark as BookmarkIcon } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/api";
import { LoginDrawer } from "@/modules/auth/components/login-drawer";
import { useAuth } from "@/modules/auth/hooks/use-auth";
import { useDeleteBookmark } from "@/modules/bookmarks/data/mutations";
import { useBookmarks } from "@/modules/bookmarks/data/queries";

export const Route = createFileRoute("/bookmarks")({
  component: BookmarksPage,
  head: () => ({
    meta: [{ title: "Bookmarks | Qalbwise" }],
  }),
});

type Bookmark = components["schemas"]["BookmarkResponse"];

function BookmarksPage() {
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);

  const auth = useAuth();
  const queryClient = useQueryClient();

  const isLoggedIn = auth.isLoggedIn || Boolean(auth.accessToken);

  const bookmarks = useBookmarks();
  const deleteBookmark = useDeleteBookmark();

  function handleDeleteBookmark(id: string) {
    deleteBookmark.mutate(id);
  }

  async function handleLoginSuccess() {
    queryClient.invalidateQueries({ queryKey: queryKeys.me });
    setLoginSheetOpen(false);
  }

  if (!isLoggedIn) {
    return (
      <section className="mt-[20svh] flex flex-col items-center justify-center gap-4 text-center">
        <BookmarkIcon className="size-12 text-muted-foreground" />
        <h2 className="font-semibold text-xl">
          Sign in to view your saved verses
        </h2>
        <p className="max-w-md text-muted-foreground">
          Save your favorite Quranic verses to access them anytime, even
          offline.
        </p>
        <Button onClick={() => setLoginSheetOpen(true)}>Sign In</Button>
        <LoginDrawer
          open={loginSheetOpen}
          onOpenChange={setLoginSheetOpen}
          promptContext="View your bookmarks"
          onSuccess={handleLoginSuccess}
        />
      </section>
    );
  }

  const isLoading = bookmarks.isLoading;
  const isError = bookmarks.isError;

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-bold text-2xl">Your Bookmarks</h1>
        <p className="text-muted-foreground">
          Your saved Quranic verses from searches.
        </p>
      </header>

      {isLoading && (
        <div className="flex justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      )}

      {isError && (
        <div className="py-12 text-center">
          <p className="text-destructive">
            Failed to load bookmarks. Please try again.
          </p>
        </div>
      )}

      {!isLoading && !isError && (
        <BookmarksList
          bookmarks={bookmarks.data?.bookmarks ?? []}
          onDelete={handleDeleteBookmark}
          isDeleting={deleteBookmark.isPending}
        />
      )}
    </section>
  );
}

function BookmarksList({
  bookmarks,
  onDelete,
  isDeleting,
}: {
  bookmarks: Bookmark[];
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  if (bookmarks.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>No bookmarks yet.</p>
        <p className="mt-1 text-sm">
          Save verses from your searches to see them here.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {bookmarks.map((bookmark) => (
        <li
          key={bookmark.id}
          className="flex flex-col gap-3 rounded-lg border bg-card p-4"
        >
          <div className="flex items-start justify-between">
            <p className="text-muted-foreground text-sm">
              {bookmark.surah_name}{" "}
              <span className="font-medium">{bookmark.ayah_key}</span>
            </p>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isDeleting}
                  />
                }
              >
                Delete
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete {bookmark.surah_name} {bookmark.ayah_key}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this from your bookmarks?
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => onDelete(bookmark.id)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <p
            className="text-right font-arabic text-lg leading-relaxed"
            dir="rtl"
          >
            {bookmark.arabic_text}
          </p>
          <p className="text-muted-foreground text-sm">
            {bookmark.translation}
          </p>
          {bookmark.note && (
            <p className="border-primary border-l-2 pl-3 text-sm italic">
              {bookmark.note}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
