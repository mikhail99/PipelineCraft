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
} from 'lucide-react';


interface Operation {
  name: string;
  icon: React.ElementType;
  description: string;
}

interface Category {
  category: string;
  icon: React.ElementType;
  items: Operation[];
}

const operations: Category[] = [
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

const OperationCard = ({ operation, onClick }: { operation: Operation; onClick: () => void }) => {
  const Icon = operation.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-3 rounded-lg text-left',
        'bg-slate-800/30 border border-slate-700/50',
        'hover:bg-slate-800/60 hover:border-slate-600/50',
        'transition-all duration-150'
      )}
    >
      <div className="shrink-0 w-8 h-8 rounded-md bg-cyan-500/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-cyan-400" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-200">{operation.name}</p>
        <p className="text-xs text-slate-500 mt-0.5">{operation.description}</p>
      </div>
    </button>
  );
};

const CategorySection = ({ category, onSelectOperation }: { category: Category; onSelectOperation: (op: Operation) => void }) => {
  const [expanded, setExpanded] = useState(true);
  const Icon = category.icon;

  return (
    <div className="mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-slate-400 hover:text-slate-300"
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function OperationsPanel({ theme: _theme }: { theme?: string }) {
  const { entities, folders, createEntity } = usePipeline();
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityDescription, setNewEntityDescription] = useState('');
  const [selectedInputs, setSelectedInputs] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [entityType, setEntityType] = useState('table');

  const handleSelectOperation = (operation: Operation) => {
    setSelectedOperation(operation);
    setNewEntityName('');
    setNewEntityDescription('');
    setSelectedInputs([]);
    setSelectedFolder('');
    setEntityType('table');
  };

  const handleCreate = () => {
    if (!newEntityName.trim() || !selectedOperation) return;

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

    createEntity({
      name: newEntityName.trim(),
      type: entityType,
      status: 'ok',
      folderId: selectedFolder === 'root' || !selectedFolder ? undefined : selectedFolder,
      dependencies: selectedInputs.filter(id => id !== 'none'),
      config: {
        description: newEntityDescription,
        operationName: selectedOperation.name,
        inputParams: {},
      },
      data: mockData,
    });

    setSelectedOperation(null);
  };

  return (
    <>
      <ScrollArea className="h-full">
        <div className="p-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Operations
          </h3>
          {operations.map((category) => (
            <CategorySection
              key={category.category}
              category={category}
              onSelectOperation={handleSelectOperation}
            />
          ))}
        </div>
      </ScrollArea>

      <Dialog open={!!selectedOperation} onOpenChange={() => setSelectedOperation(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-3">
              {selectedOperation && (
                <>
                  <div className="w-8 h-8 rounded-md bg-cyan-500/10 flex items-center justify-center">
                    {React.createElement(selectedOperation.icon, { className: 'w-4 h-4 text-cyan-400' })}
                  </div>
                  New {selectedOperation.name}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-slate-300">Entity Name</Label>
              <Input
                value={newEntityName}
                onChange={(e) => setNewEntityName(e.target.value)}
                placeholder="e.g., sales_filtered"
                className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100 font-mono"
              />
            </div>

            <div>
              <Label className="text-slate-300">Description</Label>
              <Textarea
                value={newEntityDescription}
                onChange={(e) => setNewEntityDescription(e.target.value)}
                placeholder="What does this entity do?"
                className="mt-1.5 bg-slate-800 border-slate-700 text-slate-300 min-h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Type</Label>
                <Select value={entityType} onValueChange={setEntityType}>
                  <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="table">Table</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Folder</Label>
                <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                  <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100">
                    <SelectValue placeholder="Root" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="root">Root</SelectItem>
                    {folders.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Input Entities</Label>
              <Select
                value={selectedInputs[0] || ''}
                onValueChange={(val) => setSelectedInputs(val ? [val] : [])}
              >
                <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700 text-slate-100">
                  <SelectValue placeholder="Select input entity" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="none">None</SelectItem>
                  {entities.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedInputs.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedInputs.map((id) => {
                    const entity = entities.find((e) => e.id === id);
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 rounded text-xs text-slate-300 font-mono"
                      >
                        {entity?.name || id}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedOperation(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              className="bg-cyan-600 hover:bg-cyan-700"
              disabled={!newEntityName.trim()}
            >
              Create & Compute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}