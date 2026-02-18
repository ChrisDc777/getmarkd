"use client";

import { useState } from "react";
import { ExternalLink, Trash2, Loader2 } from "lucide-react";
import type { Bookmark } from "@/types";

interface BookmarkItemProps {
  bookmark: Bookmark;
  onDelete: (id: string) => Promise<void>;
  isDeleting: boolean;
  isOptimistic: boolean;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function BookmarkItem({
  bookmark,
  onDelete,
  isDeleting,
  isOptimistic,
}: BookmarkItemProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const domain = getDomain(bookmark.url);
  const faviconUrl = `https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(bookmark.url)}`;

  const handleDeleteClick = () => {
    if (showConfirm) {
      onDelete(bookmark.id);
    } else {
      setShowConfirm(true);
      // Auto-reset after 3s
      setTimeout(() => setShowConfirm(false), 3000);
    }
  };

  return (
    <div
      className={`group flex items-center gap-3 rounded-xl border bg-ink-50 px-4 py-3.5 transition-all duration-200 hover:border-cream/15 ${
        isDeleting || isOptimistic
          ? "border-cream/5 opacity-50"
          : "border-cream/8"
      }`}
    >
      {/* Favicon */}
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-cream/8 bg-ink-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={faviconUrl}
          alt=""
          className="h-4 w-4"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group/link flex items-center gap-1.5"
        >
          <span className="truncate text-sm font-medium text-cream transition-colors group-hover/link:text-amber-soft">
            {bookmark.title}
          </span>
          <ExternalLink className="h-3 w-3 flex-shrink-0 text-cream-dim/0 transition-all group-hover/link:text-amber-accent/60" />
        </a>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="truncate text-xs text-cream-dim/60">{domain}</span>
          {!isOptimistic && (
            <>
              <span className="text-cream-dim/30" aria-hidden="true">
                ·
              </span>
              <span className="flex-shrink-0 text-xs text-cream-dim/40">
                {formatDate(bookmark.created_at)}
              </span>
            </>
          )}
          {isOptimistic && (
            <span className="text-xs text-amber-accent/50">Saving…</span>
          )}
        </div>
      </div>

      {/* Delete */}
      {!isOptimistic && !isDeleting && (
        <button
          onClick={handleDeleteClick}
          className={`flex-shrink-0 rounded-lg p-1.5 transition-all duration-150 ${
            showConfirm
              ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
              : "text-cream-dim/0 hover:bg-accent hover:text-cream-dim group-hover:text-cream-dim/40"
          }`}
          aria-label={showConfirm ? "Confirm delete" : "Delete bookmark"}
          title={showConfirm ? "Click again to confirm" : "Delete"}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}

      {isDeleting && (
        <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin text-cream-dim/40" />
      )}
    </div>
  );
}
