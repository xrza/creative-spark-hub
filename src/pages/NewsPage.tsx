/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Calendar, Plus, X, Edit } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { NewsReactions } from "@/components/NewsReactions";
import { NewsComments } from "@/components/NewsComments";

const NewsPage = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { hash } = useLocation();

  // Скролл к нужной новости при переходе по якорной ссылке с главной страницы
  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
      }
    }
  }, [hash]);

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

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Редактирование новости
  const [editingNews, setEditingNews] = useState<any | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const publishNews = async () => {
    if (!form.title || !form.body) return;
    setSubmitting(true);
    try {
      let photo_url: string | null = null;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("news").upload(path, photoFile);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("news").getPublicUrl(path);
        photo_url = urlData.publicUrl;
      }
      const { error } = await supabase.from("news").insert({ title: form.title, body: form.body, photo_url });
      if (error) throw error;
      toast.success("Новость опубликована!");
      queryClient.invalidateQueries({ queryKey: ["news"] });
      setOpen(false);
      setForm({ title: "", body: "" });
      setPhotoFile(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const saveEditNews = async () => {
    if (!editingNews || !editingNews.title || !editingNews.body) return;
    setEditSubmitting(true);
    try {
      let photo_url = editingNews.photo_url;
      if (editPhotoFile) {
        const ext = editPhotoFile.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("news").upload(path, editPhotoFile);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("news").getPublicUrl(path);
        photo_url = urlData.publicUrl;
      }
      const { error } = await supabase.from("news")
          .update({ title: editingNews.title, body: editingNews.body, photo_url })
          .eq("id", editingNews.id);
      if (error) throw error;
      toast.success("Новость обновлена!");
      queryClient.invalidateQueries({ queryKey: ["news"] });
      setEditOpen(false);
      setEditingNews(null);
      setEditPhotoFile(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setEditSubmitting(false);
    }
  };

  const deleteNews = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("news").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Новость удалена");
      queryClient.invalidateQueries({ queryKey: ["news"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
      <div className="py-10">
        <div className="container max-w-3xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display text-3xl font-black text-foreground">Новости</h1>
            {isAdmin && (
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button><Plus className="h-4 w-4 mr-1" /> Добавить новость</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Новая новость</DialogTitle></DialogHeader>
                    <div className="space-y-3 mt-4">
                      <div><Label>Заголовок *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                      <div><Label>Текст новости *</Label><Textarea rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
                      <div>
                        <Label>Фото</Label>
                        <input type="file" accept="image/*" className="mt-1 block w-full text-sm" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
                      </div>
                      <Button className="w-full" onClick={publishNews} disabled={submitting || !form.title || !form.body}>
                        {submitting ? "Публикация..." : "Опубликовать"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
            )}
          </div>

          {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
          ) : !news?.length ? (
              <p className="text-center text-muted-foreground py-20">Новостей пока нет</p>
          ) : (
              <div className="space-y-6">
                {news.map((item) => (
                    <article key={item.id} id={String(item.id)} className="relative rounded-2xl border bg-card overflow-hidden shadow-sm">
                      {/* Кнопки управления для админа */}
                      {isAdmin && (
                          <div className="absolute top-3 right-3 z-10 flex gap-2">
                            <button
                                onClick={() => { setEditingNews(item); setEditPhotoFile(null); setEditOpen(true); }}
                                className="rounded-full bg-white/90 p-1.5 text-gray-700 hover:bg-white shadow transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => deleteNews.mutate(item.id)}
                                className="rounded-full bg-destructive/90 p-1.5 text-destructive-foreground hover:bg-destructive shadow transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                      )}

                      {/* Фото новости — фиксированная высота с правильным кадрированием */}
                      {item.photo_url && (
                          <div className="w-full aspect-video overflow-hidden">
                            <img
                                src={item.photo_url}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                          </div>
                      )}

                      <div className="p-6">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(item.published_at!).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                        </div>
                        <h2 className="font-display text-lg font-bold text-foreground mb-2">{item.title}</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>

                        {/* Реакции и комментарии */}
                        <NewsReactions newsId={item.id} />
                        <NewsComments newsId={item.id} isAdmin={isAdmin} />
                      </div>
                    </article>
                ))}
              </div>
          )}

          {/* Диалог редактирования новости */}
          <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) { setEditingNews(null); setEditPhotoFile(null); } }}>
            <DialogContent>
              <DialogHeader><DialogTitle>Редактировать новость</DialogTitle></DialogHeader>
              {editingNews && (
                  <div className="space-y-3 mt-4">
                    <div>
                      <Label>Заголовок *</Label>
                      <Input value={editingNews.title} onChange={(e) => setEditingNews({ ...editingNews, title: e.target.value })} />
                    </div>
                    <div>
                      <Label>Текст новости *</Label>
                      <Textarea rows={5} value={editingNews.body} onChange={(e) => setEditingNews({ ...editingNews, body: e.target.value })} />
                    </div>
                    <div>
                      <Label>Фото</Label>
                      {editingNews.photo_url && !editPhotoFile && (
                          <div className="w-full aspect-video overflow-hidden rounded-lg mb-2">
                            <img src={editingNews.photo_url} alt="" className="w-full h-full object-cover" />
                          </div>
                      )}
                      {editPhotoFile && (
                          <div className="w-full aspect-video overflow-hidden rounded-lg mb-2 bg-muted flex items-center justify-center">
                            <img src={URL.createObjectURL(editPhotoFile)} alt="" className="w-full h-full object-cover" />
                          </div>
                      )}
                      <input
                          type="file"
                          accept="image/*"
                          className="mt-1 block w-full text-sm"
                          onChange={(e) => setEditPhotoFile(e.target.files?.[0] || null)}
                      />
                      {editPhotoFile && <p className="text-xs text-muted-foreground mt-1">✓ {editPhotoFile.name}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => { setEditOpen(false); setEditingNews(null); setEditPhotoFile(null); }}>
                        Отмена
                      </Button>
                      <Button className="flex-1" onClick={saveEditNews} disabled={editSubmitting || !editingNews.title || !editingNews.body}>
                        {editSubmitting ? "Сохранение..." : "Сохранить"}
                      </Button>
                    </div>
                  </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
  );
};

export default NewsPage;