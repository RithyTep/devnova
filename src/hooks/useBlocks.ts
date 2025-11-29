import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulleted_list'
  | 'numbered_list'
  | 'quote'
  | 'code'
  | 'divider'
  | 'todo';

export interface Block {
  id: string;
  page_id: string;
  type: BlockType;
  content: string;
  checked: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export function useBlocks(pageId: string | null) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlocks = useCallback(async () => {
    if (!pageId) {
      setBlocks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('blocks')
      .select('*')
      .eq('page_id', pageId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching blocks:', error);
    } else {
      setBlocks((data as Block[]) || []);
    }
    setLoading(false);
  }, [pageId]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const createBlock = async (
    type: BlockType = 'paragraph',
    content: string = '',
    position?: number
  ) => {
    if (!pageId) return { data: null, error: new Error('No page selected') };

    const newPosition = position ?? blocks.length;

    const { data, error } = await supabase
      .from('blocks')
      .insert({
        page_id: pageId,
        type,
        content,
        position: newPosition,
      })
      .select()
      .single();

    if (!error && data) {
      setBlocks((prev) => {
        const updated = [...prev, data as Block].sort((a, b) => a.position - b.position);
        return updated;
      });
    }

    return { data, error };
  };

  const updateBlock = async (
    id: string,
    updates: Partial<Pick<Block, 'type' | 'content' | 'checked' | 'position'>>
  ) => {
    const { data, error } = await supabase
      .from('blocks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setBlocks((prev) =>
        prev.map((b) => (b.id === id ? (data as Block) : b)).sort((a, b) => a.position - b.position)
      );
    }

    return { data, error };
  };

  const deleteBlock = async (id: string) => {
    const { error } = await supabase.from('blocks').delete().eq('id', id);

    if (!error) {
      setBlocks((prev) => prev.filter((b) => b.id !== id));
    }

    return { error };
  };

  const insertBlockAfter = async (afterId: string, type: BlockType = 'paragraph') => {
    const afterIndex = blocks.findIndex((b) => b.id === afterId);
    if (afterIndex === -1) return createBlock(type);

    // Shift all blocks after this one
    const blocksToUpdate = blocks.slice(afterIndex + 1);
    for (const block of blocksToUpdate) {
      await supabase
        .from('blocks')
        .update({ position: block.position + 1 })
        .eq('id', block.id);
    }

    return createBlock(type, '', afterIndex + 1);
  };

  return {
    blocks,
    loading,
    createBlock,
    updateBlock,
    deleteBlock,
    insertBlockAfter,
    refetch: fetchBlocks,
  };
}
