import { Page, usePages } from '@/hooks/usePages';
import { PageHeader } from '@/components/editor/PageHeader';
import { BlockEditor } from '@/components/editor/BlockEditor';
import { Breadcrumbs } from '@/components/workspace/Breadcrumbs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PanelLeft, Share, MoreHorizontal, GitBranch, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface PageViewProps {
  page: Page;
  onUpdatePage: (id: string, updates: Partial<Pick<Page, 'title' | 'icon' | 'cover_image'>>) => Promise<{ data: Page | null; error: Error | null }>;
  onSelectPage: (pageId: string) => void;
}

export function PageView({ page, onUpdatePage, onSelectPage }: PageViewProps) {
  const { getAncestors, createPage } = usePages();
  const [lastEdited, setLastEdited] = useState<string>('Just now');
  const ancestors = getAncestors(page.id);

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

  const handleCreateSubpage = async () => {
    const { data, error } = await createPage('Untitled', page.id);
    if (error) {
      toast.error('Failed to create subpage');
    } else if (data) {
      onSelectPage(data.id);
      toast.success('Subpage created');
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full bg-background relative">
      {/* Header with Breadcrumbs */}
      <header className="h-14 border-b border-border/40 flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <PanelLeft className="w-4 h-4 mr-2 text-muted-foreground cursor-pointer md:hidden hover:text-foreground transition-colors shrink-0" />
          <Breadcrumbs
            ancestors={ancestors}
            currentPage={page}
            onNavigate={onSelectPage}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground mr-2 hidden sm:inline">
            Edited {lastEdited}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleCreateSubpage}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-secondary rounded"
              >
                <Plus className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Add subpage</TooltipContent>
          </Tooltip>
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
