import fs from "fs/promises";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

function cleanText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractText(filePath: string, mimeType: string): Promise<string> {
  try {
    if (mimeType === "application/pdf") {
      const buffer = await fs.readFile(filePath);
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      await parser.destroy();
      return cleanText(result.text);
    }

    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await mammoth.extractRawText({ path: filePath });
      return cleanText(result.value);
    }

    if (mimeType === "text/plain" || mimeType === "text/markdown") {
      const text = await fs.readFile(filePath, "utf-8");
      return cleanText(text);
    }

    const text = await fs.readFile(filePath, "utf-8");
    return cleanText(text);
  } catch {
    return "";
  }
}
