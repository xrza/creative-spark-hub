import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("cookie_accepted") !== "true") {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const accept = () => {
    localStorage.setItem("cookie_accepted", "true");
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card p-4 shadow-lg">
      <div className="container flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Мы используем файлы cookie для улучшения работы сайта. Продолжая использование сайта, вы соглашаетесь с нашей{" "}
          <Link to="/privacy" className="text-primary underline hover:text-primary/80">
            Политикой конфиденциальности
          </Link>
          .
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
          <Button onClick={accept}>Принять</Button>
          <Button variant="outline" asChild>
            <Link to="/privacy">Подробнее</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
