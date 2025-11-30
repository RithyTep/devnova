import { useRef, useEffect, KeyboardEvent } from 'react';
import { Block, BlockType, useBlocks } from '@/hooks/useBlocks';
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
  GripVertical,
  Plus,
  Trash2,
  Copy,
  Info,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BlockEditorProps {
  pageId: string;
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ElementType }[] = [
  { type: 'paragraph', label: 'Text', icon: Type },
  { type: 'heading1', label: 'Heading 1', icon: Heading1 },
  { type: 'heading2', label: 'Heading 2', icon: Heading2 },
  { type: 'heading3', label: 'Heading 3', icon: Heading3 },
  { type: 'bulleted_list', label: 'Bulleted List', icon: List },
  { type: 'numbered_list', label: 'Numbered List', icon: ListOrdered },
  { type: 'quote', label: 'Quote', icon: Quote },
  { type: 'code', label: 'Code', icon: Code },
  { type: 'divider', label: 'Divider', icon: Minus },
  { type: 'todo', label: 'To-do', icon: CheckSquare },
];

export function BlockEditor({ pageId }: BlockEditorProps) {
  const { blocks, loading, createBlock, updateBlock, deleteBlock, insertBlockAfter } = useBlocks(pageId);

  const handleAddBlock = async (type: BlockType = 'paragraph', afterId?: string) => {
    if (afterId) {
      await insertBlockAfter(afterId, type);
    } else {
      await createBlock(type);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading blocks...
      </div>
    );
  }

  return (
    <div className="block-editor space-y-4 text-secondary-foreground leading-relaxed font-light">
      {blocks.length === 0 ? (
        <div className="text-muted-foreground">
          <button
            onClick={() => handleAddBlock('paragraph')}
            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-secondary transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add a block</span>
          </button>
        </div>
      ) : (
        blocks.map((block, index) => (
          <BlockItem
            key={block.id}
            block={block}
            onUpdate={updateBlock}
            onDelete={deleteBlock}
            onAddBlockAfter={(type) => handleAddBlock(type, block.id)}
            isFirst={index === 0}
          />
        ))
      )}

      {blocks.length > 0 && (
        <p className="text-muted-foreground italic mt-8">
          Start typing or type '/' for commands...
        </p>
      )}
    </div>
  );
}

interface BlockItemProps {
  block: Block;
  onUpdate: (id: string, updates: Partial<Pick<Block, 'type' | 'content' | 'checked'>>) => Promise<{ data: Block | null; error: Error | null }>;
  onDelete: (id: string) => Promise<{ error: Error | null }>;
  onAddBlockAfter: (type: BlockType) => void;
  isFirst: boolean;
}

function BlockItem({ block, onUpdate, onDelete, onAddBlockAfter, isFirst }: BlockItemProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && contentRef.current.textContent !== block.content) {
      contentRef.current.textContent = block.content;
    }
  }, [block.content]);

  const handleContentChange = () => {
    if (contentRef.current) {
      const newContent = contentRef.current.textContent || '';
      if (newContent !== block.content) {
        onUpdate(block.id, { content: newContent });
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onAddBlockAfter('paragraph');
    }

    if (e.key === 'Backspace' && contentRef.current?.textContent === '' && !isFirst) {
      e.preventDefault();
      onDelete(block.id);
    }
  };

  const handleTypeChange = (newType: BlockType) => {
    onUpdate(block.id, { type: newType });
  };

  const handleCheckToggle = () => {
    onUpdate(block.id, { checked: !block.checked });
  };

  // Divider block
  if (block.type === 'divider') {
    return (
      <div className="group flex items-center gap-2 py-2">
        <BlockActions
          onTypeChange={handleTypeChange}
          onDelete={() => onDelete(block.id)}
          onAddBlockAfter={onAddBlockAfter}
        />
        <hr className="flex-1 border-border" />
      </div>
    );
  }

  // Code block with special styling
  if (block.type === 'code') {
    return (
      <div className="group">
        <BlockActions
          onTypeChange={handleTypeChange}
          onDelete={() => onDelete(block.id)}
          onAddBlockAfter={onAddBlockAfter}
        />
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/20 to-purple-500/20 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500" />
          <div className="code-block relative">
            <div className="code-block-header">
              <span className="text-xs text-muted-foreground font-mono">code</span>
              <div className="flex gap-2">
                <span className="text-xs text-muted-foreground">Typescript</span>
                <Copy className="w-3.5 h-3.5 text-muted-foreground cursor-pointer hover:text-foreground" />
              </div>
            </div>
            <pre className="p-4 overflow-x-auto">
              <code
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                onBlur={handleContentChange}
                onKeyDown={handleKeyDown}
                className="text-sm font-mono text-secondary-foreground outline-none block min-h-[24px]"
              />
            </pre>
          </div>
        </div>
      </div>
    );
  }

  // Quote block with callout styling
  if (block.type === 'quote') {
    return (
      <div className="group">
        <BlockActions
          onTypeChange={handleTypeChange}
          onDelete={() => onDelete(block.id)}
          onAddBlockAfter={onAddBlockAfter}
        />
        <div className="callout-block callout-info">
          <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleContentChange}
            onKeyDown={handleKeyDown}
            className="text-sm text-accent/80 leading-relaxed outline-none flex-1 min-h-[24px]"
            data-placeholder="Quote or callout..."
          />
        </div>
      </div>
    );
  }

  // Todo block with custom checkbox
  if (block.type === 'todo') {
    return (
      <div className="group flex items-start gap-3">
        <BlockActions
          onTypeChange={handleTypeChange}
          onDelete={() => onDelete(block.id)}
          onAddBlockAfter={onAddBlockAfter}
        />
        <div className="relative flex items-center pt-1">
          <input
            type="checkbox"
            checked={block.checked || false}
            onChange={handleCheckToggle}
            className="custom-checkbox appearance-none w-4 h-4 border border-muted-foreground/50 rounded bg-transparent focus:ring-0 focus:ring-offset-0 cursor-pointer transition-all hover:border-muted-foreground"
          />
        </div>
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={handleContentChange}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex-1 outline-none min-h-[28px] transition-colors',
            block.checked ? 'text-muted-foreground line-through decoration-muted-foreground/50' : 'text-secondary-foreground group-hover:text-primary'
          )}
          data-placeholder="To-do item..."
        />
      </div>
    );
  }

  // Default block types (paragraph, headings, lists)
  return (
    <div className="group flex items-start gap-2">
      <BlockActions
        onTypeChange={handleTypeChange}
        onDelete={() => onDelete(block.id)}
        onAddBlockAfter={onAddBlockAfter}
      />

      <div className="flex-1 flex items-start gap-2">
        {/* Block type indicator */}
        {block.type === 'bulleted_list' && (
          <span className="mt-[10px] w-1.5 h-1.5 rounded-full bg-muted-foreground/50 flex-shrink-0" />
        )}
        {block.type === 'numbered_list' && (
          <span className="mt-[3px] text-sm text-muted-foreground flex-shrink-0">1.</span>
        )}

        {/* Content */}
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={handleContentChange}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex-1 outline-none py-1 rounded transition-colors min-h-[28px]',
            'focus:outline-none',
            block.type === 'heading1' && 'text-3xl font-medium text-primary tracking-tight',
            block.type === 'heading2' && 'text-2xl font-medium text-primary',
            block.type === 'heading3' && 'text-xl font-medium text-primary',
            block.type === 'paragraph' && 'text-secondary-foreground',
            (block.type === 'bulleted_list' || block.type === 'numbered_list') && 'text-secondary-foreground'
          )}
          data-placeholder={getPlaceholder(block.type)}
        />
      </div>
    </div>
  );
}

interface BlockActionsProps {
  onTypeChange: (type: BlockType) => void;
  onDelete: () => void;
  onAddBlockAfter: (type: BlockType) => void;
}

function BlockActions({ onTypeChange, onDelete, onAddBlockAfter }: BlockActionsProps) {
  return (
    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
            <DropdownMenuItem key={type} onClick={() => onAddBlockAfter(type)}>
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors cursor-grab">
            <GripVertical className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase">
            Turn into
          </div>
          {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
            <DropdownMenuItem key={type} onClick={() => onTypeChange(type)}>
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </DropdownMenuItem>
          ))}
          <div className="my-1 border-t border-border" />
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function getPlaceholder(type: BlockType): string {
  switch (type) {
    case 'heading1':
      return 'Heading 1';
    case 'heading2':
      return 'Heading 2';
    case 'heading3':
      return 'Heading 3';
    case 'quote':
      return 'Quote';
    case 'code':
      return 'Code';
    case 'todo':
      return 'To-do';
    default:
      return "Type '/' for commands...";
  }
}
