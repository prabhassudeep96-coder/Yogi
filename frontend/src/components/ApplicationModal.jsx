import { format } from "date-fns";
import { CalendarDays, CalendarClock, ExternalLink, FileCheck2, Info, Tag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { resolveImg } from "@/lib/api";
import { statusColor } from "@/components/ApplicationCard";
import { useLang } from "@/context/LanguageContext";

function fmt(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : format(dt, "dd MMM yyyy");
}

export function ApplicationModal({ app, open, onClose }) {
  const { t } = useLang();
  if (!app) return null;
  const img = resolveImg(app.thumbnail_url);
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-h-[90vh] max-w-2xl overflow-y-auto p-0"
        data-testid="application-detail-modal"
      >
        {img ? (
          <div className="h-48 w-full overflow-hidden rounded-t-lg bg-muted sm:h-56">
            <img src={img} alt={app.name} className="h-full w-full object-cover" />
          </div>
        ) : null}
        <div className="p-6">
          <DialogHeader className="space-y-3 text-left">
            <div className="flex flex-wrap items-center gap-2">
              {app.category ? (
                <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary hover:bg-primary/10">
                  <Tag className="h-3 w-3" />
                  {app.category}
                </Badge>
              ) : null}
              {app.status ? (
                <Badge variant="outline" className={`border ${statusColor(app.status)}`}>
                  {app.status}
                </Badge>
              ) : null}
            </div>
            <DialogTitle className="font-display text-2xl font-semibold tracking-tight" data-testid="modal-app-name">
              {app.name}
            </DialogTitle>
            <DialogDescription className="sr-only">Application details for {app.name}</DialogDescription>
          </DialogHeader>

          {app.full_description || app.short_description ? (
            <div className="mt-4">
              <h4 className="mb-1 text-sm font-semibold text-foreground">{t("about_desc")}</h4>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {app.full_description || app.short_description}
              </p>
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" /> {t("start_date")}
              </div>
              <div className="mt-1 text-sm font-semibold text-foreground">{fmt(app.start_date)}</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" /> {t("last_date_label")}
              </div>
              <div className="mt-1 text-sm font-semibold text-foreground">{fmt(app.last_date)}</div>
            </div>
          </div>

          {app.documents_required?.length ? (
            <>
              <Separator className="my-5" />
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <FileCheck2 className="h-4 w-4 text-primary" /> {t("documents_required")}
                </h4>
                <ul className="grid gap-2 sm:grid-cols-2" data-testid="modal-documents-list">
                  {app.documents_required.map((doc, i) => (
                    <li key={i} className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
                      <FileCheck2 className="h-4 w-4 shrink-0 text-green-600" />
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}

          {app.important_instructions ? (
            <>
              <Separator className="my-5" />
              <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-4">
                <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Info className="h-4 w-4 text-secondary" /> {t("important_instructions")}
                </h4>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {app.important_instructions}
                </p>
              </div>
            </>
          ) : null}

          {app.apply_url ? (
            <div className="mt-6">
              <a href={app.apply_url} target="_blank" rel="noopener noreferrer">
                <Button className="w-full gap-2" data-testid="modal-apply-button">
                  {t("apply_now")}
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
