import { Page } from '@/hooks/usePages';
import { PageHeader } from '@/components/editor/PageHeader';
import { BlockEditor } from '@/components/editor/BlockEditor';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PanelLeft, Share, MoreHorizontal, GitBranch } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PageViewProps {
  page: Page;
  onUpdatePage: (id: string, updates: Partial<Pick<Page, 'title' | 'icon' | 'cover_image'>>) => Promise<{ data: Page | null; error: Error | null }>;
}

export function PageView({ page, onUpdatePage }: PageViewProps) {
  const [lastEdited, setLastEdited] = useState<string>('Just now');

  useEffect(() => {
    const updateTime = new Date(page.updated_at);
    const now = new Date();
    const diffMs = now.getTime() - updateTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
      setLastEdited('Just now');
    } else if (diffMins < 60) {
      setLastEdited(`${diffMins}m ago`);
    } else {
      const diffHours = Math.floor(diffMins / 60);
      setLastEdited(`${diffHours}h ago`);
    }
  }, [page.updated_at]);

  return (
    <main className="flex-1 flex flex-col h-full bg-background relative">
      {/* Header */}
      <header className="h-14 border-b border-border/40 flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <PanelLeft className="w-4 h-4 mr-2 cursor-pointer md:hidden hover:text-foreground transition-colors" />
          <span className="hover:text-secondary-foreground cursor-pointer transition-colors">Pages</span>
          <span className="text-border">/</span>
          <span className="text-secondary-foreground font-medium">{page.title || 'Untitled'}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground mr-2">Edited {lastEdited}</span>
          <button className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-secondary rounded">
            <Share className="w-4 h-4" />
          </button>
          <button className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-secondary rounded">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Editor Area */}
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-8 py-12">
          <PageHeader page={page} onUpdatePage={onUpdatePage} />
          <BlockEditor pageId={page.id} />
        </div>
      </ScrollArea>

      {/* Footer Status Bar */}
      <footer className="h-8 border-t border-border bg-background flex items-center justify-between px-4 text-[10px] text-muted-foreground font-mono tracking-wide select-none">
        <div className="flex gap-4">
          <span className="hover:text-secondary-foreground cursor-pointer flex items-center gap-1">
            <GitBranch className="w-3 h-3" /> main
          </span>
          <span className="hidden sm:inline">UTF-8</span>
        </div>
        <div className="flex gap-4">
          <span className="hover:text-secondary-foreground cursor-pointer">Markdown</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
            Saved
          </span>
        </div>
      </footer>
    </main>
  );
}
