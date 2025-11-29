import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePages, Page } from '@/hooks/usePages';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Plus,
  ChevronRight,
  ChevronDown,
  Star,
  MoreHorizontal,
  Trash2,
  Settings,
  LogOut,
  Search,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SidebarProps {
  selectedPageId: string | null;
  onSelectPage: (pageId: string) => void;
}

export function Sidebar({ selectedPageId, onSelectPage }: SidebarProps) {
  const { user, signOut } = useAuth();
  const { pages, createPage, updatePage, deletePage, loading } = usePages();
  const navigate = useNavigate();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const favoritePages = pages.filter((p) => p.is_favorite);
  const rootPages = pages.filter((p) => !p.parent_page_id);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreatePage = async () => {
    const { data, error } = await createPage('Untitled');
    if (error) {
      toast.error('Failed to create page');
    } else if (data) {
      onSelectPage(data.id);
      toast.success('Page created');
    }
  };

  const handleDeletePage = async (pageId: string) => {
    const { error } = await deletePage(pageId);
    if (error) {
      toast.error('Failed to delete page');
    } else {
      if (selectedPageId === pageId) {
        const remaining = pages.filter((p) => p.id !== pageId);
        if (remaining.length > 0) {
          onSelectPage(remaining[0].id);
        }
      }
      toast.success('Page deleted');
    }
  };

  const handleToggleFavorite = async (page: Page) => {
    const { error } = await updatePage(page.id, { is_favorite: !page.is_favorite });
    if (error) {
      toast.error('Failed to update page');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
    toast.success('Signed out');
  };

  const getChildPages = (parentId: string) => pages.filter((p) => p.parent_page_id === parentId);

  const renderPageItem = (page: Page, depth: number = 0) => {
    const children = getChildPages(page.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(page.id);
    const isSelected = selectedPageId === page.id;

    return (
      <div key={page.id} className="animate-fade-in">
        <div
          className={cn(
            'sidebar-item group',
            isSelected && 'active bg-sidebar-accent'
          )}
          style={{ paddingLeft: `${8 + depth * 12}px` }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(page.id)}
              className="p-0.5 hover:bg-sidebar-border rounded opacity-60 hover:opacity-100"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}

          <button
            onClick={() => onSelectPage(page.id)}
            className="flex-1 flex items-center gap-2 text-left truncate"
          >
            <span className="text-base">{page.icon || '📄'}</span>
            <span className="truncate">{page.title}</span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-sidebar-border rounded transition-opacity">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => handleToggleFavorite(page)}>
                <Star className={cn('w-4 h-4 mr-2', page.is_favorite && 'fill-current')} />
                {page.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeletePage(page.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {hasChildren && isExpanded && (
          <div className="animate-slide-in-up">
            {children.map((child) => renderPageItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-60 h-screen bg-sidebar flex flex-col border-r border-sidebar-border">
      {/* User Section */}
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sidebar-accent transition-colors">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center text-accent-foreground text-xs font-medium">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="flex-1 text-left text-sm font-medium truncate">
                {user?.email?.split('@')[0] || 'User'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem disabled>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick Actions */}
      <div className="px-3 space-y-1">
        <button className="sidebar-item w-full text-muted-foreground hover:text-foreground">
          <Search className="w-4 h-4" />
          <span>Search</span>
        </button>
        <button className="sidebar-item w-full text-muted-foreground hover:text-foreground">
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>
      </div>

      <Separator className="my-3 bg-sidebar-border" />

      {/* Pages List */}
      <ScrollArea className="flex-1 px-2">
        {/* Favorites */}
        {favoritePages.length > 0 && (
          <div className="mb-4">
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Favorites
            </div>
            {favoritePages.map((page) => renderPageItem(page))}
          </div>
        )}

        {/* All Pages */}
        <div>
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Pages
            </span>
            <button
              onClick={handleCreatePage}
              className="p-0.5 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
              Loading...
            </div>
          ) : rootPages.length === 0 ? (
            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
              No pages yet
            </div>
          ) : (
            rootPages.map((page) => renderPageItem(page))
          )}
        </div>
      </ScrollArea>

      {/* New Page Button */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={handleCreatePage}
        >
          <Plus className="w-4 h-4" />
          New page
        </Button>
      </div>
    </div>
  );
}
