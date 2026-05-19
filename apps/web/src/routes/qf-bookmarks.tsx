import type { components } from "@repo/core";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BookmarkCheck, ChevronLeft, ExternalLink } from "lucide-react";
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
import { useDeleteQfBookmark } from "@/modules/qf-bookmarks/data/mutations";
import { useQfBookmarks } from "@/modules/qf-bookmarks/data/queries";

export const Route = createFileRoute("/qf-bookmarks")({
  component: QfBookmarksPage,
  head: () => ({
    meta: [{ title: "QF Bookmarks | Qalbwise" }],
  }),
});

type QfBookmark = components["schemas"]["QfBookmarkResponse"];

function quranComEnUrl(ayahKey: string): string {
  const parts = ayahKey.trim().split(":");
  if (parts.length !== 2) return "https://quran.com/en";
  return `https://quran.com/en/${parts[0]}/${parts[1]}`;
}

function QfBookmarksPage() {
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);
  const auth = useAuth();
  const queryClient = useQueryClient();
  const qfBookmarks = useQfBookmarks();
  const deleteQfBookmark = useDeleteQfBookmark();

  const isLoggedIn = auth.isLoggedIn || Boolean(auth.accessToken);

  async function handleLoginSuccess() {
    queryClient.invalidateQueries({ queryKey: queryKeys.me });
    queryClient.invalidateQueries({ queryKey: queryKeys.qfBookmarks.all });
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
        <h2 className="font-semibold text-xl">Sign in with Quran Foundation</h2>
        <p className="max-w-md text-muted-foreground">
          View and manage verses saved to your Quran Foundation Favorites.
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

        <h1 className="mt-2 font-bold text-2xl">Quran Foundation Bookmarks</h1>
        <p className="text-muted-foreground">
          Verses saved to your Quran Foundation Favorites collection.
        </p>
      </header>

      {qfBookmarks.isLoading && (
        <div className="flex items-center justify-center gap-4 py-12 text-muted-foreground">
          <Dots className="size-10" />
          <p>Loading...</p>
        </div>
      )}

      {qfBookmarks.isError && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="max-w-md text-destructive">
            Failed to load Quran Foundation bookmarks. Connect Quran Foundation
            again if this account was created with another sign-in method.
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

      {!qfBookmarks.isLoading && !qfBookmarks.isError && (
        <QfBookmarksList
          bookmarks={qfBookmarks.data?.bookmarks ?? []}
          isDeleting={deleteQfBookmark.isPending}
          onDelete={(id) => deleteQfBookmark.mutate(id)}
        />
      )}
    </motion.section>
  );
}

function QfBookmarksList({
  bookmarks,
  isDeleting,
  onDelete,
}: {
  bookmarks: QfBookmark[];
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
        <p>No Quran Foundation bookmarks yet.</p>
        <p className="mt-1 text-sm">
          Save verses to QF Favorites from your search results.
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-medium">
                Surah {bookmark.surah_number}{" "}
                <span className="text-muted-foreground">
                  {bookmark.ayah_key}
                </span>
              </p>
              <p className="text-muted-foreground text-xs">
                Saved on:{" "}
                {new Date(bookmark.created_at).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                  hour12: false,
                })}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={
                  <a
                    href={quranComEnUrl(bookmark.ayah_key)}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Open
                    <ExternalLink />
                  </a>
                }
              />
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
                      Delete QF bookmark {bookmark.ayah_key}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes the verse from your Quran Foundation
                      Favorites collection.
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
          </div>
        </motion.li>
      ))}
    </motion.ul>
  );
}
