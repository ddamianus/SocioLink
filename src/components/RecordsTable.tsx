import { Database, Trash2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Record } from '../db';

interface Props {
  records: Record[];
  onDelete: (id: number) => void;
  isDarkMode: boolean;
}

export function RecordsTable({ records, onDelete, isDarkMode }: Props) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    // Po 2 sekundách ikonu "fajfky" vrátíme zpět na ikonu kopírování
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (records.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900/50 text-gray-500' : 'bg-gray-50 text-gray-400'
      }`}>
        <Database className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">Zatím nejsou žádné žádosti</p>
        <p className="text-sm">Přidejte první záznam pomocí formuláře výše</p>
      </div>
    );
  }

  const thClass = `px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
    isDarkMode ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'
  }`;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-full">
        <thead className={isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'}>
          <tr>
            <th className={thClass}>ID Služby</th>
            <th className={thClass}>Jméno</th>
            <th className={thClass}>Příjmení</th>
            <th className={thClass}>Pohlaví</th>
            <th className={thClass}>Datum nar.</th>
            <th className={thClass}>Druh služby</th>
            <th className={thClass}>Okres</th>
            <th className={thClass}>HASH (SHA-256)</th>
            <th className={thClass}>Akce</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
          {records.map((r) => (
            <tr key={r.id} className={`${isDarkMode ? 'hover:bg-gray-700/30 text-gray-300' : 'hover:bg-blue-50 text-gray-700'} transition-colors group`}>
              <td className="px-4 py-3 font-mono text-xs">{r.serviceId}</td>
              <td className="px-4 py-3 font-medium">{r.jmeno}</td>
              <td className="px-4 py-3 font-medium">{r.prijmeni}</td>
              <td className="px-4 py-3">{r.pohlavi}</td>
              <td className="px-4 py-3">{new Date(r.datumNarozeni).toLocaleDateString('cs-CZ')}</td>
              <td className="px-4 py-3 text-xs">{r.druhSluzby}</td>
              <td className="px-4 py-3">{r.okres}</td>
              
              {/* UPRAVENÁ BUŇKA S HASH KÓDEM A KOPÍROVÁNÍM */}
              <td className="px-4 py-3 relative">
                <div className="flex items-center gap-2">
                  <code 
                    className={`text-[10px] p-1 rounded cursor-help transition-colors ${
                      isDarkMode ? 'bg-black/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                    }`}
                    title={r.hash} // Při najetí myší se v tooltipu zobrazí celý kód
                  >
                    {r.hash.substring(0, 10)}...
                  </code>
                  
                  <button
                    onClick={() => r.id && handleCopy(r.hash, r.id)}
                    className={`transition-all duration-200 p-1.5 rounded-md ${
                      copiedId === r.id 
                        ? 'bg-green-500 text-white opacity-100' 
                        : 'opacity-0 group-hover:opacity-100 hover:bg-blue-500 hover:text-white text-blue-500'
                    }`}
                    title="Zkopírovat celý hash"
                  >
                    {copiedId === r.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </td>

              <td className="px-4 py-3 text-right">
                <button onClick={() => r.id && onDelete(r.id)} className="text-red-500 hover:text-red-700 p-2 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}