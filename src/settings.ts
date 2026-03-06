import { App, PluginSettingTab, Setting } from "obsidian";
import PasteImageAsPlugin from "./main";

export interface PasteImageAsSettings {
	targetFormat: "jpeg" | "webp";
	jpegQuality: number;
	webpQuality: number;
	overrideDefaultPaste: boolean;
}

export const DEFAULT_SETTINGS: PasteImageAsSettings = {
	targetFormat: "webp",
	jpegQuality: 0.9,
	webpQuality: 0.8,
	overrideDefaultPaste: false,
};

export class PasteImageAsSettingTab extends PluginSettingTab {
	plugin: PasteImageAsPlugin;

	constructor(app: App, plugin: PasteImageAsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Target format")
			.setDesc("The image format to convert pasted images into.")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("jpeg", "JPEG")
					.addOption("webp", "WEBP")
					.setValue(this.plugin.settings.targetFormat)
					.onChange(async (value) => {
						this.plugin.settings.targetFormat = value as
							| "jpeg"
							| "webp";
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("JPEG quality")
			.setDesc(
				"Compression quality for JPEG images (0 to 1). Higher is better quality but larger file size.",
			)
			.addSlider((slider) =>
				slider
					.setLimits(0.1, 1, 0.1)
					.setValue(this.plugin.settings.jpegQuality)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.jpegQuality = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Webp quality")
			.setDesc(
				"Compression quality for webp images (0 to 1). Higher is better quality but larger file size.",
			)
			.addSlider((slider) =>
				slider
					.setLimits(0.1, 1, 0.1)
					.setValue(this.plugin.settings.webpQuality)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.webpQuality = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Override default paste")
			.setDesc(
				"If enabled, the default Obsidian paste behavior will be overridden to paste images in the configured format. Otherwise, you must use the explicit command.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.overrideDefaultPaste)
					.onChange(async (value) => {
						this.plugin.settings.overrideDefaultPaste = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
