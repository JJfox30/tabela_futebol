import { useEffect, useState } from 'react';
import { Plus, CreditCard as Edit, Trash2, Users, User } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Team, Player } from '../types';

export const TeamsPage = () => {
  const { isAdmin } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamForm, setTeamForm] = useState({ name: '', city: '', stadium: '', badge_url: '' });
  const [playerForm, setPlayerForm] = useState({ name: '', position: 'forward', shirt_number: 1, age: 18 });

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) loadPlayers(selectedTeam.id);
  }, [selectedTeam]);

  const loadTeams = async () => {
    try {
      const { data, error } = await supabase.from('teams').select('*').order('name');
      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Erro ao carregar times:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlayers = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId)
        .order('shirt_number');
      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error);
    }
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTeam) {
        const { error } = await supabase.from('teams').update(teamForm).eq('id', editingTeam.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('teams').insert([teamForm]);
        if (error) throw error;
      }
      setIsTeamModalOpen(false);
      resetTeamForm();
      loadTeams();
    } catch (error: any) {
      alert('Erro: ' + error.message);
    }
  };

  const handlePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    try {
      const data = { ...playerForm, team_id: selectedTeam.id };
      if (editingPlayer) {
        const { error } = await supabase.from('players').update(data).eq('id', editingPlayer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('players').insert([data]);
        if (error) throw error;
      }
      setIsPlayerModalOpen(false);
      resetPlayerForm();
      loadPlayers(selectedTeam.id);
    } catch (error: any) {
      alert('Erro: ' + error.message);
    }
  };

  const deleteTeam = async (id: string) => {
    if (!confirm('Excluir este time?')) return;
    try {
      const { error } = await supabase.from('teams').delete().eq('id', id);
      if (error) throw error;
      loadTeams();
      if (selectedTeam?.id === id) setSelectedTeam(null);
    } catch (error: any) {
      alert('Erro: ' + error.message);
    }
  };

  const deletePlayer = async (id: string) => {
    if (!confirm('Excluir este jogador?')) return;
    try {
      const { error } = await supabase.from('players').delete().eq('id', id);
      if (error) throw error;
      if (selectedTeam) loadPlayers(selectedTeam.id);
    } catch (error: any) {
      alert('Erro: ' + error.message);
    }
  };

  const resetTeamForm = () => {
    setEditingTeam(null);
    setTeamForm({ name: '', city: '', stadium: '', badge_url: '' });
  };

  const resetPlayerForm = () => {
    setEditingPlayer(null);
    setPlayerForm({ name: '', position: 'forward', shirt_number: 1, age: 18 });
  };

  const positionOptions = [
    { value: 'goalkeeper', label: 'Goleiro' },
    { value: 'defender', label: 'Defensor' },
    { value: 'midfielder', label: 'Meio-campo' },
    { value: 'forward', label: 'Atacante' },
  ];

  const getPositionLabel = (position: string) =>
    positionOptions.find(p => p.value === position)?.label || position;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Times</h3>
          {isAdmin && (
            <Button size="sm" onClick={() => { resetTeamForm(); setIsTeamModalOpen(true); }}>
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {teams.map((team) => (
            <Card key={team.id} hover>
              <button
                onClick={() => setSelectedTeam(team)}
                className={`w-full p-4 text-left transition-colors ${
                  selectedTeam?.id === team.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-white">{team.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{team.city}</p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingTeam(team); setTeamForm(team); setIsTeamModalOpen(true); }}
                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteTeam(team.id); }}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </button>
            </Card>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2">
        {selectedTeam ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedTeam.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedTeam.stadium} - {selectedTeam.city}</p>
              </div>
              {isAdmin && (
                <Button size="sm" onClick={() => { resetPlayerForm(); setIsPlayerModalOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Jogador
                </Button>
              )}
            </div>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nº</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nome</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Posição</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Idade</th>
                      {isAdmin && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ações</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {players.map((player) => (
                      <tr key={player.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">{player.shirt_number}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{player.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{getPositionLabel(player.position)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{player.age}</td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => { setEditingPlayer(player); setPlayerForm(player); setIsPlayerModalOpen(true); }}
                              className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 rounded-lg mr-2"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deletePlayer(player.id)}
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {players.length === 0 && (
                  <div className="text-center py-12">
                    <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Nenhum jogador cadastrado</p>
                  </div>
                )}
              </div>
            </Card>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Selecione um time para ver os jogadores</p>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isTeamModalOpen} onClose={() => { setIsTeamModalOpen(false); resetTeamForm(); }} title={editingTeam ? 'Editar Time' : 'Novo Time'}>
        <form onSubmit={handleTeamSubmit} className="space-y-4">
          <Input label="Nome" value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} required fullWidth />
          <Input label="Cidade" value={teamForm.city} onChange={(e) => setTeamForm({ ...teamForm, city: e.target.value })} required fullWidth />
          <Input label="Estádio" value={teamForm.stadium} onChange={(e) => setTeamForm({ ...teamForm, stadium: e.target.value })} required fullWidth />
          <Input label="URL do Escudo" value={teamForm.badge_url || ''} onChange={(e) => setTeamForm({ ...teamForm, badge_url: e.target.value })} fullWidth />
          <div className="flex gap-3">
            <Button type="submit" fullWidth>{editingTeam ? 'Atualizar' : 'Criar'}</Button>
            <Button type="button" variant="ghost" fullWidth onClick={() => { setIsTeamModalOpen(false); resetTeamForm(); }}>Cancelar</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isPlayerModalOpen} onClose={() => { setIsPlayerModalOpen(false); resetPlayerForm(); }} title={editingPlayer ? 'Editar Jogador' : 'Novo Jogador'}>
        <form onSubmit={handlePlayerSubmit} className="space-y-4">
          <Input label="Nome" value={playerForm.name} onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })} required fullWidth />
          <Select label="Posição" options={positionOptions} value={playerForm.position} onChange={(e) => setPlayerForm({ ...playerForm, position: e.target.value as any })} required fullWidth />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Número" type="number" min="1" max="99" value={playerForm.shirt_number} onChange={(e) => setPlayerForm({ ...playerForm, shirt_number: parseInt(e.target.value) })} required fullWidth />
            <Input label="Idade" type="number" min="16" max="50" value={playerForm.age} onChange={(e) => setPlayerForm({ ...playerForm, age: parseInt(e.target.value) })} required fullWidth />
          </div>
          <div className="flex gap-3">
            <Button type="submit" fullWidth>{editingPlayer ? 'Atualizar' : 'Adicionar'}</Button>
            <Button type="button" variant="ghost" fullWidth onClick={() => { setIsPlayerModalOpen(false); resetPlayerForm(); }}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};