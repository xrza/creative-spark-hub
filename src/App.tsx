import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/components/MainLayout";
import Index from "./pages/Index";
import CompetitionsPage from "./pages/CompetitionsPage";
import CompetitionDetailPage from "./pages/CompetitionDetailPage";
import PaymentPage from "./pages/PaymentPage";
import ApplyPage from "./pages/ApplyPage";
import GalleryPage from "./pages/GalleryPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminPage from "./pages/AdminPage";
import NewsPage from "./pages/NewsPage";
import AgreementPage from "./pages/AgreementPage";
import PrivacyPage from "./pages/PrivacyPage";
import TopPage from "./pages/TopPage";
import NotFound from "./pages/NotFound";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfilePage from "@/pages/ProfilePage";
import PaymentPageB from "@/pages/PaymentPageB";
import ContactsPage from "@/pages/ContactsPage";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/competitions" element={<CompetitionsPage />} />
                <Route path="/competitions/:id" element={<CompetitionDetailPage />} />
                <Route path="/competitions/:id/pay" element={
                  <ProtectedRoute><PaymentPage /></ProtectedRoute>
                } />
                <Route path="/competitions/:id/apply" element={
                  <ProtectedRoute><ApplyPage /></ProtectedRoute>
                } />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/news" element={<NewsPage />} />
                <Route path="/agreement" element={<AgreementPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/payment" element={<PaymentPageB />} />
                <Route path="/contacts" element={<ContactsPage />} />
                <Route path="/top" element={<TopPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute><ProfilePage /></ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>
                } />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
);

export default App;
