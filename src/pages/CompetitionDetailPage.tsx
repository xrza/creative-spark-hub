import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Award, FileText, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const statusLabels: Record<string, string> = { upcoming: "Скоро", active: "Идёт приём работ", judging: "Оценка", finished: "Завершён" };
const statusColors: Record<string, string> = {
  upcoming: "bg-accent text-accent-foreground",
  active: "bg-success text-success-foreground",
  judging: "bg-warning text-warning-foreground",
  finished: "bg-muted text-muted-foreground",
};

const CompetitionDetailPage = () => {
  const { id } = useParams();

  const { data: competition, isLoading } = useQuery({
    queryKey: ["competition", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("competitions").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
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

  return (
    <div className="py-8">
      <div className="container max-w-4xl">
        <Link to="/competitions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Все конкурсы
        </Link>

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
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColors[competition.status]}`}>
                  {statusLabels[competition.status]}
                </span>
                <span className="rounded-full bg-card/90 backdrop-blur-sm px-3 py-1 text-xs font-semibold">
                  {competition.category === "children" ? "Для детей" : "Для педагогов"}
                </span>
              </div>
              <h1 className="font-display text-2xl font-black text-primary-foreground md:text-3xl">{competition.title}</h1>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="grid gap-4 sm:grid-cols-3 mb-8">
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Дедлайн</div>
                  <div className="text-sm font-semibold">
                    {competition.deadline ? format(new Date(competition.deadline), "d MMMM yyyy", { locale: ru }) : "Без срока"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Возраст</div>
                  <div className="text-sm font-semibold">{competition.age_from}–{competition.age_to} лет</div>
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
                {["Работа должна быть выполнена участником самостоятельно", "Принимаются фото (JPG, PNG), видео (MP4) и документы (PDF, DOC)", "Одна работа в одной номинации от одного участника", "Результаты объявляются в течение 7 дней после окончания приёма работ"].map((rule) => (
                  <li key={rule} className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {competition.status !== "finished" && (
              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link to={`/competitions/${id}/pay`}>Подать заявку</Link>
                </Button>
              </div>
            )}

            {competition.status === "finished" && (
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
