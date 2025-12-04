import React, { useState } from 'react';
import { usePipeline } from './PipelineContext';
import { Entity } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, ArrowUpRight, ArrowDownRight, Pencil, Check, X, FileText, Table as TableIcon, Loader2, Network } from 'lucide-react';
import PipelineGraph from './PipelineGraph';

const StatusBadge = ({ status }: { status: Entity['status'] }) => {
  const config: Record<string, { label: string; className: string }> = {
    ok: { label: 'Ready', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    stale: { label: 'Stale', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    error: { label: 'Error', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  };
  const c = config[status] || config.ok;
  return (
    <Badge variant="outline" className={cn('font-mono text-xs', c.className)}>
      {c.label}
    </Badge>
  );
};

interface LineageSectionProps {
  title: string;
  icon: React.ElementType;
  entities: Entity[];
  iconColor: string;
}

const LineageSection = ({ title, icon: Icon, entities, iconColor }: LineageSectionProps) => (
  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
    <div className="flex items-center gap-2 mb-3">
      <Icon className={cn('w-4 h-4', iconColor)} />
      <span className="text-sm font-medium text-slate-300">{title}</span>
      <span className="text-xs text-slate-500">({entities.length})</span>
    </div>
    {entities.length === 0 ? (
      <p className="text-sm text-slate-500 italic">None</p>
    ) : (
      <div className="flex flex-wrap gap-2">
        {entities.map(e => (
          <div
            key={e.id}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 rounded border border-slate-700/50"
          >
            <span className={cn(
              'w-2 h-2 rounded-full',
              e.status === 'ok' ? 'bg-emerald-500' : e.status === 'stale' ? 'bg-amber-500' : 'bg-red-500'
            )} />
            <span className="text-sm font-mono text-slate-300">{e.name}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

const DataPreview = ({ entity }: { entity: Entity }) => {
  if (!entity.data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <FileText className="w-12 h-12 mb-4 opacity-50" />
        <p>No data available</p>
        <p className="text-sm mt-1">Run the computation to generate data</p>
      </div>
    );
  }

  if (entity.type === 'document') {
    const content = entity.data?.content || (typeof entity.data === 'string' ? entity.data : JSON.stringify(entity.data, null, 2));
    return (
      <div className="bg-slate-800/30 rounded-lg p-6 border border-slate-700/50">
        <pre className="font-mono text-sm text-slate-300 whitespace-pre-wrap">
          {content}
        </pre>
      </div>
    );
  }

  const data = entity.data;
  if (!data.headers || !data.rows) {
    return (
      <div className="bg-slate-800/30 rounded-lg p-6 border border-slate-700/50">
        <pre className="font-mono text-sm text-slate-300 whitespace-pre-wrap">
          {JSON.stringify(entity.data, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-700 hover:bg-transparent">
            {data.headers.map((header: string, i: number) => (
              <TableHead key={i} className="text-slate-400 font-mono text-xs">
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.rows.map((row: any[], i: number) => (
            <TableRow key={i} className="border-slate-700/50 hover:bg-slate-800/50">
              {row.map((cell: any, j: number) => (
                <TableCell key={j} className="font-mono text-sm text-slate-300">
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default function EntityWorkspace({ theme = 'dark' }: { theme?: string }) {
  const { activeEntity, updateEntity, getParents, getChildren, recomputeEntity } = usePipeline();
  const [activeTab, setActiveTab] = useState('graph');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isRecomputing, setIsRecomputing] = useState(false);

  if (!activeEntity) {
    return (
      <div className={cn(
        "h-full flex flex-col items-center justify-center",
        theme === 'light' ? 'bg-white text-gray-500' : 'bg-slate-900/50 text-slate-500'
      )}>
        <TableIcon className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-lg">No entity selected</p>
        <p className="text-sm mt-1">Select an entity from the explorer or create a new one</p>
      </div>
    );
  }

  const parents = getParents(activeEntity.id);
  const children = getChildren(activeEntity.id);

  const handleStartEdit = () => {
    setEditName(activeEntity.name);
    setEditDescription(activeEntity.config?.description || '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    updateEntity({
      id: activeEntity.id,
      data: {
        name: editName,
        config: { ...activeEntity.config, description: editDescription }
      }
    });
    setIsEditing(false);
  };

  const handleRecompute = async () => {
    setIsRecomputing(true);
    await recomputeEntity(activeEntity.id);
    setIsRecomputing(false);
  };

  return (
    <div className={cn(
      "h-full flex flex-col",
      theme === 'light' ? 'bg-white' : 'bg-slate-900/50'
    )}>
      {/* Header */}
      <div className={cn(
        "shrink-0 px-6 py-4 border-b",
        theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-slate-700/50 bg-slate-900/80'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={cn(
                    "font-mono text-lg w-64",
                    theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-slate-800 border-slate-600 text-slate-100'
                  )}
                />
                <Button size="icon" variant="ghost" onClick={handleSaveEdit} className="text-emerald-400">
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)} className="text-slate-400">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <h1 className={cn(
                  "text-xl font-mono font-semibold",
                  theme === 'light' ? 'text-gray-900' : 'text-slate-100'
                )}>
                  {activeEntity.name}
                </h1>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleStartEdit}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </>
            )}
            <StatusBadge status={activeEntity.status} />
            <Badge variant="outline" className="font-mono text-xs text-slate-400 border-slate-600">
              {activeEntity.type}
            </Badge>
          </div>
          <Button
            onClick={handleRecompute}
            disabled={isRecomputing}
            className={cn(
              'gap-2',
              activeEntity.status === 'stale'
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-900'
                : 'bg-slate-700 hover:bg-slate-600'
            )}
          >
            {isRecomputing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Recompute
          </Button>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className={cn(
        "shrink-0 px-6 py-3 border-b",
        theme === 'light' ? 'border-gray-200' : 'border-slate-700/50'
      )}>
        <div className={cn(
          "inline-flex rounded-lg p-1",
          theme === 'light' ? 'bg-gray-200' : 'bg-slate-800'
        )}>
          <button
            onClick={() => setActiveTab('graph')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5',
              activeTab === 'graph'
                ? theme === 'light' ? 'bg-white text-gray-900 shadow-sm' : 'bg-slate-700 text-slate-100'
                : theme === 'light' ? 'text-gray-500 hover:text-gray-700' : 'text-slate-400 hover:text-slate-300'
            )}
          >
            <Network className="w-4 h-4" />
            Pipeline Graph
          </button>
          <button
            onClick={() => setActiveTab('definition')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              activeTab === 'definition'
                ? theme === 'light' ? 'bg-white text-gray-900 shadow-sm' : 'bg-slate-700 text-slate-100'
                : theme === 'light' ? 'text-gray-500 hover:text-gray-700' : 'text-slate-400 hover:text-slate-300'
            )}
          >
            Definition & Config
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              activeTab === 'preview'
                ? theme === 'light' ? 'bg-white text-gray-900 shadow-sm' : 'bg-slate-700 text-slate-100'
                : theme === 'light' ? 'text-gray-500 hover:text-gray-700' : 'text-slate-400 hover:text-slate-300'
            )}
          >
            Data Preview
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'graph' ? (
          <PipelineGraph theme={theme} />
        ) : activeTab === 'definition' ? (
          <div className="p-6">
            <div className="space-y-6 max-w-4xl">
              <div>
                <label className="text-sm font-medium text-slate-400 mb-2 block">Description</label>
                {isEditing ? (
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-slate-300 min-h-24"
                    placeholder="Describe what this entity does..."
                  />
                ) : (
                  <p className="text-slate-300 bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                    {activeEntity.config?.description || 'No description provided'}
                  </p>
                )}
              </div>

              {activeEntity.config?.operationName && (
                <div>
                  <label className="text-sm font-medium text-slate-400 mb-2 block">Operation</label>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                    <span className="text-cyan-400 font-mono">{activeEntity.config.operationName}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <LineageSection
                  title="Inputs (Parents)"
                  icon={ArrowDownRight}
                  entities={parents}
                  iconColor="text-blue-400"
                />
                <LineageSection
                  title="Used By (Children)"
                  icon={ArrowUpRight}
                  entities={children}
                  iconColor="text-purple-400"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <DataPreview entity={activeEntity} />
          </div>
        )}
      </div>
    </div>
  );
}