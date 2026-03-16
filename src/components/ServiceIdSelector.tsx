import { Plus, Settings } from 'lucide-react';
import { useState } from 'react';

interface Props {
  serviceId: number;
  serviceIds: number[];
  onServiceIdChange: (id: number) => void;
  onAddServiceId: (id: number) => void;
  isDarkMode: boolean;
}

export function ServiceIdSelector({ serviceId, serviceIds, onServiceIdChange, onAddServiceId, isDarkMode }: Props) {
  const [newId, setNewId] = useState('');

  const handleAdd = () => {
    const id = parseInt(newId);
    if (id > 0) {
      onAddServiceId(id);
      setNewId('');
    }
  };

  return (
    <div className={`transition-colors duration-300 rounded-xl p-4 border ${
      isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <Settings className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Správa služeb</h3>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-1">
          <input
            type="number"
            id="serviceNumberInput"
            name="serviceNumberInput"
            placeholder="Zadejte číslo služby..."
            className={`flex-1 px-3 py-2 rounded-lg outline-none transition-all ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-500' 
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-400'
            } border focus:ring-2`}
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
          />
          <button
            onClick={handleAdd}
            disabled={!newId}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Přidat
          </button>
        </div>
        <select
          value={serviceId}
          onChange={(e) => onServiceIdChange(parseInt(e.target.value))}
          className={`px-3 py-2 rounded-lg font-semibold outline-none border transition-all ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500' 
              : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-green-400'
          } focus:ring-2`}
        >
          {serviceIds.length === 0 && <option disabled>Žádné služby</option>}
          {serviceIds.map(id => (
            <option key={id} value={id}>Služba č. {id}</option>
          ))}
        </select>
      </div>
    </div>
  );
}