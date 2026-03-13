import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy } from "lucide-react";

type Role = "parent" | "teacher";

const RegisterPage = () => {
  const [role, setRole] = useState<Role>("parent");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    childName: "",
    childAge: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Will connect to backend later
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
            <p className="mt-1 text-sm text-muted-foreground">Создайте аккаунт для участия в конкурсах</p>
          </div>

          {/* Role selector */}
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
            {([
              ["parent", "Я родитель"],
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
              <Label htmlFor="name">Ваше имя</Label>
              <Input
                id="name"
                placeholder="Иванова Мария Петровна"
                value={formData.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="reg-email">Email</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="example@mail.ru"
                value={formData.email}
                onChange={(e) => update("email", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="reg-password">Пароль</Label>
              <Input
                id="reg-password"
                type="password"
                placeholder="Минимум 8 символов"
                value={formData.password}
                onChange={(e) => update("password", e.target.value)}
                required
                minLength={8}
              />
            </div>

            {role === "parent" && (
              <>
                <div>
                  <Label htmlFor="childName">Имя ребёнка</Label>
                  <Input
                    id="childName"
                    placeholder="Иванов Артём"
                    value={formData.childName}
                    onChange={(e) => update("childName", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="childAge">Возраст ребёнка</Label>
                  <Input
                    id="childAge"
                    type="number"
                    placeholder="7"
                    min="3"
                    max="18"
                    value={formData.childAge}
                    onChange={(e) => update("childAge", e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <Button type="submit" className="w-full" size="lg">
              Зарегистрироваться
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
