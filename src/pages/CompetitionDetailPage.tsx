import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Award, FileText, ArrowLeft, Plus, Upload } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";

const audienceLabels: Record<string, string> = { children: "Для детей", teachers: "Для педагогов", all: "Для всех" };

const CompetitionDetailPage = () => {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: competition, isLoading } = useQuery({
    queryKey: ["competition", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("competitions").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Increment views on mount
  useEffect(() => {
    if (id) {
      supabase.rpc("increment_competition_views", { _competition_id: id });
    }
  }, [id]);

  // News dialog state
  const [newsOpen, setNewsOpen] = useState(false);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsBody, setNewsBody] = useState("");
  const [newsPhoto, setNewsPhoto] = useState<File | null>(null);

  const publishNews = useMutation({
    mutationFn: async () => {
      let photo_url: string | null = null;
      if (newsPhoto) {
        const ext = newsPhoto.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("news").upload(path, newsPhoto);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("news").getPublicUrl(path);
        photo_url = urlData.publicUrl;
      }
      const { error } = await supabase.from("news").insert({ title: newsTitle, body: newsBody, photo_url });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Новость опубликована");
      setNewsOpen(false);
      setNewsTitle("");
      setNewsBody("");
      setNewsPhoto(null);
      queryClient.invalidateQueries({ queryKey: ["news"] });
      queryClient.invalidateQueries({ queryKey: ["news-latest"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Конкурс не найден</h1>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/competitions">← Вернуться к конкурсам</Link>
        </Button>
      </div>
    );
  }

  const nominations = competition.nomination || [];
  const now = new Date();
  const startDate = competition.start_date ? new Date(competition.start_date) : null;
  const endDate = competition.deadline ? new Date(competition.deadline) : null;
  const computedStatus = startDate && startDate > now ? "upcoming" : endDate && endDate < now ? "finished" : "active";

  const statusLabels: Record<string, string> = { upcoming: "Скоро", active: "Идёт приём работ", finished: "Завершён" };
  const statusColors: Record<string, string> = {
    upcoming: "bg-accent text-accent-foreground",
    active: "bg-success text-success-foreground",
    finished: "bg-muted text-muted-foreground",
  };

  const dateRange = startDate && endDate
    ? `${format(startDate, "d MMMM yyyy", { locale: ru })} — ${format(endDate, "d MMMM yyyy", { locale: ru })}`
    : endDate
      ? `до ${format(endDate, "d MMMM yyyy", { locale: ru })}`
      : "Без срока";

  return (
    <div className="py-8">
      <div className="container max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Link to="/competitions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Все конкурсы
          </Link>
          {isAdmin && (
            <Dialog open={newsOpen} onOpenChange={setNewsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" /> Добавить новость</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Новая новость</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-4">
                  <div>
                    <Label>Заголовок *</Label>
                    <Input value={newsTitle} onChange={(e) => setNewsTitle(e.target.value)} />
                  </div>
                  <div>
                    <Label>Текст новости *</Label>
                    <Textarea value={newsBody} onChange={(e) => setNewsBody(e.target.value)} rows={5} />
                  </div>
                  <div>
                    <Label>Фото (необязательно)</Label>
                    <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-muted-foreground/30 p-4 hover:bg-muted/50 transition-colors mt-1">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{newsPhoto ? newsPhoto.name : "Выберите файл..."}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setNewsPhoto(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <Button className="w-full" onClick={() => publishNews.mutate()} disabled={publishNews.isPending || !newsTitle.trim() || !newsBody.trim()}>
                    {publishNews.isPending ? "Публикация..." : "Опубликовать"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="rounded-3xl overflow-hidden border shadow-playful">
          <div className="relative aspect-[21/9] overflow-hidden bg-muted">
            {competition.image_url ? (
              <img src={competition.image_url} alt={competition.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Award className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex gap-2 mb-3">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColors[computedStatus]}`}>
                  {statusLabels[computedStatus]}
                </span>
                <span className="rounded-full bg-card/90 backdrop-blur-sm px-3 py-1 text-xs font-semibold">
                  {audienceLabels[competition.category] || competition.category}
                </span>
              </div>
              <h1 className="font-display text-2xl font-black text-primary-foreground md:text-3xl">{competition.title}</h1>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="grid gap-4 sm:grid-cols-2 mb-8">
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Сроки проведения</div>
                  <div className="text-sm font-semibold">{dateRange}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
                <Award className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Взнос</div>
                  <div className="text-sm font-semibold">
                    {(competition.entry_fee ?? 0) === 0 ? "Бесплатно" : `${competition.entry_fee} ₽`}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="font-display text-lg font-bold text-foreground mb-3">Описание</h2>
              <p className="text-muted-foreground leading-relaxed">{competition.description}</p>
              {competition.prize && (
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  <strong>Приз:</strong> {competition.prize}
                </p>
              )}
            </div>

            {nominations.length > 0 && (
              <div className="mb-8">
                <h2 className="font-display text-lg font-bold text-foreground mb-3">Номинации</h2>
                <div className="flex flex-wrap gap-2">
                  {nominations.map((nom) => (
                    <Badge key={nom} variant="secondary" className="text-sm px-4 py-1.5">{nom}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="font-display text-lg font-bold text-foreground mb-3">Правила участия</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {["Принимаются фото (JPG, PNG) и видео (MP4)", "Одна работа в одной номинации от одного участника", "Результаты объявляются в течение дня после окончания приёма работ"].map((rule) => (
                  <li key={rule} className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {computedStatus !== "finished" && (
              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link to={`/competitions/${id}/pay`}>Подать заявку</Link>
                </Button>
              </div>
            )}

            {computedStatus === "finished" && (
              <div className="rounded-xl bg-muted/50 p-6 text-center">
                <Award className="mx-auto h-8 w-8 text-primary mb-2" />
                <p className="font-display font-bold text-foreground">Конкурс завершён</p>
                <p className="text-sm text-muted-foreground mt-1">Результаты доступны в галерее</p>
                <Button variant="outline" className="mt-3" asChild>
                  <Link to="/gallery">Перейти в галерею</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitionDetailPage;
