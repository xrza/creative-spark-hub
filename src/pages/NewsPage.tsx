import { Calendar } from "lucide-react";

const newsItems = [
  {
    id: 1,
    title: "Стартовал весенний конкурс «Краски весны»",
    date: "2026-03-20",
    text: "Приглашаем дошкольников и школьников принять участие в творческом конкурсе, посвящённом весне. Принимаются рисунки, поделки и фотоработы.",
  },
  {
    id: 2,
    title: "Подведены итоги зимнего конкурса «Новогоднее чудо»",
    date: "2026-02-15",
    text: "Благодарим всех участников! Дипломы победителей и призёров уже доступны в личном кабинете. Поздравляем!",
  },
  {
    id: 3,
    title: "Обновлена галерея лучших работ",
    date: "2026-01-28",
    text: "В галерее появились новые работы победителей. Заходите, голосуйте и оставляйте комментарии!",
  },
  {
    id: 4,
    title: "Новый раздел для педагогов",
    date: "2026-01-10",
    text: "Теперь педагоги могут участвовать в специальных номинациях: методические разработки, конспекты и сценарии мероприятий.",
  },
];

const NewsPage = () => {
  return (
    <div className="py-10">
      <div className="container max-w-3xl">
        <h1 className="font-display text-3xl font-black text-foreground mb-8">Новости</h1>
        <div className="space-y-6">
          {newsItems.map((item) => (
            <article key={item.id} className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(item.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
              </div>
              <h2 className="font-display text-lg font-bold text-foreground mb-2">{item.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewsPage;
