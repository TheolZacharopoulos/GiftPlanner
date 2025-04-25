import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
import Home from "@/pages/home";
import CreateSession from "@/pages/create-session";
import JoinSession from "@/pages/join-session";
import SessionCreated from "@/pages/session-created";
import ParticipantView from "@/pages/participant-view";
import OrganizerView from "@/pages/organizer-view";
import EditGift from "@/pages/edit-gift";
import RemoveParticipant from "@/pages/remove-participant";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/create" component={CreateSession} />
      <Route path="/join" component={JoinSession} />
      <Route path="/session-created/:sessionId" component={SessionCreated} />
      <Route path="/session/:sessionId/participant/:name" component={ParticipantView} />
      <Route path="/session/:sessionId/organizer" component={OrganizerView} />
      <Route path="/session/:sessionId/edit" component={EditGift} />
      <Route path="/session/:sessionId/remove-participant" component={RemoveParticipant} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <Router />
      </Layout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
