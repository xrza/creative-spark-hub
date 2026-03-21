import { Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const GalleryPage = () => {
  const { data: works, isLoading } = useQuery({
    queryKey: ["gallery-works"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*, competitions(title)")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="py-10">
      <div className="container">
        <h1 className="font-display text-3xl font-black text-foreground md:text-4xl">Галерея работ</h1>
        <p className="mt-2 text-muted-foreground">Лучшие творческие работы наших участников</p>

        {isLoading ? (
          <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="mb-4 break-inside-avoid">
                <Skeleton className="h-64 w-full rounded-2xl" />
              </div>
            ))}
          </div>
        ) : !works?.length ? (
          <p className="mt-8 text-muted-foreground">Пока нет одобренных работ</p>
        ) : (
          <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {works.map((work: any) => (
              <div key={work.id} className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border bg-card shadow-playful transition-all hover:shadow-playful-hover">
                {work.file_url && (
                  <div className="relative">
                    <a href={work.file_url} target="_blank" rel="noopener noreferrer">
                      <img src={work.file_url} alt={work.work_title} className="w-full object-cover max-h-80" loading="lazy" />
                    </a>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-display text-sm font-bold text-foreground">
                    <a href={work.file_url || "#"} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                      {work.work_title}
                    </a>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {work.participant_name}{work.participant_age ? `, ${work.participant_age} лет` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">{work.nomination} · {work.competitions?.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryPage;
