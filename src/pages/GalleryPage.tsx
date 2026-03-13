import { Heart } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface GalleryWork {
  id: string;
  title: string;
  author: string;
  age: number;
  nomination: string;
  competition: string;
  imageUrl: string;
  votes: number;
  isWorkOfDay: boolean;
  isJuryChoice: boolean;
}

const mockGalleryWorks: GalleryWork[] = [
  { id: "1", title: "Весенний букет", author: "Алёна К.", age: 8, nomination: "Рисунок", competition: "Весенняя палитра 2026", imageUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=400&fit=crop", votes: 42, isWorkOfDay: true, isJuryChoice: false },
  { id: "2", title: "Мой кот Мурзик", author: "Дима П.", age: 6, nomination: "Рисунок", competition: "Мой любимый питомец", imageUrl: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=400&fit=crop", votes: 38, isWorkOfDay: false, isJuryChoice: true },
  { id: "3", title: "Ракета в космосе", author: "Маша С.", age: 10, nomination: "Поделка", competition: "Космические фантазии", imageUrl: "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=400&h=400&fit=crop", votes: 27, isWorkOfDay: false, isJuryChoice: false },
  { id: "4", title: "Бабочка из бумаги", author: "Соня Л.", age: 7, nomination: "Аппликация", competition: "Весенняя палитра 2026", imageUrl: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&h=400&fit=crop", votes: 31, isWorkOfDay: false, isJuryChoice: false },
  { id: "5", title: "Домик для птиц", author: "Петя В.", age: 9, nomination: "Поделка", competition: "Весенняя палитра 2026", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=400&fit=crop", votes: 19, isWorkOfDay: false, isJuryChoice: false },
  { id: "6", title: "Радуга", author: "Лиза М.", age: 5, nomination: "Рисунок", competition: "Зимняя сказка 2025", imageUrl: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&h=400&fit=crop", votes: 45, isWorkOfDay: false, isJuryChoice: true },
];

const GalleryPage = () => {
  const [filter, setFilter] = useState<"all" | "workOfDay" | "juryChoice">("all");

  const filtered = mockGalleryWorks.filter((w) => {
    if (filter === "workOfDay") return w.isWorkOfDay;
    if (filter === "juryChoice") return w.isJuryChoice;
    return true;
  });

  return (
    <div className="py-10">
      <div className="container">
        <h1 className="font-display text-3xl font-black text-foreground md:text-4xl">Галерея работ</h1>
        <p className="mt-2 text-muted-foreground">Лучшие творческие работы наших участников</p>

        <div className="mt-8 flex flex-wrap gap-2">
          {([
            ["all", "Все работы"],
            ["workOfDay", "⭐ Работа дня"],
            ["juryChoice", "🏆 Выбор жюри"],
          ] as [typeof filter, string][]).map(([val, label]) => (
            <Button key={val} size="sm" variant={filter === val ? "default" : "outline"} onClick={() => setFilter(val)}>
              {label}
            </Button>
          ))}
        </div>

        <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {filtered.map((work) => (
            <div key={work.id} className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border bg-card shadow-playful transition-all hover:shadow-playful-hover">
              <div className="relative">
                <img src={work.imageUrl} alt={work.title} className="w-full object-cover" loading="lazy" />
                {work.isWorkOfDay && (
                  <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">⭐ Работа дня</Badge>
                )}
                {work.isJuryChoice && (
                  <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">🏆 Выбор жюри</Badge>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-display text-sm font-bold text-foreground">{work.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{work.author}, {work.age} лет</p>
                <p className="text-xs text-muted-foreground">{work.nomination} · {work.competition}</p>
                <div className="mt-3 flex items-center justify-between">
                  <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                    <Heart className="h-4 w-4" />
                    <span>{work.votes}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GalleryPage;
