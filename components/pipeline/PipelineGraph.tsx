import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { usePipeline } from './PipelineContext';
import { cn } from '@/lib/utils';
import { Entity } from '@/types';
import { Table, FileText, ChevronDown } from 'lucide-react';
import { Node, Edge, NodeProps } from 'reactflow';

const EntityNode = ({ data }: NodeProps) => {
    const statusColors = {
        ok: 'border-emerald-500 bg-emerald-500/10',
        stale: 'border-amber-500 bg-amber-500/10',
        error: 'border-red-500 bg-red-500/10',
    };

    const statusDot = {
        ok: 'bg-emerald-500',
        stale: 'bg-amber-500',
        error: 'bg-red-500',
    };

    const Icon = data.type === 'table' ? Table : FileText;

    return (
        <div
            className={cn(
                'px-4 py-3 rounded-lg border-2 min-w-[140px] cursor-pointer transition-all',
                'hover:shadow-lg hover:shadow-cyan-500/20',
                statusColors[data.status as keyof typeof statusColors] || 'border-slate-600 bg-slate-800',
                data.isActive && 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900'
            )}
        >
            <div className="flex items-center gap-2">
                <ChevronDown className="w-4 h-4 text-slate-500" />
                <span className={cn('w-2 h-2 rounded-full', statusDot[data.status as keyof typeof statusDot] || 'bg-slate-500')} />
                <Icon className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-mono text-slate-200 truncate max-w-[100px]">
                    {data.label}
                </span>
            </div>
        </div>
    );
};

const nodeTypes = {
    entity: EntityNode,
};

export default function PipelineGraph({ theme = 'dark' }: { theme?: string }) {
    const { entities, activeEntityId, setActiveEntityId } = usePipeline();

    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
        const nodeMap = new Map<string, { x: number; y: number }>();
        const levels = new Map<number, Entity[]>();

        // Calculate levels based on dependencies
        const getLevel = (entity: Entity, visited = new Set<string>()): number => {
            if (visited.has(entity.id)) return 0;
            visited.add(entity.id);

            const deps = entity.dependencies || [];
            if (deps.length === 0) return 0;

            let maxLevel = 0;
            deps.forEach(depId => {
                const depEntity = entities.find(e => e.id === depId);
                if (depEntity) {
                    maxLevel = Math.max(maxLevel, getLevel(depEntity, visited) + 1);
                }
            });
            return maxLevel;
        };

        entities.forEach(entity => {
            const level = getLevel(entity);
            if (!levels.has(level)) {
                levels.set(level, []);
            }
            levels.get(level)!.push(entity);
        });

        // Create nodes with positions
        const nodes: Node[] = [];
        const xSpacing = 200;
        const ySpacing = 100;

        levels.forEach((levelEntities, level) => {
            levelEntities.forEach((entity, index) => {
                const x = level * xSpacing + 50;
                const y = index * ySpacing + 50;

                nodes.push({
                    id: entity.id,
                    type: 'entity',
                    position: { x, y },
                    data: {
                        label: entity.name,
                        status: entity.status,
                        type: entity.type,
                        isActive: entity.id === activeEntityId,
                    },
                });
                nodeMap.set(entity.id, { x, y });
            });
        });

        // Create edges
        const edges: Edge[] = [];
        entities.forEach(entity => {
            (entity.dependencies || []).forEach(depId => {
                if (nodeMap.has(depId)) {
                    edges.push({
                        id: `${depId}-${entity.id}`,
                        source: depId,
                        target: entity.id,
                        type: 'smoothstep',
                        animated: entity.status === 'stale',
                        style: {
                            stroke: entity.status === 'error' ? '#ef4444' :
                                entity.status === 'stale' ? '#f59e0b' : '#06b6d4',
                            strokeWidth: 2,
                        },
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            color: entity.status === 'error' ? '#ef4444' :
                                entity.status === 'stale' ? '#f59e0b' : '#06b6d4',
                        },
                    });
                }
            });
        });

        return { nodes, edges };
    }, [entities, activeEntityId]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Update nodes when entities or activeEntityId changes
    React.useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
        setActiveEntityId(node.id);
    }, [setActiveEntityId]);

    if (entities.length === 0) {
        return (
            <div className={cn(
                "h-full flex flex-col items-center justify-center",
                theme === 'light' ? 'bg-gray-50 text-gray-500' : 'bg-slate-900/50 text-slate-500'
            )}>
                <Table className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-lg">No entities in pipeline</p>
                <p className="text-sm mt-1">Create an entity using the Operations panel</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.5}
                maxZoom={2}
            >
                <Background
                    color={theme === 'light' ? '#e5e7eb' : '#334155'}
                    gap={20}
                    size={1}
                />
                <Controls
                    className={cn(
                        "!bg-slate-800 !border-slate-700 !shadow-lg",
                        "[&>button]:!bg-slate-700 [&>button]:!border-slate-600",
                        "[&>button]:!text-slate-300 [&>button:hover]:!bg-slate-600"
                    )}
                />
                <MiniMap
                    nodeColor={(node) => {
                        switch (node.data?.status) {
                            case 'ok': return '#10b981';
                            case 'stale': return '#f59e0b';
                            case 'error': return '#ef4444';
                            default: return '#64748b';
                        }
                    }}
                    maskColor={theme === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(15,23,42,0.8)'}
                    className="!bg-slate-800 !border-slate-700"
                />
            </ReactFlow>
        </div>
    );
}
