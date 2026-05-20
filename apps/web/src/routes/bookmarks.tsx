import type { components } from "@repo/core";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BookmarkCheck, ChevronLeft } from "lucide-react";
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
import { removeSuperscriptTags } from "@/lib/utils";
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
  const bookmarks = useBookmarks();
  const deleteBookmark = useDeleteBookmark();

  const isLoggedIn = auth.isLoggedIn || Boolean(auth.accessToken);

  async function handleLoginSuccess() {
    queryClient.invalidateQueries({ queryKey: queryKeys.me });
    queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.all });
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
        <BookmarkCheck className="size-12 text-muted-foreground" />
        <h2 className="font-semibold text-xl">
          Sign in to view your bookmarks
        </h2>
        <p className="max-w-md text-muted-foreground">
          Save your favorite Quranic verses to access them anytime.
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
          Verses saved to your Quran Foundation Favorites.
        </p>
      </header>

      {bookmarks.isLoading && (
        <div className="flex items-center justify-center gap-4 py-12 text-muted-foreground">
          <Dots className="size-10" />
          <p>Loading...</p>
        </div>
      )}

      {bookmarks.isError && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="max-w-md text-destructive">
            Failed to load bookmarks. Connect Quran Foundation again if this
            account was created with another sign-in method.
          </p>
          <Button onClick={() => setLoginSheetOpen(true)}>
            Connect Quran Foundation
          </Button>
          <LoginDrawer
            open={loginSheetOpen}
            onOpenChange={setLoginSheetOpen}
            promptContext="Connect Quran Foundation bookmarks"
            onSuccess={handleLoginSuccess}
          />
        </div>
      )}

      {!bookmarks.isLoading && !bookmarks.isError && (
        <BookmarksList
          bookmarks={bookmarks.data?.bookmarks ?? []}
          isDeleting={deleteBookmark.isPending}
          onDelete={(id) => deleteBookmark.mutate(id)}
        />
      )}
    </motion.section>
  );
}

function BookmarksList({
  bookmarks,
  isDeleting,
  onDelete,
}: {
  bookmarks: Bookmark[];
  isDeleting: boolean;
  onDelete: (id: string) => void;
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
          Save verses from your search results to see them here.
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
          className="flex flex-col gap-4 rounded-lg border bg-card p-4"
        >
          <div className="flex items-start justify-between">
            <p className="font-medium">
              {bookmark.surah_name}{" "}
              <span className="text-muted-foreground text-sm">
                ({bookmark.ayah_key})
              </span>
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
                    Delete bookmark {bookmark.ayah_key}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the verse from your bookmarks.
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

          {bookmark.arabic_text && (
            <p
              lang="ar"
              className="text-right font-arabic text-xl leading-loose"
              dir="rtl"
            >
              {bookmark.arabic_text}
            </p>
          )}

          {bookmark.translation && (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {removeSuperscriptTags(bookmark.translation)}
            </p>
          )}

          <p className="text-muted-foreground text-xs">
            Saved on:{" "}
            {new Date(bookmark.created_at).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
              hour12: false,
            })}
          </p>
        </motion.li>
      ))}
    </motion.ul>
  );
}
