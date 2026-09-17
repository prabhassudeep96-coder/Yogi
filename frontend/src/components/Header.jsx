import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header({ settings }) {
  const navigate = useNavigate();
  const brand = settings?.brand_name || "YOGI INTERNET";
  const location = settings?.location_text || "GAURIBIDANURU";

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-xl"
      data-testid="site-header"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3" data-testid="brand-block">
          <img
            src="/yogi-logo.png"
            alt="YOGI INTERNET logo"
            className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/20 shadow-sm"
            data-testid="brand-logo"
          />
          <div className="leading-tight">
            <div className="font-display text-lg font-700 font-semibold tracking-tight text-foreground sm:text-xl">
              {brand}
            </div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {location}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/admin")}
          data-testid="header-admin-link"
        >
          <ShieldCheck className="h-4 w-4" />
          <span className="hidden sm:inline">Admin</span>
        </Button>
      </div>
    </header>
  );
}
