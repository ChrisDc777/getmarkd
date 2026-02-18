"use client";

import { useEffect, useOptimistic, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Bookmark } from "@/types";
import { BookmarkItem } from "./BookmarkItem";
import { AddBookmarkForm } from "./AddBookmarkForm";

interface BookmarkListProps {
  initialBookmarks: Bookmark[];
  userId: string;
}

type OptimisticAction =
  | { type: "add"; bookmark: Bookmark }
  | { type: "delete"; id: string };

function bookmarkReducer(
  state: Bookmark[],
  action: OptimisticAction
): Bookmark[] {
  switch (action.type) {
    case "add":
      return [action.bookmark, ...state];
    case "delete":
      return state.filter((b) => b.id !== action.id);
    default:
      return state;
  }
}

export function BookmarkList({ initialBookmarks, userId }: BookmarkListProps) {
  const supabase = createClient();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const [optimisticBookmarks, dispatch] = useOptimistic(
    bookmarks,
    bookmarkReducer
  );
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("bookmarks-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newBookmark = payload.new as Bookmark;
          setBookmarks((prev) => {
            // Avoid duplicates (optimistic add might already be there)
            if (prev.some((b) => b.id === newBookmark.id)) return prev;
            return [newBookmark, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const deletedId = payload.old.id as string;
          setBookmarks((prev) => prev.filter((b) => b.id !== deletedId));
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  const handleAdd = async (title: string, url: string) => {
    const tempId = `optimistic-${Date.now()}`;
    const optimisticBookmark: Bookmark = {
      id: tempId,
      user_id: userId,
      title,
      url,
      created_at: new Date().toISOString(),
    };

    dispatch({ type: "add", bookmark: optimisticBookmark });

    const { data, error } = await supabase
      .from("bookmarks")
      .insert({ title, url, user_id: userId })
      .select()
      .single();

    if (error) {
      // Rollback: remove optimistic entry
      setBookmarks((prev) => prev.filter((b) => b.id !== tempId));
      return { error: error.message };
    }

    // Replace optimistic entry with real one
    setBookmarks((prev) =>
      prev.map((b) => (b.id === tempId ? (data as Bookmark) : b))
    );

    return { error: null };
  };

  const handleDelete = async (id: string) => {
    setDeletingIds((prev) => new Set(prev).add(id));
    dispatch({ type: "delete", id });

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id)
      .eq("user_id", userId); // extra safety guard

    if (error) {
      // Rollback
      const original = bookmarks.find((b) => b.id === id);
      if (original) {
        setBookmarks((prev) => {
          const exists = prev.some((b) => b.id === id);
          if (exists) return prev;
          return [original, ...prev].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
        });
      }
    }

    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Add form always at top */}
      <AddBookmarkForm onAdd={handleAdd} />

      {/* Divider */}
      {optimisticBookmarks.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-cream/8" />
          <span className="text-xs text-cream-dim/60">Saved links</span>
          <div className="h-px flex-1 bg-cream/8" />
        </div>
      )}

      {/* List */}
      {optimisticBookmarks.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col gap-2">
          {optimisticBookmarks.map((bookmark, i) => (
            <li
              key={bookmark.id}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <BookmarkItem
                bookmark={bookmark}
                onDelete={handleDelete}
                isDeleting={deletingIds.has(bookmark.id)}
                isOptimistic={bookmark.id.startsWith("optimistic-")}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-cream/10 py-16 text-center animate-fade-in">
      <span className="text-4xl opacity-40">🔖</span>
      <div>
        <p className="text-sm font-medium text-cream-muted">No bookmarks yet</p>
        <p className="mt-0.5 text-xs text-cream-dim">
          Add your first URL above to get started
        </p>
      </div>
    </div>
  );
}
