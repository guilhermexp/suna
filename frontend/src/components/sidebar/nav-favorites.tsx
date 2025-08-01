'use client';

import { useState, useEffect } from 'react';
import { Star, Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { 
  ThreadWithProject, 
  useProjects, 
  useThreads, 
  processThreadsWithProjects 
} from '@/hooks/react-query/sidebar/use-sidebar';

export function NavFavorites() {
  console.log('[NavFavorites] Component rendering');
  
  const { state } = useSidebar();
  const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Get projects and threads data
  const {
    data: projects = [],
    isLoading: isProjectsLoading,
  } = useProjects();

  const {
    data: threads = [],
    isLoading: isThreadsLoading,
  } = useThreads();

  // Process threads with projects
  const combinedThreads: ThreadWithProject[] =
    !isProjectsLoading && !isThreadsLoading ?
      processThreadsWithProjects(threads, projects) : [];

  // Filter only favorite threads
  const favoriteThreads = combinedThreads.filter(thread => thread.isFavorite);

  // Debug logs
  useEffect(() => {
    console.log('[NavFavorites] Loading state:', { isProjectsLoading, isThreadsLoading });
    console.log('[NavFavorites] Threads data:', threads);
    console.log('[NavFavorites] Combined threads:', combinedThreads);
    console.log('[NavFavorites] Favorite threads:', favoriteThreads);
  }, [isProjectsLoading, isThreadsLoading, threads, combinedThreads, favoriteThreads]);

  // Reset loading state when pathname changes
  useEffect(() => {
    setLoadingThreadId(null);
  }, [pathname]);

  // Function to handle thread click with loading state
  const handleThreadClick = (e: React.MouseEvent<HTMLAnchorElement>, threadId: string, url: string) => {
    e.preventDefault();
    setLoadingThreadId(threadId);
    router.push(url);
  };

  // Don't render if no favorites - temporarily commented for debug
  // if (favoriteThreads.length === 0) {
  //   return null;
  // }

  return (
    <SidebarGroup className="border-2 border-red-500 min-h-[100px] bg-yellow-50 dark:bg-yellow-900/10">
      <SidebarGroupLabel className="text-lg font-bold text-red-600">Favorites</SidebarGroupLabel>

      <SidebarMenu className="overflow-y-auto max-h-[200px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {favoriteThreads.length === 0 && state !== 'collapsed' && (
          <div className="text-xs text-muted-foreground p-2">
            No favorites yet. Total threads: {combinedThreads.length}
          </div>
        )}
        {favoriteThreads.map((thread) => {
          const isActive = pathname?.includes(thread.threadId) || false;
          const isThreadLoading = loadingThreadId === thread.threadId;

          return (
            <SidebarMenuItem key={`favorite-${thread.threadId}`}>
              <SidebarMenuButton
                asChild
                className={`relative ${isActive
                  ? 'bg-accent text-accent-foreground font-medium'
                  : ''
                }`}
                tooltip={state === 'collapsed' ? thread.projectName : undefined}
              >
                <Link
                  href={thread.url}
                  onClick={(e) => handleThreadClick(e, thread.threadId, thread.url)}
                  className="flex items-center"
                >
                  {isThreadLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                  ) : (
                    <Star className="h-4 w-4 flex-shrink-0 fill-current" />
                  )}
                  {state !== 'collapsed' && (
                    <span className="truncate ml-2">{thread.projectName}</span>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}