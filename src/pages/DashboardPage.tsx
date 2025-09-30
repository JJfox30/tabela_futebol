import { useEffect, useState } from 'react';
import { Trophy, Users, Calendar, Target } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { Championship, Team, Match, MatchWithTeams } from '../types';

export const DashboardPage = () => {
  const [stats, setStats] = useState({
    activeChampionships: 0,
    totalTeams: 0,
    upcomingMatches: 0,
    finishedMatches: 0,
  });
  const [recentMatches, setRecentMatches] = useState<MatchWithTeams[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<MatchWithTeams[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [champData, teamsData, matchesData] = await Promise.all([
        supabase.from('championships').select('*').eq('status', 'active'),
        supabase.from('teams').select('*'),
        supabase.from('matches').select(`
          *,
          home_team:teams!matches_home_team_id_fkey(*),
          away_team:teams!matches_away_team_id_fkey(*)
        `).order('match_date', { ascending: false }).limit(50)
      ]);

      const activeChamps = champData.data?.length || 0;
      const totalTeams = teamsData.data?.length || 0;
      const matches = matchesData.data || [];

      const upcoming = matches.filter(m =>
        m.status === 'scheduled' && new Date(m.match_date) > new Date()
      );
      const finished = matches.filter(m => m.status === 'finished');
      const recent = finished.slice(0, 5);

      setStats({
        activeChampionships: activeChamps,
        totalTeams,
        upcomingMatches: upcoming.length,
        finishedMatches: finished.length,
      });

      setRecentMatches(recent);
      setUpcomingMatches(upcoming.slice(0, 5));
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statCards = [
    {
      title: 'Campeonatos Ativos',
      value: stats.activeChampionships,
      icon: Trophy,
      color: 'bg-blue-500',
      lightBg: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Times Cadastrados',
      value: stats.totalTeams,
      icon: Users,
      color: 'bg-green-500',
      lightBg: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Próximas Partidas',
      value: stats.upcomingMatches,
      icon: Calendar,
      color: 'bg-yellow-500',
      lightBg: 'bg-yellow-50 dark:bg-yellow-900/20'
    },
    {
      title: 'Partidas Realizadas',
      value: stats.finishedMatches,
      icon: Target,
      color: 'bg-purple-500',
      lightBg: 'bg-purple-50 dark:bg-purple-900/20'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} hover>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.lightBg}`}>
                    <Icon className={`w-6 h-6 text-white ${stat.color.replace('bg-', 'text-')}`} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Últimos Resultados
            </h3>
            {recentMatches.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                Nenhum resultado disponível
              </p>
            ) : (
              <div className="space-y-4">
                {recentMatches.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex-1 text-right">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {match.home_team.name}
                      </p>
                    </div>
                    <div className="px-6 text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {match.home_score} - {match.away_score}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(match.match_date)}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {match.away_team.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Próximas Partidas
            </h3>
            {upcomingMatches.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                Nenhuma partida agendada
              </p>
            ) : (
              <div className="space-y-4">
                {upcomingMatches.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex-1 text-right">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {match.home_team.name}
                      </p>
                    </div>
                    <div className="px-6 text-center">
                      <p className="text-xl font-bold text-gray-500 dark:text-gray-400">
                        VS
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(match.match_date)}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {match.away_team.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};