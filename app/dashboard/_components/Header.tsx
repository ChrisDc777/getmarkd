"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@/types";
import Image from "next/image";

interface HeaderProps {
  user: User;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const avatarUrl = user.user_metadata?.avatar_url;
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-50 border-b border-cream/8 bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🔖</span>
          <span
            className="font-serif text-xl text-cream"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Markd
          </span>
        </div>

        {/* User section */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            {avatarUrl ? (
              <div className="relative h-7 w-7 overflow-hidden rounded-full border border-cream/15">
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="28px"
                />
              </div>
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-cream/15 bg-ink-50 text-xs font-medium text-cream-muted">
                {initials}
              </div>
            )}
            <span className="max-w-[140px] truncate text-xs text-cream-dim">
              {displayName}
            </span>
          </div>

          <div className="h-4 w-px bg-cream/10" aria-hidden="true" />

          <button
            onClick={handleSignOut}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-cream-dim transition-colors hover:bg-accent hover:text-cream"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
