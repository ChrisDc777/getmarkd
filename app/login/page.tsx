import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  async function signInWithGoogle() {
    "use server";
    const supabase = await createClient();
    const headersList = await headers();
    const host = headersList.get("host");
    const protocol = headersList.get("x-forwarded-proto") || "http";
    const origin = `${protocol}://${host}`;
    
    console.log("Login origin:", origin);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error("OAuth error:", error);
      return;
    }

    if (data.url) redirect(data.url);
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      {/* Background accent blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-accent/5 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-amber-accent/3 blur-[80px]"
      />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-10 animate-fade-in">
        {/* Logo / wordmark */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cream/10 bg-ink-50 text-3xl shadow-lg">
            🔖
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1
              className="font-serif text-5xl tracking-tight text-cream"
              style={{ fontFamily: "var(--font-dm-serif)" }}
            >
              Markd
            </h1>
            <p className="text-sm text-cream-dim">
              Your private bookmark collection.
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="w-full rounded-2xl border border-cream/10 bg-ink-50 p-8 shadow-2xl">
          <div className="mb-6 flex flex-col gap-1">
            <h2
              className="font-serif text-2xl text-cream"
              style={{ fontFamily: "var(--font-dm-serif)" }}
            >
              Welcome back
            </h2>
            <p className="text-sm text-cream-dim">
              Sign in to access your bookmarks
            </p>
          </div>

          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-cream/15 bg-ink-100 px-5 py-3.5 text-sm font-medium text-cream transition-all duration-200 hover:border-amber-accent/40 hover:bg-ink-50 hover:text-amber-soft active:scale-[0.98]"
            >
              <svg
                className="h-4 w-4 flex-shrink-0"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-cream-dim">
            By signing in, you agree that your bookmarks are private and secure.
          </p>
        </div>

        <p className="text-xs text-cream-dim/60">
          Built with Next.js + Supabase
        </p>
      </div>
    </main>
  );
}
