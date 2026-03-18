import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trophy, FileText, BarChart3, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

const AdminPage = () => {
  const queryClient = useQueryClient();

  // Competitions
  const { data: competitions } = useQuery({
    queryKey: ["admin-competitions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("competitions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Applications
  const { data: applications } = useQuery({
    queryKey: ["admin-applications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("applications").select("*, competitions(title)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Stats
  const totalCompetitions = competitions?.length || 0;
  const totalApplications = applications?.length || 0;
  const uniqueParticipants = new Set(applications?.map((a: any) => a.user_id)).size;

  // Competition form
  const [compForm, setCompForm] = useState({
    title: "", description: "", category: "children", nomination: "",
    age_from: "3", age_to: "18", deadline: "", entry_fee: "0", prize: "", image_url: "", status: "active",
  });
  const [compDialogOpen, setCompDialogOpen] = useState(false);
  const [editingCompId, setEditingCompId] = useState<string | null>(null);

  const saveCompetition = useMutation({
    mutationFn: async () => {
      const payload = {
        title: compForm.title,
        description: compForm.description,
        category: compForm.category,
        nomination: compForm.nomination.split(",").map((s) => s.trim()).filter(Boolean),
        age_from: parseInt(compForm.age_from),
        age_to: parseInt(compForm.age_to),
        deadline: compForm.deadline || null,
        entry_fee: parseInt(compForm.entry_fee),
        prize: compForm.prize,
        image_url: compForm.image_url,
        status: compForm.status,
      };
      if (editingCompId) {
        const { error } = await supabase.from("competitions").update(payload).eq("id", editingCompId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("competitions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingCompId ? "Конкурс обновлён" : "Конкурс создан");
      queryClient.invalidateQueries({ queryKey: ["admin-competitions"] });
      setCompDialogOpen(false);
      resetCompForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteCompetition = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("competitions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Конкурс удалён");
      queryClient.invalidateQueries({ queryKey: ["admin-competitions"] });
    },
  });

  const resetCompForm = () => {
    setCompForm({ title: "", description: "", category: "children", nomination: "", age_from: "3", age_to: "18", deadline: "", entry_fee: "0", prize: "", image_url: "", status: "active" });
    setEditingCompId(null);
  };

  const editComp = (comp: any) => {
    setCompForm({
      title: comp.title,
      description: comp.description || "",
      category: comp.category,
      nomination: (comp.nomination || []).join(", "),
      age_from: String(comp.age_from ?? 3),
      age_to: String(comp.age_to ?? 18),
      deadline: comp.deadline ? new Date(comp.deadline).toISOString().slice(0, 16) : "",
      entry_fee: String(comp.entry_fee ?? 0),
      prize: comp.prize || "",
      image_url: comp.image_url || "",
      status: comp.status,
    });
    setEditingCompId(comp.id);
    setCompDialogOpen(true);
  };

  // Application status update
  const updateAppStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("applications").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Статус обновлён");
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
    },
  });

  // Results: assign place
  const assignPlace = useMutation({
    mutationFn: async ({ applicationId, competitionId, place, score }: { applicationId: string; competitionId: string; place: number; score: number }) => {
      const { error } = await supabase.from("results").upsert(
        { application_id: applicationId, competition_id: competitionId, place, score },
        { onConflict: "application_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Результат сохранён");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Filter apps by competition
  const [filterCompId, setFilterCompId] = useState<string>("all");
  const filteredApps = filterCompId === "all" ? applications : applications?.filter((a: any) => a.competition_id === filterCompId);

  return (
    <div className="py-8">
      <div className="container">
        <h1 className="font-display text-3xl font-black text-foreground mb-8">Админ-панель</h1>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          {[
            { icon: Trophy, label: "Конкурсов", value: totalCompetitions },
            { icon: FileText, label: "Заявок", value: totalApplications },
            { icon: BarChart3, label: "Участников", value: uniqueParticipants },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-2xl border bg-card p-6 shadow-playful">
              <Icon className="h-6 w-6 text-primary mb-2" />
              <div className="font-display text-2xl font-black text-foreground">{value}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="competitions">
          <TabsList className="mb-6">
            <TabsTrigger value="competitions">Конкурсы</TabsTrigger>
            <TabsTrigger value="applications">Заявки</TabsTrigger>
            <TabsTrigger value="results">Результаты</TabsTrigger>
          </TabsList>

          {/* Competitions Tab */}
          <TabsContent value="competitions">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-lg font-bold">Управление конкурсами</h2>
              <Dialog open={compDialogOpen} onOpenChange={(v) => { setCompDialogOpen(v); if (!v) resetCompForm(); }}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-1" /> Создать конкурс</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingCompId ? "Редактировать" : "Новый"} конкурс</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 mt-4">
                    <div><Label>Название *</Label><Input value={compForm.title} onChange={(e) => setCompForm({ ...compForm, title: e.target.value })} /></div>
                    <div><Label>Описание</Label><Textarea value={compForm.description} onChange={(e) => setCompForm({ ...compForm, description: e.target.value })} /></div>
                    <div><Label>Категория</Label>
                      <Select value={compForm.category} onValueChange={(v) => setCompForm({ ...compForm, category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="children">Для детей</SelectItem>
                          <SelectItem value="teachers">Для педагогов</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Номинации (через запятую)</Label><Input value={compForm.nomination} onChange={(e) => setCompForm({ ...compForm, nomination: e.target.value })} placeholder="Рисунок, Поделка, Фотография" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Возраст от</Label><Input type="number" value={compForm.age_from} onChange={(e) => setCompForm({ ...compForm, age_from: e.target.value })} /></div>
                      <div><Label>Возраст до</Label><Input type="number" value={compForm.age_to} onChange={(e) => setCompForm({ ...compForm, age_to: e.target.value })} /></div>
                    </div>
                    <div><Label>Дедлайн</Label><Input type="datetime-local" value={compForm.deadline} onChange={(e) => setCompForm({ ...compForm, deadline: e.target.value })} /></div>
                    <div><Label>Взнос (₽)</Label><Input type="number" value={compForm.entry_fee} onChange={(e) => setCompForm({ ...compForm, entry_fee: e.target.value })} /></div>
                    <div><Label>Приз</Label><Input value={compForm.prize} onChange={(e) => setCompForm({ ...compForm, prize: e.target.value })} /></div>
                    <div><Label>URL изображения</Label><Input value={compForm.image_url} onChange={(e) => setCompForm({ ...compForm, image_url: e.target.value })} /></div>
                    <div><Label>Статус</Label>
                      <Select value={compForm.status} onValueChange={(v) => setCompForm({ ...compForm, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Активный</SelectItem>
                          <SelectItem value="upcoming">Скоро</SelectItem>
                          <SelectItem value="judging">Оценка</SelectItem>
                          <SelectItem value="finished">Завершён</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full" onClick={() => saveCompetition.mutate()} disabled={saveCompetition.isPending}>
                      {saveCompetition.isPending ? "Сохранение..." : editingCompId ? "Сохранить" : "Создать"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              {competitions?.map((comp: any) => (
                <div key={comp.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
                  <div>
                    <div className="font-semibold">{comp.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {comp.category === "children" ? "Для детей" : "Для педагогов"} · {comp.status} · {comp.entry_fee ?? 0} ₽
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => editComp(comp)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteCompetition.mutate(comp.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {!competitions?.length && <p className="text-muted-foreground text-sm">Конкурсов пока нет</p>}
            </div>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="font-display text-lg font-bold">Модерация заявок</h2>
              <Select value={filterCompId} onValueChange={setFilterCompId}>
                <SelectTrigger className="w-[250px]"><SelectValue placeholder="Все конкурсы" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все конкурсы</SelectItem>
                  {competitions?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {filteredApps?.map((app: any) => (
                <div key={app.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm">{app.work_title}</div>
                      <div className="text-xs text-muted-foreground">
                        {app.participant_name}, {app.participant_age} лет · {app.nomination} · {app.competitions?.title}
                      </div>
                      {app.file_url && (
                        <a href={app.file_url} target="_blank" className="text-xs text-primary hover:underline">Просмотреть работу</a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={app.status} onValueChange={(v) => updateAppStatus.mutate({ id: app.id, status: v })}>
                        <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">На рассмотрении</SelectItem>
                          <SelectItem value="approved">Одобрить</SelectItem>
                          <SelectItem value="rejected">Отклонить</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
              {!filteredApps?.length && <p className="text-muted-foreground text-sm">Заявок пока нет</p>}
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <h2 className="font-display text-lg font-bold mb-4">Результаты и оценки</h2>
            <div className="space-y-3">
              {applications?.filter((a: any) => a.status === "approved").map((app: any) => (
                <ResultRow key={app.id} app={app} onAssign={assignPlace} />
              ))}
              {!applications?.filter((a: any) => a.status === "approved").length && (
                <p className="text-muted-foreground text-sm">Нет одобренных заявок для оценки</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const ResultRow = ({ app, onAssign }: { app: any; onAssign: any }) => {
  const [place, setPlace] = useState("");
  const [score, setScore] = useState("");

  return (
    <div className="flex items-center justify-between rounded-xl border bg-card p-4">
      <div>
        <div className="font-semibold text-sm">{app.work_title}</div>
        <div className="text-xs text-muted-foreground">
          {app.participant_name} · {app.nomination} · {app.competitions?.title}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Input className="w-20" type="number" placeholder="Балл" value={score} onChange={(e) => setScore(e.target.value)} />
        <Select value={place} onValueChange={setPlace}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="Место" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 место</SelectItem>
            <SelectItem value="2">2 место</SelectItem>
            <SelectItem value="3">3 место</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => {
          if (!place && !score) return;
          onAssign.mutate({
            applicationId: app.id,
            competitionId: app.competition_id,
            place: parseInt(place) || 0,
            score: parseFloat(score) || 0,
          });
        }} disabled={onAssign.isPending}>
          Сохранить
        </Button>
      </div>
    </div>
  );
};

export default AdminPage;
