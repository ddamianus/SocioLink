import Dexie, { type Table } from 'dexie';

export interface Record {
  id?: number;
  serviceId: number;
  jmeno: string;
  prijmeni: string;
  pohlavi: string;
  datumNarozeni: string;
  druhSluzby: string;
  okres: string;
  hash: string;
  createdAt: Date;
}

export interface RpssData {
  id: number; // identifikátor_služby
  organization: string;
  serviceType: string;
}

export class MyDatabase extends Dexie {
  records!: Table<Record>;
  rpssData!: Table<RpssData>;

  constructor() {
    super('SocioLinkDB');
    this.version(5).stores({
      records: '++id, serviceId, hash',
      rpssData: 'id, organization'
    });
  }
}

export const db = new MyDatabase();