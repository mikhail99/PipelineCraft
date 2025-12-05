import React, { useState } from 'react';
import { usePipeline } from './PipelineContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    History,
    GitBranch,
    GitCommit,
    RotateCcw,
    GitMerge,
    Plus,
    Clock,
    ChevronRight,
} from 'lucide-react';
import moment from 'moment';

export default function VersionHistory({ entityId, onClose }) {
    const {
        versions,
        branches,
        currentBranch,
        setCurrentBranch,
        createVersion,
        revertToVersion,
        createBranch,
        mergeBranch,
        activeEntity,
    } = usePipeline();

    const [showNewBranch, setShowNewBranch] = useState(false);
    const [newBranchName, setNewBranchName] = useState('');
    const [commitMessage, setCommitMessage] = useState('');
    const [showCommit, setShowCommit] = useState(false);
    const [showMerge, setShowMerge] = useState(false);
    const [mergeBranchName, setMergeBranchName] = useState('');

    const entityVersions = versions
        .filter(v => v.entityId === entityId && v.branch === currentBranch)
        .sort((a, b) => b.version - a.version);

    const handleCommit = () => {
        if (activeEntity) {
            createVersion(entityId, commitMessage || 'Manual commit');
            setCommitMessage('');
            setShowCommit(false);
        }
    };

    const handleCreateBranch = () => {
        if (newBranchName.trim()) {
            createBranch(newBranchName.trim(), currentBranch);
            setNewBranchName('');
            setShowNewBranch(false);
        }
    };

    const handleMerge = () => {
        if (mergeBranchName) {
            mergeBranch(mergeBranchName, currentBranch, entityId);
            setMergeBranchName('');
            setShowMerge(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Branch Selector */}
            <div className="shrink-0 p-3 border-b border-slate-700/50 space-y-3">
                <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-emerald-400" />
                    <Select value={currentBranch} onValueChange={setCurrentBranch}>
                        <SelectTrigger className="flex-1 bg-slate-800 border-slate-700 text-slate-100">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                            {branches.map((branch) => (
                                <SelectItem key={branch.id} value={branch.name} className="text-slate-100">
                                    {branch.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setShowNewBranch(true)}
                        className="text-slate-400 hover:text-slate-200"
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex gap-2">
                    <Button
                        size="sm"
                        onClick={() => setShowCommit(true)}
                        className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                    >
                        <GitCommit className="w-3 h-3 mr-1" />
                        Commit
                    </Button>
                    {currentBranch !== 'main' && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowMerge(true)}
                            className="flex-1 border-slate-600 text-slate-300"
                        >
                            <GitMerge className="w-3 h-3 mr-1" />
                            Merge
                        </Button>
                    )}
                </div>
            </div>

            {/* Version List */}
            <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                    {entityVersions.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No versions yet</p>
                            <p className="text-xs mt-1">Commit changes to create versions</p>
                        </div>
                    ) : (
                        entityVersions.map((version, index) => (
                            <div
                                key={version.id}
                                className={cn(
                                    'p-3 rounded-lg border transition-colors',
                                    index === 0
                                        ? 'bg-cyan-500/10 border-cyan-500/30'
                                        : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50'
                                )}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            'w-2 h-2 rounded-full',
                                            index === 0 ? 'bg-cyan-400' : 'bg-slate-500'
                                        )} />
                                        <span className="font-mono text-sm text-slate-200">
                                            v{version.version}
                                        </span>
                                        {index === 0 && (
                                            <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">
                                                Current
                                            </Badge>
                                        )}
                                    </div>
                                    {index > 0 && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => revertToVersion(version)}
                                            className="h-7 text-xs text-slate-400 hover:text-amber-400"
                                        >
                                            <RotateCcw className="w-3 h-3 mr-1" />
                                            Revert
                                        </Button>
                                    )}
                                </div>
                                <p className="text-sm text-slate-400 mt-1 ml-4">
                                    {version.message || 'No message'}
                                </p>
                                <div className="flex items-center gap-1 mt-2 ml-4 text-xs text-slate-500">
                                    <Clock className="w-3 h-3" />
                                    {moment(version.created_date).fromNow()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            {/* New Branch Dialog */}
            <Dialog open={showNewBranch} onOpenChange={setShowNewBranch}>
                <DialogContent className="bg-slate-900 border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="text-slate-100 flex items-center gap-2">
                            <GitBranch className="w-5 h-5 text-emerald-400" />
                            Create Branch
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-slate-400">Branch from: {currentBranch}</label>
                        </div>
                        <Input
                            value={newBranchName}
                            onChange={(e) => setNewBranchName(e.target.value)}
                            placeholder="feature/new-transform"
                            className="bg-slate-800 border-slate-700 text-slate-100 font-mono"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowNewBranch(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateBranch} className="bg-emerald-600 hover:bg-emerald-700">
                            Create Branch
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Commit Dialog */}
            <Dialog open={showCommit} onOpenChange={setShowCommit}>
                <DialogContent className="bg-slate-900 border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="text-slate-100 flex items-center gap-2">
                            <GitCommit className="w-5 h-5 text-cyan-400" />
                            Commit Changes
                        </DialogTitle>
                    </DialogHeader>
                    <Input
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        placeholder="Describe your changes..."
                        className="bg-slate-800 border-slate-700 text-slate-100"
                    />
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowCommit(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCommit} className="bg-cyan-600 hover:bg-cyan-700">
                            Commit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Merge Dialog */}
            <Dialog open={showMerge} onOpenChange={setShowMerge}>
                <DialogContent className="bg-slate-900 border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="text-slate-100 flex items-center gap-2">
                            <GitMerge className="w-5 h-5 text-purple-400" />
                            Merge Branch
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center gap-2 py-4">
                        <Badge className="bg-slate-700 text-slate-300">{currentBranch}</Badge>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                        <Select value={mergeBranchName} onValueChange={setMergeBranchName}>
                            <SelectTrigger className="flex-1 bg-slate-800 border-slate-700 text-slate-100">
                                <SelectValue placeholder="Select target branch" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                {branches.filter(b => b.name !== currentBranch).map((branch) => (
                                    <SelectItem key={branch.id} value={branch.name} className="text-slate-100">
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowMerge(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleMerge} className="bg-purple-600 hover:bg-purple-700">
                            Merge
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}