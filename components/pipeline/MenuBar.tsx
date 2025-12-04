import React from 'react';
import { cn } from '@/lib/utils';
import { usePipeline } from './PipelineContext';
import { Button } from '@/components/ui/button';
import {
    Sun,
    Moon,
    GitBranch,
    Check,
    RefreshCw,
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function MenuBar({ theme, setTheme }) {
    const { branches, currentBranch, setCurrentBranch, recomputeEntity, entities } = usePipeline();

    const handleRecomputeAll = async () => {
        for (const entity of entities) {
            await recomputeEntity(entity.id);
        }
    };

    return (
        <div className={cn(
            "h-10 flex items-center justify-between px-4 border-b shrink-0",
            theme === 'light' ? 'bg-gray-100 border-gray-300' : 'bg-slate-950 border-slate-700'
        )}>
            {/* Left: Menu items */}
            <div className="flex items-center gap-1">
                {['File', 'Edit', 'View', 'Help'].map((item) => (
                    <button
                        key={item}
                        className={cn(
                            'px-3 py-1 text-sm rounded transition-colors',
                            theme === 'light'
                                ? 'text-gray-700 hover:bg-gray-200'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        )}
                    >
                        {item}
                    </button>
                ))}
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className={cn(
                        'px-3 py-1 text-sm rounded transition-colors flex items-center gap-1.5',
                        theme === 'light'
                            ? 'text-gray-700 hover:bg-gray-200'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    )}
                >
                    {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    Theme
                </button>
            </div>

            {/* Right: Branch selector and actions */}
            <div className="flex items-center gap-3">
                {/* Branch Selector */}
                <div className="flex items-center gap-2">
                    <GitBranch className={cn(
                        "w-4 h-4",
                        theme === 'light' ? 'text-gray-500' : 'text-slate-500'
                    )} />
                    <Select value={currentBranch} onValueChange={setCurrentBranch}>
                        <SelectTrigger className={cn(
                            "w-32 h-7 text-xs",
                            theme === 'light'
                                ? 'bg-white border-gray-300 text-gray-900'
                                : 'bg-slate-800 border-slate-700 text-slate-100'
                        )}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={cn(
                            theme === 'light'
                                ? 'bg-white border-gray-300'
                                : 'bg-slate-800 border-slate-700'
                        )}>
                            {branches.map((branch) => (
                                <SelectItem key={branch.id} value={branch.name} className="text-xs">
                                    {branch.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Commit All */}
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-7 text-xs gap-1.5",
                        theme === 'light' ? 'text-gray-700' : 'text-slate-300'
                    )}
                >
                    <Check className="w-3.5 h-3.5" />
                    Commit All
                </Button>

                {/* Recompute All */}
                <Button
                    size="sm"
                    onClick={handleRecomputeAll}
                    className="h-7 text-xs gap-1.5 bg-cyan-600 hover:bg-cyan-700"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Recompute All
                </Button>
            </div>
        </div>
    );
}
