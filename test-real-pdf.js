import fs from 'fs';
import { PDFParse } from 'pdf-parse';

async function run() {
  try {
    const parser = new PDFParse({ data: fs.readFileSync('package.json') });
    console.log("Passed buffer of length " + fs.readFileSync('package.json').length);
    console.log(await parser.getText());
  } catch (e) {
    console.error("ERROR from real PDFParse:", e.message);
  }
}
run();
