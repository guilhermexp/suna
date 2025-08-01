'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from "lucide-react";
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

  // Don't render if no favorites or sidebar is collapsed
  if (favoriteThreads.length === 0 || state === 'collapsed') {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Favorites</SidebarGroupLabel>

      <SidebarMenu>
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
              >
                <Link
                  href={thread.url}
                  onClick={(e) => handleThreadClick(e, thread.threadId, thread.url)}
                  className="flex items-center"
                >
                  {isThreadLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2 flex-shrink-0" />
                  ) : null}
                  <span className="truncate">{thread.projectName}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}