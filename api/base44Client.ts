import { Entity, Folder, Log, EntityVersion, Branch, BaseRecord, Agent } from '../types';

type EntityType = 'Entity' | 'Folder' | 'Log' | 'EntityVersion' | 'Branch' | 'Agent';

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getStorageKey(entityType: EntityType): string {
    return `base44_${entityType.toLowerCase()}s`;
}

function getAll<T extends BaseRecord>(entityType: EntityType): T[] {
    const key = getStorageKey(entityType);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

function saveAll<T extends BaseRecord>(entityType: EntityType, records: T[]): void {
    const key = getStorageKey(entityType);
    localStorage.setItem(key, JSON.stringify(records));
}

function createEntityMethods<T extends BaseRecord>(entityType: EntityType) {
    return {
        list: async (sortField?: string, limit?: number): Promise<T[]> => {
            let records = getAll<T>(entityType);

            if (sortField) {
                const descending = sortField.startsWith('-');
                const field = descending ? sortField.slice(1) : sortField;
                records = records.sort((a, b) => {
                    const aVal = a[field as keyof T] as string | number;
                    const bVal = b[field as keyof T] as string | number;
                    if (aVal < bVal) return descending ? 1 : -1;
                    if (aVal > bVal) return descending ? -1 : 1;
                    return 0;
                });
            }

            if (limit) {
                records = records.slice(0, limit);
            }

            return records;
        },

        get: async (id: string): Promise<T | undefined> => {
            const records = getAll<T>(entityType);
            return records.find(r => r.id === id);
        },

        create: async (data: Omit<T, 'id' | 'created_date'>): Promise<T> => {
            const records = getAll<T>(entityType);
            const newRecord = {
                ...data,
                id: generateId(),
                created_date: new Date().toISOString(),
            } as T;
            records.push(newRecord);
            saveAll(entityType, records);
            return newRecord;
        },

        update: async (id: string, data: Partial<T>): Promise<T> => {
            const records = getAll<T>(entityType);
            const index = records.findIndex(r => r.id === id);
            if (index === -1) {
                throw new Error(`${entityType} not found: ${id}`);
            }
            records[index] = { ...records[index], ...data };
            saveAll(entityType, records);
            return records[index];
        },

        delete: async (id: string): Promise<void> => {
            const records = getAll<T>(entityType);
            const filtered = records.filter(r => r.id !== id);
            saveAll(entityType, filtered);
        },
    };
}

export const base44 = {
    entities: {
        Entity: createEntityMethods<Entity>('Entity'),
        Folder: createEntityMethods<Folder>('Folder'),
        Log: createEntityMethods<Log>('Log'),
        EntityVersion: createEntityMethods<EntityVersion>('EntityVersion'),
        Branch: createEntityMethods<Branch>('Branch'),
        Agent: createEntityMethods<Agent>('Agent'),
    },
    integrations: {
        Core: {
            InvokeLLM: async ({ prompt }: { prompt: string }): Promise<string> => {
                console.log('Invoking LLM with prompt:', prompt);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
                return "This is a simulated AI response. In a real app, this would call an LLM API.";
            }
        }
    }
};
