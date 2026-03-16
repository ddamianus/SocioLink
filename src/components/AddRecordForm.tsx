import React, { useState } from 'react';
import { UserPlus, AlertTriangle } from 'lucide-react';
import { db } from '../db';

interface Props {
  serviceId: number;
  serviceIds: number[];
  onRecordAdded: () => void;
  isDarkMode: boolean;
}

export function AddRecordForm({ serviceId, serviceIds, onRecordAdded, isDarkMode }: Props) {
  const [formData, setFormData] = useState({
    jmeno: '',
    prijmeni: '',
    pohlavi: 'Neuvedeno',
    datumNarozeni: '',
    druhSluzby: 'odlehčovací služba',
    okres: 'Ostrava-město'
  });

  const generateHash = async (jmeno: string, prijmeni: string, datum: string) => {
    const str = `${jmeno.trim().toLowerCase()}${prijmeni.trim().toLowerCase()}${datum}`;
    const msgUint8 = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // KONTROLA: Pokud není žádná služba, ukážeme info a nepokračujeme
    if (!serviceIds || serviceIds.length === 0 || serviceId === 0) {
      alert("⚠️ CHYBA: Není možné přidat klienta, protože nemáte vytvořenou žádnou službu.\n\nNahoře v panelu 'Správa služeb' zadejte číslo služby a klikněte na '+ Přidat'.");
      return;
    }

    const hash = await generateHash(formData.jmeno, formData.prijmeni, formData.datumNarozeni);
    
    try {
      await db.records.add({
        ...formData,
        serviceId,
        hash,
        createdAt: new Date()
      });

      // Reset jména a příjmení po úspěšném přidání
      setFormData({ ...formData, jmeno: '', prijmeni: '', datumNarozeni: '' });
      onRecordAdded();
    } catch (error) {
      alert("Chyba při ukládání do databáze.");
    }
  };

  const hasNoService = !serviceIds || serviceIds.length === 0 || serviceId === 0;

  const inputClass = `w-full px-4 py-2 rounded-lg border outline-none transition-all ${
    isDarkMode 
      ? 'bg-gray-800 border-gray-600 text-white focus:ring-blue-500 placeholder-gray-500' 
      : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-400 placeholder-gray-400'
  } focus:ring-2 ${hasNoService ? 'opacity-50 cursor-not-allowed' : ''}`;

  const labelClass = `block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <form onSubmit={handleSubmit} className={`p-6 rounded-xl border transition-all duration-300 ${
      isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200 shadow-inner'
    }`}>
      <div className="flex items-center gap-2 mb-6 text-blue-500">
        <UserPlus className="w-5 h-5" />
        <h3 className="font-bold uppercase tracking-wider">Nový klient / Žádost</h3>
      </div>
      
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${hasNoService ? 'pointer-events-none grayscale' : ''}`}>
        <div>
          <label className={labelClass}>Jméno</label>
          <input type="text" required value={formData.jmeno} onChange={e => setFormData({...formData, jmeno: e.target.value})} className={inputClass} placeholder="Jan" />
        </div>
        <div>
          <label className={labelClass}>Příjmení</label>
          <input type="text" required value={formData.prijmeni} onChange={e => setFormData({...formData, prijmeni: e.target.value})} className={inputClass} placeholder="Novák" />
        </div>
        <div>
          <label className={labelClass}>Pohlaví</label>
          <select value={formData.pohlavi} onChange={e => setFormData({...formData, pohlavi: e.target.value})} className={inputClass}>
            <option>Muž</option>
            <option>Žena</option>
            <option>Neuvedeno</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Datum narození</label>
          <input type="date" required value={formData.datumNarozeni} onChange={e => setFormData({...formData, datumNarozeni: e.target.value})} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Druh služby</label>
          <select value={formData.druhSluzby} onChange={e => setFormData({...formData, druhSluzby: e.target.value})} className={inputClass}>
            <option>odlehčovací služba</option>
            <option>týdenní stacionář</option>
            <option>domov pro seniory</option>
            <option>azylový dům</option>
            <option>chráněné bydlení</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Okres</label>
          <select value={formData.okres} onChange={e => setFormData({...formData, okres: e.target.value})} className={inputClass}>
            <option>Ostrava-město</option>
            <option>Frýdek-Místek</option>
            <option>Karviná</option>
            <option>Nový Jičín</option>
            <option>Opava</option>
            <option>Bruntál</option>
          </select>
        </div>
      </div>

      <div className="mt-8">
        {hasNoService && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-500">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-bold">
              Chyba: Musíte nejdříve vytvořit službu (Identifikátor služby) v horní části stránky!
            </p>
          </div>
        )}

        <button 
          type="submit" 
          className={`w-full font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
            hasNoService 
            ? 'bg-gray-500 hover:bg-red-600 cursor-pointer' 
            : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
          } text-white`}
        >
          <UserPlus className="w-5 h-5" /> Přidat záznam
        </button>
      </div>
    </form>
  );
}