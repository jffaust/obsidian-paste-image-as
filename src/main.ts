import { Plugin } from 'obsidian';
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

		// Listen to paste events
		this.registerDomEvent(document, 'paste', this.handlePaste.bind(this));
	}

	async handlePaste(event: ClipboardEvent) {
		if (!this.settings.overrideDefaultPaste) {
			return;
		}

		if (!event.clipboardData) {
			return;
		}

		const items = Array.from(event.clipboardData.items);
		for (const item of items) {
			if (item.type.startsWith("image/")) {
				const blob = item.getAsFile();
				if (blob) {
					// Only prevent default if we actually have an image blob to process
					event.preventDefault(); 
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