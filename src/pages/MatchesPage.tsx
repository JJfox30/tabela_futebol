import { useEffect, useState } from 'react';
import { Plus, CreditCard as Edit } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Match, Championship, Team, MatchWithTeams } from '../types';

export const MatchesPage = () => {
  const { isAdmin } = useAuth();
  const [matches, setMatches] = useState<MatchWithTeams[]>([]);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedChampionship, setSelectedChampionship] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    championship_id: '',
    home_team_id: '',
    away_team_id: '',
    round: 1,
    match_date: '',
    location: '',
    status: 'scheduled',
    home_score: null as number | null,
    away_score: null as number | null,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedChampionship) loadMatches(selectedChampionship);
  }, [selectedChampionship]);

  const loadData = async () => {
    try {
      const [champsData, teamsData] = await Promise.all([
        supabase.from('championships').select('*').order('created_at', { ascending: false }),
        supabase.from('teams').select('*').order('name'),
      ]);
      setChampionships(champsData.data || []);
      setTeams(teamsData.data || []);
      if (champsData.data && champsData.data.length > 0) {
        setSelectedChampionship(champsData.data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async (championshipId: string) => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(*),
          away_team:teams!matches_away_team_id_fkey(*)
        `)
        .eq('championship_id', championshipId)
        .order('round')
        .order('match_date');
      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error('Erro ao carregar partidas:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...formData, championship_id: selectedChampionship };
      if (editingMatch) {
        const { error } = await supabase.from('matches').update(data).eq('id', editingMatch.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('matches').insert([data]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      resetForm();
      loadMatches(selectedChampionship);
    } catch (error: any) {
      alert('Erro: ' + error.message);
    }
  };

  const resetForm = () => {
    setEditingMatch(null);
    setFormData({
      championship_id: '',
      home_team_id: '',
      away_team_id: '',
      round: 1,
      match_date: '',
      location: '',
      status: 'scheduled',
      home_score: null,
      away_score: null,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusOptions = [
    { value: 'scheduled', label: 'Agendado' },
    { value: 'in_progress', label: 'Em Andamento' },
    { value: 'finished', label: 'Finalizado' },
    { value: 'postponed', label: 'Adiado' },
  ];

  const getStatusBadge = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      in_progress: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      finished: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      postponed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
    return colors[status as keyof typeof colors] || colors.scheduled;
  };

  const groupedMatches = matches.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, MatchWithTeams[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          <Select
            label="Campeonato"
            options={championships.map(c => ({ value: c.id, label: c.name }))}
            value={selectedChampionship}
            onChange={(e) => setSelectedChampionship(e.target.value)}
            fullWidth
          />
        </div>
        {isAdmin && selectedChampionship && (
          <Button onClick={() => { resetForm(); setFormData({ ...formData, championship_id: selectedChampionship }); setIsModalOpen(true); }}>
            <Plus className="w-5 h-5 mr-2" />
            Nova Partida
          </Button>
        )}
      </div>

      {Object.keys(groupedMatches).length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">Nenhuma partida encontrada para este campeonato.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedMatches).sort((a, b) => Number(a) - Number(b)).map((round) => (
            <div key={round}>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Rodada {round}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedMatches[Number(round)].map((match) => (
                  <Card key={match.id} hover>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(match.status)}`}>
                          {statusOptions.find(s => s.value === match.status)?.label}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => { setEditingMatch(match); setFormData({ ...match, home_score: match.home_score || null, away_score: match.away_score || null }); setIsModalOpen(true); }}
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-right">
                          <p className="font-bold text-gray-900 dark:text-white">{match.home_team.name}</p>
                        </div>
                        <div className="px-6 text-center">
                          {match.status === 'finished' && match.home_score !== null && match.away_score !== null ? (
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                              {match.home_score} - {match.away_score}
                            </p>
                          ) : (
                            <p className="text-2xl font-bold text-gray-500 dark:text-gray-400">VS</p>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 dark:text-white">{match.away_team.name}</p>
                        </div>
                      </div>
                      <div className="mt-4 text-center space-y-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(match.match_date)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{match.location}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); }} title={editingMatch ? 'Editar Partida' : 'Nova Partida'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Time Mandante"
              options={teams.map(t => ({ value: t.id, label: t.name }))}
              value={formData.home_team_id}
              onChange={(e) => setFormData({ ...formData, home_team_id: e.target.value })}
              required
              fullWidth
            />
            <Select
              label="Time Visitante"
              options={teams.map(t => ({ value: t.id, label: t.name }))}
              value={formData.away_team_id}
              onChange={(e) => setFormData({ ...formData, away_team_id: e.target.value })}
              required
              fullWidth
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Rodada"
              type="number"
              min="1"
              value={formData.round}
              onChange={(e) => setFormData({ ...formData, round: parseInt(e.target.value) })}
              required
              fullWidth
            />
            <Select
              label="Status"
              options={statusOptions}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              required
              fullWidth
            />
          </div>
          <Input
            label="Data e Hora"
            type="datetime-local"
            value={formData.match_date}
            onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
            required
            fullWidth
          />
          <Input
            label="Local"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
            fullWidth
          />
          {formData.status === 'finished' && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Placar Mandante"
                type="number"
                min="0"
                value={formData.home_score || ''}
                onChange={(e) => setFormData({ ...formData, home_score: e.target.value ? parseInt(e.target.value) : null })}
                fullWidth
              />
              <Input
                label="Placar Visitante"
                type="number"
                min="0"
                value={formData.away_score || ''}
                onChange={(e) => setFormData({ ...formData, away_score: e.target.value ? parseInt(e.target.value) : null })}
                fullWidth
              />
            </div>
          )}
          <div className="flex gap-3">
            <Button type="submit" fullWidth>{editingMatch ? 'Atualizar' : 'Criar'}</Button>
            <Button type="button" variant="ghost" fullWidth onClick={() => { setIsModalOpen(false); resetForm(); }}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};