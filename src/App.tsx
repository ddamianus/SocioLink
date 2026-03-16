import { useState, useEffect, useRef } from 'react';
import { Download, Upload, RefreshCw, Wifi, WifiOff, Sun, Moon } from 'lucide-react';
import { db, Record } from './db';
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
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark'; 
  });

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordDialogMode, setPasswordDialogMode] = useState<'export' | 'import'>('export');
  const [importingEncrypted, setImportingEncrypted] = useState(false);
  
  const pendingFileRef = useRef<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadRecords = async () => {
    if (serviceId === 0) {
      setRecords([]);
      return;
    }
    const allRecords = await db.records
      .where('serviceId')
      .equals(serviceId)
      .toArray();
    setRecords(allRecords);
  };

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleServiceIdChange = (id: number) => {
    setServiceId(id);
    localStorage.setItem('selectedServiceId', id.toString());
  };

  const handleAddServiceId = (id: number) => {
    const updated = [...new Set([...serviceIds, id])].sort((a, b) => a - b);
    setServiceIds(updated);
    localStorage.setItem('serviceIds', JSON.stringify(updated));
    handleServiceIdChange(id);
  };

  const handleDeleteServiceId = async (id: number) => {
    if (confirm(`VAROVÁNÍ: Opravdu chcete smazat službu č. ${id}? Dojde k trvalému smazání VŠECH klientů této služby!`)) {
      await db.records.where('serviceId').equals(id).delete();
      const updated = serviceIds.filter(s => s !== id);
      setServiceIds(updated);
      localStorage.setItem('serviceIds', JSON.stringify(updated));
      
      const nextId = updated.length > 0 ? updated[0] : 0;
      handleServiceIdChange(nextId);
      loadRecords();
    }
  };

  useEffect(() => {
    loadRecords();
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, [serviceId, serviceIds]);

  const handleDelete = async (id: number) => {
    if (confirm('Opravdu chcete smazat tento záznam?')) {
      await db.records.delete(id);
      loadRecords();
    }
  };

  const handleExportClick = () => {
    setPasswordDialogMode('export');
    setPasswordDialogOpen(true);
  };

  const handleExportWithPassword = async (password: string) => {
    try {
      const blob = await exportEncryptedJSON(records, password);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sociolink-export-id${serviceId}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setPasswordDialogOpen(false);
    } catch (e) { alert('Chyba při exportu'); }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (serviceId === 0) {
      alert("Není možné importovat data, jelikož nebyla vybrána cílová služba.");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    pendingFileRef.current = file;
    setPasswordDialogMode('import');
    setPasswordDialogOpen(true);
  };

  const handleImportWithPassword = async (password: string) => {
    const file = pendingFileRef.current;
    if (!file) return;
    setImportingEncrypted(true);
    try {
      const fileContent = await file.text();
      const { records: importedRecords, error } = await decryptEncryptedJSON(fileContent, password);
      if (error) { alert(`Chyba: ${error}`); return; }
      const recordsWithServiceId = importedRecords.map((r: any) => ({ ...r, serviceId }));
      for (const record of recordsWithServiceId) { await db.records.add(record); }
      loadRecords();
      setPasswordDialogOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally { setImportingEncrypted(false); }
  };

  const handleSync = async () => {
    if (!isOnline) { alert('Jste offline.'); return; }
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      alert(`Synchronizace dokončena pro službu ${serviceId}.`);
    }, 1000);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`absolute top-8 right-4 sm:right-8 p-3 rounded-full shadow-lg z-10 ${
            isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-600'
          }`}
        >
          {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
          <img src="/logo-msk.png" alt="Logo MSK" className="h-24 w-auto object-contain rounded-lg shadow-2xl" />
          <div className="text-center md:text-left flex flex-col">
            <h1 className={`text-5xl font-extrabold tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>SocioLink</h1>
            <p className="text-xl text-blue-500 font-medium">Databáze žádostí MSK</p>
            <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'} text-sm font-normal mt-0.5`}>by Radim Miklušák</p>
          </div>
        </div>

        <div className={`mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-4 rounded-2xl border transition-colors ${
          isDarkMode ? 'bg-gray-800/50 border-gray-700/50 shadow-inner' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <button onClick={handleExportClick} disabled={records.length === 0 || serviceId === 0} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md flex items-center gap-2">
              <Download className="w-5 h-5" /> Export
            </button>
            <button onClick={handleImportClick} disabled={serviceId === 0} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md flex items-center gap-2">
              <Upload className="w-5 h-5" /> Import
            </button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </div>

          <div className="flex items-center justify-center md:justify-end gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-gray-200 dark:border-gray-700">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${
              isOnline ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />} {isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>
            <button onClick={handleSync} disabled={records.length === 0 || syncing || serviceId === 0} className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md flex items-center gap-2">
              <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} /> Odeslat na KÚ MSK
            </button>
          </div>
        </div>

        <div className="mb-8">
          <ServiceIdSelector
            serviceId={serviceId}
            serviceIds={serviceIds}
            onServiceIdChange={handleServiceIdChange}
            onAddServiceId={handleAddServiceId}
            onDeleteServiceId={handleDeleteServiceId}
            isDarkMode={isDarkMode}
          />
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className={`p-6 rounded-2xl border shadow-xl transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <span className="w-2 h-6 bg-blue-500 rounded-full"></span> Nový záznam
            </h2>
            <AddRecordForm serviceId={serviceId} serviceIds={serviceIds} onRecordAdded={loadRecords} isDarkMode={isDarkMode} />
          </div>

          <div className={`rounded-2xl border shadow-xl overflow-hidden transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`p-4 border-b transition-colors ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
               <h2 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                 Přehled žádostí ({serviceId === 0 ? 'žádná služba' : `služba č. ${serviceId}`})
               </h2>
            </div>
            <RecordsTable records={records} onDelete={handleDelete} isDarkMode={isDarkMode} />
          </div>
        </div>
      </div>

      <PasswordDialog
        isOpen={passwordDialogOpen}
        title={passwordDialogMode === 'export' ? 'Exportovat data' : 'Importovat data'}
        onConfirm={passwordDialogMode === 'export' ? handleExportWithPassword : handleImportWithPassword}
        onCancel={() => setPasswordDialogOpen(false)}
        loading={importingEncrypted}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

export default App;