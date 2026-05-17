import Dexie, { Table } from 'dexie';

export interface OfflineFile {
  id: string;
  name: string;
  mimeType: string;
  data: Blob;
  savedAt: number;
  size: number;
}

export class OfflineDatabase extends Dexie {
  files!: Table<OfflineFile>;

  constructor() {
    super('MaestroOfflineDB');
    this.version(1).stores({
      files: 'id, name, mimeType, savedAt'
    });
  }
}

export const db = new OfflineDatabase();

export const saveFileOffline = async (file: { id: string, name: string, mimeType: string }, blob: Blob) => {
  await db.files.put({
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    data: blob,
    savedAt: Date.now(),
    size: blob.size
  });
};

export const removeFileOffline = async (id: string) => {
  await db.files.delete(id);
};

export const getOfflineFile = async (id: string) => {
  return await db.files.get(id);
};

export const listOfflineFiles = async () => {
  return await db.files.toArray();
};

export const isFileOffline = async (id: string) => {
  const file = await db.files.get(id);
  return !!file;
};
