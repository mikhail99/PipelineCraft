import React, { useState, useRef, useEffect } from 'react';
import { usePipeline } from './PipelineContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const defaultAgents = [
  { id: 'general', name: 'General Assistant', description: 'General pipeline help' },
  { id: 'sql', name: 'SQL Expert', description: 'SQL queries and optimization' },
  { id: 'data', name: 'Data Engineer', description: 'Data transformations and ETL' },
];

export default function AICopilot() {
  const { entities, activeEntity } = usePipeline();
  const [selectedAgent, setSelectedAgent] = useState('general');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your AI Copilot. I can help you understand your data pipeline, suggest operations, or explain errors. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  const { data: customAgents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list(),
  });

  const allAgents = [...defaultAgents, ...customAgents.map(a => ({ id: a.id, name: a.name, description: a.description }))];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const agent = allAgents.find(a => a.id === selectedAgent);
      const context = `
        Current pipeline has ${entities.length} entities.
        ${activeEntity ? `Currently viewing entity: ${activeEntity.name} (${activeEntity.type}, status: ${activeEntity.status})` : 'No entity selected.'}
        Entities: ${entities.map(e => `${e.name} (${e.status})`).join(', ')}
        Selected agent: ${agent?.name} - ${agent?.description}
      `;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI assistant helping with a data pipeline IDE. You are acting as: ${agent?.name} (${agent?.description}). Be concise and helpful.
        
Context: ${context}

User question: ${userMessage}

Provide a helpful, concise response. If suggesting operations, be specific about which entities to use.`,
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "I encountered an error processing your request. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Agent Selection */}
      <div className="shrink-0 p-3 border-b border-slate-700/50">
        <Select value={selectedAgent} onValueChange={setSelectedAgent}>
          <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
            <SelectValue placeholder="Select agent" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            {allAgents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id} className="text-slate-100">
                <div className="flex flex-col">
                  <span>{agent.name}</span>
                  <span className="text-xs text-slate-400">{agent.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="shrink-0 w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-purple-400" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                  message.role === 'user'
                    ? 'bg-cyan-500/20 text-cyan-100'
                    : 'bg-slate-800/60 text-slate-300'
                )}
              >
                {message.content}
              </div>
              {message.role === 'user' && (
                <div className="shrink-0 w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-cyan-400" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="shrink-0 w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-purple-400" />
              </div>
              <div className="bg-slate-800/60 rounded-lg px-3 py-2">
                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="shrink-0 p-3 border-t border-slate-700/50">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your pipeline..."
            className="bg-slate-800 border-slate-700 text-slate-100 text-sm"
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="shrink-0 bg-purple-600 hover:bg-purple-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}