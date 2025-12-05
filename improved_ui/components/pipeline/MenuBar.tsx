import React, { useState } from 'react';
import { usePipeline } from './PipelineContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { RefreshCw, GitCommit, Sun, Moon, Monitor } from 'lucide-react';

const menuItems = {
    File: ['New Entity', 'New Folder', '---', 'Import...', 'Export...', '---', 'Settings'],
    Edit: ['Undo', 'Redo', '---', 'Cut', 'Copy', 'Paste', '---', 'Find', 'Replace'],
    View: ['Explorer', 'Operations', 'AI Copilot', '---', 'Logs', 'Version Control', '---', 'Zoom In', 'Zoom Out'],
    Help: ['Documentation', 'Keyboard Shortcuts', '---', 'Report Issue', '---', 'About'],
};

export default function MenuBar({ theme, setTheme }) {
    const { entities, recomputeEntity, createVersion, addLog } = usePipeline();
    const [isRecomputingAll, setIsRecomputingAll] = useState(false);
    const [isCommittingAll, setIsCommittingAll] = useState(false);

    const handleRecomputeAll = async () => {
        setIsRecomputingAll(true);
        addLog('Starting recompute all...', 'info');

        for (const entity of entities) {
            await recomputeEntity(entity.id);
        }

        addLog('All entities recomputed', 'success');
        setIsRecomputingAll(false);
    };

    const handleCommitAll = async () => {
        setIsCommittingAll(true);
        addLog('Committing all entities...', 'info');

        for (const entity of entities) {
            createVersion(entity.id, 'Bulk commit');
        }

        addLog(`Committed ${entities.length} entities`, 'success');
        setIsCommittingAll(false);
    };

    return (
        <div className={cn(
            'shrink-0 h-10 flex items-center justify-between px-2 border-b',
            theme === 'light'
                ? 'bg-gray-100 border-gray-300'
                : 'bg-slate-900 border-slate-700'
        )}>
            <div className="flex items-center gap-1">
                {/* Window Controls */}
                <div className="flex items-center gap-1.5 mr-4 px-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>

                {/* Menu Items */}
                {Object.entries(menuItems).map(([menu, items]) => (
                    <DropdownMenu key={menu}>
                        <DropdownMenuTrigger asChild>
                            <button className={cn(
                                'px-3 py-1 text-sm rounded hover:bg-opacity-10',
                                theme === 'light'
                                    ? 'text-gray-700 hover:bg-gray-500'
                                    : 'text-slate-300 hover:bg-slate-700'
                            )}>
                                {menu}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className={cn(
                            theme === 'light'
                                ? 'bg-white border-gray-200'
                                : 'bg-slate-800 border-slate-700'
                        )}>
                            {items.map((item, i) =>
                                item === '---' ? (
                                    <DropdownMenuSeparator key={i} className={theme === 'light' ? 'bg-gray-200' : 'bg-slate-700'} />
                                ) : (
                                    <DropdownMenuItem
                                        key={item}
                                        className={cn(
                                            'text-sm cursor-pointer',
                                            theme === 'light' ? 'text-gray-700' : 'text-slate-300'
                                        )}
                                    >
                                        {item}
                                    </DropdownMenuItem>
                                )
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ))}

                {/* Theme Selector */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={cn(
                            'px-3 py-1 text-sm rounded hover:bg-opacity-10 flex items-center gap-1',
                            theme === 'light'
                                ? 'text-gray-700 hover:bg-gray-500'
                                : 'text-slate-300 hover:bg-slate-700'
                        )}>
                            {theme === 'light' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                            Theme
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className={cn(
                        theme === 'light'
                            ? 'bg-white border-gray-200'
                            : 'bg-slate-800 border-slate-700'
                    )}>
                        <DropdownMenuItem
                            onClick={() => setTheme('dark')}
                            className={cn('text-sm cursor-pointer', theme === 'light' ? 'text-gray-700' : 'text-slate-300')}
                        >
                            <Moon className="w-4 h-4 mr-2" /> Dark
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setTheme('light')}
                            className={cn('text-sm cursor-pointer', theme === 'light' ? 'text-gray-700' : 'text-slate-300')}
                        >
                            <Sun className="w-4 h-4 mr-2" /> Light
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
                <span className={cn(
                    'text-sm font-semibold font-mono mr-4',
                    theme === 'light' ? 'text-gray-700' : 'text-slate-300'
                )}>
                    DataPipe IDE
                </span>

                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCommitAll}
                    disabled={isCommittingAll || entities.length === 0}
                    className={cn(
                        'h-7 text-xs gap-1',
                        theme === 'light' ? 'text-gray-600 hover:bg-gray-200' : 'text-slate-400 hover:bg-slate-700'
                    )}
                >
                    <GitCommit className={cn('w-3 h-3', isCommittingAll && 'animate-pulse')} />
                    Commit All
                </Button>

                <Button
                    size="sm"
                    onClick={handleRecomputeAll}
                    disabled={isRecomputingAll || entities.length === 0}
                    className="h-7 text-xs gap-1 bg-cyan-600 hover:bg-cyan-700"
                >
                    <RefreshCw className={cn('w-3 h-3', isRecomputingAll && 'animate-spin')} />
                    Recompute All
                </Button>
            </div>
        </div>
    );
}