import { useEffect, useState } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { supabase } from '../lib/supabase';
import { Championship, Team, Match, StandingsEntry } from '../types';

export const StandingsPage = () => {
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [selectedChampionship, setSelectedChampionship] = useState<string>('');
  const [standings, setStandings] = useState<StandingsEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChampionships();
  }, []);

  useEffect(() => {
    if (selectedChampionship) calculateStandings(selectedChampionship);
  }, [selectedChampionship]);

  const loadChampionships = async () => {
    try {
      const { data, error } = await supabase
        .from('championships')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setChampionships(data || []);
      if (data && data.length > 0) {
        setSelectedChampionship(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar campeonatos:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStandings = async (championshipId: string) => {
    try {
      const championship = championships.find(c => c.id === championshipId);
      if (!championship) return;

      const [matchesData, teamsData] = await Promise.all([
        supabase
          .from('matches')
          .select('*')
          .eq('championship_id', championshipId)
          .eq('status', 'finished'),
        supabase
          .from('championship_teams')
          .select('team_id, teams(*)')
          .eq('championship_id', championshipId)
      ]);

      const matches = matchesData.data || [];
      const teams = teamsData.data?.map(ct => ct.teams) || [];

      const stats = teams.map((team: Team) => {
        const homeMatches = matches.filter(m => m.home_team_id === team.id);
        const awayMatches = matches.filter(m => m.away_team_id === team.id);

        let won = 0, drawn = 0, lost = 0, goalsFor = 0, goalsAgainst = 0;

        homeMatches.forEach(m => {
          goalsFor += m.home_score || 0;
          goalsAgainst += m.away_score || 0;
          if ((m.home_score || 0) > (m.away_score || 0)) won++;
          else if ((m.home_score || 0) === (m.away_score || 0)) drawn++;
          else lost++;
        });

        awayMatches.forEach(m => {
          goalsFor += m.away_score || 0;
          goalsAgainst += m.home_score || 0;
          if ((m.away_score || 0) > (m.home_score || 0)) won++;
          else if ((m.away_score || 0) === (m.home_score || 0)) drawn++;
          else lost++;
        });

        const played = homeMatches.length + awayMatches.length;
        const points = won * championship.points_victory + drawn * championship.points_draw + lost * championship.points_defeat;
        const goalDifference = goalsFor - goalsAgainst;

        return {
          position: 0,
          team,
          played,
          won,
          drawn,
          lost,
          goals_for: goalsFor,
          goals_against: goalsAgainst,
          goal_difference: goalDifference,
          points,
        };
      });

      stats.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
        if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
        return a.team.name.localeCompare(b.team.name);
      });

      stats.forEach((entry, index) => {
        entry.position = index + 1;
      });

      setStandings(stats);
    } catch (error) {
      console.error('Erro ao calcular classificação:', error);
    }
  };

  const getPositionIndicator = (position: number) => {
    if (position <= 4) {
      return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />;
    } else if (position >= standings.length - 3) {
      return <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />;
    }
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getRowColor = (position: number) => {
    if (position <= 4) {
      return 'bg-green-50 dark:bg-green-900/10';
    } else if (position >= standings.length - 3) {
      return 'bg-red-50 dark:bg-red-900/10';
    }
    return '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Select
          label="Campeonato"
          options={championships.map(c => ({ value: c.id, label: c.name }))}
          value={selectedChampionship}
          onChange={(e) => setSelectedChampionship(e.target.value)}
          fullWidth
        />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Time</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">PG</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">V</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">E</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">D</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">GP</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">GC</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SG</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase font-bold">PTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {standings.map((entry) => (
                <tr key={entry.team.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${getRowColor(entry.position)}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getPositionIndicator(entry.position)}
                      <span className="font-bold text-gray-900 dark:text-white">{entry.position}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {entry.position <= 3 && (
                        <Trophy className={`w-5 h-5 ${
                          entry.position === 1 ? 'text-yellow-500' :
                          entry.position === 2 ? 'text-gray-400' :
                          'text-orange-600'
                        }`} />
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">{entry.team.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-900 dark:text-white">{entry.played}</td>
                  <td className="px-4 py-3 text-center text-gray-900 dark:text-white">{entry.won}</td>
                  <td className="px-4 py-3 text-center text-gray-900 dark:text-white">{entry.drawn}</td>
                  <td className="px-4 py-3 text-center text-gray-900 dark:text-white">{entry.lost}</td>
                  <td className="px-4 py-3 text-center text-gray-900 dark:text-white">{entry.goals_for}</td>
                  <td className="px-4 py-3 text-center text-gray-900 dark:text-white">{entry.goals_against}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={entry.goal_difference >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {entry.goal_difference > 0 ? '+' : ''}{entry.goal_difference}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-lg text-gray-900 dark:text-white">{entry.points}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {standings.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Nenhum dado disponível para classificação</p>
            </div>
          )}
        </div>
      </Card>

      {standings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="p-4 flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Classificação (Top 4)</span>
            </div>
          </Card>
          <Card>
            <div className="p-4 flex items-center gap-3">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Zona Intermediária</span>
            </div>
          </Card>
          <Card>
            <div className="p-4 flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Rebaixamento (Últimos 3)</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};