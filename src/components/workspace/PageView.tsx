import { Page } from '@/hooks/usePages';
import { PageHeader } from '@/components/editor/PageHeader';
import { BlockEditor } from '@/components/editor/BlockEditor';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PageViewProps {
  page: Page;
  onUpdatePage: (id: string, updates: Partial<Pick<Page, 'title' | 'icon' | 'cover_image'>>) => Promise<{ data: Page | null; error: Error | null }>;
}

export function PageView({ page, onUpdatePage }: PageViewProps) {
  return (
    <ScrollArea className="flex-1 h-screen">
      <div className="max-w-3xl mx-auto px-12 py-16">
        <PageHeader page={page} onUpdatePage={onUpdatePage} />
        <BlockEditor pageId={page.id} />
      </div>
    </ScrollArea>
  );
}
