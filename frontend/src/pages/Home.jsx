import { useEffect, useMemo, useState } from "react";
import { Search, Flame, Inbox } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ApplicationCard } from "@/components/ApplicationCard";
import { ApplicationModal } from "@/components/ApplicationModal";

function matchApp(app, q) {
  if (!q) return true;
  const hay = [
    app.name,
    app.short_description,
    app.full_description,
    app.category,
    ...(app.keywords || []),
    ...(app.documents_required || []),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q.toLowerCase().trim());
}

export default function Home() {
  const [settings, setSettings] = useState(null);
  const [apps, setApps] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/settings").then((r) => setSettings(r.data)),
      api.get("/applications").then((r) => setApps(r.data)),
      api.get("/categories").then((r) => setCategories(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const searching = query.trim() !== "" || activeCat !== null;
  const filtered = useMemo(
    () => apps.filter((a) => matchApp(a, query) && (activeCat ? a.category === activeCat : true)),
    [apps, query, activeCat]
  );
  const trending = apps.filter((a) => a.trending);
  const others = apps.filter((a) => !a.trending);

  return (
    <div className="min-h-screen bg-background">
      <Header settings={settings} />

      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <h1 className="animate-fade-up font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Your gateway to online services
          </h1>
          <p className="animate-fade-up mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground" style={{ animationDelay: "60ms" }}>
            Search government applications, scholarships, certificates and documents — all in one place at{" "}
            {settings?.brand_name || "YOGI INTERNET"}.
          </p>
          <div className="animate-fade-up relative mx-auto mt-8 max-w-xl" style={{ animationDelay: "120ms" }}>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search applications, services, documents…"
              className="h-14 rounded-full border-border bg-background pl-12 pr-4 text-base shadow-sm focus-visible:ring-primary"
              data-testid="search-input"
            />
          </div>
          {/* Category chips */}
          {categories.length ? (
            <div className="animate-fade-up mt-6 flex flex-wrap justify-center gap-2" style={{ animationDelay: "180ms" }}>
              <button
                onClick={() => setActiveCat(null)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeCat === null
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
                data-testid="category-chip-all"
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(activeCat === c.name ? null : c.name)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    activeCat === c.name
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`category-chip-${c.id}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Loading applications…</div>
        ) : searching ? (
          <section>
            <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight">
              Search Results {filtered.length ? `(${filtered.length})` : ""}
            </h2>
            {filtered.length ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((a) => (
                  <ApplicationCard key={a.id} app={a} onView={setSelected} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-20 text-center" data-testid="no-results">
                <Inbox className="h-10 w-10 text-muted-foreground" />
                <p className="text-base font-medium text-foreground">No matching applications or services found.</p>
                <p className="text-sm text-muted-foreground">Try a different keyword or category.</p>
              </div>
            )}
          </section>
        ) : apps.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-24 text-center" data-testid="empty-state">
            <Inbox className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium text-foreground">No applications available yet</p>
            <p className="max-w-md text-sm text-muted-foreground">
              New services and applications will appear here soon. Please check back later.
            </p>
          </div>
        ) : (
          <>
            {trending.length ? (
              <section className="mb-16" data-testid="trending-section">
                <h2 className="mb-6 flex items-center gap-2 font-display text-2xl font-semibold tracking-tight">
                  <Flame className="h-6 w-6 text-secondary" />
                  Trending Applications
                </h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {trending.map((a) => (
                    <ApplicationCard key={a.id} app={a} onView={setSelected} />
                  ))}
                </div>
              </section>
            ) : null}

            {others.length ? (
              <section data-testid="all-section">
                <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight">All Applications</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {others.map((a) => (
                    <ApplicationCard key={a.id} app={a} onView={setSelected} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </main>

      <Footer settings={settings} />
      <ApplicationModal app={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}
