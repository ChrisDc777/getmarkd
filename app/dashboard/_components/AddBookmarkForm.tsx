"use client";

import { useState, useTransition } from "react";
import { Link2, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface AddBookmarkFormProps {
  onAdd: (title: string, url: string) => Promise<{ error: string | null }>;
}

function normalizeUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function isValidUrl(url: string): boolean {
  try { new URL(url); return true; } catch { return false; }
}

export function AddBookmarkForm({ onAdd }: AddBookmarkFormProps) {
  const [title, setTitle]       = useState("");
  const [url, setUrl]           = useState("");
  const [errors, setErrors]     = useState<{ title?: string; url?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isPending, start]      = useTransition();

  const validate = () => {
    const e: { title?: string; url?: string } = {};
    if (!title.trim()) e.title = "Required";
    const n = normalizeUrl(url);
    if (!n) e.url = "Required";
    else if (!isValidUrl(n)) e.url = "Enter a valid URL";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    setApiError(null);
    if (!validate()) return;

    start(async () => {
      const { error } = await onAdd(title.trim(), normalizeUrl(url));
      if (error) { setApiError(error); }
      else { setTitle(""); setUrl(""); setErrors({}); }
    });
  };

  return (
    <Card className="overflow-hidden border-border/50 bg-card/30 backdrop-blur-sm">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col sm:flex-row items-end gap-3 p-4">
          <div className="grid w-full gap-1.5 flex-[2]">
            <Label htmlFor="bm-title" className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-bold ml-1">Title</Label>
            <Input
              id="bm-title"
              value={title}
              onChange={e => { setTitle(e.target.value); setErrors(p => ({...p, title: undefined})); }}
              placeholder="e.g. Supabase Docs"
              disabled={isPending}
              className={`h-9 bg-background/50 border-border/40 focus:border-primary/30 transition-all ${
                errors.title ? "border-destructive/50 ring-destructive/20" : ""
              }`}
            />
          </div>

          <div className="grid w-full gap-1.5 flex-[3]">
            <Label htmlFor="bm-url" className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-bold ml-1">URL</Label>
            <div className="relative">
              <Link2 className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40 pointer-events-none" />
              <Input
                id="bm-url"
                type="url"
                value={url}
                onChange={e => { setUrl(e.target.value); setErrors(p => ({...p, url: undefined})); }}
                placeholder="https://example.com"
                disabled={isPending}
                className={`h-9 pl-8 bg-background/50 border-border/40 focus:border-primary/30 transition-all ${
                  errors.url ? "border-destructive/50 ring-destructive/20" : ""
                }`}
              />
            </div>
          </div>

          <Button type="submit" disabled={isPending} size="sm" className="h-9 px-4 gap-2 font-medium">
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Add
          </Button>
        </form>

        {(errors.title || errors.url || apiError) && (
          <div className="border-t border-border/40 bg-destructive/5 px-4 py-2 flex items-center gap-2">
            <span className="text-[11px] font-medium text-destructive">
              {errors.title || errors.url || apiError}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}