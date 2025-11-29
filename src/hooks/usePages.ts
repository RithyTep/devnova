import { useState, useEffect } from 'react';
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

export function usePages() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPages = async () => {
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
  };

  useEffect(() => {
    fetchPages();
  }, [user]);

  const createPage = async (title: string = 'Untitled', parentPageId?: string) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('pages')
      .insert({
        title,
        user_id: user.id,
        parent_page_id: parentPageId || null,
        position: pages.length,
      })
      .select()
      .single();

    if (!error && data) {
      setPages((prev) => [...prev, data]);
    }

    return { data, error };
  };

  const updatePage = async (id: string, updates: Partial<Pick<Page, 'title' | 'icon' | 'cover_image' | 'is_favorite' | 'position'>>) => {
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
    const { error } = await supabase.from('pages').delete().eq('id', id);

    if (!error) {
      setPages((prev) => prev.filter((p) => p.id !== id));
    }

    return { error };
  };

  return {
    pages,
    loading,
    createPage,
    updatePage,
    deletePage,
    refetch: fetchPages,
  };
}
