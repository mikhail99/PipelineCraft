import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    ArrowRightLeft,
    Sigma,
    SortAsc,
    Layers,
    Binary,
    Braces,
    Download,
    Upload,
    Plus,
    Trash2,
    GripVertical,
    ChevronRight,
    ArrowDown,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// Operation definitions with their parameters
export const operationDefinitions = {
    'Join Tables': {
        icon: Merge,
        params: [
            { name: 'joinKey', label: 'Join Key', type: 'text', placeholder: 'e.g., id' },
            { name: 'joinType', label: 'Join Type', type: 'select', options: ['inner', 'left', 'right', 'outer'] }
        ],
        requiresSecondInput: true
    },
    'Filter Rows': {
        icon: Filter,
        params: [
            { name: 'condition', label: 'Condition', type: 'text', placeholder: 'e.g., x > 10' }
        ]
    },
    'Sort Data': {
        icon: SortAsc,
        params: [
            { name: 'column', label: 'Sort Column', type: 'text', placeholder: 'e.g., name' },
            { name: 'order', label: 'Order', type: 'select', options: ['ascending', 'descending'] }
        ]
    },
    'Aggregate': {
        icon: Sigma,
        params: [
            { name: 'groupBy', label: 'Group By', type: 'text', placeholder: 'e.g., category' },
            { name: 'aggregation', label: 'Aggregation', type: 'select', options: ['sum', 'avg', 'count', 'min', 'max'] }
        ]
    },
    'Calculate Column': {
        icon: Calculator,
        params: [
            { name: 'columnName', label: 'New Column', type: 'text', placeholder: 'e.g., total' },
            { name: 'formula', label: 'Formula', type: 'text', placeholder: 'e.g., price * quantity' }
        ]
    },
    'Binary Operation': {
        icon: Binary,
        params: [
            { name: 'operation', label: 'Operation', type: 'select', options: ['add', 'subtract', 'multiply', 'divide'] }
        ],
        requiresSecondInput: true
    },
    'Conditional Logic': {
        icon: Braces,
        params: [
            { name: 'condition', label: 'If', type: 'text', placeholder: 'e.g., status == "active"' },
            { name: 'thenValue', label: 'Then', type: 'text', placeholder: 'value if true' },
            { name: 'elseValue', label: 'Else', type: 'text', placeholder: 'value if false' }
        ]
    },
    'Summarize Text': {
        icon: FileText,
        params: [
            { name: 'maxLength', label: 'Max Length', type: 'text', placeholder: 'e.g., 100' }
        ]
    },
    'Extract Entities': {
        icon: Layers,
        params: [
            { name: 'entityTypes', label: 'Entity Types', type: 'text', placeholder: 'e.g., person, org' }
        ]
    },
    'Load CSV': {
        icon: Download,
        params: [
            { name: 'filePath', label: 'File Path', type: 'text', placeholder: 'path/to/file.csv' }
        ]
    },
    'Export Data': {
        icon: Upload,
        params: [
            { name: 'format', label: 'Format', type: 'select', options: ['csv', 'json', 'parquet'] }
        ]
    },
};

const allOperations = Object.keys(operationDefinitions);

const OperationStep = ({
    step,
    index,
    isFirst,
    isLast,
    entities,
    onUpdate,
    onRemove,
    canRemove,
    theme = 'dark'
}) => {
    const opDef = operationDefinitions[step.operation];
    const Icon = opDef?.icon || ArrowRightLeft;

    return (
        <Draggable draggableId={step.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={cn(
                        "relative",
                        snapshot.isDragging && "z-50"
                    )}
                >
                    {/* Connection line to previous step */}
                    {!isFirst && (
                        <div className="flex justify-center -mt-1 mb-1">
                            <div className={cn(
                                "w-px h-4",
                                theme === 'light' ? 'bg-gray-300' : 'bg-slate-600'
                            )} />
                        </div>
                    )}

                    <div className={cn(
                        "rounded-lg border p-3 transition-all",
                        snapshot.isDragging
                            ? theme === 'light' ? 'bg-white shadow-lg border-blue-400' : 'bg-slate-800 shadow-lg border-cyan-400'
                            : theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-slate-800/50 border-slate-700',
                    )}>
                        {/* Step header */}
                        <div className="flex items-center gap-2 mb-3">
                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                <GripVertical className={cn(
                                    "w-4 h-4",
                                    theme === 'light' ? 'text-gray-400' : 'text-slate-500'
                                )} />
                            </div>

                            <div className={cn(
                                "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
                                theme === 'light' ? 'bg-blue-100 text-blue-700' : 'bg-cyan-500/20 text-cyan-400'
                            )}>
                                {index + 1}
                            </div>

                            <Select
                                value={step.operation}
                                onValueChange={(val) => onUpdate({ ...step, operation: val, params: {} })}
                            >
                                <SelectTrigger className={cn(
                                    "flex-1 h-8 text-sm",
                                    theme === 'light' ? 'bg-white border-gray-200' : 'bg-slate-900 border-slate-600'
                                )}>
                                    <div className="flex items-center gap-2">
                                        <Icon className="w-3.5 h-3.5 text-cyan-400" />
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className={theme === 'light' ? 'bg-white' : 'bg-slate-800 border-slate-700'}>
                                    {allOperations.map(op => {
                                        const OpIcon = operationDefinitions[op].icon;
                                        return (
                                            <SelectItem key={op} value={op}>
                                                <div className="flex items-center gap-2">
                                                    <OpIcon className="w-3.5 h-3.5" />
                                                    {op}
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>

                            {canRemove && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                    onClick={onRemove}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            )}
                        </div>

                        {/* Operation parameters */}
                        {opDef?.params && opDef.params.length > 0 && (
                            <div className="space-y-2 ml-8">
                                {opDef.params.map(param => (
                                    <div key={param.name} className="flex items-center gap-2">
                                        <Label className={cn(
                                            "text-xs w-20 shrink-0",
                                            theme === 'light' ? 'text-gray-500' : 'text-slate-400'
                                        )}>
                                            {param.label}
                                        </Label>
                                        {param.type === 'select' ? (
                                            <Select
                                                value={step.params?.[param.name] || ''}
                                                onValueChange={(val) => onUpdate({
                                                    ...step,
                                                    params: { ...step.params, [param.name]: val }
                                                })}
                                            >
                                                <SelectTrigger className={cn(
                                                    "h-7 text-xs flex-1",
                                                    theme === 'light' ? 'bg-white border-gray-200' : 'bg-slate-900 border-slate-600'
                                                )}>
                                                    <SelectValue placeholder="Select..." />
                                                </SelectTrigger>
                                                <SelectContent className={theme === 'light' ? 'bg-white' : 'bg-slate-800 border-slate-700'}>
                                                    {param.options.map(opt => (
                                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Input
                                                value={step.params?.[param.name] || ''}
                                                onChange={(e) => onUpdate({
                                                    ...step,
                                                    params: { ...step.params, [param.name]: e.target.value }
                                                })}
                                                placeholder={param.placeholder}
                                                className={cn(
                                                    "h-7 text-xs flex-1 font-mono",
                                                    theme === 'light' ? 'bg-white border-gray-200' : 'bg-slate-900 border-slate-600'
                                                )}
                                            />
                                        )}
                                    </div>
                                ))}

                                {/* Secondary input for operations that need it */}
                                {opDef.requiresSecondInput && (
                                    <div className="flex items-center gap-2">
                                        <Label className={cn(
                                            "text-xs w-20 shrink-0",
                                            theme === 'light' ? 'text-gray-500' : 'text-slate-400'
                                        )}>
                                            With
                                        </Label>
                                        <Select
                                            value={step.secondaryInput || ''}
                                            onValueChange={(val) => onUpdate({ ...step, secondaryInput: val })}
                                        >
                                            <SelectTrigger className={cn(
                                                "h-7 text-xs flex-1",
                                                theme === 'light' ? 'bg-white border-gray-200' : 'bg-slate-900 border-slate-600'
                                            )}>
                                                <SelectValue placeholder="Select entity..." />
                                            </SelectTrigger>
                                            <SelectContent className={theme === 'light' ? 'bg-white' : 'bg-slate-800 border-slate-700'}>
                                                {entities.map(e => (
                                                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Arrow to next step */}
                    {!isLast && (
                        <div className="flex justify-center mt-1 -mb-1">
                            <ArrowDown className={cn(
                                "w-4 h-4",
                                theme === 'light' ? 'text-gray-400' : 'text-slate-500'
                            )} />
                        </div>
                    )}
                </div>
            )}
        </Draggable>
    );
};

export default function OperationChainBuilder({
    steps,
    onStepsChange,
    entities,
    theme = 'dark'
}) {
    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const reordered = Array.from(steps);
        const [removed] = reordered.splice(result.source.index, 1);
        reordered.splice(result.destination.index, 0, removed);
        onStepsChange(reordered);
    };

    const addStep = () => {
        onStepsChange([
            ...steps,
            {
                id: `step-${Date.now()}`,
                operation: 'Filter Rows',
                params: {}
            }
        ]);
    };

    const updateStep = (index, updatedStep) => {
        const newSteps = [...steps];
        newSteps[index] = updatedStep;
        onStepsChange(newSteps);
    };

    const removeStep = (index) => {
        onStepsChange(steps.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
                <Label className={cn(
                    "text-sm font-medium",
                    theme === 'light' ? 'text-gray-700' : 'text-slate-300'
                )}>
                    Operation Pipeline
                </Label>
                <span className={cn(
                    "text-xs",
                    theme === 'light' ? 'text-gray-500' : 'text-slate-500'
                )}>
                    {steps.length} step{steps.length !== 1 ? 's' : ''}
                </span>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="operation-steps">
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="space-y-1"
                        >
                            {steps.map((step, index) => (
                                <OperationStep
                                    key={step.id}
                                    step={step}
                                    index={index}
                                    isFirst={index === 0}
                                    isLast={index === steps.length - 1}
                                    entities={entities}
                                    onUpdate={(updated) => updateStep(index, updated)}
                                    onRemove={() => removeStep(index)}
                                    canRemove={steps.length > 1}
                                    theme={theme}
                                />
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            <Button
                variant="outline"
                size="sm"
                onClick={addStep}
                className={cn(
                    "w-full mt-3 gap-2",
                    theme === 'light'
                        ? 'border-dashed border-gray-300 text-gray-600 hover:bg-gray-50'
                        : 'border-dashed border-slate-600 text-slate-400 hover:bg-slate-800'
                )}
            >
                <Plus className="w-4 h-4" />
                Add Step
            </Button>

            {/* Visual preview of the chain */}
            {steps.length > 1 && (
                <div className={cn(
                    "mt-4 p-3 rounded-lg text-xs font-mono",
                    theme === 'light' ? 'bg-blue-50 text-blue-800' : 'bg-slate-800/30 text-cyan-400'
                )}>
                    <span className="opacity-60">Pipeline: </span>
                    {steps.map((step, i) => (
                        <span key={step.id}>
                            {step.operation}
                            {i < steps.length - 1 && (
                                <ChevronRight className="inline w-3 h-3 mx-1 opacity-50" />
                            )}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}