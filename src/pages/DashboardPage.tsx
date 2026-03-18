import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, FileText, Download } from "lucide-react";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  pending: "На рассмотрении",
  approved: "Одобрена",
  rejected: "Отклонена",
};

const statusColors: Record<string, string> = {
  pending: "bg-accent text-accent-foreground",
  approved: "bg-success text-success-foreground",
  rejected: "bg-destructive text-destructive-foreground",
};

const DashboardPage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    city: profile?.city || "",
  });
  const [saving, setSaving] = useState(false);

  const { data: applications, isLoading } = useQuery({
    queryKey: ["my-applications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*, competitions(title, status)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        phone: form.phone,
        city: form.city,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Ошибка сохранения");
    } else {
      toast.success("Профиль обновлён");
      await refreshProfile();
      setEditing(false);
    }
  };

  return (
    <div className="py-8">
      <div className="container max-w-4xl">
        <h1 className="font-display text-3xl font-black text-foreground mb-8">Личный кабинет</h1>

        {/* Profile Section */}
        <div className="rounded-2xl border bg-card p-6 mb-8 shadow-playful">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Профиль
            </h2>
            <Button variant="outline" size="sm" onClick={() => {
              if (editing) handleSaveProfile();
              else {
                setForm({
                  full_name: profile?.full_name || "",
                  phone: profile?.phone || "",
                  city: profile?.city || "",
                });
                setEditing(true);
              }
            }} disabled={saving}>
              {saving ? "Сохранение..." : editing ? "Сохранить" : "Редактировать"}
            </Button>
          </div>

          {editing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>ФИО</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={profile?.email || ""} disabled />
              </div>
              <div>
                <Label>Телефон</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label>Город</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div><span className="text-muted-foreground">ФИО:</span> {profile?.full_name || "—"}</div>
              <div><span className="text-muted-foreground">Email:</span> {profile?.email || "—"}</div>
              <div><span className="text-muted-foreground">Телефон:</span> {profile?.phone || "—"}</div>
              <div><span className="text-muted-foreground">Город:</span> {profile?.city || "—"}</div>
              <div><span className="text-muted-foreground">Роль:</span> {profile?.role === "teacher" ? "Педагог" : "Участник"}</div>
            </div>
          )}
        </div>

        {/* Applications */}
        <div className="rounded-2xl border bg-card p-6 shadow-playful">
          <h2 className="font-display text-lg font-bold flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-primary" /> Мои заявки
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : !applications?.length ? (
            <p className="text-muted-foreground text-sm py-4">У вас пока нет заявок</p>
          ) : (
            <div className="space-y-3">
              {applications.map((app: any) => (
                <div key={app.id} className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
                  <div>
                    <div className="font-semibold text-sm">{app.work_title}</div>
                    <div className="text-xs text-muted-foreground">
                      {app.competitions?.title} · {app.nomination} · {app.participant_name}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[app.status]}>{statusLabels[app.status]}</Badge>
                    {app.diploma_url && (
                      <a href={app.diploma_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" /> Диплом
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
