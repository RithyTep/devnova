import { useState, useRef, useEffect } from 'react';
import { Page } from '@/hooks/usePages';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile, ImageIcon, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  page: Page;
  onUpdatePage: (id: string, updates: Partial<Pick<Page, 'title' | 'icon' | 'cover_image'>>) => Promise<{ data: Page | null; error: Error | null }>;
}

const EMOJI_OPTIONS = ['📄', '📝', '📌', '📚', '💡', '🎯', '🚀', '✨', '🔥', '💪', '🎨', '🎵', '📊', '📈', '🗂️', '📁'];

export function PageHeader({ page, onUpdatePage }: PageHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(page.title);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(page.title);
  }, [page.title]);

  useEffect(() => {
    if (isEditingTitle && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleSave = () => {
    setIsEditingTitle(false);
    if (title !== page.title) {
      onUpdatePage(page.id, { title: title || 'Untitled' });
    }
  };

  const handleIconChange = (emoji: string) => {
    onUpdatePage(page.id, { icon: emoji });
  };

  return (
    <div className="mb-8 animate-fade-in">
      {/* Cover Image Placeholder */}
      {page.cover_image ? (
        <div className="w-full h-48 bg-muted rounded-lg mb-6 overflow-hidden">
          <img
            src={page.cover_image}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="group relative -mx-12 mb-6">
          <button className="w-full h-12 flex items-center justify-center gap-2 text-muted-foreground/50 hover:text-muted-foreground hover:bg-secondary/50 transition-colors opacity-0 group-hover:opacity-100">
            <ImageIcon className="w-4 h-4" />
            <span className="text-sm">Add cover</span>
          </button>
        </div>
      )}

      {/* Icon and Title */}
      <div className="flex items-start gap-4">
        {/* Icon Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="text-6xl hover:bg-secondary/50 rounded-lg p-2 transition-colors">
              {page.icon || '📄'}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80">
            <div className="grid grid-cols-8 gap-1">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleIconChange(emoji)}
                  className={cn(
                    'text-2xl p-2 rounded hover:bg-secondary transition-colors',
                    page.icon === emoji && 'bg-secondary'
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Title */}
        <div className="flex-1 pt-2">
          {isEditingTitle ? (
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave();
                if (e.key === 'Escape') {
                  setTitle(page.title);
                  setIsEditingTitle(false);
                }
              }}
              className="w-full text-4xl font-bold bg-transparent outline-none border-b-2 border-accent py-1"
              placeholder="Untitled"
            />
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              className="text-4xl font-bold cursor-text hover:bg-secondary/30 rounded px-1 -mx-1 transition-colors"
            >
              {page.title || 'Untitled'}
            </h1>
          )}

          {/* Quick Actions */}
          <div className="flex items-center gap-2 mt-3 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" className="text-muted-foreground h-7 px-2">
              <Smile className="w-4 h-4 mr-1" />
              Add icon
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground h-7 px-2">
              <ImageIcon className="w-4 h-4 mr-1" />
              Add cover
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground h-7 px-2">
              <MessageSquare className="w-4 h-4 mr-1" />
              Add comment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
