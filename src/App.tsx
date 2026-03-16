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
        .filter((item): item is RpssData => item !== null);

      await db.rpssData.clear();
      await db.rpssData.bulkAdd(formatted);
      alert(`Registr úspěšně aktualizován (${formatted.length} služeb).`);
      lookupRpssInfo(serviceId);
    } catch (err) {
      alert('Chyba při zpracování souboru registru.');