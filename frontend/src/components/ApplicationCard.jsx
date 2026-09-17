import { format } from "date-fns";
import { CalendarClock, ArrowRight, AlarmClock } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resolveImg } from "@/lib/api";
import { useLang, daysUntil } from "@/context/LanguageContext";

export function statusColor(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("close")) return "bg-destructive/10 text-destructive border-destructive/20";
  if (s.includes("soon") || s.includes("upcoming")) return "bg-secondary/10 text-secondary border-secondary/20";
  if (s.includes("extend")) return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  return "bg-green-500/10 text-green-600 border-green-500/20";
}

function fmt(d) {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : format(dt, "dd MMM yyyy");
}

export function ApplicationCard({ app, onView }) {
  const { t } = useLang();
  const img = resolveImg(app.thumbnail_url);
  const dleft = daysUntil(app.last_date);
  const showDeadline = dleft !== null && dleft >= 0 && dleft <= 7;
  return (
    <Card
      className="group flex flex-col overflow-hidden border-border transition-transform duration-200 hover:-translate-y-1 hover:shadow-md"
      data-testid={`application-card-${app.id}`}
    >
      <div className="relative h-40 w-full overflow-hidden bg-muted">
        {img ? (
          <img
            src={img}
            alt={app.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
            <span className="font-display text-3xl font-bold text-primary/40">
              {app.name?.[0]?.toUpperCase() || "Y"}
            </span>
          </div>
        )}
        {app.status ? (
          <Badge className={`absolute right-3 top-3 border ${statusColor(app.status)}`} variant="outline">
            {app.status}
          </Badge>
        ) : null}
        {showDeadline ? (
          <Badge
            className="absolute left-3 top-3 gap-1 border-none bg-amber-500 text-white shadow-sm"
            data-testid={`deadline-badge-${app.id}`}
          >
            <AlarmClock className="h-3 w-3 animate-pulse" />
            {dleft === 0 ? t("ends_today") : t("days_left", { n: dleft })}
          </Badge>
        ) : null}
      </div>
      <CardContent className="flex flex-1 flex-col gap-2 p-5">
        {app.category ? (
          <Badge variant="secondary" className="w-fit bg-primary/10 text-primary hover:bg-primary/10">
            {app.category}
          </Badge>
        ) : null}
        <h3 className="font-display text-lg font-semibold leading-snug tracking-tight text-foreground">
          {app.name}
        </h3>
        {app.short_description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{app.short_description}</p>
        ) : null}
        {app.last_date ? (
          <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            {t("last_date")}: {fmt(app.last_date)}
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="p-5 pt-0">
        <Button
          className="w-full gap-2"
          onClick={() => onView(app)}
          data-testid={`view-details-${app.id}`}
        >
          {t("view_details")}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
