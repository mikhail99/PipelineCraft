import React, { createContext, useContext, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const PipelineContext = createContext(null);

export function PipelineProvider({ children }) {
    const [activeEntityId, setActiveEntityId] = useState(null);
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

    const createEntityMutation = useMutation({
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

    const updateEntityMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Entity.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['entities'] });
        },
    });

    const deleteEntityMutation = useMutation({
        mutationFn: (id) => base44.entities.Entity.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['entities'] });
            addLog('Entity deleted', 'info');
        },
    });

    const createFolderMutation = useMutation({
        mutationFn: (data) => base44.entities.Folder.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folders'] });
        },
    });

    const deleteFolderMutation = useMutation({
        mutationFn: (id) => base44.entities.Folder.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folders'] });
            addLog('Folder deleted', 'info');
        },
    });

    const addLogMutation = useMutation({
        mutationFn: (data) => base44.entities.Log.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['logs'] });
        },
    });

    const createVersionMutation = useMutation({
        mutationFn: (data) => base44.entities.EntityVersion.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['versions'] });
        },
    });

    const createBranchMutation = useMutation({
        mutationFn: (data) => base44.entities.Branch.create(data),
        onSuccess: (newBranch) => {
            queryClient.invalidateQueries({ queryKey: ['branches'] });
            setCurrentBranch(newBranch.name);
            addLog(`Branch '${newBranch.name}' created`, 'success');
        },
    });

    const addLog = useCallback((message, level = 'info', entityId = null) => {
        addLogMutation.mutate({ message, level, entityId });
    }, [addLogMutation]);

    const getChildren = useCallback((entityId) => {
        return entities.filter(e => e.dependencies?.includes(entityId));
    }, [entities]);

    const getParents = useCallback((entityId) => {
        const entity = entities.find(e => e.id === entityId);
        if (!entity?.dependencies) return [];
        return entities.filter(e => entity.dependencies.includes(e.id));
    }, [entities]);

    const recomputeEntity = useCallback(async (entityId) => {
        const entity = entities.find(e => e.id === entityId);
        if (!entity) return;

        const getDownstream = (id, visited = new Set()) => {
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

    const createVersion = useCallback((entityId, message = '') => {
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

    const revertToVersion = useCallback(async (version) => {
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

    const createBranch = useCallback((name, parentBranch) => {
        createBranchMutation.mutate({
            name,
            parentBranch,
            description: `Branched from ${parentBranch}`,
            isActive: true,
        });
    }, [createBranchMutation]);

    const mergeBranch = useCallback(async (sourceBranch, targetBranch, entityId) => {
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