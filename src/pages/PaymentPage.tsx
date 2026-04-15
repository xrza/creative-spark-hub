import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const PaymentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState("");
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  const { data: competition, isLoading } = useQuery({
    queryKey: ["competition", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("competitions").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleTestPayment = async () => {
    setPaying(true);
    // Simulate payment delay
    await new Promise((r) => setTimeout(r, 1500));
    setPaying(false);
    setPaid(true);
    toast.success("Оплата прошла успешно (тестовый режим)");
  };

  const handlePromoCode = () => {
    if (promoCode.trim().toUpperCase() === "FREE2026") {
      setPaid(true);
      toast.success("Промокод применён! Участие бесплатно.");
    } else {
      toast.error("Неверный промокод");
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
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/competitions">← Вернуться к конкурсам</Link>
        </Button>
      </div>
    );
  }

  const isFree = (competition.entry_fee ?? 0) === 0;

  if (isFree || paid) {
    return (
      <div className="container max-w-lg py-16 text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-success mb-4" />
        <h1 className="font-display text-2xl font-black text-foreground mb-2">
          {isFree ? "Участие бесплатно!" : "Оплата подтверждена!"}
        </h1>
        <p className="text-muted-foreground mb-6">Теперь заполните заявку на участие</p>
        <Button size="lg" asChild>
          <Link to={`/competitions/${id}/apply`}>Заполнить заявку</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="container max-w-lg">
        <Link to={`/competitions/${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Назад к конкурсу
        </Link>

        <div className="rounded-2xl border bg-card p-8 shadow-playful">
          <div className="text-center mb-6">
            <CreditCard className="mx-auto h-10 w-10 text-primary mb-3" />
            <h1 className="font-display text-2xl font-black text-foreground">Оплата участия</h1>
            <p className="mt-1 text-sm text-muted-foreground">{competition.title}</p>
          </div>

          <div className="rounded-xl bg-muted/50 p-4 mb-6 text-center">
            <div className="text-sm text-muted-foreground">Организационный взнос</div>
            <div className="font-display text-3xl font-black text-primary">{competition.entry_fee} ₽</div>
          </div>

          <Button onClick={handleTestPayment} className="w-full mb-4" size="lg" disabled={paying}>
            {paying ? "Обработка..." : "Оплатить (тестовый режим)"}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">или</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Input placeholder="Промокод" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
            <Button variant="outline" onClick={handlePromoCode}>Применить</Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">Тестовый промокод: FREE2026</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
