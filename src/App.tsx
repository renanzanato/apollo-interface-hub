import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { CRMLayout } from "@/components/CRMLayout";
import CRMPage from "./pages/CRMPage";
import DealsPage from "./pages/DealsPage";

const queryClient = new QueryClient();

const crmRoutes = [
  "/people", "/companies", "/data-enrichment", "/signals",
  "/sequences", "/whatsapp", "/tasks",
  "/ai-assistant",
];

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/deals"
            element={
              <CRMLayout>
                <DealsPage />
              </CRMLayout>
            }
          />
          {crmRoutes.map((path) => (
            <Route
              key={path}
              path={path}
              element={
                <CRMLayout>
                  <CRMPage />
                </CRMLayout>
              }
            />
          ))}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
