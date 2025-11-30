import { Page } from '@/hooks/usePages';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbsProps {
  ancestors: Page[];
  currentPage: Page;
  onNavigate: (pageId: string) => void;
}

export function Breadcrumbs({ ancestors, currentPage, onNavigate }: BreadcrumbsProps) {
  const allItems = [...ancestors, currentPage];

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto">
      <button
        onClick={() => onNavigate(currentPage.id)}
        className="hover:text-secondary-foreground transition-colors shrink-0"
      >
        Pages
      </button>

      {allItems.map((page, index) => {
        const isLast = index === allItems.length - 1;

        return (
          <div key={page.id} className="flex items-center gap-1 min-w-0">
            <ChevronRight className="w-3.5 h-3.5 text-border shrink-0" />
            <button
              onClick={() => onNavigate(page.id)}
              className={cn(
                'transition-colors truncate max-w-[150px]',
                isLast
                  ? 'text-secondary-foreground font-medium'
                  : 'hover:text-secondary-foreground'
              )}
              title={page.title || 'Untitled'}
            >
              {page.icon && <span className="mr-1">{page.icon}</span>}
              {page.title || 'Untitled'}
            </button>
          </div>
        );
      })}
    </nav>
  );
}
