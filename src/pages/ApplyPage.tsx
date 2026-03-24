import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const applicationSchema = z.object({
  participant_name: z.string().min(2, "Минимум 2 символа"),
  participant_age: z.number().min(0.1, "Минимум 0.1").max(100, "Максимум 100"),
  teacher_name: z.string().optional(),
  organization: z.string().optional(),
  work_title: z.string().min(2, "Минимум 2 символа"),
  nomination: z.string().min(1, "Выберите номинацию"),
});

const ApplyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    participant_name: "",
    participant_age: "",
    teacher_name: "",
    organization: "",
    work_title: "",
    nomination: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: competition, isLoading } = useQuery({
    queryKey: ["competition", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("competitions").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !competition) return;

    const parsed = applicationSchema.safeParse({
      ...form,
      participant_age: parseFloat(form.participant_age) || 0,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);

    let fileUrl = "";
    if (file) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("works").upload(path, file);
      if (uploadError) {
        toast.error("Ошибка загрузки файла: " + uploadError.message);
        setSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("works").getPublicUrl(path);
      fileUrl = urlData.publicUrl;
    }

    const isFree = (competition.entry_fee ?? 0) === 0;

    const { error } = await supabase.from("applications").insert({
      user_id: user.id,
      competition_id: competition.id,
      participant_name: parsed.data.participant_name,
      participant_age: parsed.data.participant_age,
      teacher_name: parsed.data.teacher_name || "",
      organization: parsed.data.organization || "",
      work_title: parsed.data.work_title,
      nomination: parsed.data.nomination,
      file_url: fileUrl,
      payment_status: isFree ? "free" : "paid",
    });

    setSubmitting(false);
    if (error) {
      toast.error("Ошибка отправки заявки: " + error.message);
    } else {
      toast.success("Заявка отправлена!");
      navigate("/dashboard");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Конкурс не найден</h1>
      </div>
    );
  }

  const nominations = competition.nomination ?? [];

  return (
    <div className="py-8">
      <div className="container max-w-lg">
        <Link to={`/competitions/${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Назад к конкурсу
        </Link>

        <div className="rounded-2xl border bg-card p-8 shadow-playful">
          <div className="mb-6 text-center">
            <h1 className="font-display text-2xl font-black text-foreground">Подача заявки</h1>
            <p className="mt-1 text-sm text-muted-foreground">{competition.title}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Имя участника *</Label>
              <Input value={form.participant_name} onChange={(e) => update("participant_name", e.target.value)} placeholder="Иванов Артём" />
              {errors.participant_name && <p className="text-xs text-destructive mt-1">{errors.participant_name}</p>}
            </div>

            <div>
              <Label>Возраст участника *</Label>
              <Input type="number" min={0.1} max={100} step={0.1} value={form.participant_age} onChange={(e) => update("participant_age", e.target.value)} placeholder="7" />
              {errors.participant_age && <p className="text-xs text-destructive mt-1">{errors.participant_age}</p>}
            </div>

            <div>
              <Label>ФИО педагога / руководителя</Label>
              <Input value={form.teacher_name} onChange={(e) => update("teacher_name", e.target.value)} placeholder="Иванова М.П." />
            </div>

            <div>
              <Label>Организация</Label>
              <Input value={form.organization} onChange={(e) => update("organization", e.target.value)} placeholder="МБДОУ Детский сад №1" />
            </div>

            <div>
              <Label>Название работы *</Label>
              <Input value={form.work_title} onChange={(e) => update("work_title", e.target.value)} placeholder="Весенний букет" />
              {errors.work_title && <p className="text-xs text-destructive mt-1">{errors.work_title}</p>}
            </div>

            <div>
              <Label>Номинация *</Label>
              <Select value={form.nomination} onValueChange={(v) => update("nomination", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите номинацию" />
                </SelectTrigger>
                <SelectContent>
                  {nominations.map((nom) => (
                    <SelectItem key={nom} value={nom}>{nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.nomination && <p className="text-xs text-destructive mt-1">{errors.nomination}</p>}
            </div>

            <div>
              <Label>Файл работы (фото, видео, документ)</Label>
              <div className="mt-1">
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-center hover:border-primary transition-colors">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {file ? file.name : "Нажмите для загрузки"}
                  </span>
                  <input type="file" className="hidden" accept="image/*,video/*,.pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? "Отправка..." : "Отправить заявку"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplyPage;
