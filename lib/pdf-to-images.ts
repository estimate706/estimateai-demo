// lib/pdf-to-images.ts
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink, readdir } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import sharp from "sharp";

const execAsync = promisify(exec);

export async function convertPdfToImages(pdfBytes: Uint8Array): Promise<string[]> {
  const tempPdfPath = join(tmpdir(), `input-${Date.now()}.pdf`);
  const outputDir = join(tmpdir(), `pdf-output-${Date.now()}`);

  try {
    // Write PDF to temp file
    await writeFile(tempPdfPath, pdfBytes);

    // Use pdf-poppler to convert PDF pages to images
    // This requires poppler-utils to be installed in the system
    await execAsync(`pdftoppm -png -r 150 "${tempPdfPath}" "${outputDir}/page"`);

    // Read generated images
    const files = await readdir(outputDir);
    const imageFiles = files.filter(f => f.endsWith('.png')).sort();

    // Convert to base64
    const base64Images: string[] = [];
    for (const file of imageFiles.slice(0, 10)) { // Limit to 10 pages max
      const imagePath = join(outputDir, file);
      const imageBuffer = await sharp(imagePath)
        .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer();
      
      base64Images.push(imageBuffer.toString('base64'));
      
      // Cleanup individual image
      await unlink(imagePath);
    }

    // Cleanup temp files
    await unlink(tempPdfPath);

    return base64Images;
  } catch (error) {
    console.error('PDF conversion error:', error);
    throw new Error(`Failed to convert PDF to images: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}