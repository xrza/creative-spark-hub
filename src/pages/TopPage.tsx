import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const mockData = [
  { rank: 1, name: "Смирнова Алиса", organization: "МБДОУ №15, Москва", worksCount: 8, bestPlace: 1 },
  { rank: 2, name: "Петров Максим", organization: "МБОУ СОШ №3, Казань", worksCount: 7, bestPlace: 1 },
  { rank: 3, name: "Иванова Дарья", organization: "ДШИ №2, Санкт-Петербург", worksCount: 6, bestPlace: 2 },
  { rank: 4, name: "Козлов Артём", organization: "МБДОУ №7, Екатеринбург", worksCount: 5, bestPlace: 2 },
  { rank: 5, name: "Новикова Полина", organization: "МБОУ СОШ №12, Новосибирск", worksCount: 5, bestPlace: 3 },
  { rank: 6, name: "Сидоров Иван", organization: "МБДОУ №21, Краснодар", worksCount: 4, bestPlace: 3 },
  { rank: 7, name: "Кузнецова Мария", organization: "ДШИ №5, Ростов-на-Дону", worksCount: 4, bestPlace: null },
  { rank: 8, name: "Морозов Даниил", organization: "МБОУ СОШ №8, Самара", worksCount: 3, bestPlace: null },
  { rank: 9, name: "Волкова Анна", organization: "МБДОУ №33, Нижний Новгород", worksCount: 3, bestPlace: null },
  { rank: 10, name: "Лебедев Кирилл", organization: "МБОУ СОШ №1, Воронеж", worksCount: 2, bestPlace: null },
];

interface ParticipantRow {
  rank: number;
  name: string;
  organization: string | null;
  worksCount: number;
  bestPlace: number | null;
}

const TopPage = () => {
  const { data: applicationsData } = useQuery({
    queryKey: ["top-participants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("participant_name, organization, nomination, status, results(place)")
        .eq("status", "approved");
      if (error) throw error;
      return data as any[];
    },
  });

  let participants: ParticipantRow[] = [];

  if (applicationsData && applicationsData.length > 0) {
    const grouped: Record<string, { organization: string | null; worksCount: number; bestPlace: number | null }> = {};
    for (const app of applicationsData) {
      const name = app.participant_name;
      if (!grouped[name]) {
        grouped[name] = { organization: app.organization, worksCount: 0, bestPlace: null };
      }
      grouped[name].worksCount += 1;
      if (app.results && Array.isArray(app.results)) {
        for (const r of app.results) {
          if (r.place != null) {
            if (grouped[name].bestPlace === null || r.place < grouped[name].bestPlace!) {
              grouped[name].bestPlace = r.place;
            }
          }
        }
      }
    }
    const sorted = Object.entries(grouped)
      .map(([name, info]) => ({ name, ...info }))
      .sort((a, b) => {
        if (a.bestPlace !== null && b.bestPlace !== null) return a.bestPlace - b.bestPlace;
        if (a.bestPlace !== null) return -1;
        if (b.bestPlace !== null) return 1;
        return b.worksCount - a.worksCount;
      });
    participants = sorted.map((p, i) => ({ rank: i + 1, ...p }));
  } else {
    participants = mockData;
  }

  const placeIcon = (place: number | null) => {
    if (place === 1) return <Trophy className="h-4 w-4 text-yellow-500 inline mr-1" />;
    if (place === 2) return <Medal className="h-4 w-4 text-gray-400 inline mr-1" />;
    if (place === 3) return <Medal className="h-4 w-4 text-amber-600 inline mr-1" />;
    return null;
  };

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-foreground flex items-center gap-3">
          <Trophy className="h-8 w-8 text-primary" />
          Топ участников
        </h1>
        <p className="mt-2 text-muted-foreground">
          Рейтинг самых активных участников конкурсов
        </p>
      </div>

      <div className="rounded-2xl border bg-card shadow-playful overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">#</TableHead>
              <TableHead>Участник</TableHead>
              <TableHead className="hidden sm:table-cell">Организация</TableHead>
              <TableHead className="text-center">Работ</TableHead>
              <TableHead className="text-center">Лучшее место</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.map((p) => (
              <TableRow key={p.rank}>
                <TableCell className="text-center font-bold">{p.rank}</TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                  {p.organization || "—"}
                </TableCell>
                <TableCell className="text-center">{p.worksCount}</TableCell>
                <TableCell className="text-center">
                  {p.bestPlace != null ? (
                    <span className="inline-flex items-center">
                      {placeIcon(p.bestPlace)}
                      {p.bestPlace}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TopPage;
