import { useState } from 'react';
import { Lock, X } from 'lucide-react';

interface PasswordDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: (password: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function PasswordDialog({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  loading = false
}: PasswordDialogProps) {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onConfirm(password);
      setPassword('');
    }
  };

  const handleCancel = () => {
    setPassword('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-700 flex items-start gap-4">
          <div className="bg-blue-900/30 p-3 rounded-lg">
            <Lock className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <p className="text-sm text-gray-400 mt-1">{description}</p>
          </div>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Master heslo
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Zadejte heslo..."
              disabled={loading}
              autoFocus
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={!password.trim() || loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Zpracování...' : 'Potvrdit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
