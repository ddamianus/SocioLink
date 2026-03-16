import { useState, useEffect, useRef } from 'react';
import { Download, Upload, RefreshCw, Wifi, WifiOff, Sun, Moon, Database } from 'lucide-react';
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
    if (saved && saved !== "0") return parseInt(saved);
    return serviceIds.length > 0 ? serviceIds[0] : 0;
  });
  
  const [records, setRecords] = useState<Record[]>([]);
  const [currentRpssInfo, setCurrentRpssInfo] = useState<RpssData | null>(null);
  const [isSyncingRpss, setIsSyncingRpss] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordDialogMode, setPasswordDialogMode] = useState<'export' | 'import'>('export');
  const [importingEncrypted, setImportingEncrypted] = useState(false);
  
  const pendingFileRef = useRef<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Funkce pro synchronizaci s MPSV
  const syncWithRpss = async () => {
    if (!isOnline) { alert('Pro aktualizaci registru musíte být online.'); return; }
    setIsSyncingRpss(true);
    try {
      const response = await fetch('https://data.mpsv.cz/od/soubory/rpss/rpss.json');
      const data = await response.json();
      
      const formatted = data.map((s: any) => ({
        id: parseInt(s.identifikátor_služby),
        organization: s.poskytovatel.název,
        serviceType: s.druh_služby.název || s.druh_služby
      }));

      await db.rpssData.clear();
      await db.rpssData.bulkAdd(formatted);
      alert('Registr MPSV byl úspěšně stažen a uložen.');
      lookupRpssInfo(serviceId);
    } catch (e) {
      alert('Chyba při stahování dat z MPSV. Registr nebyl aktualizován.');
    } finally {
      setIsSyncingRpss(false);
    }
  };

  // Vyhledání informací o aktuální službě v registru
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
  }, [serviceId]);

  const loadRecords = async () => {
    if (serviceId === 0) { setRecords([]); return; }
    const all = await db.records.where('serviceId').equals(serviceId).toArray();
    setRecords(all);
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

  // ... (handleExport, handleImport, handleSync zůstávají stejné jako dříve)
  // Pro stručnost zde zbytek standardních funkcí App.tsx vynechávám, zachovejte své stávající handleExport/Import/Sync

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        
        {/* Tlačítka v záhlaví */}
        <div className="absolute top-8 right-4 flex gap-2">
          <button
            onClick={syncWithRpss}
            disabled={isSyncingRpss}
            className={`p-3 rounded-full shadow-lg transition-all ${isDarkMode ? 'bg-gray-800 text-blue-400' : 'bg-white text-blue-600'}`}
            title="Aktualizovat registr služeb z MPSV"
          >
            <Database className={`w-6 h-6 ${isSyncingRpss ? 'animate-pulse' : ''}`} />
          </button>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-3 rounded-full shadow-lg ${isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-600'}`}
          >
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

        {/* Panel s ovládáním (Import/Export) */}
        <div className={`mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-4 rounded-2xl border ${
          isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'
        }`}>
           <div className="flex gap-3">
              <button onClick={() => setPasswordDialogOpen(true)} disabled={serviceId === 0} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2">
                <Download className="w-5 h-5" /> Export
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={serviceId === 0} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2">
                <Upload className="w-5 h-5" /> Import
              </button>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={(e) => { /* handle import */ }} />
           </div>
           <div className="flex items-center gap-4">
              <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${isOnline ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </div>
              <button onClick={() => {}} className="bg-purple-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2">
                <RefreshCw className="w-5 h-5" /> Odeslat na KÚ MSK
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
          <AddRecordForm serviceId={serviceId} serviceIds={serviceIds} rpssInfo={currentRpssInfo} onRecordAdded={loadRecords} isDarkMode={isDarkMode} />
          <RecordsTable records={records} onDelete={(id) => db.records.delete(id).then(loadRecords)} isDarkMode={isDarkMode} />
        </div>
      </div>
      {/* PasswordDialog zde... */}
    </div>
  );
}

export default App;