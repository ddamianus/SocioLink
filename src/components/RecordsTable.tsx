import { Trash2, Database } from 'lucide-react';
import { Record } from '../db';

interface RecordsTableProps {
  records: Record[];
  onDelete: (id: number) => void;
}

export function RecordsTable({ records, onDelete }: RecordsTableProps) {
  if (records.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-12 shadow-lg text-center">
        <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400 text-lg">Zatím nejsou žádné záznamy</p>
        <p className="text-gray-500 text-sm mt-2">Přidejte první záznam pomocí formuláře výše</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                ID
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Jméno
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Příjmení
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Pohlaví
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Datum narození
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Druh služby
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Okres
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Hash
              </th>
              <th className="px-4 py-4 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Akce
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-gray-750 transition-colors">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-blue-400">
                  {record.serviceId}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                  {record.jmeno}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                  {record.prijmeni}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                  {record.pohlavi}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                  {new Date(record.datumNarozeni).toLocaleDateString('cs-CZ')}
                </td>
                <td className="px-4 py-4 text-sm text-gray-300">
                  <span className="inline-block max-w-xs truncate" title={record.druhSluzby}>
                    {record.druhSluzby}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                  {record.okres}
                </td>
                <td className="px-4 py-4 text-sm text-gray-400 font-mono text-xs">
                  <div className="max-w-xs truncate" title={record.hash}>
                    {record.hash}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                  <button
                    onClick={() => record.id && onDelete(record.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    title="Smazat záznam"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-900 px-6 py-3">
        <p className="text-sm text-gray-400">
          Celkem záznamů: <span className="font-semibold text-white">{records.length}</span>
        </p>
      </div>
    </div>
  );
}
