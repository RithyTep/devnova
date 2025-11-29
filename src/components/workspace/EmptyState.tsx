import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onCreatePage: () => void;
}

export function EmptyState({ onCreatePage }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md animate-fade-in">
        <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No page selected</h2>
        <p className="text-muted-foreground mb-6">
          Select a page from the sidebar or create a new one to get started.
        </p>
        <Button onClick={onCreatePage} className="gap-2">
          <Plus className="w-4 h-4" />
          Create a page
        </Button>
      </div>
    </div>
  );
}
