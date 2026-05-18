import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutGrid, 
  MessageSquare, 
  PenLine, 
  ClipboardList, 
  FileText, 
  BarChart3, 
  RotateCcw, 
  Settings, 
  BookOpen, 
  HardDrive, 
  Download, 
  Send,
  Plus,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  Share2,
  ChevronRight,
  FileSpreadsheet,
  Users,
  Moon,
  Sun,
  Palette,
  LayoutList,
  FolderRoot,
  Upload,
  Search,
  File,
  ExternalLink,
  Trash2,
  FolderPlus,
  ChevronLeft,
  WifiOff,
  Zap,
  CloudOff,
  Cloud,
  FileJson,
  UploadCloud,
  Eye,
  XCircle,
  Tag,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { initAuth, googleSignIn, getAccessToken, logout } from './lib/firebase';
import { uploadToDrive, listDriveFiles, deleteDriveFile, createDriveFolder, getDriveFileBlob } from './services/driveService';
import { saveFileOffline, removeFileOffline, getOfflineFile, listOfflineFiles } from './services/offlineService';
import { User } from 'firebase/auth';

// --- TYPES ---
type Tab = 'beranda' | 'chatbot' | 'lkpd' | 'rpp' | 'silabus' | 'bank_soal' | 'penilaian' | 'jurnal' | 'materi' | 'pengaturan';

interface JournalEntry {
  id: string;
  date: string;
  activity: string;
  class: string;
  topic: string;
  notes: string;
  teacher: string;
  timestamp: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

// --- APP COMPONENT ---
export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('beranda');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [isLoadingApp, setIsLoadingApp] = useState(true);
  const [randomQuote, setRandomQuote] = useState('');

  const quotes = [
    "Guru adalah pilar peradaban. Tetaplah menginspirasi.",
    "Pendidikan adalah senjata paling ampuh untuk mengubah dunia. - Nelson Mandela",
    "Sebaik-baiknya guru adalah yang memberi teladan.",
    "Kesabaran adalah kunci dalam mendidik putra-putri bangsa.",
    "Teknologi hanya alat, dalam hal memotivasi anak-anak, guru adalah yang paling penting. - Bill Gates",
    "Jadilah guru yang dirindukan kehadirannya oleh setiap murid.",
    "Setiap anak adalah bintang, dan guru adalah langit yang membiarkan mereka bersinar.",
    "Mengajar adalah belajar dua kali."
  ];

  useEffect(() => {
    setRandomQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    const timer = setTimeout(() => {
      setIsLoadingApp(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'Halo Bapak/Ibu Guru! Saya **IPS Maestro Chatbot**. Ada yang bisa saya bantu terkait materi IPS, strategi mengajar, atau LKPD hari ini?',
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('ips-maestro-dark-mode');
    return saved ? JSON.parse(saved) : false;
  });
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('ips-maestro-accent-color') || 'indigo';
  });
  const [activeFont, setActiveFont] = useState(() => {
    return localStorage.getItem('ips-maestro-active-font') || 'font-inter';
  });

  const [aiTemperature, setAiTemperature] = useState(() => {
    const saved = localStorage.getItem('ips-maestro-ai-temp');
    return saved ? parseFloat(saved) : 0.7;
  });

  const [aiChatSystemPrompt, setAiChatSystemPrompt] = useState(() => {
    return localStorage.getItem('ips-maestro-ai-system-prompt') || 'Anda adalah IPS Maestro Chatbot, asisten kecerdasan buatan paling cerdas dan inspiratif bagi para pendidik Ilmu Pengetahuan Sosial (IPS) tingkat SMP di seluruh Indonesia.\n\n**Identitas & Persona:**\n- Anda adalah refleksi dari seorang Guru Maestro: ahli, bijak, hangat, dan selalu memberikan solusi pedagogis yang inovatif.\n- Anda memiliki pemahaman mendalam tentang Kurikulum Merdeka, Standar Isi SMP, dan kearifan lokal Indonesia.\n- Gaya komunikasi Anda: Profesional namun ramah, inspiratif, menggunakan Bahasa Indonesia yang baku namun tetap luwes (tidak kaku).\n\n**Tugas Utama:**\n1. **Pendamping Perencanaan:** Membantu guru menyusun rancangan pembelajaran (RPP/Modul Ajar), menentukan metode pengajaran (PBL, Discovery Learning, dll.), dan menyusun strategi penilaian.\n2. **Narasumber Materi:** Memberikan penjelasan materi geografi, sejarah, ekonomi, dan sosiologi dengan akurasi tinggi dan relevansi yang kuat dengan fenomena terkini di Indonesia.\n3. **Penyedia Ide Kreatif:** Memberikan ide aktivitas belajar yang aktif, interaktif, dan berpusat pada siswa (student-centered).\n4. **Instruktur HOTS:** Selalu mendorong penulisan soal dan aktivitas yang melatih Higher Order Thinking Skills.\n\n**Prinsip Jawaban:**\n- **Konteks Indonesia:** Selalu hubungkan jawaban dengan contoh nyata di Indonesia (misal: ekonomi pasar tradisional, sejarah kemerdekaan nasional, geografi kepulauan).\n- **Struktur Markdown:** Gunakan heading, bullet points, dan blok kode agar jawaban sangat mudah dibaca.\n- **Pedagogis:** Jika guru bertanya tentang masalah di kelas, berikan saran yang didukung teori pendidikan namun praktis.\n- **Interaktif:** Akhiri jawaban dengan pertanyaan pemantik atau saran langkah selanjutnya.';
  });

  useEffect(() => {
    localStorage.setItem('ips-maestro-ai-temp', aiTemperature.toString());
  }, [aiTemperature]);

  useEffect(() => {
    localStorage.setItem('ips-maestro-ai-system-prompt', aiChatSystemPrompt);
  }, [aiChatSystemPrompt]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ips-maestro-dark-mode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('ips-maestro-accent-color', accentColor);
  }, [accentColor]);

  useEffect(() => {
    localStorage.setItem('ips-maestro-active-font', activeFont);
  }, [activeFont]);

  // LKPD State
  const [lkpdTopic, setLkpdTopic] = useState('');
  const [lkpdGrade, setLkpdGrade] = useState('VII');
  const [lkpdType, setLkpdType] = useState('Literasi & Analisis');
  const [lkpdResult, setLkpdResult] = useState<string | null>(null);
  const [lkpdExportFormat, setLkpdExportFormat] = useState<'pdf' | 'docx'>('pdf');
  const [isGeneratingLkpd, setIsGeneratingLkpd] = useState(false);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);

  // RPP State
  const [rppTopic, setRppTopic] = useState('');
  const [rppGrade, setRppGrade] = useState('VII');
  const [rppResult, setRppResult] = useState<string | null>(null);
  const [rppExportFormat, setRppExportFormat] = useState<'pdf' | 'docx'>('pdf');
  const [isGeneratingRpp, setIsGeneratingRpp] = useState(false);
  const [isUploadingRppToDrive, setIsUploadingRppToDrive] = useState(false);
  const [rppIncludeVideo, setRppIncludeVideo] = useState(true);
  const [rppIncludeQuiz, setRppIncludeQuiz] = useState(true);
  const [rppIncludeLinks, setRppIncludeLinks] = useState(true);

  // Silabus State
  const [silabusTopic, setSilabusTopic] = useState('');
  const [silabusGrade, setSilabusGrade] = useState('VII');
  const [silabusObjectives, setSilabusObjectives] = useState('');
  const [silabusResult, setSilabusResult] = useState<string | null>(null);
  const [silabusExportFormat, setSilabusExportFormat] = useState<'pdf' | 'docx'>('pdf');
  const [isGeneratingSilabus, setIsGeneratingSilabus] = useState(false);
  const [isUploadingSilabusToDrive, setIsUploadingSilabusToDrive] = useState(false);

  // Bank Soal State
  const [bankSoalTopic, setBankSoalTopic] = useState('');
  const [bankSoalGrade, setBankSoalGrade] = useState('VII');
  const [bankSoalCount, setBankSoalCount] = useState(5);
  const [bankSoalResult, setBankSoalResult] = useState<string | null>(null);
  const [isGeneratingBankSoal, setIsGeneratingBankSoal] = useState(false);
  const [isUploadingBankSoalToDrive, setIsUploadingBankSoalToDrive] = useState(false);
  const [bankSoalFile, setBankSoalFile] = useState<File | null>(null);
  const [bankSoalFileText, setBankSoalFileText] = useState('');
  const [isExtractingBankSoalFile, setIsExtractingBankSoalFile] = useState(false);
  const [bankSoalQuestions, setBankSoalQuestions] = useState<any[]>([]);
  const [bankSoalSearchFilter, setBankSoalSearchFilter] = useState('');
  const [bankSoalTopicFilter, setBankSoalTopicFilter] = useState('all');
  const [bankSoalTagFilter, setBankSoalTagFilter] = useState('all');

  // Penilaian State
  const [assessmentTitle, setAssessmentTitle] = useState('Ulangan Harian: Interaksi Sosial');
  const [studentScores, setStudentScores] = useState([
    { name: 'Andi', score: 85 },
    { name: 'Budi', score: 72 },
    { name: 'Citra', score: 90 },
    { name: 'Dedi', score: 65 },
    { name: 'Eka', score: 88 },
    { name: 'Fani', score: 78 },
    { name: 'Gita', score: 92 },
    { name: 'Hani', score: 81 },
  ]);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentScore, setNewStudentScore] = useState('');
  const [scoreTrends, setScoreTrends] = useState([
    { period: 'UH-1', avg: 72, target: 75 },
    { period: 'UH-2', avg: 78, target: 75 },
    { period: 'UTS', avg: 74, target: 75 },
    { period: 'UH-3', avg: 82, target: 75 },
    { period: 'UAS', avg: 85, target: 75 },
  ]);

  const handleAddScore = () => {
    if (!newStudentName || !newStudentScore) return;
    setStudentScores([...studentScores, { name: newStudentName, score: parseInt(newStudentScore) }]);
    setNewStudentName('');
    setNewStudentScore('');
    setStatus({ type: 'success', message: 'Data nilai berhasil ditambahkan!' });
  };

  const deleteScore = (index: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus entri ini?')) {
      setStudentScores(studentScores.filter((_, i) => i !== index));
      setStatus({ type: 'success', message: 'Data nilai dihapus.' });
    }
  };

  const getStats = () => {
    if (studentScores.length === 0) return { avg: 0, max: 0, min: 0, passCount: 0 };
    const scores = studentScores.map(s => s.score);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const passCount = scores.filter(s => s >= 75).length;
    return { avg: avg.toFixed(1), max, min, passCount };
  };

  const stats = getStats();
  const pieData = [
    { name: 'Tuntas (>=75)', value: stats.passCount },
    { name: 'Belum Tuntas (<75)', value: studentScores.length - stats.passCount },
  ];
  const COLORS = ['#10b981', '#f43f5e'];

  // Jurnal State
  const [journalDate, setJournalDate] = useState(new Date().toISOString().split('T')[0]);
  const [journalActivity, setJournalActivity] = useState('');
  const [journalClass, setJournalClass] = useState('VII-A');
  const [journalTopic, setJournalTopic] = useState('');
  const [journalNotes, setJournalNotes] = useState('');
  const [journalTeacher, setJournalTeacher] = useState('Catur Pamungkas, S.Pd.,Gr.');
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('ips-maestro-journal-entries');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('ips-maestro-journal-entries', JSON.stringify(journalEntries));
  }, [journalEntries]);

  const handleAddJournalEntry = () => {
    if (!journalActivity || !journalTopic) {
      setStatus({ type: 'error', message: 'Harap isi aktivitas dan materi jurnal.' });
      return;
    }

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: journalDate,
      activity: journalActivity,
      class: journalClass,
      topic: journalTopic,
      notes: journalNotes,
      teacher: journalTeacher,
      timestamp: Date.now()
    };

    setJournalEntries(prev => [newEntry, ...prev]);
    setJournalActivity('');
    setJournalTopic('');
    setJournalNotes('');
    setStatus({ type: 'success', message: 'Jurnal berhasil disimpan!' });
  };

  const handleDeleteJournalEntry = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus entri ini?')) {
      setJournalEntries(prev => prev.filter(e => e.id !== id));
      setStatus({ type: 'success', message: 'Jurnal berhasil dihapus.' });
    }
  };

  const handleExportJournalCSV = () => {
    if (journalEntries.length === 0) {
      setStatus({ type: 'error', message: 'Tidak ada data jurnal untuk diekspor.' });
      return;
    }

    // Header CSV
    const headers = ['Tanggal', 'Kelas', 'Topik', 'Aktivitas', 'Catatan', 'Guru'];
    
    // Data CSV
    const csvContent = [
      headers.join(','),
      ...journalEntries.map(entry => [
        `"${entry.date}"`,
        `"${entry.class}"`,
        `"${entry.topic.replace(/"/g, '""')}"`,
        `"${entry.activity.replace(/"/g, '""')}"`,
        `"${(entry.notes || '').replace(/"/g, '""')}"`,
        `"${entry.teacher}"`
      ].join(','))
    ].join('\n');

    // Buat Blob dan link download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Jurnal_Guru_IPS_Maestro_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setStatus({ type: 'success', message: 'Jurnal berhasil diekspor ke CSV!' });
  };

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [needsDriveAuth, setNeedsDriveAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = initAuth(
      (u) => {
        setUser(u);
        setNeedsDriveAuth(false);
      },
      () => {
        setUser(null);
        setNeedsDriveAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Materi State
  const [materials, setMaterials] = useState<any[]>([]);
  const [isFetchingMaterials, setIsFetchingMaterials] = useState(false);
  const [materialSearch, setMaterialSearch] = useState('');
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [currentFolderName, setCurrentFolderName] = useState('Root');
  const [folderStack, setFolderStack] = useState<{id: string, name: string}[]>([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [offlineFileIds, setOfflineFileIds] = useState<Set<string>>(new Set());
  const [offlineMaterials, setOfflineMaterials] = useState<any[]>([]);
  const [materiView, setMateriView] = useState<'drive' | 'offline'>('drive');
  const [syncingStatuses, setSyncingStatuses] = useState<Record<string, 'downloading' | 'finished' | 'failed'>>({});
  const [previewFile, setPreviewFile] = useState<{ id: string, name: string, mimeType: string, url: string } | null>(null);

  const handlePreviewMaterial = async (file: any) => {
    if (previewFile) {
      URL.revokeObjectURL(previewFile.url);
      setPreviewFile(null);
    }

    const isOffline = offlineFileIds.has(file.id);
    
    if (isOffline) {
      const offlineFile = await getOfflineFile(file.id);
      if (offlineFile && offlineFile.data) {
        const url = URL.createObjectURL(offlineFile.data);
        setPreviewFile({ id: file.id, name: file.name, mimeType: file.mimeType, url });
      } else {
        setStatus({ type: 'error', message: 'File offline tidak ditemukan di database.' });
      }
    } else {
      // Use Google Drive Preview link
      const drivePreviewUrl = `https://drive.google.com/file/d/${file.id}/preview`;
      setPreviewFile({ id: file.id, name: file.name, mimeType: file.mimeType, url: drivePreviewUrl });
    }
  };

  const refreshOfflineFiles = async () => {
    const offlineFiles = await listOfflineFiles();
    setOfflineFileIds(new Set(offlineFiles.map(f => f.id)));
    setOfflineMaterials(offlineFiles);
  };

  useEffect(() => {
    refreshOfflineFiles();
  }, []);

  const handleToggleOffline = async (file: any) => {
    const isOffline = offlineFileIds.has(file.id);
    const token = getAccessToken();
    
    if (isOffline) {
      await removeFileOffline(file.id);
      setSyncingStatuses(prev => {
        const next = { ...prev };
        delete next[file.id];
        return next;
      });
      setStatus({ type: 'success', message: `File ${file.name} dihapus dari akses offline.` });
    } else {
      if (!token) {
        setStatus({ type: 'error', message: 'Token Google Drive kedaluwarsa. Silakan login kembali.' });
        return;
      }
      
      setSyncingStatuses(prev => ({ ...prev, [file.id]: 'downloading' }));
      setStatus({ type: 'success', message: `Mengunduh ${file.name} untuk akses offline...` });
      
      try {
        const blob = await getDriveFileBlob(token, file.id);
        await saveFileOffline({ id: file.id, name: file.name, mimeType: file.mimeType }, blob);
        
        setSyncingStatuses(prev => ({ ...prev, [file.id]: 'finished' }));
        setStatus({ type: 'success', message: `${file.name} kini tersedia offline!` });
        
        setTimeout(() => {
          setSyncingStatuses(prev => {
            const next = { ...prev };
            if (next[file.id] === 'finished') delete next[file.id];
            return next;
          });
        }, 3000);
      } catch (err: any) {
        setSyncingStatuses(prev => ({ ...prev, [file.id]: 'failed' }));
        setStatus({ type: 'error', message: `Gagal mengunduh untuk offline: ${err.message}` });
        return;
      }
    }
    refreshOfflineFiles();
  };

  const handleDownloadOffline = async (fileId: string) => {
    const offlineFile = await getOfflineFile(fileId);
    if (!offlineFile) {
      setStatus({ type: 'error', message: 'File tidak ditemukan di penyimpanan offline.' });
      return;
    }
    const url = URL.createObjectURL(offlineFile.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = offlineFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatus({ type: 'success', message: 'Berhasil mengunduh dari penyimpanan offline.' });
  };

  const fetchMaterials = async (folderId: string = 'root') => {
    const token = getAccessToken();
    if (!token) return;
    setIsFetchingMaterials(true);
    try {
      const query = `'${folderId}' in parents and trashed = false`;
      const files = await listDriveFiles(token, query);
      setMaterials(files);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingMaterials(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'materi' && user) {
      fetchMaterials(currentFolderId);
    }
  }, [activeTab, user, currentFolderId]);

  const handleCreateFolder = async () => {
    const folderName = prompt('Nama folder baru:');
    if (!folderName) return;

    const token = getAccessToken();
    if (!token) return;

    setIsCreatingFolder(true);
    try {
      await createDriveFolder(token, folderName, currentFolderId);
      setStatus({ type: 'success', message: 'Folder berhasil dibuat!' });
      fetchMaterials(currentFolderId);
    } catch (err: any) {
      setStatus({ type: 'error', message: `Gagal membuat folder: ${err.message}` });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleNavigateFolder = (folderId: string, folderName: string) => {
    setFolderStack(prev => [...prev, { id: currentFolderId, name: currentFolderName }]);
    setCurrentFolderId(folderId);
    setCurrentFolderName(folderName);
  };

  const handleGoBack = () => {
    if (folderStack.length === 0) return;
    const prev = folderStack[folderStack.length - 1];
    setFolderStack(prevStack => prevStack.slice(0, -1));
    setCurrentFolderId(prev.id);
    setCurrentFolderName(prev.name);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = getAccessToken();
    if (!token) {
      setStatus({ type: 'error', message: 'Hanya tersedia jika terhubung ke Drive.' });
      return;
    }

    setIsUploadingMaterial(true);
    setStatus({ type: 'success', message: 'Mengunggah file...' });
    try {
      await uploadToDrive(token, file.name, file, file.type, currentFolderId);
      setStatus({ type: 'success', message: 'File berhasil diunggah!' });
      fetchMaterials(currentFolderId);
    } catch (err: any) {
      setStatus({ type: 'error', message: `Gagal unggah: ${err.message}` });
    } finally {
      setIsUploadingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (fileId: string) => {
    const token = getAccessToken();
    if (!token) return;

    if (!confirm('Hapus file ini permanen?')) return;

    try {
      await deleteDriveFile(token, fileId);
      setStatus({ type: 'success', message: 'File dihapus.' });
      fetchMaterials();
    } catch (err: any) {
      setStatus({ type: 'error', message: `Gagal hapus: ${err.message}` });
    }
  };

  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsDriveAuth(false);
        setStatus({ type: 'success', message: 'Berhasil terhubung ke Google Drive!' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Gagal menghubungkan Google Drive.' });
    }
  };

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChat = async () => {
    if (!chatInput.trim() || isSendingChat) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: chatInput, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsSendingChat(true);

    try {
      const history = chatMessages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }));
      
      const response = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [...history, { role: 'user', parts: [{ text: chatInput }] }],
          systemInstruction: aiChatSystemPrompt,
          temperature: aiTemperature
        })
      });
      const data = await response.json();
      const aiMsg: ChatMessage = { id: (Date.now()+1).toString(), role: 'model', content: data.text, timestamp: new Date() };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setStatus({ type: 'error', message: 'Gagal menghubungi AI.' });
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleGenerateLKPD = async () => {
    if (!lkpdTopic || isGeneratingLkpd) return;
    setIsGeneratingLkpd(true);
    setLkpdResult(null);

    try {
      const prompt = `Anda adalah "IPS Maestro", pakar kurikulum IPS SMP di Indonesia. 
      Buatkan LKPD (Lembar Kerja Peserta Didik) yang sangat berkualitas, mendalam, dan memiliki desain instruksional yang "keren" untuk tingkat SMP Kelas ${lkpdGrade} dengan topik: "${lkpdTopic}".
      Tipe LKPD: ${lkpdType}.

      LKPD harus mencakup bagian-bagian berikut dengan gaya bahasa yang memotivasi:
      1. Identitas Lengkap (Nama, Kelas, No Absen, Tanggal).
      2. Capaian Pembelajaran & Tujuan Pembelajaran (sesuai Kurikulum Merdeka).
      3. "Mantik Maestro": Pertanyaan pemantik atau fenomena singkat yang memicu rasa ingin tahu.
      4. "Jendela Pengetahuan": Ringkasan materi yang padat namun esensial.
      5. "Misi Utama": Aktivitas belajar utama berbasis ${lkpdType} (HOTS, kritis, dan kreatif).
      6. "Ruang Kolaborasi": Tugas diskusi atau interaksi sosial.
      7. "Refleksi Maestro": Pertanyaan refleksi diri untuk siswa.

      Format dalam Markdown yang sangat rapi, menggunakan heading yang jelas, bullet points, dan tabel jika diperlukan. 
      Gunakan emoji yang relevan untuk mempercantik visual.
      Pastikan konten sangat relevan dengan realitas sosial budaya di Indonesia.`;

      const response = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await response.json();
      setLkpdResult(data.text);
    } catch (err) {
      setStatus({ type: 'error', message: 'Gagal membuat LKPD.' });
    } finally {
      setIsGeneratingLkpd(false);
    }
  };

  const exportPDF = async (elementId: string, filename: string, shouldDownload: boolean = true) => {
    if (shouldDownload && !confirm('Siapkan unduhan file PDF?')) return null;
    const element = document.getElementById(elementId);
    if (!element) return null;
    setStatus({ type: 'success', message: 'Menyiapkan PDF...' });
    
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    if (shouldDownload) {
      pdf.save(`${filename}.pdf`);
      setStatus({ type: 'success', message: 'PDF berhasil diunduh!' });
      return null;
    }
    
    return pdf.output('blob');
  };

  const exportDOCX = async (elementId: string, filename: string, shouldDownload: boolean = true) => {
    if (shouldDownload && !confirm('Siapkan unduhan file DOCX?')) return null;
    const element = document.getElementById(elementId);
    if (!element) return null;
    setStatus({ type: 'success', message: 'Menyiapkan DOCX...' });
    
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <title>${filename}</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.6; color: #1a1a1a; }
            h1 { font-size: 20pt; font-weight: bold; margin-bottom: 15pt; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8pt; }
            h2 { font-size: 16pt; font-weight: bold; margin-top: 20pt; margin-bottom: 10pt; color: #1e293b; }
            h3 { font-size: 14pt; font-weight: bold; margin-top: 15pt; margin-bottom: 8pt; color: #334155; }
            p { margin-bottom: 12pt; }
            table { border-collapse: collapse; width: 100%; border: 1px solid #1a1a1a; margin-top: 15pt; margin-bottom: 15pt; }
            th { background-color: #f8fafc; font-weight: bold; border: 1px solid #1a1a1a; padding: 8pt; text-align: center; }
            td { border: 1px solid #1a1a1a; padding: 8pt; vertical-align: top; }
            ul, ol { margin-left: 20pt; margin-bottom: 12pt; }
            li { margin-bottom: 6pt; }
            strong { font-weight: bold; }
            em { font-style: italic; }
            blockquote { border-left: 4px solid #cbd5e1; padding-left: 15pt; margin-left: 0; color: #475569; font-style: italic; }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
        </html>
      `;
      
      const response = await fetch('/api/generate-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: htmlContent, filename }),
      });

      if (!response.ok) throw new Error('Gagal dari server');
      
      const docxBlob = await response.blob();
      
      if (shouldDownload) {
        const url = URL.createObjectURL(docxBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.docx`;
        link.click();
        URL.revokeObjectURL(url);
        setStatus({ type: 'success', message: 'DOCX berhasil diunduh!' });
        return null;
      }
      
      return docxBlob;
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Gagal membuat DOCX.' });
      return null;
    }
  };

  const handleSaveToDrive = async () => {
    if (needsDriveAuth) {
      await handleLogin();
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setStatus({ type: 'error', message: 'Token akses tidak ditemukan. Silakan login kembali.' });
      setNeedsDriveAuth(true);
      return;
    }

    setIsUploadingToDrive(true);
    try {
      const fileName = `LKPD_Maestro_${lkpdTopic.replace(/\s+/g, '_')}`;
      let blob;
      if (lkpdExportFormat === 'pdf') {
        blob = await exportPDF('lkpd-result-content', fileName, false);
      } else {
        blob = await exportDOCX('lkpd-result-content', fileName, false);
      }
      
      if (!blob) throw new Error(`Gagal menghasilkan file ${lkpdExportFormat.toUpperCase()}`);

      await uploadToDrive(token, `${fileName}.${lkpdExportFormat}`, blob);
      setStatus({ type: 'success', message: `LKPD (.${lkpdExportFormat}) berhasil disimpan ke Google Drive Anda!` });
    } catch (err: any) {
      setStatus({ type: 'error', message: `Gagal simpan ke Drive: ${err.message}` });
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  const handleGenerateRPP = async () => {
    if (!rppTopic) return;
    setIsGeneratingRpp(true);
    setRppResult(null);

    try {
      const prompt = `Anda adalah "IPS Maestro", pakar desain instruksional Kurikulum Merdeka di Indonesia.
      Buatkan RPP (Rencana Pelaksanaan Pembelajaran) atau Modul Ajar yang INTERAKTIF dan komprehensif untuk tingkat SMP Kelas ${rppGrade} dengan topik: "${rppTopic}".

      RPP harus mengikuti komponen standar Kurikulum Merdeka dengan sentuhan interaktif:
      1. Informasi Umum (Identitas, Kompetensi Awal, Profil Pelajar Pancasila, Sarpras, Target Peserta Didik).
      2. Komponen Inti (Tujuan Pembelajaran, Pemahaman Bermakna, Pertanyaan Pemantik).
      3. Langkah Pembelajaran (Pendahuluan, Inti - menggunakan model pembelajaran aktif/PBL, Penutup).
      4. FITUR INTERAKTIF:
         ${rppIncludeVideo ? '- Wajib sertakan minimal 1 rekomendasi tautan Video YouTube yang relevan untuk stimulus.' : ''}
         ${rppIncludeQuiz ? '- Wajib sertakan bagian "Kuis Interaktif Singkat" (3-5 soal) yang bisa langsung dikerjakan siswa.' : ''}
         ${rppIncludeLinks ? '- Wajib sertakan "Portal Sumber Belajar" yang berisi tautan eksternal ke situs web kredibel (Kemdikbud, BBC, dll).' : ''}
      5. Asesmen (Diagnostik, Formatif, Sumatif).
      6. Pengayaan & Remedial.
      7. Lampiran (Glosarium, Daftar Pustaka).

      Gunakan format Markdown yang sangat rapi, emoji yang relevan, dan pastikan langkah pembelajaran sangat detail dan kreatif (Maestro Style). Masukkan elemen interaktif tersebut secara organik di dalam langkah-langkah pembelajaran atau bagian khusus yang menarik visualnya.`;

      const response = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemInstruction: 'Anda adalah pakar pembuat RPP Kurikulum Merdeka.' })
      });

      const data = await response.json();
      setRppResult(data.text);
      setStatus({ type: 'success', message: 'RPP Maestro berhasil dibuat!' });
    } catch (err) {
      setStatus({ type: 'error', message: 'Gagal membuat RPP.' });
    } finally {
      setIsGeneratingRpp(false);
    }
  };

  const handleSaveRppToDrive = async () => {
    if (needsDriveAuth) {
      await handleLogin();
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setStatus({ type: 'error', message: 'Token akses tidak ditemukan.' });
      setNeedsDriveAuth(true);
      return;
    }

    setIsUploadingRppToDrive(true);
    try {
      const fileName = `RPP_${rppGrade}_${rppTopic.replace(/\s+/g, '_')}`;
      let blob;
      if (rppExportFormat === 'pdf') {
        blob = await exportPDF('rpp-result-content', fileName, false);
      } else {
        blob = await exportDOCX('rpp-result-content', fileName, false);
      }

      if (!blob) throw new Error(`Gagal menghasilkan file ${rppExportFormat.toUpperCase()}`);

      await uploadToDrive(token, `${fileName}.${rppExportFormat}`, blob);
      setStatus({ type: 'success', message: `RPP (.${rppExportFormat}) berhasil disimpan ke Google Drive!` });
    } catch (err: any) {
      setStatus({ type: 'error', message: `Gagal simpan ke Drive: ${err.message}` });
    } finally {
      setIsUploadingRppToDrive(false);
    }
  };

  const handleGenerateSilabus = async () => {
    if (!silabusTopic) return;
    setIsGeneratingSilabus(true);
    setSilabusResult(null);

    try {
      const prompt = `Anda adalah "IPS Maestro", pakar pengembangan kurikulum IPS SMP di Indonesia. 
      Buatkan Silabus (Alur Tujuan Pembelajaran) yang sistematis dan mendalam untuk tingkat SMP Kelas ${silabusGrade} dengan topik: "${silabusTopic}".
      Tujuan Pembelajaran Khusus: ${silabusObjectives || 'Sesuai standar Kurikulum Merdeka'}.

      Silabus harus mencakup:
      1. Identitas Mata Pelajaran & Kelas.
      2. Capaian Pembelajaran (CP).
      3. Alur Tujuan Pembelajaran (ATP) - dipecah menjadi beberapa pertemuan.
      4. Materi Pokok & Kata Kunci.
      5. Profil Pelajar Pancasila yang dikembangkan.
      6. Alokasi Waktu.
      7. Sumber Belajar & Media.
      8. Jenis Asesmen.

      Gunakan format Markdown yang sangat rapi, menggunakan tabel untuk bagian alur pertemuan jika memungkinkan. 
      Pastikan urutan logis dan sesuai dengan perkembangan kognitif siswa SMP.`;

      const response = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemInstruction: 'Anda adalah pakar pengembang kurikulum dan silabus IPS.' })
      });

      const data = await response.json();
      setSilabusResult(data.text);
      setStatus({ type: 'success', message: 'Silabus Maestro berhasil dibuat!' });
    } catch (err) {
      setStatus({ type: 'error', message: 'Gagal membuat Silabus.' });
    } finally {
      setIsGeneratingSilabus(false);
    }
  };

  const handleSaveSilabusToDrive = async () => {
    if (needsDriveAuth) {
      await handleLogin();
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setStatus({ type: 'error', message: 'Token akses tidak ditemukan.' });
      setNeedsDriveAuth(true);
      return;
    }

    setIsUploadingSilabusToDrive(true);
    try {
      const fileName = `Silabus_${silabusGrade}_${silabusTopic.replace(/\s+/g, '_')}`;
      let blob;
      if (silabusExportFormat === 'pdf') {
        blob = await exportPDF('silabus-result-content', fileName, false);
      } else {
        blob = await exportDOCX('silabus-result-content', fileName, false);
      }

      if (!blob) throw new Error(`Gagal menghasilkan file ${silabusExportFormat.toUpperCase()}`);

      await uploadToDrive(token, `${fileName}.${silabusExportFormat}`, blob);
      setStatus({ type: 'success', message: `Silabus (.${silabusExportFormat}) berhasil disimpan ke Google Drive!` });
    } catch (err: any) {
      setStatus({ type: 'error', message: `Gagal simpan ke Drive: ${err.message}` });
    } finally {
      setIsUploadingSilabusToDrive(false);
    }
  };

  const handleBankSoalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBankSoalFile(file);
    setIsExtractingBankSoalFile(true);
    setStatus({ type: 'success', message: `Mengekstrak teks dari ${file.name}...` });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      setBankSoalFileText(data.text);
      if (data.text) {
        setStatus({ type: 'success', message: 'Teks berhasil diekstrak! AI siap membuat soal dari dokumen ini.' });
      }
    } catch (err) {
      console.error('Extraction error:', err);
      setStatus({ type: 'error', message: 'Gagal mengekstrak teks dokumen.' });
    } finally {
      setIsExtractingBankSoalFile(false);
    }
  };

  const handleExportBankSoalJSON = () => {
    if (bankSoalQuestions.length === 0) return;
    const blob = new Blob([JSON.stringify(bankSoalQuestions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BankSoal_${bankSoalTopic.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatus({ type: 'success', message: 'Bank Soal berhasil diekspor ke JSON.' });
  };

  const handleExportBankSoalCSV = () => {
    if (bankSoalQuestions.length === 0) return;
    
    const headers = ['Soal', 'A', 'B', 'C', 'D', 'Kunci', 'Pembahasan', 'Level', 'Subtopik', 'Tag'];
    const rows = bankSoalQuestions.map(q => [
      q.question,
      q.options.A,
      q.options.B,
      q.options.C,
      q.options.D,
      q.answer,
      q.explanation,
      q.level,
      q.subtopic || '',
      (q.tags || []).join('; ')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BankSoal_${bankSoalTopic.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatus({ type: 'success', message: 'Bank Soal berhasil diekspor ke CSV.' });
  };

  const handleGenerateBankSoal = async () => {
    if (!bankSoalTopic && !bankSoalFileText) {
      setStatus({ type: 'error', message: 'Harap tentukan topik atau unggah dokumen.' });
      return;
    }
    setIsGeneratingBankSoal(true);
    setBankSoalResult(null);
    setBankSoalQuestions([]);

    try {
      const prompt = `Anda adalah "IPS Maestro", pakar evaluasi pendidikan dan pembuat soal HOTS (Higher Order Thinking Skills) untuk tingkat SMP di Indonesia.
      ${bankSoalFileText ? `Berikut adalah teks dokumen yang diunggah:\n---\n${bankSoalFileText.substring(0, 10000)}\n---\n` : ''}
      
      TUGAS:
      ${bankSoalFileText 
        ? 'Ekstrak soal-soal yang ada dalam dokumen tersebut dan ubah menjadi level HOTS jika perlu, ATAU buatkan soal HOTS baru berdasarkan materi dalam dokumen tersebut.' 
        : `Buatkan ${bankSoalCount} soal HOTS baru dengan topik "${bankSoalTopic}".`
      }
      
      JUMLAH SOAL: ${bankSoalCount}.
      KELAS: ${bankSoalGrade}.
      TOPIK: ${bankSoalTopic}.
      
      KRITERIA SOAL:
      1. Level HOTS (Minimal C4, C5, atau C6).
      2. Harus ada STIMULUS (teks, data, atau kasus).
      3. Pilihan jawaban A, B, C, D yang berkualitas.
      4. Kunci jawaban dan pembahasan lengkap.
      
      PENTING: JANGAN BERIKAN TEKS PENGANTAR. KELUARKAN HANYA JSON ARRAY.
      
      FORMAT JSON:
      [
        {
          "question": "teks soal...",
          "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
          "answer": "A/B/C/D",
          "explanation": "pembahasan...",
          "level": "C4/C5/C6",
          "subtopic": "nama subtopik/kelompok soal",
          "tags": ["tag1", "tag2"]
        }
      ]`;

      const response = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          systemInstruction: 'Anda adalah pakar pembuat soal HOTS IPS. HANYA keluarkan JSON array murni tanpa format markdown.' 
        })
      });

      const data = await response.json();
      const cleanJson = data.text.replace(/```json|```/g, '').trim();
      const questions = JSON.parse(cleanJson);
      
      setBankSoalQuestions(questions);
      setBankSoalResult(qToMarkdown(questions));
      setStatus({ type: 'success', message: 'Bank Soal HOTS berhasil diproses!' });
    } catch (err) {
      console.error('Bank Soal AI error:', err);
      setStatus({ type: 'error', message: 'Gagal membuat Bank Soal. Pastikan dokumen tidak terlalu besar.' });
    } finally {
      setIsGeneratingBankSoal(false);
    }
  };

  const qToMarkdown = (questions: any[]) => {
    return questions.map((q, idx) => `
### Soal No. ${idx + 1}
**Level:** ${q.level}

${q.question}

A. ${q.options.A}
B. ${q.options.B}
C. ${q.options.C}
D. ${q.options.D}

---
**Kunci Jawaban:** ${q.answer}

**Pembahasan:**
${q.explanation}
`).join('\n\n');
  };

  const handleSaveBankSoalToDrive = async () => {
    if (needsDriveAuth) {
      await handleLogin();
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setStatus({ type: 'error', message: 'Token akses tidak ditemukan.' });
      setNeedsDriveAuth(true);
      return;
    }

    setIsUploadingBankSoalToDrive(true);
    try {
      const pdfBlob = await exportPDF('bank-soal-result-content', `BankSoal_${bankSoalGrade}_${bankSoalTopic.replace(/\s+/g, '_')}`, false);
      if (!pdfBlob) throw new Error('Gagal menghasilkan file PDF');

      await uploadToDrive(token, `BankSoal_Maestro_${bankSoalTopic}.pdf`, pdfBlob);
      setStatus({ type: 'success', message: 'Bank Soal berhasil disimpan ke Google Drive!' });
    } catch (err: any) {
      setStatus({ type: 'error', message: `Gagal simpan ke Drive: ${err.message}` });
    } finally {
      setIsUploadingBankSoalToDrive(false);
    }
  };

  const SidebarItem = ({ id, icon: Icon, label, color }: { id: Tab, icon: any, label: string, color: string }) => {
    const isMainAccent = id === 'beranda';
    const activeColor = isMainAccent ? accentColor : color;
    
    return (
      <button 
        onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }}
        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
          activeTab === id 
            ? `bg-${activeColor}-500 text-white shadow-lg shadow-${activeColor}-100 dark:shadow-none` 
            : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
      >
        <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === id ? 'text-white' : `text-${activeColor}-500`}`} />
        <span className="font-bold text-sm tracking-tight">{label}</span>
        {activeTab === id && (
          <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
        )}
      </button>
    );
  };

  return (
    <>
      <AnimatePresence>
        {isLoadingApp && (
          <motion.div 
            initial={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900 text-white"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col items-center gap-8 px-8 text-center"
            >
              <div className={`w-24 h-24 bg-${accentColor}-600 rounded-[32px] flex items-center justify-center shadow-2xl shadow-${accentColor}-500/40 relative`}>
                <Sparkles className="w-12 h-12 text-white animate-pulse" />
                <div className={`absolute -inset-4 border-4 border-${accentColor}-500/20 rounded-[48px] animate-[ping_3s_infinite]`}></div>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-4xl font-black tracking-tighter">IPS MAESTRO <span className="text-slate-500 text-2xl font-light">v2.1</span></h1>
                <div className="h-1 w-24 bg-gradient-to-r from-transparent via-slate-500 to-transparent mx-auto"></div>
              </div>

              <div className="max-w-md bg-white/5 backdrop-blur-md p-8 rounded-[40px] border border-white/10 shadow-xl">
                <p className="text-xl font-medium leading-relaxed italic text-slate-300">"{randomQuote}"</p>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col md:flex-row ${activeFont} selection:bg-${accentColor}-100 dark:selection:bg-${accentColor}-900 selection:text-${accentColor}-900 dark:selection:text-${accentColor}-100 transition-colors duration-300`}>
      {/* Mobile Header */}
      <div className={`md:hidden flex items-center justify-between p-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} border-b sticky top-0 z-50`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 bg-${accentColor}-600 rounded-xl flex items-center justify-center shadow-lg shadow-${accentColor}-100 dark:shadow-none`}>
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <span className={`font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>IPS MAESTRO</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-500">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed md:relative inset-0 z-40 md:z-auto transition-transform duration-500 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
        <div className={`relative w-72 h-full ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-2xl shadow-slate-200'} border-r p-8 flex flex-col`}>
          <div className="hidden md:flex items-center gap-4 mb-12 px-2">
            <div className={`w-12 h-12 bg-${accentColor}-600 rounded-2xl flex items-center justify-center shadow-xl shadow-${accentColor}-200 dark:shadow-none rotate-3`}>
              <Sparkles className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className={`font-black text-xl tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>IPS MAESTRO</h1>
              <p className={`text-[10px] font-bold text-${accentColor}-500 uppercase tracking-widest mt-1`}>Guru Digital v2.1</p>
            </div>
          </div>

          <div className="space-y-2 flex-1">
            <SidebarItem id="beranda" icon={LayoutGrid} label="Dashboard" color={accentColor} />
            <SidebarItem id="lkpd" icon={FileSpreadsheet} label="LKPD Generator" color="emerald" />
            <SidebarItem id="chatbot" icon={MessageSquare} label="Diskusi AI" color="rose" />
            <SidebarItem id="rpp" icon={FileText} label="RPP Creator" color="blue" />
            <SidebarItem id="silabus" icon={LayoutList} label="Silabus Generator" color="teal" />
            <SidebarItem id="materi" icon={FolderRoot} label="Manajemen Materi" color="sky" />
            <SidebarItem id="bank_soal" icon={ClipboardList} label="Bank Soal" color="slate" />
            <SidebarItem id="jurnal" icon={PenLine} label="Jurnal Guru" color="amber" />
          </div>

          <div className={`mt-auto space-y-2 pt-8 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-bold text-sm transition-all ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
              <div className="flex items-center gap-4">
                {isDarkMode ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                {isDarkMode ? 'Mode Gelap' : 'Mode Terang'}
              </div>
              <div className={`w-10 h-5 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </button>
            <button onClick={() => setActiveTab('pengaturan')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'pengaturan' ? (isDarkMode ? 'bg-white text-slate-900' : 'bg-slate-900 text-white') : (isDarkMode ? 'text-slate-500 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50')}`}>
              <Settings className="w-5 h-5" /> Pengaturan
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar">
        {/* Status Toast */}
        <AnimatePresence>
          {status.type && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className={`fixed top-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border ${
                status.type === 'success' 
                  ? (isDarkMode ? 'bg-emerald-950 border-emerald-900 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-800') 
                  : (isDarkMode ? 'bg-rose-950 border-rose-900 text-rose-400' : 'bg-rose-50 border-rose-100 text-rose-800')
              }`}
            >
              {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-bold text-sm">{status.message}</span>
              <button onClick={() => setStatus({ type: null, message: '' })} className="ml-4 p-1 hover:bg-white/50 rounded-lg"><X className="w-4 h-4" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTab === 'beranda' && (
            <motion.div key="beranda" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Selamat Datang Mewah, <span className={`text-${accentColor}-600 dark:text-${accentColor}-400`}>Bapak/Ibu Guru!</span></h2>
                  <p className={`font-medium mt-2 text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Pilih peralatan mengajar cerdas Anda hari ini.</p>
                </div>
                <div className="flex -space-x-4">
                  {[1,2,3].map(i => <div key={i} className={`w-12 h-12 rounded-full border-4 ${isDarkMode ? 'border-slate-900 bg-slate-800' : 'border-white bg-slate-200'} overflow-hidden shadow-sm`} />)}
                  <div className={`w-12 h-12 rounded-full border-4 ${isDarkMode ? 'border-slate-900 bg-indigo-950' : 'border-white bg-indigo-50'} flex items-center justify-center shadow-sm`}>
                    <Plus className={`w-5 h-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Promo Card */}
                {(() => {
                  const gradients: Record<string, string> = {
                    indigo: 'from-indigo-600 to-violet-700',
                    emerald: 'from-emerald-600 to-teal-700',
                    rose: 'from-rose-600 to-pink-700',
                    amber: 'from-amber-500 to-orange-600',
                    blue: 'from-blue-600 to-indigo-700',
                    violet: 'from-violet-600 to-purple-700',
                    pink: 'from-pink-600 to-rose-700',
                    sky: 'from-sky-600 to-blue-700',
                    orange: 'from-orange-500 to-red-600',
                    teal: 'from-teal-600 to-emerald-700',
                  };
                  const currentGradient = gradients[accentColor] || gradients.indigo;
                  
                  return (
                    <div className={`lg:col-span-2 bg-gradient-to-br ${currentGradient} rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-${accentColor}-200 dark:shadow-none group`}>
                      <div className="relative z-10 max-w-lg">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black tracking-widest uppercase mb-6">
                          <Sparkles className="w-3 h-3" /> Baru: LKPD Generator
                        </div>
                        <h3 className="text-4xl font-black mb-4 leading-tight tracking-tight">Buat Lembar Kerja Siswa Dalam Detik!</h3>
                        <p className="text-white/80 font-bold text-lg mb-8 leading-relaxed">Hemat waktu berjam-jam. Biarkan AI merancang LKPD yang estetik dan sesuai Kurikulum Merdeka untuk Anda.</p>
                        <button onClick={() => setActiveTab('lkpd')} className={`group/btn flex items-center gap-3 px-8 py-4 bg-white text-${accentColor}-600 rounded-2xl font-black text-sm shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95`}>
                          Mulai Sekarang <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </div>
                      <Sparkles className="absolute -bottom-10 -right-10 w-80 h-80 text-white/10 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
                    </div>
                  );
                })()}

                {/* Stats / Mini Card */}
                <div className={`bg-white dark:bg-slate-900 rounded-[40px] p-10 border ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} shadow-xl shadow-slate-100 dark:shadow-none flex flex-col`}>
                  <div className="w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-rose-100 dark:shadow-none mb-8 self-end -mr-4 -mt-4 rotate-6">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <h4 className={`text-2xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Punya Pertanyaan?</h4>
                  <p className={`font-bold mb-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Diskusikan materi IPS atau strategi mengajar dengan asisten AI Maestro.</p>
                  <button onClick={() => setActiveTab('chatbot')} className={`mt-auto w-full py-4 ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-900 hover:bg-slate-800'} text-white rounded-2xl font-bold transition-colors shadow-lg`}>Buka Chatbot AI</button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'lkpd' && (
            <motion.div key="lkpd" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <header className="mb-10 text-center md:text-left">
                <h2 className="text-4xl font-black text-slate-800 tracking-tight">LKPD <span className="text-emerald-600">Generator</span></h2>
                <p className="text-slate-500 font-medium text-lg mt-2">Rancang Lembar Kerja Peserta Didik profesional untuk siswa SMP.</p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Form */}
                <div className="lg:col-span-4 bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-100 space-y-6 sticky top-8">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 italic">Topik / Materi Pembelajaran</label>
                    <textarea 
                      value={lkpdTopic} onChange={(e) => setLkpdTopic(e.target.value)}
                      placeholder="Contoh: Dampak Interaksi Antar Ruang di Asia..."
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all min-h-[120px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 italic">Tingkat Kelas</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['VII', 'VIII', 'IX'].map(g => (
                        <button 
                          key={g} onClick={() => setLkpdGrade(g)}
                          className={`py-3 rounded-xl font-black text-xs transition-all border-2 ${lkpdGrade === g ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 italic">Tipe Aktivitas</label>
                    <select 
                      value={lkpdType} onChange={(e) => setLkpdType(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all shadow-sm"
                    >
                      <option>Literasi & Analisis</option>
                      <option>Investigasi Sejarah</option>
                      <option>Studi Kasus Ekonomi</option>
                      <option>Observasi Geografi</option>
                      <option>Pemecahan Masalah Sosio</option>
                      <option>Project Based Learning</option>
                    </select>
                  </div>

                  <button 
                    onClick={handleGenerateLKPD} disabled={!lkpdTopic || isGeneratingLkpd}
                    className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl shadow-emerald-100 hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isGeneratingLkpd ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    Buat LKPD Maestro
                  </button>
                </div>

                {/* Result */}
                <div className="lg:col-span-8">
                  {lkpdResult ? (
                    <div className="space-y-6">
                      <div className={`flex justify-between items-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} p-4 rounded-2xl border`}>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">Preview LKPD Maestro</span>
                          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            {['pdf', 'docx'].map((fmt) => (
                              <button
                                key={fmt} onClick={() => setLkpdExportFormat(fmt as 'pdf' | 'docx')}
                                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${lkpdExportFormat === fmt ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                {fmt}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={handleSaveToDrive} disabled={isUploadingToDrive}
                            className={`flex items-center gap-2 px-5 py-2.5 ${isDarkMode ? 'bg-indigo-900 text-indigo-100 hover:bg-indigo-800' : 'bg-indigo-500 text-white hover:bg-indigo-600'} rounded-xl text-xs font-bold shadow-lg transition-all disabled:opacity-50`}
                          >
                            {isUploadingToDrive ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
                            Simpan ke Drive
                          </button>
                          <button 
                            onClick={() => {
                              const fileName = `LKPD_${lkpdGrade}_${lkpdTopic.substring(0, 20)}`;
                              if (lkpdExportFormat === 'pdf') exportPDF('lkpd-content', fileName);
                              else exportDOCX('lkpd-content', fileName);
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-100 transition-all"
                          >
                            <Download className="w-4 h-4" /> Download {lkpdExportFormat.toUpperCase()}
                          </button>
                        </div>
                      </div>

                      <div id="lkpd-content" className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} p-12 rounded-[40px] border shadow-2xl shadow-slate-100 dark:shadow-none min-h-[800px] relative`}>
                         <div id="lkpd-result-content">
                           {/* Header Decoration */}
                           <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-[40px]" />
                           
                           <div className={`prose ${isDarkMode ? 'prose-invert' : 'prose-slate'} max-w-none prose-headings:font-black prose-strong:text-emerald-700`}>
                             <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" /> }}>{lkpdResult}</ReactMarkdown>
                           </div>

                           {/* Footer Decoration */}
                           <div className={`mt-12 pt-8 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} flex justify-between items-end opacity-40 italic text-[10px]`}>
                             <div>Goresan Pena Digital: IPS Maestro AI</div>
                             <div className="font-bold tracking-widest uppercase">Edisi Merdeka {new Date().getFullYear()}</div>
                           </div>
                         </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border-4 border-dashed border-slate-100 rounded-[40px] h-full min-h-[400px] flex flex-col items-center justify-center p-12 text-center group">
                      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                        <BookOpen className="w-10 h-10 text-slate-300" />
                      </div>
                      <h5 className="text-xl font-black text-slate-400">Belum Ada LKPD Dibuat</h5>
                      <p className="max-w-xs text-slate-400 font-bold text-sm mt-2 opacity-70">Gunakan formulir disamping untuk merancang lembar kerja siswa yang kreatif dalam sekejap.</p>
                      {isGeneratingLkpd && (
                        <div className="mt-12 flex flex-col items-center">
                          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
                          <span className="text-emerald-600 font-black text-xs uppercase tracking-widest animate-pulse">Meracik Materi...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'chatbot' && (
            <motion.div key="chatbot" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col h-[calc(100vh-140px)]">
              <header className="mb-6 flex justify-between items-end">
                <div>
                  <h2 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Diskusi <span className="text-rose-500">AI Maestro</span></h2>
                  <p className={`font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Asisten cerdas untuk materi, strategi, dan pedagogi guru IPS.</p>
                </div>
                <button onClick={() => setChatMessages([])} className="text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors mb-2">Hapus Chat</button>
              </header>

              <div className={`flex-1 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} rounded-[32px] shadow-2xl shadow-slate-100 dark:shadow-none border flex flex-col overflow-hidden`}>
                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar">
                  {chatMessages.map(msg => (
                    <motion.div key={msg.id} initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-6 rounded-[28px] ${msg.role === 'user' ? `bg-${accentColor}-600 text-white rounded-tr-none shadow-xl shadow-${accentColor}-100 dark:shadow-none` : (isDarkMode ? 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700' : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100')}`}>
                        <div className="prose prose-sm max-w-none text-inherit prose-p:leading-relaxed prose-strong:text-inherit">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" /> }}>{msg.content}</ReactMarkdown>
                        </div>
                        <div className={`text-[9px] mt-4 font-black uppercase tracking-widest opacity-40 ${msg.role === 'user' ? 'text-white' : 'text-slate-400'}`}>
                          {msg.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {msg.role === 'user' ? 'Saya' : 'Maestro AI'}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {isSendingChat && (
                    <div className="flex justify-start">
                      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} p-6 rounded-[28px] rounded-tl-none border`}>
                        <div className="flex gap-2">
                          {[0, 0.2, 0.4].map(d => <motion.div key={d} animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: d }} className="w-1.5 h-1.5 bg-rose-400 rounded-full" />)}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className={`p-8 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'} border-t relative`}>
                  <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <div className="relative flex-1 group">
                      <input 
                        value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                        placeholder="Tanyakan materi atau ide ice breaking..."
                        className={`w-full ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'} border-2 rounded-[20px] px-8 py-5 text-sm font-bold focus:outline-none focus:border-rose-500 transition-all shadow-sm pr-16`}
                      />
                      <button 
                        onClick={handleSendChat} disabled={!chatInput.trim() || isSendingChat}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-3.5 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-200 hover:scale-105 active:scale-95 transition-all opacity-0 group-focus-within:opacity-100 ${chatInput.trim() ? 'opacity-100' : ''}`}
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-center text-slate-400 mt-6 font-black uppercase tracking-[0.2em] italic">Edisi Pedagogi • Diterjemahkan Oleh Hati AI</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'pengaturan' && (
            <motion.div key="pengaturan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-12 py-8">
              <header className="text-center">
                <div className={`w-24 h-24 ${isDarkMode ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'} rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-2xl rotate-12`}>
                  <Settings className="w-10 h-10" />
                </div>
                <h2 className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Pusat Kendali Maestro</h2>
                <p className={`font-bold mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Kustomisasi asisten mengajar digital Anda.</p>
              </header>

              <div className="grid gap-8">
                {/* Profile Section */}
                <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} p-8 rounded-[32px] border shadow-xl shadow-slate-50 dark:shadow-none flex items-center justify-between group hover:border-indigo-100 transition-all`}>
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 ${isDarkMode ? 'bg-slate-800' : 'bg-indigo-50'} rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform`}>
                      <PenLine className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className={`font-black uppercase tracking-widest text-xs mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-800'}`}>Identitas Guru</h4>
                      <p className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-500'}`}>Catur Pamungkas, S.Pd.,Gr.</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">IPS SMP • Guru Penggerak</p>
                    </div>
                  </div>
                  <button className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-indigo-600 hover:text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-900 hover:text-white'}`}>Ubah</button>
                </div>

                {/* Theme Customizer Section */}
                <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} p-10 rounded-[40px] border shadow-2xl shadow-slate-100 dark:shadow-none space-y-10`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 bg-${accentColor}-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-${accentColor}-100 dark:shadow-none`}>
                      <Palette className="w-6 h-6" />
                    </div>
                    <h4 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Tema & Tampilan</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Dark Mode Toggle */}
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Mode Visual</label>
                      <div className="flex grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => setIsDarkMode(false)} 
                          className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${!isDarkMode ? `border-${accentColor}-500 bg-${accentColor}-50 dark:bg-${accentColor}-950/20` : 'border-slate-100 dark:border-slate-800 bg-transparent opacity-60'}`}
                        >
                          <Sun className={`w-6 h-6 ${!isDarkMode ? `text-${accentColor}-600` : 'text-slate-400'}`} />
                          <span className={`text-xs font-black uppercase tracking-widest ${!isDarkMode ? `text-${accentColor}-700` : 'text-slate-500'}`}>Terang</span>
                        </button>
                        <button 
                          onClick={() => setIsDarkMode(true)} 
                          className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${isDarkMode ? `border-${accentColor}-500 bg-${accentColor}-950/20` : 'border-slate-100 bg-transparent opacity-60'}`}
                        >
                          <Moon className={`w-6 h-6 ${isDarkMode ? `text-${accentColor}-400` : 'text-slate-400'}`} />
                          <span className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? `text-${accentColor}-400` : 'text-slate-500'}`}>Gelap</span>
                        </button>
                      </div>
                    </div>

                    {/* Accent Color Picker */}
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Warna Aksen Maestro</label>
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                        {[
                          { id: 'indigo', hex: '#6366f1' },
                          { id: 'emerald', hex: '#10b981' },
                          { id: 'rose', hex: '#f43f5e' },
                          { id: 'amber', hex: '#f59e0b' },
                          { id: 'blue', hex: '#3b82f6' },
                          { id: 'violet', hex: '#8b5cf6' },
                          { id: 'pink', hex: '#ec4899' },
                          { id: 'sky', hex: '#0ea5e9' },
                          { id: 'orange', hex: '#f97316' },
                          { id: 'teal', hex: '#14b8a6' }
                        ].map(color => (
                          <button 
                            key={color.id} 
                            onClick={() => setAccentColor(color.id)}
                            className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all border-4 relative ${accentColor === color.id ? 'border-white dark:border-slate-800 scale-110 shadow-lg shadow-black/10' : 'border-transparent opacity-50 hover:opacity-100'}`}
                            style={{ backgroundColor: color.hex }}
                          >
                            {accentColor === color.id && <motion.div layoutId="color-check" className="w-2 h-2 bg-white rounded-full" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Selector */}
                    <div className="space-y-4 md:col-span-2 pt-6 border-t border-slate-100 dark:border-slate-800">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Tipografi (Font) Maestro</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { id: 'font-inter', label: 'Inter (Standar)', desc: 'Modern & Bersih' },
                          { id: 'font-outfit', label: 'Outfit (Modern)', desc: 'Geometris & Ramah' },
                          { id: 'font-space', label: 'Space Grotesk', desc: 'Teknis & Tajam' },
                          { id: 'font-playfair', label: 'Playfair Display', desc: 'Klasik & Mewah' }
                        ].map(font => (
                          <button 
                            key={font.id} 
                            onClick={() => setActiveFont(font.id)}
                            className={`flex flex-col p-5 rounded-[28px] border-2 transition-all text-left ${activeFont === font.id ? `border-${accentColor}-500 bg-${accentColor}-50/50 dark:bg-${accentColor}-950/20` : 'border-slate-100 dark:border-slate-800 bg-transparent opacity-60 hover:opacity-100'}`}
                          >
                            <span className={`text-lg font-black ${font.id} ${activeFont === font.id ? `text-${accentColor}-600 dark:text-${accentColor}-400` : 'text-slate-700 dark:text-slate-300'}`}>Aa</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest mt-2 ${activeFont === font.id ? `text-${accentColor}-700 dark:text-${accentColor}-200` : 'text-slate-500'}`}>{font.label}</span>
                            <span className="text-[10px] font-bold text-slate-400 mt-0.5">{font.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Assistant Configuration Section */}
                <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-2xl shadow-slate-100 dark:shadow-none'} p-10 rounded-[40px] border space-y-10`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-100 dark:shadow-none">
                      <Zap className="w-6 h-6" />
                    </div>
                    <h4 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Konfigurasi AI Assistant</h4>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <div className="flex justify-between items-end mb-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Temperatur AI (Kreativitas)</label>
                        <span className={`text-xs font-black px-3 py-1 rounded-lg ${isDarkMode ? 'bg-slate-800 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>{aiTemperature.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-[10px] font-bold text-slate-400">Formal</span>
                        <input 
                          type="range" min="0" max="1" step="0.1" 
                          value={aiTemperature} onChange={(e) => setAiTemperature(parseFloat(e.target.value))}
                          className={`flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500`}
                        />
                        <span className="text-[10px] font-bold text-slate-400">Kreatif</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-4 font-medium leading-relaxed italic">*Nilai rendah untuk jawaban yang lebih berfakta dan konsisten. Nilai tinggi untuk jawaban yang lebih kreatif dan variatif.</p>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic mb-4">Default System Prompt Chatbot</label>
                      <textarea 
                        value={aiChatSystemPrompt} onChange={(e) => setAiChatSystemPrompt(e.target.value)}
                        placeholder="Instruksi sistem untuk chatbot AI..."
                        className={`w-full ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 shadow-inner'} border-2 rounded-2xl p-6 text-sm font-bold focus:outline-none focus:border-rose-500 transition-all min-h-[200px] leading-relaxed`}
                      />
                      <div className="mt-4 flex justify-end">
                        <button 
                          onClick={() => {
                            if (confirm('Kembalikan ke pengaturan awal?')) {
                              setAiChatSystemPrompt('Anda adalah IPS Maestro Chatbot, asisten kecerdasan buatan paling cerdas dan inspiratif bagi para pendidik Ilmu Pengetahuan Sosial (IPS) tingkat SMP di seluruh Indonesia.\n\n**Identitas & Persona:**\n- Anda adalah refleksi dari seorang Guru Maestro: ahli, bijak, hangat, dan selalu memberikan solusi pedagogis yang inovatif.\n- Anda memiliki pemahaman mendalam tentang Kurikulum Merdeka, Standar Isi SMP, dan kearifan lokal Indonesia.\n- Gaya komunikasi Anda: Profesional namun ramah, inspiratif, menggunakan Bahasa Indonesia yang baku namun tetap luwes (tidak kaku).\n\n**Tugas Utama:**\n1. **Pendamping Perencanaan:** Membantu guru menyusun rancangan pembelajaran (RPP/Modul Ajar), menentukan metode pengajaran (PBL, Discovery Learning, dll.), dan menyusun strategi penilaian.\n2. **Narasumber Materi:** Memberikan penjelasan materi geografi, sejarah, ekonomi, dan sosiologi dengan akurasi tinggi dan relevansi yang kuat dengan fenomena terkini di Indonesia.\n3. **Penyedia Ide Kreatif:** Memberikan ide aktivitas belajar yang aktif, interaktif, dan berpusat pada siswa (student-centered).\n4. **Instruktur HOTS:** Selalu mendorong penulisan soal dan aktivitas yang melatih Higher Order Thinking Skills.\n\n**Prinsip Jawaban:**\n- **Konteks Indonesia:** Selalu hubungkan jawaban dengan contoh nyata di Indonesia (misal: ekonomi pasar tradisional, sejarah kemerdekaan nasional, geografi kepulauan).\n- **Struktur Markdown:** Gunakan heading, bullet points, dan blok kode agar jawaban sangat mudah dibaca.\n- **Pedagogis:** Jika guru bertanya tentang masalah di kelas, berikan saran yang didukung teori pendidikan namun praktis.\n- **Interaktif:** Akhiri jawaban dengan pertanyaan pemantik atau saran langkah selanjutnya.');
                            }
                          }}
                          className="text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors flex items-center gap-2"
                        >
                          <RotateCcw className="w-3 h-3" /> Reset ke Default
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Section */}
                <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-xl shadow-slate-50'} p-8 rounded-[32px] border flex items-center justify-between group transition-all text-left`}>
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 ${isDarkMode ? 'bg-slate-800' : 'bg-blue-50'} rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform`}>
                      <HardDrive className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className={`font-black uppercase tracking-widest text-xs mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-800'}`}>Integrasi Google Drive</h4>
                      <p className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-500'}`}>
                        {needsDriveAuth ? 'Belum Terhubung' : (user?.email || 'Terhubung')}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">Untuk Simpan LKPD & RPP Otomatis</p>
                    </div>
                  </div>
                  {needsDriveAuth ? (
                    <button 
                      onClick={handleLogin}
                      className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isDarkMode ? 'bg-indigo-900 text-indigo-100 hover:bg-indigo-700' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100'}`}
                    >
                      Hubungkan
                    </button>
                  ) : (
                    <button 
                      onClick={logout}
                      className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-rose-600 hover:text-white' : 'bg-slate-50 text-slate-400 hover:bg-rose-600 hover:text-white'}`}
                    >
                      Putus
                    </button>
                  )}
                </div>

                {/* Meta Status Section */}
                <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-xl shadow-slate-50'} p-8 rounded-[32px] border flex items-center justify-between group hover:border-rose-100 transition-all text-left`}>
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 ${isDarkMode ? 'bg-slate-800' : 'bg-rose-50'} rounded-2xl flex items-center justify-center group-hover:-rotate-12 transition-transform`}>
                      <RotateCcw className="w-6 h-6 text-rose-600" />
                    </div>
                    <div>
                      <h4 className={`font-black uppercase tracking-widest text-xs mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-800'}`}>Penyimpanan Maestro</h4>
                      <p className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-500'} italic`}>Sinkronisasi Cloud Aktif</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Live</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'jurnal' && (
            <motion.div key="jurnal" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12">
              <header className="flex justify-between items-end gap-6 flex-wrap">
                <div>
                  <h2 className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Jurnal <span className="text-amber-500">Guru Maestro</span></h2>
                  <p className={`font-medium mt-2 text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Dokumentasikan aktivitas mengajar Anda secara rapi dan profesional.</p>
                </div>
                <div className="flex items-center gap-4">
                   <button 
                    onClick={handleExportJournalCSV}
                    className={`flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-700 shadow-xl shadow-amber-100 dark:shadow-none transition-all transition-transform active:scale-95`}
                   >
                     <Download className="w-4 h-4" /> Ekspor Jurnal
                   </button>
                   <div className={`px-4 py-2 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-100 text-slate-500'} text-xs font-black uppercase tracking-widest`}>
                     {journalEntries.length} Entri Tersimpan
                   </div>
                </div>
              </header>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
                <div className={`xl:col-span-4 ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-xl shadow-slate-100'} p-8 rounded-[40px] border space-y-6 sticky top-8 transition-colors`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white">
                      <PenLine className="w-5 h-5" />
                    </div>
                    <span className={`font-black text-sm uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Catat Jurnal Baru</span>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic px-1">Tanggal</label>
                      <input 
                        type="date" value={journalDate} onChange={(e) => setJournalDate(e.target.value)}
                        className={`w-full ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'} border-2 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-amber-500 transition-all`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic px-1">Kelas</label>
                        <select 
                          value={journalClass} onChange={(e) => setJournalClass(e.target.value)}
                          className={`w-full ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'} border-2 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-amber-500 transition-all`}
                        >
                          {['VII-A', 'VII-B', 'VII-C', 'VIII-A', 'VIII-B', 'VIII-C', 'IX-A', 'IX-B', 'IX-C'].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic px-1">Nama Guru</label>
                        <input 
                          type="text" value={journalTeacher} onChange={(e) => setJournalTeacher(e.target.value)}
                          className={`w-full ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'} border-2 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-amber-500 transition-all`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic px-1">Materi / Topik</label>
                      <input 
                        type="text" value={journalTopic} onChange={(e) => setJournalTopic(e.target.value)}
                        placeholder="Misal: Keragaman Budaya Bangsa"
                        className={`w-full ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'} border-2 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-amber-500 transition-all`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic px-1">Aktivitas Utama</label>
                      <textarea 
                        value={journalActivity} onChange={(e) => setJournalActivity(e.target.value)}
                        placeholder="Apa yang dilakukan di kelas hari ini?"
                        className={`w-full ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'} border-2 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-amber-500 transition-all min-h-[100px]`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic px-1">Catatan (Opsional)</label>
                      <textarea 
                        value={journalNotes} onChange={(e) => setJournalNotes(e.target.value)}
                        placeholder="Hambatan, refleksi, atau rencana tindak lanjut..."
                        className={`w-full ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'} border-2 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-amber-500 transition-all min-h-[80px]`}
                      />
                    </div>

                    <button 
                      onClick={handleAddJournalEntry}
                      className="w-full py-5 bg-amber-500 text-white rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl shadow-amber-100 dark:shadow-none hover:bg-amber-600 transition-all flex items-center justify-center gap-3"
                    >
                      <Plus className="w-5 h-5" /> Simpan Jurnal
                    </button>
                  </div>
                </div>

                <div className="xl:col-span-8 space-y-6">
                  {journalEntries.length === 0 ? (
                    <div className={`p-16 border-4 border-dashed ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} rounded-[40px] text-center`}>
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ClipboardList className="w-8 h-8 text-slate-300" />
                      </div>
                      <h4 className="text-xl font-bold text-slate-400">Belum Ada Entri Jurnal</h4>
                      <p className="text-slate-400 text-sm mt-2 font-medium opacity-60">Catatan aktivitas mengajar Anda akan muncul di sini secara berurutan.</p>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {journalEntries.map(entry => (
                        <motion.div 
                          layout key={entry.id} 
                          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                          className={`${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-xl shadow-slate-50'} p-8 rounded-[32px] border relative group hover:border-amber-200 transition-all`}
                        >
                          <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-4">
                                <span className={`px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-black rounded-lg uppercase tracking-wider`}>
                                  {entry.class}
                                </span>
                                <span className="text-slate-400 font-bold text-xs">{new Date(entry.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                              </div>
                              <h4 className={`text-xl font-black mb-3 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{entry.topic}</h4>
                              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} leading-relaxed font-medium mb-6`}>{entry.activity}</p>
                              {entry.notes && (
                                <div className={`p-4 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'} rounded-2xl italic text-xs font-medium text-slate-400 border-l-4 border-amber-500`}>
                                  Catatan: {entry.notes}
                                </div>
                              )}
                            </div>
                            <div className="md:text-right flex flex-col md:items-end justify-between border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-6 md:pt-0 md:pl-8">
                               <div>
                                 <h5 className={`text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1`}>Guru Pengampu</h5>
                                 <p className={`font-black text-xs ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{entry.teacher}</p>
                               </div>
                               <div className="flex items-center gap-3 mt-6">
                                  <button onClick={() => setStatus({ type: 'success', message: 'Fitur Edit segera hadir!' })} className="p-2 text-slate-400 hover:text-indigo-500 transition-colors">
                                    <PenLine className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDeleteJournalEntry(entry.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                                    <X className="w-5 h-5" />
                                  </button>
                               </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'materi' && (
            <motion.div key="materi" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              <header className="flex justify-between items-end gap-6 flex-wrap">
                <div>
                  <h2 className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Manajemen <span className="text-sky-500">Materi Maestro</span></h2>
                  <p className={`font-medium mt-2 text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Kelola, simpan, dan cari aset materi ajar Anda di satu tempat terpusat.</p>
                </div>
                <div className="flex items-center gap-4">
                   <div className={`px-4 py-2 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-100 text-slate-500'} text-xs font-black uppercase tracking-widest flex items-center gap-2`}>
                     <Zap className="w-3 h-3 text-amber-500" /> {offlineFileIds.size} Offline
                   </div>
                   <button 
                    onClick={handleCreateFolder}
                    className={`flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-700 shadow-xl shadow-amber-100 transition-all ${isCreatingFolder ? 'opacity-50 pointer-events-none' : ''}`}
                   >
                     {isCreatingFolder ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
                     Folder Baru
                   </button>
                   <label className={`flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-sky-700 shadow-xl shadow-sky-100 cursor-pointer transition-all ${isUploadingMaterial ? 'opacity-50 pointer-events-none' : ''}`}>
                     {isUploadingMaterial ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                     Unggah Materi
                     <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploadingMaterial} />
                   </label>
                </div>
              </header>

              <div className="space-y-8">
                <div className="flex items-center gap-6 flex-wrap">
                  <div className={`flex items-center gap-2 p-1 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-50'} rounded-2xl border`}>
                    <button 
                      onClick={() => setMateriView('drive')}
                      className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${materiView === 'drive' ? 'bg-sky-600 text-white shadow-lg shadow-sky-200' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <Cloud className="w-4 h-4" /> Drive
                    </button>
                    <button 
                      onClick={() => setMateriView('offline')}
                      className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${materiView === 'offline' ? 'bg-amber-600 text-white shadow-lg shadow-amber-200' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <Zap className="w-4 h-4" /> Offline
                    </button>
                  </div>

                  <div className={`flex items-center gap-4 p-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-50'} rounded-3xl border w-full max-w-xl`}>
                     <Search className="w-5 h-5 text-slate-400 ml-2" />
                     <input 
                      type="text" 
                      placeholder={materiView === 'drive' ? "Cari materi di Drive..." : "Cari materi offline..."}
                      value={materialSearch} 
                      onChange={(e) => setMaterialSearch(e.target.value)}
                      className="bg-transparent border-none w-full font-bold text-sm focus:outline-none placeholder:text-slate-400"
                     />
                  </div>

                  {materiView === 'drive' && folderStack.length > 0 && (
                    <button 
                      onClick={handleGoBack}
                      className={`flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all`}
                    >
                      <ChevronLeft className="w-4 h-4" /> Kembali
                    </button>
                  )}
                </div>

                {/* Breadcrumbs - Only show in Drive view */}
                {materiView === 'drive' && (
                  <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                    <button 
                      onClick={() => {
                        setCurrentFolderId('root');
                        setCurrentFolderName('Root');
                        setFolderStack([]);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentFolderId === 'root' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      <FolderRoot className="w-4 h-4" /> Root
                    </button>
                    {folderStack.map((folder, idx) => (
                      <React.Fragment key={folder.id}>
                        {folder.id !== 'root' && (
                          <>
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                            <button 
                              onClick={() => {
                                const newStack = folderStack.slice(0, idx);
                                setFolderStack(newStack);
                                setCurrentFolderId(folder.id);
                                setCurrentFolderName(folder.name);
                              }}
                              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              {folder.name}
                            </button>
                          </>
                        )}
                      </React.Fragment>
                    ))}
                    {currentFolderId !== 'root' && (
                      <>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                        <span className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
                          {currentFolderName}
                        </span>
                      </>
                    )}
                  </div>
                )}

                {needsDriveAuth ? (
                  <div className={`p-20 text-center border-4 border-dashed ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} rounded-[40px]`}>
                    <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/30 rounded-3xl flex items-center justify-center mx-auto mb-8">
                      <HardDrive className="w-10 h-10 text-indigo-500" />
                    </div>
                    <h3 className={`text-2xl font-black mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Google Drive Belum Terhubung</h3>
                    <p className="text-slate-400 font-bold max-w-md mx-auto mb-10 leading-relaxed">Hubungkan ke Google Drive untuk mengaktifkan fitur penyimpanan materi secara otomatis dan aman.</p>
                    <button onClick={handleLogin} className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
                      Hubungkan Sekarang
                    </button>
                  </div>
                ) : isFetchingMaterials ? (
                  <div className="flex flex-col items-center justify-center py-20 grayscale opacity-40">
                    <Loader2 className="w-10 h-10 animate-spin text-sky-500 mb-4" />
                    <p className="font-black text-xs uppercase tracking-widest">Sinkronisasi Materi...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {(materiView === 'drive' ? materials : offlineMaterials)
                      .filter(f => f.name.toLowerCase().includes(materialSearch.toLowerCase()))
                      .map(file => {
                        const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                        const isOffline = offlineFileIds.has(file.id);
                        
                        return (
                          <motion.div 
                            layout key={file.id} 
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            onClick={() => (isFolder && materiView === 'drive') ? handleNavigateFolder(file.id, file.name) : null}
                            className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-50'} rounded-[32px] border p-6 group hover:border-sky-300 transition-all ${isFolder ? 'cursor-pointer' : 'cursor-default'} overflow-hidden relative`}
                          >
                            <div className="aspect-square bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 overflow-hidden relative">
                               {isOffline && (
                                 <div className="absolute top-3 left-3 z-10 px-2 py-1 bg-amber-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                                    <Zap className="w-2 h-2 fill-current" /> Offline Ready
                                 </div>
                               )}
                               {syncingStatuses[file.id] === 'downloading' && (
                                 <div className="absolute top-3 right-3 z-10 px-2 py-1 bg-sky-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg border border-sky-400 focus-within:ring-2">
                                    <Loader2 className="w-2 h-2 animate-spin" /> Sedang Mengunduh...
                                 </div>
                               )}
                               {syncingStatuses[file.id] === 'finished' && (
                                 <div className="absolute top-3 right-3 z-10 px-2 py-1 bg-emerald-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                                    <CheckCircle2 className="w-2 h-2" /> Selesai
                                 </div>
                               )}
                               {syncingStatuses[file.id] === 'failed' && (
                                 <div className="absolute top-3 right-3 z-10 px-2 py-1 bg-rose-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                                    <AlertCircle className="w-2 h-2" /> Gagal Sinkron
                                 </div>
                               )}
                               {isFolder ? (
                                 <div className="flex flex-col items-center gap-3">
                                   <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl shadow-sm flex items-center justify-center">
                                     <FolderRoot className="w-8 h-8 text-amber-500" />
                                   </div>
                                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">FOLDER</span>
                                 </div>
                               ) : file.thumbnailLink ? (
                                 <img src={file.thumbnailLink} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                               ) : (
                                 <div className="flex flex-col items-center gap-3">
                                   <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl shadow-sm flex items-center justify-center">
                                     <File className={`w-6 h-6 ${file.mimeType.includes('pdf') ? 'text-rose-500' : 'text-sky-500'}`} />
                                   </div>
                                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{file.mimeType.split('/').pop()?.toUpperCase()}</span>
                                 </div>
                               )}
                               <div className="absolute inset-0 bg-sky-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePreviewMaterial(file);
                                    }}
                                    className="p-3 bg-white text-indigo-600 rounded-xl shadow-lg hover:scale-110 transition-transform"
                                    title="Pratinjau File"
                                  >
                                    <Eye className="w-5 h-5" />
                                  </button>
                                  {!isFolder && (
                                    <>
                                      {file.webViewLink && (
                                        <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" className="p-3 bg-white text-sky-600 rounded-xl shadow-lg hover:scale-110 transition-transform">
                                          <ExternalLink className="w-5 h-5" />
                                        </a>
                                      )}
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleOffline(file);
                                        }}
                                        className={`p-3 rounded-xl shadow-lg hover:scale-110 transition-all ${isOffline ? 'bg-amber-500 text-white' : 'bg-white text-slate-400'}`}
                                        title={isOffline ? 'Hapus dari Offline' : 'Simpan Offline'}
                                      >
                                        <Zap className={`w-5 h-5 ${isOffline ? 'fill-current' : ''}`} />
                                      </button>
                                      {isOffline && (
                                         <button 
                                           onClick={(e) => {
                                             e.stopPropagation();
                                             handleDownloadOffline(file.id);
                                           }}
                                           className="p-3 bg-white text-emerald-600 rounded-xl shadow-lg hover:scale-110 transition-transform"
                                           title="Unduh Offline"
                                         >
                                           <Download className="w-5 h-5" />
                                         </button>
                                      )}
                                    </>
                                  )}
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteMaterial(file.id);
                                    }} 
                                    className="p-3 bg-white text-rose-500 rounded-xl shadow-lg hover:scale-110 transition-transform"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                               </div>
                            </div>
                            <h4 className={`text-xs font-black truncate mb-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{file.name}</h4>
                            <div className="flex items-center gap-2">
                               {!isFolder && file.iconLink && <img src={file.iconLink} className="w-3 h-3 opacity-40" />}
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                 {isFolder ? 'Folder' : (materiView === 'offline' ? 'Offline Storage' : 'Drive Asset')}
                               </span>
                            </div>
                          </motion.div>
                        );
                      })}

                    {(materiView === 'drive' ? materials : offlineMaterials).length === 0 && !isFetchingMaterials && (
                       <div className="col-span-full py-20 text-center opacity-40">
                          <CloudOff className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                          <p className="text-xl font-black uppercase tracking-widest text-slate-400">
                             {materiView === 'drive' ? 'Tidak ada materi ditemukan' : 'Belum ada file untuk akses offline'}
                          </p>
                       </div>
                    )}
                  </div>
                )}

                {/* PDF/File Preview Overlay */}
                <AnimatePresence>
                  {previewFile && (
                    <motion.div 
                      key="file-preview-overlay"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-slate-900/90 backdrop-blur-md"
                      onClick={() => {
                        if (previewFile.url && previewFile.url.startsWith('blob:')) URL.revokeObjectURL(previewFile.url);
                        setPreviewFile(null);
                      }}
                    >
                      <motion.div 
                        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full h-full max-w-6xl bg-white dark:bg-slate-900 rounded-[40px] overflow-hidden flex flex-col relative shadow-2xl"
                      >
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white">
                              <File className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className={`text-sm font-black truncate max-w-[200px] md:max-w-md ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{previewFile.name}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{previewFile.mimeType}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              if (previewFile.url && previewFile.url.startsWith('blob:')) URL.revokeObjectURL(previewFile.url);
                              setPreviewFile(null);
                            }}
                            className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors text-slate-400 hover:text-rose-500"
                          >
                            <XCircle className="w-6 h-6" />
                          </button>
                        </div>
                        <div className="flex-1 bg-slate-50 dark:bg-slate-950 relative">
                          {previewFile.mimeType.includes('pdf') || previewFile.url.includes('drive.google.com') ? (
                            <iframe 
                              src={previewFile.url} 
                              className="w-full h-full border-none"
                              title="File Preview"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-center p-10">
                              <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-[40px] flex items-center justify-center mb-6">
                                <File className="w-16 h-16 text-slate-300" />
                              </div>
                              <h5 className="text-xl font-black text-slate-400 uppercase tracking-widest mb-2">Pratinjau Tidak Tersedia</h5>
                              <p className="text-sm font-bold text-slate-400 max-w-xs">{previewFile.mimeType} mungkin tidak didukung untuk pratinjau langsung. Silakan unduh file untuk melihat konten.</p>
                              <a 
                                href={previewFile.url} download={previewFile.name}
                                className="mt-8 px-8 py-4 bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none hover:scale-105 transition-transform"
                                target="_blank" rel="noopener noreferrer"
                              >
                                Unduh File
                              </a>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {activeTab === 'penilaian' && (
            <motion.div key="penilaian" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12">
              <header className="flex justify-between items-end gap-6 flex-wrap">
                <div>
                  <h2 className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Analisis <span className="text-rose-500">Penilaian Maestro</span></h2>
                  <p className={`font-medium mt-2 text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Visualisasikan perkembangan capaian belajar murid secara akurat.</p>
                </div>
                <div className="flex items-center gap-4">
                   <button 
                    onClick={() => setStatus({ type: 'success', message: 'Fitur Cetak segera hadir!' })}
                    className={`flex items-center gap-2 px-5 py-2.5 ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-white border border-slate-100 text-slate-600 shadow-sm'} rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all`}
                   >
                     <Download className="w-4 h-4" /> Ekspor Laporan
                   </button>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-50'} p-8 rounded-[32px] border`}>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rata-rata Kelas</p>
                  <h4 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{stats.avg}</h4>
                </div>
                <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-50'} p-8 rounded-[32px] border`}>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nilai Tertinggi</p>
                  <h4 className={`text-3xl font-black text-emerald-500`}>{stats.max}</h4>
                </div>
                <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-50'} p-8 rounded-[32px] border`}>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nilai Terendah</p>
                  <h4 className={`text-3xl font-black text-rose-500`}>{stats.min}</h4>
                </div>
                <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-50'} p-8 rounded-[32px] border`}>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Persentase Ketuntasan</p>
                  <h4 className={`text-3xl font-black text-blue-500`}>
                    {studentScores.length > 0 ? ((stats.passCount / studentScores.length) * 100).toFixed(0) : 0}%
                  </h4>
                </div>
              </div>

              {/* Tren Nilai Section */}
              <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-2xl shadow-slate-100'} p-10 rounded-[40px] border mb-10`}>
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className={`font-black text-xl ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Tren Capaian Nilai Rata-rata</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Progress Kolektif per Periode Assessment</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-rose-500" />
                       <span className="text-[10px] font-black text-slate-400 uppercase">Rata-rata</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 border-2 border-dashed border-slate-400 rounded-full" />
                       <span className="text-[10px] font-black text-slate-400 uppercase">Target KKM</span>
                    </div>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={scoreTrends}>
                      <defs>
                        <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                      <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 'bold', fontSize: 12 }} dy={10} />
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 'bold', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: isDarkMode ? '#0f172a' : '#fff' }}
                      />
                      <Area type="monotone" dataKey="avg" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorAvg)" />
                      <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                <div className={`xl:col-span-8 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-2xl shadow-slate-100'} p-10 rounded-[40px] border`}>
                  <div className="flex justify-between items-center mb-10">
                    <h3 className={`font-black text-xl ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Grafik Distribusi Nilai</h3>
                    <input 
                      type="text" value={assessmentTitle} onChange={(e) => setAssessmentTitle(e.target.value)}
                      className={`text-right bg-transparent border-none font-bold text-slate-400 focus:outline-none focus:text-rose-500 transition-colors italic text-sm`}
                    />
                  </div>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={studentScores}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 'bold', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 'bold', fontSize: 12 }} />
                        <Tooltip 
                          cursor={{ fill: isDarkMode ? '#1e293b' : '#f8fafc' }}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: isDarkMode ? '#0f172a' : '#fff' }}
                        />
                        <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                           {studentScores.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.score >= 75 ? '#10b981' : '#f43f5e'} />
                           ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className={`xl:col-span-4 space-y-6`}>
                   <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-100'} p-8 rounded-[40px] border`}>
                      <h3 className={`font-black text-sm uppercase tracking-widest mb-6 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Status Ketuntasan</h3>
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-500" />
                          <span className="text-[10px] font-black text-slate-400 uppercase">Tuntas</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-rose-500" />
                          <span className="text-[10px] font-black text-slate-400 uppercase">Belum</span>
                        </div>
                      </div>
                   </div>

                   <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-100'} p-8 rounded-[40px] border`}>
                      <h3 className={`font-black text-sm uppercase tracking-widest mb-6 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Input Nilai Cepat</h3>
                      <div className="space-y-4">
                        <input 
                          type="text" placeholder="Nama Murid" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)}
                          className={`w-full ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'} border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-rose-500 transition-all`}
                        />
                        <input 
                          type="number" placeholder="Nilai (0-100)" value={newStudentScore} onChange={(e) => setNewStudentScore(e.target.value)}
                          className={`w-full ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'} border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-rose-500 transition-all`}
                        />
                        <button 
                          onClick={handleAddScore}
                          className="w-full py-3 bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-all"
                        >
                          Tambah Nilai
                        </button>
                      </div>
                   </div>
                </div>
              </div>

              <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-2xl shadow-slate-50'} p-10 rounded-[40px] border overflow-hidden`}>
                 <h3 className={`font-black text-xl mb-8 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Daftar Nilai Siswa</h3>
                 <div className="overflow-x-auto">
                   <table className="w-full">
                     <thead>
                       <tr className={`text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                         <th className="pb-4 px-4 w-16 text-center">#</th>
                         <th className="pb-4 px-4">Nama Murid</th>
                         <th className="pb-4 px-4">Skor</th>
                         <th className="pb-4 px-4">Status</th>
                         <th className="pb-4 px-4 text-right">Aksi</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                       {studentScores.map((student, idx) => (
                         <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                           <td className="py-5 px-4 text-center font-black text-slate-300 text-xs">{idx + 1}</td>
                           <td className={`py-5 px-4 font-black text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{student.name}</td>
                           <td className={`py-5 px-4 font-black ${student.score >= 75 ? 'text-emerald-500' : 'text-rose-500'}`}>{student.score}</td>
                           <td className="py-5 px-4">
                             <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${student.score >= 75 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                               {student.score >= 75 ? 'Tuntas' : 'Remedial'}
                             </span>
                           </td>
                           <td className="py-5 px-4 text-right">
                             <button onClick={() => deleteScore(idx)} className="p-2 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100">
                               <X className="w-4 h-4" />
                             </button>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'bank_soal' && (
            <motion.div key="bank_soal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              <header>
                <h2 className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Bank Soal <span className="text-slate-500">HOTS Maestro</span></h2>
                <p className={`font-medium mt-2 text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Kembangkan instrumen penilaian berstandar tinggi untuk mengukur kemampuan berpikir kritis.</p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                <div className={`lg:col-span-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-100'} p-8 rounded-[40px] border space-y-8 sticky top-8`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-white">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <span className={`font-black text-sm uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Konfigurasi Soal</span>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic px-1">Sumber Dokumen (Opsional)</label>
                      <label className={`block w-full border-2 border-dashed ${bankSoalFile ? 'border-sky-500 bg-sky-50' : 'border-slate-200'} rounded-2xl p-6 text-center cursor-pointer transition-all hover:border-sky-400`}>
                        {isExtractingBankSoalFile ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
                            <span className="text-[10px] font-black uppercase text-slate-400">Mengekstrak...</span>
                          </div>
                        ) : bankSoalFile ? (
                          <div className="flex flex-col items-center gap-2">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            <span className="text-[10px] font-black uppercase text-slate-600 truncate max-w-[200px]">{bankSoalFile.name}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <UploadCloud className="w-8 h-8 text-slate-300" />
                            <span className="text-[10px] font-black uppercase text-slate-400">Unggah PDF/DOCX</span>
                          </div>
                        )}
                        <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={handleBankSoalFileUpload} />
                      </label>
                      {bankSoalFile && (
                        <button 
                          onClick={() => { setBankSoalFile(null); setBankSoalFileText(''); }}
                          className="mt-2 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                        >
                          Hapus Dokumen
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic px-1">Topik Materi</label>
                      <input 
                        type="text" value={bankSoalTopic} onChange={(e) => setBankSoalTopic(e.target.value)}
                        placeholder="Misal: Interaksi Antarruang ASEAN"
                        className={`w-full ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'} border-2 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-slate-500 transition-all`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic px-1">Tingkat Kelas</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['VII', 'VIII', 'IX'].map(grade => (
                          <button 
                            key={grade} onClick={() => setBankSoalGrade(grade)}
                            className={`py-3 rounded-xl font-black text-xs transition-all border-2 ${bankSoalGrade === grade ? 'bg-slate-800 border-slate-800 text-white shadow-lg' : (isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-500' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200')}`}
                          >
                            KELAS {grade}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic px-1">Jumlah Soal</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="range" min="1" max="10" value={bankSoalCount} onChange={(e) => setBankSoalCount(parseInt(e.target.value))}
                          className={`flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800`}
                        />
                        <span className="font-black text-sm text-slate-800 dark:text-white w-8 text-center">{bankSoalCount}</span>
                      </div>
                    </div>

                    <button 
                      onClick={handleGenerateBankSoal} disabled={!bankSoalTopic || isGeneratingBankSoal}
                      className="w-full py-5 bg-slate-800 text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl shadow-slate-100 dark:shadow-none hover:bg-slate-900 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isGeneratingBankSoal ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      Generate Bank Soal
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-8">
                  {bankSoalResult ? (
                    <div className="space-y-6">
                      {/* Filtering UI */}
                      <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-50'} p-6 rounded-[32px] border space-y-4`}>
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder="Cari soal, subtopik, atau tag..." 
                            value={bankSoalSearchFilter}
                            onChange={(e) => setBankSoalSearchFilter(e.target.value)}
                            className={`w-full ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'} border-2 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-500 transition-all`}
                          />
                        </div>
                        <div className="flex flex-wrap gap-4">
                          <div className="flex-1 min-w-[200px]">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">
                              <Filter className="w-3 h-3" /> Filter Subtopik
                            </label>
                            <select 
                              value={bankSoalTopicFilter}
                              onChange={(e) => setBankSoalTopicFilter(e.target.value)}
                              className={`w-full ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'} border-2 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none`}
                            >
                              <option value="all">Semua Subtopik</option>
                              {Array.from(new Set(bankSoalQuestions.map(q => q.subtopic).filter(Boolean))).map((topic: any) => (
                                <option key={topic} value={topic}>{topic}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex-1 min-w-[200px]">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">
                              <Tag className="w-3 h-3" /> Filter Tag
                            </label>
                            <select 
                              value={bankSoalTagFilter}
                              onChange={(e) => setBankSoalTagFilter(e.target.value)}
                              className={`w-full ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'} border-2 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none`}
                            >
                              <option value="all">Semua Tag</option>
                              {Array.from(new Set(bankSoalQuestions.flatMap(q => q.tags || []).filter(Boolean))).map((tag: any) => (
                                <option key={tag} value={tag}>{tag}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className={`flex flex-wrap justify-between items-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} p-4 rounded-2xl border gap-4`}>
                        <div className="flex items-center gap-4 px-4 font-black">
                          <span className="text-xs text-slate-400 uppercase tracking-widest ">Preview Bank Soal</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                            {bankSoalQuestions.filter(q => {
                              const matchesSearch = q.question.toLowerCase().includes(bankSoalSearchFilter.toLowerCase()) || 
                                                    (q.subtopic && q.subtopic.toLowerCase().includes(bankSoalSearchFilter.toLowerCase())) ||
                                                    (q.tags && q.tags.some((t: string) => t.toLowerCase().includes(bankSoalSearchFilter.toLowerCase())));
                              const matchesTopic = bankSoalTopicFilter === 'all' || q.subtopic === bankSoalTopicFilter;
                              const matchesTag = bankSoalTagFilter === 'all' || (q.tags && q.tags.includes(bankSoalTagFilter));
                              return matchesSearch && matchesTopic && matchesTag;
                            }).length} Soal
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={handleExportBankSoalJSON}
                            className={`flex items-center gap-2 px-5 py-2.5 ${isDarkMode ? 'bg-amber-900 text-amber-100' : 'bg-amber-500 text-white'} rounded-xl text-xs font-bold shadow-lg transition-all`}
                            title="Ekspor ke JSON"
                          >
                            <FileJson className="w-4 h-4" /> JSON
                          </button>
                          <button 
                            onClick={handleExportBankSoalCSV}
                            className={`flex items-center gap-2 px-5 py-2.5 ${isDarkMode ? 'bg-emerald-900 text-emerald-100' : 'bg-emerald-500 text-white'} rounded-xl text-xs font-bold shadow-lg transition-all`}
                            title="Ekspor ke CSV"
                          >
                            <FileSpreadsheet className="w-4 h-4" /> CSV
                          </button>
                          <button 
                            onClick={handleSaveBankSoalToDrive} disabled={isUploadingBankSoalToDrive}
                            className={`flex items-center gap-2 px-5 py-2.5 ${isDarkMode ? 'bg-indigo-900 text-indigo-100 hover:bg-indigo-800' : 'bg-indigo-500 text-white hover:bg-indigo-600'} rounded-xl text-xs font-bold shadow-lg transition-all disabled:opacity-50`}
                          >
                            {isUploadingBankSoalToDrive ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
                            Simpan ke Drive
                          </button>
                          <button 
                            onClick={() => exportPDF('bank-soal-content', `BankSoal_${bankSoalGrade}_${bankSoalTopic.substring(0, 20)}`)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 shadow-lg shadow-slate-100 transition-all"
                          >
                            <Download className="w-4 h-4" /> PDF
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-8">
                        {bankSoalQuestions.filter(q => {
                          const matchesSearch = q.question.toLowerCase().includes(bankSoalSearchFilter.toLowerCase()) || 
                                                (q.subtopic && q.subtopic.toLowerCase().includes(bankSoalSearchFilter.toLowerCase())) ||
                                                (q.tags && q.tags.some((t: string) => t.toLowerCase().includes(bankSoalSearchFilter.toLowerCase())));
                          const matchesTopic = bankSoalTopicFilter === 'all' || q.subtopic === bankSoalTopicFilter;
                          const matchesTag = bankSoalTagFilter === 'all' || (q.tags && q.tags.includes(bankSoalTagFilter));
                          return matchesSearch && matchesTopic && matchesTag;
                        }).map((q, idx) => (
                          <motion.div 
                            key={idx} 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl'} p-8 rounded-[32px] border relative overflow-hidden group`}
                          >
                            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                              <div className="flex items-center gap-3">
                                <span className={`px-4 py-1.5 bg-${accentColor}-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg`}>
                                  SOAL {idx + 1}
                                </span>
                                {q.subtopic && (
                                  <span className={`px-4 py-1.5 ${isDarkMode ? 'bg-slate-800 text-indigo-400' : 'bg-indigo-50 text-indigo-600'} rounded-full text-[10px] font-black uppercase tracking-widest`}>
                                    {q.subtopic}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-4 py-1.5 ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'} rounded-full text-[10px] font-black uppercase tracking-widest`}>
                                  Level {q.level}
                                </span>
                              </div>
                            </div>
                            
                            <div className={`prose prose-sm ${isDarkMode ? 'prose-invert' : 'prose-slate'} max-w-none font-bold text-lg mb-8 leading-relaxed`}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" /> }}>{q.question}</ReactMarkdown>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                              {Object.entries(q.options).map(([key, val]: [string, any]) => (
                                <div 
                                  key={key} 
                                  className={`p-4 rounded-2xl border-2 transition-all flex items-start gap-4 ${q.answer === key ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : 'border-slate-50 dark:border-slate-800'}`}
                                >
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${q.answer === key ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                    {key}
                                  </div>
                                  <span className={`text-sm font-bold ${q.answer === key ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500'}`}>{val}</span>
                                </div>
                              ))}
                            </div>

                            <div className="flex flex-wrap gap-2 mb-8">
                              {(q.tags || []).map((tag: string) => (
                                <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest rounded-lg">
                                  <Tag className="w-3 h-3" /> {tag}
                                </span>
                              ))}
                            </div>

                            <div className={`p-6 rounded-[24px] ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'} border-l-4 border-slate-400`}>
                              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Pembahasan Maestro:</h5>
                              <p className={`text-xs font-bold leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{q.explanation}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <div className={`flex justify-between items-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} p-4 rounded-2xl border mt-12`}>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">Preview Cetak PDF</span>
                        <button 
                          onClick={() => exportPDF('bank-soal-content', `BankSoal_${bankSoalGrade}_${bankSoalTopic.substring(0, 20)}`)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 shadow-lg shadow-slate-100 transition-all"
                        >
                          <Download className="w-4 h-4" /> Download PDF
                        </button>
                      </div>

                      <div id="bank-soal-content" className="hidden">
                        <div id="bank-soal-result-content" className={`${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'} p-12`}>
                           <h2 className="text-center font-black text-2xl mb-8 uppercase">Bank Soal HOTS IPS Maestro</h2>
                           <div className="space-y-4 mb-8 text-sm font-bold">
                              <p>Tema: {bankSoalTopic}</p>
                              <p>Kelas: {bankSoalGrade}</p>
                           </div>
                           <div className={`prose ${isDarkMode ? 'prose-invert' : 'prose-slate'} max-w-none`}>
                             <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" /> }}>{bankSoalResult}</ReactMarkdown>
                           </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`h-[600px] border-4 border-dashed ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} rounded-[40px] flex flex-col items-center justify-center text-center p-12`}>
                      <div className={`w-20 h-20 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'} rounded-[32px] flex items-center justify-center mb-8 rotate-3 transition-all`}>
                        <ClipboardList className="w-10 h-10 text-slate-300" />
                      </div>
                      <h3 className={`text-2xl font-black mb-3 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Belum Ada Soal</h3>
                      <p className="text-slate-400 font-bold max-w-sm leading-relaxed">Tentukan topik dan jumlah soal untuk menghadirkan evaluasi pembelajaran yang berkualitas.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'silabus' && (
            <motion.div key="silabus" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              <header>
                <h2 className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Silabus <span className="text-teal-500">Generator Maestro</span></h2>
                <p className={`font-medium mt-2 text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Ciptakan Alur Tujuan Pembelajaran (ATP) yang komprehensif dan sistematis.</p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                <div className={`lg:col-span-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-100'} p-8 rounded-[40px] border space-y-8 sticky top-8`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center text-white">
                      <LayoutList className="w-5 h-5" />
                    </div>
                    <span className={`font-black text-sm uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Konfigurasi Silabus</span>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic px-1">Topik Utama</label>
                      <input 
                        type="text" value={silabusTopic} onChange={(e) => setSilabusTopic(e.target.value)}
                        placeholder="Misal: Kehidupan Sosial Manusia"
                        className={`w-full ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'} border-2 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-teal-500 transition-all`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic px-1">Tingkat Kelas</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['VII', 'VIII', 'IX'].map(grade => (
                          <button 
                            key={grade} onClick={() => setSilabusGrade(grade)}
                            className={`py-3 rounded-xl font-black text-xs transition-all border-2 ${silabusGrade === grade ? 'bg-teal-600 border-teal-600 text-white shadow-lg' : (isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-500' : 'bg-white border-slate-100 text-slate-400 hover:border-teal-200')}`}
                          >
                            KELAS {grade}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic px-1">Tujuan Pembelajaran (Opsional)</label>
                      <textarea 
                        value={silabusObjectives} onChange={(e) => setSilabusObjectives(e.target.value)}
                        placeholder="Masukkan poin-poin tujuan jika ada..."
                        className={`w-full ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'} border-2 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-teal-500 transition-all min-h-[100px]`}
                      />
                    </div>

                    <button 
                      onClick={handleGenerateSilabus} disabled={!silabusTopic || isGeneratingSilabus}
                      className="w-full py-5 bg-teal-600 text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl shadow-teal-100 dark:shadow-none hover:bg-teal-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isGeneratingSilabus ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      Buat Silabus Maestro
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-8">
                  {silabusResult ? (
                    <div className="space-y-6">
                      <div className={`flex justify-between items-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} p-4 rounded-2xl border`}>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">Preview Silabus Maestro</span>
                          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            {['pdf', 'docx'].map((fmt) => (
                              <button
                                key={fmt} onClick={() => setSilabusExportFormat(fmt as 'pdf' | 'docx')}
                                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${silabusExportFormat === fmt ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                {fmt}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={handleSaveSilabusToDrive} disabled={isUploadingSilabusToDrive}
                            className={`flex items-center gap-2 px-5 py-2.5 ${isDarkMode ? 'bg-indigo-900 text-indigo-100 hover:bg-indigo-800' : 'bg-indigo-500 text-white hover:bg-indigo-600'} rounded-xl text-xs font-bold shadow-lg transition-all disabled:opacity-50`}
                          >
                            {isUploadingSilabusToDrive ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
                            Simpan ke Drive
                          </button>
                          <button 
                            onClick={() => {
                              const fileName = `Silabus_${silabusGrade}_${silabusTopic.substring(0, 20)}`;
                              if (silabusExportFormat === 'pdf') exportPDF('silabus-content', fileName);
                              else exportDOCX('silabus-content', fileName);
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 text-white rounded-xl text-xs font-bold hover:bg-teal-600 shadow-lg shadow-teal-100 transition-all"
                          >
                            <Download className="w-4 h-4" /> Download {silabusExportFormat.toUpperCase()}
                          </button>
                        </div>
                      </div>

                      <div id="silabus-content" className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} p-12 rounded-[40px] border shadow-2xl shadow-slate-100 dark:shadow-none min-h-[800px] relative`}>
                         <div id="silabus-result-content">
                           <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-t-[40px]" />
                           <div className={`prose ${isDarkMode ? 'prose-invert' : 'prose-slate'} max-w-none prose-headings:font-black prose-strong:text-teal-700`}>
                             <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" /> }}>{silabusResult}</ReactMarkdown>
                           </div>
                           <div className={`mt-12 pt-8 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} flex justify-between items-end opacity-40 italic text-[10px]`}>
                             <div>Goresan Pena Digital: IPS Maestro AI</div>
                             <div className="font-bold tracking-widest uppercase">Edisi Merdeka {new Date().getFullYear()}</div>
                           </div>
                         </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`h-[600px] border-4 border-dashed ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} rounded-[40px] flex flex-col items-center justify-center text-center p-12`}>
                      <div className={`w-20 h-20 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'} rounded-[32px] flex items-center justify-center mb-8 -rotate-6 transition-all`}>
                        <LayoutList className="w-10 h-10 text-slate-300" />
                      </div>
                      <h3 className={`text-2xl font-black mb-3 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Silabus Belum Tersedia</h3>
                      <p className="text-slate-400 font-bold max-w-sm leading-relaxed">Tentukan topik dan kelas untuk merumuskan alur pembelajaran yang terstruktur.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'rpp' && (
            <motion.div key="rpp" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              <header>
                <h2 className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>RPP <span className="text-blue-500">Creator Maestro</span></h2>
                <p className={`font-medium mt-2 text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Rancang Modul Ajar Kurikulum Merdeka secara otomatis dan mendalam.</p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                <div className={`lg:col-span-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-100'} p-8 rounded-[40px] border space-y-8 sticky top-8`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className={`font-black text-sm uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Konfigurasi RPP</span>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic px-1">Topik Utama</label>
                      <input 
                        type="text" value={rppTopic} onChange={(e) => setRppTopic(e.target.value)}
                        placeholder="Misal: Dampak Kenaikan Harga BBM"
                        className={`w-full ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'} border-2 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic px-1">Tingkat Kelas</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['VII', 'VIII', 'IX'].map(grade => (
                          <button 
                            key={grade} onClick={() => setRppGrade(grade)}
                            className={`py-3 rounded-xl font-black text-xs transition-all border-2 ${rppGrade === grade ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : (isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-500' : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200')}`}
                          >
                            KELAS {grade}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic px-1">Elemen Interaktif</label>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className={`w-10 h-6 p-1 rounded-full transition-all ${rppIncludeVideo ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-800'}`} onClick={() => setRppIncludeVideo(!rppIncludeVideo)}>
                            <div className={`w-4 h-4 bg-white rounded-full transition-all ${rppIncludeVideo ? 'translate-x-4' : 'translate-x-0'}`} />
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                              <MessageSquare className="w-2.5 h-2.5 text-blue-500" /> Tautan Video (Stimulus)
                            </span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">YouTube/Google Drive</span>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className={`w-10 h-6 p-1 rounded-full transition-all ${rppIncludeQuiz ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-800'}`} onClick={() => setRppIncludeQuiz(!rppIncludeQuiz)}>
                            <div className={`w-4 h-4 bg-white rounded-full transition-all ${rppIncludeQuiz ? 'translate-x-4' : 'translate-x-0'}`} />
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                              <ClipboardList className="w-2.5 h-2.5 text-blue-500" /> Kuis Singkat
                            </span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">3-5 Soal Pemahaman</span>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className={`w-10 h-6 p-1 rounded-full transition-all ${rppIncludeLinks ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-800'}`} onClick={() => setRppIncludeLinks(!rppIncludeLinks)}>
                            <div className={`w-4 h-4 bg-white rounded-full transition-all ${rppIncludeLinks ? 'translate-x-4' : 'translate-x-0'}`} />
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                              <ExternalLink className="w-2.5 h-2.5 text-blue-500" /> Tautan Eksternal
                            </span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Sumber Belajar Digital</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <button 
                      onClick={handleGenerateRPP} disabled={!rppTopic || isGeneratingRpp}
                      className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl shadow-blue-100 dark:shadow-none hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isGeneratingRpp ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      Buat RPP Maestro
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-8">
                  {rppResult ? (
                    <div className="space-y-6">
                      <div className={`flex justify-between items-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} p-4 rounded-2xl border`}>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">Preview Modul Ajar</span>
                          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            {['pdf', 'docx'].map((fmt) => (
                              <button
                                key={fmt} onClick={() => setRppExportFormat(fmt as 'pdf' | 'docx')}
                                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${rppExportFormat === fmt ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                {fmt}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={handleSaveRppToDrive} disabled={isUploadingRppToDrive}
                            className={`flex items-center gap-2 px-5 py-2.5 ${isDarkMode ? 'bg-indigo-900 text-indigo-100 hover:bg-indigo-800' : 'bg-indigo-500 text-white hover:bg-indigo-600'} rounded-xl text-xs font-bold shadow-lg transition-all disabled:opacity-50`}
                          >
                            {isUploadingRppToDrive ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
                            Simpan ke Drive
                          </button>
                          <button 
                            onClick={() => {
                              const fileName = `RPP_${rppGrade}_${rppTopic.substring(0, 20)}`;
                              if (rppExportFormat === 'pdf') exportPDF('rpp-content', fileName);
                              else exportDOCX('rpp-content', fileName);
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl text-xs font-bold hover:bg-blue-600 shadow-lg shadow-blue-100 transition-all"
                          >
                            <Download className="w-4 h-4" /> Download {rppExportFormat.toUpperCase()}
                          </button>
                        </div>
                      </div>

                      <div id="rpp-content" className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} p-12 rounded-[40px] border shadow-2xl shadow-slate-100 dark:shadow-none min-h-[800px] relative`}>
                         <div id="rpp-result-content">
                           <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-[40px]" />
                           <div className={`prose ${isDarkMode ? 'prose-invert' : 'prose-slate'} max-w-none prose-headings:font-black prose-strong:text-blue-700`}>
                             <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" /> }}>{rppResult}</ReactMarkdown>
                           </div>
                           <div className={`mt-12 pt-8 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} flex justify-between items-end opacity-40 italic text-[10px]`}>
                             <div>Goresan Pena Digital: IPS Maestro AI</div>
                             <div className="font-bold tracking-widest uppercase">Edisi Merdeka {new Date().getFullYear()}</div>
                           </div>
                         </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`h-[600px] border-4 border-dashed ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} rounded-[40px] flex flex-col items-center justify-center text-center p-12`}>
                      <div className={`w-20 h-20 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'} rounded-[32px] flex items-center justify-center mb-8 rotate-12 transition-all`}>
                        <FileText className="w-10 h-10 text-slate-300" />
                      </div>
                      <h3 className={`text-2xl font-black mb-3 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Belum Ada RPP Dibuat</h3>
                      <p className="text-slate-400 font-bold max-w-sm leading-relaxed">Masukkan topik di sebelah kiri untuk menghasilkan RPP yang disesuaikan dengan Kurikulum Merdeka.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Placeholder for other tabs (currently none are placeholders) */}
          {false && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-[28px] flex items-center justify-center mb-8">
                <Plus className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter decoration-indigo-500 decoration-4 underline-offset-8 underline italic">Segera Hadir</h3>
              <p className="text-slate-400 font-bold mt-4 max-w-sm">Fitur {activeTab.toUpperCase()} sedang dalam tahap penyetelan akhir untuk performa maksimal.</p>
              <button onClick={() => setActiveTab('beranda')} className="mt-10 px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all">Kembali Ke Beranda</button>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Quick Access Footer - Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 p-4 grid grid-cols-5 gap-2 z-50 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
        {[
          { id: 'beranda', icon: LayoutGrid },
          { id: 'lkpd', icon: FileSpreadsheet },
          { id: 'chatbot', icon: MessageSquare },
          { id: 'rpp', icon: FileText },
          { id: 'pengaturan', icon: Settings }
        ].map(item => (
          <button 
            key={item.id} onClick={() => setActiveTab(item.id as Tab)}
            className={`flex items-center justify-center p-3 rounded-2xl transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110 -translate-y-2' : 'text-slate-400'}`}
          >
            <item.icon className="w-6 h-6" />
          </button>
        ))}
      </div>
    </div>
  </>
  );
}
