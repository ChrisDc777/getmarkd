"use client";

import { useState, useTransition } from "react";
import { Link2, Plus, Loader2 } from "lucide-react";

interface AddBookmarkFormProps {
  onAdd: (
    title: string,
    url: string
  ) => Promise<{ error: string | null }>;
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function AddBookmarkForm({ onAdd }: AddBookmarkFormProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const validate = () => {
    const newErrors: { title?: string; url?: string } = {};
    if (!title.trim()) newErrors.title = "Title is required";
    const normalized = normalizeUrl(url);
    if (!normalized) {
      newErrors.url = "URL is required";
    } else if (!isValidUrl(normalized)) {
      newErrors.url = "Please enter a valid URL";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;

    const normalizedUrl = normalizeUrl(url);

    startTransition(async () => {
      const { error } = await onAdd(title.trim(), normalizedUrl);
      if (error) {
        setApiError(error);
      } else {
        setTitle("");
        setUrl("");
        setErrors({});
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-cream/10 bg-ink-50 p-5 shadow-lg"
      noValidate
    >
      <div className="mb-4 flex items-center gap-2">
        <Plus className="h-4 w-4 text-amber-accent" />
        <h2
          className="font-serif text-lg text-cream"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          Add bookmark
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="title"
            className="text-xs font-medium uppercase tracking-wider text-cream-dim"
          >
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
            }}
            placeholder="e.g. Supabase Docs"
            disabled={isPending}
            className={`w-full rounded-lg border bg-ink-100 px-3.5 py-2.5 text-sm text-cream placeholder:text-cream-dim/40 transition-colors focus:border-amber-accent/50 focus:outline-none focus:ring-1 focus:ring-amber-accent/30 disabled:opacity-50 ${
              errors.title ? "border-red-500/60" : "border-cream/10"
            }`}
          />
          {errors.title && (
            <p className="text-xs text-red-400">{errors.title}</p>
          )}
        </div>

        {/* URL */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="url"
            className="text-xs font-medium uppercase tracking-wider text-cream-dim"
          >
            URL
          </label>
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cream-dim/40" />
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (errors.url) setErrors((p) => ({ ...p, url: undefined }));
              }}
              placeholder="https://example.com"
              disabled={isPending}
              className={`w-full rounded-lg border bg-ink-100 py-2.5 pl-9 pr-3.5 text-sm text-cream placeholder:text-cream-dim/40 transition-colors focus:border-amber-accent/50 focus:outline-none focus:ring-1 focus:ring-amber-accent/30 disabled:opacity-50 ${
                errors.url ? "border-red-500/60" : "border-cream/10"
              }`}
            />
          </div>
          {errors.url && <p className="text-xs text-red-400">{errors.url}</p>}
        </div>

        {apiError && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {apiError}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-amber-accent px-4 py-2.5 text-sm font-medium text-ink transition-all duration-150 hover:bg-amber-soft active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Save bookmark
            </>
          )}
        </button>
      </div>
    </form>
  );
}
