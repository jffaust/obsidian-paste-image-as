Here is some old code that caught the paste event and saved to JPG with an hardcoded quality value:

```ts
//@ts-ignore
import { ItemView, Plugin, TFile } from "obsidian";

export default class ImagePasteAsJPG extends Plugin {
	async onload() {
		console.log("ImagePasteAsJPG plugin loaded.");
		this.registerDomEvent(document, "paste", this.handlePaste.bind(this));
	}

	async handlePaste(event: ClipboardEvent) {
		console.log("Paste event detected.");
		if (!event.clipboardData) {
			console.log("No clipboard data found.");
			return;
		}

		const items = Array.from(event.clipboardData.items);
		console.log(`Clipboard contains ${items.length} items.`);
		for (const item of items) {
			console.log(`Processing item of type: ${item.type}`);
			if (item.type.startsWith("image/")) {
				event.preventDefault(); // Prevent default paste behavior
				const blob = item.getAsFile();
				if (blob) {
					console.log("Image blob found, converting to JPG...");
					const { jpgBlob, width, height } =
						await this.convertToJPG(blob);
					console.log("Image successfully converted to JPG.");
					await this.saveImage(jpgBlob, width, height);
					console.log("Image saved successfully.");
				} else {
					console.log("Failed to extract image blob.");
				}
				return; // Exit after processing the first image
			}
		}
		console.log("No image items found in the clipboard.");
	}

	async convertToJPG(
		blob: Blob,
	): Promise<{ jpgBlob: Blob; width: number; height: number }> {
		console.log("Converting image blob to JPG...");
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				const originalWidth = img.width;
				const originalHeight = img.height;
				const canvas = document.createElement("canvas");
				canvas.width = originalWidth;
				canvas.height = originalHeight;
				const ctx = canvas.getContext("2d");
				if (!ctx) {
					console.log("Failed to get canvas context.");
					reject(new Error("Canvas context is null."));
					return;
				}
				ctx.drawImage(img, 0, 0);
				canvas.toBlob(
					(jpgBlob) => {
						if (jpgBlob) {
							console.log("JPG conversion successful.");
							resolve({
								jpgBlob,
								width: originalWidth,
								height: originalHeight,
							});
						} else {
							console.log("Failed to create JPG blob.");
							reject(new Error("Failed to create JPG blob."));
						}
					},
					"image/jpeg",
					0.9,
				); // Set quality as needed
			};
			img.onerror = (e) => {
				console.log("Error loading image for conversion:", e);
				reject(new Error("Image load error."));
			};
			img.src = URL.createObjectURL(blob);
		});
	}

	async saveImage(blob: Blob, originalWidth: number, originalHeight: number) {
		console.log("Saving image...");
		const arrayBuffer = await blob.arrayBuffer();
		const base64 = this.arrayBufferToBase64(arrayBuffer);

		const now = new Date();
		const formattedDate =
			`${now.getFullYear()}${String(now.getMonth() + 1).padStart(
				2,
				"0",
			)}${String(now.getDate()).padStart(2, "0")}` +
			`${String(now.getHours()).padStart(2, "0")}${String(
				now.getMinutes(),
			).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;

		const fileName = `PastedImage_${formattedDate}.jpg`;

		// Access the configured attachment folder path
		//@ts-ignore
		const attachmentFolder = this.app.vault.getConfig(
			"attachmentFolderPath",
		);
		console.log(`Configured attachment folder: ${attachmentFolder}`);

		// Determine the folder path
		let folderPath: string;
		if (attachmentFolder && attachmentFolder !== "./") {
			folderPath = attachmentFolder;
		} else {
			// Default to the same folder as the active file
			const activeFile = this.app.workspace.getActiveFile();
			if (activeFile && activeFile.parent) {
				folderPath = activeFile.parent.path || ""; // Ensure it's a string
			} else {
				console.error("No active file to determine save location.");
				return;
			}
		}

		// Full file path
		const filePath = `${folderPath}/${fileName}`;
		console.log(`Final save location: ${filePath}`);

		// Ensure the folder exists
		if (!(await this.app.vault.adapter.exists(folderPath))) {
			console.log(
				`Folder "${folderPath}" does not exist. Creating it...`,
			);
			await this.app.vault.createFolder(folderPath);
		} else {
			console.log(`Folder "${folderPath}" exists.`);
		}

		// Save the image as a binary file
		await this.app.vault.createBinary(
			filePath,
			Buffer.from(base64, "base64"),
		);
		console.log(`File saved at: ${filePath}`);

		// https://github.com/Obsidian-Desci/Obsidian-Desci/blob/659754f847fc6d5c260aa13d45a6f261c8c878d1/src/utils/canvas-internal.ts#L60
		const canvasView = this.app.workspace.getActiveViewOfType(ItemView);
		if (canvasView?.getViewType() === "canvas") {
			const file = this.app.vault.getAbstractFileByPath(
				filePath,
			) as TFile;
			if (!file) {
				console.error("Could not find the saved image file.");
				return;
			}

			// @ts-ignore
			const canvas = canvasView?.canvas;

			// Calculate the height maintaining aspect ratio
			const width = 400;
			const height = (originalHeight / originalWidth) * width;

			console.log(canvas);

			const posX = Math.round(canvas.pointer.x);
			const posY = Math.round(canvas.pointer.y);
			const node = canvas.createFileNode({
				pos: {
					x: posX,
					y: posY,
				},
				size: {
					height: height,
					width: width,
				},
				file: file,
			});

			canvas.addNode(node);
			canvas.requestSave();
			if (!node) return;
		}
	}

	arrayBufferToBase64(buffer: ArrayBuffer): string {
		console.log("Converting ArrayBuffer to Base64...");
		const bytes = new Uint8Array(buffer);
		let binary = "";
		for (let i = 0; i < bytes.byteLength; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return window.btoa(binary);
	}
}
```
