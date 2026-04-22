import { Link } from "react-router-dom";
import { Trophy, Menu, X, User, LogOut, LayoutDashboard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const SiteHeader = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { session, profile, isAdmin, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Студия Творчества" className="h-20 w-60" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/competitions" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Конкурсы
          </Link>
          <Link to="/gallery" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Галерея
          </Link>
          <Link to="/news" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Новости
          </Link>
          <Link to="/top" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Топ участников
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {session ? (
            <>
              {isAdmin && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin"><Shield className="h-4 w-4 mr-1" />Админ</Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard"><LayoutDashboard className="h-4 w-4 mr-1" />Кабинет</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-1" />Выйти
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Войти</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Регистрация</Link>
              </Button>
            </>
          )}
        </div>

        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t bg-card p-4 md:hidden">
          <nav className="flex flex-col gap-3">
            <Link to="/competitions" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>Конкурсы</Link>
            <Link to="/gallery" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>Галерея</Link>
            <Link to="/news" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>Новости</Link>
            <Link to="/top" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>Топ участников</Link>
            <hr className="border-border" />
            {session ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Админ-панель</Link>
                )}
                <Link to="/dashboard" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Личный кабинет</Link>
                <Button size="sm" variant="ghost" onClick={() => { signOut(); setMobileOpen(false); }}>Выйти</Button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Войти</Link>
                <Button size="sm" asChild>
                  <Link to="/register" onClick={() => setMobileOpen(false)}>Регистрация</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default SiteHeader;
