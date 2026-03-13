import { useParams, Link } from "react-router-dom";
import { mockCompetitions } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Award, FileText, ArrowLeft } from "lucide-react";

const CompetitionDetailPage = () => {
  const { id } = useParams();
  const competition = mockCompetitions.find((c) => c.id === id);

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

  const statusLabels = { upcoming: "Скоро", active: "Идёт приём работ", ended: "Завершён" };
  const statusColors = {
    upcoming: "bg-accent text-accent-foreground",
    active: "bg-success text-success-foreground",
    ended: "bg-muted text-muted-foreground",
  };

  return (
    <div className="py-8">
      <div className="container max-w-4xl">
        <Link to="/competitions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Все конкурсы
        </Link>

        <div className="rounded-3xl overflow-hidden border shadow-playful">
          <div className="relative aspect-[21/9] overflow-hidden">
            <img src={competition.imageUrl} alt={competition.title} className="h-full w-full object-cover" />
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
              <h1 className="font-display text-2xl font-black text-primary-foreground md:text-3xl">
                {competition.title}
              </h1>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="grid gap-4 sm:grid-cols-3 mb-8">
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Сроки</div>
                  <div className="text-sm font-semibold">{competition.startDate} — {competition.endDate}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Участников</div>
                  <div className="text-sm font-semibold">{competition.participantsCount}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
                <Award className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Взнос</div>
                  <div className="text-sm font-semibold">
                    {competition.entryFee === 0 ? "Бесплатно" : `${competition.entryFee} ₽`}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="font-display text-lg font-bold text-foreground mb-3">Описание</h2>
              <p className="text-muted-foreground leading-relaxed">{competition.description}</p>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Приглашаем всех желающих принять участие в нашем творческом конкурсе!
                Работы принимаются в электронном виде. Каждый участник получает сертификат,
                а победители — дипломы I, II и III степени.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="font-display text-lg font-bold text-foreground mb-3">Номинации</h2>
              <div className="flex flex-wrap gap-2">
                {competition.nominations.map((nom) => (
                  <Badge key={nom} variant="secondary" className="text-sm px-4 py-1.5">
                    {nom}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="font-display text-lg font-bold text-foreground mb-3">Правила участия</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" />
                  Работа должна быть выполнена участником самостоятельно
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" />
                  Принимаются фото (JPG, PNG), видео (MP4) и документы (PDF, DOC)
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" />
                  Одна работа в одной номинации от одного участника
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" />
                  Результаты объявляются в течение 7 дней после окончания приёма работ
                </li>
              </ul>
            </div>

            {competition.status !== "ended" && (
              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link to="/register">Подать заявку</Link>
                </Button>
                <Button size="lg" variant="outline">
                  У меня есть промокод
                </Button>
              </div>
            )}

            {competition.status === "ended" && (
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
