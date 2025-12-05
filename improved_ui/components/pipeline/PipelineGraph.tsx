import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePipeline } from './PipelineContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Maximize2,
    ZoomIn,
    ZoomOut,
    ChevronDown,
    ChevronRight,
    Table,
    FileText,
} from 'lucide-react';

const NODE_WIDTH = 160;
const NODE_HEIGHT = 48;
const HORIZONTAL_GAP = 80;
const VERTICAL_GAP = 24;

const PipelineNode = ({ node, position, isActive, isCollapsed, onToggleCollapse, onSelect, theme }) => {
    const Icon = node.type === 'table' ? Table : FileText;
    const hasChildren = node.childCount > 0;

    const statusColors = {
        ok: theme === 'light' ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-500 bg-emerald-500/10',
        stale: theme === 'light' ? 'border-amber-500 bg-amber-50' : 'border-amber-500 bg-amber-500/10',
        error: theme === 'light' ? 'border-red-500 bg-red-50' : 'border-red-500 bg-red-500/10',
    };

    return (
        <g
            transform={`translate(${position.x}, ${position.y})`}
            onClick={() => onSelect(node.id)}
            className="cursor-pointer"
        >
            <foreignObject width={NODE_WIDTH} height={NODE_HEIGHT}>
                <div
                    className={cn(
                        'w-full h-full rounded-lg border-2 flex items-center gap-2 px-3 transition-all',
                        statusColors[node.status] || statusColors.ok,
                        isActive && (theme === 'light' ? 'ring-2 ring-blue-500 ring-offset-2' : 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900'),
                        theme === 'light' ? 'hover:shadow-md' : 'hover:shadow-lg hover:shadow-cyan-500/10'
                    )}
                >
                    {hasChildren && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleCollapse(node.id);
                            }}
                            className={cn(
                                'shrink-0 w-5 h-5 flex items-center justify-center rounded',
                                theme === 'light' ? 'hover:bg-gray-200' : 'hover:bg-slate-700'
                            )}
                        >
                            {isCollapsed ? (
                                <ChevronRight className="w-3 h-3" />
                            ) : (
                                <ChevronDown className="w-3 h-3" />
                            )}
                        </button>
                    )}
                    <div className={cn(
                        'w-2 h-2 rounded-full shrink-0',
                        node.status === 'ok' ? 'bg-emerald-500' : node.status === 'stale' ? 'bg-amber-500' : 'bg-red-500'
                    )} />
                    <Icon className={cn(
                        'w-4 h-4 shrink-0',
                        theme === 'light' ? 'text-gray-500' : 'text-slate-400'
                    )} />
                    <span className={cn(
                        'text-xs font-mono truncate',
                        theme === 'light' ? 'text-gray-800' : 'text-slate-200'
                    )}>
                        {node.name}
                    </span>
                </div>
            </foreignObject>
        </g>
    );
};

const DependencyLine = ({ from, to, theme }) => {
    const startX = from.x + NODE_WIDTH;
    const startY = from.y + NODE_HEIGHT / 2;
    const endX = to.x;
    const endY = to.y + NODE_HEIGHT / 2;

    const midX = (startX + endX) / 2;

    const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

    return (
        <g>
            <path
                d={path}
                fill="none"
                stroke={theme === 'light' ? '#9ca3af' : '#475569'}
                strokeWidth={2}
                className="transition-all"
            />
            <circle
                cx={endX}
                cy={endY}
                r={4}
                fill={theme === 'light' ? '#6b7280' : '#64748b'}
            />
        </g>
    );
};

export default function PipelineGraph({ theme = 'dark' }) {
    const { entities, activeEntityId, setActiveEntityId, getChildren } = usePipeline();
    const containerRef = useRef(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 50, y: 50 });
    const [collapsedNodes, setCollapsedNodes] = useState(new Set());
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Build graph layout (left-to-right DAG)
    const { nodes, edges, bounds } = React.useMemo(() => {
        if (entities.length === 0) return { nodes: [], edges: [], bounds: { width: 0, height: 0 } };

        // Add childCount to each entity
        const entitiesWithChildren = entities.map(e => ({
            ...e,
            childCount: getChildren(e.id).length
        }));

        // Find root nodes (no dependencies)
        const roots = entitiesWithChildren.filter(e => !e.dependencies || e.dependencies.length === 0);

        // Calculate levels using BFS
        const levels = new Map();
        const queue = [...roots];
        roots.forEach(r => levels.set(r.id, 0));

        while (queue.length > 0) {
            const current = queue.shift();
            const currentLevel = levels.get(current.id);

            // Skip if collapsed
            if (collapsedNodes.has(current.id)) continue;

            const children = entitiesWithChildren.filter(e =>
                e.dependencies?.includes(current.id)
            );

            children.forEach(child => {
                const existingLevel = levels.get(child.id) || 0;
                levels.set(child.id, Math.max(existingLevel, currentLevel + 1));
                if (!queue.find(q => q.id === child.id)) {
                    queue.push(child);
                }
            });
        }

        // Group by level
        const levelGroups = new Map();
        entitiesWithChildren.forEach(e => {
            const level = levels.get(e.id) ?? 0;
            if (!levelGroups.has(level)) levelGroups.set(level, []);
            levelGroups.get(level).push(e);
        });

        // Position nodes
        const positions = new Map();
        let maxX = 0, maxY = 0;

        Array.from(levelGroups.entries())
            .sort((a, b) => a[0] - b[0])
            .forEach(([level, group]) => {
                group.forEach((entity, idx) => {
                    const x = level * (NODE_WIDTH + HORIZONTAL_GAP);
                    const y = idx * (NODE_HEIGHT + VERTICAL_GAP);
                    positions.set(entity.id, { x, y });
                    maxX = Math.max(maxX, x + NODE_WIDTH);
                    maxY = Math.max(maxY, y + NODE_HEIGHT);
                });
            });

        // Build edges
        const edgesList = [];
        entitiesWithChildren.forEach(entity => {
            if (entity.dependencies) {
                entity.dependencies.forEach(depId => {
                    const from = positions.get(depId);
                    const to = positions.get(entity.id);
                    if (from && to && !collapsedNodes.has(depId)) {
                        edgesList.push({ from, to, fromId: depId, toId: entity.id });
                    }
                });
            }
        });

        return {
            nodes: entitiesWithChildren.map(e => ({
                ...e,
                position: positions.get(e.id) || { x: 0, y: 0 }
            })),
            edges: edgesList,
            bounds: { width: maxX + 100, height: maxY + 100 }
        };
    }, [entities, collapsedNodes, getChildren]);

    const handleToggleCollapse = useCallback((nodeId) => {
        setCollapsedNodes(prev => {
            const next = new Set(prev);
            if (next.has(nodeId)) {
                next.delete(nodeId);
            } else {
                next.add(nodeId);
            }
            return next;
        });
    }, []);

    const handleFitToScreen = useCallback(() => {
        if (!containerRef.current || bounds.width === 0) return;

        const container = containerRef.current;
        const containerWidth = container.clientWidth - 100;
        const containerHeight = container.clientHeight - 100;

        const scaleX = containerWidth / bounds.width;
        const scaleY = containerHeight / bounds.height;
        const newZoom = Math.min(scaleX, scaleY, 1.5);

        setZoom(Math.max(0.3, newZoom));
        setPan({ x: 50, y: 50 });
    }, [bounds]);

    const handleMouseDown = (e) => {
        if (e.target === e.currentTarget || e.target.tagName === 'svg') {
            setIsDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        handleFitToScreen();
    }, [entities.length]);

    if (entities.length === 0) {
        return (
            <div className={cn(
                "h-full flex items-center justify-center",
                theme === 'light' ? 'text-gray-500' : 'text-slate-500'
            )}>
                <p className="text-sm">No entities to visualize</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={cn(
                "h-full w-full relative overflow-hidden",
                theme === 'light' ? 'bg-gray-50' : 'bg-slate-900/30'
            )}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Controls */}
            <div className={cn(
                "absolute top-3 right-3 flex gap-1 z-10 p-1 rounded-lg",
                theme === 'light' ? 'bg-white shadow-md border border-gray-200' : 'bg-slate-800 border border-slate-700'
            )}>
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setZoom(z => Math.min(z + 0.2, 2))}
                    className="h-7 w-7"
                >
                    <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setZoom(z => Math.max(z - 0.2, 0.3))}
                    className="h-7 w-7"
                >
                    <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleFitToScreen}
                    className="h-7 w-7"
                >
                    <Maximize2 className="w-4 h-4" />
                </Button>
            </div>

            {/* Zoom indicator */}
            <div className={cn(
                "absolute bottom-3 left-3 px-2 py-1 rounded text-xs font-mono",
                theme === 'light' ? 'bg-white text-gray-600 border border-gray-200' : 'bg-slate-800 text-slate-400 border border-slate-700'
            )}>
                {Math.round(zoom * 100)}%
            </div>

            {/* Graph */}
            <svg
                width="100%"
                height="100%"
                className={cn("cursor-grab", isDragging && "cursor-grabbing")}
            >
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                    {/* Edges */}
                    {edges.map((edge, i) => (
                        <DependencyLine key={i} from={edge.from} to={edge.to} theme={theme} />
                    ))}

                    {/* Nodes */}
                    {nodes.map(node => (
                        <PipelineNode
                            key={node.id}
                            node={node}
                            position={node.position}
                            isActive={activeEntityId === node.id}
                            isCollapsed={collapsedNodes.has(node.id)}
                            onToggleCollapse={handleToggleCollapse}
                            onSelect={setActiveEntityId}
                            theme={theme}
                        />
                    ))}
                </g>
            </svg>
        </div>
    );
}