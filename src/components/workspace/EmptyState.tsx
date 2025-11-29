import { FileCode, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onCreatePage: () => void;
}

export function EmptyState({ onCreatePage }: EmptyStateProps) {
  return (
    <main className="flex-1 flex flex-col h-full bg-background">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-secondary border border-border flex items-center justify-center">
            <FileCode className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-medium text-primary mb-2">
            No page selected
          </h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Select a page from the sidebar or create a new one to start writing.
          </p>
          <Button
            onClick={onCreatePage}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create new page
          </Button>
        </div>
      </div>

      {/* Footer Status Bar */}
      <footer className="h-8 border-t border-border bg-background flex items-center justify-center px-4 text-[10px] text-muted-foreground font-mono tracking-wide select-none">
        <span>Ready</span>
      </footer>
    </main>
  );
}
