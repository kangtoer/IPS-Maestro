import fs from 'fs';
import { PDFParse } from 'pdf-parse';

async function run() {
  try {
    const parser = new PDFParse({ data: new Uint8Array(Buffer.from('dummy', 'utf-8')) });
    console.log(await parser.getText());
  } catch (e) {
    console.error("ERROR:", e);
  }
}
run();
