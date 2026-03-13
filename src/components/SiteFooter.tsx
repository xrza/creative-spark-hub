import { Link } from "react-router-dom";
import { Trophy, Mail, Phone } from "lucide-react";

const SiteFooter = () => {
  return (
    <footer className="border-t bg-card">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="font-display text-lg font-bold">ТворчествоКids</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Платформа дистанционных творческих конкурсов для детей и педагогов
            </p>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold mb-3">Навигация</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/competitions" className="text-sm text-muted-foreground hover:text-foreground">Конкурсы</Link>
              <Link to="/gallery" className="text-sm text-muted-foreground hover:text-foreground">Галерея</Link>
              <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground">О нас</Link>
            </nav>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold mb-3">Участникам</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/register" className="text-sm text-muted-foreground hover:text-foreground">Регистрация</Link>
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">Личный кабинет</Link>
            </nav>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold mb-3">Контакты</h4>
            <div className="flex flex-col gap-2">
              <a href="mailto:info@tvorchestvo-kids.ru" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <Mail className="h-4 w-4" />
                info@tvorchestvo-kids.ru
              </a>
              <a href="tel:+79001234567" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <Phone className="h-4 w-4" />
                +7 (900) 123-45-67
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} ТворчествоКids. Все права защищены.
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
