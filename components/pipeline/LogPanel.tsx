import React from 'react';
import { usePipeline } from './PipelineContext';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import moment from 'moment';

const LogIcon = ({ level }) => {
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

export default function LogPanel() {
    const { logs } = usePipeline();

    return (
        <ScrollArea className="h-full">
            <div className="p-2 font-mono text-xs space-y-0.5">
                {logs.length === 0 ? (
                    <div className="text-slate-600 py-4 text-center">No logs yet</div>
                ) : (
                    logs.map((log) => (
                        <div
                            key={log.id}
                            className={cn(
                                'flex items-start gap-2 px-2 py-1.5 rounded',
                                'hover:bg-slate-900/50 transition-colors'
                            )}
                        >
                            <span className="text-slate-600 shrink-0">
                                [{moment(log.created_date).format('HH:mm:ss')}]
                            </span>
                            <LogIcon level={log.level} />
                            <span
                                className={cn(
                                    log.level === 'error' && 'text-red-400',
                                    log.level === 'warning' && 'text-amber-400',
                                    log.level === 'success' && 'text-emerald-400',
                                    log.level === 'info' && 'text-slate-300'
                                )}
                            >
                                {log.message}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </ScrollArea>
    );
}