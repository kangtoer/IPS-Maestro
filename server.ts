import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { GoogleGenAI } from "@google/genai";
import HTMLToDOCX from 'html-to-docx';

const rootDir = process.cwd();

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  const upload = multer({ storage: multer.memoryStorage() });

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  app.post('/api/generate-docx', async (req, res) => {
    try {
      const { html, filename } = req.body;
      const docxBlob = await HTMLToDOCX(html, null, {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: true,
      });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.docx`);
      res.send(docxBlob);
    } catch (error) {
      console.error('DOCX generation error:', error);
      res.status(500).json({ error: 'Failed to generate DOCX' });
    }
  });

  app.post('/api/extract-text', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      let text = '';
      if (req.file.mimetype === 'application/pdf') {
        const data = await pdf(req.file.buffer);
        text = data.text;
      } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        text = result.value;
      } else {
        text = req.file.buffer.toString('utf-8');
      }

      res.json({ text });
    } catch (error) {
      console.error('Extraction error:', error);
      res.status(500).json({ error: 'Failed to extract text' });
    }
  });

  app.post('/api/generate-ai', async (req, res) => {
      // Proxying Gemini requests to keep API key safe
      const { prompt, systemInstruction, contents, temperature } = req.body;
      try {
          const response = await ai.models.generateContent({ 
              model: "gemini-3-flash-preview",
              contents: contents || prompt,
              config: {
                systemInstruction: systemInstruction,
                temperature: temperature ?? 0.7
              }
          });
          res.json({ text: response.text });
      } catch (error) {
          console.error('AI error:', error);
          res.status(500).json({ error: 'AI generation failed' });
      }
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(rootDir, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
