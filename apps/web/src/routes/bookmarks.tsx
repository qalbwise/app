import type { components } from "@repo/core";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark as BookmarkIcon, ChevronLeft } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

import { Dots } from "@/components/loading-ui/dots";
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
import { duration, easing, variants } from "@/lib/motions";
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
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.normal, ease: easing.out }}
        className="mt-[20svh] flex flex-col items-center justify-center gap-4 text-center"
      >
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
      </motion.section>
    );
  }

  const isLoading = bookmarks.isLoading;
  const isError = bookmarks.isError;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.normal, ease: easing.out }}
      className="flex flex-col gap-6"
    >
      <header className="flex flex-col gap-2">
        <Button
          className="self-start hover:bg-secondary"
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

        <h1 className="mt-2 font-bold text-2xl">Your Bookmarks</h1>
        <p className="text-muted-foreground">
          Your saved Quranic verses from searches.
        </p>
      </header>

      {isLoading && (
        <div className="flex items-center justify-center gap-4 py-12 text-muted-foreground">
          <Dots className="size-10" />
          <p>Loading...</p>
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
    </motion.section>
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: duration.normal, ease: easing.out }}
        className="py-12 text-center text-muted-foreground"
      >
        <p>No bookmarks yet.</p>
        <p className="mt-1 text-sm">
          Save verses from your searches to see them here.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.ul
      variants={variants.staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-4"
    >
      {bookmarks.map((bookmark) => (
        <motion.li
          key={bookmark.id}
          variants={variants.staggerItem}
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
          <p className="text-muted-foreground text-xs">
            Saved on:{" "}
            <span className="font-medium">
              {new Date(bookmark.created_at).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "UTC",
                hour12: false,
              })}
            </span>
          </p>
          {bookmark.note && (
            <p className="border-primary border-l-2 pl-3 text-sm italic">
              {bookmark.note}
            </p>
          )}
        </motion.li>
      ))}
    </motion.ul>
  );
}
