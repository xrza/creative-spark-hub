import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Trash2, Pencil, Check, X } from "lucide-react";

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
}

interface Props {
    newsId: string;
    isAdmin?: boolean;
}

export function NewsComments({ newsId, isAdmin }: Props) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [text, setText] = useState("");

    // id комментария который редактируем + его текст
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState("");

    const { data: comments = [] } = useQuery<Comment[]>({
        queryKey: ["news-comments", newsId],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("news_comments")
                .select("id, content, created_at, user_id")
                .eq("news_id", newsId)
                .order("created_at", { ascending: true });
            if (error) throw error;
            return data ?? [];
        },
    });

    const addComment = useMutation({
        mutationFn: async (content: string) => {
            if (!user) throw new Error("Необходимо войти в аккаунт");
            const { error } = await (supabase as any).from("news_comments").insert({
                news_id: newsId,
                user_id: user.id,
                content,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            setText("");
            queryClient.invalidateQueries({ queryKey: ["news-comments", newsId] });
        },
        onError: (e: any) => toast.error(e.message),
    });

    const updateComment = useMutation({
        mutationFn: async ({ id, content }: { id: string; content: string }) => {
            const { error } = await (supabase as any)
                .from("news_comments")
                .update({ content })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            setEditingId(null);
            setEditText("");
            queryClient.invalidateQueries({ queryKey: ["news-comments", newsId] });
        },
        onError: (e: any) => toast.error(e.message),
    });

    const deleteComment = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any)
                .from("news_comments")
                .delete()
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["news-comments", newsId] });
        },
        onError: (e: any) => toast.error(e.message),
    });

    const startEdit = (c: Comment) => {
        setEditingId(c.id);
        setEditText(c.content);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditText("");
    };

    return (
        <div className="mt-6">
            <h3 className="font-semibold text-base mb-4">
                Комментарии ({comments.length})
            </h3>

            <div className="space-y-3 mb-4">
                {comments.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        Будьте первым, кто прокомментирует!
                    </p>
                )}

                {comments.map((c) => {
                    const isOwn = user?.id === c.user_id;
                    const isEditing = editingId === c.id;

                    return (
                        <div key={c.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                {isOwn ? "Я" : "?"}
                            </div>

                            <div className="flex-1 bg-muted/50 rounded-xl px-4 py-2">
                                {/* Шапка */}
                                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs text-muted-foreground">
                    {isOwn ? "Вы" : "Участник"} ·{" "}
                      {format(new Date(c.created_at), "d MMM, HH:mm", { locale: ru })}
                  </span>

                                    {/* Кнопки управления — только своим или админу */}
                                    {(isAdmin || isOwn) && !isEditing && (
                                        <div className="flex gap-1.5">
                                            {/* Редактировать — только автор, не админ */}
                                            {isOwn && (
                                                <button
                                                    onClick={() => startEdit(c)}
                                                    className="text-muted-foreground hover:text-primary transition-colors"
                                                    title="Редактировать"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteComment.mutate(c.id)}
                                                className="text-muted-foreground hover:text-destructive transition-colors"
                                                title="Удалить"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Контент или поле редактирования */}
                                {isEditing ? (
                                    <div className="mt-2 flex flex-col gap-2">
                    <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={2}
                        maxLength={1000}
                        autoFocus
                        className="w-full border border-border rounded-lg px-3 py-1.5 text-sm resize-none bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={cancelEdit}
                                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <X className="h-3.5 w-3.5" /> Отмена
                                            </button>
                                            <button
                                                onClick={() =>
                                                    updateComment.mutate({ id: c.id, content: editText.trim() })
                                                }
                                                disabled={!editText.trim() || updateComment.isPending}
                                                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
                                            >
                                                <Check className="h-3.5 w-3.5" />
                                                {updateComment.isPending ? "Сохранение..." : "Сохранить"}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm mt-1">{c.content}</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Форма добавления */}
            {user ? (
                <div className="flex gap-2">
          <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (text.trim()) addComment.mutate(text.trim());
                  }
              }}
              placeholder="Написать комментарий... (Enter — отправить)"
              rows={2}
              maxLength={1000}
              className="flex-1 border border-border rounded-xl px-4 py-2 text-sm resize-none bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
                    <button
                        onClick={() => { if (text.trim()) addComment.mutate(text.trim()); }}
                        disabled={addComment.isPending || !text.trim()}
                        className="self-end px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm hover:bg-primary/90 disabled:opacity-50 transition"
                    >
                        {addComment.isPending ? "..." : "Отправить"}
                    </button>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">
                    <a href="/login" className="text-primary hover:underline">Войдите</a>
                    , чтобы оставить комментарий
                </p>
            )}
        </div>
    );
}