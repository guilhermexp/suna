'use client';

import React, { useEffect, useRef } from 'react';
import { EditorContent, Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';

interface YouTubePreviewHandlerProps {
  editor: Editor | null;
}

export function YouTubePreviewHandler({ editor }: YouTubePreviewHandlerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const processYouTubeLinks = () => {
    if (!containerRef.current || !editor) {
      return;
    }

    const editorContent = containerRef.current;

    // Find all links in the container or editor content
    const links = editorContent.querySelectorAll('a[href*="youtube.com"], a[href*="youtu.be"]');

    links.forEach((link: HTMLAnchorElement) => {
      const videoId = extractYouTubeId(link.href);
      if (!videoId) return;

      // Check if this link already has a preview button
      if (
        link.nextElementSibling?.classList.contains('youtube-preview-toggle') ||
        link.nextElementSibling?.classList.contains('youtube-preview-button')
      ) {
        return;
      }

      // Create the eye button
      const eyeButton = document.createElement('button');
      eyeButton.className = cn(
        'youtube-preview-toggle inline-flex items-center justify-center ml-1 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
        'text-muted-foreground hover:text-foreground'
      );
      eyeButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      `;
      eyeButton.title = 'Show/Hide YouTube Preview';
      eyeButton.contentEditable = 'false'; // Prevent editing

      // Create preview container
      const previewContainer = document.createElement('div');
      previewContainer.className = 'youtube-preview-container hidden mt-2';
      previewContainer.dataset.videoId = videoId;
      previewContainer.contentEditable = 'false'; // Prevent editing

      // Insert button and container after the link
      link.parentNode?.insertBefore(eyeButton, link.nextSibling);
      eyeButton.parentNode?.insertBefore(previewContainer, eyeButton.nextSibling);

      // Add click handler to toggle preview
      eyeButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        togglePreview(videoId, previewContainer);
      });
    });
  };

  const togglePreview = (videoId: string, container: HTMLElement) => {
    const isVisible = !container.classList.contains('hidden');

    if (isVisible) {
      // Hide preview
      container.classList.add('hidden');
      container.innerHTML = '';
    } else {
      // Show preview
      container.classList.remove('hidden');
      container.innerHTML = `
        <div class="youtube-player-wrapper my-2">
          <div class="relative w-full" style="padding-bottom: 56.25%;">
            <iframe
              class="absolute top-0 left-0 w-full h-full rounded-lg"
              src="https://www.youtube.com/embed/${videoId}"
              title="YouTube video player"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            ></iframe>
          </div>
        </div>
      `;
    }
  };

  useEffect(() => {
    if (!editor) return;

    const observer = new MutationObserver(() => {
      processYouTubeLinks();
    });

    // Observe changes in the editor content
    if (editor.view.dom) {
      observer.observe(editor.view.dom, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    // Initial processing
    processYouTubeLinks();

    return () => {
      observer.disconnect();
    };
  }, [editor]);

  return (
    <div ref={containerRef} className="youtube-preview-handler-container">
      {/* The editor content will be rendered here by NoteEditor.tsx */}
    </div>
  );
}
