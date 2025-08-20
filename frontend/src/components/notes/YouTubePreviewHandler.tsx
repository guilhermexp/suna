'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { EditorContent, Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';

interface YouTubePreviewHandlerProps {
  editor: Editor | null;
}

export interface YouTubePreviewHandlerRef {
  processLinks: () => void;
}

export const YouTubePreviewHandler = forwardRef<YouTubePreviewHandlerRef, YouTubePreviewHandlerProps>(
  ({ editor }, ref) => {
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

  const processYouTubeLinks = React.useCallback(() => {
    if (!editor) {
      return;
    }

    // Get the editor HTML content
    const content = editor.getHTML();
    
    // Pattern to find YouTube URLs
    const youtubePattern = /https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[^\s<]*)?/g;
    
    // Check if there are any YouTube URLs that are not already embedded
    const matches = Array.from(content.matchAll(youtubePattern));
    if (matches.length === 0) {
      return;
    }
    
    // Create a temporary div to work with the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // Find all text nodes that contain YouTube URLs
    const walker = document.createTreeWalker(
      tempDiv,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const text = node.textContent || '';
          return youtubePattern.test(text) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
      }
    );
    
    const replacements: Array<{
      node: Node;
      parent: Node;
      url: string;
      videoId: string;
    }> = [];
    
    // Reset pattern for new search
    youtubePattern.lastIndex = 0;
    
    let textNode;
    while (textNode = walker.nextNode()) {
      const text = textNode.textContent || '';
      youtubePattern.lastIndex = 0; // Reset for each node
      const nodeMatches = Array.from(text.matchAll(youtubePattern));
      
      for (const match of nodeMatches) {
        const url = match[0];
        const videoId = match[3];
        
        // Check if this URL is already inside an anchor or near an iframe
        const parent = textNode.parentNode as HTMLElement;
        if (parent && parent.tagName !== 'A' && 
            !parent.querySelector(`iframe[src*="${videoId}"]`) &&
            !parent.parentElement?.querySelector(`iframe[src*="${videoId}"]`)) {
          replacements.push({
            node: textNode,
            parent: textNode.parentNode!,
            url,
            videoId
          });
        }
      }
    }
    
    // Process replacements
    let contentChanged = false;
    for (const { node, parent, url, videoId } of replacements) {
      const text = node.textContent || '';
      
      // Create a wrapper div
      const wrapper = document.createElement('div');
      
      // Split the text around the URL
      const urlIndex = text.indexOf(url);
      if (urlIndex === -1) continue;
      
      const beforeText = text.substring(0, urlIndex);
      const afterText = text.substring(urlIndex + url.length);
      
      // Add text before URL
      if (beforeText) {
        const textSpan = document.createElement('span');
        textSpan.textContent = beforeText;
        wrapper.appendChild(textSpan);
      }
      
      // Add the URL as a paragraph to preserve it
      const urlParagraph = document.createElement('p');
      urlParagraph.textContent = url;
      urlParagraph.className = 'youtube-url-preserved';
      wrapper.appendChild(urlParagraph);
      
      // Add the YouTube embed
      const embedDiv = document.createElement('div');
      embedDiv.className = 'youtube-embed-container my-4';
      embedDiv.innerHTML = `
        <div class="relative w-full" style="padding-bottom: 56.25%;">
          <iframe
            class="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
            src="https://www.youtube.com/embed/${videoId}"
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
        </div>
      `;
      wrapper.appendChild(embedDiv);
      
      // Add text after URL
      if (afterText) {
        const textSpan = document.createElement('span');
        textSpan.textContent = afterText;
        wrapper.appendChild(textSpan);
      }
      
      // Replace the text node
      parent.replaceChild(wrapper, node);
      contentChanged = true;
    }
    
    // Update the editor with the new content if changes were made
    if (contentChanged) {
      const newContent = tempDiv.innerHTML;
      editor.commands.setContent(newContent, false, {
        preserveWhitespace: true
      });
    }

    // Also process existing anchor tags
    const links = editor.view.dom.querySelectorAll('a[href*="youtube.com"], a[href*="youtu.be"]');

    links.forEach((link: HTMLAnchorElement) => {
      const videoId = extractYouTubeId(link.href);
      if (!videoId) return;

      // Check if this link already has a preview
      if (
        link.nextElementSibling?.classList.contains('youtube-preview-container') ||
        link.parentElement?.querySelector('.youtube-preview-container')
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
  }, [editor]);

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

  // Expose the processLinks function through ref
  useImperativeHandle(ref, () => ({
    processLinks: processYouTubeLinks
  }), [processYouTubeLinks]);

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
  }, [editor, processYouTubeLinks]);

  return (
    <div ref={containerRef} className="youtube-preview-handler-container">
      {/* The editor content will be rendered here by NoteEditor.tsx */}
    </div>
  );
});

YouTubePreviewHandler.displayName = 'YouTubePreviewHandler';
