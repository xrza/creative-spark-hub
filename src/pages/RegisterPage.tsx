import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Role = "participant" | "teacher";

// Только кириллица, пробелы и дефис — минимум два слова
const RUSSIAN_NAME_RE = /^[А-ЯЁа-яё]+(?:[-\s][А-ЯЁа-яё]+){1,}$/;
// Полный email — обязательно домен с точкой
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Телефон: +7XXXXXXXXXX или 8XXXXXXXXXX — ровно 11 цифр
const PHONE_RE = /^(\+7|8)\d{10}$/;

const RegisterPage = () => {
  const [role, setRole] = useState<Role>("participant");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    city: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = (): string | null => {
    const { name, email, password, phone, city } = formData;

    if (!name.trim()) return "Введите ваше имя";
    if (!RUSSIAN_NAME_RE.test(name.trim()))
      return "Имя должно быть написано русскими буквами и содержать минимум имя и фамилию";

    if (!email.trim()) return "Введите email";
    if (!EMAIL_RE.test(email.trim()))
      return "Введите корректный email, например: example@mail.ru";
    if (!email.includes("."))
      return "Email должен содержать домен, например: example@mail.ru";

    if (!password.trim()) return "Введите пароль";
    if (password.length < 6) return "Пароль должен содержать минимум 6 символов";

    if (!phone.trim()) return "Введите номер телефона";
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
    if (!PHONE_RE.test(cleanPhone))
      return "Введите телефон в формате +79262252503 или 89262252503";

    if (!city.trim()) return "Введите ваш город";

    if (!agreed) return "Необходимо принять пользовательское соглашение";

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setLoading(true);
    const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, "");

    const { error: signUpError } = await supabase.auth.signUp({
      email: formData.email.trim(),
      password: formData.password,
      options: {
        data: {
          full_name: formData.name.trim(),
          phone: cleanPhone,
          city: formData.city.trim(),
          role,
        },
      },
    });

    setLoading(false);
    if (signUpError) {
      toast.error("Ошибка регистрации: " + signUpError.message);
    } else {
      toast.success("Регистрация успешна!");
      navigate("/login");
    }
  };

  const update = (field: string, value: string) =>
      setFormData((prev) => ({ ...prev, [field]: value }));

  return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-10">
        <div className="w-full max-w-md px-4">
          <div className="rounded-2xl border bg-card p-8 shadow-playful">
            <div className="mb-6 text-center">
              <Trophy className="mx-auto h-10 w-10 text-primary mb-3" />
              <h1 className="font-display text-2xl font-black text-foreground">Регистрация</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Создайте аккаунт для участия в конкурсах
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
              {([
                ["participant", "Я родитель"],
                ["teacher", "Я педагог"],
              ] as [Role, string][]).map(([val, label]) => (
                  <button
                      key={val}
                      type="button"
                      onClick={() => setRole(val)}
                      className={`rounded-lg py-2.5 text-sm font-semibold transition-all ${
                          role === val
                              ? "bg-card text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {label}
                  </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">
                  Фамилия Имя Отчество <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="name"
                    placeholder="Иванова Мария Петровна"
                    value={formData.name}
                    onChange={(e) => update("name", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Только русские буквы, минимум фамилия и имя
                </p>
              </div>

              <div>
                <Label htmlFor="reg-email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="reg-email"
                    type="email"
                    placeholder="example@mail.ru"
                    value={formData.email}
                    onChange={(e) => update("email", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Например: charme@yandex.ru — только полный адрес с доменом
                </p>
              </div>

              <div>
                <Label htmlFor="reg-password">
                  Пароль <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="reg-password"
                    type="password"
                    placeholder="Минимум 6 символов"
                    value={formData.password}
                    onChange={(e) => update("password", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="phone">
                  Телефон <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="phone"
                    type="tel"
                    placeholder="+79262252503"
                    value={formData.phone}
                    onChange={(e) => update("phone", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Формат: +79262252503 или 89262252503
                </p>
              </div>

              <div>
                <Label htmlFor="city">
                  Город <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="city"
                    placeholder="Москва"
                    value={formData.city}
                    onChange={(e) => update("city", e.target.value)}
                />
              </div>

              <div className="flex items-start gap-3 rounded-xl border bg-muted/50 p-3">
                <input
                    type="checkbox"
                    id="agreement"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 cursor-pointer accent-primary"
                />
                <label
                    htmlFor="agreement"
                    className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
                >
                  Я принимаю условия{" "}
                  <a
                      href="/agreement"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                  >
                    Пользовательского соглашения
                  </a>{" "}
                  и даю согласие на обработку персональных данных в соответствии с{" "}
                  <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                  >
                    Политикой конфиденциальности
                  </a>
                </label>
              </div>

              <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading || !agreed}
              >
                {loading ? "Регистрация..." : "Зарегистрироваться"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Уже есть аккаунт?{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Войти
              </Link>
            </div>
          </div>
        </div>
      </div>
  );
};

export default RegisterPage;