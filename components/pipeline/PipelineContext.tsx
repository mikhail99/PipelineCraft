import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient, UseMutateFunction } from '@tanstack/react-query';
import { Entity, Folder, Log, EntityVersion, Branch } from '@/types';

interface PipelineContextType {
    entities: Entity[];
    folders: Folder[];
    logs: Log[];
    versions: EntityVersion[];
    branches: Branch[];
    currentBranch: string;
    setCurrentBranch: (branch: string) => void;
    entitiesLoading: boolean;
    foldersLoading: boolean;
    activeEntity: Entity | undefined;
    activeEntityId: string | null;
    setActiveEntityId: (id: string | null) => void;
    leftPanelWidth: number;
    setLeftPanelWidth: (width: number) => void;
    rightPanelWidth: number;
    setRightPanelWidth: (width: number) => void;
    bottomPanelHeight: number;
    setBottomPanelHeight: (height: number) => void;
    bottomPanelCollapsed: boolean;
    setBottomPanelCollapsed: (collapsed: boolean) => void;
    createEntity: UseMutateFunction<Entity, Error, Omit<Entity, 'id' | 'created_date'>, unknown>;
    updateEntity: UseMutateFunction<Entity, Error, { id: string; data: Partial<Entity> }, unknown>;
    deleteEntity: UseMutateFunction<void, Error, string, unknown>;
    createFolder: UseMutateFunction<Folder, Error, Omit<Folder, 'id' | 'created_date'>, unknown>;
    deleteFolder: UseMutateFunction<void, Error, string, unknown>;
    addLog: (message: string, level?: Log['level'], entityId?: string | null) => void;
    getChildren: (entityId: string) => Entity[];
    getParents: (entityId: string) => Entity[];
    recomputeEntity: (entityId: string) => Promise<void>;
    createVersion: (entityId: string, message?: string) => void;
    revertToVersion: (version: EntityVersion) => Promise<void>;
    createBranch: (name: string, parentBranch: string) => void;
    mergeBranch: (sourceBranch: string, targetBranch: string, entityId: string) => Promise<void>;
}

const PipelineContext = createContext<PipelineContextType | null>(null);

export function PipelineProvider({ children }: { children: ReactNode }) {
    const [activeEntityId, setActiveEntityId] = useState<string | null>(null);
    const [leftPanelWidth, setLeftPanelWidth] = useState(250);
    const [rightPanelWidth, setRightPanelWidth] = useState(300);
    const [bottomPanelHeight, setBottomPanelHeight] = useState(200);
    const [bottomPanelCollapsed, setBottomPanelCollapsed] = useState(false);
    const [currentBranch, setCurrentBranch] = useState('main');
    const queryClient = useQueryClient();

    const { data: entities = [], isLoading: entitiesLoading } = useQuery({
        queryKey: ['entities'],
        queryFn: () => base44.entities.Entity.list(),
    });

    const { data: folders = [], isLoading: foldersLoading } = useQuery({
        queryKey: ['folders'],
        queryFn: () => base44.entities.Folder.list(),
    });

    const { data: logs = [] } = useQuery({
        queryKey: ['logs'],
        queryFn: () => base44.entities.Log.list('-created_date', 100),
    });

    const { data: versions = [] } = useQuery({
        queryKey: ['versions'],
        queryFn: () => base44.entities.EntityVersion.list('-created_date', 500),
    });

    const { data: branches = [] } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const result = await base44.entities.Branch.list();
            if (result.length === 0) {
                await base44.entities.Branch.create({ name: 'main', description: 'Main branch', isActive: true });
                return base44.entities.Branch.list();
            }
            return result;
        },
    });

    const createEntityMutation = useMutation<Entity, Error, Omit<Entity, 'id' | 'created_date'>>({
        mutationFn: (data) => base44.entities.Entity.create(data),
        onSuccess: (newEntity) => {
            queryClient.invalidateQueries({ queryKey: ['entities'] });
            setActiveEntityId(newEntity.id);
            addLog(`Entity '${newEntity.name}' created successfully`, 'success', newEntity.id);
            createVersionMutation.mutate({
                entityId: newEntity.id,
                version: 1,
                snapshot: newEntity,
                message: 'Initial version',
                branch: currentBranch,
            });
        },
    });

    const updateEntityMutation = useMutation<Entity, Error, { id: string; data: Partial<Entity> }>({
        mutationFn: ({ id, data }) => base44.entities.Entity.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['entities'] });
        },
    });

    const deleteEntityMutation = useMutation<void, Error, string>({
        mutationFn: (id) => base44.entities.Entity.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['entities'] });
            addLog('Entity deleted', 'info');
        },
    });

    const createFolderMutation = useMutation<Folder, Error, Omit<Folder, 'id' | 'created_date'>>({
        mutationFn: (data) => base44.entities.Folder.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folders'] });
        },
    });

    const deleteFolderMutation = useMutation<void, Error, string>({
        mutationFn: (id) => base44.entities.Folder.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folders'] });
            addLog('Folder deleted', 'info');
        },
    });

    const addLogMutation = useMutation<Log, Error, Omit<Log, 'id' | 'created_date'>>({
        mutationFn: (data) => base44.entities.Log.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['logs'] });
        },
    });

    const createVersionMutation = useMutation<EntityVersion, Error, Omit<EntityVersion, 'id' | 'created_date'>>({
        mutationFn: (data) => base44.entities.EntityVersion.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['versions'] });
        },
    });

    const createBranchMutation = useMutation<Branch, Error, Omit<Branch, 'id' | 'created_date'>>({
        mutationFn: (data) => base44.entities.Branch.create(data),
        onSuccess: (newBranch) => {
            queryClient.invalidateQueries({ queryKey: ['branches'] });
            setCurrentBranch(newBranch.name);
            addLog(`Branch '${newBranch.name}' created`, 'success');
        },
    });

    const addLog = useCallback((message: string, level: Log['level'] = 'info', entityId: string | null = null) => {
        addLogMutation.mutate({ message, level, entityId } as any);
    }, [addLogMutation]);

    const getChildren = useCallback((entityId: string) => {
        return entities.filter(e => e.dependencies?.includes(entityId));
    }, [entities]);

    const getParents = useCallback((entityId: string) => {
        const entity = entities.find(e => e.id === entityId);
        if (!entity?.dependencies) return [];
        return entities.filter(e => entity.dependencies!.includes(e.id));
    }, [entities]);

    const recomputeEntity = useCallback(async (entityId: string) => {
        const entity = entities.find(e => e.id === entityId);
        if (!entity) return;

        const getDownstream = (id: string, visited = new Set<string>()): string[] => {
            if (visited.has(id)) return [];
            visited.add(id);
            const children = getChildren(id);
            const downstream = [id];
            children.forEach(child => {
                downstream.push(...getDownstream(child.id, visited));
            });
            return downstream;
        };

        const toRecompute = getDownstream(entityId);

        for (const id of toRecompute) {
            await updateEntityMutation.mutateAsync({ id, data: { status: 'stale' } });
        }
        addLog(`Recomputing ${toRecompute.length} entities...`, 'info', entityId);

        await new Promise(resolve => setTimeout(resolve, 1000));

        for (const id of toRecompute) {
            const success = Math.random() > 0.1;
            await updateEntityMutation.mutateAsync({
                id,
                data: { status: success ? 'ok' : 'error' }
            });
            const e = entities.find(en => en.id === id);
            if (success) {
                addLog(`Entity '${e?.name}' computed successfully`, 'success', id);
            } else {
                addLog(`Entity '${e?.name}' computation failed`, 'error', id);
            }
        }
    }, [entities, getChildren, updateEntityMutation, addLog]);

    const createVersion = useCallback((entityId: string, message = '') => {
        const entity = entities.find(e => e.id === entityId);
        if (!entity) return;

        const entityVersions = versions.filter(v => v.entityId === entityId && v.branch === currentBranch);
        const nextVersion = entityVersions.length > 0
            ? Math.max(...entityVersions.map(v => v.version)) + 1
            : 1;

        createVersionMutation.mutate({
            entityId,
            version: nextVersion,
            snapshot: entity,
            message,
            branch: currentBranch,
        });
        addLog(`Version ${nextVersion} created for '${entity.name}'`, 'success', entityId);
    }, [entities, versions, currentBranch, createVersionMutation, addLog]);

    const revertToVersion = useCallback(async (version: EntityVersion) => {
        const { snapshot } = version;
        if (!snapshot) return;

        await updateEntityMutation.mutateAsync({
            id: version.entityId,
            data: {
                name: snapshot.name,
                type: snapshot.type,
                status: snapshot.status,
                folderId: snapshot.folderId,
                dependencies: snapshot.dependencies,
                config: snapshot.config,
                data: snapshot.data,
            }
        });

        const entity = entities.find(e => e.id === version.entityId);
        addLog(`Reverted '${entity?.name}' to version ${version.version}`, 'warning', version.entityId);
        createVersion(version.entityId, `Reverted to v${version.version}`);
    }, [updateEntityMutation, entities, addLog, createVersion]);

    const createBranch = useCallback((name: string, parentBranch: string) => {
        createBranchMutation.mutate({
            name,
            parentBranch,
            description: `Branched from ${parentBranch}`,
            isActive: true,
        });
    }, [createBranchMutation]);

    const mergeBranch = useCallback(async (sourceBranch: string, targetBranch: string, entityId: string) => {
        const sourceVersions = versions
            .filter(v => v.entityId === entityId && v.branch === sourceBranch)
            .sort((a, b) => b.version - a.version);

        if (sourceVersions.length === 0) {
            addLog(`No versions found in branch '${sourceBranch}'`, 'warning');
            return;
        }

        const latestSource = sourceVersions[0];
        await updateEntityMutation.mutateAsync({
            id: entityId,
            data: latestSource.snapshot
        });

        createVersionMutation.mutate({
            entityId,
            version: versions.filter(v => v.entityId === entityId && v.branch === targetBranch).length + 1,
            snapshot: latestSource.snapshot,
            message: `Merged from ${sourceBranch}`,
            branch: targetBranch,
        });

        addLog(`Merged '${sourceBranch}' into '${targetBranch}'`, 'success', entityId);
    }, [versions, updateEntityMutation, createVersionMutation, addLog]);

    const activeEntity = entities.find(e => e.id === activeEntityId);

    const value = {
        entities,
        folders,
        logs,
        versions,
        branches,
        currentBranch,
        setCurrentBranch,
        entitiesLoading,
        foldersLoading,
        activeEntity,
        activeEntityId,
        setActiveEntityId,
        leftPanelWidth,
        setLeftPanelWidth,
        rightPanelWidth,
        setRightPanelWidth,
        bottomPanelHeight,
        setBottomPanelHeight,
        bottomPanelCollapsed,
        setBottomPanelCollapsed,
        createEntity: createEntityMutation.mutate,
        updateEntity: updateEntityMutation.mutate,
        deleteEntity: deleteEntityMutation.mutate,
        createFolder: createFolderMutation.mutate,
        deleteFolder: deleteFolderMutation.mutate,
        addLog,
        getChildren,
        getParents,
        recomputeEntity,
        createVersion,
        revertToVersion,
        createBranch,
        mergeBranch,
    };

    return (
        <PipelineContext.Provider value={value}>
            {children}
        </PipelineContext.Provider>
    );
}

export function usePipeline() {
    const context = useContext(PipelineContext);
    if (!context) {
        throw new Error('usePipeline must be used within PipelineProvider');
    }
    return context;
}