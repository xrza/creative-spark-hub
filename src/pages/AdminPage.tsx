/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Trophy, FileText, BarChart3, Trash2, Edit, Upload, CalendarIcon, Newspaper } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

const AUDIENCES = [
  { value: "children", label: "Для детей" },
  { value: "teachers", label: "Для педагогов" },
  { value: "all", label: "Для всех" },
];

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("competitions");
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

  const { data: comments } = useQuery({
    queryKey: ["admin-comments"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
          .from("news_comments")     // <-- правильная таблица
          .select("id, content, created_at, user_id, news_id, news(title)")
          .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const totalCompetitions = competitions?.length || 0;
  const totalApplications = applications?.length || 0;
  const uniqueParticipants = new Set(applications?.map((a: any) => a.user_id)).size;

  const [compForm, setCompForm] = useState({
    title: "", description: "", category: "children", nomination: "",
    entry_fee: "0", prize: "", status: "active",
  });
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [compDialogOpen, setCompDialogOpen] = useState(false);
  const [editingCompId, setEditingCompId] = useState<string | null>(null);

  const saveCompetition = useMutation({
    mutationFn: async () => {
      let image_url: string | undefined;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("competitions").upload(path, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("competitions").getPublicUrl(path);
        image_url = urlData.publicUrl;
      }
      const payload: any = {
        title: compForm.title,
        description: compForm.description,
        category: compForm.category,
        nomination: compForm.nomination.split(",").map((s) => s.trim()).filter(Boolean),
        start_date: startDate ? startDate.toISOString() : null,
        deadline: endDate ? endDate.toISOString() : null,
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

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
          .from("news_comments")   // <-- было "comments"
          .delete()
          .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Комментарий удалён");
      queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetCompForm = () => {
    setCompForm({ title: "", description: "", category: "children", nomination: "", entry_fee: "0", prize: "", status: "active" });
    setImageFile(null);
    setStartDate(undefined);
    setEndDate(undefined);
    setEditingCompId(null);
  };

  const editComp = (comp: any) => {
    setCompForm({
      title: comp.title,
      description: comp.description || "",
      category: comp.category,
      nomination: (comp.nomination || []).join(", "),
      entry_fee: String(comp.entry_fee ?? 0),
      prize: comp.prize || "",
      status: comp.status,
    });
    setStartDate(comp.start_date ? new Date(comp.start_date) : undefined);
    setEndDate(comp.deadline ? new Date(comp.deadline) : undefined);
    setImageFile(null);
    setEditingCompId(comp.id);
    setCompDialogOpen(true);
  };

  const getCompStatus = (comp: any) => {
    const now = new Date();
    if (comp.start_date && new Date(comp.start_date) > now) return "upcoming";
    if (comp.deadline && new Date(comp.deadline) < now) return "finished";
    return "active";
  };

  const getAudienceLabel = (value: string) => AUDIENCES.find((a) => a.value === value)?.label || value;

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

  // News tab state
  const { data: adminNews } = useQuery({
    queryKey: ["admin-news"],
    queryFn: async () => {
      const { data, error } = await supabase.from("news").select("*").order("published_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const [newsForm, setNewsForm] = useState({ title: "", body: "" });
  const [newsPhotoFile, setNewsPhotoFile] = useState<File | null>(null);
  const [newsDialogOpen, setNewsDialogOpen] = useState(false);
  const [newsSubmitting, setNewsSubmitting] = useState(false);

  // Редактирование новости
  const [editingNews, setEditingNews] = useState<any | null>(null);
  const [editNewsDialogOpen, setEditNewsDialogOpen] = useState(false);
  const [editNewsPhotoFile, setEditNewsPhotoFile] = useState<File | null>(null);

  const publishAdminNews = async () => {
    if (!newsForm.title || !newsForm.body) return;
    setNewsSubmitting(true);
    try {
      let photo_url: string | null = null;
      if (newsPhotoFile) {
        const ext = newsPhotoFile.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("news").upload(path, newsPhotoFile);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("news").getPublicUrl(path);
        photo_url = urlData.publicUrl;
      }
      const { error } = await supabase.from("news").insert({ title: newsForm.title, body: newsForm.body, photo_url });
      if (error) throw error;
      toast.success("Новость опубликована!");
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      queryClient.invalidateQueries({ queryKey: ["news"] });
      setNewsDialogOpen(false);
      setNewsForm({ title: "", body: "" });
      setNewsPhotoFile(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setNewsSubmitting(false);
    }
  };

  const deleteAdminNews = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("news").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Новость удалена");
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      queryClient.invalidateQueries({ queryKey: ["news"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateAdminNews = useMutation({
    mutationFn: async () => {
      if (!editingNews) return;
      let photo_url = editingNews.photo_url;

      // Загружаем новое фото если выбрано
      if (editNewsPhotoFile) {
        const ext = editNewsPhotoFile.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("news").upload(path, editNewsPhotoFile);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("news").getPublicUrl(path);
        photo_url = urlData.publicUrl;
      }

      const { error } = await supabase
          .from("news")
          .update({ title: editingNews.title, body: editingNews.body, photo_url })
          .eq("id", editingNews.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Новость обновлена");
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      queryClient.invalidateQueries({ queryKey: ["news"] });
      setEditNewsDialogOpen(false);
      setEditingNews(null);
      setEditNewsPhotoFile(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

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

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="competitions">Конкурсы</TabsTrigger>
              <TabsTrigger value="applications">Заявки</TabsTrigger>
              <TabsTrigger value="results">Результаты</TabsTrigger>
              <TabsTrigger value="comments">Комментарии</TabsTrigger>
              <TabsTrigger value="news">Новости</TabsTrigger>
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
                        <Label>Аудитория</Label>
                        <Select value={compForm.category} onValueChange={(v) => setCompForm({ ...compForm, category: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {AUDIENCES.map((a) => (
                                <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Номинация</Label><Input value={compForm.nomination} onChange={(e) => setCompForm({ ...compForm, nomination: e.target.value })} placeholder="Рисунок, Поделка, Фотография" /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Дата начала</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "d MMM yyyy", { locale: ru }) : "Выберите"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="p-3 pointer-events-auto" />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <Label>Дата окончания</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, "d MMM yyyy", { locale: ru }) : "Выберите"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={endDate} onSelect={setEndDate} disabled={(date) => startDate ? date <= startDate : false} initialFocus className="p-3 pointer-events-auto" />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
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
                  const statusLabel = status === "upcoming" ? "Скоро" : status === "finished" ? "Завершён" : "Активный";
                  return (
                      <div key={comp.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
                        <div>
                          <div className="font-semibold">{comp.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {getAudienceLabel(comp.category)} · {statusLabel} · {comp.entry_fee ?? 0} ₽ · 👁 {comp.views_count ?? 0}
                            {comp.start_date && comp.deadline && (
                                <> · {format(new Date(comp.start_date), "d.MM", { locale: ru })} – {format(new Date(comp.deadline), "d.MM.yyyy", { locale: ru })}</>
                            )}
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
                            {app.participant_name} · {app.nomination} · {app.competitions?.title}
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

            <TabsContent value="comments">
              <h2 className="font-display text-lg font-bold mb-4">Комментарии</h2>
              <div className="space-y-3">
                {comments?.map((c: any) => (
                    <div key={c.id} className="flex items-start justify-between rounded-xl border bg-card p-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          {new Date(c.created_at).toLocaleDateString("ru-RU", {
                            day: "numeric", month: "long", year: "numeric",
                          })}
                          {c.news?.title && <> · <span className="text-primary">{c.news.title}</span></>}
                        </div>
                        <p className="text-sm text-foreground">{c.content}</p>
                      </div>
                      <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteComment.mutate(c.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                ))}
                {!comments?.length && (
                    <p className="text-muted-foreground text-sm">Комментариев пока нет</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="news">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-lg font-bold">Управление новостями</h2>
                </div>
                <Dialog open={newsDialogOpen} onOpenChange={setNewsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button><Plus className="h-4 w-4 mr-1" /> Добавить новость</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Новая новость</DialogTitle></DialogHeader>
                    <div className="space-y-3 mt-4">
                      <div><Label>Заголовок *</Label><Input value={newsForm.title} onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })} /></div>
                      <div><Label>Текст новости *</Label><Textarea rows={5} value={newsForm.body} onChange={(e) => setNewsForm({ ...newsForm, body: e.target.value })} /></div>
                      <div>
                        <Label>Фото</Label>
                        <input type="file" accept="image/*" className="mt-1 block w-full text-sm" onChange={(e) => setNewsPhotoFile(e.target.files?.[0] || null)} />
                      </div>
                      <Button className="w-full" onClick={publishAdminNews} disabled={newsSubmitting || !newsForm.title || !newsForm.body}>
                        {newsSubmitting ? "Публикация..." : "Опубликовать"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                {adminNews?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4 rounded-xl border bg-card p-4">
                      {item.photo_url && (
                          <div className="h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg">
                            <img src={item.photo_url} alt="" className="h-full w-full object-cover" />
                          </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{item.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(item.published_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.body}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setEditingNews(item); setEditNewsPhotoFile(null); setEditNewsDialogOpen(true); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteAdminNews.mutate(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                ))}
                {!adminNews?.length && <p className="text-muted-foreground text-sm">Новостей пока нет</p>}
              </div>
            </TabsContent>
          </Tabs>

          {/* Диалог редактирования новости */}
          <Dialog open={editNewsDialogOpen} onOpenChange={(v) => { setEditNewsDialogOpen(v); if (!v) { setEditingNews(null); setEditNewsPhotoFile(null); } }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Редактировать новость</DialogTitle></DialogHeader>
              {editingNews && (
                  <div className="space-y-3 mt-4">
                    <div>
                      <Label>Заголовок *</Label>
                      <Input value={editingNews.title} onChange={(e) => setEditingNews({ ...editingNews, title: e.target.value })} />
                    </div>
                    <div>
                      <Label>Текст новости *</Label>
                      <Textarea rows={6} value={editingNews.body} onChange={(e) => setEditingNews({ ...editingNews, body: e.target.value })} />
                    </div>
                    <div>
                      <Label>Фото</Label>
                      {/* Превью текущего или нового фото */}
                      {(editNewsPhotoFile || editingNews.photo_url) && (
                          <div className="w-full aspect-video overflow-hidden rounded-lg mb-2 bg-muted">
                            <img
                                src={editNewsPhotoFile ? URL.createObjectURL(editNewsPhotoFile) : editingNews.photo_url}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                          </div>
                      )}
                      <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-muted-foreground/30 p-3 hover:bg-muted/50 transition-colors mt-1">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                      {editNewsPhotoFile ? editNewsPhotoFile.name : "Заменить фото..."}
                    </span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => setEditNewsPhotoFile(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => { setEditNewsDialogOpen(false); setEditingNews(null); setEditNewsPhotoFile(null); }}>
                        Отмена
                      </Button>
                      <Button
                          className="flex-1"
                          onClick={() => updateAdminNews.mutate()}
                          disabled={updateAdminNews.isPending || !editingNews.title || !editingNews.body}
                      >
                        {updateAdminNews.isPending ? "Сохранение..." : "Сохранить"}
                      </Button>
                    </div>
                  </div>
              )}
            </DialogContent>
          </Dialog>

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
          <Input placeholder="Место" type="number" className="w-20" value={place} onChange={(e) => setPlace(e.target.value)} />
          <Input placeholder="Баллы" type="number" className="w-20" value={score} onChange={(e) => setScore(e.target.value)} />
          <Button size="sm" onClick={() => onAssign.mutate({ applicationId: app.id, competitionId: app.competition_id, place: parseInt(place), score: parseFloat(score) })} disabled={!place}>
            Сохранить
          </Button>
        </div>
      </div>
  );
};

export default AdminPage;
