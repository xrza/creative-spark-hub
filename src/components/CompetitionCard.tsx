import { Link } from "react-router-dom";
import { Calendar, Users, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface CompetitionCardProps {
  competition: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    nomination: string[] | null;
    deadline: string | null;
    entry_fee: number | null;
    image_url: string | null;
    status: string;
    created_at: string;
  };
}

const statusLabels: Record<string, string> = {
  upcoming: "Скоро",
  active: "Идёт приём работ",
  judging: "Оценка",
  finished: "Завершён",
};

const statusColors: Record<string, string> = {
  upcoming: "bg-accent text-accent-foreground",
  active: "bg-success text-success-foreground",
  judging: "bg-warning text-warning-foreground",
  finished: "bg-muted text-muted-foreground",
};

const CompetitionCard = ({ competition }: CompetitionCardProps) => {
  const { id, title, description, category, nomination, deadline, entry_fee, image_url, status } = competition;
  const nominations = nomination || [];

  return (
    <Link
      to={`/competitions/${id}`}
      className="group block overflow-hidden rounded-2xl border bg-card shadow-playful transition-all duration-300 hover:shadow-playful-hover hover:-translate-y-1"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {image_url ? (
          <img src={image_url} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Award className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColors[status] || statusColors.active}`}>
            {statusLabels[status] || status}
          </span>
          <span className="rounded-full bg-card/90 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-foreground">
            {category === "children" ? "Для детей" : "Для педагогов"}
          </span>
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-display text-lg font-bold text-foreground mb-2 line-clamp-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {nominations.slice(0, 3).map((nom) => (
            <Badge key={nom} variant="secondary" className="text-xs">{nom}</Badge>
          ))}
          {nominations.length > 3 && (
            <Badge variant="outline" className="text-xs">+{nominations.length - 3}</Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{deadline ? format(new Date(deadline), "d MMM yyyy", { locale: ru }) : "Без срока"}</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t flex items-center justify-between">
          <span className="font-display text-sm font-bold text-primary">
            {(entry_fee ?? 0) === 0 ? "Бесплатно" : `${entry_fee} ₽`}
          </span>
          <span className="text-xs font-semibold text-primary group-hover:underline">Подробнее →</span>
        </div>
      </div>
    </Link>
  );
};

export default CompetitionCard;
