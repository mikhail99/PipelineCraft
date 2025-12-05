import React, { useState } from 'react';
import { usePipeline } from './PipelineContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    Merge,
    Filter,
    Calculator,
    FileText,
    Database,
    ArrowRightLeft,
    Sigma,
    SortAsc,
    Layers,
    Binary,
    Braces,
    Download,
    Upload,
    ChevronDown,
    ChevronRight,
    Workflow,
} from 'lucide-react';
import OperationChainBuilder, { operationDefinitions } from './OperationChainBuilder';

const operations = [
    {
        category: 'Data Transformation',
        icon: ArrowRightLeft,
        items: [
            { name: 'Join Tables', icon: Merge, description: 'Combine two tables on matching keys' },
            { name: 'Filter Rows', icon: Filter, description: 'Filter rows based on conditions' },
            { name: 'Sort Data', icon: SortAsc, description: 'Sort rows by one or more columns' },
            { name: 'Aggregate', icon: Sigma, description: 'Group and aggregate data' },
        ],
    },
    {
        category: 'Math & Logic',
        icon: Calculator,
        items: [
            { name: 'Calculate Column', icon: Calculator, description: 'Add computed column' },
            { name: 'Binary Operation', icon: Binary, description: 'Apply binary operations' },
            { name: 'Conditional Logic', icon: Braces, description: 'If-then-else transformations' },
        ],
    },
    {
        category: 'Text Processing',
        icon: FileText,
        items: [
            { name: 'Summarize Text', icon: FileText, description: 'Generate text summaries' },
            { name: 'Extract Entities', icon: Layers, description: 'Extract named entities' },
        ],
    },
    {
        category: 'I/O',
        icon: Database,
        items: [
            { name: 'Load CSV', icon: Download, description: 'Import data from CSV' },
            { name: 'Export Data', icon: Upload, description: 'Export to various formats' },
        ],
    },
];

const OperationCard = ({ operation, onClick, theme = 'dark' }) => {
    const Icon = operation.icon;
    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full flex items-start gap-3 p-3 rounded-lg text-left',
                'transition-all duration-150',
                theme === 'light'
                    ? 'bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    : 'bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600/50'
            )}
        >
            <div className={cn(
                "shrink-0 w-8 h-8 rounded-md flex items-center justify-center",
                theme === 'light' ? 'bg-blue-100' : 'bg-cyan-500/10'
            )}>
                <Icon className={cn(
                    "w-4 h-4",
                    theme === 'light' ? 'text-blue-600' : 'text-cyan-400'
                )} />
            </div>
            <div className="min-w-0">
                <p className={cn(
                    "text-sm font-medium",
                    theme === 'light' ? 'text-gray-800' : 'text-slate-200'
                )}>{operation.name}</p>
                <p className={cn(
                    "text-xs mt-0.5",
                    theme === 'light' ? 'text-gray-500' : 'text-slate-500'
                )}>{operation.description}</p>
            </div>
        </button>
    );
};

const CategorySection = ({ category, onSelectOperation, theme = 'dark' }) => {
    const [expanded, setExpanded] = useState(true);
    const Icon = category.icon;

    return (
        <div className="mb-4">
            <button
                onClick={() => setExpanded(!expanded)}
                className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium",
                    theme === 'light' ? 'text-gray-500 hover:text-gray-700' : 'text-slate-400 hover:text-slate-300'
                )}
            >
                {expanded ? (
                    <ChevronDown className="w-4 h-4" />
                ) : (
                    <ChevronRight className="w-4 h-4" />
                )}
                <Icon className="w-4 h-4" />
                <span>{category.category}</span>
            </button>
            {expanded && (
                <div className="space-y-2 mt-2 pl-2">
                    {category.items.map((op) => (
                        <OperationCard
                            key={op.name}
                            operation={op}
                            onClick={() => onSelectOperation(op)}
                            theme={theme}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function OperationsPanel({ theme = 'dark' }) {
    const { entities, folders, createEntity, addLog } = usePipeline();
    const [selectedOperation, setSelectedOperation] = useState(null);
    const [newEntityName, setNewEntityName] = useState('');
    const [newEntityDescription, setNewEntityDescription] = useState('');
    const [selectedInputs, setSelectedInputs] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState('');
    const [entityType, setEntityType] = useState('table');
    const [operationSteps, setOperationSteps] = useState([]);

    const handleSelectOperation = (operation) => {
        setSelectedOperation(operation);
        setNewEntityName('');
        setNewEntityDescription('');
        setSelectedInputs([]);
        setSelectedFolder('');
        setEntityType('table');
        // Initialize with the selected operation as first step
        setOperationSteps([{
            id: `step-${Date.now()}`,
            operation: operation.name,
            params: {}
        }]);
    };

    const handleCreate = () => {
        if (!newEntityName.trim() || operationSteps.length === 0) return;

        // Generate mock data based on type
        let mockData;
        if (entityType === 'table') {
            mockData = {
                headers: ['id', 'name', 'value', 'status'],
                rows: [
                    ['1', 'Item A', '100', 'active'],
                    ['2', 'Item B', '250', 'pending'],
                    ['3', 'Item C', '175', 'active'],
                    ['4', 'Item D', '320', 'inactive'],
                    ['5', 'Item E', '95', 'active'],
                ],
            };
        } else {
            mockData = `# ${newEntityName}\n\nGenerated document content.\n\n${newEntityDescription || 'No description provided.'}`;
        }

        // Collect all secondary inputs from steps
        const allDependencies = [...selectedInputs];
        operationSteps.forEach(step => {
            if (step.secondaryInput && !allDependencies.includes(step.secondaryInput)) {
                allDependencies.push(step.secondaryInput);
            }
        });

        // Build pipeline description
        const pipelineDescription = operationSteps.map(s => s.operation).join(' → ');

        createEntity({
            name: newEntityName.trim(),
            type: entityType,
            status: 'ok',
            folderId: selectedFolder || null,
            dependencies: allDependencies,
            config: {
                description: newEntityDescription,
                operationChain: operationSteps,
                pipelineDescription,
            },
            data: mockData,
        });

        setSelectedOperation(null);
    };

    return (
        <>
            <ScrollArea className="h-full">
                <div className="p-3">
                    <h3 className={cn(
                        "text-xs font-semibold uppercase tracking-wider mb-4",
                        theme === 'light' ? 'text-gray-500' : 'text-slate-400'
                    )}>
                        Operations
                    </h3>
                    {operations.map((category) => (
                        <CategorySection
                            key={category.category}
                            category={category}
                            onSelectOperation={handleSelectOperation}
                            theme={theme}
                        />
                    ))}
                </div>
            </ScrollArea>

            <Dialog open={!!selectedOperation} onOpenChange={() => setSelectedOperation(null)}>
                <DialogContent className={cn(
                    "max-w-2xl max-h-[90vh] overflow-y-auto",
                    theme === 'light' ? 'bg-white border-gray-200' : 'bg-slate-900 border-slate-700'
                )}>
                    <DialogHeader>
                        <DialogTitle className={cn(
                            "flex items-center gap-3",
                            theme === 'light' ? 'text-gray-900' : 'text-slate-100'
                        )}>
                            <div className={cn(
                                "w-8 h-8 rounded-md flex items-center justify-center",
                                theme === 'light' ? 'bg-blue-100' : 'bg-cyan-500/10'
                            )}>
                                <Workflow className={cn(
                                    "w-4 h-4",
                                    theme === 'light' ? 'text-blue-600' : 'text-cyan-400'
                                )} />
                            </div>
                            New Pipeline Entity
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5 py-4">
                        {/* Entity basics */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className={theme === 'light' ? 'text-gray-700' : 'text-slate-300'}>
                                    Entity Name
                                </Label>
                                <Input
                                    value={newEntityName}
                                    onChange={(e) => setNewEntityName(e.target.value)}
                                    placeholder="e.g., filtered_sales"
                                    className={cn(
                                        "mt-1.5 font-mono",
                                        theme === 'light' ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-slate-100'
                                    )}
                                />
                            </div>

                            <div>
                                <Label className={theme === 'light' ? 'text-gray-700' : 'text-slate-300'}>
                                    Input Entity
                                </Label>
                                <Select
                                    value={selectedInputs[0] || ''}
                                    onValueChange={(val) => setSelectedInputs(val ? [val] : [])}
                                >
                                    <SelectTrigger className={cn(
                                        "mt-1.5",
                                        theme === 'light' ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-slate-100'
                                    )}>
                                        <SelectValue placeholder="Select source..." />
                                    </SelectTrigger>
                                    <SelectContent className={theme === 'light' ? 'bg-white' : 'bg-slate-800 border-slate-700'}>
                                        {entities.map((e) => (
                                            <SelectItem key={e.id} value={e.id}>
                                                {e.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Operation chain builder */}
                        <div className={cn(
                            "rounded-lg border p-4",
                            theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-slate-800/30 border-slate-700'
                        )}>
                            <OperationChainBuilder
                                steps={operationSteps}
                                onStepsChange={setOperationSteps}
                                entities={entities}
                                theme={theme}
                            />
                        </div>

                        {/* Additional options */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className={theme === 'light' ? 'text-gray-700' : 'text-slate-300'}>
                                    Output Type
                                </Label>
                                <Select value={entityType} onValueChange={setEntityType}>
                                    <SelectTrigger className={cn(
                                        "mt-1.5",
                                        theme === 'light' ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-slate-100'
                                    )}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className={theme === 'light' ? 'bg-white' : 'bg-slate-800 border-slate-700'}>
                                        <SelectItem value="table">Table</SelectItem>
                                        <SelectItem value="document">Document</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className={theme === 'light' ? 'text-gray-700' : 'text-slate-300'}>
                                    Folder
                                </Label>
                                <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                                    <SelectTrigger className={cn(
                                        "mt-1.5",
                                        theme === 'light' ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-slate-100'
                                    )}>
                                        <SelectValue placeholder="Root" />
                                    </SelectTrigger>
                                    <SelectContent className={theme === 'light' ? 'bg-white' : 'bg-slate-800 border-slate-700'}>
                                        <SelectItem value={null}>Root</SelectItem>
                                        {folders.map((f) => (
                                            <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label className={theme === 'light' ? 'text-gray-700' : 'text-slate-300'}>
                                Description (optional)
                            </Label>
                            <Textarea
                                value={newEntityDescription}
                                onChange={(e) => setNewEntityDescription(e.target.value)}
                                placeholder="What does this pipeline produce?"
                                className={cn(
                                    "mt-1.5 min-h-16",
                                    theme === 'light' ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700 text-slate-300'
                                )}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setSelectedOperation(null)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            className={theme === 'light' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-cyan-600 hover:bg-cyan-700'}
                            disabled={!newEntityName.trim() || operationSteps.length === 0}
                        >
                            Create & Compute
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}