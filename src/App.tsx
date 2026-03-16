import { useState, useEffect, useRef } from 'react';
import { Download, Upload, RefreshCw, Wifi, WifiOff } from 'lucide-react';
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
    if (saved) return parseInt(saved);
    return serviceIds.length > 0 ? serviceIds[0] : 1;
  });
  
  const [records, setRecords] = useState<Record[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordDialogMode, setPasswordDialogMode] = useState<'export' | 'import'>('export');
  const [importingEncrypted, setImportingEncrypted] = useState(false);
  
  const pendingFileRef = useRef<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadRecords = async () => {
    const allRecords = await db.records
      .where('serviceId')
      .equals(serviceId)
      .toArray();
    setRecords(allRecords);
  };

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

  useEffect(() => {
    loadRecords();

    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
    }

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, [serviceId]);

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
      link.download = `sociolink-encrypted-${serviceId}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setPasswordDialogOpen(false);
      alert('Data byla úspěšně exportována a zašifrována.');
    } catch (error) {
      alert(`Chyba při exportu: ${error instanceof Error ? error.message : 'Neznámá chyba'}`);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (error) {
        alert(`Import chyba: ${error}`);
        return;
      }
      const recordsWithServiceId = importedRecords.map((r: any) => ({ ...r, serviceId }));
      for (const record of recordsWithServiceId) {
        await db.records.add(record);
      }
      loadRecords();
      alert(`Úspěšně importováno ${recordsWithServiceId.length} záznamů.`);
      setPasswordDialogOpen(false);
      pendingFileRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      alert(`Chyba při importu: ${error instanceof Error ? error.message : 'Neznámá chyba'}`);
      setPasswordDialogOpen(false);
      pendingFileRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setImportingEncrypted(false);
    }
  };

  const handleCancelPasswordDialog = () => {
    setPasswordDialogOpen(false);
    if (passwordDialogMode === 'import') {
      pendingFileRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSync = async () => {
    if (!isOnline) {
      alert('Chyba: Pro odeslání dat na KÚ MSK musíte být online.');
      return;
    }
    setSyncing(true);
    const payload = records.map(r => ({
      identifikatorSluzby: r.serviceId,
      druhSluzby: r.druhSluzby,
      pohlavi: r.pohlavi,
      okres: r.okres,
      hash: r.hash
    }));
    console.table(payload);
    setTimeout(() => {
      setSyncing(false);
      alert(`Synchronizace dokončena.\n${payload.length} záznamů bylo připraveno pro odeslání.`);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 1. SEKCIE: LOGO A NÁZEV */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
          <img
            src="/logo-msk.png"
            alt="Logo MSK"
            className="h-24 w-auto object-contain rounded-lg shadow-2xl"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="text-center md:text-left">
            <h1 className="text-5xl font-extrabold text-white tracking-tight">SocioLink</h1>
            <p className="text-xl text-blue-400 font-medium mt-1">
              Databáze žádostí MSK <span className="text-gray-500 text-base font-normal ml-2">by Radim Miklušák</span>
            </p>
          </div>
        </div>

        {/* 2. SEKCIE: TLAČÍTKA EXPORT/IMPORT/SYNC */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-gray-800/50 p-4 rounded-2xl border border-gray-700/50 shadow-inner">
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <button
              onClick={handleExportClick}
              disabled={records.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-5 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg active:scale-95"
            >
              <Download className="w-5 h-5" />
              Export (Šifrovaný)
            </button>

            <button
              onClick={handleImportClick}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg active:scale-95"
            >
              <Upload className="w-5 h-5" />
              Import (Šifrovaný)
            </button>
            <input ref={fileInputRef} type="file" id="fileUpload" name="fileUpload" accept=".json" onChange={handleImportFile} className="hidden" />
          </div>

          <div className="flex items-center justify-center md:justify-end gap-4 border-t border-gray-700 pt-4 md:border-t-0 md:pt-0">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${
              isOnline ? 'bg-green-900/30 text-green-400 border border-green-800/50' : 'bg-red-900/30 text-red-400 border border-red-800/50'
            }`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>
            <button
              onClick={handleSync}
              disabled={records.length === 0 || syncing}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-5 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg active:scale-95"
            >
              <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Synchronizace...' : 'Odeslat na KÚ MSK'}
            </button>
          </div>
        </div>

        {/* 3. SEKCIE: SPRÁVA SLUŽEB (PŘESUNUTO SEM) */}
        <div className="mb-8">
          <ServiceIdSelector
            serviceId={serviceId}
            serviceIds={serviceIds}
            onServiceIdChange={handleServiceIdChange}
            onAddServiceId={handleAddServiceId}
          />
        </div>

        {/* 4. SEKCIE: FORMULÁŘ A TABULKA */}
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
              Nový záznam
            </h2>
            <AddRecordForm serviceId={serviceId} onRecordAdded={loadRecords} />
          </div>

          <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-gray-700 bg-gray-800/50">
               <h2 className="text-lg font-medium text-white">Přehled žádostí (služba č. {serviceId})</h2>
            </div>
            <RecordsTable records={records} onDelete={handleDelete} />
          </div>
        </div>
      </div>

      <PasswordDialog
        isOpen={passwordDialogOpen}
        title={passwordDialogMode === 'export' ? 'Exportovat data' : 'Importovat data'}
        description={
          passwordDialogMode === 'export'
            ? 'Zadejte master heslo pro zašifrování exportovaných dat'
            : 'Zadejte master heslo pro dešifrování importovaného souboru'
        }
        onConfirm={
          passwordDialogMode === 'export' ? handleExportWithPassword : handleImportWithPassword
        }
        onCancel={handleCancelPasswordDialog}
        loading={importingEncrypted}
      />
    </div>
  );
}

export default App;