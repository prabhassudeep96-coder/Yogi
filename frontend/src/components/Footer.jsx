import { Phone, MessageCircle, Mail, MapPin } from "lucide-react";

const digits = (s) => (s || "").replace(/[^\d]/g, "");

export function Footer({ settings }) {
  const s = settings || {};
  const wa = digits(s.whatsapp);
  return (
    <footer className="mt-20 border-t border-border bg-muted/40" data-testid="site-footer">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <img src="/yogi-logo.png" alt="logo" className="h-9 w-9 rounded-full object-cover" />
              <h2 className="font-display text-xl font-semibold tracking-tight">
                About {s.brand_name || "YOGI INTERNET"}
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground" data-testid="footer-about">
              {s.about}
            </p>
            {s.footer_info ? (
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground" data-testid="footer-info">
                {s.footer_info}
              </p>
            ) : null}
            <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              {s.location_text || "GAURIBIDANURU"}
            </div>
          </div>

          <div className="md:justify-self-end">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Contact Us
            </h3>
            <div className="space-y-3">
              {s.landline ? (
                <a
                  href={`tel:${digits(s.landline)}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  data-testid="contact-landline"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Phone className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-xs text-muted-foreground">Landline</span>
                    <span className="font-medium text-foreground">{s.landline}</span>
                  </span>
                </a>
              ) : null}
              {s.whatsapp ? (
                <a
                  href={`https://wa.me/${wa}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  data-testid="contact-whatsapp"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                    <MessageCircle className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-xs text-muted-foreground">WhatsApp</span>
                    <span className="font-medium text-foreground">{s.whatsapp}</span>
                  </span>
                </a>
              ) : null}
              {s.gmail ? (
                <a
                  href={`mailto:${s.gmail}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  data-testid="contact-gmail"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                    <Mail className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-xs text-muted-foreground">Email</span>
                    <span className="font-medium text-foreground">{s.gmail}</span>
                  </span>
                </a>
              ) : null}
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {s.brand_name || "YOGI INTERNET"} · {s.location_text || "GAURIBIDANURU"}
        </div>
      </div>
    </footer>
  );
}
