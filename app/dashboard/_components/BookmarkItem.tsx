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
  const isLocal    = bookmark.url.toLowerCase().includes("localhost") || 
                     bookmark.url.includes("127.0.0.1") ||
                     bookmark.url.startsWith("/");
  const faviconUrl = isLocal
    ? `https://www.google.com/s2/favicons?sz=64&domain_url=https://supabase.com` // Fallback for local
    : `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(bookmark.url)}`;

  const handleDeleteClick = () => {
    if (confirmDelete) {
      // console.log("[BookmarkItem] Confirming delete for:", bookmark.id);
      onDelete(bookmark.id);
    }
    else {
      // console.log("[BookmarkItem] First click delete for:", bookmark.id);
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <Card
      className={`group relative flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 rounded-2xl
        ${isDeleting || isOptimistic
          ? "border-border/40 opacity-50"
          : "border-border/40 bg-card/30 hover:border-primary/20 hover:bg-card/50"
        }`}
    >
      <div className="flex flex-col h-full p-5">
        <div className="flex items-start justify-between mb-4">
          {/* Favicon / Icon Area */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/50 transition-colors group-hover:bg-background shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={faviconUrl}
              alt=""
              className="h-5 w-5 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>

          {!isOptimistic && !isDeleting && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(bookmark.id);
              }}
              className="h-8 w-8 shrink-0 rounded-lg opacity-0 group-hover:opacity-100 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
              title="Delete bookmark"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {isDeleting && (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground/40" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link block mb-2"
            tabIndex={isOptimistic ? -1 : 0}
          >
            <div className="flex items-start gap-1 justify-between">
              <span className="text-sm font-bold leading-tight tracking-tight text-foreground/90 transition-colors group-hover/link:text-primary line-clamp-2">
                {bookmark.title}
              </span>
              <ExternalLink className="h-3 w-3 mt-0.5 shrink-0 opacity-0 group-hover/link:opacity-40 transition-all" />
            </div>
          </a>

          <div className="mt-auto pt-4 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="truncate text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.15em]">{domain}</span>
            </div>
            {!isOptimistic ? (
              <span className="text-[10px] text-muted-foreground/30 font-medium">
                {formatDate(bookmark.created_at)}
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground/30 italic">Saving…</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}