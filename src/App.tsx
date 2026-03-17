import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, dehydrate, hydrate } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import ActiveDirectory from "./pages/ActiveDirectory";
import DockerMonitoring from "./pages/DockerMonitoring";
import NotFound from "./pages/NotFound";

const QUERY_CACHE_KEY = "veeam-query-cache-v1";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

if (typeof window !== "undefined") {
  const cached = window.sessionStorage.getItem(QUERY_CACHE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as unknown;
      hydrate(queryClient, parsed);
    } catch {
      window.sessionStorage.removeItem(QUERY_CACHE_KEY);
    }
  }

  queryClient.getQueryCache().subscribe(() => {
    const snapshot = dehydrate(queryClient, {
      shouldDehydrateQuery: (query) => query.state.status === "success",
    });
    window.sessionStorage.setItem(QUERY_CACHE_KEY, JSON.stringify(snapshot));
  });
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppSidebar />
            <main className="flex-1">
              <header className="h-10 flex items-center border-b border-border bg-background px-2">
                <SidebarTrigger />
              </header>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/active-directory" element={<ActiveDirectory />} />
                <Route path="/docker" element={<DockerMonitoring />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
