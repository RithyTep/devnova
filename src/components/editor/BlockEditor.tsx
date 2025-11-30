import { useRef, useEffect, useState, KeyboardEvent, useCallback } from 'react';
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
import { SlashCommandMenu } from './SlashCommandMenu';

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
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);

  const handleAddBlock = async (type: BlockType = 'paragraph', afterId?: string) => {
    let result;
    if (afterId) {
      result = await insertBlockAfter(afterId, type);
    } else {
      result = await createBlock(type);
    }
    if (result?.data) {
      setFocusBlockId(result.data.id);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <div className="inline-flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="block-editor space-y-1 text-secondary-foreground leading-relaxed">
      {blocks.length === 0 ? (
        <div className="text-muted-foreground py-2">
          <button
            onClick={() => handleAddBlock('paragraph')}
            className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-secondary/50 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Click to add a block, or press Enter</span>
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
            onChangeType={(type) => updateBlock(block.id, { type, content: '' })}
            isFirst={index === 0}
            shouldFocus={focusBlockId === block.id}
            onFocused={() => setFocusBlockId(null)}
            blockIndex={index}
          />
        ))
      )}

      {blocks.length > 0 && (
        <div 
          className="py-6 cursor-text text-muted-foreground/50 text-sm hover:text-muted-foreground transition-colors"
          onClick={() => handleAddBlock('paragraph', blocks[blocks.length - 1]?.id)}
        >
          Type '/' for commands...
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
  onChangeType: (type: BlockType) => void;
  isFirst: boolean;
  shouldFocus: boolean;
  onFocused: () => void;
  blockIndex: number;
}

function BlockItem({ block, onUpdate, onDelete, onAddBlockAfter, onChangeType, isFirst, shouldFocus, onFocused, blockIndex }: BlockItemProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashQuery, setSlashQuery] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (contentRef.current && contentRef.current.textContent !== block.content) {
      contentRef.current.textContent = block.content;
    }
  }, [block.content]);

  useEffect(() => {
    if (shouldFocus && contentRef.current) {
      contentRef.current.focus();
      // Place cursor at end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(contentRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
      onFocused();
    }
  }, [shouldFocus, onFocused]);

  const handleContentChange = useCallback(() => {
    if (contentRef.current) {
      const newContent = contentRef.current.textContent || '';
      if (newContent !== block.content) {
        onUpdate(block.id, { content: newContent });
      }
    }
  }, [block.id, block.content, onUpdate]);

  const handleInput = () => {
    const content = contentRef.current?.textContent || '';
    
    // Check for slash command
    if (content === '/') {
      const rect = contentRef.current?.getBoundingClientRect();
      if (rect) {
        setSlashMenuPosition({
          top: rect.bottom + 4,
          left: rect.left,
        });
        setShowSlashMenu(true);
        setSlashQuery('');
      }
    } else if (content.startsWith('/') && showSlashMenu) {
      setSlashQuery(content.slice(1));
    } else if (!content.startsWith('/') && showSlashMenu) {
      setShowSlashMenu(false);
      setSlashQuery('');
    }
  };

  const handleSlashSelect = (type: BlockType) => {
    setShowSlashMenu(false);
    setSlashQuery('');
    if (contentRef.current) {
      contentRef.current.textContent = '';
    }
    onChangeType(type);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Don't process if slash menu is open (it handles its own keys)
    if (showSlashMenu && ['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) {
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleContentChange();
      onAddBlockAfter('paragraph');
    }

    if (e.key === 'Backspace') {
      const content = contentRef.current?.textContent || '';
      if (content === '' && !isFirst) {
        e.preventDefault();
        onDelete(block.id);
      }
    }

    // Close slash menu on escape
    if (e.key === 'Escape' && showSlashMenu) {
      setShowSlashMenu(false);
      setSlashQuery('');
    }

    // Markdown shortcuts
    if (e.key === ' ') {
      const content = contentRef.current?.textContent || '';
      const shortcuts: { [key: string]: BlockType } = {
        '#': 'heading1',
        '##': 'heading2',
        '###': 'heading3',
        '-': 'bulleted_list',
        '*': 'bulleted_list',
        '1.': 'numbered_list',
        '[]': 'todo',
        '>': 'quote',
        '```': 'code',
        '---': 'divider',
      };

      if (shortcuts[content]) {
        e.preventDefault();
        if (contentRef.current) {
          contentRef.current.textContent = '';
        }
        onChangeType(shortcuts[content]);
      }
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
      <div 
        className="group flex items-center gap-2 py-3 relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <BlockActions
          isVisible={isHovered}
          onTypeChange={handleTypeChange}
          onDelete={() => onDelete(block.id)}
          onAddBlockAfter={onAddBlockAfter}
        />
        <hr className="flex-1 border-border/50" />
      </div>
    );
  }

  // Code block with special styling
  if (block.type === 'code') {
    return (
      <div 
        className="group relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <BlockActions
          isVisible={isHovered}
          onTypeChange={handleTypeChange}
          onDelete={() => onDelete(block.id)}
          onAddBlockAfter={onAddBlockAfter}
        />
        <div className="relative ml-7">
          <div className="code-block">
            <div className="code-block-header">
              <span className="text-xs text-muted-foreground font-mono">code</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Plain text</span>
                <button className="p-1 hover:bg-secondary rounded transition-colors">
                  <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            </div>
            <pre className="p-4 overflow-x-auto">
              <code
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                onBlur={handleContentChange}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                className="text-sm font-mono text-secondary-foreground outline-none block min-h-[24px] empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50"
                data-placeholder="Write some code..."
              />
            </pre>
          </div>
        </div>
        <SlashCommandMenu
          isOpen={showSlashMenu}
          onClose={() => setShowSlashMenu(false)}
          onSelect={handleSlashSelect}
          position={slashMenuPosition}
          searchQuery={slashQuery}
        />
      </div>
    );
  }

  // Quote block with callout styling
  if (block.type === 'quote') {
    return (
      <div 
        className="group relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <BlockActions
          isVisible={isHovered}
          onTypeChange={handleTypeChange}
          onDelete={() => onDelete(block.id)}
          onAddBlockAfter={onAddBlockAfter}
        />
        <div className="callout-block callout-info ml-7">
          <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleContentChange}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            className="text-sm text-accent/80 leading-relaxed outline-none flex-1 min-h-[24px] empty:before:content-[attr(data-placeholder)] empty:before:text-accent/30"
            data-placeholder="Type a quote..."
          />
        </div>
        <SlashCommandMenu
          isOpen={showSlashMenu}
          onClose={() => setShowSlashMenu(false)}
          onSelect={handleSlashSelect}
          position={slashMenuPosition}
          searchQuery={slashQuery}
        />
      </div>
    );
  }

  // Todo block with custom checkbox
  if (block.type === 'todo') {
    return (
      <div 
        className="group flex items-start gap-2 relative py-0.5"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <BlockActions
          isVisible={isHovered}
          onTypeChange={handleTypeChange}
          onDelete={() => onDelete(block.id)}
          onAddBlockAfter={onAddBlockAfter}
        />
        <div className="flex items-start gap-2 flex-1 ml-1">
          <div className="relative flex items-center pt-1">
            <input
              type="checkbox"
              checked={block.checked || false}
              onChange={handleCheckToggle}
              className="custom-checkbox appearance-none w-4 h-4 border border-muted-foreground/40 rounded bg-transparent focus:ring-0 focus:ring-offset-0 cursor-pointer transition-all hover:border-accent"
            />
          </div>
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleContentChange}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            className={cn(
              'flex-1 outline-none min-h-[26px] py-0.5 transition-colors empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40',
              block.checked 
                ? 'text-muted-foreground line-through decoration-muted-foreground/50' 
                : 'text-secondary-foreground'
            )}
            data-placeholder="To-do"
          />
        </div>
        <SlashCommandMenu
          isOpen={showSlashMenu}
          onClose={() => setShowSlashMenu(false)}
          onSelect={handleSlashSelect}
          position={slashMenuPosition}
          searchQuery={slashQuery}
        />
      </div>
    );
  }

  // Default block types (paragraph, headings, lists)
  return (
    <div 
      className="group flex items-start gap-2 relative py-0.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <BlockActions
        isVisible={isHovered}
        onTypeChange={handleTypeChange}
        onDelete={() => onDelete(block.id)}
        onAddBlockAfter={onAddBlockAfter}
      />

      <div className="flex-1 flex items-start gap-2 ml-1">
        {/* Block type indicator */}
        {block.type === 'bulleted_list' && (
          <span className="mt-[11px] w-1.5 h-1.5 rounded-full bg-muted-foreground/60 flex-shrink-0" />
        )}
        {block.type === 'numbered_list' && (
          <span className="mt-[5px] text-sm text-muted-foreground flex-shrink-0 w-5">{blockIndex + 1}.</span>
        )}

        {/* Content */}
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={handleContentChange}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex-1 outline-none py-0.5 rounded transition-colors min-h-[26px]',
            'focus:outline-none',
            'empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40',
            block.type === 'heading1' && 'text-3xl font-semibold text-foreground tracking-tight py-1',
            block.type === 'heading2' && 'text-2xl font-semibold text-foreground py-0.5',
            block.type === 'heading3' && 'text-xl font-medium text-foreground',
            block.type === 'paragraph' && 'text-secondary-foreground',
            (block.type === 'bulleted_list' || block.type === 'numbered_list') && 'text-secondary-foreground'
          )}
          data-placeholder={getPlaceholder(block.type)}
        />
      </div>

      <SlashCommandMenu
        isOpen={showSlashMenu}
        onClose={() => setShowSlashMenu(false)}
        onSelect={handleSlashSelect}
        position={slashMenuPosition}
        searchQuery={slashQuery}
      />
    </div>
  );
}

interface BlockActionsProps {
  isVisible: boolean;
  onTypeChange: (type: BlockType) => void;
  onDelete: () => void;
  onAddBlockAfter: (type: BlockType) => void;
}

function BlockActions({ isVisible, onTypeChange, onDelete, onAddBlockAfter }: BlockActionsProps) {
  return (
    <div className={cn(
      "absolute -left-16 top-0.5 flex items-center gap-0.5 transition-opacity duration-150",
      isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
    )}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Add block
          </div>
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
          <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Turn into
          </div>
          {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
            <DropdownMenuItem key={type} onClick={() => onTypeChange(type)}>
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </DropdownMenuItem>
          ))}
          <div className="my-1 border-t border-border" />
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
    case 'bulleted_list':
    case 'numbered_list':
      return 'List item';
    default:
      return "Type '/' for commands...";
  }
}
