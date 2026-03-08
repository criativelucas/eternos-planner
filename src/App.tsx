import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WeddingProvider } from "@/contexts/WeddingContext";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Items from "./pages/Items";
import Finances from "./pages/Finances";
import Timeline from "./pages/Timeline";
import Achievements from "./pages/Achievements";
import ConfigPage from "./pages/ConfigPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WeddingProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/itens" element={<Items />} />
              <Route path="/financas" element={<Finances />} />
              <Route path="/timeline" element={<Timeline />} />
              <Route path="/conquistas" element={<Achievements />} />
              <Route path="/config" element={<ConfigPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </WeddingProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
