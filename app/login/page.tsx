import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

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
    const origin = headersList.get("origin") ?? "";

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });

    if (error) { console.error("OAuth error:", error); return; }
    if (data.url) redirect(data.url);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.03),transparent)]">
      <div className="w-full max-w-[400px] animate-fade-in space-y-8">
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 text-4xl shadow-sm border border-border/50">
            🔖
          </div>
          <div>
            <h1 className="text-4xl font-serif font-bold tracking-tight text-foreground" style={{ fontFamily: "var(--font-dm-serif)" }}>
              Markd
            </h1>
            <p className="mt-2 text-muted-foreground font-medium">
              Your private sanctuary for bookmarks.
            </p>
          </div>
        </div>

        {/* Card */}
        <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="text-center p-8 pb-4">
            <CardTitle className="text-xl font-bold">Welcome back</CardTitle>
            <CardDescription className="text-sm">
              Sign in to access your curated library of links.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <form action={signInWithGoogle}>
              <Button
                type="submit"
                variant="outline"
                className="w-full h-11 gap-3 border-border/60 bg-background hover:bg-muted/50 transition-all font-semibold"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>
            </form>
          </CardContent>

          <CardFooter className="bg-muted/30 border-t border-border/40 p-4">
            <p className="text-center w-full text-[11px] text-muted-foreground/60 font-medium">
              Securely powered by Supabase Auth & RLS
            </p>
          </CardFooter>
        </Card>

        <div className="flex flex-col items-center gap-2">
          <p className="text-[11px] text-muted-foreground/40 font-bold uppercase tracking-[0.2em]">
            Built with Passion
          </p>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground/30">
            <span>Next.js 15</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>Supabase</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>Tailwind CSS</span>
          </div>
        </div>
      </div>
    </main>
  );
}