import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CompetitionCard from "@/components/CompetitionCard";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type FilterCategory = "all" | "children" | "teachers";
type FilterStatus = "all" | "active" | "upcoming" | "finished";

const CompetitionsPage = () => {
  const [category, setCategory] = useState<FilterCategory>("all");
  const [status, setStatus] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");

  const { data: competitions, isLoading } = useQuery({
    queryKey: ["competitions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("competitions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const getComputedStatus = (c: any) => {
    const now = new Date();
    if (c.start_date && new Date(c.start_date) > now) return "upcoming";
    if (c.deadline && new Date(c.deadline) < now) return "finished";
    return "active";
  };

  const filtered = (competitions || []).filter((c: any) => {
    if (category === "children" && c.category !== "children") return false;
    if (category === "teachers" && c.category !== "teachers") return false;
    const cs = getComputedStatus(c);
    if (status !== "all" && cs !== status) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="py-10">
      <div className="container">
        <h1 className="font-display text-3xl font-black text-foreground md:text-4xl">Конкурсы</h1>
        <p className="mt-2 text-muted-foreground">Выберите конкурс и отправьте свою работу</p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {([["all", "Все"], ["children", "Для детей"], ["teachers", "Для педагогов"]] as [FilterCategory, string][]).map(([val, label]) => (
              <Button key={val} size="sm" variant={category === val ? "default" : "outline"} onClick={() => setCategory(val)}>{label}</Button>
            ))}
          </div>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Поиск по названию..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {([["all", "Все статусы"], ["active", "Активные"], ["upcoming", "Скоро"], ["finished", "Завершённые"]] as [FilterStatus, string][]).map(([val, label]) => (
            <Badge key={val} variant={status === val ? "default" : "outline"} className="cursor-pointer" onClick={() => setStatus(val)}>{label}</Badge>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((comp: any) => (
              <CompetitionCard key={comp.id} competition={comp} />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-lg text-muted-foreground">Конкурсы не найдены</p>
            <Button variant="ghost" className="mt-2" onClick={() => { setCategory("all"); setStatus("all"); setSearch(""); }}>Сбросить фильтры</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitionsPage;
