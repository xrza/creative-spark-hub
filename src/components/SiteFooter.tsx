import { Link } from "react-router-dom";
import { Mail, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const SiteFooter = () => {
  const { user } = useAuth();

  return (
      <footer className="border-t bg-card">
        <div className="container py-12">
          <div className="grid gap-8 md:grid-cols-4 items-start">
            <div>
              <Link to="/" className="inline-block">
                <img
                    src="/logo.png"
                    alt="Студия Творчества"
                    style={{ height: "80px", width: "auto", display: "block" }}
                />
              </Link>
              <p className="text-sm text-muted-foreground mt-1">
                Платформа дистанционных творческих конкурсов для детей и педагогов
              </p>
            </div>

            <div>
              <h4 className="font-display text-sm font-bold mb-3">Навигация</h4>
              <nav className="flex flex-col gap-2">
                <Link to="/competitions" className="text-sm text-muted-foreground hover:text-foreground">Конкурсы</Link>
                <Link to="/gallery" className="text-sm text-muted-foreground hover:text-foreground">Галерея</Link>
              </nav>
            </div>

            <div>
              <h4 className="font-display text-sm font-bold mb-3">Документы</h4>
              <nav className="flex flex-col gap-2">
                <Link to="/agreement" className="text-sm text-muted-foreground hover:text-foreground">
                  Пользовательское соглашение
                </Link>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                  Политика конфиденциальности
                </Link>
                <Link to="/payment" className="text-sm text-muted-foreground hover:text-foreground">
                  Оплата и возврат
                </Link>
                <Link to="/contacts" className="text-sm text-muted-foreground hover:text-foreground">
                  Реквизиты и контакты
                </Link>
              </nav>
            </div>

            <div>
              <h4 className="font-display text-sm font-bold mb-3">Участникам</h4>
              <nav className="flex flex-col gap-2">
                <Link
                    to={user ? "/dashboard" : "/login"}
                    className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Личный кабинет
                </Link>
              </nav>
            </div>

            <div>
              <h4 className="font-display text-sm font-bold mb-3">Контакты</h4>
              <div className="flex flex-col gap-2">
                <a
                    href="mailto:kidkonkurs@yandex.ru"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Mail className="h-4 w-4" />
                  kidkonkurs@yandex.ru
                </a>
                <a
                    href="tel:+79173072191"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Phone className="h-4 w-4" />
                  8 (917) 307-21-91
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Студия Творчества. Все права защищены.
          </div>
        </div>
      </footer>
  );
};

export default SiteFooter;