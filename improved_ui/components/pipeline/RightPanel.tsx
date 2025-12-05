import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import OperationsPanel from './OperationsPanel';
import AICopilot from './AICopilot';
import { Wrench, Sparkles } from 'lucide-react';

export default function RightPanel({ theme = 'dark' }) {
    const [activeTab, setActiveTab] = useState('operations');

    return (
        <div className={cn(
            "h-full flex flex-col border-l",
            theme === 'light' ? 'bg-gray-100 border-gray-300' : 'bg-slate-900 border-slate-700'
        )}>
            {/* Tabs */}
            <div className={cn(
                "shrink-0 flex border-b",
                theme === 'light' ? 'border-gray-300' : 'border-slate-700'
            )}>
                <button
                    onClick={() => setActiveTab('operations')}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium',
                        'transition-colors border-b-2 -mb-px',
                        activeTab === 'operations'
                            ? theme === 'light'
                                ? 'text-blue-600 border-blue-600 bg-blue-50'
                                : 'text-cyan-400 border-cyan-400 bg-slate-800/30'
                            : theme === 'light'
                                ? 'text-gray-500 border-transparent hover:text-gray-700'
                                : 'text-slate-400 border-transparent hover:text-slate-300'
                    )}
                >
                    <Wrench className="w-4 h-4" />
                    Operations
                </button>
                <button
                    onClick={() => setActiveTab('copilot')}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium',
                        'transition-colors border-b-2 -mb-px',
                        activeTab === 'copilot'
                            ? theme === 'light'
                                ? 'text-purple-600 border-purple-600 bg-purple-50'
                                : 'text-purple-400 border-purple-400 bg-slate-800/30'
                            : theme === 'light'
                                ? 'text-gray-500 border-transparent hover:text-gray-700'
                                : 'text-slate-400 border-transparent hover:text-slate-300'
                    )}
                >
                    <Sparkles className="w-4 h-4" />
                    AI Copilot
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'operations' ? <OperationsPanel theme={theme} /> : <AICopilot theme={theme} />}
            </div>
        </div>
    );
}