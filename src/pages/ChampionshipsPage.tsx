import { useEffect, useState } from 'react';
import { Plus, CreditCard as Edit, Trash2, Trophy } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Championship } from '../types';

export const ChampionshipsPage = () => {
  const { isAdmin } = useAuth();
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChampionship, setEditingChampionship] = useState<Championship | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    format: 'round_robin',
    max_teams: 16,
    status: 'upcoming',
  });

  useEffect(() => {
    loadChampionships();
  }, []);

  const loadChampionships = async () => {
    try {
      const { data, error } = await supabase
        .from('championships')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChampionships(data || []);
    } catch (error) {
      console.error('Erro ao carregar campeonatos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingChampionship) {
        const { error } = await supabase
          .from('championships')
          .update(formData)
          .eq('id', editingChampionship.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('championships')
          .insert([formData]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      resetForm();
      loadChampionships();
    } catch (error: any) {
      console.error('Erro ao salvar campeonato:', error);
      alert('Erro ao salvar campeonato: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este campeonato?')) return;

    try {
      const { error } = await supabase
        .from('championships')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadChampionships();
    } catch (error: any) {
      console.error('Erro ao excluir campeonato:', error);
      alert('Erro ao excluir campeonato: ' + error.message);
    }
  };

  const handleEdit = (championship: Championship) => {
    setEditingChampionship(championship);
    setFormData({
      name: championship.name,
      start_date: championship.start_date,
      end_date: championship.end_date,
      format: championship.format,
      max_teams: championship.max_teams,
      status: championship.status,
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingChampionship(null);
    setFormData({
      name: '',
      start_date: '',
      end_date: '',
      format: 'round_robin',
      max_teams: 16,
      status: 'upcoming',
    });
  };

  const formatOptions = [
    { value: 'round_robin', label: 'Todos contra Todos' },
    { value: 'single_elimination', label: 'Eliminatórias Simples' },
    { value: 'double_elimination', label: 'Eliminatórias Dupla' },
    { value: 'group_knockout', label: 'Fase de Grupos + Mata-mata' },
  ];

  const statusOptions = [
    { value: 'upcoming', label: 'Próximo' },
    { value: 'active', label: 'Ativo' },
    { value: 'finished', label: 'Finalizado' },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      upcoming: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      finished: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };
    const labels = {
      upcoming: 'Próximo',
      active: 'Ativo',
      finished: 'Finalizado',
    };
    return { class: badges[status as keyof typeof badges], label: labels[status as keyof typeof labels] };
  };

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Campeonatos
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie os campeonatos cadastrados no sistema
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Campeonato
          </Button>
        )}
      </div>

      {championships.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <Trophy className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum campeonato cadastrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {isAdmin
                ? 'Comece criando seu primeiro campeonato.'
                : 'Aguarde enquanto os administradores criam campeonatos.'}
            </p>
            {isAdmin && (
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Criar Primeiro Campeonato
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {championships.map((championship) => {
            const badge = getStatusBadge(championship.status);
            return (
              <Card key={championship.id} hover>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {championship.name}
                      </h3>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${badge.class}`}>
                        {badge.label}
                      </span>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(championship)}
                          className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(championship.id)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Início:</span> {formatDate(championship.start_date)}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Término:</span> {formatDate(championship.end_date)}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Formato:</span>{' '}
                      {formatOptions.find(f => f.value === championship.format)?.label}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Times:</span> Máx. {championship.max_teams}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingChampionship ? 'Editar Campeonato' : 'Novo Campeonato'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome do Campeonato"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
            placeholder="Ex: Campeonato Brasileiro 2024"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Data de Início"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
              fullWidth
            />
            <Input
              label="Data de Término"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
              fullWidth
            />
          </div>

          <Select
            label="Formato do Campeonato"
            options={formatOptions}
            value={formData.format}
            onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
            required
            fullWidth
          />

          <Input
            label="Número Máximo de Times"
            type="number"
            min="2"
            max="64"
            value={formData.max_teams}
            onChange={(e) => setFormData({ ...formData, max_teams: parseInt(e.target.value) })}
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

          <div className="flex gap-3 pt-4">
            <Button type="submit" fullWidth>
              {editingChampionship ? 'Atualizar' : 'Criar'} Campeonato
            </Button>
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};