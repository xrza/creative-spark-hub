import { useState } from "react";
import { Heart, MessageCircle, Send } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ─── локальные типы ─────────────────────────────────────────────────────────

interface Like {
  id: string;
  application_id: string;
  user_id: string;
  created_at: string;
}

interface Comment {
  id: string;
  application_id: string;
  content: string;
  author_name: string;
  created_at: string;
}

interface Work {
  id: string;
  work_title: string;
  participant_name: string;
  nomination: string;
  file_url: string | null;
  competition_id: string;
  created_at: string;
  competitions: { title: string } | null;
}

// ─── страница ────────────────────────────────────────────────────────────────

const GalleryPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedComp, setSelectedComp] = useState("all");
  const [selectedNom, setSelectedNom] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  // Запросы
  const { data: works, isLoading } = useQuery({
    queryKey: ["gallery-works"],
    queryFn: async () => {
      const { data, error } = await supabase
          .from("applications")
          .select("*, competitions(title)")
          .eq("status", "approved")
          .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Work[];
    },
  });

  const { data: likes } = useQuery({
    queryKey: ["gallery-likes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("likes").select("*");
      if (error) throw error;
      return data as Like[];
    },
  });

  const { data: comments } = useQuery({
    queryKey: ["gallery-comments"],
    queryFn: async () => {
      const { data, error } = await supabase
          .from("comments")
          .select("*")
          .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Comment[];
    },
  });

  // Лайк
  const toggleLike = useMutation({
    mutationFn: async (applicationId: string) => {
      if (!user) throw new Error("Войдите, чтобы проголосовать");

      const existing = likes?.find(
          (l) => l.application_id === applicationId && l.user_id === user.id
      );

      if (existing) {
        const { error } = await supabase
            .from("likes")
            .delete()
            .eq("id", existing.id);
        if (error) throw error;
      } else {
        const payload: TablesInsert<"likes"> = {
          user_id: user.id,
          application_id: applicationId,
        };
        const { error } = await supabase.from("likes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gallery-likes"] }),
    onError: (e: unknown) =>
        toast.error(e instanceof Error ? e.message : "Ошибка"),
  });

  // Комментарий
  const addComment = useMutation({
    mutationFn: async ({
                         applicationId,
                         content,
                         authorName,
                       }: {
      applicationId: string;
      content: string;
      authorName: string;
    }) => {
      if (!user) throw new Error("Войдите, чтобы комментировать");

      const payload: TablesInsert<"comments"> = {
        user_id: user.id,
        application_id: applicationId,
        content,
        author_name: authorName,
      };
      const { error } = await supabase.from("comments").insert(payload);
      if (error) throw error;
    },
    onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: ["gallery-comments"] }),
    onError: (e: unknown) =>
        toast.error(e instanceof Error ? e.message : "Ошибка"),
  });

  // Имя автора из профиля
  const fullName =
      (user?.user_metadata?.full_name as string) ||
      (user?.user_metadata?.name as string) ||
      "";
  const parts = fullName.trim().split(" ");
  const authorName =
      parts[1] || parts[0] || user?.email?.split("@")[0] || "Аноним";

  // Фильтрация и сортировка
  const competitions = Array.from(
      new Set(
          (works || [])
              .map((w) => w.competitions?.title)
              .filter((t): t is string => Boolean(t))
      )
  );

  const nominations = Array.from(
      new Set(
          (works || [])
              .map((w) => w.nomination)
              .filter((n): n is string => Boolean(n))
      )
  );

  let filtered = (works || []).filter((w) => {
    if (selectedComp !== "all" && w.competitions?.title !== selectedComp)
      return false;
    if (selectedNom !== "all" && w.nomination !== selectedNom) return false;
    return true;
  });

  if (sortBy === "likes") {
    filtered = [...filtered].sort((a, b) => {
      const aCount =
          likes?.filter((l) => l.application_id === a.id).length || 0;
      const bCount =
          likes?.filter((l) => l.application_id === b.id).length || 0;
      return bCount - aCount;
    });
  }

  const grouped = filtered.reduce<Record<string, Work[]>>((acc, work) => {
    const key = work.competitions?.title || "Без конкурса";
    if (!acc[key]) acc[key] = [];
    acc[key].push(work);
    return acc;
  }, {});

  // ─── рендер ────────────────────────────────────────────────────────────────

  return (
      <div className="py-10">
        <div className="container">
          <h1 className="font-display text-3xl font-black text-foreground md:text-4xl">
            Галерея работ
          </h1>
          <p className="mt-2 text-muted-foreground">
            Лучшие творческие работы наших участников
          </p>

          {/* Фильтры */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Select value={selectedComp} onValueChange={setSelectedComp}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Конкурс" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все конкурсы</SelectItem>
                {competitions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedNom} onValueChange={setSelectedNom}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Номинация" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все номинации</SelectItem>
                {nominations.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">По дате</SelectItem>
                <SelectItem value="likes">По голосам</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Карточки */}
          {isLoading ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-64 w-full rounded-2xl" />
                ))}
              </div>
          ) : !filtered.length ? (
              <p className="mt-8 text-muted-foreground">
                Пока нет одобренных работ
              </p>
          ) : (
              Object.entries(grouped).map(([compTitle, compWorks]) => (
                  <div key={compTitle} className="mt-10">
                    <h2 className="font-display text-xl font-bold text-foreground mb-4">
                      {compTitle}
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {compWorks.map((work) => (
                          <GalleryCard
                              key={work.id}
                              work={work}
                              likes={
                                  likes?.filter((l) => l.application_id === work.id) || []
                              }
                              comments={
                                  comments?.filter(
                                      (c) => c.application_id === work.id
                                  ) || []
                              }
                              userId={user?.id}
                              authorName={authorName}
                              onToggleLike={() => toggleLike.mutate(work.id)}
                              onAddComment={(content, name) =>
                                  addComment.mutate({
                                    applicationId: work.id,
                                    content,
                                    authorName: name,
                                  })
                              }
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

// ─── карточка ────────────────────────────────────────────────────────────────

interface GalleryCardProps {
  work: Work;
  likes: Like[];
  comments: Comment[];
  userId: string | undefined;
  authorName: string;
  onToggleLike: () => void;
  onAddComment: (content: string, name: string) => void;
}

const GalleryCard = ({
                       work,
                       likes,
                       comments,
                       userId,
                       authorName,
                       onToggleLike,
                       onAddComment,
                     }: GalleryCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const isLiked = likes.some((l) => l.user_id === userId);
  const likesCount = likes.length;

  return (
      <div className="overflow-hidden rounded-2xl border bg-card shadow-playful transition-all hover:shadow-playful-hover">
        {work.file_url && (
            <a href={work.file_url} target="_blank" rel="noopener noreferrer">
              <img
                  src={work.file_url}
                  alt={work.work_title}
                  className="w-full object-cover max-h-80"
                  loading="lazy"
              />
            </a>
        )}

        <div className="p-4">
          <h3 className="font-display text-sm font-bold text-foreground">
            {work.work_title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {work.participant_name}
          </p>
          <Badge variant="secondary" className="text-xs mt-1">
            {work.nomination}
          </Badge>

          <div className="mt-4 flex items-center gap-3">
            {/* Кнопка лайка */}
            <button
                onClick={onToggleLike}
                className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-semibold transition-all
              ${
                    isLiked
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/40 text-muted-foreground hover:border-primary hover:text-primary"
                }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-primary" : ""}`} />
              <span>{likesCount}</span>
              <span className="text-xs font-normal">
              {likesCount === 1
                  ? "голос"
                  : likesCount >= 2 && likesCount <= 4
                      ? "голоса"
                      : "голосов"}
            </span>
            </button>

            {/* Кнопка комментариев */}
            <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground transition-all hover:border-primary hover:text-primary"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{comments.length}</span>
            </button>
          </div>

          {/* Комментарии */}
          {showComments && (
              <div className="mt-3 space-y-2 border-t pt-3">
                {comments.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Комментариев пока нет
                    </p>
                )}
                {comments.map((c) => (
                    <div key={c.id} className="text-xs">
                <span className="font-semibold text-foreground">
                  {c.author_name || "Аноним"}:{" "}
                </span>
                      <span className="text-muted-foreground">{c.content}</span>
                    </div>
                ))}

                {userId ? (
                    <div className="flex gap-2 mt-2">
                      <Textarea
                          placeholder="Написать комментарий..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="text-xs min-h-[36px] flex-1"
                          rows={1}
                      />
                      <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 px-2 self-end"
                          onClick={() => {
                            if (commentText.trim()) {
                              onAddComment(commentText.trim(), authorName);
                              setCommentText("");
                            }
                          }}
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground">
                      Войдите, чтобы оставить комментарий
                    </p>
                )}
              </div>
          )}
        </div>
      </div>
  );
};

export default GalleryPage;