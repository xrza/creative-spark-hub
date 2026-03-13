import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CompetitionCard from "@/components/CompetitionCard";
import { mockCompetitions } from "@/data/mockData";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type FilterCategory = "all" | "children" | "teachers";
type FilterStatus = "all" | "active" | "upcoming" | "ended";

const CompetitionsPage = () => {
  const [category, setCategory] = useState<FilterCategory>("all");
  const [status, setStatus] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");

  const filtered = mockCompetitions.filter((c) => {
    if (category !== "all" && c.category !== category) return false;
    if (status !== "all" && c.status !== status) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="py-10">
      <div className="container">
        <h1 className="font-display text-3xl font-black text-foreground md:text-4xl">
          Конкурсы
        </h1>
        <p className="mt-2 text-muted-foreground">
          Выберите конкурс и отправьте свою работу
        </p>

        {/* Filters */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "Все"],
                ["children", "Для детей"],
                ["teachers", "Для педагогов"],
              ] as [FilterCategory, string][]
            ).map(([val, label]) => (
              <Button
                key={val}
                size="sm"
                variant={category === val ? "default" : "outline"}
                onClick={() => setCategory(val)}
              >
                {label}
              </Button>
            ))}
          </div>

          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ["all", "Все статусы"],
              ["active", "Активные"],
              ["upcoming", "Скоро"],
              ["ended", "Завершённые"],
            ] as [FilterStatus, string][]
          ).map(([val, label]) => (
            <Badge
              key={val}
              variant={status === val ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setStatus(val)}
            >
              {label}
            </Badge>
          ))}
        </div>

        {/* Results */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((comp) => (
            <CompetitionCard key={comp.id} {...comp} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-lg text-muted-foreground">Конкурсы не найдены</p>
            <Button
              variant="ghost"
              className="mt-2"
              onClick={() => {
                setCategory("all");
                setStatus("all");
                setSearch("");
              }}
            >
              Сбросить фильтры
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitionsPage;
