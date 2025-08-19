import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

// Helper function to extract YouTube video ID from various URL formats
function extractYouTubeId(url) {
	const patterns = [
		/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
		/youtube\.com\/watch\?.*v=([^&\n?#]+)/
	];
	
	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match) {
			return match[1];
		}
	}
	return null;
}

export const YouTubeLinkExtension = Extension.create({
	name: 'youtubeLink',

	addOptions() {
		return {
			onTogglePreview: null
		};
	},

	addProseMirrorPlugins() {
		const extension = this;
		
		return [
			new Plugin({
				key: new PluginKey('youtubeLink'),
				state: {
					init(_, state) {
						return DecorationSet.empty;
					},
					apply(tr, decorationSet, oldState, newState) {
						// Remove old decorations
						decorationSet = decorationSet.map(tr.mapping, tr.doc);
						
						// Find all YouTube links in the document
						const decorations = [];
						
						newState.doc.descendants((node, pos) => {
							if (node.type.name === 'text' && node.text) {
								const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})(?:[^\s]*)?/g;
								let match;
								
								while ((match = regex.exec(node.text)) !== null) {
									const from = pos + match.index;
									const matchedUrl = match[0];
									const to = from + matchedUrl.length;
									const videoId = match[1];
									
									// Create a decoration for the eye button
									const decoration = Decoration.widget(to, () => {
										const button = document.createElement('button');
										button.className = 'youtube-preview-button inline-flex items-center justify-center ml-1 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors';
										button.setAttribute('data-video-id', videoId);
										button.setAttribute('data-video-url', matchedUrl);
										button.title = 'Show/Hide YouTube Preview';
										
										// Eye icon SVG
										button.innerHTML = `
											<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
												<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
												<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
											</svg>
										`;
										
										// Add click handler
										button.addEventListener('click', (e) => {
											e.preventDefault();
											e.stopPropagation();
											if (extension.options.onTogglePreview) {
												extension.options.onTogglePreview(videoId, matchedUrl, from, to);
											}
										});
										
										return button;
									}, { side: 0, stopEvent: () => true });
									
									decorations.push(decoration);
								}
							}
						});
						
						return DecorationSet.create(newState.doc, decorations);
					}
				},
				props: {
					decorations(state) {
						return this.getState(state);
					}
				}
			})
		];
	}
});