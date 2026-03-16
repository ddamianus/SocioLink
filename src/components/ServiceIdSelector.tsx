import { Plus, Settings, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
  serviceId: number;
  serviceIds: number[];
  onServiceIdChange: (id: number) => void;
  onAddServiceId: (id: number) => void;
  onDeleteServiceId: (id: number) => void; // PŘIDÁNO
  isDarkMode: boolean;
}

export function ServiceIdSelector({ serviceId, serviceIds, onServiceIdChange, onAddServiceId, onDeleteServiceId, isDarkMode }: Props) {
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
            placeholder="Nové ID služby..."
            className={`flex-1 px-3 py-2 rounded-lg outline-none transition-all ${
              isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
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
        
        <div className="flex gap-2">
          <select
            value={serviceId}
            onChange={(e) => onServiceIdChange(parseInt(e.target.value))}
            className={`px-3 py-2 rounded-lg font-semibold outline-none border transition-all flex-1 ${
              isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
            } focus:ring-2`}
          >
            {serviceIds.length === 0 && <option disabled value={0}>Žádné služby</option>}
            {serviceIds.map(id => (
              <option key={id} value={id}>Služba č. {id}</option>
            ))}
          </select>

          {/* TLAČÍTKO PRO SMAZÁNÍ SLUŽBY */}
          <button
            onClick={() => serviceId > 0 && onDeleteServiceId(serviceId)}
            disabled={serviceIds.length === 0}
            className="p-2.5 rounded-lg border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-30"
            title="Smazat aktuální službu a všechny její klienty"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}