import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { Card } from '../components/ui/Card';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 dark:bg-blue-700 rounded-full mb-4">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gestão de Campeonatos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sistema completo de gerenciamento de futebol
          </p>
        </div>

        <Card className="p-6">
          <div className="mb-6">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 pb-3 text-center font-medium transition-colors ${
                  isLogin
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 pb-3 text-center font-medium transition-colors ${
                  !isLogin
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                Cadastro
              </button>
            </div>
          </div>

          {isLogin ? (
            <LoginForm onToggleForm={() => setIsLogin(false)} />
          ) : (
            <RegisterForm onToggleForm={() => setIsLogin(true)} />
          )}
        </Card>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          Versão 1.0 - Sistema de Gestão de Campeonatos de Futebol
        </p>
      </div>
    </div>
  );
};