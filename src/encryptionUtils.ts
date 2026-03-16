import CryptoJS from 'crypto-js';
import { Record } from './db';

export async function exportEncryptedJSON(
  records: Record[],
  password: string
): Promise<Blob> {
  const jsonData = JSON.stringify(records, null, 2);
  const encrypted = CryptoJS.AES.encrypt(jsonData, password).toString();

  const payload = {
    version: 1,
    timestamp: new Date().toISOString(),
    encrypted: true,
    data: encrypted
  };

  const blob = new Blob([JSON.stringify(payload)], {
    type: 'application/json;charset=utf-8;'
  });

  return blob;
}

export async function decryptEncryptedJSON(
  fileContent: string,
  password: string
): Promise<{ records: Record[]; error: string | null }> {
  try {
    const payload = JSON.parse(fileContent);

    if (!payload.encrypted || !payload.data) {
      return { records: [], error: 'Nevalidní formát souboru' };
    }

    const decrypted = CryptoJS.AES.decrypt(payload.data, password).toString(
      CryptoJS.enc.Utf8
    );

    if (!decrypted) {
      return { records: [], error: 'Chybné heslo nebo poškozený soubor' };
    }

    const records: Record[] = JSON.parse(decrypted);

    if (!Array.isArray(records)) {
      return { records: [], error: 'Data nejsou polem záznamů' };
    }

    return { records, error: null };
  } catch (error) {
    return {
      records: [],
      error: `Chyba při importu: ${error instanceof Error ? error.message : 'Neznámá chyba'}`
    };
  }
}
