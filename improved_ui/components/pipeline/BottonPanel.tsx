import React, { useState } from 'react';
import { usePipeline } from './PipelineContext';
import { cn } from '@/lib/utils';
import LogPanel from './LogPanel';
import VersionHistory from './VersionHistory';
import { Terminal, GitBranch } from 'lucide-react';

export default function BottomPanel({ theme = 'dark' }) {
    const [activeTab, setActiveTab] = useState('logs');
    const { activeEntityId } = usePipeline();

    return (
        <div className={cn(
            "h-full flex flex-col border-t",
            theme === 'light' ? 'bg-gray-100 border-gray-300' : 'bg-slate-900 border-slate-700'
        )}>
            {/* Tabs */}
            <div className={cn(
                "shrink-0 flex border-b",
                theme === 'light' ? 'border-gray-300' : 'border-slate-700'
            )}>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 text-sm font-medium',
                        'transition-colors border-b-2 -mb-px',
                        activeTab === 'logs'
                            ? theme === 'light'
                                ? 'text-amber-600 border-amber-600 bg-amber-50'
                                : 'text-amber-400 border-amber-400 bg-slate-800/30'
                            : theme === 'light'
                                ? 'text-gray-500 border-transparent hover:text-gray-700'
                                : 'text-slate-400 border-transparent hover:text-slate-300'
                    )}
                >
                    <Terminal className="w-4 h-4" />
                    System Logs
                </button>
                <button
                    onClick={() => setActiveTab('versions')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 text-sm font-medium',
                        'transition-colors border-b-2 -mb-px',
                        activeTab === 'versions'
                            ? theme === 'light'
                                ? 'text-emerald-600 border-emerald-600 bg-emerald-50'
                                : 'text-emerald-400 border-emerald-400 bg-slate-800/30'
                            : theme === 'light'
                                ? 'text-gray-500 border-transparent hover:text-gray-700'
                                : 'text-slate-400 border-transparent hover:text-slate-300'
                    )}
                >
                    <GitBranch className="w-4 h-4" />
                    Version Control
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'logs' ? (
                    <LogPanel theme={theme} />
                ) : (
                    activeEntityId ? (
                        <VersionHistory entityId={activeEntityId} theme={theme} />
                    ) : (
                        <div className={cn(
                            "h-full flex items-center justify-center",
                            theme === 'light' ? 'text-gray-500' : 'text-slate-500'
                        )}>
                            <p className="text-sm">Select an entity to view version history</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}