"use client";

import { useState } from "react";
import { ExternalLink, Trash2, Loader2 } from "lucide-react";
import type { Bookmark } from "@/types";
import { Button } from "@/components/ui/button";

interface BookmarkItemProps {
  bookmark: Bookmark;
  onDelete: (id: string) => Promise<void>;
  isDeleting: boolean;
  isOptimistic: boolean;
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return url; }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

import { Card } from "@/components/ui/card";

export function BookmarkItem({ bookmark, onDelete, isDeleting, isOptimistic }: BookmarkItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const domain     = getDomain(bookmark.url);
  const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(bookmark.url)}`;

  const handleDeleteClick = () => {
    if (confirmDelete) { onDelete(bookmark.id); }
    else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-300 hover:shadow-md
        ${isDeleting || isOptimistic
          ? "border-border/40 opacity-50"
          : "border-border/50 bg-card/40 hover:border-primary/20 hover:bg-card/60"
        }`}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Favicon / Icon Area */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/50 transition-colors group-hover:bg-background">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={faviconUrl}
            alt=""
            className="h-5 w-5 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link block"
            tabIndex={isOptimistic ? -1 : 0}
          >
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold tracking-tight text-foreground/90 transition-colors group-hover/link:text-primary">
                {bookmark.title}
              </span>
              <ExternalLink className="h-3 w-3 shrink-0 opacity-0 -translate-y-0.5 translate-x-1 group-hover/link:opacity-40 group-hover/link:translate-x-0 group-hover/link:translate-y-0 transition-all font-bold" />
            </div>
          </a>

          <div className="mt-1 flex items-center gap-2">
            <span className="truncate text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest">{domain}</span>
            {!isOptimistic && (
              <>
                <span className="h-0.5 w-0.5 rounded-full bg-muted-foreground/30" />
                <span className="shrink-0 text-[11px] text-muted-foreground/40 font-medium">
                  {formatDate(bookmark.created_at)}
                </span>
              </>
            )}
            {isOptimistic && (
              <span className="text-[11px] text-muted-foreground/40 italic">Saving…</span>
            )}
          </div>
        </div>

        {/* Delete Action */}
        <div className="flex items-center gap-1">
          {!isOptimistic && !isDeleting && (
            <Button
              variant={confirmDelete ? "destructive" : "ghost"}
              size="icon"
              onClick={handleDeleteClick}
              className={`h-8 w-8 shrink-0 rounded-lg transition-all
                ${confirmDelete ? "opacity-100 ring-2 ring-destructive/20" : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"}`}
              title={confirmDelete ? "Click again to confirm" : "Delete"}
              aria-label={confirmDelete ? "Confirm delete" : "Delete bookmark"}
            >
              <Trash2 className={confirmDelete ? "h-3.5 w-3.5" : "h-4 w-4"} />
            </Button>
          )}
          {isDeleting && (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground/40" />
          )}
        </div>
      </div>
    </Card>
  );
}