import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import WelcomePage from "./pages/WelcomePage";
import ImplementationPage from "./pages/ImplementationPage";
import SessionDetailPage from "./pages/SessionDetailPage";
import ScriptsPage from "./pages/ScriptsPage";
import ReflectionPage from "./pages/ReflectionPage";
import ValuesPage from "./pages/ValuesPage";
import ParentKitPage from "./pages/ParentKitPage";
import PrivacyPage from "./pages/PrivacyPage";


function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/welcome" component={WelcomePage} />
      <Route path="/implementation" component={ImplementationPage} />
      <Route path="/sessions/:id" component={SessionDetailPage} />
      <Route path="/scripts" component={ScriptsPage} />
      <Route path="/reflection-prompts" component={ReflectionPage} />
      <Route path="/values-map" component={ValuesPage} />
      <Route path="/parent-kit" component={ParentKitPage} />
      <Route path="/privacy-brief" component={PrivacyPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
