import { Link } from "react-router-dom";
import { Trophy, Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const SiteHeader = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Trophy className="h-7 w-7 text-primary" />
          <span className="font-display text-xl font-bold text-foreground">ТворчествоКids</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/competitions" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Конкурсы
          </Link>
          <Link to="/gallery" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Галерея
          </Link>
          <Link to="/about" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            О нас
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Войти</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/register">Регистрация</Link>
          </Button>
        </div>

        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t bg-card p-4 md:hidden">
          <nav className="flex flex-col gap-3">
            <Link to="/competitions" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>Конкурсы</Link>
            <Link to="/gallery" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>Галерея</Link>
            <Link to="/about" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>О нас</Link>
            <hr className="border-border" />
            <Link to="/login" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Войти</Link>
            <Button size="sm" asChild>
              <Link to="/register" onClick={() => setMobileOpen(false)}>Регистрация</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default SiteHeader;
