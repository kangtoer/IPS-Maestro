import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import multer from 'multer';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser(process.env.SESSION_SECRET || 'ips-maestro-secret'));

const upload = multer({ storage: multer.memoryStorage() });

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  `${APP_URL}/auth/callback`
);

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/blogger',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];

// Auth Endpoints
app.get('/api/auth/url', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
  res.json({ url });
});

app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    // Secure: true and SameSite: 'none' are required for iframes
    res.cookie('google_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. Window closing...</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error exchanging code:', error);
    res.status(500).send('Authentication failed');
  }
});

app.get('/api/auth/status', (req, res) => {
  const tokensStr = req.cookies.google_tokens;
  res.json({ authenticated: !!tokensStr });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('google_tokens');
  res.json({ success: true });
});

// Drive Integration
app.post('/api/drive/upload', async (req, res) => {
  const tokensStr = req.cookies.google_tokens;
  if (!tokensStr) return res.status(401).json({ error: 'Unauthorized' });

  const { name, content, mimeType } = req.body;
  const tokens = JSON.parse(tokensStr);
  oauth2Client.setCredentials(tokens);
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    const response = await drive.files.create({
      requestBody: {
        name: name,
        mimeType: mimeType,
      },
      media: {
        mimeType: mimeType,
        body: content,
      },
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Drive upload error:', error.message);
    let errorMessage = 'Failed to upload to Drive';
    let apiNotEnabled = false;

    if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
      if (errorMessage.includes('has not been used in project') || errorMessage.includes('is disabled')) {
        apiNotEnabled = true;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    if (apiNotEnabled) {
      errorMessage = `Google Drive API is not enabled. Please enable it in the Google Cloud Console: https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=${process.env.GOOGLE_PROJECT_ID || 'current-project'}`;
    }

    res.status(500).json({ error: errorMessage });
  }
});

// Blogger Integration
app.post('/api/blogger/post', async (req, res) => {
  const tokensStr = req.cookies.google_tokens;
  if (!tokensStr) return res.status(401).json({ error: 'Unauthorized' });

  const { title, content, blogUrl } = req.body;
  const tokens = JSON.parse(tokensStr);
  oauth2Client.setCredentials(tokens);
  const blogger = google.blogger({ version: 'v3', auth: oauth2Client });

  try {
    // We need to find the blog ID from URI or list blogs
    const blogsResponse = await blogger.blogs.listByUser({ userId: 'self' });
    const blog = blogsResponse.data.items?.find(b => b.url?.includes(blogUrl) || b.name?.includes(blogUrl));
    
    if (!blog?.id) {
      return res.status(404).json({ error: 'Blog not found. Please ensure the blog URL is correct and you have access.' });
    }

    const postResponse = await blogger.posts.insert({
      blogId: blog.id,
      requestBody: {
        title: title,
        content: content,
      },
    });
    res.json(postResponse.data);
  } catch (error: any) {
    console.error('Blogger post error:', error.message);
    let errorMessage = 'Failed to post to Blogger';
    let apiNotEnabled = false;

    if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
      if (errorMessage.includes('has not been used in project') || errorMessage.includes('is disabled')) {
        apiNotEnabled = true;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    if (apiNotEnabled) {
      errorMessage = `Blogger API is not enabled. Please enable it in the Google Cloud Console: https://console.developers.google.com/apis/api/blogger.googleapis.com/overview?project=${process.env.GOOGLE_PROJECT_ID || 'current-project'}`;
    }

    res.status(500).json({ error: errorMessage });
  }
});

// Document parsing for Quiz Generation
app.post('/api/upload-document', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    let text = '';
    const file = req.file;
    if (file.mimetype === 'application/pdf') {
      const parser = new PDFParse({ data: file.buffer });
      const data = await parser.getText();
      await parser.destroy();
      text = data.text;
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.mimetype === 'application/msword') {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      text = result.value;
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Please upload PDF or DOCX.' });
    }
    
    res.json({ text });
  } catch (err: any) {
    console.error('Document parsing error:', err);
    res.status(500).json({ error: `Gagal membaca dokumen: ${err.message}` });
  }
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Express global error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
