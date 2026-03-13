import { Route, Switch } from "wouter";
import IndexPage from "./pages/IndexPage";
import ParentsPage from "./pages/ParentsPage";
import SchoolsPage from "./pages/SchoolsPage";
import InvestorsPage from "./pages/InvestorsPage";
import ElevatorPage from "./pages/ElevatorPage";
import ReferencesPage from "./pages/ReferencesPage";

export default function App() {
  return (
    <Switch>
      <Route path="/" component={IndexPage} />
      <Route path="/parents" component={ParentsPage} />
      <Route path="/schools" component={SchoolsPage} />
      <Route path="/investors" component={InvestorsPage} />
      <Route path="/elevator" component={ElevatorPage} />
      <Route path="/references" component={ReferencesPage} />
    </Switch>
  );
}
