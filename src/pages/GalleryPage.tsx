import { useState } from "react";
import { Heart, MessageCircle, Send } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const GalleryPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedComp, setSelectedComp] = useState<string>("all");
  const [selectedNom, setSelectedNom] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");

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

  const { data: likes } = useQuery({
    queryKey: ["gallery-likes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("likes").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: comments } = useQuery({
    queryKey: ["gallery-comments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("comments").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const toggleLike = useMutation({
    mutationFn: async (applicationId: string) => {
      if (!user) throw new Error("Войдите, чтобы поставить лайк");
      const existing = likes?.find((l: any) => l.application_id === applicationId && l.user_id === user.id);
      if (existing) {
        const { error } = await supabase.from("likes").delete().eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("likes").insert({ user_id: user.id, application_id: applicationId });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gallery-likes"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const addComment = useMutation({
    mutationFn: async ({ applicationId, content, authorName }: { applicationId: string; content: string; authorName: string }) => {
      if (!user) throw new Error("Войдите, чтобы комментировать");
      const { error } = await supabase.from("comments").insert({
        user_id: user.id,
        application_id: applicationId,
        content,
        author_name: authorName,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gallery-comments"] }),
    onError: (e: any) => toast.error(e.message),
  });

  // Extract unique competitions and nominations
  const competitions = Array.from(new Set(works?.map((w: any) => w.competitions?.title).filter(Boolean) || []));
  const nominations = Array.from(new Set(works?.map((w: any) => w.nomination).filter(Boolean) || []));

  // Filter and sort
  let filtered = (works || []).filter((w: any) => {
    if (selectedComp !== "all" && w.competitions?.title !== selectedComp) return false;
    if (selectedNom !== "all" && w.nomination !== selectedNom) return false;
    return true;
  });

  if (sortBy === "likes") {
    filtered = [...filtered].sort((a: any, b: any) => {
      const aLikes = likes?.filter((l: any) => l.application_id === a.id).length || 0;
      const bLikes = likes?.filter((l: any) => l.application_id === b.id).length || 0;
      return bLikes - aLikes;
    });
  }

  // Group by competition
  const grouped = filtered.reduce((acc: Record<string, any[]>, work: any) => {
    const key = work.competitions?.title || "Без конкурса";
    if (!acc[key]) acc[key] = [];
    acc[key].push(work);
    return acc;
  }, {});

  return (
    <div className="py-10">
      <div className="container">
        <h1 className="font-display text-3xl font-black text-foreground md:text-4xl">Галерея работ</h1>
        <p className="mt-2 text-muted-foreground">Лучшие творческие работы наших участников</p>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Select value={selectedComp} onValueChange={setSelectedComp}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Конкурс" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все конкурсы</SelectItem>
              {competitions.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedNom} onValueChange={setSelectedNom}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Номинация" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все номинации</SelectItem>
              {nominations.map((n) => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">По дате</SelectItem>
              <SelectItem value="likes">По лайкам</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl" />
            ))}
          </div>
        ) : !filtered.length ? (
          <p className="mt-8 text-muted-foreground">Пока нет одобренных работ</p>
        ) : (
          Object.entries(grouped).map(([compTitle, compWorks]) => (
            <div key={compTitle} className="mt-10">
              <h2 className="font-display text-xl font-bold text-foreground mb-4">{compTitle}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(compWorks as any[]).map((work: any) => (
                  <GalleryCard
                    key={work.id}
                    work={work}
                    likes={likes?.filter((l: any) => l.application_id === work.id) || []}
                    comments={comments?.filter((c: any) => c.application_id === work.id) || []}
                    userId={user?.id}
                    onToggleLike={() => toggleLike.mutate(work.id)}
                    onAddComment={(content: string, name: string) => addComment.mutate({ applicationId: work.id, content, authorName: name })}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const GalleryCard = ({ work, likes, comments, userId, onToggleLike, onAddComment }: any) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentName, setCommentName] = useState("");
  const isLiked = likes.some((l: any) => l.user_id === userId);

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-playful transition-all hover:shadow-playful-hover">
      {work.file_url && (
        <a href={work.file_url} target="_blank" rel="noopener noreferrer">
          <img src={work.file_url} alt={work.work_title} className="w-full object-cover max-h-80" loading="lazy" />
        </a>
      )}
      <div className="p-4">
        <h3 className="font-display text-sm font-bold text-foreground">{work.work_title}</h3>
        <p className="text-xs text-muted-foreground mt-1">{work.participant_name}</p>
        <Badge variant="secondary" className="text-xs mt-1">{work.nomination}</Badge>

        <div className="mt-3 flex items-center gap-4">
          <button onClick={onToggleLike} className="flex items-center gap-1 text-sm transition-colors hover:text-primary">
            <Heart className={`h-4 w-4 ${isLiked ? "fill-primary text-primary" : "text-muted-foreground"}`} />
            <span className="text-xs font-semibold">{likes.length}</span>
          </button>
          <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">{comments.length}</span>
          </button>
        </div>

        {showComments && (
          <div className="mt-3 space-y-2 border-t pt-3">
            {comments.map((c: any) => (
              <div key={c.id} className="text-xs">
                <span className="font-semibold text-foreground">{c.author_name || "Аноним"}: </span>
                <span className="text-muted-foreground">{c.content}</span>
              </div>
            ))}
            {userId && (
              <div className="flex gap-2 mt-2">
                <Input placeholder="Имя" value={commentName} onChange={(e) => setCommentName(e.target.value)} className="text-xs h-8 w-24" />
                <Textarea placeholder="Комментарий..." value={commentText} onChange={(e) => setCommentText(e.target.value)} className="text-xs min-h-[32px] h-8 flex-1" />
                <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => {
                  if (commentText.trim()) {
                    onAddComment(commentText.trim(), commentName.trim() || "Аноним");
                    setCommentText("");
                  }
                }}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryPage;
