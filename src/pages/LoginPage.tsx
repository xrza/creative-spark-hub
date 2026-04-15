import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Ошибка входа: " + error.message);
    } else {
      toast.success("Вы вошли в систему");
      navigate(from, { replace: true });
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error("Введите email");
      return;
    }
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (error) {
      toast.error("Ошибка: " + error.message);
    } else {
      toast.success("Письмо с инструкцией отправлено на " + resetEmail);
      setResetMode(false);
      setResetEmail("");
    }
  };

  if (resetMode) {
    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-10">
          <div className="w-full max-w-md px-4">
            <div className="rounded-2xl border bg-card p-8 shadow-playful">
              <div className="mb-6 text-center">
                <Trophy className="mx-auto h-10 w-10 text-primary mb-3" />
                <h1 className="font-display text-2xl font-black text-foreground">
                  Восстановление пароля
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Введите email указанный при регистрации — мы отправим ссылку для сброса пароля
                </p>
              </div>

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                      id="reset-email"
                      type="email"
                      placeholder="example@mail.ru"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                  />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={resetLoading}>
                  {resetLoading ? "Отправка..." : "Отправить ссылку"}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setResetMode(false)}
                >
                  ← Вернуться к входу
                </Button>
              </form>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-10">
        <div className="w-full max-w-md px-4">
          <div className="rounded-2xl border bg-card p-8 shadow-playful">
            <div className="mb-6 text-center">
              <Trophy className="mx-auto h-10 w-10 text-primary mb-3" />
              <h1 className="font-display text-2xl font-black text-foreground">Вход</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Войдите в свой личный кабинет
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="example@mail.ru"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="password">Пароль</Label>
                  <button
                      type="button"
                      onClick={() => setResetMode(true)}
                      className="text-xs text-primary hover:underline"
                  >
                    Забыли пароль?
                  </button>
                </div>
                <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Вход..." : "Войти"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Нет аккаунта?{" "}
              <Link to="/register" className="font-semibold text-primary hover:underline">
                Зарегистрироваться
              </Link>
            </div>
          </div>
        </div>
      </div>
  );
};

export default LoginPage;