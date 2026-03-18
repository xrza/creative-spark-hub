import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, Award, Palette, Users, ArrowRight } from "lucide-react";
import CompetitionCard from "@/components/CompetitionCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import heroBanner from "@/assets/hero-banner.jpg";
import trophyIcon from "@/assets/trophy-icon.png";

const Index = () => {
  const { data: competitions } = useQuery({
    queryKey: ["competitions-featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("*")
        .in("status", ["active", "upcoming"])
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  const featured = competitions || [];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="container relative z-10 py-16 md:py-24">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="animate-fade-in-up">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                <Star className="h-4 w-4" />
                Творческая платформа №1
              </div>
              <h1 className="font-display text-4xl font-black leading-tight text-foreground md:text-5xl lg:text-6xl">
                Раскройте{" "}
                <span className="text-gradient-primary">талант</span>
                {" "}вашего ребёнка
              </h1>
              <p className="mt-4 text-lg text-muted-foreground md:text-xl">
                Студия Творчества — дистанционные творческие конкурсы для детей и педагогов.
                Участвуйте из любой точки России, получайте дипломы и призы!
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link to="/competitions">
                    Смотреть конкурсы
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/register">Зарегистрироваться</Link>
                </Button>
              </div>

              <div className="mt-10 flex gap-8">
                {[
                  { icon: Users, label: "участников", value: "5 000+" },
                  { icon: Award, label: "конкурсов", value: "120+" },
                  { icon: Palette, label: "работ", value: "15 000+" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="text-center">
                    <Icon className="mx-auto mb-1 h-5 w-5 text-primary" />
                    <div className="font-display text-xl font-black text-foreground">{value}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative hidden md:block">
              <img src={heroBanner} alt="Дети рисуют и занимаются творчеством" className="rounded-3xl shadow-playful" />
              <img src={trophyIcon} alt="Кубок" className="absolute -bottom-6 -left-6 h-24 w-24 animate-float" />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-20">
        <div className="container">
          <h2 className="text-center font-display text-3xl font-black text-foreground md:text-4xl">
            Как это работает?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
            Участие в конкурсах — это просто! Всего 4 шага до победы
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "01", title: "Выберите конкурс", desc: "Найдите подходящий конкурс для вашего ребёнка или педагогический конкурс", color: "bg-primary/10 text-primary" },
              { step: "02", title: "Оплатите участие", desc: "Оплатите организационный взнос или используйте промокод", color: "bg-secondary/10 text-secondary" },
              { step: "03", title: "Отправьте работу", desc: "Загрузите фото, видео или документ с творческой работой", color: "bg-accent/20 text-accent-foreground" },
              { step: "04", title: "Получите диплом", desc: "Дождитесь результатов и скачайте диплом победителя", color: "bg-success/10 text-success" },
            ].map(({ step, title, desc, color }) => (
              <div key={step} className="group rounded-2xl border bg-card p-6 transition-all duration-300 hover:shadow-playful hover:-translate-y-1">
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl font-display text-lg font-black ${color}`}>
                  {step}
                </div>
                <h3 className="font-display text-base font-bold text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured competitions */}
      {featured.length > 0 && (
        <section className="bg-muted/50 py-16 md:py-20">
          <div className="container">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="font-display text-3xl font-black text-foreground md:text-4xl">Актуальные конкурсы</h2>
                <p className="mt-2 text-muted-foreground">Примите участие прямо сейчас</p>
              </div>
              <Button variant="outline" asChild className="hidden sm:inline-flex">
                <Link to="/competitions">Все конкурсы →</Link>
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((comp) => (
                <CompetitionCard key={comp.id} competition={comp} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="rounded-3xl bg-gradient-to-br from-primary to-secondary p-10 text-center md:p-16">
            <h2 className="font-display text-3xl font-black text-primary-foreground md:text-4xl">
              Готовы к творчеству?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
              Зарегистрируйтесь сейчас и участвуйте в конкурсах совершенно бесплатно с промокодом!
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/register">Начать участие</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/competitions">Посмотреть конкурсы</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
