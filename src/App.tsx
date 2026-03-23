import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CRMLayout } from "@/components/CRMLayout";

// Pages
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import DealsPage from "./pages/DealsPage.tsx";
import PeoplePage from "./pages/PeoplePage.tsx";
import CompaniesPage from "./pages/CompaniesPage.tsx";
import TasksPage from "./pages/TasksPage.tsx";
import SequencesPage from "./pages/SequencesPage.tsx";
import WhatsAppPage from "./pages/WhatsAppPage.tsx";
import CRMPage from "./pages/CRMPage.tsx";
import DataEnrichmentPage from "./pages/DataEnrichmentPage.tsx";
import AIAssistantPage from "./pages/AIAssistantPage.tsx";
import GrowthLabPage from "./pages/GrowthLabPage.tsx";
import AgentsPage from "./pages/AgentsPage.tsx";
import MetasPage from "./pages/MetasPage.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/deals" element={<CRMLayout><DealsPage /></CRMLayout>} />
          <Route path="/people" element={<CRMLayout><PeoplePage /></CRMLayout>} />
          <Route path="/companies" element={<CRMLayout><CompaniesPage /></CRMLayout>} />
          <Route path="/tasks" element={<CRMLayout><TasksPage /></CRMLayout>} />
          <Route path="/sequences" element={<CRMLayout><SequencesPage /></CRMLayout>} />
          <Route path="/whatsapp" element={<CRMLayout><WhatsAppPage /></CRMLayout>} />
          <Route path="/data-enrichment" element={<CRMLayout><DataEnrichmentPage /></CRMLayout>} />
          <Route path="/ai-assistant" element={<CRMLayout><AIAssistantPage /></CRMLayout>} />
          <Route path="/signals" element={<CRMLayout><CRMPage /></CRMLayout>} />
          <Route path="/growth-lab" element={<CRMLayout><GrowthLabPage /></CRMLayout>} />
          <Route path="/agents" element={<CRMLayout><AgentsPage /></CRMLayout>} />
          <Route path="/metas" element={<CRMLayout><MetasPage /></CRMLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
