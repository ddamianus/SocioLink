import { Plus, Settings, Trash2, Building2 } from 'lucide-react';
import { useState } from 'react';
import { RpssData } from '../db';

interface Props {
  serviceId: number;
  serviceIds: number[];
  rpssInfo: RpssData | null;
  onServiceIdChange: (id: number) => void;
  onAddServiceId: (id: number) => void;
  onDeleteServiceId: (id: number) => void;
  isDarkMode: boolean;
}

export function ServiceIdSelector({ serviceId, serviceIds, rpssInfo, onServiceIdChange, onAddServiceId, onDeleteServiceId, isDarkMode }: Props) {
  const [newId, setNewId] = useState('');

  return (
    <div className={`p-4 rounded-xl border transition-all ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-gray-400" />
        <h3 className="text-sm font-medium uppercase tracking-wider">Správa identifikátorů</h3>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex gap-2 flex-1">
          <input type="number" placeholder="Zadejte ID služby..." className={`flex-1 px-3 py-2 rounded-lg border outline-none ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`} value={newId} onChange={(e) => setNewId(e.target.value)} />
          <button onClick={() => { if(newId) onAddServiceId(parseInt(newId)); setNewId(''); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">Přidat</button>
        </div>

        <div className="flex gap-2 flex-1">
          <select value={serviceId} onChange={(e) => onServiceIdChange(parseInt(e.target.value))} className={`flex-1 px-3 py-2 rounded-lg border font-bold ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'}`}>
            {serviceIds.length === 0 && <option value={0}>Žádná služba</option>}
            {serviceIds.map(id => <option key={id} value={id}>Služba č. {id}</option>)}
          </select>
          <button onClick={() => onDeleteServiceId(serviceId)} className="p-2 border border-red-500/50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"><Trash2 className="w-5 h-5" /></button>
        </div>
      </div>

      {rpssInfo && (
        <div className={`mt-4 p-4 rounded-xl border-l-4 flex items-start gap-4 ${isDarkMode ? 'bg-blue-900/20 border-blue-500' : 'bg-blue-50 border-blue-500 shadow-sm'}`}>
          <Building2 className="w-6 h-6 text-blue-500 flex-shrink-0" />
          <div>
            <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Ověřený záznam MPSV</p>
            <p className={`text-base font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{rpssInfo.organization}</p>
            <p className="text-sm text-gray-500 mt-1">{rpssInfo.serviceType}</p>
          </div>
        </div>
      )}
    </div>
  );
}