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
  const rpssInputRef = useRef<HTMLInputElement>(null);

  const loadRecords = async () => {
    if (serviceId === 0) {
      setRecords([]);
      return;
    }
    const all = await db.records.where('serviceId').equals(serviceId).toArray();
    setRecords(all);
  };

  const lookupRpssInfo = async (id: number) => {
    if (id === 0) {
      setCurrentRpssInfo(null);
      return;
    }
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

  const handleRpssFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSyncingRpss(true);
    try {
      const text = await file.text();
      const rawData = JSON.parse(text);
      const dataArray = Array.isArray(rawData) ? rawData : (rawData.položky || rawData.items || []);
      
      const formatted: RpssData[] = dataArray
        .map((s: any) => {
          const id = parseInt(s.identifikátor_služby || s.id);
          if (isNaN(id)) return null;
          return {
            id: id,
            organization: s.poskytovatel?.název || s.poskytovatel || 'Neznámý',
            serviceType: (typeof s.druh_služby === 'object' ? s.druh_služby?.název : s.druh_služby) || 'Neznámý druh'
          };
        })
        .filter((item: any): item is RpssData => item !== null);

      await db.rpssData.clear();
      await db.rpssData.bulkAdd(formatted);
      alert(`Registr úspěšně aktualizován (${formatted.length} služeb).`);
      lookupRpssInfo(serviceId);
    } catch (err) {
      alert('Chyba při zpracování souboru registru.');
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
    localStorage.setItem('selectedServiceId', id.toString());
  };

  const handleDeleteServiceId = async (id: number) => {
    if (confirm(`Opravdu smazat službu ${id} a všechny její klienty?`)) {
      await db.records.where('serviceId').equals(id).delete();
      const updated = serviceIds.filter(s => s !== id);
      setServiceIds(updated);
      localStorage.setItem('serviceIds', JSON.stringify(updated));
      const nextId = updated.length > 0 ? updated[0] : 0;
      setServiceId(nextId);
      localStorage.setItem('selectedServiceId', nextId.toString());
    }
  };

  const handleExportWithPassword = async (password: string) => {
    try {
      const blob = await exportEncryptedJSON(records, password);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sociolink-id${serviceId}.json`;
      link.click();
      setPasswordDialogOpen(false);
    } catch (e) {
      alert('Chyba při exportu.');
    }
  };

  const handleImportWithPassword = async (password: string) => {
    const file = pendingFileRef.current;
    if (!file) return;
    setImportingEncrypted(true);
    try {
      const text = await file.text();
      const { records: imported } = await decryptEncryptedJSON(text, password);
      for (const r of imported) {
        await db.records.add({ ...r, serviceId });
      }
      loadRecords();
      setPasswordDialogOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      alert('Špatné heslo nebo poškozený soubor.');
    } finally {
      setImportingEncrypted(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        
        <div className="absolute top-8 right-4 flex gap-3 z-20">
          <input type="file" ref={rpssInputRef} accept=".json" className="hidden" onChange={handleRpssFileChange} />
          <button 
            onClick={() => rpssInputRef.current?.click()} 
            disabled={isSyncingRpss}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-md border transition-all ${isDarkMode ? 'bg-gray-800 border-gray-700 text-blue-400' : 'bg-white border-gray-200 text-blue-600 hover:bg-gray-50'}`}
          >
            {isSyncingRpss ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            <span className="text-xs font-bold uppercase">Registr</span>
          </button>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-3 rounded-xl shadow-md transition-all ${isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-10">
          <img src="/logo-msk.png" alt="Logo MSK" className="h-20 w-auto object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <div className="text-center md:text-left">
            <h1 className="text-5xl font-black tracking-tighter">SocioLink</h1>
            <p className="text-xl text-blue-500 font-bold uppercase">Databáze žádostí MSK</p>
            <p className="text-gray-500 text-sm">by Radim Miklušák</p>
          </div>
        </div>

        <div className={`mb-8 flex flex-col md:flex-row items-center justify-between p-5 rounded-2xl border transition-all ${isDarkMode ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white border-gray-200 shadow-xl'}`}>
          <div className="flex gap-3">
            <button onClick={() => { setPasswordDialogMode('export'); setPasswordDialogOpen(true); }} disabled={serviceId === 0} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 disabled:opacity-30 shadow-md">
              <Download className="w-5 h-5" /> Export
            </button>
            <button onClick={() => fileInputRef.current?.click()} disabled={serviceId === 0} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 disabled:opacity-30 shadow-md">
              <Upload className="w-5 h-5" /> Import
            </button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={(e) => {
              if (e.target.files?.[0]) { pendingFileRef.current = e.target.files[0]; setPasswordDialogMode('import'); setPasswordDialogOpen(true); }
            }} />
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className={`px-4 py-2 rounded-full text-xs font-black border tracking-widest ${isOnline ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>
            <button onClick={() => alert('Synchronizace proběhla.')} disabled={serviceId === 0} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 disabled:opacity-30 shadow-md">
              <RefreshCw className="w-5 h-5" /> Odeslat data
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

        <div className="grid grid-cols-1 gap-10 mt-10">
          <AddRecordForm serviceId={serviceId} serviceIds={serviceIds} onRecordAdded={loadRecords} isDarkMode={isDarkMode} />
          <RecordsTable records={records} onDelete={(id) => db.records.delete(id).then(loadRecords)} isDarkMode={isDarkMode} />
        </div>
      </div>

      <PasswordDialog
        isOpen={passwordDialogOpen}
        title={passwordDialogMode === 'export' ? 'Šifrovaný Export' : 'Dešifrování Importu'}
        description="Zadejte master heslo pro ochranu dat."
        onConfirm={passwordDialogMode === 'export' ? handleExportWithPassword : handleImportWithPassword}
        onCancel={() => setPasswordDialogOpen(false)}
        loading={importingEncrypted}
      />
    </div>
  );
}

export default App;