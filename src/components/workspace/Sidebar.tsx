import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePages, Page } from '@/hooks/usePages';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileCode,
  Plus,
  ChevronRight,
  ChevronDown,
  Star,
  MoreHorizontal,
  Trash2,
  Settings,
  LogOut,
  Search,
  ChevronsUpDown,
  PlusCircle,
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
            isSelected && 'active'
          )}
          style={{ paddingLeft: `${8 + depth * 12}px` }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(page.id)}
              className="p-0.5 hover:bg-sidebar-border rounded text-muted-foreground hover:text-foreground"
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
            {page.is_favorite ? (
              <FileCode className="w-4 h-4 text-accent" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
            )}
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
                <Star className={cn('w-4 h-4 mr-2', page.is_favorite && 'fill-current text-warning')} />
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
          <div className="ml-2 border-l border-sidebar-border">
            {children.map((child) => renderPageItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 h-screen bg-sidebar flex flex-col border-r border-sidebar-border shrink-0">
      {/* Workspace Header */}
      <div className="p-4 flex items-center justify-between group cursor-pointer">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-5 h-5 bg-primary rounded text-primary-foreground flex items-center justify-center text-xs font-bold tracking-tighter">
                D
              </div>
              <span className="text-secondary-foreground text-sm font-medium tracking-tight">DevSpace</span>
              <ChevronsUpDown className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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

      {/* Search & Actions */}
      <div className="px-3 pb-2 space-y-1">
        <button className="sidebar-item w-full">
          <Search className="w-4 h-4" />
          <span className="flex-1 text-left">Search</span>
          <span className="kbd-badge">⌘K</span>
        </button>
        <button className="sidebar-item w-full" onClick={handleCreatePage}>
          <PlusCircle className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {/* Pages List */}
      <ScrollArea className="flex-1 px-3 py-4">
        {/* Favorites */}
        {favoritePages.length > 0 && (
          <div className="mb-6">
            <h3 className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Favorites
            </h3>
            <ul className="space-y-0.5">
              {favoritePages.map((page) => (
                <li key={page.id}>
                  <button
                    onClick={() => onSelectPage(page.id)}
                    className={cn(
                      'sidebar-item w-full',
                      selectedPageId === page.id && 'active'
                    )}
                  >
                    <FileCode className="w-4 h-4 text-accent" />
                    <span className="font-medium truncate">{page.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* All Pages */}
        <div className="mb-6">
          <h3 className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Pages
          </h3>

          {loading ? (
            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
              Loading...
            </div>
          ) : rootPages.length === 0 ? (
            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
              No pages yet
            </div>
          ) : (
            <ul className="space-y-0.5">
              {rootPages.map((page) => renderPageItem(page))}
            </ul>
          )}
        </div>

        {/* Tags */}
        <div>
          <h3 className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Tags
          </h3>
          <div className="px-2 flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground hover:text-secondary-foreground cursor-pointer">#bug-fix</span>
            <span className="text-xs text-muted-foreground hover:text-secondary-foreground cursor-pointer">#rfc</span>
            <span className="text-xs text-muted-foreground hover:text-secondary-foreground cursor-pointer">#idea</span>
          </div>
        </div>
      </ScrollArea>

      {/* User Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <button className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-muted-foreground hover:text-secondary-foreground transition-colors">
          <div className="flex items-center gap-2">
            <div className="status-indicator status-online" />
            <span>Online</span>
          </div>
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
