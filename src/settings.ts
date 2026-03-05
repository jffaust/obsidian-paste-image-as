import { App, PluginSettingTab, Setting } from "obsidian";
import MyPlugin from "./main";

export interface MyPluginSettings {
	targetFormat: 'jpeg' | 'webp';
	jpegQuality: number;
	webpQuality: number;
	overrideDefaultPaste: boolean;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	targetFormat: 'webp',
	jpegQuality: 0.9,
	webpQuality: 0.8,
	overrideDefaultPaste: false
}

export class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Target Format')
			.setDesc('The image format to convert pasted images into.')
			.addDropdown(dropdown => dropdown
				.addOption('jpeg', 'JPEG')
				.addOption('webp', 'WebP')
				.setValue(this.plugin.settings.targetFormat)
				.onChange(async (value) => {
					this.plugin.settings.targetFormat = value as 'jpeg' | 'webp';
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('JPEG Quality')
			.setDesc('Compression quality for JPEG images (0 to 1). Higher is better quality but larger file size.')
			.addSlider(slider => slider
				.setLimits(0.1, 1, 0.1)
				.setValue(this.plugin.settings.jpegQuality)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.jpegQuality = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('WebP Quality')
			.setDesc('Compression quality for WebP images (0 to 1). Higher is better quality but larger file size.')
			.addSlider(slider => slider
				.setLimits(0.1, 1, 0.1)
				.setValue(this.plugin.settings.webpQuality)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.webpQuality = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Override Default Paste')
			.setDesc('If enabled, the default Obsidian paste behavior will be overridden to paste images in the configured format. Otherwise, you must use the explicit command.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.overrideDefaultPaste)
				.onChange(async (value) => {
					this.plugin.settings.overrideDefaultPaste = value;
					await this.plugin.saveSettings();
				}));
	}
}
