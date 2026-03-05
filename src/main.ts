import { Plugin, MarkdownView, Editor, MarkdownFileInfo } from 'obsidian';
import { DEFAULT_SETTINGS, MyPluginSettings, SampleSettingTab } from "./settings";
import { ImageProcessor } from './image-processor';

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	imageProcessor: ImageProcessor;

	async onload() {
		await this.loadSettings();
		
		this.imageProcessor = new ImageProcessor(this.app, this);

		// Add settings tab
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// Register a command that can be invoked via hotkey
		this.addCommand({
			id: 'paste-image-as-configured-format',
			name: 'Paste image from clipboard as configured format',
			callback: async () => {
				try {
					const clipboardItems = await navigator.clipboard.read();
					for (const clipboardItem of clipboardItems) {
						for (const type of clipboardItem.types) {
							if (type.startsWith("image/")) {
								const blob = await clipboardItem.getType(type);
								if (blob) {
									await this.imageProcessor.processImageBlob(blob);
									return;
								}
							}
						}
					}
				} catch (err) {
					console.error("Failed to read clipboard contents:", err);
				}
			}
		});

		// Listen to editor paste events (for markdown)
		this.registerEvent(
			this.app.workspace.on('editor-paste', this.handleEditorPaste.bind(this))
		);

		// Listen to global paste events (for canvas and other non-markdown views)
		this.registerDomEvent(document, 'paste', this.handleGlobalPaste.bind(this));
	}

	async handleEditorPaste(evt: ClipboardEvent, editor: Editor, info: MarkdownView | MarkdownFileInfo) {
		if (!this.settings.overrideDefaultPaste) {
			return;
		}

		if (!evt.clipboardData) {
			return;
		}

		const items = Array.from(evt.clipboardData.items);
		for (const item of items) {
			if (item.type.startsWith("image/")) {
				const blob = item.getAsFile();
				if (blob) {
					evt.preventDefault(); 
					this.imageProcessor.processImageBlob(blob);
					return;
				}
			}
		}
	}

	async handleGlobalPaste(evt: ClipboardEvent) {
		if (!this.settings.overrideDefaultPaste) {
			return;
		}

		// Skip if the active view is Markdown, because handleEditorPaste will handle it
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeView) {
			return;
		}

		if (!evt.clipboardData) {
			return;
		}

		const items = Array.from(evt.clipboardData.items);
		for (const item of items) {
			if (item.type.startsWith("image/")) {
				const blob = item.getAsFile();
				if (blob) {
					// Only prevent default if we actually have an image blob to process
					evt.preventDefault(); 
					this.imageProcessor.processImageBlob(blob);
					return; // Exit after processing the first image
				}
			}
		}
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}