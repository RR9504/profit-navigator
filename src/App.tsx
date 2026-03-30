import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdvisorPage from "./pages/AdvisorPage";
import AdminPage from "./pages/AdminPage";
import PortfolioPage from "./pages/PortfolioPage";
import ModelInfoPage from "./pages/ModelInfoPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AdvisorPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/modell" element={<ModelInfoPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
