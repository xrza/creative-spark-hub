/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { User, FileText, Trophy, Pencil, Check, X, Download } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Navigate } from "react-router-dom";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    pending:  { label: "На рассмотрении", color: "bg-accent text-accent-foreground" },
    approved: { label: "Одобрена",        color: "bg-green-100 text-green-700"      },
    rejected: { label: "Отклонена",       color: "bg-destructive/10 text-destructive" },
};

const PLACE_LABEL: Record<number, string> = {
    1: "🥇 1 место",
    2: "🥈 2 место",
    3: "🥉 3 место",
};

const ROLE_LABEL: Record<string, string> = {
    teacher:     "Педагог",
    participant: "Участник",
    admin:       "Администратор",
};

const ProfilePage = () => {
    const { user, profile: ctxProfile, refreshProfile } = useAuth();
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ full_name: "", email: "", phone: "", city: "" });

    // ─── Профиль из Supabase ─────────────────────────────────────────────
    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ["profile", user?.id],
        enabled: !!user,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user!.id)
                .single();
            if (error) throw error;
            return data;
        },
    });

    // ─── Заявки ─────────────────────────────────────────────────────────
    const { data: applications, isLoading: appsLoading } = useQuery({
        queryKey: ["my-applications", user?.id],
        enabled: !!user,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("applications")
                .select("*, competitions(title, deadline, status)")
                .eq("user_id", user!.id)
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data ?? [];
        },
    });

    // ─── Результаты ─────────────────────────────────────────────────────
    const { data: results } = useQuery({
        queryKey: ["my-results", user?.id],
        enabled: !!user,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("results")
                .select("*, applications!inner(user_id, work_title, nomination, competitions(title))")
                .eq("applications.user_id", user!.id)
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data ?? [];
        },
    });

    // ─── Сохранение профиля ──────────────────────────────────────────────
    const saveProfile = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: form.full_name,
                    email:     form.email,
                    phone:     form.phone,
                    city:      form.city,
                })
                .eq("id", user!.id);
            if (error) throw error;
        },
        onSuccess: async () => {
            toast.success("Профиль обновлён");
            queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
            // Обновляем профиль в контексте авторизации
            if (refreshProfile) await refreshProfile();
            setEditing(false);
        },
        onError: (e: any) => toast.error(e.message),
    });

    // ─── Проверка авторизации ПОСЛЕ всех хуков ───────────────────────────
    if (!user) return <Navigate to="/login" replace />;

    if (profileLoading) {
        return (
            <div className="flex justify-center py-32">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    // Используем профиль из запроса, с фолбэком на контекст
    const p = profile || ctxProfile;

    const startEdit = () => {
        setForm({
            full_name: p?.full_name || "",
            email:     p?.email     || "",
            phone:     p?.phone     || "",
            city:      p?.city      || "",
        });
        setEditing(true);
    };

    const initials = p?.full_name
        ? p.full_name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
        : "?";

    return (
        <div className="py-8">
            <div className="container max-w-4xl">
                <h1 className="font-display text-3xl font-black text-foreground mb-8">Личный кабинет</h1>

                {/* ── Профиль ── */}
                <div className="rounded-2xl border bg-card p-6 mb-6 shadow-playful">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-display text-lg font-bold flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" /> Профиль
                        </h2>
                        {!editing && (
                            <Button variant="outline" size="sm" onClick={startEdit}>
                                <Pencil className="h-4 w-4 mr-1" /> Редактировать
                            </Button>
                        )}
                    </div>

                    {editing ? (
                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label>ФИО</Label>
                                    <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                                </div>
                                <div>
                                    <Label>Email</Label>
                                    <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                                </div>
                                <div>
                                    <Label>Телефон</Label>
                                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+7..." />
                                </div>
                                <div>
                                    <Label>Город</Label>
                                    <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>
                                    <Check className="h-4 w-4 mr-1" />
                                    {saveProfile.isPending ? "Сохранение..." : "Сохранить"}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                                    <X className="h-4 w-4 mr-1" /> Отмена
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start gap-5">
                            {/* Аватар с инициалами */}
                            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
                                {initials}
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 text-sm flex-1">
                                <div><span className="text-muted-foreground">ФИО:</span> <span className="font-medium">{p?.full_name || "—"}</span></div>
                                <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{p?.email || "—"}</span></div>
                                <div><span className="text-muted-foreground">Телефон:</span> <span className="font-medium">{p?.phone || "—"}</span></div>
                                <div><span className="text-muted-foreground">Город:</span> <span className="font-medium">{p?.city || "—"}</span></div>
                                <div>
                                    <span className="text-muted-foreground">Роль:</span>{" "}
                                    <span className="font-medium">{ROLE_LABEL[p?.role] || p?.role || "—"}</span>
                                </div>
                                {p?.created_at && (
                                    <div>
                                        <span className="text-muted-foreground">Аккаунт с:</span>{" "}
                                        <span className="font-medium">{format(new Date(p.created_at), "d MMMM yyyy", { locale: ru })}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Вкладки ── */}
                <Tabs defaultValue="applications">
                    <TabsList className="mb-4">
                        <TabsTrigger value="applications" className="flex items-center gap-1.5">
                            <FileText className="h-4 w-4" /> Мои заявки
                            {applications?.length ? (
                                <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                  {applications.length}
                </span>
                            ) : null}
                        </TabsTrigger>
                        <TabsTrigger value="results" className="flex items-center gap-1.5">
                            <Trophy className="h-4 w-4" /> Мои результаты
                            {results?.length ? (
                                <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                  {results.length}
                </span>
                            ) : null}
                        </TabsTrigger>
                    </TabsList>

                    {/* ── Заявки ── */}
                    <TabsContent value="applications">
                        <div className="rounded-2xl border bg-card p-6 shadow-playful">
                            {appsLoading ? (
                                <div className="flex justify-center py-8">
                                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                </div>
                            ) : !applications?.length ? (
                                <div className="text-center py-12">
                                    <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                                    <p className="text-muted-foreground text-sm">У вас пока нет заявок</p>
                                    <Button variant="outline" className="mt-4" onClick={() => window.location.href = "/competitions"}>
                                        Смотреть конкурсы
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {applications.map((app: any) => {
                                        const st = STATUS_LABEL[app.status] ?? { label: app.status, color: "bg-muted text-muted-foreground" };
                                        return (
                                            <div key={app.id} className="flex items-center justify-between rounded-xl bg-muted/50 p-4 gap-3">
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-sm truncate">{app.work_title}</div>
                                                    <div className="text-xs text-muted-foreground mt-0.5">
                                                        {app.competitions?.title} · {app.nomination}
                                                        {app.participant_name ? ` · ${app.participant_name}` : ""}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-0.5">
                                                        Подана: {format(new Date(app.created_at), "d MMM yyyy", { locale: ru })}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Badge className={st.color}>{st.label}</Badge>
                                                    {app.diploma_url && (
                                                        <a href={app.diploma_url} target="_blank" rel="noopener noreferrer">
                                                            <Button size="sm" variant="outline">
                                                                <Download className="h-4 w-4 mr-1" /> Диплом
                                                            </Button>
                                                        </a>
                                                    )}
                                                    {app.file_url && (
                                                        <a href={app.file_url} target="_blank" rel="noreferrer"
                                                           className="text-xs text-primary hover:underline">
                                                            Работа →
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* ── Результаты ── */}
                    <TabsContent value="results">
                        <div className="rounded-2xl border bg-card p-6 shadow-playful">
                            {!results?.length ? (
                                <div className="text-center py-12">
                                    <Trophy className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                                    <p className="text-muted-foreground text-sm">Результатов пока нет</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {results.map((r: any) => (
                                        <div key={r.id} className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
                                            <div>
                                                <div className="font-semibold text-sm">{r.applications?.work_title}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    {r.applications?.competitions?.title} · {r.applications?.nomination}
                                                </div>
                                                {r.score != null && (
                                                    <div className="text-xs text-muted-foreground mt-0.5">
                                                        Баллы: <span className="font-medium text-foreground">{r.score}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-lg font-bold">
                                                    {PLACE_LABEL[r.place] || `${r.place} место`}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default ProfilePage;