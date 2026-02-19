"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@/types";
import Image from "next/image";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

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
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5 text-lg">
            🔖
          </div>
          <span
            className="font-serif text-xl font-bold text-foreground tracking-tight"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Markd
          </span>
        </div>

        {/* User section */}
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2.5 sm:flex">
            <Avatar className="h-8 w-8 border border-border/50">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="text-[10px] bg-muted/50 text-muted-foreground uppercase">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col -gap-0.5">
              <span className="max-w-[140px] truncate text-[11px] font-semibold text-foreground/80">
                {displayName}
              </span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Pro Account</span>
            </div>
          </div>

          <div className="h-4 w-px bg-border/40" aria-hidden="true" />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="h-8 gap-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all font-medium"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
