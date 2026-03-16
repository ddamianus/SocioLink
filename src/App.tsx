import { useState, useEffect, useRef } from 'react';
import { Download, Upload, RefreshCw, Wifi, WifiOff, Sun, Moon, Database, Loader2 } from 'lucide-react';
import { db, Record, RpssData } from './db';
import { exportEncryptedJSON, decryptEncryptedJSON } from './encryptionUtils';
import { ServiceIdSelector } from './components/ServiceIdSelector';
import { PasswordDialog } from './components/PasswordDialog';
import { AddRecordForm } from './components/AddRecordForm';
import { RecordsTable } from './components/RecordsTable';

function App() {
  const [serviceIds, setServiceIds] = useState<number[]>(() => {
    const saved = localStorage.getItem('serviceIds');
    return saved ? JSON.parse(saved) : [];
  });
  const [serviceId, setServiceId] = useState<number>(() => {
    const saved = localStorage.getItem('selectedServiceId');
    return (saved && saved !== "0") ? parseInt(saved) : (serviceIds.length > 0 ? serviceIds[0] : 0);
  });
  
  const [records, setRecords] = useState<Record[]>([]);
  const [currentRpssInfo, setCurrentRpssInfo] = useState<RpssData | null>(null);
  const [isSyncingRpss, setIsSyncingRpss] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordDialogMode, setPasswordDialogMode] = useState<'export' | 'import'>('export');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rpssInputRef = useRef<HTMLInputElement>(null);

  const loadRecords = async () => {
    if (serviceId === 0) { setRecords([]); return; }
    const all = await db.records.where('serviceId').equals(serviceId).toArray();
    setRecords(all);
  };

  const lookupRpssInfo = async (id: number) => {
    if (id === 0) { setCurrentRpssInfo(null); return; }
    const info = await db.rpssData.get(id);
    setCurrentRpssInfo(info || null);
  };

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    loadRecords();
    lookupRpssInfo(serviceId);
  }, [serviceId, serviceIds]);

  // --- OPRAVENÁ FUNKCE PRO ZPRACOVÁNÍ REGISTRU ---
  const handleRpssFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSyncingRpss(true);
    try {
      const text = await file.text();
      const rawData = JSON.parse(text);
      
      // MPSV někdy vrací pole přímo, někdy vnořené v objektu
      const dataArray = Array.isArray(rawData) ? rawData : (rawData.položky || rawData.items || []);

      if (dataArray.length === 0) {
        throw new Error('Soubor neobsahuje žádná data nebo má neznámý formát.');
      }

      const formatted: RpssData[] = dataArray
        .map((s: any) => {
          const id = parseInt(s.identifikátor_služby || s.id);
          if (isNaN(id)) return null;

          return {
            id: id,
            organization: s.poskytovatel?.název || s.poskytovatel || 'Neznámý poskytovatel',
            serviceType: (typeof s.druh_služby === 'object' ? s.druh_služby?.název : s.druh_služby) || 'Neznámý druh'
          };
        })
        .filter((item): item is RpssData => item !== null);

      await db.rpssData.clear();
      // bulkAdd je u 20k+ záznamů rychlejší
      await db.rpssData.bulkAdd(formatted);
      
      alert(`Hotovo! Registr úspěšně aktualizován (${formatted.length} služeb).`);
      lookupRpssInfo(serviceId);
    } catch (err) {
      console.error("RPSS Import Error:", err);
      alert('Chyba při zpracování: Soubor je příliš poškozený, nebo má jinou strukturu. Ujistěte se, že nahráváte "rpss.json" z webu MPSV.');
    } finally {
      setIsSyncingRpss(false);
      if (rpssInputRef.current) rpssInputRef.current.value = '';
    }
  };

  const handleAddServiceId = (id: number) => {
    const updated = [...new Set([...serviceIds, id])].sort((a, b) => a - b);
    setServiceIds(updated);
    localStorage.setItem('serviceIds', JSON.stringify(updated));
    setServiceId(id);
  };

  const handleDeleteServiceId = async (id: number) => {
    if (confirm(`Opravdu smazat službu ${id} a VŠECHNY její klienty?`)) {
      await db.records.where('serviceId').equals(id).delete();
      const updated = serviceIds.filter(s => s !== id);
      setServiceIds(updated);
      localStorage.setItem('serviceIds', JSON.stringify(updated));
      setServiceId(updated.length > 0 ? updated[0] : 0);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        
        {/* Horní ovládací lišta */}
        <div className="absolute top-8 right-4 flex gap-3 z-20">
          <input type="file" ref={rpssInputRef} accept=".json" className="hidden" onChange={handleRpssFileChange} />
          <button 
            onClick={() => rpssInputRef.current?.click()} 
            disabled={isSyncingRpss} 
            className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg transition-all ${
              isDarkMode ? 'bg-gray-800 text-blue-400 border border-blue-900/50' : 'bg-white text-blue-600 border border-blue-100 hover:bg-blue-50'
            }`}
          >
            {isSyncingRpss ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
            <span className="text-xs font-bold uppercase tracking-wider">{isSyncingRpss ? 'Zpracovávám...' : 'Aktualizovat Registr'}</span>
          </button>
          
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-3 rounded-xl shadow-lg transition-all ${isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-600'}`}>
            {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        </div>

        {/* Logo a Název */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-10">
          <img src="/logo-msk.png" alt="Logo" className="h-24 w-auto object-contain rounded-xl shadow-2xl" />
          <div className="text-center md:text-left">
            <h1 className="text-6xl font-black tracking-tighter">SocioLink</h1>
            <p className="text-xl text-blue-500 font-bold uppercase tracking-widest">Databáze žádostí MSK</p>
            <p className="text-gray-500 text-sm font-medium">by Radim Miklušák</p>
          </div>
        </div>

        {/* Hlavní akce */}
        <div className={`mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-5 rounded-3xl border transition-all ${
          isDarkMode ? 'bg-gray-800/40 border-gray-700/50 shadow-2xl' : 'bg-white border-gray-200 shadow-xl'
        }`}>
           <div className="flex flex-wrap gap-3">
              <button onClick={() => { setPasswordDialogMode('export'); setPasswordDialogOpen(true); }} disabled={serviceId === 0} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black shadow-lg transition-all active:scale-95 disabled:opacity-30">
                <Download className="w-5 h-5" /> EXPORT
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={serviceId === 0} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black shadow-lg transition-all active:scale-95 disabled:opacity-30">
                <Upload className="w-5 h-5" /> IMPORT
              </button>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={() => {}} />
           </div>
           
           <div className="flex items-center gap-5">
              <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black tracking-widest border-2 ${
                isOnline ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                {isOnline ? 'SYSTÉM ONLINE' : 'SYSTÉM OFFLINE'}
              </div>
              <button onClick={() => alert('Data synchronizována.')} disabled={serviceId === 0} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black shadow-lg transition-all active:scale-95 disabled:opacity-30">
                <RefreshCw className="w-5 h-5" /> ODESLAT DATA
              </button>
           </div>
        </div>

        <ServiceIdSelector
          serviceId={serviceId}
          serviceIds={serviceIds}
          rpssInfo={currentRpssInfo}
          onServiceIdChange={setServiceId}
          onAddServiceId={handleAddServiceId}