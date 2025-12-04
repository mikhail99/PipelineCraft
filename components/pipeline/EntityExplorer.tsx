import React, { useState, useMemo } from 'react';
import { usePipeline } from './PipelineContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Table, FileText, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const StatusDot = ({ status }) => {
  const colors = {
    ok: 'bg-emerald-500',
    stale: 'bg-amber-500',
    error: 'bg-red-500',
  };
  return (
    <span className={cn('w-2 h-2 rounded-full shrink-0', colors[status] || 'bg-slate-500')} />
  );
};

const EntityItem = ({ entity, index, onDelete }) => {
  const { activeEntityId, setActiveEntityId } = usePipeline();
  const isActive = activeEntityId === entity.id;
  const Icon = entity.type === 'table' ? Table : FileText;
  const [showDelete, setShowDelete] = useState(false);

  return (
    <Draggable draggableId={entity.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => setActiveEntityId(entity.id)}
          onMouseEnter={() => setShowDelete(true)}
          onMouseLeave={() => setShowDelete(false)}
          className={cn(
            'group flex items-center gap-2 px-2 py-1.5 text-sm font-mono',
            'hover:bg-slate-800/50 transition-colors cursor-pointer',
            isActive && 'bg-slate-800 text-cyan-400',
            snapshot.isDragging && 'bg-slate-700 shadow-lg rounded'
          )}
        >
          <StatusDot status={entity.status} />
          <Icon className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="truncate flex-1">{entity.name}</span>
          {showDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(entity);
              }}
              className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </Draggable>
  );
};

const FolderItem = ({ folder, entities, folders, onDelete, onDeleteEntity }) => {
  const [expanded, setExpanded] = useState(true);

  const sortedEntities = useMemo(() => {
    const folderEntities = entities.filter(e => e.folderId === folder.id);
    const sorted = [];
    const remaining = [...folderEntities];
    const added = new Set();

    while (remaining.length > 0) {
      const toAdd = remaining.filter(entity => {
        const deps = entity.dependencies || [];
        const folderDeps = deps.filter(d => folderEntities.some(e => e.id === d));
        return folderDeps.every(d => added.has(d));
      });

      if (toAdd.length === 0) {
        remaining.sort((a, b) => a.name.localeCompare(b.name));
        sorted.push(...remaining);
        break;
      }

      toAdd.sort((a, b) => a.name.localeCompare(b.name));
      toAdd.forEach(e => {
        sorted.push(e);
        added.add(e.id);
        remaining.splice(remaining.indexOf(e), 1);
      });
    }

    return sorted;
  }, [entities, folder.id]);

  const childFolders = folders.filter(f => f.parentId === folder.id);

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 text-sm',
          'hover:bg-slate-800/50 transition-colors text-slate-300 cursor-pointer'
        )}
      >
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 flex-1">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
          {expanded ? (
            <FolderOpen className="w-4 h-4 text-amber-500" />
          ) : (
            <Folder className="w-4 h-4 text-amber-500" />
          )}
          <span className="font-medium">{folder.name}</span>
        </button>
        <button
          onClick={() => onDelete(folder)}
          className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      {expanded && (
        <Droppable droppableId={folder.id} type="entity">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                'ml-4 min-h-[8px]',
                snapshot.isDraggingOver && 'bg-cyan-500/10 rounded'
              )}
            >
              {childFolders.map(f => (
                <FolderItem
                  key={f.id}
                  folder={f}
                  entities={entities}
                  folders={folders}
                  onDelete={onDelete}
                  onDeleteEntity={onDeleteEntity}
                />
              ))}
              {sortedEntities.map((entity, index) => (
                <EntityItem key={entity.id} entity={entity} index={index} onDelete={onDeleteEntity} />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}
    </div>
  );
};

export default function EntityExplorer({ theme = 'dark' }) {
  const { entities, folders, createFolder, updateEntity, deleteEntity, deleteFolder, entitiesLoading } = usePipeline();
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState(null);

  const rootFolders = folders.filter(f => !f.parentId);
  const rootEntities = useMemo(() => {
    const folderIds = new Set(folders.map(f => f.id));
    return entities.filter(e => !e.folderId || !folderIds.has(e.folderId));
  }, [entities, folders]);

  const sortedRootEntities = useMemo(() => {
    const sorted = [];
    const remaining = [...rootEntities];
    const added = new Set();

    while (remaining.length > 0) {
      const toAdd = remaining.filter(entity => {
        const deps = entity.dependencies || [];
        const rootDeps = deps.filter(d => rootEntities.some(e => e.id === d));
        return rootDeps.every(d => added.has(d));
      });

      if (toAdd.length === 0) {
        remaining.sort((a, b) => a.name.localeCompare(b.name));
        sorted.push(...remaining);
        break;
      }

      toAdd.sort((a, b) => a.name.localeCompare(b.name));
      toAdd.forEach(e => {
        sorted.push(e);
        added.add(e.id);
        remaining.splice(remaining.indexOf(e), 1);
      });
    }

    return sorted;
  }, [rootEntities]);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder({ name: newFolderName.trim() });
      setNewFolderName('');
      setShowNewFolder(false);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const entityId = result.draggableId;
    const destFolderId = result.destination.droppableId === 'root' ? null : result.destination.droppableId;

    updateEntity({ id: entityId, data: { folderId: destFolderId } });
  };

  const handleDeleteEntity = (entity) => {
    setDeleteTarget(entity);
    setDeleteType('entity');
  };

  const handleDeleteFolder = (folder) => {
    setDeleteTarget(folder);
    setDeleteType('folder');
  };

  const confirmDelete = () => {
    if (deleteType === 'entity') {
      deleteEntity(deleteTarget.id);
    } else if (deleteType === 'folder') {
      deleteFolder(deleteTarget.id);
    }
    setDeleteTarget(null);
    setDeleteType(null);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className={cn(
        "h-full flex flex-col border-r",
        theme === 'light' ? 'bg-gray-100 border-gray-300' : 'bg-slate-900 border-slate-700'
      )}>
        <div className={cn(
          "flex items-center justify-between px-3 py-2 border-b",
          theme === 'light' ? 'border-gray-300' : 'border-slate-700'
        )}>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Explorer
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-slate-400 hover:text-slate-200"
            onClick={() => setShowNewFolder(true)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto py-1">
          {entitiesLoading ? (
            <div className="flex items-center justify-center h-20">
              <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {rootFolders.map(folder => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  entities={entities}
                  folders={folders}
                  onDelete={handleDeleteFolder}
                  onDeleteEntity={handleDeleteEntity}
                />
              ))}
              <Droppable droppableId="root" type="entity">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'min-h-[8px]',
                      snapshot.isDraggingOver && 'bg-cyan-500/10'
                    )}
                  >
                    {sortedRootEntities.map((entity, index) => (
                      <EntityItem key={entity.id} entity={entity} index={index} onDelete={handleDeleteEntity} />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </>
          )}
        </div>

        <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-100">New Folder</DialogTitle>
            </DialogHeader>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="bg-slate-800 border-slate-700 text-slate-100"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowNewFolder(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFolder} className="bg-cyan-600 hover:bg-cyan-700">
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent className="bg-slate-900 border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-slate-100">Delete {deleteType}?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DragDropContext>
  );
}