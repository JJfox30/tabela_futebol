import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface RegisterFormProps {
  onToggleForm: () => void;
}

export const RegisterForm = ({ onToggleForm }: RegisterFormProps) => {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, fullName);
      setSuccess(true);
      setTimeout(() => {
        onToggleForm();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          type="text"
          label="Nome Completo"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="João Silva"
          required
          fullWidth
          autoComplete="name"
        />
      </div>

      <div>
        <Input
          type="email"
          label="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          required
          fullWidth
          autoComplete="email"
        />
      </div>

      <div>
        <Input
          type="password"
          label="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          fullWidth
          autoComplete="new-password"
        />
      </div>

      <div>
        <Input
          type="password"
          label="Confirmar Senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
          fullWidth
          autoComplete="new-password"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400">
            Conta criada com sucesso! Redirecionando...
          </p>
        </div>
      )}

      <Button type="submit" fullWidth disabled={loading}>
        {loading ? 'Criando conta...' : 'Cadastrar'}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={onToggleForm}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Já tem uma conta? Faça login
        </button>
      </div>
    </form>
  );
};