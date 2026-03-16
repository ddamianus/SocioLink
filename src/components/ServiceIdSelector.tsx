import { useState } from 'react';
import { Settings, Plus } from 'lucide-react';

interface ServiceIdSelectorProps {
  serviceId: number;
  serviceIds: number[];
  onServiceIdChange: (id: number) => void;
  onAddServiceId: (id: number) => void;
}

export function ServiceIdSelector({
  serviceId,
  serviceIds,
  onServiceIdChange,
  onAddServiceId
}: ServiceIdSelectorProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAddClick = () => {
    const newId = parseInt(inputValue);
    if (!isNaN(newId) && newId > 0 && !serviceIds.includes(newId)) {
      onAddServiceId(newId);
      setInputValue('');
    } else if (serviceIds.includes(newId)) {
      alert('Tento identifikátor služby už existuje');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddClick();
    }
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Settings className="w-5 h-5 text-gray-400" />
        <h3 className="text-sm font-medium text-gray-300">Správa služeb</h3>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-1">
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Zadejte číslo služby..."
            min="1"
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddClick}
            disabled={!inputValue.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Přidat
          </button>
        </div>

        <select
          value={serviceId}
          onChange={(e) => onServiceIdChange(parseInt(e.target.value))}
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {serviceIds.length === 0 ? (
            <option disabled>Žádné služby</option>
          ) : (
            serviceIds.map((id) => (
              <option key={id} value={id}>
                Služba č. {id}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="text-xs text-gray-500">
        {serviceIds.length > 0 ? (
          <>Aktuálně pracujete s <span className="font-semibold text-gray-300">službou č. {serviceId}</span></>
        ) : (
          <>Přidejte první službu k zahájení práce</>
        )}
      </div>
    </div>
  );
}
