import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, X, Plus, Loader2 } from "lucide-react";
import { api, resolveImg, formatApiErrorDetail } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/DatePicker";

const STATUS_OPTIONS = ["Open", "Closed", "Coming Soon", "Extended"];

const EMPTY = {
  name: "",
  short_description: "",
  full_description: "",
  category: "",
  keywords: [],
  start_date: null,
  last_date: null,
  status: "Open",
  apply_url: "",
  documents_required: [],
  important_instructions: "",
  thumbnail_url: "",
  trending: false,
  published: true,
};

export function ApplicationForm({ open, onClose, onSaved, editing, categories, masterDocs }) {
  const [form, setForm] = useState(EMPTY);
  const [keywordsText, setKeywordsText] = useState("");
  const [customDoc, setCustomDoc] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (editing) {
      setForm({ ...EMPTY, ...editing });
      setKeywordsText((editing.keywords || []).join(", "));
    } else {
      setForm(EMPTY);
      setKeywordsText("");
    }
    setCustomDoc("");
  }, [editing, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleDoc = (name) => {
    setForm((f) => {
      const has = f.documents_required.includes(name);
      return { ...f, documents_required: has ? f.documents_required.filter((d) => d !== name) : [...f.documents_required, name] };
    });
  };

  const addCustomDoc = () => {
    const v = customDoc.trim();
    if (!v) return;
    if (!form.documents_required.includes(v)) set("documents_required", [...form.documents_required, v]);
    setCustomDoc("");
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/admin/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      set("thumbnail_url", data.url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("Application name is required");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      keywords: keywordsText.split(",").map((k) => k.trim()).filter(Boolean),
    };
    try {
      if (editing) {
        await api.put(`/admin/applications/${editing.id}`, payload);
        toast.success("Application updated");
      } else {
        await api.post("/admin/applications", payload);
        toast.success("Application created");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const preview = resolveImg(form.thumbnail_url);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto" data-testid="application-form-modal">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {editing ? "Edit Application" : "Add New Application"}
          </DialogTitle>
          <DialogDescription className="sr-only">Fill in the application details below.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-1.5">
            <Label>Application Name *</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} data-testid="form-name" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category || undefined} onValueChange={(v) => set("category", v)}>
                <SelectTrigger data-testid="form-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger data-testid="form-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Short Description</Label>
            <Input value={form.short_description} onChange={(e) => set("short_description", e.target.value)} data-testid="form-short-desc" />
          </div>

          <div className="space-y-1.5">
            <Label>Full Description</Label>
            <Textarea rows={4} value={form.full_description} onChange={(e) => set("full_description", e.target.value)} data-testid="form-full-desc" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <DatePicker value={form.start_date} onChange={(v) => set("start_date", v)} testId="form-start-date" />
            </div>
            <div className="space-y-1.5">
              <Label>Last Date</Label>
              <DatePicker value={form.last_date} onChange={(v) => set("last_date", v)} testId="form-last-date" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Official Apply URL</Label>
            <Input value={form.apply_url || ""} onChange={(e) => set("apply_url", e.target.value)} placeholder="https://…" data-testid="form-apply-url" />
          </div>

          <div className="space-y-1.5">
            <Label>Keywords (comma separated — helps search)</Label>
            <Input value={keywordsText} onChange={(e) => setKeywordsText(e.target.value)} placeholder="scholarship, student, education" data-testid="form-keywords" />
          </div>

          {/* Documents required */}
          <div className="space-y-2">
            <Label>Documents Required</Label>
            {masterDocs.length ? (
              <div className="flex flex-wrap gap-2">
                {masterDocs.map((d) => {
                  const active = form.documents_required.includes(d.name);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDoc(d.name)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {d.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Tip: add reusable documents in the Documents tab.</p>
            )}
            <div className="flex gap-2">
              <Input
                value={customDoc}
                onChange={(e) => setCustomDoc(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomDoc())}
                placeholder="Add custom document…"
                data-testid="form-custom-doc"
              />
              <Button type="button" variant="outline" onClick={addCustomDoc}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {form.documents_required.length ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {form.documents_required.map((d) => (
                  <Badge key={d} variant="secondary" className="gap-1 pr-1">
                    {d}
                    <button type="button" onClick={() => toggleDoc(d)} className="rounded-full p-0.5 hover:bg-muted-foreground/20">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>Important Instructions</Label>
            <Textarea rows={3} value={form.important_instructions} onChange={(e) => set("important_instructions", e.target.value)} data-testid="form-instructions" />
          </div>

          {/* Thumbnail */}
          <div className="space-y-2">
            <Label>Thumbnail / Poster Image</Label>
            <div className="flex flex-wrap items-center gap-3">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} data-testid="form-file-input" />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-2">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload Image
              </Button>
              <span className="text-xs text-muted-foreground">or paste a URL below</span>
            </div>
            <Input value={form.thumbnail_url || ""} onChange={(e) => set("thumbnail_url", e.target.value)} placeholder="https://image-url…" data-testid="form-thumbnail-url" />
            {preview ? (
              <img src={preview} alt="preview" className="mt-2 h-32 w-full rounded-lg border border-border object-cover sm:w-56" />
            ) : null}
          </div>

          <div className="flex flex-wrap gap-6 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2">
              <Switch checked={form.trending} onCheckedChange={(v) => set("trending", v)} data-testid="form-trending" />
              <Label className="cursor-pointer">Trending</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.published} onCheckedChange={(v) => set("published", v)} data-testid="form-published" />
              <Label className="cursor-pointer">Published</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving} data-testid="form-submit">
            {saving ? "Saving…" : editing ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
