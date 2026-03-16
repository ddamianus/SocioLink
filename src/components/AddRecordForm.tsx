import { UserPlus } from 'lucide-react';
// ... ostatní importy

export function AddRecordForm({ serviceId, onRecordAdded, isDarkMode }: Props) {
  // ... logika komponenty zůstává

  return (
    <form onSubmit={handleSubmit} className={`p-6 rounded-xl border transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-900/50 border-gray-700' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center gap-2 mb-6 text-blue-500">
        <UserPlus className="w-5 h-5" />
        <h3 className="font-bold">Přidat nový záznam</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pro každý input/select v tomto souboru použij podobnou logiku jako zde: */}
        <div className="space-y-2">
          <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Jméno</label>
          <input
            type="text"
            className={`w-full px-4 py-2 rounded-lg border outline-none transition-all ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-white focus:ring-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-400'
            } focus:ring-2`}
            // ... ostatní props
          />
        </div>
        {/* Opakuj tento styl pro všechna pole Jméno, Příjmení, Pohlaví, Okres, Datum... */}
      </div>

      <button
        type="submit"
        className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <UserPlus className="w-5 h-5" /> Přidat záznam
      </button>
    </form>
  );
}