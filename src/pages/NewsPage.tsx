import { Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const NewsPage = () => {
  const { data: news, isLoading } = useQuery({
    queryKey: ["news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="py-10">
      <div className="container max-w-3xl">
        <h1 className="font-display text-3xl font-black text-foreground mb-8">Новости</h1>
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !news?.length ? (
          <p className="text-center text-muted-foreground py-20">Новостей пока нет</p>
        ) : (
          <div className="space-y-6">
            {news.map((item) => (
              <article key={item.id} className="rounded-2xl border bg-card overflow-hidden shadow-sm">
                {item.photo_url && (
                  <img
                    src={item.photo_url}
                    alt={item.title}
                    className="w-full max-h-[300px] object-cover"
                    loading="lazy"
                  />
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(item.published_at).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                  <h2 className="font-display text-lg font-bold text-foreground mb-2">{item.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPage;
