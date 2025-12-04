export interface BaseRecord {
    id: string;
    created_date: string;
}

export interface Entity extends BaseRecord {
    name: string;
    type: string;
    status: 'ok' | 'stale' | 'error' | 'pending';
    folderId?: string;
    dependencies?: string[];
    config?: Record<string, any>;
    data?: any;
}

export interface Folder extends BaseRecord {
    name: string;
    parentId?: string;
}

export interface Log extends BaseRecord {
    message: string;
    level: 'info' | 'success' | 'error' | 'warning';
    entityId?: string | null;
}

export interface EntityVersion extends BaseRecord {
    entityId: string;
    version: number;
    snapshot: Entity;
    message: string;
    branch: string;
}

export interface Branch extends BaseRecord {
    name: string;
    description?: string;
    isActive: boolean;
    parentBranch?: string;
}

export interface Agent extends BaseRecord {
    name: string;
    description: string;
}
