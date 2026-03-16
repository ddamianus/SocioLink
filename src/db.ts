import Dexie, { Table } from 'dexie';

export type DruhSluzby =
  | 'odlehčovací služba'
  | 'týdenní stacionář'
  | 'domov pro osoby se zdravotním postižením'
  | 'domov pro seniory'
  | 'domov se zvláštním režimem'
  | 'chráněné bydlení'
  | 'azylový dům'
  | 'dům na půl cesty';

export interface Record {
  id?: number;
  serviceId: number;
  jmeno: string;
  prijmeni: string;
  pohlavi: 'muž' | 'žena' | 'neuvedeno';
  datumNarozeni: string;
  okres: 'Bruntál' | 'Frýdek-Místek' | 'Karviná' | 'Nový Jičín' | 'Opava' | 'Ostrava-město' | 'jiný kraj';
  druhSluzby: DruhSluzby;
  hash: string;
}

export class SocioLinkDB extends Dexie {
  records!: Table<Record>;

  constructor() {
    super('SocioLinkDB');
    this.version(1).stores({
      records: '++id, serviceId, hash'
    });
  }
}

export const db = new SocioLinkDB();

export async function generateHash(jmeno: string, prijmeni: string, datumNarozeni: string): Promise<string> {
  const data = `${jmeno}|${prijmeni}|${datumNarozeni}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
