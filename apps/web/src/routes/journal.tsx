import type { components } from "@repo/core";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import {
  useCreateNote,
  useDeleteBookmark,
  useDeleteNote,
} from "@/modules/bookmarks/data/mutations";
import { useBookmarks, useNotes } from "@/modules/bookmarks/data/queries";

type Bookmark = components["schemas"]["BookmarkResponse"];
type Note = components["schemas"]["NoteResponse"];

export const Route = createFileRoute("/journal")({
  beforeLoad: () => {
    if (!localStorage.getItem("access_token")) {
      throw redirect({ to: "/" });
    }
  },
  component: JournalPage,
});

function JournalPage() {
  const [tab, setTab] = useState<"bookmarks" | "notes">("bookmarks");

  return (
    <div className="min-h-[calc(100vh-56px-80px)] bg-white">
      <div className="page-wrap py-12">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="mb-2 font-bold text-[32px] text-foreground">
            My Journal
          </h1>
          <p className="text-[15px] text-muted-foreground">
            Your personal collection of saved verses and reflections.
          </p>
        </div>

        {/* Tab bar */}
        <div className="mb-8 inline-flex rounded-xl bg-muted p-1">
          <TabButton
            active={tab === "bookmarks"}
            onClick={() => setTab("bookmarks")}
            label="Saved Verses"
          />
          <TabButton
            active={tab === "notes"}
            onClick={() => setTab("notes")}
            label="Reflections"
          />
        </div>

        {tab === "bookmarks" ? <BookmarksTab /> : <NotesTab />}
      </div>
    </div>
  );
}

function BookmarksTab() {
  const bookmarks = useBookmarks();
  const deleteBookmark = useDeleteBookmark();

  if (bookmarks.isPending) {
    return (
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton-pulse h-32 rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  const items = (bookmarks.data?.bookmarks ?? []) as Bookmark[];

  if (items.length === 0) {
    return (
      <EmptyState
        icon="📖"
        title="No saved verses yet"
        body="Tap the Save verse button on any result to build your collection."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((bookmark) => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          onDelete={() => deleteBookmark.mutate(bookmark.id)}
          deleting={
            deleteBookmark.isPending && deleteBookmark.variables === bookmark.id
          }
        />
      ))}
    </div>
  );
}

const BookmarkCard = ({
  bookmark,
  onDelete,
  deleting,
}: {
  bookmark: Bookmark;
  onDelete: () => void;
  deleting: boolean;
}) => (
  <article className="card-surface p-5">
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-[13px] text-foreground">
          {bookmark.surah_name}
        </span>
        <span className="rounded-full border border-[rgba(78,50,23,0.1)] bg-(--clr-warm-stone) px-2 py-0.5 font-medium text-[11px] text-muted-foreground">
          {bookmark.ayah_key}
        </span>
      </div>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className="text-(--clr-placeholder) text-[12px] transition-colors hover:text-destructive disabled:opacity-30"
        aria-label="Delete bookmark"
      >
        {deleting ? "…" : "✕"}
      </button>
    </div>

    {bookmark.arabic_text && (
      <div className="arabic-text mb-3 text-[20px]">{bookmark.arabic_text}</div>
    )}

    {bookmark.translation && (
      <p className="text-[14px] text-secondary-foreground italic leading-relaxed">
        {bookmark.translation}
      </p>
    )}
  </article>
);

function NotesTab() {
  const notes = useNotes();
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const [newTopic, setNewTopic] = useState("");
  const [newContent, setNewContent] = useState("");
  const [composing, setComposing] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTopic.trim() || !newContent.trim()) return;
    await createNote.mutateAsync({
      topic: newTopic.trim(),
      content: newContent.trim(),
    });
    setNewTopic("");
    setNewContent("");
    setComposing(false);
  }

  if (notes.isPending) {
    return (
      <div className="flex flex-col gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="skeleton-pulse h-28 rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  const items = (notes.data?.notes ?? []) as Note[];

  return (
    <div className="flex flex-col gap-6">
      {/* Compose area */}
      {composing ? (
        <form
          onSubmit={handleCreate}
          className="card-surface flex flex-col gap-3 p-5"
        >
          <p className="font-semibold text-[13px] text-muted-foreground uppercase tracking-widest">
            New reflection
          </p>
          <input
            type="text"
            placeholder="Topic (e.g. on patience)"
            aria-label="Reflection topic"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            required
            className="w-full rounded-xl border border-border px-4 py-3 text-[14px] text-foreground outline-none"
          />
          <textarea
            placeholder="Write your reflection here…"
            aria-label="Reflection content"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            required
            rows={5}
            className="w-full resize-none rounded-xl border border-border px-4 py-3 text-[14px] text-foreground leading-relaxed outline-none"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createNote.isPending}
              className="pill-btn-black h-9 px-4.5 text-[13px] disabled:opacity-40"
            >
              {createNote.isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setComposing(false);
                setNewTopic("");
                setNewContent("");
              }}
              className="pill-btn-white h-9 px-4.5 text-[13px]"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setComposing(true)}
          className="pill-btn-black h-9 self-start px-4.5 text-[13px]"
        >
          + New reflection
        </button>
      )}

      {items.length === 0 && !composing && (
        <EmptyState
          icon="✍️"
          title="No reflections yet"
          body="Capture your thoughts, insights, and du'as here."
        />
      )}

      {items.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onDelete={() => deleteNote.mutate(note.id)}
          deleting={deleteNote.isPending && deleteNote.variables === note.id}
        />
      ))}
    </div>
  );
}

const NoteCard = ({
  note,
  onDelete,
  deleting,
}: {
  note: Note;
  onDelete: () => void;
  deleting: boolean;
}) => {
  const date = new Date(note.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <article className="card-surface p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[15px] text-foreground">
            {note.topic}
          </p>
          <p className="text-(--clr-placeholder) text-[12px]">{date}</p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="mt-0.5 shrink-0 text-(--clr-placeholder) text-[12px] transition-colors hover:text-destructive disabled:opacity-30"
          aria-label="Delete note"
        >
          {deleting ? "…" : "✕"}
        </button>
      </div>
      <p className="whitespace-pre-wrap text-[14px] text-secondary-foreground leading-relaxed">
        {note.content}
      </p>
    </article>
  );
};

/* ── Shared components ── */

const TabButton = ({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-lg px-5 py-2 font-medium text-[13px] transition-all ${
      active
        ? "bg-white text-foreground shadow-(--shadow-card)"
        : "bg-transparent text-muted-foreground"
    }`}
  >
    {label}
  </button>
);

const EmptyState = ({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) => (
  <div className="flex flex-col items-center gap-3 rounded-2xl bg-[rgba(245,242,239,0.4)] py-16 text-center">
    <span className="text-4xl">{icon}</span>
    <p className="font-medium text-[16px] text-secondary-foreground">{title}</p>
    <p className="max-w-xs text-(--clr-placeholder) text-[14px] leading-relaxed">
      {body}
    </p>
  </div>
);
