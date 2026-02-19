"use client";

import { useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Bookmark } from "@/types";
import { BookmarkItem } from "./BookmarkItem";
import { AddBookmarkForm } from "./AddBookmarkForm";
import { Separator } from "@/components/ui/separator";
import { BookmarkX } from "lucide-react";

interface BookmarkListProps {
  initialBookmarks: Bookmark[];
  userId: string;
}

type OptimisticAction =
  | { type: "add"; bookmark: Bookmark }
  | { type: "delete"; id: string };

function bookmarkReducer(state: Bookmark[], action: OptimisticAction): Bookmark[] {
  switch (action.type) {
    case "add":    return [action.bookmark, ...state];
    case "delete": return state.filter(b => b.id !== action.id);
    default:       return state;
  }
}

export function BookmarkList({ initialBookmarks, userId }: BookmarkListProps) {
  const supabase = useMemo(() => createClient(), []);
  const [bookmarks, setBookmarks]           = useState<Bookmark[]>(initialBookmarks);
  const [optimisticBookmarks, dispatch]     = useOptimistic(bookmarks, bookmarkReducer);
  const [deletingIds, setDeletingIds]       = useState<Set<string>>(new Set());
  const [isPending, startTransition]        = useTransition();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  /* ── Realtime subscription ── */
  useEffect(() => {
    const channel = supabase
      .channel("bookmarks-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookmarks", filter: `user_id=eq.${userId}` },
        (payload) => {
          const nb = payload.new as Bookmark;
          setBookmarks(prev => prev.some(b => b.id === nb.id) ? prev : [nb, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "bookmarks" },
        (payload) => {
          const delId = payload.old.id as string;
          setBookmarks(prev => prev.filter(b => b.id !== delId));
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [supabase, userId]);

  /* ── Add ── */
  const handleAdd = async (title: string, url: string) => {
    const tempId = `optimistic-${Date.now()}`;
    const opt: Bookmark = { id: tempId, user_id: userId, title, url, created_at: new Date().toISOString() };

    return new Promise<{ error: string | null }>((resolve) => {
      startTransition(async () => {
        dispatch({ type: "add", bookmark: opt });

        const { data, error } = await supabase
          .from("bookmarks")
          .insert({ title, url, user_id: userId })
          .select()
          .single();

        if (error) {
          setBookmarks(prev => prev.filter(b => b.id !== tempId));
          resolve({ error: error.message });
          return;
        }

        setBookmarks(prev => prev.map(b => b.id === tempId ? (data as Bookmark) : b));
        resolve({ error: null });
      });
    });
  };

  /* ── Delete ── */
  const handleDelete = async (id: string) => {
    // console.log("[BookmarkList] Deleting ID:", id);
    setDeletingIds(prev => new Set(prev).add(id));
    
    startTransition(async () => {
      dispatch({ type: "delete", id });

      try {
        const { error, data } = await supabase
          .from("bookmarks")
          .delete()
          .eq("id", id)
          .eq("user_id", userId)
          .select();

        if (error) {
          // console.error("[BookmarkList] Supabase delete error:", error);
          throw error;
        }

        if (!data || data.length === 0) {
          // console.warn("[BookmarkList] No rows deleted. Check RLS or if the record exists.");
          // Trigger a revert by throwing or just manually resetting
          throw new Error("No rows deleted");
        }

        // console.log("[BookmarkList] Delete successful:", data);
        setBookmarks(prev => prev.filter(b => b.id !== id));
      } catch (err) {
        // console.error("[BookmarkList] Deletion failed, reverting UI:", err);
        const original = bookmarks.find(b => b.id === id);
        if (original) {
          setBookmarks(prev => {
            if (prev.some(b => b.id === id)) return prev;
            return [original, ...prev].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
          });
        }
      } finally {
        setDeletingIds(prev => {
          const n = new Set(prev);
          n.delete(id);
          return n;
        });
      }
    });
  };

  // Filter out items that are currently being deleted to ensure they stay hidden
  // even if the optimistic transition ends before the base state is updated.
  const displayBookmarks = optimisticBookmarks.filter(b => !deletingIds.has(b.id));

  return (
    <div className="flex flex-col gap-10">
      <AddBookmarkForm onAdd={handleAdd} />

      {displayBookmarks.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50">
              Saved Bookmarks ({displayBookmarks.length})
            </h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <ul className="stagger flex flex-col gap-4">
            {displayBookmarks.map(bookmark => (
              <li key={bookmark.id}>
                <BookmarkItem
                  bookmark={bookmark}
                  onDelete={handleDelete}
                  isDeleting={deletingIds.has(bookmark.id)}
                  isOptimistic={bookmark.id.startsWith("optimistic-")}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {displayBookmarks.length === 0 && <EmptyState />}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-14 text-center animate-fade-up">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ch-2 border border-border">
        <BookmarkX className="h-4 w-4 text-muted-foreground/50" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">No bookmarks yet</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Add your first link above to get started
        </p>
      </div>
    </div>
  );
}