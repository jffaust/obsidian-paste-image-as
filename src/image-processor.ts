import { App, ItemView, MarkdownView, TFile, Notice } from "obsidian";
import MyPlugin from "./main";

export class ImageProcessor {
	plugin: MyPlugin;
	app: App;

	constructor(app: App, plugin: MyPlugin) {
		this.app = app;
		this.plugin = plugin;
	}

	async processImageBlob(blob: Blob) {
		try {
			const { targetFormat, jpegQuality, webpQuality } =
				this.plugin.settings;
			const mimeType =
				targetFormat === "jpeg" ? "image/jpeg" : "image/webp";
			const quality = targetFormat === "jpeg" ? jpegQuality : webpQuality;
			const extension = targetFormat === "jpeg" ? "jpg" : "webp";

			const { convertedBlob, width, height } = await this.convertBlob(
				blob,
				mimeType,
				quality,
			);
			const arrayBuffer = await convertedBlob.arrayBuffer();

			const file = await this.saveImage(arrayBuffer, extension);

			if (file) {
				this.insertImageIntoView(file, width, height);
			}
		} catch (error) {
			console.error("Failed to process image:", error);
			new Notice("Failed to process pasted image.");
		}
	}

	private convertBlob(
		blob: Blob,
		mimeType: string,
		quality: number,
	): Promise<{ convertedBlob: Blob; width: number; height: number }> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				const width = img.width;
				const height = img.height;
				const canvas = document.createElement("canvas");
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext("2d");
				if (!ctx) {
					reject(new Error("Canvas context is null."));
					return;
				}
				ctx.drawImage(img, 0, 0);
				canvas.toBlob(
					(convertedBlob) => {
						if (convertedBlob) {
							resolve({ convertedBlob, width, height });
						} else {
							reject(
								new Error(
									`Failed to convert image to ${mimeType}.`,
								),
							);
						}
					},
					mimeType,
					quality,
				);
			};
			img.onerror = () => reject(new Error("Image load error."));
			img.src = URL.createObjectURL(blob);
		});
	}

	private getFormattedDate(): string {
		const now = new Date();
		return (
			`${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}` +
			`${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`
		);
	}

	private async saveImage(
		arrayBuffer: ArrayBuffer,
		extension: string,
	): Promise<TFile | null> {
		const fileName = `PastedImage_${this.getFormattedDate()}.${extension}`;

		// @ts-ignore
		let attachmentFolder = this.app.vault.getConfig("attachmentFolderPath");

		let folderPath: string = "";

		if (
			attachmentFolder &&
			attachmentFolder !== "./" &&
			attachmentFolder !== "/"
		) {
			folderPath = attachmentFolder;
		} else {
			const activeFile = this.app.workspace.getActiveFile();
			if (activeFile && activeFile.parent) {
				folderPath = activeFile.parent.path;
			}
		}

		if (folderPath === "/") {
			folderPath = "";
		}

		// Ensure the folder path exists
		if (folderPath) {
			const folderExists =
				await this.app.vault.adapter.exists(folderPath);
			if (!folderExists) {
				try {
					await this.app.vault.createFolder(folderPath);
				} catch (err) {
					console.error("Failed to create folder:", err);
					// Fallback to root if folder creation fails
					folderPath = "";
				}
			}
		}

		const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

		try {
			return await this.app.vault.createBinary(filePath, arrayBuffer);
		} catch (error) {
			console.error("Error saving image:", error);
			return null;
		}
	}

	private insertImageIntoView(
		file: TFile,
		originalWidth: number,
		originalHeight: number,
	) {
		const activeView = this.app.workspace.getActiveViewOfType(ItemView);

		if (!activeView) {
			return;
		}

		if (activeView.getViewType() === "markdown") {
			const markdownView = activeView as MarkdownView;
			const editor = markdownView.editor;
			const cursor = editor.getCursor();

			// Extract the filename from the path
			const filename = file.name;

			// TODO: Respect the user's Obsidian settings for inserting links (wikilinks vs markdown links, use absolute vs relative paths, etc.)
			editor.replaceRange(`![[${filename}]]`, cursor);
		} else if (activeView.getViewType() === "canvas") {
			// @ts-ignore
			const canvas = activeView.canvas;

			if (!canvas) {
				return;
			}

			const width = 400;
			const height = (originalHeight / originalWidth) * width;

			const posX = Math.round(canvas.pointer?.x ?? 0);
			const posY = Math.round(canvas.pointer?.y ?? 0);

			const node = canvas.createFileNode({
				pos: { x: posX, y: posY },
				size: { height: height, width: width },
				file: file,
			});

			canvas.addNode(node);
			canvas.requestSave();
		}
	}
}
