import { useState, useRef, useEffect } from 'react';
import { Page } from '@/hooks/usePages';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Network, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  page: Page;
  onUpdatePage: (id: string, updates: Partial<Pick<Page, 'title' | 'icon' | 'cover_image'>>) => Promise<{ data: Page | null; error: Error | null }>;
}

const STATUS_OPTIONS = [
  { label: 'In Progress', color: 'accent' },
  { label: 'Draft', color: 'muted' },
  { label: 'Complete', color: 'success' },
  { label: 'Archived', color: 'warning' },
];

export function PageHeader({ page, onUpdatePage }: PageHeaderProps) {
  const [title, setTitle] = useState(page.title);
  const [status, setStatus] = useState(STATUS_OPTIONS[0]);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    setTitle(page.title);
  }, [page.title]);

  const handleTitleBlur = () => {
    if (title !== page.title) {
      onUpdatePage(page.id, { title: title || 'Untitled' });
    }
  };

  const handleTitleInput = (e: React.FormEvent<HTMLHeadingElement>) => {
    setTitle(e.currentTarget.textContent || '');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      titleRef.current?.blur();
    }
  };

  return (
    <div className="mb-8 animate-fade-in">
      {/* Banner Image */}
      <div className="w-full h-32 bg-gradient-to-r from-secondary via-secondary to-accent/10 rounded-xl mb-8 border border-border/50 flex items-center justify-center overflow-hidden relative group">
        <div className="opacity-10 absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMxMTEiLz48cmVjdCB3aWR0aD0iMiIgaGVpZ2h0PSIyIiBmaWxsPSIjMjIyIi8+PC9zdmc+')]" />
        <Network className="w-10 h-10 text-muted-foreground/30 group-hover:scale-110 transition-transform duration-500" />
      </div>

      {/* Document Title */}
      <h1
        ref={titleRef}
        contentEditable
        suppressContentEditableWarning
        onBlur={handleTitleBlur}
        onInput={handleTitleInput}
        onKeyDown={handleKeyDown}
        className="text-4xl font-medium tracking-tight text-primary mb-6 focus:outline-none"
        data-placeholder="Untitled"
      >
        {page.title || 'Untitled'}
      </h1>

      {/* Meta Tags */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-border bg-secondary/50 text-xs text-muted-foreground">
          <User className="w-3 h-3" />
          <span>Author</span>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(
              'flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs cursor-pointer transition-colors',
              status.color === 'accent' && 'border-accent/20 bg-accent/10 text-accent',
              status.color === 'muted' && 'border-border bg-secondary/50 text-muted-foreground',
              status.color === 'success' && 'border-success/20 bg-success/10 text-success',
              status.color === 'warning' && 'border-warning/20 bg-warning/10 text-warning',
            )}>
              <span className={cn(
                'w-1.5 h-1.5 rounded-full',
                status.color === 'accent' && 'bg-accent',
                status.color === 'muted' && 'bg-muted-foreground',
                status.color === 'success' && 'bg-success',
                status.color === 'warning' && 'bg-warning',
              )} />
              <span>{status.label}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-40 p-1">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.label}
                onClick={() => setStatus(option)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-secondary transition-colors text-left',
                  status.label === option.label && 'bg-secondary'
                )}
              >
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  option.color === 'accent' && 'bg-accent',
                  option.color === 'muted' && 'bg-muted-foreground',
                  option.color === 'success' && 'bg-success',
                  option.color === 'warning' && 'bg-warning',
                )} />
                {option.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
