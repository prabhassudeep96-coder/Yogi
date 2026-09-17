import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  FileCheck2,
  Settings as SettingsIcon,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Layers,
  Flame,
  Eye,
  EyeOff,
  Clock,
} from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ApplicationForm } from "@/components/admin/ApplicationForm";
import { statusColor } from "@/components/ApplicationCard";

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <Card className="border-border">
      <CardContent className="flex items-center gap-4 p-5">
        <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <div className="font-display text-2xl font-bold tracking-tight">{value}</div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [apps, setApps] = useState([]);
  const [categories, setCategories] = useState([]);
  const [docs, setDocs] = useState([]);
  const [settings, setSettings] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadAll = useCallback(async () => {
    const [s, a, c, d, st] = await Promise.all([
      api.get("/admin/stats"),
      api.get("/admin/applications"),
      api.get("/categories"),
      api.get("/documents"),
      api.get("/settings"),
    ]);
    setStats(s.data);
    setApps(a.data);
    setCategories(c.data);
    setDocs(d.data);
    setSettings(st.data);
  }, []);

  useEffect(() => {
    loadAll().catch((e) => toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Failed to load"));
  }, [loadAll]);

  const doLogout = () => {
    logout();
    navigate("/admin/login");
  };

  // ---- application actions ----
  const patchApp = async (id, payload) => {
    try {
      await api.patch(`/admin/applications/${id}`, payload);
      await loadAll();
    } catch (e) {
      toast.error("Update failed");
    }
  };

  const deleteApp = async (id) => {
    try {
      await api.delete(`/admin/applications/${id}`);
      toast.success("Application deleted");
      await loadAll();
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const move = async (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= apps.length) return;
    const a = apps[index];
    const b = apps[target];
    await Promise.all([
      api.patch(`/admin/applications/${a.id}`, { order: b.order }),
      api.patch(`/admin/applications/${b.id}`, { order: a.order }),
    ]);
    await loadAll();
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <img src="/yogi-logo.png" alt="logo" className="h-9 w-9 rounded-full object-cover ring-2 ring-primary/20" />
            <div className="leading-tight">
              <div className="font-display text-base font-semibold tracking-tight">Admin Panel</div>
              <div className="text-[11px] text-muted-foreground">{user?.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2" data-testid="view-site-link">
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">View Site</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" className="gap-2" onClick={doLogout} data-testid="logout-button">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Tabs defaultValue="dashboard">
          <TabsList className="mb-8 flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
            <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-dashboard">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-applications">
              <FileText className="h-4 w-4" /> Applications
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-documents">
              <FileCheck2 className="h-4 w-4" /> Documents
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-categories">
              <FolderTree className="h-4 w-4" /> Categories
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-contact">
              <SettingsIcon className="h-4 w-4" /> Contact
            </TabsTrigger>
          </TabsList>

          {/* DASHBOARD */}
          <TabsContent value="dashboard">
            <h1 className="mb-6 font-display text-2xl font-semibold tracking-tight">Overview</h1>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              <StatCard icon={Layers} label="Total Applications" value={stats?.total ?? "—"} tone="bg-primary/10 text-primary" />
              <StatCard icon={Flame} label="Trending" value={stats?.trending ?? "—"} tone="bg-secondary/10 text-secondary" />
              <StatCard icon={Eye} label="Published" value={stats?.published ?? "—"} tone="bg-green-500/10 text-green-600" />
              <StatCard icon={EyeOff} label="Unpublished" value={stats?.unpublished ?? "—"} tone="bg-muted-foreground/10 text-muted-foreground" />
              <StatCard icon={Clock} label="Ending Soon" value={stats?.ending_soon ?? "—"} tone="bg-amber-500/10 text-amber-600" />
            </div>
            <div className="mt-8">
              <Button className="gap-2" onClick={() => { setEditing(null); setFormOpen(true); }} data-testid="dashboard-add-app">
                <Plus className="h-4 w-4" /> Add New Application
              </Button>
            </div>
          </TabsContent>

          {/* APPLICATIONS */}
          <TabsContent value="applications">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="font-display text-2xl font-semibold tracking-tight">Applications</h1>
              <Button className="gap-2" onClick={() => { setEditing(null); setFormOpen(true); }} data-testid="add-application-button">
                <Plus className="h-4 w-4" /> Add Application
              </Button>
            </div>

            {apps.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center text-muted-foreground">
                  No applications yet. Click “Add Application” to create your first one.
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden border-border">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden md:table-cell">Category</TableHead>
                        <TableHead className="hidden sm:table-cell">Status</TableHead>
                        <TableHead>Trending</TableHead>
                        <TableHead>Published</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apps.map((a, i) => (
                        <TableRow key={a.id} data-testid={`admin-app-row-${a.id}`}>
                          <TableCell>
                            <div className="flex flex-col">
                              <button onClick={() => move(i, -1)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30" data-testid={`move-up-${a.id}`}>
                                <ArrowUp className="h-4 w-4" />
                              </button>
                              <button onClick={() => move(i, 1)} disabled={i === apps.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30" data-testid={`move-down-${a.id}`}>
                                <ArrowDown className="h-4 w-4" />
                              </button>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{a.name}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {a.category ? <Badge variant="secondary" className="bg-primary/10 text-primary">{a.category}</Badge> : "—"}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {a.status ? <Badge variant="outline" className={`border ${statusColor(a.status)}`}>{a.status}</Badge> : "—"}
                          </TableCell>
                          <TableCell>
                            <Switch checked={a.trending} onCheckedChange={(v) => patchApp(a.id, { trending: v })} data-testid={`toggle-trending-${a.id}`} />
                          </TableCell>
                          <TableCell>
                            <Switch checked={a.published} onCheckedChange={(v) => patchApp(a.id, { published: v })} data-testid={`toggle-published-${a.id}`} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => { setEditing(a); setFormOpen(true); }} data-testid={`edit-app-${a.id}`}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" data-testid={`delete-app-${a.id}`}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete “{a.name}”?</AlertDialogTitle>
                                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteApp(a.id)} data-testid={`confirm-delete-${a.id}`}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* DOCUMENTS */}
          <TabsContent value="documents">
            <DocumentsManager docs={docs} reload={loadAll} />
          </TabsContent>

          {/* CATEGORIES */}
          <TabsContent value="categories">
            <CategoriesManager categories={categories} reload={loadAll} />
          </TabsContent>

          {/* CONTACT */}
          <TabsContent value="contact">
            <ContactManager settings={settings} reload={loadAll} />
          </TabsContent>
        </Tabs>
      </div>

      <ApplicationForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={loadAll}
        editing={editing}
        categories={categories}
        masterDocs={docs}
      />
    </div>
  );
}

// ---------------- Documents Manager ----------------
function DocumentsManager({ docs, reload }) {
  const [name, setName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  const add = async () => {
    if (!name.trim()) return;
    await api.post("/admin/documents", { name: name.trim() });
    setName("");
    reload();
    toast.success("Document added");
  };
  const save = async (id) => {
    await api.put(`/admin/documents/${id}`, { name: editName.trim() });
    setEditId(null);
    reload();
  };
  const del = async (id) => {
    await api.delete(`/admin/documents/${id}`);
    reload();
    toast.success("Document removed");
  };
  const move = async (i, dir) => {
    const t = i + dir;
    if (t < 0 || t >= docs.length) return;
    await Promise.all([
      api.put(`/admin/documents/${docs[i].id}`, { order: docs[t].order }),
      api.put(`/admin/documents/${docs[t].id}`, { order: docs[i].order }),
    ]);
    reload();
  };

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 font-display text-2xl font-semibold tracking-tight">Document Management</h1>
      <p className="mb-6 text-sm text-muted-foreground">Reusable documents you can attach to any application.</p>
      <div className="mb-6 flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="e.g. Aadhaar Card" data-testid="doc-name-input" />
        <Button onClick={add} className="gap-2" data-testid="add-doc-button">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
      <Card className="border-border">
        <CardContent className="divide-y p-0">
          {docs.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No documents added.</div>
          ) : (
            docs.map((d, i) => (
              <div key={d.id} className="flex items-center gap-2 p-3" data-testid={`doc-row-${d.id}`}>
                <div className="flex flex-col">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="text-muted-foreground disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button onClick={() => move(i, 1)} disabled={i === docs.length - 1} className="text-muted-foreground disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                </div>
                {editId === d.id ? (
                  <>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1" />
                    <Button size="sm" onClick={() => save(d.id)}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium">{d.name}</span>
                    <Button size="icon" variant="ghost" onClick={() => { setEditId(d.id); setEditName(d.name); }} data-testid={`edit-doc-${d.id}`}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del(d.id)} data-testid={`delete-doc-${d.id}`}><Trash2 className="h-4 w-4" /></Button>
                  </>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------- Categories Manager ----------------
function CategoriesManager({ categories, reload }) {
  const [name, setName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  const add = async () => {
    if (!name.trim()) return;
    await api.post("/admin/categories", { name: name.trim() });
    setName("");
    reload();
    toast.success("Category added");
  };
  const save = async (id) => {
    await api.put(`/admin/categories/${id}`, { name: editName.trim() });
    setEditId(null);
    reload();
  };
  const del = async (id) => {
    await api.delete(`/admin/categories/${id}`);
    reload();
    toast.success("Category removed");
  };

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-semibold tracking-tight">Categories</h1>
      <div className="mb-6 flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="e.g. Government Services" data-testid="cat-name-input" />
        <Button onClick={add} className="gap-2" data-testid="add-cat-button">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
      <Card className="border-border">
        <CardContent className="divide-y p-0">
          {categories.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No categories.</div>
          ) : (
            categories.map((c) => (
              <div key={c.id} className="flex items-center gap-2 p-3" data-testid={`cat-row-${c.id}`}>
                {editId === c.id ? (
                  <>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1" />
                    <Button size="sm" onClick={() => save(c.id)}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium">{c.name}</span>
                    <Button size="icon" variant="ghost" onClick={() => { setEditId(c.id); setEditName(c.name); }} data-testid={`edit-cat-${c.id}`}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del(c.id)} data-testid={`delete-cat-${c.id}`}><Trash2 className="h-4 w-4" /></Button>
                  </>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------- Contact Manager ----------------
function ContactManager({ settings, reload }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  if (!form) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/admin/settings", form);
      toast.success("Contact information updated");
      reload();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-semibold tracking-tight">Contact & About</h1>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Brand Name</Label>
            <Input value={form.brand_name || ""} onChange={(e) => set("brand_name", e.target.value)} data-testid="settings-brand" />
          </div>
          <div className="space-y-1.5">
            <Label>Location Text</Label>
            <Input value={form.location_text || ""} onChange={(e) => set("location_text", e.target.value)} data-testid="settings-location" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>About Description</Label>
          <Textarea rows={4} value={form.about || ""} onChange={(e) => set("about", e.target.value)} data-testid="settings-about" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Landline</Label>
            <Input value={form.landline || ""} onChange={(e) => set("landline", e.target.value)} placeholder="08155-XXXXXX" data-testid="settings-landline" />
          </div>
          <div className="space-y-1.5">
            <Label>WhatsApp</Label>
            <Input value={form.whatsapp || ""} onChange={(e) => set("whatsapp", e.target.value)} placeholder="+91 9XXXXXXXXX" data-testid="settings-whatsapp" />
          </div>
          <div className="space-y-1.5">
            <Label>Gmail</Label>
            <Input value={form.gmail || ""} onChange={(e) => set("gmail", e.target.value)} placeholder="name@gmail.com" data-testid="settings-gmail" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Footer Info (optional)</Label>
          <Textarea rows={2} value={form.footer_info || ""} onChange={(e) => set("footer_info", e.target.value)} data-testid="settings-footer" />
        </div>
        <Button onClick={save} disabled={saving} className="gap-2" data-testid="save-settings-button">
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
