import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { db, generateHash, Record, DruhSluzby } from '../db';

interface AddRecordFormProps {
  serviceId: number;
  onRecordAdded: () => void;
}

const SERVICE_TYPES: DruhSluzby[] = [
  'odlehčovací služba',
  'týdenní stacionář',
  'domov pro osoby se zdravotním postižením',
  'domov pro seniory',
  'domov se zvláštním režimem',
  'chráněné bydlení',
  'azylový dům',
  'dům na půl cesty'
];

export function AddRecordForm({ serviceId, onRecordAdded }: AddRecordFormProps) {
  const [formData, setFormData] = useState({
    serviceId,
    jmeno: '',
    prijmeni: '',
    pohlavi: 'neuvedeno' as Record['pohlavi'],
    datumNarozeni: '',
    okres: 'Ostrava-město' as Record['okres'],
    druhSluzby: 'odlehčovací služba' as DruhSluzby
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hash = await generateHash(formData.jmeno, formData.prijmeni, formData.datumNarozeni);

    await db.records.add({
      ...formData,
      hash
    });

    setFormData({
      serviceId,
      jmeno: '',
      prijmeni: '',
      pohlavi: 'neuvedeno',
      datumNarozeni: '',
      okres: 'Ostrava-město',
      druhSluzby: 'odlehčovací služba'
    });

    onRecordAdded();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <UserPlus className="w-5 h-5 text-blue-400" />
        <h2 className="text-xl font-semibold text-white">Přidat nový záznam</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Jméno
          </label>
          <input
            type="text"
            required
            value={formData.jmeno}
            onChange={(e) => setFormData({ ...formData, jmeno: e.target.value })}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Příjmení
          </label>
          <input
            type="text"
            required
            value={formData.prijmeni}
            onChange={(e) => setFormData({ ...formData, prijmeni: e.target.value })}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Pohlaví
          </label>
          <select
            value={formData.pohlavi}
            onChange={(e) => setFormData({ ...formData, pohlavi: e.target.value as Record['pohlavi'] })}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="muž">Muž</option>
            <option value="žena">Žena</option>
            <option value="neuvedeno">Neuvedeno</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Datum narození
          </label>
          <input
            type="date"
            required
            value={formData.datumNarozeni}
            onChange={(e) => setFormData({ ...formData, datumNarozeni: e.target.value })}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Druh služby
          </label>
          <select
            value={formData.druhSluzby}
            onChange={(e) => setFormData({ ...formData, druhSluzby: e.target.value as DruhSluzby })}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SERVICE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Okres
          </label>
          <select
            value={formData.okres}
            onChange={(e) => setFormData({ ...formData, okres: e.target.value as Record['okres'] })}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Bruntál">Bruntál</option>
            <option value="Frýdek-Místek">Frýdek-Místek</option>
            <option value="Karviná">Karviná</option>
            <option value="Nový Jičín">Nový Jičín</option>
            <option value="Opava">Opava</option>
            <option value="Ostrava-město">Ostrava-město</option>
            <option value="jiný kraj">Jiný kraj</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        <UserPlus className="w-5 h-5" />
        Přidat záznam
      </button>
    </form>
  );
}
