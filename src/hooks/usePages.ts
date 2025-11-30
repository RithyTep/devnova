import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Page {
  id: string;
  user_id: string;
  title: string;
  icon: string | null;
  cover_image: string | null;
  parent_page_id: string | null;
  is_favorite: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface PageTreeNode extends Page {
  children: PageTreeNode[];
  depth: number;
}

export function usePages() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPages = useCallback(async () => {
    if (!user) {
      setPages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching pages:', error);
    } else {
      setPages(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  // Get child pages of a parent
  const getChildPages = useCallback(
    (parentId: string | null): Page[] => {
      return pages.filter((p) => p.parent_page_id === parentId);
    },
    [pages]
  );

  // Get root pages (no parent)
  const rootPages = useMemo(
    () => pages.filter((p) => !p.parent_page_id),
    [pages]
  );

  // Get ancestors of a page (for breadcrumbs)
  const getAncestors = useCallback(
    (pageId: string): Page[] => {
      const ancestors: Page[] = [];
      let currentPage = pages.find((p) => p.id === pageId);

      while (currentPage?.parent_page_id) {
        const parent = pages.find((p) => p.id === currentPage!.parent_page_id);
        if (parent) {
          ancestors.unshift(parent);
          currentPage = parent;
        } else {
          break;
        }
      }

      return ancestors;
    },
    [pages]
  );

  // Get all ancestor IDs (for auto-expanding tree)
  const getAncestorIds = useCallback(
    (pageId: string): string[] => {
      return getAncestors(pageId).map((p) => p.id);
    },
    [getAncestors]
  );

  // Build tree structure recursively
  const buildPageTree = useCallback(
    (parentId: string | null = null, depth: number = 0): PageTreeNode[] => {
      return getChildPages(parentId).map((page) => ({
        ...page,
        depth,
        children: buildPageTree(page.id, depth + 1),
      }));
    },
    [getChildPages]
  );

  // Get page tree starting from root
  const pageTree = useMemo(() => buildPageTree(null), [buildPageTree]);

  // Get descendants count
  const getDescendantsCount = useCallback(
    (pageId: string): number => {
      const children = getChildPages(pageId);
      return children.reduce(
        (count, child) => count + 1 + getDescendantsCount(child.id),
        0
      );
    },
    [getChildPages]
  );

  const createPage = async (title: string = 'Untitled', parentPageId?: string | null) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };

    // Calculate position among siblings
    const siblings = parentPageId 
      ? pages.filter(p => p.parent_page_id === parentPageId)
      : pages.filter(p => !p.parent_page_id);
    
    const { data, error } = await supabase
      .from('pages')
      .insert({
        title,
        user_id: user.id,
        parent_page_id: parentPageId || null,
        position: siblings.length,
      })
      .select()
      .single();

    if (!error && data) {
      setPages((prev) => [...prev, data]);
    }

    return { data, error };
  };

  const updatePage = async (
    id: string,
    updates: Partial<Pick<Page, 'title' | 'icon' | 'cover_image' | 'is_favorite' | 'position' | 'parent_page_id'>>
  ) => {
    const { data, error } = await supabase
      .from('pages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setPages((prev) => prev.map((p) => (p.id === id ? data : p)));
    }

    return { data, error };
  };

  const deletePage = async (id: string) => {
    // Also deletes children due to cascade, but we need to update local state
    const descendantIds = new Set<string>();
    const collectDescendants = (pageId: string) => {
      descendantIds.add(pageId);
      getChildPages(pageId).forEach((child) => collectDescendants(child.id));
    };
    collectDescendants(id);

    const { error } = await supabase.from('pages').delete().eq('id', id);

    if (!error) {
      setPages((prev) => prev.filter((p) => !descendantIds.has(p.id)));
    }

    return { error };
  };

  // Move page to a new parent
  const movePage = async (pageId: string, newParentId: string | null) => {
    // Prevent moving to self or descendants
    if (pageId === newParentId) return { error: new Error('Cannot move page to itself') };
    
    const descendantIds = new Set<string>();
    const collectDescendants = (id: string) => {
      descendantIds.add(id);
      getChildPages(id).forEach((child) => collectDescendants(child.id));
    };
    collectDescendants(pageId);
    
    if (newParentId && descendantIds.has(newParentId)) {
      return { error: new Error('Cannot move page to its descendant') };
    }

    return updatePage(pageId, { parent_page_id: newParentId });
  };

  return {
    pages,
    loading,
    rootPages,
    pageTree,
    getChildPages,
    getAncestors,
    getAncestorIds,
    getDescendantsCount,
    createPage,
    updatePage,
    deletePage,
    movePage,
    refetch: fetchPages,
  };
}
