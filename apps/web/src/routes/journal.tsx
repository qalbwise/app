import type { components } from "@repo/core";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import {
  useBookmarks,
  useDeleteBookmark,
} from "@/modules/bookmarks/queries/use-bookmarks";
import {
  useCreateNote,
  useDeleteNote,
  useNotes,
} from "@/modules/bookmarks/queries/use-notes";

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
    <div
      className="min-h-[calc(100vh-56px-80px)]"
      style={{ background: "#fff" }}
    >
      <div className="page-wrap py-12">
        {/* Page header */}
        <div className="mb-8">
          <h1
            className="mb-2 text-[32px] font-bold"
            style={{ color: "#000", letterSpacing: "-0.5px" }}
          >
            My Journal
          </h1>
          <p
            className="text-[15px]"
            style={{ color: "#777169", letterSpacing: "0.15px" }}
          >
            Your personal collection of saved verses and reflections.
          </p>
        </div>

        {/* Tab bar */}
        <div
          className="mb-8 inline-flex rounded-xl p-1"
          style={{ background: "#f5f5f5" }}
        >
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
          <div
            key={i}
            className="skeleton-pulse h-32 rounded-2xl"
            style={{ background: "#f5f5f5" }}
          />
        ))}
      </div>
    );
  }

  const items = (bookmarks.data?.data?.bookmarks ?? []) as Bookmark[];

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
        <span className="text-[13px] font-semibold" style={{ color: "#000" }}>
          {bookmark.surah_name}
        </span>
        <span
          className="text-[11px] font-medium"
          style={{
            color: "#777169",
            background: "rgba(245,242,239,0.8)",
            padding: "2px 8px",
            borderRadius: "9999px",
            border: "1px solid rgba(78,50,23,0.1)",
          }}
        >
          {bookmark.ayah_key}
        </span>
      </div>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className="text-[12px] transition-colors disabled:opacity-30"
        style={{ color: "#b0ada8" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#b0ada8")}
        aria-label="Delete bookmark"
      >
        {deleting ? "…" : "✕"}
      </button>
    </div>

    {bookmark.arabic_text && (
      <div className="arabic-text mb-3 text-[20px]">{bookmark.arabic_text}</div>
    )}

    {bookmark.translation && (
      <p
        className="text-[14px] leading-relaxed"
        style={{
          color: "#4e4e4e",
          fontStyle: "italic",
          letterSpacing: "0.14px",
        }}
      >
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
          <div
            key={i}
            className="skeleton-pulse h-28 rounded-2xl"
            style={{ background: "#f5f5f5" }}
          />
        ))}
      </div>
    );
  }

  const items = (notes.data?.data?.notes ?? []) as Note[];

  return (
    <div className="flex flex-col gap-6">
      {/* Compose area */}
      {composing ? (
        <form
          onSubmit={handleCreate}
          className="card-surface flex flex-col gap-3 p-5"
        >
          <p
            className="text-[13px] font-semibold uppercase tracking-widest"
            style={{ color: "#777169" }}
          >
            New reflection
          </p>
          <input
            type="text"
            placeholder="Topic (e.g. on patience)"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            required
            className="w-full rounded-xl px-4 py-3 text-[14px] outline-none"
            style={{
              border: "1px solid #e5e5e5",
              color: "#000",
            }}
          />
          <textarea
            placeholder="Write your reflection here…"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            required
            rows={5}
            className="w-full rounded-xl px-4 py-3 text-[14px] leading-relaxed outline-none resize-none"
            style={{ border: "1px solid #e5e5e5", color: "#000" }}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createNote.isPending}
              className="pill-btn-black text-[13px] disabled:opacity-40"
              style={{ height: "36px", padding: "0 18px" }}
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
              className="pill-btn-white text-[13px]"
              style={{ height: "36px", padding: "0 18px" }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setComposing(true)}
          className="pill-btn-black self-start text-[13px]"
          style={{ height: "36px", padding: "0 18px" }}
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
          <p className="text-[15px] font-semibold" style={{ color: "#000" }}>
            {note.topic}
          </p>
          <p className="text-[12px]" style={{ color: "#b0ada8" }}>
            {date}
          </p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="shrink-0 text-[12px] transition-colors disabled:opacity-30"
          style={{ color: "#b0ada8", marginTop: "2px" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#b0ada8")}
          aria-label="Delete note"
        >
          {deleting ? "…" : "✕"}
        </button>
      </div>
      <p
        className="text-[14px] leading-relaxed"
        style={{
          color: "#4e4e4e",
          letterSpacing: "0.14px",
          whiteSpace: "pre-wrap",
        }}
      >
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
    className="rounded-lg px-5 py-2 text-[13px] font-medium transition-all"
    style={{
      background: active ? "#fff" : "transparent",
      color: active ? "#000" : "#777169",
      boxShadow: active ? "var(--shadow-card)" : "none",
    }}
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
  <div
    className="flex flex-col items-center gap-3 rounded-2xl py-16 text-center"
    style={{ background: "rgba(245,242,239,0.4)" }}
  >
    <span className="text-4xl">{icon}</span>
    <p className="text-[16px] font-medium" style={{ color: "#4e4e4e" }}>
      {title}
    </p>
    <p
      className="max-w-xs text-[14px] leading-relaxed"
      style={{ color: "#b0ada8" }}
    >
      {body}
    </p>
  </div>
);
