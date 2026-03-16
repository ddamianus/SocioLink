import { useState, useEffect, useRef } from 'react';
import { Download, Upload, RefreshCw, Wifi, WifiOff, Sun, Moon, Database, FileJson } from 'lucide-react';
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
  const rpssInputRef = useRef<HTMLInputElement>(null); // Reference pro registr

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

  // NOVÁ FUNKCE: Zpracování nahraného registru z PC
  const handleRpssFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSyncingRpss(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const formatted = data.map((s: any) => ({
        id: parseInt(s.identifikátor_služby),
        organization: s.poskytovatel?.název || 'Neznámý',
        serviceType: s.druh_služby?.název || s.druh_služby || 'Neznámý'
      }));

      await db.rpssData.clear();
      await db.rpssData.bulkAdd(formatted);
      
      alert(`Úspěšně naimportováno ${formatted.length} služeb z registru MPSV.`);
      lookupRpssInfo(serviceId);
    } catch (err) {
      alert('Chyba při zpracování registru. Ujistěte se, že nahráváte správný soubor rpss.json.');
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
    if (confirm(`Smazat službu ${id} a všechny její klienty?`)) {
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
        
        {/* Ovládací prvky vpravo nahoře */}
        <div className="absolute top-8 right-4 flex gap-2 z-20">
          <input type="file" ref={rpssInputRef} accept=".json" className="hidden" onChange={handleRpssFileChange} />
          <button 
            onClick={() => rpssInputRef.current?.click()} 
            disabled={isSyncingRpss} 
            className={`p-3 rounded-full shadow-lg transition-all ${isDarkMode ? 'bg-gray-800 text-blue-400' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
            title="Nahrát stažený registr rpss.json z MPSV"
          >
            <Database className={`w-6 h-6 ${isSyncingRpss ? 'animate-bounce' : ''}`} />
          </button>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-3 rounded-full shadow-lg ${isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
            {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        </div>

        {/* Hlavička */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
          <img src="/logo-msk.png" alt="Logo" className="h-24 w-auto object-contain rounded-lg shadow-2xl" />
          <div className="text-center md:text-left">
            <h1 className="text-5xl font-extrabold tracking-tight">SocioLink</h1>
            <p className="text-xl text-blue-500 font-medium">Databáze žádostí MSK</p>
            <p className="text-gray-500 text-sm">by Radim Miklušák</p>
          </div>
        </div>

        {/* Panel Import/Export */}
        <div className={`mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-4 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
           <div className="flex gap-3">
              <button onClick={() => { setPasswordDialogMode('export'); setPasswordDialogOpen(true); }} disabled={serviceId === 0} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-md transition-all">
                <Download className="w-5 h-5" /> Export
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={serviceId === 0} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-md transition-all">
                <Upload className="w-5 h-5" /> Import
              </button>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) { 
                  // Zde zachovejte svou logiku pro dešifrovaný import
                  alert("Složka s klienty vybrána. Zadejte heslo.");
                  // ... (volání hesla)
                }
              }} />
           </div>
           
           <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-full text-xs font-black tracking-widest border ${isOnline ? 'bg-green-100 text-green-600 border-green-200' : 'bg-red-100 text-red-600 border-red-200'}`}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </div>
              <button onClick={() => alert('Data připravena k odeslání.')} disabled={serviceId === 0} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-md transition-all">
                <RefreshCw className="w-5 h-5" /> Synchronizovat
              </button>
           </div>
        </div>

        <ServiceIdSelector
          serviceId={serviceId}
          serviceIds={serviceIds}
          rpssInfo={currentRpssInfo}
          onServiceIdChange={setServiceId}
          onAddServiceId={handleAddServiceId}
          onDeleteServiceId={handleDeleteServiceId}
          isDarkMode={isDarkMode}
        />

        <div className="grid grid-cols-1 gap-8 mt-8">
          <AddRecordForm serviceId={serviceId} serviceIds={serviceIds} onRecordAdded={loadRecords} isDarkMode={isDarkMode} />
          <RecordsTable records={records} onDelete={(id) => db.records.delete(id).then(loadRecords)} isDarkMode={isDarkMode} />
        </div>
      </div>

      <PasswordDialog
        isOpen={passwordDialogOpen}
        title={passwordDialogMode === 'export' ? 'Exportovat data' : 'Importovat data'}
        onConfirm={() => setPasswordDialogOpen(false)}
        onCancel={() => setPasswordDialogOpen(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

export default App;