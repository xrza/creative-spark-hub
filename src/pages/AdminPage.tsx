import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trophy, FileText, BarChart3, Trash2, Edit, Upload } from "lucide-react";
import { toast } from "sonner";

const CHILDREN_CATEGORIES = [
  { value: "preschool", label: "Дошкольники" },
  { value: "primary", label: "Младшие школьники" },
  { value: "middle", label: "Средние школьники" },
  { value: "senior", label: "Старшие школьники" },
];

const TEACHER_CATEGORIES = [
  { value: "methods", label: "для педагогов: Методические разработки" },
  { value: "notes", label: "для педагогов: Конспекты" },
  { value: "scenarios", label: "для педагогов: Сценарии" },
];

const ALL_CATEGORIES = [...CHILDREN_CATEGORIES, ...TEACHER_CATEGORIES];

const AdminPage = () => {
  const queryClient = useQueryClient();

  const { data: competitions } = useQuery({
    queryKey: ["admin-competitions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("competitions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: applications } = useQuery({
    queryKey: ["admin-applications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("applications").select("*, competitions(title)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const totalCompetitions = competitions?.length || 0;
  const totalApplications = applications?.length || 0;
  const uniqueParticipants = new Set(applications?.map((a: any) => a.user_id)).size;

  const [compForm, setCompForm] = useState({
    title: "", description: "", category: "preschool", nomination: "",
    duration_days: "30", entry_fee: "0", prize: "", status: "active",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [compDialogOpen, setCompDialogOpen] = useState(false);
  const [editingCompId, setEditingCompId] = useState<string | null>(null);

  const saveCompetition = useMutation({
    mutationFn: async () => {
      let image_url = "";

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("competitions").upload(path, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("competitions").getPublicUrl(path);
        image_url = urlData.publicUrl;
      }

      const durationDays = parseInt(compForm.duration_days) || 30;
      const now = new Date();
      const deadline = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

      const payload: any = {
        title: compForm.title,
        description: compForm.description,
        category: compForm.category,
        nomination: compForm.nomination.split(",").map((s) => s.trim()).filter(Boolean),
        deadline: deadline.toISOString(),
        duration_days: durationDays,
        entry_fee: parseInt(compForm.entry_fee),
        prize: compForm.prize,
        status: compForm.status,
      };

      if (image_url) payload.image_url = image_url;

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
    setCompForm({ title: "", description: "", category: "preschool", nomination: "", duration_days: "30", entry_fee: "0", prize: "", status: "active" });
    setImageFile(null);
    setEditingCompId(null);
  };

  const editComp = (comp: any) => {
    setCompForm({
      title: comp.title,
      description: comp.description || "",
      category: comp.category,
      nomination: (comp.nomination || []).join(", "),
      duration_days: String(comp.duration_days ?? 30),
      entry_fee: String(comp.entry_fee ?? 0),
      prize: comp.prize || "",
      status: comp.status,
    });
    setImageFile(null);
    setEditingCompId(comp.id);
    setCompDialogOpen(true);
  };

  const getCompStatus = (comp: any) => {
    if (comp.deadline && new Date(comp.deadline) < new Date()) return "ended";
    return comp.status;
  };

  const getCategoryLabel = (value: string) => ALL_CATEGORIES.find((c) => c.value === value)?.label || value;

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

  const assignPlace = useMutation({
    mutationFn: async ({ applicationId, competitionId, place, score }: { applicationId: string; competitionId: string; place: number; score: number }) => {
      const { error } = await supabase.from("results").upsert(
        { application_id: applicationId, competition_id: competitionId, place, score },
        { onConflict: "application_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => toast.success("Результат сохранён"),
    onError: (e: any) => toast.error(e.message),
  });

  const [filterCompId, setFilterCompId] = useState<string>("all");
  const filteredApps = filterCompId === "all" ? applications : applications?.filter((a: any) => a.competition_id === filterCompId);

  return (
    <div className="py-8">
      <div className="container">
        <h1 className="font-display text-3xl font-black text-foreground mb-8">Админ-панель</h1>

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
                    <div>
                      <Label>Категория</Label>
                      <Select value={compForm.category} onValueChange={(v) => setCompForm({ ...compForm, category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem disabled value="__children_header" className="font-bold text-foreground">Для детей</SelectItem>
                          {CHILDREN_CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                          <SelectItem disabled value="__teacher_header" className="font-bold text-foreground">Для педагогов</SelectItem>
                          {TEACHER_CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Номинации (через запятую)</Label><Input value={compForm.nomination} onChange={(e) => setCompForm({ ...compForm, nomination: e.target.value })} placeholder="Рисунок, Поделка, Фотография" /></div>
                    <div><Label>Длительность (дней)</Label><Input type="number" min={1} max={365} value={compForm.duration_days} onChange={(e) => setCompForm({ ...compForm, duration_days: e.target.value })} /></div>
                    <div><Label>Взнос (₽)</Label><Input type="number" value={compForm.entry_fee} onChange={(e) => setCompForm({ ...compForm, entry_fee: e.target.value })} /></div>
                    <div><Label>Приз</Label><Input value={compForm.prize} onChange={(e) => setCompForm({ ...compForm, prize: e.target.value })} /></div>
                    <div>
                      <Label>Изображение</Label>
                      <div className="mt-1">
                        <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-muted-foreground/30 p-4 hover:bg-muted/50 transition-colors">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{imageFile ? imageFile.name : "Выберите файл..."}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                        </label>
                      </div>
                    </div>
                    <div>
                      <Label>Статус</Label>
                      <Select value={compForm.status} onValueChange={(v) => setCompForm({ ...compForm, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Активный</SelectItem>
                          <SelectItem value="finished">Завершён</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full" onClick={() => saveCompetition.mutate()} disabled={saveCompetition.isPending || !compForm.title}>
                      {saveCompetition.isPending ? "Сохранение..." : editingCompId ? "Сохранить" : "Создать"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              {competitions?.map((comp: any) => {
                const status = getCompStatus(comp);
                return (
                  <div key={comp.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
                    <div>
                      <div className="font-semibold">{comp.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {getCategoryLabel(comp.category)} · {status === "ended" ? "Завершён" : "Активный"} · {comp.entry_fee ?? 0} ₽ · {comp.duration_days ?? 30} дн.
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => editComp(comp)}><Edit className="h-4 w-4" /></Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteCompetition.mutate(comp.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                );
              })}
              {!competitions?.length && <p className="text-muted-foreground text-sm">Конкурсов пока нет</p>}
            </div>
          </TabsContent>

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
                        {app.participant_name}{app.participant_age ? `, ${app.participant_age} лет` : ""} · {app.nomination} · {app.competitions?.title}
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
