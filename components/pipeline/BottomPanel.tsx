import { useState } from 'react';
import { cn } from '@/lib/utils';
import { usePipeline } from './PipelineContext';
import { Log } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
    Terminal,
    GitBranch,
    Clock,
    RotateCcw,
    Info,
    CheckCircle2,
    AlertTriangle,
    XCircle,
} from 'lucide-react';
import moment from 'moment';

const LogIcon = ({ level }: { level: Log['level'] }) => {
    const config = {
        info: { icon: Info, color: 'text-slate-400' },
        success: { icon: CheckCircle2, color: 'text-emerald-400' },
        warning: { icon: AlertTriangle, color: 'text-amber-400' },
        error: { icon: XCircle, color: 'text-red-400' },
    };
    const c = config[level] || config.info;
    const Icon = c.icon;
    return <Icon className={cn('w-3.5 h-3.5 shrink-0', c.color)} />;
};

export default function BottomPanel({ theme = 'dark' }: { theme?: string }) {
    const [activeTab, setActiveTab] = useState('logs');
    const { logs, versions, activeEntity, revertToVersion } = usePipeline();

    const entityVersions = activeEntity
        ? versions.filter(v => v.entityId === activeEntity.id).sort((a, b) => b.version - a.version)
        : [];

    return (
        <div className={cn(
            "h-full flex flex-col border-t",
            theme === 'light' ? 'bg-gray-50 border-gray-300' : 'bg-slate-900 border-slate-700'
        )}>
            {/* Tabs */}
            <div className={cn(
                "shrink-0 flex border-b",
                theme === 'light' ? 'border-gray-300' : 'border-slate-700'
            )}>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                        activeTab === 'logs'
                            ? theme === 'light'
                                ? 'text-blue-600 border-blue-600'
                                : 'text-cyan-400 border-cyan-400'
                            : theme === 'light'
                                ? 'text-gray-500 border-transparent hover:text-gray-700'
                                : 'text-slate-500 border-transparent hover:text-slate-300'
                    )}
                >
                    <Terminal className="w-4 h-4" />
                    System Logs
                </button>
                <button
                    onClick={() => setActiveTab('versions')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                        activeTab === 'versions'
                            ? theme === 'light'
                                ? 'text-blue-600 border-blue-600'
                                : 'text-cyan-400 border-cyan-400'
                            : theme === 'light'
                                ? 'text-gray-500 border-transparent hover:text-gray-700'
                                : 'text-slate-500 border-transparent hover:text-slate-300'
                    )}
                >
                    <GitBranch className="w-4 h-4" />
                    Version Control
                </button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
                {activeTab === 'logs' ? (
                    <div className="p-2 font-mono text-xs space-y-0.5">
                        {logs.length === 0 ? (
                            <div className={cn(
                                "py-4 text-center",
                                theme === 'light' ? 'text-gray-400' : 'text-slate-600'
                            )}>
                                No logs yet
                            </div>
                        ) : (
                            logs.map((log) => (
                                <div
                                    key={log.id}
                                    className={cn(
                                        'flex items-start gap-2 px-2 py-1.5 rounded transition-colors',
                                        theme === 'light'
                                            ? 'hover:bg-gray-100'
                                            : 'hover:bg-slate-900/50'
                                    )}
                                >
                                    <span className={cn(
                                        "shrink-0",
                                        theme === 'light' ? 'text-gray-400' : 'text-slate-600'
                                    )}>
                                        [{moment(log.created_date).format('HH:mm:ss')}]
                                    </span>
                                    <LogIcon level={log.level} />
                                    <span className={cn(
                                        log.level === 'error' && 'text-red-400',
                                        log.level === 'warning' && 'text-amber-400',
                                        log.level === 'success' && 'text-emerald-400',
                                        log.level === 'info' && (theme === 'light' ? 'text-gray-700' : 'text-slate-300')
                                    )}>
                                        {log.message}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="p-3 space-y-2">
                        {!activeEntity ? (
                            <div className={cn(
                                "py-4 text-center text-sm",
                                theme === 'light' ? 'text-gray-400' : 'text-slate-600'
                            )}>
                                Select an entity to view version history
                            </div>
                        ) : entityVersions.length === 0 ? (
                            <div className={cn(
                                "py-4 text-center text-sm",
                                theme === 'light' ? 'text-gray-400' : 'text-slate-600'
                            )}>
                                No versions yet
                            </div>
                        ) : (
                            entityVersions.map((version) => (
                                <div
                                    key={version.id}
                                    className={cn(
                                        'flex items-center justify-between p-3 rounded-lg border',
                                        theme === 'light'
                                            ? 'bg-white border-gray-200'
                                            : 'bg-slate-800/50 border-slate-700/50'
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm font-bold",
                                            theme === 'light'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-cyan-500/20 text-cyan-400'
                                        )}>
                                            v{version.version}
                                        </div>
                                        <div>
                                            <p className={cn(
                                                "text-sm font-medium",
                                                theme === 'light' ? 'text-gray-900' : 'text-slate-200'
                                            )}>
                                                {version.message || 'No message'}
                                            </p>
                                            <div className={cn(
                                                "flex items-center gap-2 text-xs",
                                                theme === 'light' ? 'text-gray-500' : 'text-slate-500'
                                            )}>
                                                <Clock className="w-3 h-3" />
                                                {moment(version.created_date).fromNow()}
                                                <span className="px-1.5 py-0.5 bg-slate-700/50 rounded text-slate-400">
                                                    {version.branch}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => revertToVersion(version)}
                                        className={cn(
                                            "h-7 text-xs gap-1",
                                            theme === 'light' ? 'text-gray-600' : 'text-slate-400'
                                        )}
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        Revert
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
