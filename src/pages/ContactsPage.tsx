import { Link } from "react-router-dom";
import { ArrowLeft, Building2 } from "lucide-react";

const sections = [
    {
        title: "1. Информация о кураторе",
        text: "Куратор платформы «Студия Творчества» осуществляет деятельность в статусе самозанятого и оказывает услуги по организации дистанционных творческих конкурсов для детей и педагогов.",
    },
    {
        title: "2. ИНН",
        text: "645391153814",
    },
    {
        title: "3. Город",
        text: "Саратов",
    },
    {
        title: "4. Контактные данные",
        text: "Email: kidkonkurs@yandex.ru\nТелефон: 8 (917) 307-21-91\n Дмитрий Ильич С.",
    },
    {
        title: "5. Рабочие часы поддержки",
        text: "Поддержка отвечает на обращения в следующие часы: 10:00 - 21:00 мск",
    },
    {
        title: "6. Юридический статус",
        text: "Самозанятый (плательщик налога на профессиональный доход).",
    },
    {
        title: "7. Документы",
        text: "Пользовательское соглашение и Политика конфиденциальности доступны на сайте и являются неотъемлемой частью использования Платформы.",
    },
    {
        title: "8. Обращения по правам и данным",
        text: "Если вы хотите отозвать согласие на обработку персональных данных, уточнить сведения или направить запрос, связанный с вашими правами, используйте электронную почту kidkonkurs@yandex.ru.",
    },
];

const ContactsPage = () => {
    return (
        <div className="py-10">
            <div className="container max-w-3xl">
                <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> На главную
                </Link>

                <div className="rounded-2xl border bg-card p-8 shadow-playful">
                    <div className="mb-6 flex items-center gap-3">
                        <Building2 className="h-7 w-7 text-primary" />
                        <h1 className="font-display text-2xl font-black text-foreground">Реквизиты и контакты</h1>
                    </div>

                    <div className="space-y-6">
                        {sections.map((s) => (
                            <div key={s.title}>
                                <h2 className="mb-2 font-bold text-foreground">{s.title}</h2>
                                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 border-t pt-4 text-sm text-muted-foreground">
                        <div className="flex flex-wrap gap-4">
                            <Link to="/privacy" className="hover:text-foreground">Политика конфиденциальности</Link>
                            <Link to="/agreement" className="hover:text-foreground">Пользовательское соглашение</Link>
                            <Link to="/payment" className="hover:text-foreground">Оплата и возврат</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactsPage;