import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ChampionshipsPage } from './pages/ChampionshipsPage';
import { TeamsPage } from './pages/TeamsPage';
import { MatchesPage } from './pages/MatchesPage';
import { StandingsPage } from './pages/StandingsPage';
import { MainLayout } from './components/layout/MainLayout';

type Page = 'dashboard' | 'championships' | 'teams' | 'matches' | 'standings';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const pageConfig = {
    dashboard: { title: 'Dashboard', component: <DashboardPage /> },
    championships: { title: 'Campeonatos', component: <ChampionshipsPage /> },
    teams: { title: 'Times', component: <TeamsPage /> },
    matches: { title: 'Partidas', component: <MatchesPage /> },
    standings: { title: 'Classificação', component: <StandingsPage /> },
  };

  const config = pageConfig[currentPage];

  return (
    <MainLayout
      currentPage={currentPage}
      onNavigate={(page) => setCurrentPage(page as Page)}
      title={config.title}
    >
      {config.component}
    </MainLayout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
