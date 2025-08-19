<script lang="ts">
	import { onMount } from 'svelte';
	import YouTubePlayer from '../common/YouTubePlayer.svelte';
	
	export let container: HTMLElement;
	
	let youtubePreviews: Map<string, boolean> = new Map();
	
	function extractYouTubeId(url: string): string | null {
		const patterns = [
			/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
			/youtube\.com\/watch\?.*v=([^&\n?#]+)/
		];
		
		for (const pattern of patterns) {
			const match = url.match(pattern);
			if (match && match[1]) {
				return match[1];
			}
		}
		return null;
	}
	
	function processYouTubeLinks() {
		if (!container) {
			console.log('[YouTubePreviewHandler] Container not available');
			return;
		}
		
		// Look for links in the rich text editor content
		const editorContent = container.querySelector('.ProseMirror') || container;
		
		// Also look for plain text YouTube URLs that may not be wrapped in <a> tags
		const allTextNodes = [];
		const walker = document.createTreeWalker(
			editorContent,
			NodeFilter.SHOW_TEXT,
			null,
			false
		);
		
		let node;
		while (node = walker.nextNode()) {
			allTextNodes.push(node);
		}
		
		// Process text nodes for YouTube URLs
		allTextNodes.forEach((textNode) => {
			const text = textNode.textContent || '';
			const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})(?:[^\s]*)?/g;
			let match;
			
			while ((match = youtubeRegex.exec(text)) !== null) {
				const videoId = match[1];
				const url = match[0];
				const startIndex = match.index;
				
				// Check if this URL already has a button by looking at the parent element
				const parentEl = textNode.parentElement;
				if (parentEl && (parentEl.querySelector('.youtube-preview-button') || 
					parentEl.querySelector('.youtube-preview-toggle'))) {
					continue;
				}
				
				// Check if the next sibling is already a button
				const nextSibling = textNode.nextSibling;
				if (nextSibling && nextSibling.nodeType === Node.ELEMENT_NODE && 
					nextSibling.classList && (nextSibling.classList.contains('youtube-preview-button') ||
					nextSibling.classList.contains('youtube-preview-toggle'))) {
					continue;
				}
				
				console.log('[YouTubePreviewHandler] Found YouTube URL in text:', url, 'Video ID:', videoId);
				
				// Only process if we're not inside a link element
				if (parentEl && parentEl.tagName !== 'A') {
					// Split the text node and insert button after the URL
					const beforeText = text.substring(0, startIndex + url.length);
					const afterText = text.substring(startIndex + url.length);
					
					// Only modify if we have valid text
					if (beforeText) {
						// Create the eye button
						const eyeButton = document.createElement('button');
						eyeButton.className = 'youtube-preview-toggle inline-flex items-center justify-center ml-1 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors';
						eyeButton.innerHTML = `
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
								<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
								<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
						`;
						eyeButton.title = 'Show/Hide YouTube Preview';
						eyeButton.contentEditable = 'false';
						eyeButton.dataset.videoId = videoId;
						
						// Update text node
						textNode.textContent = beforeText;
						
						// Insert button after text node
						if (textNode.parentNode) {
							textNode.parentNode.insertBefore(eyeButton, textNode.nextSibling);
							
							// Add remaining text if any
							if (afterText) {
								const afterTextNode = document.createTextNode(afterText);
								eyeButton.parentNode.insertBefore(afterTextNode, eyeButton.nextSibling);
							}
							
							// Create preview container
							const previewContainer = document.createElement('div');
							previewContainer.className = 'youtube-preview-container hidden mt-2';
							previewContainer.dataset.videoId = videoId;
							previewContainer.contentEditable = 'false';
							
							// Insert preview container after button
							eyeButton.parentNode.insertBefore(previewContainer, eyeButton.nextSibling);
							
							console.log('[YouTubePreviewHandler] Button added for plain text URL:', videoId);
							
							// Add click handler
							eyeButton.addEventListener('click', (e) => {
								e.preventDefault();
								e.stopPropagation();
								togglePreview(videoId, previewContainer);
							});
						}
						
						// Break the loop since we modified the text node
						break;
					}
				}
			}
		});
		
		// Find all links in the container or editor content
		const links = editorContent.querySelectorAll('a[href*="youtube.com"], a[href*="youtu.be"]');
		console.log('[YouTubePreviewHandler] Found YouTube links:', links.length, 'in', editorContent);
		
		links.forEach((link: HTMLAnchorElement) => {
			const videoId = extractYouTubeId(link.href);
			if (!videoId) return;
			
			// Check if this link already has a preview button
			if (link.nextElementSibling?.classList.contains('youtube-preview-toggle') ||
				link.nextElementSibling?.classList.contains('youtube-preview-button')) {
				return;
			}
			
			console.log('[YouTubePreviewHandler] Processing link:', link.href, 'Video ID:', videoId);
			
			// Create the eye button
			const eyeButton = document.createElement('button');
			eyeButton.className = 'youtube-preview-toggle inline-flex items-center justify-center ml-1 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors';
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
			
			console.log('[YouTubePreviewHandler] Button added for video:', videoId);
			
			// Add click handler to toggle preview
			eyeButton.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				togglePreview(videoId, previewContainer);
			});
		});
	}
	
	function handlePreviewToggle(videoId, url, buttonElement) {
		// Find or create preview container
		let previewContainer = buttonElement.parentNode?.querySelector('.youtube-preview-container');
		
		if (!previewContainer) {
			previewContainer = document.createElement('div');
			previewContainer.className = 'youtube-preview-container hidden mt-2';
			previewContainer.dataset.videoId = videoId;
			previewContainer.contentEditable = 'false';
			buttonElement.parentNode?.insertBefore(previewContainer, buttonElement.nextSibling);
		}
		
		togglePreview(videoId, previewContainer);
	}
	
	function togglePreview(videoId: string, container: HTMLElement) {
		const isVisible = !container.classList.contains('hidden');
		
		if (isVisible) {
			// Hide preview
			container.classList.add('hidden');
			container.innerHTML = '';
			youtubePreviews.set(videoId, false);
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
			youtubePreviews.set(videoId, true);
		}
	}
	
	onMount(() => {
		console.log('[YouTubePreviewHandler] Component mounted, container:', container);
		
		// Process links immediately and after a delay
		processYouTubeLinks();
		setTimeout(() => {
			processYouTubeLinks();
		}, 100);
		setTimeout(() => {
			processYouTubeLinks();
		}, 500);
		
		// Watch for changes in the container
		const observer = new MutationObserver((mutations) => {
			// Check if any mutation contains YouTube links
			let hasYouTubeContent = false;
			for (const mutation of mutations) {
				if (mutation.type === 'childList' || mutation.type === 'characterData') {
					const target = mutation.target;
					const text = target.textContent || '';
					if (text.includes('youtube.com') || text.includes('youtu.be')) {
						hasYouTubeContent = true;
						break;
					}
				}
			}
			
			if (hasYouTubeContent) {
				// Debounce the processing to avoid multiple calls
				clearTimeout(window.youtubeProcessTimeout);
				window.youtubeProcessTimeout = setTimeout(() => {
					processYouTubeLinks();
				}, 50);
			}
		});
		
		if (container) {
			observer.observe(container, {
				childList: true,
				subtree: true,
				characterData: true,
				attributes: false // Don't watch attribute changes
			});
		}
		
		return () => {
			observer.disconnect();
			if (window.youtubeProcessTimeout) {
				clearTimeout(window.youtubeProcessTimeout);
			}
		};
	});
</script>

<style>
	:global(.youtube-preview-toggle) {
		display: inline-flex !important;
		vertical-align: middle;
		margin-left: 0.25rem;
	}
	
	:global(.youtube-preview-container) {
		margin-top: 0.5rem;
		margin-bottom: 0.5rem;
	}
	
	:global(.youtube-player-wrapper) {
		max-width: 640px;
	}
</style>