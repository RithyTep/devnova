import { useEffect, useState, useRef } from 'react';
import { BlockType } from '@/hooks/useBlocks';
import { cn } from '@/lib/utils';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  CheckSquare,
} from 'lucide-react';

interface SlashCommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: BlockType) => void;
  position: { top: number; left: number };
  searchQuery: string;
}

const COMMANDS: { type: BlockType; label: string; description: string; icon: React.ElementType; keywords: string[] }[] = [
  { type: 'paragraph', label: 'Text', description: 'Just start writing with plain text.', icon: Type, keywords: ['text', 'paragraph', 'plain'] },
  { type: 'heading1', label: 'Heading 1', description: 'Big section heading.', icon: Heading1, keywords: ['h1', 'heading', 'title', 'large'] },
  { type: 'heading2', label: 'Heading 2', description: 'Medium section heading.', icon: Heading2, keywords: ['h2', 'heading', 'subtitle'] },
  { type: 'heading3', label: 'Heading 3', description: 'Small section heading.', icon: Heading3, keywords: ['h3', 'heading', 'small'] },
  { type: 'bulleted_list', label: 'Bulleted List', description: 'Create a simple bulleted list.', icon: List, keywords: ['bullet', 'list', 'ul', 'unordered'] },
  { type: 'numbered_list', label: 'Numbered List', description: 'Create a list with numbering.', icon: ListOrdered, keywords: ['number', 'list', 'ol', 'ordered'] },
  { type: 'todo', label: 'To-do List', description: 'Track tasks with a to-do list.', icon: CheckSquare, keywords: ['todo', 'task', 'checkbox', 'check'] },
  { type: 'quote', label: 'Quote', description: 'Capture a quote or callout.', icon: Quote, keywords: ['quote', 'callout', 'blockquote'] },
  { type: 'code', label: 'Code', description: 'Capture a code snippet.', icon: Code, keywords: ['code', 'snippet', 'programming'] },
  { type: 'divider', label: 'Divider', description: 'Visually divide blocks.', icon: Minus, keywords: ['divider', 'line', 'separator', 'hr'] },
];

export function SlashCommandMenu({ isOpen, onClose, onSelect, position, searchQuery }: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const filteredCommands = COMMANDS.filter(cmd => {
    const query = searchQuery.toLowerCase();
    return cmd.label.toLowerCase().includes(query) || 
           cmd.keywords.some(k => k.includes(query));
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onSelect(filteredCommands[selectedIndex].type);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onSelect, onClose]);

  useEffect(() => {
    if (menuRef.current && selectedIndex >= 0) {
      const selectedEl = menuRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen || filteredCommands.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-72 max-h-80 overflow-y-auto bg-popover border border-border rounded-lg shadow-xl animate-fade-in"
      style={{ top: position.top, left: position.left }}
    >
      <div className="p-2 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Basic blocks</span>
      </div>
      <div className="py-1">
        {filteredCommands.map((cmd, index) => (
          <button
            key={cmd.type}
            onClick={() => onSelect(cmd.type)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
              index === selectedIndex
                ? 'bg-accent/10 text-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-md flex items-center justify-center border',
              index === selectedIndex ? 'bg-accent/10 border-accent/30' : 'bg-secondary border-border'
            )}>
              <cmd.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{cmd.label}</div>
              <div className="text-xs text-muted-foreground truncate">{cmd.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
