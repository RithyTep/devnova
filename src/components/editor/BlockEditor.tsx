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
    <div className="block-editor py-4">
      {blocks.length === 0 ? (
        <div className="text-muted-foreground py-4">
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
        <div className="mt-4">
          <button
            onClick={() => handleAddBlock('paragraph')}
            className="flex items-center gap-2 px-2 py-1 text-muted-foreground rounded hover:bg-secondary transition-colors opacity-0 hover:opacity-100"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Add a block</span>
          </button>
        </div>
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
          <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-foreground flex-shrink-0" />
        )}
        {block.type === 'numbered_list' && (
          <span className="mt-[3px] text-sm text-muted-foreground flex-shrink-0">1.</span>
        )}
        {block.type === 'todo' && (
          <button
            onClick={handleCheckToggle}
            className={cn(
              'mt-[3px] w-4 h-4 border rounded flex-shrink-0 transition-colors',
              block.checked ? 'bg-accent border-accent' : 'border-border hover:border-muted-foreground'
            )}
          >
            {block.checked && (
              <svg className="w-full h-full text-accent-foreground" viewBox="0 0 16 16" fill="currentColor">
                <path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z" />
              </svg>
            )}
          </button>
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
            'focus:bg-secondary/30 hover:bg-secondary/20',
            block.type === 'heading1' && 'text-3xl font-bold',
            block.type === 'heading2' && 'text-2xl font-semibold',
            block.type === 'heading3' && 'text-xl font-semibold',
            block.type === 'quote' && 'border-l-4 border-border pl-4 italic text-muted-foreground',
            block.type === 'code' && 'font-mono text-sm bg-muted px-3 py-2 rounded-md',
            block.type === 'todo' && block.checked && 'line-through text-muted-foreground'
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
