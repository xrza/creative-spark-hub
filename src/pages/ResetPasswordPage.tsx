import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ResetPasswordPage = () => {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") {
                toast.info("Введите новый пароль");
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            toast.error("Пароль должен содержать минимум 6 символов");
            return;
        }
        if (password !== confirm) {
            toast.error("Пароли не совпадают");
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });
        setLoading(false);
        if (error) {
            toast.error("Ошибка: " + error.message);
        } else {
            toast.success("Пароль успешно изменён!");
            navigate("/login");
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-10">
            <div className="w-full max-w-md px-4">
                <div className="rounded-2xl border bg-card p-8 shadow-playful">
                    <div className="mb-6 text-center">
                        <Trophy className="mx-auto h-10 w-10 text-primary mb-3" />
                        <h1 className="font-display text-2xl font-black text-foreground">
                            Новый пароль
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Придумайте новый пароль для вашего аккаунта
                        </p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="new-password">Новый пароль</Label>
                            <Input
                                id="new-password"
                                type="password"
                                placeholder="Минимум 6 символов"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="confirm-password">Повторите пароль</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                placeholder="Повторите пароль"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" size="lg" disabled={loading}>
                            {loading ? "Сохранение..." : "Сохранить пароль"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;