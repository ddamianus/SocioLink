import { Database, Trash2 } from 'lucide-react';
// ... props a logika

export function RecordsTable({ records, onDelete, isDarkMode }: Props) {
  if (records.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900/50 text-gray-500' : 'bg-gray-50 text-gray-400'
      }`}>
        <Database className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">Zatím nejsou žádné záznamy</p>
        <p className="text-sm">Přidejte první záznam pomocí formuláře výše</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className={`${isDarkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-600'} text-xs uppercase font-bold`}>
          {/* ... hlavička tabulky */}
        </thead>
        <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
          {records.map((record) => (
            <tr key={record.id} className={`transition-colors ${isDarkMode ? 'hover:bg-gray-700/30' : 'hover:bg-blue-50'}`}>
              {/* ... buňky tabulky */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}