import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePages } from '@/hooks/usePages';
import { Sidebar } from '@/components/workspace/Sidebar';
import { PageView } from '@/components/workspace/PageView';
import { EmptyState } from '@/components/workspace/EmptyState';
import { toast } from 'sonner';

export default function Workspace() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { pages, loading: pagesLoading, createPage, updatePage } = usePages();
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Auto-select first page when pages load
  useEffect(() => {
    if (!pagesLoading && pages.length > 0 && !selectedPageId) {
      setSelectedPageId(pages[0].id);
    }
  }, [pages, pagesLoading, selectedPageId]);

  const handleCreatePage = async () => {
    const { data, error } = await createPage('Untitled');
    if (error) {
      toast.error('Failed to create page');
    } else if (data) {
      setSelectedPageId(data.id);
      toast.success('Page created');
    }
  };

  const handleSelectPage = (pageId: string) => {
    setSelectedPageId(pageId);
  };

  const selectedPage = pages.find((p) => p.id === selectedPageId);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar selectedPageId={selectedPageId} onSelectPage={handleSelectPage} />

      <main className="flex-1 flex flex-col">
        {selectedPage ? (
          <PageView
            page={selectedPage}
            onUpdatePage={updatePage}
            onSelectPage={handleSelectPage}
          />
        ) : (
          <EmptyState onCreatePage={handleCreatePage} />
        )}
      </main>
    </div>
  );
}
