import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  User as UserIcon,
  FileText, 
  PlusCircle, 
  Share2, 
  Download, 
  Settings, 
  LogOut, 
  Search,
  CheckCircle,
  AlertCircle,
  HardDrive,
  Layout,
  GraduationCap,
  Sparkles,
  Loader2,
  ClipboardList,
  Table as TableIcon,
  Plus,
  Trash2,
  Save,
  BarChart3,
  Brain,
  Timer,
  Award,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  Wand2,
  RefreshCw,
  RotateCcw,
  PenLine,
  X,
  Upload,
  Check,
  CheckCircle2,
  XCircle,
  Send,
  Clock,
  Flag,
  LayoutGrid,
  AlertTriangle,
  Bell,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
  Calendar,
  HelpCircle,
  Zap,
  ShieldCheck,
  Globe,
  MonitorSmartphone,
  Trash,
  Menu,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { generateTeachingContent, generateQuizContent, generateQuizFromData, generateBankSoal, generateSingleImagePrompt } from './lib/gemini';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  doc, 
  onSnapshot,
  setDoc,
  getDoc,
  serverTimestamp,
  orderBy,
  getDocFromServer
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { db, auth } from './lib/firebase';

import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  AlignmentType, 
  HeadingLevel, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  BorderStyle,
  VerticalAlign,
  Header as DocxHeader,
  Footer as DocxFooter,
  PageNumber
} from 'docx';
import confetti from 'canvas-confetti';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// --- Types ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  }
}

interface Quiz {
  id: string;
  title: string;
  topic: string;
  grade: string;
  difficulty: 'Mudah' | 'Sedang' | 'Sulit';
  questions: Question[];
  userId: string;
  date: string;
}

interface Question {
  id: string;
  type: 'multiple-choice' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface JournalEntry {
  id: string;
  date: string;
  activity: string;
  class: string;
  subject: string;
  notes: string;
  userId: string;
}

type Tab = 'beranda' | 'rpp' | 'materi' | 'drive' | 'silabus' | 'rpp_mendalam' | 'bank_soal' | 'penilaian' | 'riwayat' | 'pengaturan' | 'cbt_guru' | 'jurnal';

interface HistoryItem {
  id: string;
  type: 'RPP' | 'Silabus' | 'RPP Mendalam' | 'Kuis';
  topic: string;
  content: string;
  date: string;
  userId: string;
}

const Footer = () => (
  <footer className="mt-8 border-t border-slate-100 pt-6">
    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="text-[11px] text-text-light bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 text-center md:text-left">
        <strong>Dibuat oleh:</strong><br />
        Catur Pamungkas, S.Pd.,Gr.<br />
        <a href="https://catatanguruips.blogspot.com" target="_blank" className="hover:text-primary">catatanguruips.blogspot.com</a>
      </div>
      <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
        <CheckCircle className="w-4 h-4" />
        <span className="text-[12px] font-bold">Verified Educator Assistant</span>
      </div>
    </div>
  </footer>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('beranda');
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'teacher' | 'student' | null>(null);
  const [showStudentLogin, setShowStudentLogin] = useState(false);
  const [studentUsername, setStudentUsername] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState('7'); // Default to grade 7
  const [subject, setSubject] = useState('IPS');
  const [educationLevel, setEducationLevel] = useState('SMP');
  const [exportConfig, setExportConfig] = useState({
    pageSize: 'a4', // 'a4' or 'f4'
    layout: 'single', // 'single' or 'double'
    showAnswers: true,
    showImages: true
  });
  const [teacherName, setTeacherName] = useState('Catur Pamungkas, S.Pd.,Gr.');
  const [nip, setNip] = useState('199001012023011001');
  const [school, setSchool] = useState('SMP PGRI 1 Kuwarasan, Kebumen');
  const [meetings, setMeetings] = useState('1 Pertemuan (2JP x 40 menit)');
  const [meetingDates, setMeetingDates] = useState<string[]>([new Date().toISOString().split('T')[0]]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [newJournal, setNewJournal] = useState({ date: new Date().toISOString().split('T')[0], activity: '', class: '7', subject: 'IPS', notes: '' });
  const [teachingMedia, setTeachingMedia] = useState('LCD, Power Point, Lingkungan Sekitar');
  const [learningModel, setLearningModel] = useState('Problem Based Learning (PBL)');
  const [selectedP3, setSelectedP3] = useState<string[]>(['Keimanan dan Ketakwaan terhadap Tuhan YME']);
  const [semester, setSemester] = useState('Gasal');
  const [kurikulum, setKurikulum] = useState('Merdeka');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [aiResult, setAiResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingMessage, setGeneratingMessage] = useState('Sedang memproses...');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [pageSize, setPageSize] = useState<'A4' | 'F4' | 'Legal'>('A4');
  const [regeneratingImageId, setRegeneratingImageId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uiConfig, setUiConfig] = useState({
    theme: 'light',
    font: 'modern',
    accentColor: '#4f46e5',
    layout: 'standard' // 'standard' or 'wide'
  });
  const [modalImage, setModalImage] = useState<{ src: string, alt: string, title?: string, description?: string } | null>(null);
  
  // AI Limit
  const DAILY_LIMIT = 25;
  const todayDate = new Date().toLocaleDateString('id-ID');
  const todayUsage = history.filter(item => item.date.includes(todayDate)).length;
  const usagePercentage = Math.min((todayUsage / DAILY_LIMIT) * 100, 100);
  
  // --- Penilaian State ---
  const [assessments, setAssessments] = useState<{id: string, name: string, grade: string, formative: number, sumatifTengah: number, summative: number, sumatifAkhir: number}[]>([]);
  const [newAssessment, setNewAssessment] = useState({ name: '', grade: '7', formative: 0, sumatifTengah: 0, summative: 0, sumatifAkhir: 0 });
  const [filterGrade, setFilterGrade] = useState('All');
  
  // --- Quiz State ---
  const [bankSoalConfig, setBankSoalConfig] = useState({
    topic: '',
    difficulty: 'C4',
    countMC: 10,
    countComplexMC: 0,
    countMatch: 0,
    countOrder: 0,
    countTF: 0,
    withImages: false
  });
  const [bankSoalData, setBankSoalData] = useState<any>(null);
  const [bankSoalBaseText, setBankSoalBaseText] = useState('');
  const [bankSoalViewMode, setBankSoalViewMode] = useState<'card' | 'table'>('card');

  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizView, setQuizView] = useState<'selection' | 'taking' | 'result'>('selection');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [quizFeedback, setQuizFeedback] = useState<Record<string, { isCorrect: boolean, feedback: string }>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizResultsList, setQuizResultsList] = useState<any[]>([]);
  const [selectedQuizForResults, setSelectedQuizForResults] = useState<Quiz | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [markedDoubt, setMarkedDoubt] = useState<Record<string, boolean>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasRestoredQuiz, setHasRestoredQuiz] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  useEffect(() => {
    const firstVisit = localStorage.getItem('ips_maestro_first_visit');
    if (!firstVisit && isAuthenticated) {
      setShowOnboarding(true);
      localStorage.setItem('ips_maestro_first_visit', 'true');
    }
  }, [isAuthenticated]);

  const filteredAssessments = filterGrade === 'All' 
    ? assessments 
    : assessments.filter(a => a.grade === filterGrade);

  const contentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load UI Config
    const savedUi = localStorage.getItem('ips_ui_config');
    if (savedUi) {
      try {
        const config = JSON.parse(savedUi);
        setUiConfig(config);
      } catch (e) {
        console.error("Failed to load UI config", e);
      }
    }
  }, []);

  useEffect(() => {
    // Apply UI Config
    document.documentElement.setAttribute('data-theme', uiConfig.theme);
    document.documentElement.setAttribute('data-font', uiConfig.font);
    document.documentElement.style.setProperty('--primary-color', uiConfig.accentColor);
    
    // Auto-calculate light version of primary color (simplified)
    const lightColor = uiConfig.accentColor + '10'; // Added transparency for light mode effect
    document.documentElement.style.setProperty('--primary-light-color', lightColor);
    
    localStorage.setItem('ips_ui_config', JSON.stringify(uiConfig));
  }, [uiConfig]);

  // --- Auth Check ---
  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    setStatus({ type: 'error', message: 'Terjadi kesalahan pada database.' });
    throw new Error(JSON.stringify(errInfo));
  };

  useEffect(() => {
    // Safety timeout to ensure loading screen doesn't stay forever
    const timeout = setTimeout(() => {
      setLoading(currentLoading => {
        if (currentLoading) {
          console.warn("Auth check timed out, setting loading to false");
          return false;
        }
        return currentLoading;
      });
    }, 5000);

    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
      if (currentUser) {
        try {
          const userDoc = await getDocFromServer(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          } else {
            // Default to teacher if no doc exists (Google Login)
            await setDoc(doc(db, 'users', currentUser.uid), { role: 'teacher', name: currentUser.displayName });
            setUserRole('teacher');
          }
        } catch (e) {
          console.error('Error fetching user role:', e);
          setUserRole('teacher'); // fallback
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  // --- User Profile Sync ---
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const profileData = docSnap.data();
            if (profileData.uiConfig) setUiConfig(prev => ({ ...prev, ...profileData.uiConfig }));
            if (profileData.teacherName) setTeacherName(profileData.teacherName);
            if (profileData.nip) setNip(profileData.nip);
            if (profileData.school) setSchool(profileData.school);
          }
        } catch (e) {
          console.error("Error loading user profile:", e);
        }
      }
    };
    loadProfile();
  }, [user]);

  const saveProfile = async () => {
    if (user) {
      const profile = {
        displayName: user.displayName,
        email: user.email,
        teacherName,
        nip,
        school,
        uiConfig,
        role: userRole,
        updatedAt: new Date().toISOString()
      };
      try {
        await setDoc(doc(db, 'users', user.uid), profile);
        setStatus({ type: 'success', message: 'Profil dan preferensi berhasil disimpan kustom!' });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'users');
      }
    }
  };

  // --- Real-time Stats Sync ---
  useEffect(() => {
    if (!user || userRole === null) {
      setHistory([]);
      setAssessments([]);
      setQuizzes([]);
      setQuizResultsList([]);
      return;
    }

    let unsubHistory = () => {};
    let unsubAssessments = () => {};
    let unsubQuizzes = () => {};
    let unsubResults = () => {};
    let unsubJournals = () => {};

    if (userRole === 'teacher') {
      const qHistory = query(collection(db, 'history'), where('userId', '==', user.uid), orderBy('date', 'desc'));
      unsubHistory = onSnapshot(qHistory, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HistoryItem));
        setHistory(items);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'history'));

      const qAssessments = query(collection(db, 'assessments'), where('userId', '==', user.uid));
      unsubAssessments = onSnapshot(qAssessments, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setAssessments(items);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'assessments'));

      const qQuizzes = query(collection(db, 'quizzes'), where('userId', '==', user.uid));
      unsubQuizzes = onSnapshot(qQuizzes, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz));
        setQuizzes(items);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'quizzes'));

      const qResults = query(collection(db, 'quizResults'), where('teacherId', '==', user.uid));
      unsubResults = onSnapshot(qResults, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setQuizResultsList(items);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'quizResults'));

      const qJournals = query(collection(db, 'journals'), where('userId', '==', user.uid), orderBy('date', 'desc'));
      unsubJournals = onSnapshot(qJournals, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry));
        setJournals(items);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'journals'));
    } else if (userRole === 'student') {
      const qQuizzes = query(collection(db, 'quizzes'));
      unsubQuizzes = onSnapshot(qQuizzes, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz));
        setQuizzes(items);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'quizzes'));
    }

    return () => {
      unsubHistory();
      unsubAssessments();
      unsubQuizzes();
      unsubResults();
      unsubJournals();
    };
  }, [user, userRole]);

  // --- Quiz Timer ---
  useEffect(() => {
    let interval: any;
    if (quizView === 'taking' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (quizView === 'taking' && timeLeft === 0) {
      completeQuiz();
    }
    return () => clearInterval(interval);
  }, [quizView, timeLeft]);

  // --- Quiz Auto-Save ---
  useEffect(() => {
    if (quizView === 'taking' && activeQuiz) {
      const quizProgress = {
        activeQuiz,
        currentQuestionIndex,
        userAnswers,
        markedDoubt,
        timeLeft,
        lastSaved: new Date().toISOString()
      };
      
      setIsSaving(true);
      localStorage.setItem('ips_quiz_progress', JSON.stringify(quizProgress));
      
      const timer = setTimeout(() => {
        setIsSaving(false);
        setLastSaved(new Date());
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [quizView, activeQuiz, currentQuestionIndex, userAnswers, markedDoubt, timeLeft]);

  // Check for saved progress on mount
  useEffect(() => {
    if (isAuthenticated && !hasRestoredQuiz) {
      const saved = localStorage.getItem('ips_quiz_progress');
      if (saved) {
        try {
          const progress = JSON.parse(saved);
          // Only show resume if it's for the current logged in user or if they are in student mode
          // For simplicity, we just check if it was saved recently (e.g., within 24h)
          const lastSaved = new Date(progress.lastSaved);
          const now = new Date();
          if (now.getTime() - lastSaved.getTime() < 24 * 60 * 60 * 1000) {
            if (window.confirm(`Ditemukan kuis "${progress.activeQuiz.title}" yang belum selesai. Ingin melanjutkan?`)) {
              setActiveQuiz(progress.activeQuiz);
              setCurrentQuestionIndex(progress.currentQuestionIndex);
              setUserAnswers(progress.userAnswers);
              setMarkedDoubt(progress.markedDoubt || {});
              setTimeLeft(progress.timeLeft);
              setQuizView('taking');
            } else {
              localStorage.removeItem('ips_quiz_progress');
            }
          }
        } catch (e) {
          console.error("Failed to restore quiz progress", e);
        }
        setHasRestoredQuiz(true);
      }
    }
  }, [isAuthenticated, hasRestoredQuiz]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      confetti();
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Gagal login dengan Google.' });
    }
  };

  const handleStudentAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentUsername || !studentPassword) return;
    try {
      const email = `${studentUsername}@cbt.local`;
      if (isRegistering) {
        const { user: newUser } = await createUserWithEmailAndPassword(auth, email, studentPassword);
        await setDoc(doc(db, 'users', newUser.uid), { role: 'student', name: studentUsername });
        confetti();
      } else {
        await signInWithEmailAndPassword(auth, email, studentPassword);
        confetti();
      }
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: err.message || 'Gagal autentikasi siswa.' });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setHistory([]);
      setAssessments([]);
      setQuizzes([]);
    } catch (err) {
      console.error(err);
    }
  };

  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDocumentUploadForQuiz = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setDocumentFile(e.target.files[0]);
      setStatus({ type: 'success', message: `File ${e.target.files[0].name} terpilih.` });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (allowedTypes.includes(fileExtension)) {
        setDocumentFile(file);
        setStatus({ type: 'success', message: `File ${file.name} berhasil diunggah.` });
      } else {
        setStatus({ type: 'error', message: 'Format file tidak didukung. Gunakan PDF atau Word.' });
      }
    }
  };

  const generateQuizFromDocument = async () => {
    if (!documentFile) return;

    setIsGenerating(true);
    setGeneratingMessage('Mengekstrak teks dari dokumen dan merumuskan pertanyaan kuis...');
    setStatus({ type: null, message: '' });

    try {
      const formData = new FormData();
      formData.append('file', documentFile);

      const response = await fetch('/api/upload-document', {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal mengekstrak teks dari dokumen');
      }

      const textResponse = await response.text();
      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (parseError) {
        console.error("Non-JSON API Response:", textResponse);
        throw new Error(`Format respons server tidak sesuai (Bukan JSON). Server return: ${textResponse.substring(0, 100)}`);
      }
      const extractedText = data.text;

      setStatus({ type: null, message: "Teks berhasil diekstrak. Menyusun kuis..."});

      const newQuizData = await generateQuizFromData(extractedText, grade);
      let quizResult;
      try {
        let cleanJson = newQuizData;
        if (newQuizData.includes('```json')) {
          cleanJson = newQuizData.replace(/```json\n?|\n?```/g, '').trim();
        } else if (newQuizData.includes('```')) {
          cleanJson = newQuizData.replace(/```\n?|\n?```/g, '').trim();
        }
        quizResult = JSON.parse(cleanJson);
      } catch (parseError) {
        console.error("Failed to parse AI response. Raw response:", newQuizData);
        throw new Error("Gagal membaca hasil dari AI (format tidak sesuai). Silakan coba bagian file yang lebih kecil.");
      }

      const quizData: Quiz = {
        id: crypto.randomUUID(),
        title: quizResult.title || `Kuis dari ${documentFile.name}`,
        topic: quizResult.topic || "Dokumen Unggahan",
        grade: grade, // derived from select
        difficulty: quizResult.difficulty || "Sulit (HOTS C4-C5)",
        questions: quizResult.questions || [],
        userId: user!.uid,
        date: new Date().toLocaleDateString('id-ID')
      };

      try {
        await addDoc(collection(db, 'quizzes'), quizData);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'quizzes');
      }
      setStatus({ type: 'success', message: 'Kuis berhasil digenerate dari dokumen dan disimpan!' });
      setDocumentFile(null);
    } catch (err: any) {
      console.error("Error generating quiz from doc:", err);
      setStatus({ type: 'error', message: `Gagal: ${err.message || 'Pastikan file valid.'}` });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateBankSoal = async () => {
    if (!bankSoalConfig.topic && !bankSoalBaseText) {
      setStatus({ type: 'error', message: 'Topik atau referensi teks tidak boleh kosong.' });
      return;
    }
    const total = 
      bankSoalConfig.countMC + 
      bankSoalConfig.countComplexMC + 
      bankSoalConfig.countMatch + 
      bankSoalConfig.countOrder + 
      bankSoalConfig.countTF;

    if (total === 0) {
      setStatus({ type: 'error', message: 'Jumlah keseluruhan soal harus lebih dari 0!' });
      return;
    }
    if (todayUsage >= DAILY_LIMIT) {
      setStatus({ type: 'error', message: `Maaf, limit harian Anda (${DAILY_LIMIT}) telah tercapai.` });
      return;
    }

    setIsGenerating(true);
    setGeneratingMessage('AI sedang menyusun variasi soal Bank Soal untuk Anda...');
    setStatus({ type: null, message: 'Menyusun Bank Soal dengan AI...' });
    try {
      let documentContent = bankSoalBaseText;
      if (documentFile) {
        setStatus({ type: null, message: "Membaca dokumen Anda..." });
        const formData = new FormData();
        formData.append('file', documentFile);

        const response = await fetch('/api/upload-document', {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: formData,
        });

        if (!response.ok) {
           const errData = await response.json().catch(() => ({}));
           throw new Error(errData.error || 'Gagal mengekstrak teks dari dokumen');
        }
        const textResponse = await response.text();
        let data;
        try {
          data = JSON.parse(textResponse);
        } catch (e) {
          console.error("Invalid Bank Soal JSON Response:", textResponse);
          throw new Error(`Respons server tidak valid. Harap cek format file. (Text start: ${textResponse.substring(0, 50)})`);
        }
        documentContent = (data.text || '') + '\n' + documentContent;
      }

      setStatus({ type: null, message: "AI sedang membuat variasi soal..." });
      
      const configFetch = {
        ...bankSoalConfig,
        grade,
        subject,
        educationLevel,
        baseText: documentContent,
      };

      const resultText = await generateBankSoal(configFetch);
      
      let cleanJson = resultText;
      try {
        if (cleanJson.includes("```json")) {
          cleanJson = cleanJson.split("```json")[1].split("```")[0].trim();
        } else if (cleanJson.includes("```")) {
          cleanJson = cleanJson.split("```")[1].split("```")[0].trim();
        }
        
        const parsedData = JSON.parse(cleanJson);
        
        // Ensure imagePrompts exist if requested
        if (bankSoalConfig.withImages && (parsedData.questions || parsedData.bankSoal)) {
          const questions = parsedData.questions || parsedData.bankSoal;
          const updatedQuestions = questions.map((q: any) => ({
            ...q,
            imagePrompt: q.imagePrompt || `Detailed educational digital illustration for ${topic || bankSoalConfig.topic}: ${q.question.substring(0, 100)}`
          }));
          
          if (parsedData.questions) parsedData.questions = updatedQuestions;
          else parsedData.bankSoal = updatedQuestions;
        }

        setBankSoalData(parsedData);
        setStatus({ type: 'success', message: 'Berhasil membuat Bank Soal!' });
      } catch (parseError) {
        console.error("Parse Error for Bank Soal:", resultText);
        throw new Error("Format respons generator tidak valid (Gagal membaca JSON). Silakan coba lagi.");
      }
      confetti();
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: `Gagal: ${err.message}` });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSyllabus = async () => {
    if (!topic) return;
    if (todayUsage >= DAILY_LIMIT) {
      setStatus({ type: 'error', message: `Maaf, limit harian Anda (${DAILY_LIMIT}) telah tercapai. Silakan coba lagi besok.` });
      return;
    }
    setIsGenerating(true);
    setGeneratingMessage('AI sedang merancang silabus pembelajaran yang komprehensif...');
    setAiResult('');
    try {
      // Lazy import 
      const { generateSyllabusContent } = await import('./lib/gemini');
      const res = await generateSyllabusContent(topic, `Kelas ${grade} (Semester ${semester})`, kurikulum);
      const content = res || '';
      setAiResult(content);
      
      const newHistory: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'Silabus',
        topic: `${topic} (Kelas ${grade})`,
        content: content,
        date: new Date().toLocaleString('id-ID'),
        userId: user?.uid || ''
      };
      if (user) {
        await setDoc(doc(db, 'history', newHistory.id), newHistory);
      }
      
      setActiveTab('materi');
      confetti();
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateRPPMendalamAction = async () => {
    if (!topic) return;
    if (todayUsage >= DAILY_LIMIT) {
      setStatus({ type: 'error', message: `Maaf, limit harian Anda (${DAILY_LIMIT}) telah tercapai. Silakan coba lagi besok.` });
      return;
    }
    setIsGenerating(true);
    setGeneratingMessage('AI sedang menyusun RPP Mendalam dengan analisis pedagogis komprehensif...');
    setAiResult('');
    try {
      const { generateRPPMendalam } = await import('./lib/gemini');
      const res = await generateRPPMendalam(
        topic, 
        subject, 
        selectedP3,
        teacherName,
        nip,
        school,
        grade,
        semester,
        meetings,
        teachingMedia,
        learningModel,
        kurikulum,
        meetingDates.filter(d => d.trim() !== '')
      );
      
      const content = res || '';
      setAiResult(content);

      const newHistory: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'RPP Mendalam',
        topic: `${topic} (${subject})`,
        content: content,
        date: new Date().toLocaleString('id-ID'),
        userId: user?.uid || ''
      };
      if (user) {
        await setDoc(doc(db, 'history', newHistory.id), newHistory);
      }

      // Automatic backup to drive if result is not empty
      if (content && isAuthenticated) {
        setTimeout(() => {
          saveToDrive(`RPM_${topic.replace(/\s+/g, '_')}.md`, content);
        }, 1000);
      }

      setActiveTab('materi');
      confetti();
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveToDrive = async (filename: string, content: string) => {
    try {
      const res = await fetch('/api/drive/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: filename, content, mimeType: 'text/markdown' }),
      });
      if (res.ok) {
        setStatus({ type: 'success', message: `Berhasil backup ${filename} ke Drive!` });
      } else {
        const errData = await res.json().catch(() => ({}));
        setStatus({ type: 'error', message: errData.error || `Gagal backup ${filename} ke Drive.` });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Kesalahan jaringan saat upload ke Drive.' });
    }
  };

  const handleAddAssessment = async () => {
    if (!newAssessment.name) return;
    
    // Validation: 0-100
    if (
      newAssessment.formative < 0 || newAssessment.formative > 100 ||
      newAssessment.sumatifTengah < 0 || newAssessment.sumatifTengah > 100 ||
      newAssessment.summative < 0 || newAssessment.summative > 100 ||
      newAssessment.sumatifAkhir < 0 || newAssessment.sumatifAkhir > 100
    ) {
      setStatus({ type: 'error', message: 'Nilai harus berada dalam rentang 0-100!' });
      return;
    }

    const id = Math.random().toString(36).substr(2, 9);
    const item = { 
      ...newAssessment, 
      id,
      userId: user?.uid || ''
    };
    
    try {
      if (user) {
        await setDoc(doc(db, 'assessments', id), item);
        setNewAssessment({ name: '', grade: '7', formative: 0, sumatifTengah: 0, summative: 0, sumatifAkhir: 0 });
        setStatus({ type: 'success', message: 'Data nilai berhasil ditambahkan.' });
      } else {
        setStatus({ type: 'error', message: 'Anda harus login untuk menyimpan data.' });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'assessments');
    }
  };

  const handleRemoveAssessment = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'assessments', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'assessments');
    }
  };

  const handleAddJournal = async () => {
    if (!newJournal.activity) {
      setStatus({ type: 'error', message: 'Isi aktivitas jurnal terlebih dahulu!' });
      return;
    }

    const id = Math.random().toString(36).substr(2, 9);
    const item: JournalEntry = { 
      ...newJournal, 
      id,
      userId: user?.uid || ''
    };
    
    try {
      if (user) {
        await setDoc(doc(db, 'journals', id), item);
        
        // Automatic backup to drive
        if (isAuthenticated) {
          const content = ` Jurnal Harian Guru - ${item.date}\n Kelas: ${item.class}\n Mapel: ${item.subject}\n Aktivitas: ${item.activity}\n Catatan: ${item.notes}`;
          saveToDrive(`Jurnal_${item.date.replace(/-/g, '_')}_Kelas${item.class}.md`, content);
        }

        setNewJournal({ date: new Date().toISOString().split('T')[0], activity: '', class: '7', subject: 'IPS', notes: '' });
        setStatus({ type: 'success', message: 'Jurnal harian berhasil disimpan.' });
        confetti();
      } else {
        setStatus({ type: 'error', message: 'Anda harus login untuk menyimpan jurnal.' });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'journals');
    }
  };

  const handleRemoveJournal = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'journals', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'journals');
    }
  };

  const generateQuiz = async () => {
    if (!topic) {
      setStatus({ type: 'error', message: 'Tentukan topik materi kuis terlebih dahulu di tab Modul RPP!' });
      return;
    }
    if (todayUsage >= DAILY_LIMIT) {
      setStatus({ type: 'error', message: `Maaf, limit harian Anda (${DAILY_LIMIT}) telah tercapai. Silakan coba lagi besok.` });
      return;
    }

    setIsGenerating(true);
    setGeneratingMessage('AI sedang menyusun butir soal HOTS (C4-C5) berbasis topik kuis...');
    setStatus({ type: null, message: '' });

    try {
      const { generateQuizContent } = await import('./lib/gemini');
      const jsonResponse = await generateQuizContent(topic, grade);
      
      let data;
      try {
        // Clean potential markdown code blocks if AI included them
        const cleanJson = jsonResponse.replace(/```json\n?|\n?```/g, '').trim();
        data = JSON.parse(cleanJson);
      } catch (parseError) {
        console.error('Quiz JSON Parse Error:', parseError);
        throw new Error('Format kuis dari AI tidak valid. Silakan coba generate ulang.');
      }

      if (!data || !data.questions || !Array.isArray(data.questions)) {
        throw new Error('Kuis yang dihasilkan tidak lengkap.');
      }

      const newQuiz: Quiz = {
        id: Math.random().toString(36).substr(2, 9),
        title: data.title || `Kuis: ${topic}`,
        topic: data.topic || topic,
        grade: data.grade || grade,
        difficulty: data.difficulty || 'Sedang',
        userId: user?.uid || '',
        date: new Date().toLocaleString('id-ID'),
        questions: data.questions.map((q: any) => ({ 
          ...q, 
          id: Math.random().toString(36).substr(2, 9),
          // Ensure correctAnswer is a string
          correctAnswer: String(q.correctAnswer)
        }))
      };

      if (user) {
        await setDoc(doc(db, 'quizzes', newQuiz.id), newQuiz);
        
        // Simpan juga ke history untuk tracking limit harian
        const historyEntry: HistoryItem = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'Kuis',
          topic: newQuiz.title,
          content: JSON.stringify(newQuiz),
          date: newQuiz.date,
          userId: user.uid
        };
        await setDoc(doc(db, 'history', historyEntry.id), historyEntry);
      }
      setStatus({ type: 'success', message: 'Kuis interaktif berhasil dibuat oleh AI!' });
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Gagal membuat kuis. Silakan coba lagi.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setQuizView('taking');
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setQuizFeedback({});
    setQuizScore(null);
    setMarkedDoubt({});
    setTimeLeft(30 * 60); // Default 30 minutes
    localStorage.removeItem('ips_quiz_progress');
  };

  const completeQuiz = async () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setIsFullscreen(false);
    if (!activeQuiz) return;
    
    let correctCount = 0;
    activeQuiz.questions.forEach(q => {
      if (userAnswers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / activeQuiz.questions.length) * 100);
    setQuizScore(finalScore);
    setQuizView('result');
    localStorage.removeItem('ips_quiz_progress');

    try {
      await addDoc(collection(db, 'quizResults'), {
        quizId: activeQuiz.id,
        quizTitle: activeQuiz.title,
        teacherId: activeQuiz.userId,
        studentId: user?.uid || 'anonymous',
        studentName: user?.displayName || studentUsername || 'Anonymous',
        score: finalScore,
        answers: userAnswers,
        date: new Date().toLocaleDateString('id-ID'),
        timestamp: serverTimestamp()
      });
      setStatus({ type: 'success', message: 'Hasil kuis berhasil disimpan!' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'quizResults');
    }
  };

  const submitAnswer = (answer: string) => {
    if (!activeQuiz) return;
    const currentQuestion = activeQuiz.questions[currentQuestionIndex];
    
    const isCorrect = answer.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();
    
    // In CBT mode, we might not show feedback immediately, 
    // but the previous requirement asked for it. 
    // We'll keep it for now but the UI will decide when to show it.
    setQuizFeedback({
      ...quizFeedback,
      [currentQuestion.id]: {
        isCorrect,
        feedback: currentQuestion.explanation
      }
    });

    setUserAnswers({
      ...userAnswers,
      [currentQuestion.id]: answer
    });
  };

  const nextQuestion = () => {
    if (!activeQuiz) return;
    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      completeQuiz();
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processImportedData(results.data);
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
        error: (error) => {
          console.error('CSV Parsing Error:', error);
          setStatus({ type: 'error', message: 'Gagal membaca file CSV.' });
        }
      });
    } else if (extension === 'xlsx' || extension === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = evt.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          processImportedData(json);
        } catch (err) {
          console.error('Excel Parsing Error:', err);
          setStatus({ type: 'error', message: 'Gagal membaca file Excel.' });
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsBinaryString(file);
    } else {
      setStatus({ type: 'error', message: 'Format file tidak didukung. Gunakan .csv atau .xlsx' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const processImportedData = async (data: any[]) => {
    const newData = data.map((row: any) => ({
      id: row.id || Math.random().toString(36).substr(2, 9),
      name: row.Nama || row.name || row['Nama Siswa'] || Object.values(row)[0] || '',
      grade: row.Kelas || row.grade || row['Kelas'] || '7',
      formative: Number(row.Formatif || row.formative || 0),
      sumatifTengah: Number(row['Sumatif Tengah'] || row['STS'] || row.sumatifTengah || 0),
      summative: Number(row.Sumatif || row.summative || 0),
      sumatifAkhir: Number(row['Sumatif Akhir'] || row.sumatifAkhir || 0),
      userId: user?.uid || ''
    })).filter((item: any) => item.name && typeof item.name === 'string');

    if (newData.length > 0) {
      if (user) {
        for (const item of newData) {
          await setDoc(doc(db, 'assessments', item.id), item);
        }
        setStatus({ type: 'success', message: `Berhasil mengimpor ${newData.length} data nilai!` });
      } else {
        setStatus({ type: 'error', message: 'Silakan login untuk mengimpor data.' });
      }
    } else {
      setStatus({ type: 'error', message: 'Format data tidak dikenali atau file kosong.' });
    }
  };

  const saveAssessmentsToDrive = async () => {
    if (filteredAssessments.length === 0 || !isAuthenticated) return;
    const header = "ID,Nama Siswa,Kelas,Formatif,Sumatif Tengah,Sumatif,Sumatif Akhir\n";
    const body = filteredAssessments.map(a => `${a.id},${a.name},${a.grade},${a.formative},${a.sumatifTengah},${a.summative},${a.sumatifAkhir}`).join("\n");
    const content = header + body;
    
    try {
      const res = await fetch('/api/drive/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: `Database_Nilai_IPS_${new Date().toISOString().split('T')[0]}.csv`, 
          content, 
          mimeType: 'text/csv' 
        })
      });
      if (res.ok) {
        confetti();
        setStatus({ type: 'success', message: 'Database Penilaian berhasil diupload ke Drive!' });
      } else {
        const errData = await res.json().catch(() => ({}));
        setStatus({ type: 'error', message: errData.error || 'Gagal upload ke Drive.' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Kesalahan jaringan saat upload.' });
    }
  };

  const generateRPP = async () => {
    if (!topic) return;
    if (todayUsage >= DAILY_LIMIT) {
      setStatus({ type: 'error', message: `Maaf, limit harian Anda (${DAILY_LIMIT}) telah tercapai. Silakan coba lagi besok.` });
      return;
    }
    setIsGenerating(true);
    setGeneratingMessage('AI sedang menyusun diksi pedagogis terbaik untuk RPP Anda...');
    setAiResult('');
    try {
      const res = await generateTeachingContent(`RPP Lengkap`, topic, kurikulum, grade);
      const content = res || '';
      setAiResult(content);

      const newHistory: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'RPP',
        topic: topic,
        content: content,
        date: new Date().toLocaleString('id-ID'),
        userId: user?.uid || ''
      };
      if (user) {
        await setDoc(doc(db, 'history', newHistory.id), newHistory);
      }

      setActiveTab('materi'); // Show result
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportPDF = async () => {
    if (!contentRef.current) return;
    try {
      const pdfSizeMap: Record<string, [number, number]> = {
        A4: [210, 297],
        F4: [215, 330],
        Legal: [216, 356]
      };

      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          // --- OKLCH FIX for Tailwind 4 + html2canvas ---
          const allElements = clonedDoc.getElementsByTagName("*");
          for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i] as HTMLElement;
            const style = window.getComputedStyle(el);
            
            // Critical properties that html2canvas will attempt to parse
            ['color', 'backgroundColor', 'borderColor', 'outlineColor'].forEach(prop => {
              const value = style.getPropertyValue(prop);
              if (value && value.includes('oklch')) {
                // Force safe fallbacks if an oklch color is detected
                if (prop === 'backgroundColor') el.style.setProperty(prop, '#ffffff', 'important');
                else if (prop === 'color') el.style.setProperty(prop, '#1e293b', 'important');
                else el.style.setProperty(prop, '#e2e8f0', 'important');
              }
            });
          }

          const target = clonedDoc.querySelector('.prose');
          if (target instanceof HTMLElement) {
            target.style.backgroundColor = '#ffffff';
            target.style.color = '#1e293b';
          }
        }
      });
      const imgData = canvas.toDataURL('image/png');
      const format = pdfSizeMap[pageSize] || [210, 297];
      const pdf = new jsPDF('p', 'mm', format);
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`IPS_${topic || 'Document'}.pdf`);
    } catch (err) {
      console.error('PDF Export failed:', err);
      setStatus({ type: 'error', message: 'Gagal mengunduh PDF. Silakan coba lagi.' });
    }
  };

  const exportWord = () => {
    // Page Size Configuration (Twips: 1/1440 inch)
    const sizeConfig = {
      A4: { width: 11906, height: 16838 },
      F4: { width: 12189, height: 18708 },
      Legal: { width: 12240, height: 20160 }
    };

    const docChildren: any[] = [];

    // 1. Official Header
    docChildren.push(
      new Paragraph({
        text: "RENCANA PEMBELAJARAN MENDALAM (RPM)",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );

    // 2. Identity Section in a Table (Academic Standard)
    const identityRows = [
      { label: "Mata Pelajaran", value: subject },
      { label: "Satuan Pendidikan", value: school },
      { label: "Kelas / Semester", value: `${grade} / ${semester}` },
      { label: "Nama Guru", value: teacherName },
      { label: "NIP", value: nip },
      { label: "Topik Utama", value: topic },
      { label: "Alokasi Waktu", value: meetings },
    ];

    docChildren.push(
      new Table({
        width: { size: 9000, type: WidthType.DXA },
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.NONE },
          insideVertical: { style: BorderStyle.NONE },
        },
        rows: identityRows.map(row => new TableRow({
          children: [
            new TableCell({
              width: { size: 2500, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: row.label, bold: true, font: "Inter" })] })],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              width: { size: 300, type: WidthType.DXA },
              children: [new Paragraph({ text: ":" })],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              width: { size: 6200, type: WidthType.DXA },
              children: [new Paragraph({ text: row.value })],
              verticalAlign: VerticalAlign.CENTER,
            }),
          ],
        })),
      })
    );

    docChildren.push(new Paragraph({ spacing: { before: 400 } }));

    // 3. Parse Body Content (Basic Markdown Parser for Word)
    const lines = (aiResult || "").split("\n");
    let inSignatureBlock = false;
    const signatureData: Record<string, string> = {};

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Handle Signature Marker
      if (trimmedLine.includes("[SEKSI_PENGESAHAN]")) {
        inSignatureBlock = true;
        return;
      }
      if (trimmedLine.includes("[/SEKSI_PENGESAHAN]")) {
        inSignatureBlock = false;
        
        // Render Signature Table
        docChildren.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ text: "Mengetahui,", spacing: { after: 100 } })],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ text: `${signatureData["Kota"] || "Kebumen"}, ${signatureData["Tanggal"] || ""}`, spacing: { after: 100 } })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: "Kepala Sekolah,", spacing: { after: 800 } })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: "Guru Mata Pelajaran,", spacing: { after: 800 } })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: signatureData["Kepala Sekolah"] || "..........................", bold: true })] }),
                      new Paragraph({ text: `NIP. ${signatureData["NIP Kepala"] || ".........................."}` }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: signatureData["Guru Mata Pelajaran"] || teacherName, bold: true })] }),
                      new Paragraph({ text: `NIP. ${signatureData["NIP Guru"] || nip}` }),
                    ],
                  }),
                ],
              }),
            ],
          })
        );
        return;
      }

      if (inSignatureBlock) {
        const [key, ...valParts] = trimmedLine.split(":");
        if (key && valParts.length > 0) {
          signatureData[key.trim()] = valParts.join(":").trim();
        }
        return;
      }

      // Identify Headers
      if (trimmedLine.startsWith("###")) {
        docChildren.push(new Paragraph({
          text: trimmedLine.replace("###", "").trim(),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        }));
      } else if (trimmedLine.startsWith("##")) {
        docChildren.push(new Paragraph({
          text: trimmedLine.replace("##", "").trim(),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
          border: { bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 } }
        }));
      } else if (trimmedLine.startsWith("#")) {
        // Skip main title if it's already in header, or treat as H1 if not RPM
        if (!trimmedLine.includes("RENCANA PEMBELAJARAN")) {
          docChildren.push(new Paragraph({
            text: trimmedLine.replace("#", "").trim(),
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }));
        }
      } else {
        // Process bold markers **
        const parts = trimmedLine.split(/(\*\*.*?\*\*)/);
        const textRuns = parts.map(part => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return new TextRun({
              text: part.slice(2, -2),
              bold: true,
            });
          }
          return new TextRun({ text: part });
        });

        docChildren.push(new Paragraph({
          children: textRuns,
          spacing: { after: 120 },
          alignment: AlignmentType.BOTH
        }));
      }
    });

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: sizeConfig[pageSize],
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            }
          }
        },
        headers: {
          default: new DocxHeader({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "ADMINISTRASI PEMBELAJARAN - IPS MAESTRO", size: 18, color: "666666" }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new DocxFooter({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Halaman ", size: 18, color: "666666" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "666666" }),
                  new TextRun({ text: " dari ", size: 18, color: "666666" }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: "666666" }),
                ],
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Dibuat secara otomatis oleh AI Maestro - Catur Pamungkas, S.Pd.,Gr.", size: 14, color: "999999", italics: true }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 100 },
              }),
            ],
          }),
        },
        children: docChildren,
      }],
    });

    Packer.toBlob(doc).then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RPM_IPS_${topic || 'Document'}_${pageSize}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  };

  const exportPlainText = () => {
    if (!aiResult) return;
    const blob = new Blob([aiResult], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IPS_${topic || 'Document'}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportAssessmentsWord = () => {
    if (filteredAssessments.length === 0) return;

    const tableHeader = new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ text: "Nama Siswa", bold: true })],
            alignment: AlignmentType.CENTER 
          })],
          shading: { fill: "f3f4f6" },
          verticalAlign: VerticalAlign.CENTER,
        }),
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ text: "Kelas", bold: true })],
            alignment: AlignmentType.CENTER 
          })],
          shading: { fill: "f3f4f6" },
          verticalAlign: VerticalAlign.CENTER,
        }),
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ text: "Formatif", bold: true })],
            alignment: AlignmentType.CENTER 
          })],
          shading: { fill: "f3f4f6" },
          verticalAlign: VerticalAlign.CENTER,
        }),
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ text: "Sumatif Tengah", bold: true })],
            alignment: AlignmentType.CENTER 
          })],
          shading: { fill: "f3f4f6" },
          verticalAlign: VerticalAlign.CENTER,
        }),
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ text: "Sumatif", bold: true })],
            alignment: AlignmentType.CENTER 
          })],
          shading: { fill: "f3f4f6" },
          verticalAlign: VerticalAlign.CENTER,
        }),
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ text: "Sumatif Akhir", bold: true })],
            alignment: AlignmentType.CENTER 
          })],
          shading: { fill: "f3f4f6" },
          verticalAlign: VerticalAlign.CENTER,
        }),
      ],
    });

    const tableRows = filteredAssessments.map(a => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: a.name })] }),
        new TableCell({ children: [new Paragraph({ text: a.grade, alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: a.formative.toString(), alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: a.sumatifTengah.toString(), alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: a.summative.toString(), alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: a.sumatifAkhir.toString(), alignment: AlignmentType.CENTER })] }),
      ],
    }));

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [tableHeader, ...tableRows],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 2 },
        bottom: { style: BorderStyle.SINGLE, size: 2 },
        left: { style: BorderStyle.SINGLE, size: 2 },
        right: { style: BorderStyle.SINGLE, size: 2 },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
        insideVertical: { style: BorderStyle.SINGLE, size: 1 },
      }
    });

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
          }
        },
        children: [
          new Paragraph({
            children: [new TextRun({ text: "DAFTAR NILAI SISWA", bold: true, size: 28 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          table,
          new Paragraph({
            children: [
              new TextRun({ text: `\nTotal Siswa: ${filteredAssessments.length}`, size: 20 }),
              new TextRun({ text: `\nRata-rata Formatif: ${(filteredAssessments.reduce((sum, a) => sum + a.formative, 0) / filteredAssessments.length).toFixed(1)}`, size: 20 }),
              new TextRun({ text: `\nRata-rata Sumatif Tengah: ${(filteredAssessments.reduce((sum, a) => sum + a.sumatifTengah, 0) / filteredAssessments.length).toFixed(1)}`, size: 20 }),
              new TextRun({ text: `\nRata-rata Sumatif: ${(filteredAssessments.reduce((sum, a) => sum + a.summative, 0) / filteredAssessments.length).toFixed(1)}`, size: 20 }),
              new TextRun({ text: `\nRata-rata Sumatif Akhir: ${(filteredAssessments.reduce((sum, a) => sum + a.sumatifAkhir, 0) / filteredAssessments.length).toFixed(1)}`, size: 20 }),
            ],
            spacing: { before: 400 }
          })
        ],
      }],
    });

    Packer.toBlob(doc).then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Daftar_Nilai_IPS_${new Date().toLocaleDateString('id-ID')}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  };

  const exportQuizzesJSON = () => {
    if (quizzes.length === 0) return;
    const dataStr = JSON.stringify(quizzes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `daftar_kuis_ips_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
    setStatus({ type: 'success', message: 'Kuis berhasil diekspor ke JSON!' });
  };

  const exportQuizzesCSV = () => {
    if (quizzes.length === 0) return;
    
    const flattenedData = quizzes.flatMap(quiz => 
      quiz.questions.map(q => ({
        quiz_id: quiz.id,
        quiz_title: quiz.title,
        quiz_topic: quiz.topic,
        quiz_grade: quiz.grade,
        quiz_difficulty: quiz.difficulty,
        question_id: q.id,
        question_type: q.type,
        question_text: q.question,
        options: q.options ? q.options.join('|') : '',
        correct_answer: q.correctAnswer,
        explanation: q.explanation
      }))
    );

    const csv = Papa.unparse(flattenedData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `daftar_kuis_ips_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    setStatus({ type: 'success', message: 'Kuis berhasil diekspor ke CSV!' });
  };

  const exportBankSoalExcel = () => {
    if (!bankSoalData?.questions) return;
    const flattenedData = bankSoalData.questions.map((q: any) => ({
      Topik: bankSoalData.topic || bankSoalConfig.topic,
      Kelas: bankSoalData.grade || grade,
      Kesulitan: bankSoalData.difficulty || bankSoalConfig.difficulty,
      Tipe_Soal: q.type,
      Pertanyaan: q.question,
      Opsi: q.options ? q.options.join(' | ') : '',
      Jawaban_Benar: q.answer || q.correctAnswer,
      Penjelasan: q.explanation
    }));

    const csv = Papa.unparse(flattenedData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bank_Soal_IPS_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    setStatus({ type: 'success', message: 'Bank Soal CSV (Excel) berhasil diunduh!' });
  };

   const exportBankSoalPDF = async () => {
    if (!bankSoalData?.questions) return;
    setStatus({ type: null, message: 'Menyiapkan Export PDF Profesional...' });
    
    try {
      const format = exportConfig.pageSize === 'f4' ? [215.9, 330.2] : 'a4';
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: format
      });
      
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - 2 * margin;
      const isDouble = exportConfig.layout === 'double';
      const colWidth = isDouble ? (contentWidth - 10) / 2 : contentWidth;
      
      let y = 20;
      let column = 0; // 0 or 1 for double column

      // --- Professional Header (KOP SURAT) ---
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("PEMERINTAH KABUPATEN KEBUMEN", pageWidth / 2, y, { align: 'center' });
      y += 6;
      doc.text("DINAS PENDIDIKAN, KEPEMUDAAN DAN OLAHRAGA", pageWidth / 2, y, { align: 'center' });
      y += 6;
      doc.setFontSize(16);
      doc.text(school.toUpperCase(), pageWidth / 2, y, { align: 'center' });
      y += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Alamat: ${school}`, pageWidth / 2, y, { align: 'center' });
      y += 4;
      doc.setLineWidth(1);
      doc.line(margin, y, pageWidth - margin, y);
      y += 1.2;
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("BANK SOAL PERTANYAAN " + (subject || bankSoalData.subject || "IPS").toUpperCase(), pageWidth / 2, y, { align: 'center' });
      y += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const leftInfo = [
        `Mata Pelajaran : ${subject || bankSoalData.subject || "IPS"}`,
        `Kelas / Jenjang : ${grade} / ${educationLevel}`,
      ];
      const rightInfo = [
        `Topik : ${bankSoalData.topic || bankSoalConfig.topic}`,
        `Level : ${bankSoalData.difficulty || bankSoalConfig.difficulty}`,
      ];

      leftInfo.forEach((text, i) => doc.text(text, margin, y + i * 5));
      rightInfo.forEach((text, i) => doc.text(text, pageWidth / 2 + 10, y + i * 5));
      y += 15;

      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      const checkPage = (heightNeeded: number) => {
        if (y + heightNeeded > pageHeight - 20) {
          if (isDouble && column === 0) {
            column = 1;
            y = 55; // start below header on same page
          } else {
            doc.addPage();
            column = 0;
            y = 20;
          }
          return true;
        }
        return false;
      };

      const getX = () => margin + (column * (colWidth + 10));

      for (let i = 0; i < bankSoalData.questions.length; i++) {
        const q = bankSoalData.questions[i];
        const qText = `${i + 1}. ${q.question}`;
        const lines = doc.splitTextToSize(qText, colWidth);
        
        checkPage(lines.length * 7 + 10);
        
        doc.setFont("helvetica", "bold");
        doc.text(lines, getX(), y);
        y += lines.length * 6 + 2;

        // Image if exists
        if (q.imagePrompt && exportConfig.showImages) {
          try {
            const imgUrl = `https://pollinations.ai/p/${encodeURIComponent(q.imagePrompt)}?width=400&height=300&seed=${42 + i}&nologo=true`;
            const response = await fetch(imgUrl);
            const blob = await response.blob();
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            const imgHeight = (colWidth * 0.6);
            checkPage(imgHeight + 5);
            doc.addImage(base64, 'JPEG', getX(), y, colWidth, imgHeight);
            y += imgHeight + 5;
          } catch (e) {
            console.error("Failed to add image to PDF", e);
          }
        }

        doc.setFont("helvetica", "normal");
        if (q.options?.length > 0) {
          q.options.forEach((opt: string, optIdx: number) => {
            const letter = String.fromCharCode(65 + optIdx);
            const optLines = doc.splitTextToSize(`${letter}. ${opt.replace(/^[A-Za-z][.)]\s*/, '')}`, colWidth - 5);
            checkPage(optLines.length * 6 + 2);
            doc.text(optLines, getX() + 5, y);
            y += optLines.length * 5 + 1;
          });
          y += 2;
        }

        y += 5;
      }

      // Answer Key Page
      if (exportConfig.showAnswers) {
        doc.addPage();
        y = 20;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("KUNCI JAWABAN & PEMBAHASAN", pageWidth / 2, y, { align: 'center' });
        y += 15;
        doc.setFontSize(10);
        
        bankSoalData.questions.forEach((q: any, i: number) => {
          const ansText = `${i + 1}. Jawaban: ${q.answer}`;
          const lines = doc.splitTextToSize(ansText, contentWidth);
          if (y + lines.length * 7 > pageHeight - 20) { doc.addPage(); y = 20; }
          doc.setFont("helvetica", "bold");
          doc.text(lines, margin, y);
          y += lines.length * 6;

          const expText = `Pembahasan: ${q.explanation}`;
          const expLines = doc.splitTextToSize(expText, contentWidth - 5);
          if (y + expLines.length * 7 > pageHeight - 20) { doc.addPage(); y = 20; }
          doc.setFont("helvetica", "normal");
          doc.text(expLines, margin + 5, y);
          y += expLines.length * 5 + 5;
        });
      }

      doc.save(`Bank_Soal_${subject}_Kelas${grade}_${new Date().getTime()}.pdf`);
      setStatus({ type: 'success', message: 'Bank Soal PDF Profesional berhasil diunduh!' });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Gagal mengekspor PDF.' });
    }
  };

  const handleRegenerateImage = async (questionIdx: number) => {
    if (!bankSoalData) return;
    setRegeneratingImageId(questionIdx.toString());
    try {
      const question = bankSoalData.questions[questionIdx];
      const newPrompt = await generateSingleImagePrompt(question.question);
      const updatedQuestions = [...bankSoalData.questions];
      updatedQuestions[questionIdx] = { ...question, imagePrompt: newPrompt };
      setBankSoalData({ ...bankSoalData, questions: updatedQuestions });
      setStatus({ type: 'success', message: 'Gambar berhasil diperbarui' });
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Gagal memperbarui gambar.' });
    } finally {
      setRegeneratingImageId(null);
    }
  };

  const handleUploadImage = (questionIdx: number, file: File) => {
    if (!bankSoalData) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const updatedQuestions = [...bankSoalData.questions];
      updatedQuestions[questionIdx] = { 
        ...bankSoalData.questions[questionIdx], 
        customImageUrl: e.target?.result as string 
      };
      setBankSoalData({ ...bankSoalData, questions: updatedQuestions });
      setStatus({ type: 'success', message: 'Gambar berhasil diunggah' });
    };
    reader.readAsDataURL(file);
  };

  const exportBankSoalWord = async () => {
    if (!bankSoalData?.questions) return;
    try {
      const children = [
        new Paragraph({
          text: "BANK SOAL IPS",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Topik: ${bankSoalData.topic || bankSoalConfig.topic}\n`, break: 1 }),
            new TextRun({ text: `Kelas: ${bankSoalData.grade || grade}\n`, break: 1 }),
            new TextRun({ text: `Kesulitan: ${bankSoalData.difficulty || bankSoalConfig.difficulty}\n`, break: 1 })
          ],
          spacing: { after: 400 }
        })
      ];

      bankSoalData.questions.forEach((q: any, i: number) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${i + 1}. `, bold: true }),
              new TextRun({ text: `[${q.type.toUpperCase()}] `, bold: true }),
              new TextRun({ text: q.question })
            ],
            spacing: { before: 200, after: 100 }
          })
        );

        if (q.options?.length > 0) {
          q.options.forEach((opt: string, optIndex: number) => {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `${String.fromCharCode(65 + optIndex)}. `, bold: true }),
                  new TextRun({ text: opt })
                ],
                indent: { left: 720 }, // roughly 0.5 inch
                spacing: { after: 50 }
              })
            );
          });
        }

        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Jawaban: ", italics: true }),
              new TextRun({ text: q.answer || q.correctAnswer })
            ],
            spacing: { before: 100, after: 50 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Penjelasan: ", italics: true }),
              new TextRun({ text: q.explanation })
            ],
            spacing: { after: 200 }
          })
        );
      });

      const doc = new Document({
        sections: [{ properties: {}, children }]
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Bank_Soal_IPS_${new Date().toISOString().split('T')[0]}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
      setStatus({ type: 'success', message: 'Bank Soal Word berhasil diunduh!' });
    } catch (e: any) {
      console.error(e);
      setStatus({ type: 'error', message: 'Gagal mengekspor Word' });
    }
  };

  const exportBankSoalText = () => {
    if (!bankSoalData?.questions) return;
    let txt = `BANK SOAL IPS\n------------------------\nTopik: ${bankSoalData.topic || bankSoalConfig.topic}\nKelas: ${bankSoalData.grade || grade}\nKesulitan: ${bankSoalData.difficulty || bankSoalConfig.difficulty}\n\n`;
    bankSoalData.questions.forEach((q: any, i: number) => {
      txt += `${i + 1}. [${q.type.toUpperCase()}] ${q.question}\n`;
      if (q.options?.length > 0) {
        q.options.forEach((opt: string) => txt += `   - ${opt}\n`);
      }
      txt += `\nKunci Jawaban: ${q.answer || q.correctAnswer}\n`;
      txt += `Penjelasan: ${q.explanation}\n`;
      txt += `------------------------\n\n`;
    });

    const blob = new Blob([txt], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bank_Soal_IPS_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    setStatus({ type: 'success', message: 'Bank Soal TXT berhasil diunduh!' });
  };

  // --- Sub-Components ---
  // --- Helper to Render Signature in Preview ---
  const SignatureBlock = ({ content }: { content: string }) => {
    const lines = content.split('\n');
    const data: Record<string, string> = {};
    lines.forEach(line => {
      const [key, ...vals] = line.split(':');
      if (key && vals.length > 0) data[key.trim()] = vals.join(':').trim();
    });

    return (
      <div className="mt-12 grid grid-cols-2 gap-8 text-sm">
        <div>
          <p className="mb-1">Mengetahui,</p>
          <p className="mb-16">Kepala Sekolah,</p>
          <p className="font-bold underline">{data['Kepala Sekolah'] || '..........................'}</p>
          <p>NIP. {data['NIP Kepala'] || '..........................'}</p>
        </div>
        <div>
          <p className="mb-1">{data['Kota'] || 'Kebumen'}, {data['Tanggal'] || ''}</p>
          <p className="mb-16">Guru Mata Pelajaran,</p>
          <p className="font-bold underline">{data['Guru Mata Pelajaran'] || teacherName}</p>
          <p>NIP. {data['NIP Guru'] || nip}</p>
        </div>
      </div>
    );
  };

  const renderContentWithSignatures = (text: string) => {
    const parts = text.split(/(\[SEKSI_PENGESAHAN\][\s\S]*?\[\/SEKSI_PENGESAHAN\])/);
    return parts.map((part, index) => {
      if (part.startsWith('[SEKSI_PENGESAHAN]')) {
        const content = part.replace('[SEKSI_PENGESAHAN]', '').replace('[/SEKSI_PENGESAHAN]', '').trim();
        return <SignatureBlock key={index} content={content} />;
      }
      return (
        <ReactMarkdown 
          key={index}
          components={{
            img: ({ src, alt }) => (
              <div className="my-8 group relative cursor-pointer" onClick={() => setModalImage({ 
                src: src || '', 
                alt: alt || '', 
                title: alt || 'Ilustrasi Materi',
                description: 'Gambar ini adalah bagian dari alat bantu visual untuk materi pembelajaran IPS Pak Catur Pamungkas.'
              })}>
                <div className="overflow-hidden rounded-2xl shadow-xl border border-slate-100">
                  <img 
                    src={src} 
                    alt={alt} 
                    className="w-full transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-white/90 backdrop-blur p-3 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all">
                      <Search className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </div>
                {alt && (
                  <div className="mt-3 flex items-center gap-2 justify-center">
                    <span className="w-1 h-1 rounded-full bg-primary" />
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{alt}</p>
                    <span className="w-1 h-1 rounded-full bg-primary" />
                  </div>
                )}
              </div>
            )
          }}
        >
          {part}
        </ReactMarkdown>
      );
    });
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const SidebarContent = () => {
    const mainItems: { id: Tab, icon: any, label: string }[] = [
      { id: 'beranda', icon: LayoutGrid, label: 'Dashboard' },
      { id: 'jurnal', icon: PenLine, label: 'Jurnal Harian' },
      { id: 'cbt_guru', icon: ClipboardList, label: 'Portal CBT' },
      { id: 'bank_soal', icon: FileText, label: 'Bank Soal' },
      { id: 'penilaian', icon: BarChart3, label: 'Penilaian' },
    ];

    const contentItems: { id: Tab, icon: any, label: string }[] = [
      { id: 'rpp_mendalam', icon: FileText, label: 'RPP Mendalam' },
      { id: 'silabus', icon: ClipboardList, label: 'Silabus' },
      { id: 'rpp', icon: FileText, label: 'Modul RPP / MA' },
      { id: 'materi', icon: BookOpen, label: 'Bank Materi' },
    ];

    const secondaryItems: { id: Tab, icon: any, label: string }[] = [
      { id: 'riwayat', icon: RotateCcw, label: 'Riwayat' },
      { id: 'drive', icon: HardDrive, label: 'Drive Cloud' },
      { id: 'pengaturan', icon: Settings, label: 'Pengaturan' },
    ];

    return (
      <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200">
            IPS
          </div>
          <div>
            <div className="font-black text-xl text-slate-800 tracking-tight leading-none">Maestro</div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mt-1">Smarter Teaching</div>
          </div>
        </div>

        <nav className="flex flex-col gap-6">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 mb-2 block">Utama</span>
            {mainItems.filter(item => (item.id !== 'cbt_guru' && item.id !== 'jurnal') || userRole === 'teacher').map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all group ${
                  activeTab === item.id 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === item.id ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
                {activeTab === item.id && (
                  <motion.div layoutId="activeTab" className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 mb-2 block">Konten</span>
            {contentItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-4 px-5 py-3 rounded-2xl text-sm font-bold transition-all group ${
                  activeTab === item.id 
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 mb-2 block">Sistem</span>
            {secondaryItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-4 px-5 py-3 rounded-2xl text-sm font-bold transition-all group ${
                  activeTab === item.id 
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            ))}
          </div>

          {/* Social Media & Support */}
          <div className="mt-4 p-5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl text-white relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-indigo-500/20 rounded-full blur-2xl" />
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] mb-4 opacity-70">Support Author</h4>
            <div className="space-y-3 relative z-10">
              <a href="https://youtube.com/@KangToer" target="_blank" className="flex items-center gap-3 text-xs font-bold hover:text-rose-400 transition-colors">
                <span className="w-6 h-6 bg-rose-500 rounded-lg flex items-center justify-center"><Send className="w-3.5 h-3.5" /></span>
                YouTube @KangToer
              </a>
              <a href="https://tiktok.com/@kangtoer" target="_blank" className="flex items-center gap-3 text-xs font-bold hover:text-cyan-400 transition-colors">
                <span className="w-6 h-6 bg-slate-700 rounded-lg flex items-center justify-center text-cyan-400"><Send className="w-3.5 h-3.5" /></span>
                TikTok @kangtoer
              </a>
              <a href="https://whatsapp.com/channel/0029Vb6R2Ny2v1J1dll5Mq27" target="_blank" className="flex items-center gap-3 text-xs font-bold hover:text-emerald-400 transition-colors">
                <span className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center"><MessageSquare className="w-3.5 h-3.5" /></span>
                Channel WA
              </a>
            </div>
          </div>
        </nav>

        <div className="mt-12 pt-8 border-t border-slate-100">
          {isAuthenticated && (
            <div className="mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kuota AI</span>
                <span className="text-[10px] font-black text-indigo-600">{todayUsage} / {DAILY_LIMIT}</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${usagePercentage}%` }}
                  className={`h-full rounded-full ${usagePercentage > 90 ? 'bg-rose-500' : usagePercentage > 70 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-text-light mb-6">
            <div className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
            <span className="font-bold tracking-tight">Status: {isAuthenticated ? 'Cloud Linked' : 'Offline'}</span>
          </div>
          
          {isAuthenticated ? (
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl font-bold text-xs text-rose-500 bg-rose-50 hover:bg-rose-100 transition-all">
              <LogOut className="w-4 h-4" /> Keluar Akun
            </button>
          ) : (
            <button onClick={handleLogin} className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
              Hubungkan Akun
            </button>
          )}
        </div>
      </div>
    );
  };

  const Sidebar = () => {
    return (
      <aside className="hidden md:flex w-[280px] bg-white border-r border-slate-200 flex-col h-screen sticky top-0 z-40">
        <SidebarContent />
      </aside>
    );
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Be patient...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-theme font-sans">
        <div className="bg-white p-10 rounded-[32px] max-w-md w-full shadow-2xl border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10"></div>
          
          <div className="relative">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
                <GraduationCap className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-text-dark">IPS Maestro CBT</h1>
              <p className="text-sm text-text-light mt-2">Portal Guru dan Siswa</p>
            </div>

            {showStudentLogin ? (
              <form onSubmit={handleStudentAuth} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-text-light uppercase tracking-widest mb-2 block">Username Siswa</label>
                  <input
                    type="text"
                    value={studentUsername}
                    onChange={e => setStudentUsername(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl focus:border-primary focus:bg-white transition-colors"
                    placeholder="Contoh: andi123"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-light uppercase tracking-widest mb-2 block">Password</label>
                  <input
                    type="password"
                    value={studentPassword}
                    onChange={e => setStudentPassword(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl focus:border-primary focus:bg-white transition-colors"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary text-white p-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md"
                >
                  {isRegistering ? 'Daftar Siswa Baru' : 'Login Siswa'}
                </button>
                <div className="text-center text-sm text-text-light">
                  {isRegistering ? 'Sudah punya akun?' : 'Belum punya akun?'}
                  <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="text-primary font-bold ml-1 hover:underline">
                    {isRegistering ? 'Login Siswa' : 'Daftar Disini'}
                  </button>
                </div>
                <div className="pt-4 border-t border-slate-100 text-center">
                  <button type="button" onClick={() => setShowStudentLogin(false)} className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">
                    Kembali ke Portal Guru
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={handleLogin}
                  className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-100 p-4 rounded-xl font-bold text-slate-700 hover:border-primary hover:text-primary transition-all shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /><path fill="none" d="M1 1h22v22H1z" /></svg>
                  Login sebagai Guru (Google)
                </button>
                
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-slate-500 font-medium tracking-wide">ATAU</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowStudentLogin(true)}
                  className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-md"
                >
                  Masuk sebagai Siswa
                </button>
              </div>
            )}
          </div>
        </div>
        
        {status.type && (
          <div className={`fixed bottom-6 right-6 p-4 rounded-2xl shadow-xl flex items-center gap-3 backdrop-blur-sm z-50 ${status.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'}`}>
            {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-semibold text-sm">{status.message}</span>
            <button onClick={() => setStatus({ type: null, message: '' })} className="ml-2 opacity-80 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  if (userRole === 'student') {
    return (
      <div className="min-h-screen flex flex-col bg-bg-theme font-sans text-text-dark">
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Portal Siswa</h1>
              <p className="text-xs text-text-light">CBT - {user?.displayName || studentUsername}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-rose-500 font-semibold text-sm hover:bg-rose-50 px-4 py-2 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </header>

        <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full">
           {quizView === 'selection' && (
             <>
               <div className="text-center mb-10">
                  <h2 className="text-2xl font-bold text-text-dark mb-2">Selamat Datang di CBT</h2>
                  <p className="text-text-light">Pilih Kuis yang Tersedia di Bawah Ini.</p>
               </div>
               
               <div className="grid md:grid-cols-2 gap-6">
                 {quizzes.length === 0 ? (
                   <div className="md:col-span-2 text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
                     <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle /></div>
                     <h3 className="text-lg font-bold text-slate-700">Belum Ada Kuis Tersedia</h3>
                     <p className="text-sm text-slate-500 mt-1">Silakan tunggu instruksi guru Anda.</p>
                   </div>
                 ) : (
                   quizzes.map(quiz => (
                     <div key={quiz.id} className="bg-white p-6 rounded-[24px] shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col">
                       <div className="flex-1">
                         <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold mb-4 inline-block">{quiz.grade}</span>
                         <h3 className="font-bold text-lg mb-2">{quiz.title}</h3>
                         <p className="text-sm text-text-light">{quiz.topic}</p>
                         <div className="flex items-center gap-3 mt-3">
                           <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                             <ClipboardList className="w-3.5 h-3.5" /> {quiz.questions.length} Soal
                           </span>
                           <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                             <Calendar className="w-3.5 h-3.5 text-slate-300" /> {quiz.date}
                           </span>
                         </div>
                       </div>
                       <div className="mt-6 flex gap-3">
                         <button 
                           onClick={() => { 
                             setActiveQuiz(quiz); 
                             setQuizView('taking'); 
                             setCurrentQuestionIndex(0); 
                             setUserAnswers({}); 
                             setQuizScore(null); 
                             setQuizFeedback({}); 
                             localStorage.removeItem('ips_quiz_progress');
                           }}
                           className="flex-1 bg-slate-900 text-white p-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
                         >
                           Mulai Kerjakan
                         </button>
                         <button 
                           onClick={() => {
                             const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(quiz, null, 2));
                             const downloadAnchorNode = document.createElement('a');
                             downloadAnchorNode.setAttribute("href", dataStr);
                             downloadAnchorNode.setAttribute("download", `quiz_${quiz.title.toLowerCase().replace(/\s+/g, '_')}.json`);
                             document.body.appendChild(downloadAnchorNode);
                             downloadAnchorNode.click();
                             downloadAnchorNode.remove();
                           }}
                           className="bg-slate-100 text-slate-600 p-3 rounded-xl hover:bg-slate-200 transition-colors"
                           title="Unduh Kuis"
                         >
                           <Download className="w-4 h-4" />
                         </button>
                       </div>
                     </div>
                   ))
                 )}
               </div>
             </>
           )}

           {quizView === 'taking' && activeQuiz && (
             <motion.div 
               key="taking"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-slate-50 z-50 flex flex-col overflow-hidden"
             >
               {/* CBT Header */}
               <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
                 <div className="flex items-center gap-4">
                   <div className="bg-primary p-2 rounded-xl text-white">
                     <LayoutGrid className="w-6 h-6" />
                   </div>
                   <div>
                     <h2 className="font-bold text-slate-800 leading-tight">CBT - {activeQuiz.title}</h2>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{activeQuiz.topic} • Grade {activeQuiz.grade}</p>
                   </div>
                 </div>

                 <div className="flex items-center gap-6">
                   <div className={`px-5 py-2 rounded-2xl flex items-center gap-3 border-2 ${timeLeft < 300 ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                     <Clock className="w-5 h-5" />
                     <span className="font-black text-lg tabular-nums">{formatTime(timeLeft)}</span>
                   </div>
                   <button 
                     onClick={() => {
                        if (confirm('Apakah Anda yakin ingin menyelesaikan ujian?')) {
                          completeQuiz();
                        }
                     }}
                     className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                   >
                     <Send className="w-4 h-4" />
                     Selesai
                   </button>
                 </div>
               </header>

               <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                 {/* Left Panel: Question Content */}
                 <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col">
                   <div className="max-w-3xl mx-auto w-full flex-1">
                     <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-slate-100 mb-10">
                       <div className="flex items-center gap-3 mb-8">
                         <span className="w-12 h-12 bg-indigo-50 text-primary rounded-2xl flex items-center justify-center font-black text-xl">
                           {currentQuestionIndex + 1}
                         </span>
                         <div className="h-px flex-1 bg-slate-100" />
                       </div>

                       <motion.h3 
                          key={currentQuestionIndex}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed mb-6"
                        >
                         {activeQuiz.questions[currentQuestionIndex].question}
                       </motion.h3>

                       <motion.div 
                          key={`options-cb1-${currentQuestionIndex}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          className="grid grid-cols-1 gap-4"
                        >
                         {activeQuiz.questions[currentQuestionIndex].options?.map((option, idx) => {
                           const qId = activeQuiz.questions[currentQuestionIndex].id;
                           const isSelected = userAnswers[qId] === option;
                           return (
                             <button 
                               key={idx}
                               onClick={() => submitAnswer(option)}
                               className={`w-full p-6 rounded-[24px] text-left font-bold transition-all border-2 flex items-center gap-5 group ${
                                 isSelected 
                                   ? 'bg-indigo-50 border-primary text-primary shadow-lg shadow-indigo-100/50' 
                                   : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                               }`}
                             >
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-colors ${
                                 isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                               }`}>
                                 {String.fromCharCode(65 + idx)}
                               </div>
                               <span className="flex-1">{option}</span>
                               {isSelected && (
                                 <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                                   <Check className="w-4 h-4" />
                                 </div>
                               )}
                             </button>
                           );
                         })}
                       </motion.div>
                     </div>
                   </div>

                   {/* Bottom Navigation */}
                   <div className="max-w-3xl mx-auto w-full pb-10 flex flex-wrap gap-4 justify-between items-center">
                     <div className="flex gap-3">
                       <button 
                         disabled={currentQuestionIndex === 0}
                         onClick={prevQuestion}
                         className="px-6 py-4 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-bold flex items-center gap-2 hover:bg-slate-50 disabled:opacity-30 transition-all font-mono uppercase tracking-widest text-xs"
                       >
                         <ChevronLeft className="w-5 h-5" /> Prev
                       </button>

                       <button 
                         onClick={() => setMarkedDoubt(prev => ({...prev, [activeQuiz.questions[currentQuestionIndex].id]: !prev[activeQuiz.questions[currentQuestionIndex].id]}))}
                         className={`px-6 py-4 rounded-2xl border-2 font-bold flex items-center gap-2 transition-all font-mono uppercase tracking-widest text-xs ${
                           markedDoubt[activeQuiz.questions[currentQuestionIndex].id]
                             ? 'bg-amber-50 border-amber-400 text-amber-600'
                             : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                         }`}
                       >
                         <Flag className={`w-4 h-4 ${markedDoubt[activeQuiz.questions[currentQuestionIndex].id] ? 'fill-current' : ''}`} /> Ragu-ragu
                       </button>
                     </div>

                     <button 
                       onClick={() => {
                         if (currentQuestionIndex === activeQuiz.questions.length - 1) {
                            if (confirm('Selesaikan kuis sekarang?')) completeQuiz();
                         } else {
                            nextQuestion();
                         }
                       }}
                       className="px-10 py-5 rounded-2xl bg-slate-900 text-white font-black flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 font-mono uppercase tracking-widest text-xs"
                     >
                       {currentQuestionIndex === activeQuiz.questions.length - 1 ? 'Finish' : 'Next'}
                       <ChevronRight className="w-5 h-5" />
                     </button>
                   </div>
                 </div>

                 {/* Right Panel: Navigator */}
                 <div className="w-full lg:w-80 bg-white border-l border-slate-200 p-6 flex flex-col">
                   <div className="flex items-center gap-2 mb-6">
                     <LayoutGrid className="w-5 h-5 text-slate-400" />
                     <h4 className="font-bold text-slate-700">Daftar Soal</h4>
                   </div>

                   <div className="grid grid-cols-5 gap-2 overflow-y-auto pr-1">
                     {activeQuiz.questions.map((q, idx) => {
                       const isCurrent = idx === currentQuestionIndex;
                       const isAnswered = !!userAnswers[q.id];
                       const isMarked = !!markedDoubt[q.id];

                       return (
                         <button
                           key={idx}
                           onClick={() => setCurrentQuestionIndex(idx)}
                           className={`aspect-square rounded-xl text-xs font-black transition-all flex items-center justify-center border-2 ${
                             isCurrent 
                               ? 'border-primary ring-4 ring-indigo-50 z-10' 
                               : isMarked
                                 ? 'border-amber-400 bg-amber-50 text-amber-600'
                                 : isAnswered
                                   ? 'border-emerald-500 bg-emerald-500 text-white'
                                   : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                           }`}
                         >
                           {idx + 1}
                         </button>
                       );
                     })}
                   </div>

                   {/* Legend */}
                   <div className="mt-auto pt-6 grid grid-cols-2 gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100">
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-emerald-500" />
                       <span>Terjawab</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-amber-400" />
                       <span>Ragu-ragu</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-slate-50 border border-slate-100" />
                       <span>Belum</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-white border-2 border-primary" />
                       <span>Aktif</span>
                     </div>
                   </div>
                 </div>
               </div>
             </motion.div>
           )}

           {quizView === 'result' && activeQuiz && (
             <div className="max-w-3xl mx-auto space-y-6">
               <div className="bg-white rounded-3xl p-10 text-center shadow-lg border border-slate-100">
                 <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Award className="w-12 h-12 text-primary" />
                 </div>
                 <h2 className="text-3xl font-bold mb-2">Skor Kamu: {quizScore}</h2>
                 <p className="text-text-light mb-8">Kuis: {activeQuiz.title}</p>
                 <button
                   onClick={() => setQuizView('selection')}
                   className="bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                 >
                   Kembali ke Beranda
                 </button>
               </div>

               <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                 <h3 className="text-xl font-bold mb-6">Analisis Jawaban</h3>
                 <div className="space-y-6">
                   {activeQuiz.questions.map((q, idx) => (
                     <div key={idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                       <p className="font-medium mb-4">{idx + 1}. {q.question}</p>
                       <div className="flex flex-col gap-2 mb-4 text-sm">
                         <div className="p-3 rounded-lg bg-white border border-slate-200">
                             <span className="text-text-light">Jawabanmu:</span> <span className="font-bold">{userAnswers[q.id] || '-'}</span>
                            {userAnswers[q.id] === q.correctAnswer ? ' (Benar)' : ' (Salah)'}
                         </div>
                         <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800">
                           <span className="text-emerald-600 font-bold mb-1 block">Kunci Jawaban:</span>
                           <span className="font-medium">{q.correctAnswer}</span>
                         </div>
                       </div>
                       <p className="text-sm text-slate-600 bg-slate-100 p-4 rounded-xl">
                         <strong>Penjelasan:</strong> {q.explanation}
                       </p>
                     </div>
                   ))}
                 </div>
               </div>
             </div>
           )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg-theme font-sans text-text-dark">
      <Sidebar />

      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20">M</div>
          <span className="font-black text-slate-800 tracking-tight">Maestro <span className="text-primary text-[10px]">V2</span></span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-slate-50 rounded-xl text-slate-600 active:bg-slate-100 transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-md md:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[70] w-[85%] max-w-sm bg-white shadow-2xl md:hidden"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      <main className="flex-1 min-w-0 bg-white flex flex-col min-h-screen">
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 md:mb-12 bg-white px-6 md:px-8 py-6 rounded-[24px] md:rounded-[32px] border border-slate-50 shadow-sm mx-4 md:mx-0 mt-4 md:mt-0">
          <div className="welcome flex items-center gap-4 md:gap-6 w-full md:w-auto">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl md:text-2xl shadow-lg shadow-indigo-200">
              👋
            </div>
            <div>
              <h2 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">Halo, Pak Catur!</h2>
              <p className="text-xs md:text-sm text-slate-500 font-medium">Asisten AI Anda siap membantu hari ini.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-end">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status Akun</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Terhubung
              </span>
            </div>
            
            <button className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-primary transition-all group">
              <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>

            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-12 h-12 rounded-2xl border-2 border-primary shadow-sm" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold shadow-indigo-200 shadow-lg">
                CP
              </div>
            )}
          </div>
        </header>
        
        <div className={`flex-1 ${uiConfig.layout === 'standard' ? 'max-w-7xl mx-auto w-full' : 'w-full'}`}>
          <AnimatePresence mode="wait">
            {activeTab === 'beranda' && (
              <motion.div 
                key="beranda"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* Hero section */}
                <div className="relative p-6 md:p-10 bg-slate-950 rounded-[32px] md:rounded-[40px] overflow-hidden group">
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -mr-48 -mt-48 group-hover:bg-primary/30 transition-colors duration-1000" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -ml-24 -mb-24" />
                  
                  <div className="relative z-10 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                    <div className="space-y-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/5 backdrop-blur-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-black tracking-widest text-white/80 uppercase">V2.5 Professional Update</span>
                      </div>
                      <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
                        Transformasi Pembelajaran <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 italic">IPS Abad 21.</span>
                      </h1>
                      <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-md">
                        Asisten digital Guru IPS paling canggih di Indonesia. Susun RPP, Bank Soal, dan Penilaian hanya dalam hitungan detik.
                      </p>
                      <div className="flex flex-wrap gap-3 md:gap-4 pt-4">
                        <button onClick={() => setActiveTab('bank_soal')} className="flex-1 sm:flex-none px-6 md:px-8 py-3.5 md:py-4 bg-primary text-white rounded-2xl font-black text-xs md:text-sm shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                          Mulai Draft Soal
                        </button>
                        <button onClick={() => setShowOnboarding(true)} className="flex-1 sm:flex-none px-6 md:px-8 py-3.5 md:py-4 bg-white/5 text-white rounded-2xl font-black text-xs md:text-sm border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2 justify-center">
                          <HelpCircle className="w-4 h-4" /> Panduan
                        </button>
                      </div>
                    </div>

                    <div className="hidden md:grid grid-cols-2 gap-4">
                       <div className="space-y-4">
                          <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-all">
                             <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center mb-4"><Zap className="w-5 h-5" /></div>
                             <div className="text-2xl font-black text-white">Ringan</div>
                             <div className="text-[10px] text-slate-500 uppercase font-black font-mono tracking-widest">Speed Optimized</div>
                          </div>
                          <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-all">
                             <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mb-4"><ShieldCheck className="w-5 h-5" /></div>
                             <div className="text-2xl font-black text-white">Aman</div>
                             <div className="text-[10px] text-slate-500 uppercase font-black font-mono tracking-widest">Direct Cloud Sync</div>
                          </div>
                       </div>
                       <div className="space-y-4 mt-8">
                          <div className="bg-primary/20 p-6 rounded-3xl border border-primary/20 backdrop-blur-sm group hover:bg-primary/30 transition-all">
                             <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center mb-4"><Globe className="w-5 h-5" /></div>
                             <div className="text-2xl font-black text-white">Full Mapel</div>
                             <div className="text-[10px] text-slate-300 uppercase font-black font-mono tracking-widest">IPS Interdisipliner</div>
                          </div>
                          <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-all">
                             <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center mb-4"><MonitorSmartphone className="w-5 h-5" /></div>
                             <div className="text-2xl font-black text-white">Mobile</div>
                             <div className="text-[10px] text-slate-500 uppercase font-black font-mono tracking-widest">Responsive UI</div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {/* AI Status Card */}
                  <div className="sm:col-span-2 bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-xl hover:-translate-y-1 transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-6 md:mb-8">
                        <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">Kapasitas AI Harian</h3>
                        <div className="p-2.5 md:p-3 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl"><Sparkles className="w-5 h-5" /></div>
                      </div>
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-4xl md:text-5xl font-black text-slate-900">{DAILY_LIMIT - todayUsage}</span>
                        <span className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest">Sisa Kuota</span>
                      </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-end mb-2">
                           <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Pemakaian Harian</span>
                           <span className="text-[9px] md:text-[10px] font-black text-indigo-600 uppercase tracking-widest">{todayUsage} / {DAILY_LIMIT}</span>
                        </div>
                        <div className="w-full h-2.5 md:h-3 bg-slate-100 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${usagePercentage}%` }}
                             className={`h-full rounded-full ${usagePercentage > 90 ? 'bg-rose-500' : usagePercentage > 70 ? 'bg-amber-500' : 'bg-primary'}`}
                           />
                        </div>
                    </div>
                  </div>

                  {/* Quick Shortcut 1 */}
                  <div onClick={() => setActiveTab('cbt_guru')} className="bg-rose-500 p-6 md:p-8 rounded-[32px] md:rounded-[40px] text-white cursor-pointer group shadow-lg shadow-rose-100 hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden">
                      <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                      <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                         <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center"><ClipboardList className="w-5 h-5 md:w-6 md:h-6" /></div>
                         <div>
                            <h3 className="text-lg md:text-xl font-black mb-1 leading-tight">Portal CBT Guru</h3>
                            <p className="text-rose-100 text-[10px] md:text-xs">Kelola kuis & pantau hasil ujian siswa.</p>
                         </div>
                      </div>
                  </div>

                  {/* Quick Shortcut 2 */}
                  <div onClick={() => setActiveTab('bank_soal')} className="bg-slate-900 p-6 md:p-8 rounded-[32px] md:rounded-[40px] text-white cursor-pointer group shadow-lg shadow-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden">
                      <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl" />
                      <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                         <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-xl md:rounded-2xl flex items-center justify-center"><FileText className="w-5 h-5 md:w-6 md:h-6" /></div>
                         <div>
                            <h3 className="text-lg md:text-xl font-black mb-1 leading-tight">Bank Soal</h3>
                            <p className="text-slate-400 text-[10px] md:text-xs">Generate soal variatif berbasis Bloom.</p>
                         </div>
                      </div>
                  </div>

                  {/* Full Row - Feature Grid */}
                  <div className="sm:col-span-2 lg:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                     {[
                       { id: 'rpp_mendalam', label: 'RPP Mendalam', icon: FileText, color: 'emerald', desc: '8 Dimensi Profil' },
                       { id: 'silabus', label: 'Silabus IPS', icon: ClipboardList, color: 'blue', desc: 'Kurikulum Merdeka' },
                       { id: 'riwayat', label: 'Riwayat', icon: RotateCcw, color: 'amber', desc: 'Arsip Dokumen' },
                       { id: 'penilaian', label: 'Penilaian', icon: BarChart3, color: 'purple', desc: 'Daftar Nilai Siswa' },
                     ].map(feat => (
                        <div 
                          key={feat.id} 
                          onClick={() => setActiveTab(feat.id as Tab)}
                          className="bg-white p-6 rounded-[32px] border border-slate-100 hover:shadow-lg transition-all group cursor-pointer flex flex-col gap-4"
                        >
                           <div className={`w-12 h-12 rounded-2xl bg-${feat.color}-50 text-${feat.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                              <feat.icon className="w-6 h-6" />
                           </div>
                           <div>
                              <h4 className="font-black text-slate-800 text-sm tracking-tight">{feat.label}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{feat.desc}</p>
                           </div>
                        </div>
                     ))}
                  </div>
                </div>

                {/* Promotional Footer */}
                <div className="bg-slate-50 border border-slate-200 rounded-[32px] p-8 mt-12 flex flex-col md:flex-row items-center justify-between gap-8">
                   <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-white rounded-full p-2 border-2 border-primary shadow-lg hidden md:block overflow-hidden">
                         <img src="https://catatanguruips.blogspot.com/favicon.ico" alt="Author" className="w-full h-full object-contain" />
                      </div>
                      <div>
                         <h4 className="text-lg font-black text-slate-800 tracking-tight">KONTRIBUSI & DUKUNGAN</h4>
                         <p className="text-sm text-slate-500 max-w-md">Terima kasih telah menggunakan Maestro. Hubungkan sosial media kami untuk mendapatkan update fitur terbaru.</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                       <a href="https://youtube.com/@KangToer" target="_blank" className="p-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-all hover:-translate-y-1 shadow-lg shadow-rose-100"><Send className="w-5 h-5" /></a>
                       <a href="https://tiktok.com/@kangtoer" target="_blank" className="p-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-all hover:-translate-y-1 shadow-lg shadow-slate-200"><Send className="w-5 h-5" /></a>
                       <a href="https://instagram.com/@kangtoer" target="_blank" className="p-3 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-all hover:-translate-y-1 shadow-lg"><Send className="w-5 h-5" /></a>
                       <a href="https://whatsapp.com/channel/0029Vb6R2Ny2v1J1dll5Mq27" target="_blank" className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all hover:-translate-y-1 shadow-lg shadow-emerald-100"><MessageSquare className="w-5 h-5" /></a>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'cbt_guru' && (
              <motion.div 
                key="cbt_guru"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Portal CBT Guru</h2>
                    <p className="text-slate-500 mt-1">Management Kuis, Hasil Ujian, dan Monitoring Siswa.</p>
                  </div>
                  <div className="flex gap-3">
                     <button onClick={() => setActiveTab('bank_soal')} className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:scale-105 transition-all">
                        <Plus className="w-4 h-4" /> Kuis Baru
                     </button>
                     <button onClick={exportQuizzesJSON} className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 rounded-xl font-bold text-sm border border-slate-200 shadow-sm hover:bg-slate-50 transition-all">
                        <Download className="w-4 h-4" /> Backup Data
                     </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                   <div className="md:col-span-2 space-y-6">
                      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                         <div className="flex items-center justify-between mb-6">
                            <h3 className="font-black text-slate-800 uppercase tracking-widest text-[10px]">Daftar Kuis Aktif</h3>
                            <button onClick={() => setQuizzes([])} className="text-rose-500 text-[10px] font-black uppercase tracking-widest hover:underline">Hapus Semua</button>
                         </div>
                         
                         {quizzes.length === 0 ? (
                           <div className="text-center py-12">
                              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200"><MonitorSmartphone /></div>
                              <p className="text-slate-400 font-bold text-sm">Belum Ada Kuis yang Dibuat</p>
                              <button onClick={() => setActiveTab('bank_soal')} className="mt-4 text-primary font-black text-[10px] uppercase tracking-widest border-b-2 border-primary pb-1">Buat di Bank Soal</button>
                           </div>
                         ) : (
                           <div className="space-y-4">
                              {quizzes.map(quiz => (
                                <div key={quiz.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary/30 transition-all group">
                                   <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-lg font-black text-indigo-600">
                                         {quiz.questions.length}
                                      </div>
                                      <div>
                                         <h4 className="font-bold text-slate-800 leading-tight">{quiz.title}</h4>
                                        <div className="flex items-center gap-3 mt-1">
                                          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">{quiz.topic} • Kelas {quiz.grade}</p>
                                          <span className="flex items-center gap-1 text-[9px] font-bold text-slate-300">
                                            <Calendar className="w-2.5 h-2.5" /> {quiz.date}
                                          </span>
                                        </div>
                                      </div>
                                   </div>
                                   <div className="flex gap-2">
                                      <button onClick={() => setQuizzes(quizzes.filter(q => q.id !== quiz.id))} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                                      <button onClick={() => { setActiveQuiz(quiz); setQuizView('taking'); }} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"><Search className="w-4 h-4" /></button>
                                   </div>
                                </div>
                              ))}
                           </div>
                         )}
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[32px] text-white shadow-xl flex flex-col gap-8">
                         <div>
                            <p className="text-[10px] uppercase font-black tracking-widest text-indigo-200 mb-2">Total Kuis</p>
                            <h4 className="text-4xl font-black">{quizzes.length} <span className="text-lg font-medium text-indigo-300">File</span></h4>
                         </div>
                         <div>
                            <p className="text-[10px] uppercase font-black tracking-widest text-indigo-200 mb-2">Total Hasil</p>
                            <h4 className="text-4xl font-black">{quizResultsList.length} <span className="text-lg font-medium text-indigo-300">Nilai</span></h4>
                         </div>
                         <button onClick={() => setActiveTab('riwayat')} className="w-full bg-white/10 py-3 rounded-xl font-bold text-sm backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-all">Lihat Arsip Hasil</button>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'riwayat' && (
              <motion.div 
                key="riwayat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto space-y-8 px-4 md:px-0"
              >
                <div className="bg-white rounded-[32px] md:rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Search className="text-primary w-5 h-5" /> Riwayat Generasi AI
                      </h3>
                      <p className="text-sm text-text-light">Akses kembali dokumen yang telah Anda buat.</p>
                    </div>
                  </div>

                  {history.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">
                      <FileText className="w-16 h-16 mx-auto mb-4 opacity-10" />
                      <p className="font-bold uppercase tracking-widest text-[10px]">Belum ada riwayat dokumen.</p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table View */}
                      <div className="hidden md:block">
                        <table className="w-full text-left border-separate border-spacing-0">
                          <thead>
                            <tr>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 border-b border-slate-100">Dokumen</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 border-b border-slate-100 text-center">Tipe</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 border-b border-slate-100 text-center">Tanggal</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 border-b border-slate-100 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {history.map(item => (
                              <tr key={item.id} className="group hover:bg-slate-50 transition-all even:bg-slate-50/30">
                                <td className="px-6 py-5">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm ${
                                      item.type === 'Silabus' ? 'bg-indigo-100 text-indigo-600' : 
                                      item.type === 'RPP Mendalam' ? 'bg-rose-100 text-rose-600' : 
                                      item.type === 'Kuis' ? 'bg-emerald-100 text-emerald-600' :
                                      'bg-amber-100 text-amber-600'
                                    }`}>
                                      {item.type === 'Silabus' ? '📋' : item.type === 'RPP Mendalam' ? '🎯' : item.type === 'Kuis' ? '🧠' : '📝'}
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-slate-800 leading-tight">{item.topic}</h4>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">IPS Maestro AI</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-5 text-center">
                                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                                    item.type === 'Silabus' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                                    item.type === 'RPP Mendalam' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                                    item.type === 'Kuis' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    'bg-amber-50 text-amber-600 border-amber-100'
                                  }`}>
                                    {item.type}
                                  </span>
                                </td>
                                <td className="px-6 py-5 text-center whitespace-nowrap text-xs font-bold text-slate-500 font-mono">
                                  {item.date}
                                </td>
                                <td className="px-6 py-5 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button 
                                      onClick={() => { setAiResult(item.content); setActiveTab('materi'); }}
                                      className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                                    >
                                      <Eye className="w-5 h-5" />
                                    </button>
                                    <button 
                                      onClick={async () => {
                                        if (confirm('Hapus riwayat ini?')) {
                                          await deleteDoc(doc(db, 'history', item.id));
                                        }
                                      }}
                                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="md:hidden divide-y divide-slate-100">
                        {history.map(item => (
                          <div key={item.id} className="p-6 space-y-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xl shadow-sm">
                                {item.type === 'Silabus' ? '📋' : item.type === 'RPP Mendalam' ? '🎯' : item.type === 'Kuis' ? '🧠' : '📝'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 line-clamp-1">{item.topic}</p>
                                <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border mt-1 ${
                                  item.type === 'Silabus' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                                  item.type === 'RPP Mendalam' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                                  'bg-emerald-50 text-emerald-600 border-emerald-100'
                                }`}>
                                  {item.type}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">{item.date}</div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => { setAiResult(item.content); setActiveTab('materi'); }}
                                  className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl active:bg-indigo-100"
                                >
                                  <Eye className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={async () => {
                                    if (confirm('Hapus riwayat ini?')) {
                                      await deleteDoc(doc(db, 'history', item.id));
                                    }
                                  }}
                                  className="p-2.5 bg-rose-50 text-rose-400 rounded-xl"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'pengaturan' && (
              <motion.div 
                key="pengaturan"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Settings className="text-primary" /> Pengaturan Aplikasi
                    </h3>
                    <p className="text-sm text-text-light">Sesuaikan tampilan dan pengalaman mengajar Anda.</p>
                  </div>
                  
                  <div className="px-8 pt-4">
                    <button 
                       onClick={saveProfile}
                       className="w-full py-4 bg-primary text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                      <Save className="w-5 h-5" /> Simpan Pengaturan Cloud (Sinkron Selamanya)
                    </button>
                  </div>
                  
                  <div className="p-8 space-y-12">
                    {/* Cloud Info Section */}
                    <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-emerald-900 mb-1">Tips Layanan Gratis Selamanya</h4>
                          <p className="text-xs text-emerald-700 leading-relaxed">
                            Google Drive dan Blogger API memiliki <strong>Kuota Gratis (Always Free)</strong> yang sangat besar. 
                            Anda tidak akan ditagih biaya selama penggunaan hanya untuk asisten mengajar harian. 
                            Gunakan fitur <b>Export PDF/DOCX</b> sebagai alternatif luring yang 100% bebas biaya tanpa batas.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Theme Section */}
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Tema Warna</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { id: 'light', label: 'Terang', icon: '☀️', desc: 'Default bersih dan cerah' },
                          { id: 'dark', label: 'Gelap', icon: '🌙', desc: 'Nyaman di mata saat malam' },
                          { id: 'sepia', label: 'Sepia', icon: '📜', desc: 'Nuansa klasik seperti kertas' }
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => setUiConfig({...uiConfig, theme: t.id as any})}
                            className={`p-6 rounded-3xl text-left border-2 transition-all ${
                              uiConfig.theme === t.id 
                                ? 'border-primary bg-primary-light/30 ring-4 ring-primary/5' 
                                : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 text-slate-800'
                            }`}
                          >
                            <span className="text-3xl mb-4 block">{t.icon}</span>
                            <div className="font-bold">{t.label}</div>
                            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-tight mt-1">{t.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Section */}
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Gaya Tulisan (Font)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { id: 'modern', label: 'Modern Sans', font: 'font-sans', desc: 'Inter / Sans Serif' },
                          { id: 'classic', label: 'Klasik Serif', font: 'font-serif', desc: 'Georgia / Serif' },
                          { id: 'mono', label: 'Teknis Mono', font: 'font-mono', desc: 'JetBrains / Monospace' }
                        ].map(f => (
                          <button
                            key={f.id}
                            onClick={() => setUiConfig({...uiConfig, font: f.id as any})}
                            className={`p-6 rounded-3xl text-left border-2 transition-all ${
                              uiConfig.font === f.id 
                                ? 'border-primary bg-primary-light/30 ring-4 ring-primary/5' 
                                : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className={`text-2xl mb-4 ${f.font} font-bold`}>Abc</div>
                            <div className="font-bold">{f.label}</div>
                            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-tight mt-1">{f.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Accent Color Section */}
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Warna Aksen</h4>
                      <div className="flex flex-wrap gap-4">
                        {[
                          '#4f46e5', // Indigo
                          '#0ea5e9', // Sky
                          '#10b981', // Emerald
                          '#f59e0b', // Amber
                          '#ef4444', // Red
                          '#ec4899'  // Pink
                        ].map(color => (
                          <button
                            key={color}
                            onClick={() => setUiConfig({...uiConfig, accentColor: color})}
                            className={`w-12 h-12 rounded-2xl border-4 transition-all ${
                              uiConfig.accentColor === color ? 'border-white ring-4 ring-slate-200 scale-110' : 'border-transparent hover:scale-105'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <div className="flex items-center gap-3 ml-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                           <input 
                             type="color" 
                             value={uiConfig.accentColor}
                             onChange={(e) => setUiConfig({...uiConfig, accentColor: e.target.value})}
                             className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                           />
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Kustom</span>
                        </div>
                      </div>
                    </div>

                    {/* Layout Section */}
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Tata Letak (Layout)</h4>
                      <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div>
                          <div className="font-bold text-slate-800">Mode Lebar (Wide Mode)</div>
                          <p className="text-xs text-slate-500">Gunakan seluruh lebar layar untuk konten.</p>
                        </div>
                        <button 
                          onClick={() => setUiConfig({...uiConfig, layout: uiConfig.layout === 'standard' ? 'wide' : 'standard'})}
                          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${uiConfig.layout === 'wide' ? 'bg-primary' : 'bg-slate-300'}`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${uiConfig.layout === 'wide' ? 'translate-x-8' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    </div>

                    {/* Blogger Theme Setup */}
                    <div className="bg-indigo-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-100">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                        <MonitorSmartphone className="w-40 h-40" />
                      </div>
                      <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center text-3xl">📝</div>
                           <div>
                              <h4 className="text-xl font-black tracking-tight leading-none uppercase">Blogger Theme Perfection (SEO)</h4>
                              <p className="text-indigo-200 text-sm mt-1">Gunakan template ini untuk publikasi materi yang 100% detail sempurna.</p>
                           </div>
                        </div>
                        
                        <div className="bg-slate-950/50 rounded-2xl p-6 border border-white/10 font-mono text-[10px] overflow-auto max-h-48 scrollbar-hide">
                           <pre className="text-indigo-300 whitespace-pre-wrap">
                             {`<!-- Blogger Professional Education Theme -->
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE html>
<html b:css='false' b:defaultwidgetversion='2' b:layoutsversion='3' xmlns='http://www.w3.org/1999/xhtml' xmlns:b='http://www.google.com/namespaces/blogger/widget' xmlns:data='http://www.google.com/namespaces/blogger/data' xmlns:expr='http://www.google.com/namespaces/blogger/expr'>
<head>
  <b:include data='blog' name='all-head-content'/>
  <title><data:blog.pageTitle/></title>
  <meta content='width=device-width, initial-scale=1' name='viewport'/>
  <style>
    :root { --primary: #4f46e5; --bg: #f8fafc; --text: #1e293b; }
    body { font-family: sans-serif; background: var(--bg); color: var(--text); }
    /* ... more styles available in guide ... */
  </style>
</head>
<body>
  <div class='container'>
    <b:section id='main'>
      <b:widget id='Blog1' type='Blog' />
    </b:section>
  </div>
</body>
</html>`}
                           </pre>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 pt-2">
                           <button 
                             onClick={() => {
                               navigator.clipboard.writeText(`<!-- Blogger Template XML -->`); 
                               setStatus({ type: 'success', message: 'Template Blogger disalin ke clipboard!' });
                             }}
                             className="bg-white text-indigo-900 px-6 py-3 rounded-xl font-black text-xs hover:scale-105 active:scale-95 transition-all"
                           >
                             Copy XML Template
                           </button>
                           <a 
                             href="https://youtube.com/@KangToer" 
                             target="_blank"
                             className="bg-indigo-800 text-indigo-100 px-6 py-3 rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all flex items-center gap-2"
                           >
                             <MonitorSmartphone className="w-4 h-4" /> Video Tutorial
                           </a>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <p className="text-xs text-slate-500 font-bold italic">Pengaturan disimpan secara otomatis ke browser Anda.</p>
                    <button 
                      onClick={() => {
                        localStorage.removeItem('ips_ui_config');
                        window.location.reload();
                      }}
                      className="flex items-center gap-2 text-rose-600 font-bold text-xs hover:text-rose-700 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" /> Reset Default
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'bank_soal' && (
              <motion.div 
                key="bank_soal"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="max-w-5xl mx-auto space-y-8"
              >
                {/* Tab Switcher for Bank Soal & Kuis */}
                <div className="flex justify-center">
                  <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 flex gap-1">
                    <button 
                      onClick={() => setIsQuizMode(false)}
                      className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${!isQuizMode ? 'bg-primary text-white shadow-md' : 'text-text-light hover:bg-slate-50'}`}
                    >
                      <FileText className="w-4 h-4" /> Bank Soal / PDF
                    </button>
                    <button 
                      onClick={() => setIsQuizMode(true)}
                      className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${isQuizMode ? 'bg-primary text-white shadow-md' : 'text-text-light hover:bg-slate-50'}`}
                    >
                      <Brain className="w-4 h-4" /> Kuis Interaktif CBT
                    </button>
                  </div>
                </div>

                {!isQuizMode ? (
                  <div className="space-y-8">
                    <div className="bg-white p-10 rounded-[32px] shadow-sm border border-slate-100">
                  <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">📝</div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Bank Soal & Kuis</h2>
                    <p className="text-slate-500 mt-3 max-w-2xl mx-auto">Generate berbagai tipe soal (PG, Menjodohkan, Benar/Salah, dll) berdasarkan materi yang Anda berikan, dengan klasifikasi taksonomi Bloom (C1-C6).</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Topik Kuis / Perintah <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          value={bankSoalConfig.topic}
                          onChange={(e) => setBankSoalConfig({...bankSoalConfig, topic: e.target.value})}
                          placeholder="Misal: Kerajaan Majapahit"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Teks Referensi (Opsional)</label>
                        <textarea 
                          value={bankSoalBaseText}
                          onChange={(e) => setBankSoalBaseText(e.target.value)}
                          placeholder="Paste teks materi di sini agar soal lebih akurat sesuai buku paket..."
                          rows={4}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>

                      <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative p-8 rounded-[32px] border-2 border-dashed transition-all cursor-pointer group overflow-hidden ${
                          isDragActive 
                            ? 'border-primary bg-primary/5' 
                            : documentFile 
                              ? 'border-emerald-200 bg-emerald-50/20' 
                              : 'border-slate-200 bg-slate-50/50 hover:border-primary/50 hover:bg-slate-50'
                        }`}
                      >
                        <input 
                          type="file" 
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleDocumentUploadForQuiz}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                        />
                        <div className="flex items-center gap-6 relative z-0">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${documentFile ? 'bg-emerald-500 text-white' : 'bg-white shadow-sm text-primary group-hover:scale-110'}`}>
                            {documentFile ? <CheckCircle2 className="w-8 h-8" /> : <Upload className="w-7 h-7" />}
                          </div>
                          <div>
                            <p className={`font-black text-lg tracking-tight ${documentFile ? 'text-emerald-700' : 'text-slate-800'}`}>
                              {documentFile ? 'File Referensi Aktif' : 'Upload File Referensi'}
                            </p>
                            <p className={`text-xs font-medium ${documentFile ? 'text-emerald-600' : 'text-slate-500'}`}>
                              {documentFile ? documentFile.name : 'Format PDF, DOC, atau TXT (Opsional)'}
                            </p>
                          </div>
                        </div>
                        {isDragActive && (
                          <div className="absolute inset-0 bg-primary/10 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="bg-white px-4 py-2 rounded-full text-primary font-black text-xs uppercase tracking-widest shadow-xl">Lepas untuk Unggah</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Jenjang</label>
                          <select 
                            value={educationLevel}
                            onChange={(e) => setEducationLevel(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                          >
                            <option value="SD">SD/MI</option>
                            <option value="SMP">SMP/MTs</option>
                            <option value="SMA">SMA/MA</option>
                            <option value="SMK">SMK</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Mata Pelajaran</label>
                          <input 
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="IPS, IPA, dll"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none uppercase font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Target Kelas</label>
                        <input 
                          type="text"
                          value={grade}
                          onChange={(e) => setGrade(e.target.value)}
                          placeholder="7, 8, atau 9..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Kesulitan (Taksonomi Bloom)</label>
                        <select 
                          value={bankSoalConfig.difficulty}
                          onChange={(e) => setBankSoalConfig({...bankSoalConfig, difficulty: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="C1">C1 - Mengingat (Mudah)</option>
                          <option value="C2">C2 - Memahami (Mudah)</option>
                          <option value="C3">C3 - Mengaplikasikan (Sedang)</option>
                          <option value="C4">C4 - Menganalisis (HOTS)</option>
                          <option value="C5">C5 - Mengevaluasi (HOTS)</option>
                          <option value="C6">C6 - Mencipta (Super HOTS)</option>
                        </select>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <label className="block text-sm font-bold text-slate-700 mb-4">Konfigurasi Jumlah Soal</label>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs bg-white px-2 py-1 rounded shadow-sm border border-slate-100 font-semibold w-1/2">Pilihan Ganda</span>
                            <input type="number" min="0" max="50" value={bankSoalConfig.countMC} onChange={(e) => setBankSoalConfig({...bankSoalConfig, countMC: parseInt(e.target.value) || 0})} className="w-20 text-center rounded border p-1" />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs bg-white px-2 py-1 rounded shadow-sm border border-slate-100 font-semibold w-1/2">PG Kompleks</span>
                            <input type="number" min="0" max="50" value={bankSoalConfig.countComplexMC} onChange={(e) => setBankSoalConfig({...bankSoalConfig, countComplexMC: parseInt(e.target.value) || 0})} className="w-20 text-center rounded border p-1" />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs bg-white px-2 py-1 rounded shadow-sm border border-slate-100 font-semibold w-1/2">Menjodohkan</span>
                            <input type="number" min="0" max="50" value={bankSoalConfig.countMatch} onChange={(e) => setBankSoalConfig({...bankSoalConfig, countMatch: parseInt(e.target.value) || 0})} className="w-20 text-center rounded border p-1" />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs bg-white px-2 py-1 rounded shadow-sm border border-slate-100 font-semibold w-1/2">Mengurutkan</span>
                            <input type="number" min="0" max="50" value={bankSoalConfig.countOrder} onChange={(e) => setBankSoalConfig({...bankSoalConfig, countOrder: parseInt(e.target.value) || 0})} className="w-20 text-center rounded border p-1" />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs bg-white px-2 py-1 rounded shadow-sm border border-slate-100 font-semibold w-1/2">Benar / Salah</span>
                            <input type="number" min="0" max="50" value={bankSoalConfig.countTF} onChange={(e) => setBankSoalConfig({...bankSoalConfig, countTF: parseInt(e.target.value) || 0})} className="w-20 text-center rounded border p-1" />
                          </div>

                          <div className="pt-4 mt-4 border-t border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-purple-600" />
                              <span className="text-sm font-bold text-slate-700">Gambar Pendukung AI</span>
                            </div>
                            <button 
                              onClick={() => setBankSoalConfig({...bankSoalConfig, withImages: !bankSoalConfig.withImages})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${bankSoalConfig.withImages ? 'bg-indigo-600' : 'bg-slate-300'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${bankSoalConfig.withImages ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button 
                      onClick={handleGenerateBankSoal}
                      disabled={isGenerating}
                      className="bg-primary text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 shadow-lg shadow-indigo-200 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100"
                    >
                      {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      Generate Soal Sekarang
                    </button>
                  </div>
                </div>

                {bankSoalData && bankSoalData.questions && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                    <div className="flex justify-between items-end mb-6 border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800">{bankSoalData.title || `Bank Soal: ${bankSoalConfig.topic}`}</h3>
                        <p className="text-sm text-slate-500 mt-1">Kelas {bankSoalData.grade || grade} • Level {bankSoalData.difficulty || bankSoalConfig.difficulty} • Total {bankSoalData.questions.length} Soal</p>
                      </div>
                      <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex gap-2">
                          <select 
                            value={exportConfig.pageSize}
                            onChange={(e) => setExportConfig({...exportConfig, pageSize: e.target.value as any})}
                            className="bg-transparent text-xs font-bold px-2 py-1 outline-none"
                          >
                            <option value="a4">A4 (Standar)</option>
                            <option value="f4">F4/Legal</option>
                          </select>
                          <div className="w-[1px] bg-slate-200 h-4 self-center" />
                          <select 
                            value={exportConfig.layout}
                            onChange={(e) => setExportConfig({...exportConfig, layout: e.target.value as any})}
                            className="bg-transparent text-xs font-bold px-2 py-1 outline-none"
                          >
                            <option value="single">Single Column</option>
                            <option value="double">Double Column</option>
                          </select>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
                             <button 
                               onClick={() => setBankSoalViewMode('card')}
                               className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${bankSoalViewMode === 'card' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                             >
                               <LayoutGrid className="w-4 h-4" /> Kartu
                             </button>
                             <button 
                               onClick={() => setBankSoalViewMode('table')}
                               className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${bankSoalViewMode === 'table' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                             >
                               <TableIcon className="w-4 h-4" /> Tabel
                             </button>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={exportBankSoalText} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors border border-slate-200" title="Export Text (TXT)"><FileText className="w-5 h-5" /></button>
                            <button onClick={exportBankSoalWord} className="p-2 bg-slate-50 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors border border-slate-200" title="Export Word (DOCX)"><FileText className="w-5 h-5" /></button>
                            <button onClick={exportBankSoalPDF} className="p-2 bg-rose-600 rounded-lg hover:bg-rose-700 text-white transition-all shadow-md shadow-rose-100 flex items-center gap-2 px-4" title="Export PDF"><Download className="w-4 h-4" /><span className="text-xs font-bold">Cetak PDF</span></button>
                            <button onClick={exportBankSoalExcel} className="p-2 bg-slate-50 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors border border-slate-200" title="Export Excel (CSV)"><TableIcon className="w-5 h-5" /></button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8">
                      {bankSoalViewMode === 'table' ? (
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-separate border-spacing-0">
                              <thead>
                                <tr className="bg-slate-50/50">
                                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 w-16">No</th>
                                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 min-w-[350px]">Pertanyaan</th>
                                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 w-40">Tipe</th>
                                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 w-56">Jawaban Benar</th>
                                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 min-w-[300px]">Penjelasan</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {bankSoalData.questions.map((q: any, index: number) => (
                                  <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-5 text-sm font-bold text-slate-400">{index + 1}</td>
                                    <td className="px-6 py-5">
                                      <div className="space-y-2">
                                        <p className="font-bold text-slate-800 leading-relaxed text-sm">{q.question}</p>
                                        {(q.imagePrompt || q.customImageUrl) && (
                                          <div className="flex items-center gap-2 text-[8px] text-indigo-500 font-bold uppercase tracking-wider bg-indigo-50 w-fit px-2 py-0.5 rounded border border-indigo-100">
                                            <Sparkles className="w-2.5 h-2.5" /> Visual Active
                                          </div>
                                        )}
                                        {q.options && q.options.length > 0 && (
                                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                                             {q.options.map((opt: string, i: number) => (
                                               <p key={i} className="text-[10px] text-slate-500 flex gap-1">
                                                 <span className="font-bold text-slate-400">{String.fromCharCode(65 + i)}.</span>
                                                 <span className="line-clamp-1">{opt.replace(/^[A-Za-z][.)]\s*/, '')}</span>
                                               </p>
                                             ))}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-6 py-5">
                                      <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-bold rounded uppercase tracking-tighter">
                                        {q.type === 'mc' ? 'Pilihan Ganda' : 
                                         q.type === 'complex_mc' ? 'PG Kompleks' : 
                                         q.type === 'match' ? 'Menjodohkan' : 
                                         q.type === 'order' ? 'Mengurutkan' : 
                                         q.type === 'tf' ? 'Benar / Salah' : q.type}
                                      </span>
                                    </td>
                                    <td className="px-6 py-5">
                                      <div className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl border border-emerald-100 font-bold text-[11px] inline-block shadow-sm">
                                        {q.answer || q.correctAnswer}
                                      </div>
                                    </td>
                                    <td className="px-6 py-5">
                                      <p className="text-[11px] text-slate-500 leading-relaxed italic">{q.explanation}</p>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {bankSoalData.questions.map((q: any, index: number) => (
                        <div key={index} className="p-6 rounded-2xl border border-slate-200 bg-white hover:shadow-md transition-all relative group">
                          <div className="absolute -top-3 left-6">
                            <span className="text-[10px] uppercase font-black tracking-widest bg-primary text-white px-3 py-1 rounded-full shadow-sm">
                              {q.type === 'mc' ? 'Pilihan Ganda' : 
                               q.type === 'complex_mc' ? 'PG Kompleks' : 
                               q.type === 'match' ? 'Menjodohkan' : 
                               q.type === 'order' ? 'Mengurutkan' : 
                               q.type === 'tf' ? 'Benar / Salah' : q.type}
                            </span>
                          </div>

                          <div className="flex gap-4 mt-2">
                            <div className="w-8 h-8 flex-shrink-0 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
                              {index + 1}
                            </div>
                            <div className="flex-1 space-y-5">
                                {/* Question */}
                                <div className="text-slate-800 font-semibold text-base leading-relaxed">
                                  {q.question}
                                </div>

                                  {/* Image if exists */}
                                  {(q.imagePrompt || q.customImageUrl || bankSoalConfig.withImages) && (
                                    <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 shadow-sm max-w-2xl relative group/img">
                                      {q.customImageUrl || q.imagePrompt ? (
                                        <>
                                          <img 
                                            src={q.customImageUrl || `https://pollinations.ai/p/${encodeURIComponent(q.imagePrompt)}?width=800&height=600&seed=${42 + index}&nologo=true`}
                                            alt={q.imagePrompt || "Question visual"}
                                            className="w-full h-auto object-cover max-h-[400px]"
                                            referrerPolicy="no-referrer"
                                          />
                                          <div className="bg-slate-50 px-3 py-2 text-[10px] text-slate-500 italic flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <Sparkles className="w-3 h-3 text-indigo-500" />
                                              <span>{q.customImageUrl ? 'Gambar diunggah manual' : `Visual AI: ${q.imagePrompt?.substring(0, 40)}...`}</span>
                                            </div>
                                            <div className="flex gap-2">
                                              <button 
                                                onClick={() => handleRegenerateImage(index)}
                                                disabled={regeneratingImageId === index.toString()}
                                                className="p-1 px-2 bg-white border border-slate-200 rounded text-[9px] font-bold hover:bg-slate-50 transition-colors flex items-center gap-1"
                                              >
                                                <RefreshCw className={`w-2.5 h-2.5 ${regeneratingImageId === index.toString() ? 'animate-spin' : ''}`} /> AI Prompt
                                              </button>
                                              <label className="p-1 px-2 bg-white border border-slate-200 rounded text-[9px] font-bold hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer">
                                                <Upload className="w-2.5 h-2.5" /> Upload
                                                <input 
                                                  type="file" 
                                                  className="hidden" 
                                                  accept="image/*"
                                                  onChange={(e) => e.target.files?.[0] && handleUploadImage(index, e.target.files[0])}
                                                />
                                              </label>
                                            </div>
                                          </div>
                                          {!q.customImageUrl && (
                                            <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
                                              <textarea 
                                                value={q.imagePrompt || ''}
                                                onChange={(e) => {
                                                  const updatedQuestions = [...bankSoalData.questions];
                                                  updatedQuestions[index] = { ...q, imagePrompt: e.target.value };
                                                  setBankSoalData({ ...bankSoalData, questions: updatedQuestions });
                                                }}
                                                className="flex-1 p-2 bg-slate-50 text-[10px] rounded border border-slate-100 outline-none focus:border-indigo-400 focus:bg-white transition-all resize-none h-10 font-mono"
                                                placeholder="Edit prompt visual AI di sini..."
                                              />
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <div className="bg-slate-50 p-10 text-center flex flex-col items-center gap-4">
                                          <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
                                            <Plus className="w-6 h-6" />
                                          </div>
                                          <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-800">Visual Belum Tersedia</p>
                                            <p className="text-[10px] text-slate-500">Anda dapat membuat ilustrasi dengan AI atau mengunggah gambar sendiri.</p>
                                          </div>
                                          <div className="flex gap-3">
                                            <button 
                                              onClick={() => handleRegenerateImage(index)}
                                              className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                                            >
                                              <Sparkles className="w-3 h-3" /> Buat Visual AI
                                            </button>
                                            <label className="px-5 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer">
                                              <Upload className="w-3 h-3" /> Upload File
                                              <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={(e) => e.target.files?.[0] && handleUploadImage(index, e.target.files[0])}
                                              />
                                            </label>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                              {/* Options */}
                              {q.options && q.options.length > 0 && q.type !== 'tf' && (
                                <div className="grid grid-cols-1 gap-2 pl-2 border-l-2 border-slate-100">
                                  {q.options.map((opt: string, i: number) => {
                                    // Remove potential "A.", "B.", "C." prefix if AI included it
                                    const cleanOpt = opt.replace(/^[A-Za-z][.)]\s*/, '');
                                    return (
                                      <div key={i} className="flex gap-3 items-start p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <span className="w-6 h-6 rounded-md bg-white border border-slate-200 shadow-sm flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">
                                          {String.fromCharCode(65 + i)}
                                        </span>
                                        <p className="text-sm text-slate-700 leading-relaxed pt-0.5">{cleanOpt}</p>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Answer and Explanation Container */}
                              <div className="mt-6 border border-emerald-100 rounded-xl overflow-hidden shadow-sm bg-white">
                                <div className="bg-emerald-50/50 px-5 py-3 border-b border-emerald-100 flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                    <CheckCircle className="w-4 h-4" />
                                  </div>
                                  <span className="font-bold text-emerald-800 text-sm">Jawaban & Pembahasan</span>
                                </div>
                                <div className="p-5 space-y-4">
                                  <div>
                                    <span className="inline-block px-4 py-2 bg-emerald-100/50 text-emerald-800 font-bold text-sm rounded-lg border border-emerald-200">
                                      {q.answer || q.correctAnswer}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                      {q.explanation}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                   )}
                  </div>
                </motion.div>
                )}
                  </div>
            ) : (
              <div className="space-y-8">
                <AnimatePresence mode="wait">
                      {quizView === 'selection' && (
                    <motion.div 
                      key="selection"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="grid md:grid-cols-3 gap-8 text-left"
                    >
                      <div className="md:col-span-1 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 h-fit space-y-6">
                        <div>
                          <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                            <Sparkles className="text-primary" /> Buat Kuis Topik
                          </h3>
                          <p className="text-xs text-text-light mb-4">Generate kuis instan berbasis AI dari topik yang diketik di bawah ini.</p>
                          <input 
                            type="text" 
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Misal: Perang Dunia 2"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none mb-4"
                          />
                          <button 
                            onClick={generateQuiz}
                            disabled={!topic || isGenerating}
                            className="w-full bg-primary text-white py-3 rounded-2xl font-bold shadow-md hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2 disabled:bg-slate-400 disabled:translate-y-0"
                          >
                            {isGenerating ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Proses...</>
                            ) : (
                              <><Wand2 className="w-4 h-4" /> Generate Kuis</>
                            )}
                          </button>
                        </div>
                        
                        <div className="pt-6 border-t border-slate-100">
                          <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                            <Upload className="text-primary w-5 h-5" /> Kuis dari File
                          </h3>
                          <p className="text-[11px] text-text-light mb-4">Upload dokumen PDF/Word untuk diekstrak menjadi soal HOTS (C4-C5).</p>
                          
                          <div 
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`relative border-2 border-dashed rounded-2xl p-6 transition-all mb-4 text-center cursor-pointer group ${
                              isDragActive 
                                ? 'border-primary bg-primary/5' 
                                : documentFile 
                                  ? 'border-emerald-200 bg-emerald-50/30' 
                                  : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50'
                            }`}
                          >
                            <input 
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={handleDocumentUploadForQuiz}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            
                            <div className="flex flex-col items-center gap-2">
                              <div className={`p-3 rounded-xl transition-colors ${documentFile ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 group-hover:text-primary group-hover:bg-primary/10'}`}>
                                {documentFile ? <CheckCircle2 className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                              </div>
                              {documentFile ? (
                                <div className="space-y-1">
                                  <p className="text-sm font-bold text-emerald-700 line-clamp-1">{documentFile.name}</p>
                                  <p className="text-[10px] text-emerald-600 font-medium tracking-tight">File siap diekstrak</p>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-sm font-bold text-slate-700">Pilih atau Taruh File</p>
                                  <p className="text-[10px] text-slate-400 font-medium">Format: PDF atau Word (DOCX)</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <button 
                            onClick={generateQuizFromDocument}
                            disabled={!documentFile || isGenerating}
                            className="w-full bg-emerald-600 text-white py-3 rounded-2xl font-bold shadow-md hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:bg-slate-400 disabled:shadow-none"
                          >
                            {isGenerating ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Mengekstrak...</>
                            ) : (
                              <><FileText className="w-4 h-4" /> Generate HOTS Kuis</>
                            )}
                          </button>
                        </div>

                        {/* Tampilkan Topik Aktif */}
                      </div>

                      <div className="md:col-span-2 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold">Daftar Kuis Tersedia</h3>
                          <div className="flex gap-2">
                             <button
                               onClick={exportQuizzesJSON}
                               disabled={quizzes.length === 0}
                               className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 disabled:opacity-50 disabled:grayscale"
                               title="Ekspor ke JSON"
                             >
                               JSON
                             </button>
                             <button
                               onClick={exportQuizzesCSV}
                               disabled={quizzes.length === 0}
                               className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-md shadow-indigo-200 disabled:opacity-50 disabled:grayscale"
                               title="Ekspor ke CSV"
                             >
                               <Download className="w-3.5 h-3.5" /> CSV
                             </button>
                           </div>
                        </div>
                        
                        {quizzes.length === 0 ? (
                          <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                            <ClipboardList className="w-16 h-16 mb-4 opacity-20" />
                            <p className="font-medium italic">Belum ada kuis yang dibuat.</p>
                          </div>
                        ) : (
                          <div className="grid sm:grid-cols-2 gap-4">
                            {quizzes.map(quiz => (
                              <div 
                                key={quiz.id}
                                className="p-6 bg-slate-50 rounded-[24px] border border-slate-200 transition-all group"
                              >
                                <div className="flex justify-between items-start mb-4">
                                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl">📝</div>
                                  <span className="text-[10px] font-bold bg-white px-2 py-1 rounded-full text-text-light shadow-sm">Kelas {quiz.grade}</span>
                                </div>
                                <h4 className="font-bold mb-1">{quiz.title}</h4>
                                <p className="text-xs text-text-light line-clamp-1 mb-4">{quiz.topic}</p>
                                <div className="flex items-center gap-3 mb-4">
                                  <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm border border-indigo-100/50">
                                    <ClipboardList className="w-3 h-3" /> {quiz.questions.length} Soal
                                  </span>
                                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                                    <Calendar className="w-3 h-3 text-slate-300" /> {quiz.date}
                                  </span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                    quiz.difficulty === 'Mudah' ? 'bg-success/10 text-success' :
                                    quiz.difficulty === 'Sedang' ? 'bg-amber-100 text-amber-600' :
                                    'bg-rose-100 text-rose-600'
                                  }`}>
                                    {quiz.difficulty}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200">
                                  <button 
                                    onClick={() => startQuiz(quiz)}
                                    className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 hover:border-slate-400 transition-colors"
                                  >
                                    Pratinjau
                                  </button>
                                  <button 
                                    onClick={() => { setSelectedQuizForResults(quiz); setQuizView('cbt-results' as any); }}
                                    className="flex-1 bg-primary text-white py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
                                  >
                                    Hasil CBT
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {quizView === 'taking' && activeQuiz && (
                    <motion.div 
                      key="taking"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="max-w-4xl mx-auto"
                    >
                      <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden relative">
                        {/* Improved Progress Bar */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-slate-100">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-primary to-indigo-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%` }}
                            transition={{ type: "spring", stiffness: 50, damping: 20 }}
                          />
                        </div>

                        {/* Auto-save Indicator */}
                        <div className="absolute top-4 right-10 flex items-center gap-2">
                          <AnimatePresence mode="wait">
                            {isSaving ? (
                              <motion.div 
                                key="saving"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="flex items-center gap-1.5"
                              >
                                <Loader2 className="w-3 h-3 text-primary animate-spin" />
                                <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Menyimpan...</span>
                              </motion.div>
                            ) : lastSaved && (
                              <motion.div 
                                key="saved"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-1.5"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                  Tersimpan {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="flex justify-between items-center mb-10 pt-4">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => {
                                if (confirm('Batalkan kuis? Seluruh progres pengerjaan akan hilang.')) {
                                  setQuizView('selection');
                                  localStorage.removeItem('ips_quiz_progress');
                                }
                              }}
                              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all group"
                              title="Batalkan Kuis"
                            >
                              <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            </button>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Topik Kuis</p>
                              <h4 className="font-bold text-slate-700 text-sm">{activeQuiz.title}</h4>
                            </div>
                          </div>

                          <div className="flex flex-col items-center">
                            <div className="bg-indigo-50 px-4 py-2 rounded-2xl flex items-center gap-2 mb-2 border border-indigo-100/50">
                              <Timer className="w-4 h-4 text-primary animate-pulse" />
                              <span className="text-sm font-black text-primary tracking-tight">Soal {currentQuestionIndex + 1} / {activeQuiz.questions.length}</span>
                            </div>
                            <div className="flex gap-1.5">
                              {activeQuiz.questions.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setCurrentQuestionIndex(idx)}
                                  className={`h-1.5 rounded-full transition-all duration-500 ${
                                    idx === currentQuestionIndex 
                                      ? 'bg-primary w-10' 
                                      : markedDoubt[activeQuiz.questions[idx].id]
                                        ? 'bg-amber-400 w-4'
                                      : userAnswers[activeQuiz.questions[idx].id] 
                                        ? 'bg-emerald-400 w-4' 
                                        : 'bg-slate-100 hover:bg-slate-200 w-4'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Kelas</p>
                              <p className="font-bold text-slate-700 text-sm">{activeQuiz.grade}</p>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-primary flex items-center justify-center font-black text-xs">
                              {activeQuiz.grade}
                            </div>
                          </div>
                        </div>

                        <div className="mb-12 text-left">
                          <motion.div
                            key={currentQuestionIndex}
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                          >
                            <motion.h3 
                              key={`q-${currentQuestionIndex}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-2xl sm:text-3xl font-bold text-slate-800 leading-tight"
                            >
                              {activeQuiz.questions[currentQuestionIndex].question}
                            </motion.h3>

                            {activeQuiz.questions[currentQuestionIndex].type === 'multiple-choice' ? (
                              <motion.div 
                          key={`options-cb1-${currentQuestionIndex}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          className="grid grid-cols-1 gap-4"
                        >
                                {activeQuiz.questions[currentQuestionIndex].options?.map((option, idx) => {
                                  const qId = activeQuiz.questions[currentQuestionIndex].id;
                                  const isSelected = userAnswers[qId] === option;
                                  const feedback = quizFeedback[qId];
                                  const isCorrectOption = option === activeQuiz.questions[currentQuestionIndex].correctAnswer;
                                  
                                  return (
                                    <motion.button 
                                      key={idx}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: idx * 0.05 }}
                                      disabled={!!feedback}
                                      onClick={() => submitAnswer(option)}
                                      className={`w-full p-6 rounded-3xl text-left font-bold transition-all border-2 flex items-center gap-5 group relative ${
                                        isSelected 
                                          ? feedback 
                                            ? feedback.isCorrect 
                                              ? 'bg-emerald-50 border-emerald-500 text-emerald-800' 
                                              : 'bg-rose-50 border-rose-500 text-rose-800'
                                            : 'bg-indigo-50 border-primary text-primary shadow-xl shadow-indigo-100 scale-[1.02]'
                                          : feedback && isCorrectOption
                                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 animate-pulse'
                                            : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm'
                                      }`}
                                    >
                                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs shadow-sm flex-shrink-0 transition-colors ${
                                        isSelected 
                                          ? feedback 
                                            ? feedback.isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                                            : 'bg-primary text-white'
                                          : feedback && isCorrectOption
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-100 text-slate-500 group-hover:bg-white'
                                      }`}>
                                        {String.fromCharCode(65 + idx)}
                                      </div>
                                      <span className="flex-1">{option}</span>
                                      
                                      {isSelected && !feedback && (
                                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center animate-in zoom-in duration-300">
                                          <Check className="w-4 h-4" />
                                        </div>
                                      )}
                                      {feedback && isCorrectOption && (
                                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                      )}
                                      {isSelected && feedback && !feedback.isCorrect && (
                                        <XCircle className="w-6 h-6 text-rose-600" />
                                      )}
                                    </motion.button>
                                  );
                                })}
                              </motion.div>
                            ) : (
                              <div className="space-y-4 max-w-xl">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Ketik Jawaban Anda</label>
                                <div className="relative">
                                  <input 
                                    type="text"
                                    placeholder="Contoh: Majapahit..."
                                    disabled={!!quizFeedback[activeQuiz.questions[currentQuestionIndex].id]}
                                    className={`w-full p-6 pr-20 rounded-[24px] font-bold text-lg bg-slate-50 border-2 outline-none transition-all ${
                                      quizFeedback[activeQuiz.questions[currentQuestionIndex].id]
                                        ? quizFeedback[activeQuiz.questions[currentQuestionIndex].id].isCorrect
                                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                                          : 'border-rose-500 bg-rose-50 text-rose-800'
                                        : 'border-slate-100 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5'
                                    }`}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && e.currentTarget.value) {
                                        submitAnswer(e.currentTarget.value);
                                      }
                                    }}
                                  />
                                  {!quizFeedback[activeQuiz.questions[currentQuestionIndex].id] && (
                                    <button 
                                      onClick={(e) => {
                                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                        if (input.value) submitAnswer(input.value);
                                      }}
                                      className="absolute right-3 top-3 bottom-3 px-6 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary/90 transition-all flex items-center gap-2"
                                    >
                                      Kirim <Send className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-1">Tekan Enter atau klik Kirim untuk Menjawab</p>
                              </div>
                            )}
                          </motion.div>
                        </div>

                        {/* Enhanced Feedback Section */}
                        <AnimatePresence>
                          {quizFeedback[activeQuiz.questions[currentQuestionIndex].id] && (
                            <motion.div 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 20 }}
                              className={`p-8 rounded-[32px] mb-10 border shadow-inner text-left relative overflow-hidden ${
                                quizFeedback[activeQuiz.questions[currentQuestionIndex].id].isCorrect 
                                  ? 'bg-emerald-50/80 border-emerald-100 text-emerald-900' 
                                  : 'bg-rose-50/80 border-rose-100 text-rose-900'
                              }`}
                            >
                              <div className={`absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 opacity-10 ${quizFeedback[activeQuiz.questions[currentQuestionIndex].id].isCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {quizFeedback[activeQuiz.questions[currentQuestionIndex].id].isCorrect ? <CheckCircle2 className="w-full h-full" /> : <AlertCircle className="w-full h-full" />}
                              </div>

                              <div className="flex items-start gap-5 relative z-10">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm ${
                                  quizFeedback[activeQuiz.questions[currentQuestionIndex].id].isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                                }`}>
                                  {quizFeedback[activeQuiz.questions[currentQuestionIndex].id].isCorrect ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                                </div>
                                <div className="space-y-2">
                                  <h5 className="font-black text-lg">
                                    {quizFeedback[activeQuiz.questions[currentQuestionIndex].id].isCorrect ? 'Keren! Jawaban Anda Tepat.' : 'Oops! Belum Tepat.'}
                                  </h5>
                                  {!quizFeedback[activeQuiz.questions[currentQuestionIndex].id].isCorrect && (
                                    <p className="font-bold flex items-center gap-2">
                                      <span className="text-sm opacity-60 uppercase tracking-tighter">Jawaban Benar:</span>
                                      <span className="bg-white/50 px-3 py-1 rounded-lg border border-rose-200/50">{activeQuiz.questions[currentQuestionIndex].correctAnswer}</span>
                                    </p>
                                  )}
                                  <div className="h-px bg-current opacity-10 my-2" />
                                  <p className="text-sm leading-relaxed opacity-80 font-medium">
                                    <strong>Penjelasan:</strong> {quizFeedback[activeQuiz.questions[currentQuestionIndex].id].feedback}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-100 mt-10">
                          <motion.button 
                            whileHover={{ scale: 1.02, x: -4 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={currentQuestionIndex === 0}
                            onClick={prevQuestion}
                            className={`flex-1 px-8 py-5 rounded-[28px] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all border-2 ${
                              currentQuestionIndex === 0
                                ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-50'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 shadow-sm active:shadow-inner'
                            }`}
                          >
                            <ChevronLeft className="w-5 h-5 md:w-6 h-6" /> <span>Sebelumnya</span>
                          </motion.button>
                          
                          <motion.button 
                            whileHover={userAnswers[activeQuiz.questions[currentQuestionIndex].id] ? { scale: 1.02, x: 4, y: -2 } : {}}
                            whileTap={userAnswers[activeQuiz.questions[currentQuestionIndex].id] ? { scale: 0.95 } : {}}
                            disabled={!userAnswers[activeQuiz.questions[currentQuestionIndex].id]}
                            onClick={nextQuestion}
                            className={`flex-[2] px-10 py-5 rounded-[28px] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 transition-all group relative overflow-hidden shadow-xl ${
                              !userAnswers[activeQuiz.questions[currentQuestionIndex].id]
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-2 border-transparent'
                                : 'bg-primary text-white shadow-xl shadow-primary/25 hover:bg-slate-900 hover:shadow-indigo-500/20 active:translate-y-0.5'
                            }`}
                          >
                            <span className="relative z-10">{currentQuestionIndex === activeQuiz.questions.length - 1 ? 'Selesaikan Ujian' : 'Lanjut Soal'}</span>
                            <ChevronRight className={`w-4 h-4 md:w-5 h-5 relative z-10 transition-transform ${userAnswers[activeQuiz.questions[currentQuestionIndex].id] ? 'group-hover:translate-x-1.5' : ''}`} />
                            {userAnswers[activeQuiz.questions[currentQuestionIndex].id] && (
                              <motion.div 
                                initial={{ x: '-100%' }}
                                whileHover={{ x: '100.1%' }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                              />
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {quizView === 'result' && activeQuiz && (
                    <motion.div 
                      key="result"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-2xl mx-auto text-center"
                    >
                      <div className="bg-white p-12 rounded-[48px] shadow-2xl border border-slate-100 relative overflow-hidden text-left">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24" />
                        
                        <div className="relative mb-10 text-center">
                          <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">
                            {quizScore && quizScore >= 75 ? '🏆' : '📚'}
                          </div>
                          <h2 className="text-3xl font-extrabold mb-2">Kuis Selesai!</h2>
                          <p className="text-text-light font-medium">{activeQuiz.title}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-10">
                          <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                            <p className="text-xs font-bold text-text-light uppercase tracking-widest mb-2">Skor Anda</p>
                            <h3 className={`text-5xl font-black ${quizScore && quizScore >= 75 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {quizScore}
                            </h3>
                          </div>
                          <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                            <p className="text-xs font-bold text-text-light uppercase tracking-widest mb-2">Benar</p>
                            <h3 className="text-5xl font-black text-primary">
                              {activeQuiz.questions.filter(q => userAnswers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()).length} / {activeQuiz.questions.length}
                            </h3>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <button 
                            onClick={() => startQuiz(activeQuiz)}
                            className="w-full bg-primary text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-lg"
                          >
                            <RotateCcw className="w-5 h-5" /> Coba Lagi
                          </button>
                          <button 
                            onClick={() => setQuizView('selection')}
                            className="w-full bg-slate-100 text-text-light py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
                          >
                            <Layout className="w-5 h-5" /> Kembali ke Daftar Kuis
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {quizView === 'cbt-results' as any && selectedQuizForResults && (
                    <motion.div 
                      key="cbt-results"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-4xl mx-auto"
                    >
                      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
                          <div>
                            <button 
                              onClick={() => { setQuizView('selection'); setSelectedQuizForResults(null); }}
                              className="text-xs font-bold text-text-light hover:text-primary transition-colors flex items-center gap-1 mb-2"
                            >
                              <ChevronLeft className="w-4 h-4" /> Kembali
                            </button>
                            <h2 className="text-2xl font-bold text-slate-800">Hasil CBT: {selectedQuizForResults.title}</h2>
                            <p className="text-sm text-text-light">Kelas {selectedQuizForResults.grade} • {selectedQuizForResults.topic}</p>
                          </div>
                          
                          <div className="flex gap-2">
                            <button 
                              onClick={() => window.print()}
                              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors rounded-xl text-xs font-bold flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" /> Export PDF
                            </button>
                            <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold flex items-center gap-2">
                              <Award className="w-4 h-4" /> 
                              Rata-rata: {
                                quizResultsList.filter(r => r.quizId === selectedQuizForResults.id).length > 0 
                                  ? Math.round(quizResultsList.filter(r => r.quizId === selectedQuizForResults.id).reduce((sum, r) => sum + r.score, 0) / quizResultsList.filter(r => r.quizId === selectedQuizForResults.id).length)
                                  : 0
                              }
                            </div>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b-2 border-slate-100 bg-slate-50/50">
                                <th className="p-4 text-xs font-bold text-text-light uppercase tracking-widest rounded-tl-xl w-16">No</th>
                                <th className="p-4 text-xs font-bold text-text-light uppercase tracking-widest">Nama Siswa</th>
                                <th className="p-4 text-xs font-bold text-text-light uppercase tracking-widest">Tanggal</th>
                                <th className="p-4 text-xs font-bold text-text-light uppercase tracking-widest text-center">Skor (0-100)</th>
                                <th className="p-4 text-xs font-bold text-text-light uppercase tracking-widest text-center rounded-tr-xl">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {quizResultsList.filter(r => r.quizId === selectedQuizForResults.id).length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">Belum ada siswa yang mengerjakan kuis ini.</td>
                                </tr>
                              ) : (
                                quizResultsList.filter(r => r.quizId === selectedQuizForResults.id).map((result, idx) => (
                                  <tr key={result.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 text-sm font-medium text-slate-400">{idx + 1}</td>
                                    <td className="p-4 font-bold text-slate-700">{result.studentName}</td>
                                    <td className="p-4 text-sm text-slate-500">{result.date}</td>
                                    <td className="p-4 text-center">
                                      <span className={`inline-flex items-center justify-center w-12 h-8 rounded-lg font-bold text-sm ${result.score >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                        {result.score}
                                      </span>
                                    </td>
                                    <td className="p-4 text-center text-emerald-500">
                                      <CheckCircle className="w-5 h-5 mx-auto" />
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
              </motion.div>
            )}

            {activeTab === 'penilaian' && (
              <motion.div 
                key="penilaian"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto space-y-8"
              >
                <div className="space-y-8">
                    {/* Grade Level Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {['7', '8', '9'].map(gradeLevel => {
                        const gradeData = assessments.filter(a => a.grade === gradeLevel);
                        const count = gradeData.length;
                        const avgSummative = count > 0 
                          ? (gradeData.reduce((sum, a) => sum + a.summative, 0) / count).toFixed(1)
                          : '0';
                        const passCount = gradeData.filter(a => a.summative >= 75).length;
                        const passRate = count > 0 ? Math.round((passCount / count) * 100) : 0;
                        const aboveAvg = gradeData.filter(a => a.summative > Number(avgSummative)).length;

                        return (
                          <div key={gradeLevel} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col gap-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                              <GraduationCap className="w-16 h-16 text-primary" />
                            </div>
                            
                            <div className="flex items-center justify-between relative z-10">
                              <h4 className="text-lg font-black text-slate-800 tracking-tight">Kelas {gradeLevel}</h4>
                              <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">
                                {count} Siswa
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 my-2">
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rata-rata</p>
                                <div className="flex items-end gap-1">
                                  <span className="text-2xl font-black text-primary">{avgSummative}</span>
                                  <span className="text-[10px] font-bold text-slate-400 mb-1">Poin</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Di Atas Rata</p>
                                <div className="flex items-end gap-1">
                                  <span className="text-2xl font-black text-indigo-600">{aboveAvg}</span>
                                  <span className="text-[10px] font-bold text-slate-400 mb-1">Siswa</span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ketuntasan (KKM 75)</p>
                                <span className="text-xs font-black text-emerald-600">{passRate}%</span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${passRate}%` }}
                                  className={`h-full ${passRate >= 75 ? 'bg-emerald-500' : passRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2 text-[10px] font-bold text-slate-400 border-t border-slate-50">
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-500" /> {passCount} Tuntas
                              </div>
                              <div className="flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-rose-500" /> {count - passCount} Remedial
                              </div>
                            </div>

                            {/* Button to quickly filter this grade */}
                            <button 
                              onClick={() => setFilterGrade(gradeLevel)}
                              className={`mt-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterGrade === gradeLevel ? 'bg-primary text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                            >
                              Fokus Kelas ini
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-8">
                      {/* Bar Chart: Score Distribution */}
                      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <BarChart3 className="text-primary w-6 h-6" />
                            Distribusi Nilai
                          </h3>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-primary" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global</span>
                          </div>
                        </div>
                        
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={[
                                {
                                  range: '0-74',
                                  formatif: assessments.filter(a => a.formative < 75).length,
                                  'tengah': assessments.filter(a => a.sumatifTengah < 75).length,
                                  sumatif: assessments.filter(a => a.summative < 75).length,
                                  akhir: assessments.filter(a => a.sumatifAkhir < 75).length,
                                },
                                {
                                  range: '75-89',
                                  formatif: assessments.filter(a => a.formative >= 75 && a.formative < 90).length,
                                  'tengah': assessments.filter(a => a.sumatifTengah >= 75 && a.sumatifTengah < 90).length,
                                  sumatif: assessments.filter(a => a.summative >= 75 && a.summative < 90).length,
                                  akhir: assessments.filter(a => a.sumatifAkhir >= 75 && a.sumatifAkhir < 90).length,
                                },
                                {
                                  range: '90-100',
                                  formatif: assessments.filter(a => a.formative >= 90).length,
                                  'tengah': assessments.filter(a => a.sumatifTengah >= 90).length,
                                  sumatif: assessments.filter(a => a.summative >= 90).length,
                                  akhir: assessments.filter(a => a.sumatifAkhir >= 90).length,
                                }
                              ]}
                              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis 
                                dataKey="range" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                dy={10}
                              />
                              <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                              />
                              <Tooltip 
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ 
                                  borderRadius: '16px', 
                                  border: 'none', 
                                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                  padding: '12px'
                                }}
                              />
                              <Legend 
                                iconType="circle"
                                wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                              />
                              <Bar dataKey="formatif" name="Formatif" fill="#6366f1" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="tengah" name="Sumatif Tengah" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="sumatif" name="Sumatif" fill="#10b981" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="akhir" name="Sumatif Akhir" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Pie Chart: Pass Fail Rate */}
                      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <Brain className="text-emerald-500 w-6 h-6" />
                            Ketuntasan Belajar
                          </h3>
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">
                            Threshold 75
                          </span>
                        </div>

                        <div className="h-[300px] w-full relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Lulus', value: assessments.filter(a => a.summative >= 75).length },
                                  { name: 'Remedial', value: assessments.filter(a => a.summative < 75).length }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={8}
                                dataKey="value"
                              >
                                <Cell key="cell-0" fill="#10b981" />
                                <Cell key="cell-1" fill="#f43f5e" />
                              </Pie>
                              <Tooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                              />
                              <Legend 
                                iconType="circle"
                                layout="vertical" 
                                align="right" 
                                verticalAlign="middle"
                                wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          {assessments.length > 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <span className="text-3xl font-black text-slate-800">
                                {Math.round((assessments.filter(a => a.summative >= 75).length / assessments.length) * 100)}%
                              </span>
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Tuntas</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                  {/* Form Input */}
                  <div className="md:col-span-1 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col gap-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                       <PlusCircle className="text-primary" /> Input Nilai Baru
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-text-light uppercase tracking-widest mb-1 block">Nama Siswa</label>
                        <input 
                          type="text" 
                          value={newAssessment.name}
                          onChange={(e) => setNewAssessment({...newAssessment, name: e.target.value})}
                          placeholder="Nama lengkap siswa"
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-text-light uppercase tracking-widest mb-1 block">Kelas</label>
                        <select 
                          value={newAssessment.grade}
                          onChange={(e) => setNewAssessment({...newAssessment, grade: e.target.value})}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                        >
                          <option value="7">Kelas 7</option>
                          <option value="8">Kelas 8</option>
                          <option value="9">Kelas 9</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-text-light uppercase tracking-widest mb-1 block">Formatif</label>
                          <input 
                            type="number" 
                            min="0"
                            max="100"
                            value={newAssessment.formative}
                            onChange={(e) => setNewAssessment({...newAssessment, formative: Number(e.target.value)})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-text-light uppercase tracking-widest mb-1 block">Sumatif Tengah</label>
                          <input 
                            type="number" 
                            min="0"
                            max="100"
                            value={newAssessment.sumatifTengah}
                            onChange={(e) => setNewAssessment({...newAssessment, sumatifTengah: Number(e.target.value)})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-text-light uppercase tracking-widest mb-1 block">Sumatif</label>
                          <input 
                            type="number" 
                            min="0"
                            max="100"
                            value={newAssessment.summative}
                            onChange={(e) => setNewAssessment({...newAssessment, summative: Number(e.target.value)})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-text-light uppercase tracking-widest mb-1 block">Sumatif Akhir</label>
                          <input 
                            type="number" 
                            min="0"
                            max="100"
                            value={newAssessment.sumatifAkhir}
                            onChange={(e) => setNewAssessment({...newAssessment, sumatifAkhir: Number(e.target.value)})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary transition-all"
                          />
                        </div>
                      </div>
                      
                      <button 
                        onClick={handleAddAssessment}
                        className="w-full bg-primary text-white py-4 rounded-2xl font-bold mt-4 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-5 h-5" /> Tambah ke Daftar
                      </button>
                    </div>
                  </div>

                  {/* List/Table */}
                  <div className="md:col-span-2 bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                           <TableIcon className="text-primary" /> Daftar Nilai Sementara
                        </h3>
                        <div className="flex items-center gap-3 mt-2">
                          <p className="text-xs text-text-light">{filteredAssessments.length} siswa ditampilkan</p>
                          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
                            <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">Filter:</span>
                            <select 
                              value={filterGrade}
                              onChange={(e) => setFilterGrade(e.target.value)}
                              className="text-xs font-bold text-primary bg-transparent outline-none cursor-pointer"
                            >
                              <option value="All">Semua Kelas</option>
                              <option value="7">Kelas 7</option>
                              <option value="8">Kelas 8</option>
                              <option value="9">Kelas 9</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleImportFile}
                          accept=".csv,.xlsx,.xls"
                          className="hidden"
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-primary/10 text-primary px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/20 transition-all"
                        >
                          <Download className="w-4 h-4 rotate-180" /> Impor Data
                        </button>
                        <button 
                          onClick={saveAssessmentsToDrive}
                          disabled={assessments.length === 0}
                          className="bg-success text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md hover:scale-105 transition-all disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" /> Simpan ke Drive
                        </button>
                        <button 
                          onClick={exportAssessmentsWord}
                          disabled={assessments.length === 0}
                          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md hover:scale-105 transition-all disabled:opacity-50"
                        >
                          <FileText className="w-4 h-4" /> Ekspor ke Word
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                      {filteredAssessments.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center py-24 text-slate-300">
                          <div className="bg-slate-50 p-8 rounded-full mb-4 shadow-inner">
                            <BarChart3 className="w-16 h-16 opacity-20" />
                          </div>
                          <p className="font-bold text-slate-400">Belum ada data nilai</p>
                          <p className="text-xs text-slate-400 mt-1">Gunakan form di samping atau impor file .csv/.xlsx</p>
                        </div>
                      ) : (
                        <table className="w-full text-left border-separate border-spacing-0">
                          <thead className="sticky top-0 z-20">
                            <tr>
                              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white border-b border-slate-100">Nama Siswa</th>
                              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white border-b border-slate-100 text-center">Kelas</th>
                              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white border-b border-slate-100 text-center">Formatif</th>
                              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white border-b border-slate-100 text-center">Tengah</th>
                              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white border-b border-slate-100 text-center">Sumatif</th>
                              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white border-b border-slate-100 text-center">Akhir</th>
                              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white border-b border-slate-100 text-center">Status</th>
                              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white border-b border-slate-100 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredAssessments.map((item, index) => {
                              const isPassing = item.summative >= 75;
                              const avatarColor = ['bg-indigo-50 text-indigo-600', 'bg-emerald-50 text-emerald-600', 'bg-amber-50 text-amber-600', 'bg-rose-50 text-rose-600'][index % 4];
                              
                              return (
                                <tr 
                                  key={item.id} 
                                  className={`group transition-all duration-300 hover:bg-slate-50 relative ${index % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'}`}
                                >
                                  {/* Left Status Bar Accent */}
                                  <td className={`absolute left-0 top-0 bottom-0 w-1 transition-all ${isPassing ? 'bg-emerald-400' : 'bg-rose-400'} opacity-0 group-hover:opacity-100`} />
                                  
                                  <td className="px-6 py-5 whitespace-nowrap">
                                    <div className="flex items-center gap-4">
                                      <div className={`w-10 h-10 rounded-xl ${avatarColor} flex items-center justify-center font-black text-xs shadow-sm transition-transform group-hover:scale-105`}>
                                        {item.name.charAt(0)}
                                      </div>
                                      <div>
                                        <div className="font-black text-slate-800 group-hover:text-primary transition-colors text-sm">{item.name}</div>
                                        <div className="text-[10px] text-slate-400 font-bold tracking-[0.1em] uppercase">Student Node • {item.id.slice(0, 6)}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-5 text-center">
                                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-[11px] font-black bg-white border border-slate-200 text-slate-600 shadow-sm transition-all group-hover:border-primary/20">
                                      {item.grade}
                                    </span>
                                  </td>
                                  <td className="px-6 py-5 text-center">
                                    <div className="flex flex-col items-center">
                                      <span className={`font-mono font-black text-sm px-2 py-1 rounded-md ${item.formative < 75 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-700'}`}>
                                        {item.formative}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-5 text-center">
                                    <span className="font-mono font-black text-sm text-amber-600 bg-amber-50/50 px-2 py-1 rounded-md">{item.sumatifTengah}</span>
                                  </td>
                                  <td className="px-6 py-5 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <div className={`w-12 h-8 flex items-center justify-center font-mono font-black text-base rounded-xl border-2 ${isPassing ? 'border-indigo-100 text-indigo-600 bg-indigo-50/20' : 'border-rose-100 text-rose-600 bg-rose-50/20 shadow-inner'}`}>
                                        {item.summative}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-5 text-center">
                                    <span className="font-mono font-black text-sm text-slate-500">{item.sumatifAkhir}</span>
                                  </td>
                                  <td className="px-6 py-5 text-center">
                                    {isPassing ? (
                                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Tuntas</span>
                                      </div>
                                    ) : (
                                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Remedial</span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-5 text-right">
                                    <button 
                                      onClick={() => handleRemoveAssessment(item.id)}
                                      className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100 transform hover:scale-110 active:scale-95"
                                      title="Remove Entry"
                                    >
                                      <X className="w-4.5 h-4.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>

                {/* Data Visualization Section */}
                {filteredAssessments.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Stats Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                      <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl">👥</div>
                        <div>
                          <p className="text-xs font-bold text-text-light uppercase tracking-widest">Total Siswa</p>
                          <h4 className="text-2xl font-bold">{filteredAssessments.length}</h4>
                        </div>
                      </div>
                      <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">📊</div>
                        <div>
                          <p className="text-xs font-bold text-text-light uppercase tracking-widest">Avg. Formatif</p>
                          <h4 className="text-2xl font-bold">
                            {(filteredAssessments.reduce((sum, a) => sum + a.formative, 0) / filteredAssessments.length).toFixed(1)}
                          </h4>
                        </div>
                      </div>
                      <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center text-xl">🕒</div>
                        <div>
                          <p className="text-xs font-bold text-text-light uppercase tracking-widest">Avg. S. Tengah</p>
                          <h4 className="text-2xl font-bold">
                            {(filteredAssessments.reduce((sum, a) => sum + a.sumatifTengah, 0) / filteredAssessments.length).toFixed(1)}
                          </h4>
                        </div>
                      </div>
                      <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-xl">📈</div>
                        <div>
                          <p className="text-xs font-bold text-text-light uppercase tracking-widest">Avg. Sumatif</p>
                          <h4 className="text-2xl font-bold">
                            {(filteredAssessments.reduce((sum, a) => sum + a.summative, 0) / filteredAssessments.length).toFixed(1)}
                          </h4>
                        </div>
                      </div>
                      <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-xl">🎯</div>
                        <div>
                          <p className="text-xs font-bold text-text-light uppercase tracking-widest">Avg. S. Akhir</p>
                          <h4 className="text-2xl font-bold">
                            {(filteredAssessments.reduce((sum, a) => sum + a.sumatifAkhir, 0) / filteredAssessments.length).toFixed(1)}
                          </h4>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-8">
                          <div>
                            <h3 className="text-xl font-bold flex items-center gap-2">
                              <BarChart3 className="text-primary" /> Visualisasi Distribusi Nilai {filterGrade !== 'All' ? `(Kelas ${filterGrade})` : ''}
                            </h3>
                            <p className="text-sm text-text-light">Perbandingan nilai formatif dan sumatif antar siswa.</p>
                          </div>
                        </div>

                        <div className="h-[400px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={filteredAssessments}
                              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                              <XAxis 
                                dataKey="name" 
                                angle={-45} 
                                textAnchor="end" 
                                interval={0} 
                                height={80}
                                tick={{ fill: '#64748b', fontSize: 10 }}
                              />
                              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                              <Tooltip 
                                contentStyle={{ 
                                  borderRadius: '16px', 
                                  border: 'none', 
                                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                  backgroundColor: 'white'
                                }}
                                itemStyle={{ fontWeight: 'bold' }}
                                cursor={{ fill: '#f8fafc' }}
                              />
                              <Legend verticalAlign="top" height={36} />
                              <Bar 
                                dataKey="formative" 
                                name="Nilai Formatif" 
                                fill="#4f46e5" 
                                radius={[6, 6, 0, 0]} 
                                barSize={assessments.length > 10 ? undefined : 30}
                              />
                              <Bar 
                                dataKey="sumatifTengah" 
                                name="S. Tengah" 
                                fill="#f59e0b" 
                                radius={[6, 6, 0, 0]} 
                                barSize={assessments.length > 10 ? undefined : 28}
                              />
                              <Bar 
                                dataKey="summative" 
                                name="Nilai Sumatif" 
                                fill="#fbbf24" 
                                radius={[6, 6, 0, 0]} 
                                barSize={assessments.length > 10 ? undefined : 25}
                              />
                              <Bar 
                                dataKey="sumatifAkhir" 
                                name="Sumatif Akhir" 
                                fill="#e11d48" 
                                radius={[6, 6, 0, 0]} 
                                barSize={assessments.length > 10 ? undefined : 20}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col">
                        <div className="mb-8">
                          <h3 className="text-xl font-bold flex items-center gap-2">
                            <BarChart3 className="text-primary" /> Ketuntasan Belajar
                          </h3>
                          <p className="text-sm text-text-light">Berdasarkan KKM 75 (Sumatif).</p>
                        </div>

                        <div className="flex-1 h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Lulus', value: filteredAssessments.filter(a => a.summative >= 75).length },
                                  { name: 'Tidak Lulus', value: filteredAssessments.filter(a => a.summative < 75).length }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                <Cell fill="#10b981" />
                                <Cell fill="#ef4444" />
                              </Pie>
                              <Tooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                              />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-text-light">Lulus (≥ 75):</span>
                            <span className="font-bold text-success">{assessments.filter(a => a.summative >= 75).length} Siswa</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-text-light">Tidak Lulus ({"< 75"}):</span>
                            <span className="font-bold text-red-500">{assessments.filter(a => a.summative < 75).length} Siswa</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

                {status.type && (
                  <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 ${status.type === 'success' ? 'bg-success/10 text-success border-success/20' : 'bg-red-50 text-red-600 border-red-100'} border`}>
                    <div className="flex items-center gap-3">
                      {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      <p className="font-bold">{status.message}</p>
                    </div>
                    <button onClick={() => setStatus({type: null, message: ''})} className="text-xs uppercase font-bold tracking-widest px-3 py-1 bg-white/50 rounded-lg">Tutup</button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'jurnal' && (
              <motion.div 
                key="jurnal"
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto space-y-6 md:space-y-8 px-4 md:px-0"
              >
                <div className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-10 shadow-2xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 md:p-10 opacity-5">
                    <PenLine className="w-24 h-24 md:w-40 md:h-40 text-amber-600" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6 md:mb-8">
                       <div className="w-12 h-12 md:w-16 md:h-16 bg-amber-50 text-amber-600 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl shadow-lg shadow-amber-100">📝</div>
                       <div>
                          <h2 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight leading-none uppercase">Jurnal Harian Guru</h2>
                          <p className="text-slate-400 font-bold text-[10px] md:text-sm mt-1 md:mt-2">Catat aktivitas pembelajaran harian Anda.</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-amber-600">Tanggal</label>
                        <input 
                          type="date"
                          value={newJournal.date}
                          onChange={(e) => setNewJournal({ ...newJournal, date: e.target.value })}
                          className="w-full p-3.5 md:p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 text-sm md:text-base focus:border-amber-500 transition-all outline-none shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kelas</label>
                        <select 
                          value={newJournal.class}
                          onChange={(e) => setNewJournal({ ...newJournal, class: e.target.value })}
                          className="w-full p-3.5 md:p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 text-sm md:text-base focus:border-amber-500 transition-all outline-none shadow-sm"
                        >
                          <option value="7">Kelas 7</option>
                          <option value="8">Kelas 8</option>
                          <option value="9">Kelas 9</option>
                        </select>
                      </div>
                      <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-indigo-600">Mata Pelajaran</label>
                        <input 
                          type="text"
                          value={newJournal.subject}
                          onChange={(e) => setNewJournal({ ...newJournal, subject: e.target.value })}
                          className="w-full p-3.5 md:p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 text-sm md:text-base focus:border-amber-500 transition-all outline-none shadow-sm"
                          placeholder="IPS / Sejarah / Geografi..."
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2 lg:col-span-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Aktivitas & Materi Pembelajaran</label>
                        <textarea 
                          value={newJournal.activity}
                          onChange={(e) => setNewJournal({ ...newJournal, activity: e.target.value })}
                          className="w-full p-3.5 md:p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 text-sm md:text-base focus:border-amber-500 transition-all outline-none h-24 md:h-32 resize-none shadow-sm"
                          placeholder="Uraikan aktivitas pembelajaran hari ini..."
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2 lg:col-span-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Catatan / Refleksi</label>
                        <input 
                          type="text"
                          value={newJournal.notes}
                          onChange={(e) => setNewJournal({ ...newJournal, notes: e.target.value })}
                          className="w-full p-3.5 md:p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 text-sm md:text-base focus:border-amber-500 transition-all outline-none shadow-sm"
                          placeholder="Catatan tambahan (opsional)..."
                        />
                      </div>
                    </div>

                    <div className="mt-6 md:mt-8">
                       <button 
                         onClick={handleAddJournal}
                         className="w-full md:w-auto bg-amber-600 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-amber-100 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                       >
                         <Save className="w-6 h-6" /> Simpan Jurnal
                       </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 pb-20">
                  {journals.length === 0 ? (
                    <div className="p-12 md:p-20 text-center bg-white rounded-[32px] md:rounded-[40px] border-2 border-dashed border-slate-100">
                       <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                         <PenLine className="w-8 h-8 md:w-10 md:h-10 text-slate-300" />
                       </div>
                       <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">Belum ada catatan jurnal harian.</p>
                    </div>
                  ) : (
                    journals.map(item => (
                      <div key={item.id} className="bg-white p-6 md:p-8 rounded-[28px] md:rounded-[32px] shadow-lg shadow-slate-100 border border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:border-amber-200 transition-all text-left">
                        <div className="space-y-3 md:space-y-4 flex-1">
                          <div className="flex flex-wrap items-center gap-2 md:gap-3">
                            <span className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest border border-amber-100 flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" /> {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                            <span className="bg-slate-50 text-slate-500 px-3 py-1.5 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest border border-slate-100">
                              Kelas {item.class}
                            </span>
                            <span className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest border border-indigo-100">
                              {item.subject}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-lg md:text-xl font-black text-slate-800 tracking-tight leading-tight">{item.activity}</h4>
                            {item.notes && <p className="text-slate-400 text-xs md:text-sm mt-1 font-medium italic underline decoration-dotted underline-offset-4">Catatan: {item.notes}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                           <button 
                             onClick={() => {
                               const journalContent = ` Jurnal Harian Guru - ${item.date}\n Kelas: ${item.class}\n Mapel: ${item.subject}\n Aktivitas: ${item.activity}\n Catatan: ${item.notes}`;
                               const blob = new Blob([journalContent], { type: 'text/markdown' });
                               const url = URL.createObjectURL(blob);
                               const a = document.createElement('a');
                               a.href = url;
                               a.download = `Jurnal_${item.date}_Kelas${item.class}.md`;
                               a.click();
                             }}
                             className="flex-1 md:flex-none p-3.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl md:rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-100"
                             title="Download Markdown"
                           >
                              <Download className="w-5 h-5" /> <span className="md:hidden text-xs font-bold uppercase tracking-widest">Download</span>
                           </button>
                           <button 
                             onClick={() => handleRemoveJournal(item.id)}
                             className="p-3.5 bg-rose-50 text-rose-300 hover:text-rose-500 hover:bg-rose-100 rounded-xl transition-all flex items-center justify-center border border-rose-50"
                           >
                              <Trash2 className="w-5 h-5" />
                           </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'rpp_mendalam' && (
              <motion.div 
                key="rpp_mendalam"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-4xl mx-auto space-y-10 pb-20"
              >
                <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-slate-100 relative overflow-hidden">
                  {/* Decorative background element */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 rounded-full -mr-32 -mt-32 opacity-50" />
                  
                  <div className="relative">
                    <header className="flex flex-col md:flex-row items-center gap-6 mb-12 border-b border-slate-100 pb-10">
                      <div className="w-20 h-20 bg-rose-600 text-white rounded-3xl flex items-center justify-center text-4xl shadow-xl shadow-rose-200 shrink-0">🎯</div>
                      <div className="text-center md:text-left">
                        <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                          <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest">Premium Feature</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">BSKAP No. 008/H/KR/2022</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Modul Ajar Mendalam</h2>
                        <p className="text-slate-500 font-medium mt-1">Eksplorasi pedagogis dengan integrasi 8 Dimensi Profil Lulusan Pendekatan Pembelajaran Mendalam.</p>
                      </div>
                    </header>

                    <div className="space-y-12">
                      {/* Section 1: Identitas Pengajar */}
                      <section className="space-y-6">
                        <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                <UserIcon className="w-4 h-4" />
              </div>
                          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Identitas Pengajar</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap & Gelar</label>
                            <input 
                              type="text" 
                              value={teacherName}
                              onChange={(e) => setTeacherName(e.target.value)}
                              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:border-rose-500 focus:bg-white transition-all outline-none shadow-sm"
                              placeholder="Misal: Budi Santoso, S.Pd."
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor Induk Pegawai (NIP)</label>
                            <input 
                              type="text" 
                              value={nip}
                              onChange={(e) => setNip(e.target.value)}
                              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:border-rose-500 focus:bg-white transition-all outline-none shadow-sm"
                              placeholder="Opsional"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Satuan Pendidikan</label>
                            <input 
                              type="text" 
                              value={school}
                              onChange={(e) => setSchool(e.target.value)}
                              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:border-rose-500 focus:bg-white transition-all outline-none shadow-sm"
                              placeholder="Nama Sekolah"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mata Pelajaran</label>
                            <input 
                              type="text" 
                              value={subject}
                              onChange={(e) => setSubject(e.target.value)}
                              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:border-rose-500 focus:bg-white transition-all outline-none shadow-sm"
                            />
                          </div>
                        </div>
                      </section>

                      {/* Section 2: Administrasi Akademik */}
                      <section className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                            <GraduationCap className="w-4 h-4" />
                          </div>
                          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Informasi Akademik</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="space-y-2 lg:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kurikulum Utama</label>
                            <div className="relative">
                              <select 
                                value={kurikulum}
                                onChange={(e) => setKurikulum(e.target.value)}
                                className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:border-rose-500 transition-all outline-none appearance-none cursor-pointer pr-10 shadow-sm"
                              >
                                <option value="Merdeka">Kurikulum Merdeka (Edisi Revisi 2024)</option>
                                <option value="2013">Kurikulum 2013 (K-13 Revisi)</option>
                                <option value="Berbasis Cinta">Kurikulum Berbasis Cinta ❤️ (Pendekatan Humanis)</option>
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kelas / Fase</label>
                            <div className="relative">
                              <select 
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                                className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:border-rose-500 transition-all outline-none appearance-none cursor-pointer pr-10 shadow-sm"
                              >
                                <option value="7">Kelas 7 (Fase D)</option>
                                <option value="8">Kelas 8 (Fase D)</option>
                                <option value="9">Kelas 9 (Fase D)</option>
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Semester</label>
                            <div className="flex gap-2">
                              {['Gasal', 'Genap'].map(s => (
                                <button
                                  key={s}
                                  onClick={() => setSemester(s)}
                                  className={`flex-1 p-4 rounded-2xl font-bold text-sm transition-all border-2 ${
                                    semester === s 
                                      ? 'bg-rose-50 border-rose-500 text-rose-600' 
                                      : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'
                                  }`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-4 lg:col-span-2">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alokasi Waktu / Pertemuan</label>
                              <input 
                                type="text" 
                                value={meetings}
                                onChange={(e) => setMeetings(e.target.value)}
                                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:border-rose-500 focus:bg-white transition-all outline-none shadow-sm"
                                placeholder="Misal: 1 Pertemuan (2JP x 40 menit)"
                              />
                            </div>
                            
                            <div className="bg-slate-50/50 p-6 rounded-[28px] border-2 border-dashed border-slate-200">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-rose-500" />
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Jadwal Pelaksanaan</span>
                                </div>
                                <button 
                                  onClick={() => setMeetingDates([...meetingDates, ''])}
                                  className="text-[10px] font-black text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl hover:bg-rose-100 transition-colors uppercase tracking-widest flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" /> Tambah Pertemuan
                                </button>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {meetingDates.map((date, idx) => (
                                  <div key={idx} className="relative group/date">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-300 uppercase">P{idx + 1}</div>
                                    <input 
                                      type="date"
                                      value={date}
                                      onChange={(e) => {
                                        const newDates = [...meetingDates];
                                        newDates[idx] = e.target.value;
                                        setMeetingDates(newDates);
                                      }}
                                      className="w-full pl-10 pr-10 py-3 bg-white border-2 border-slate-100 rounded-xl font-bold text-sm text-slate-700 focus:border-rose-500 transition-all outline-none"
                                    />
                                    {meetingDates.length > 1 && (
                                      <button 
                                        onClick={() => setMeetingDates(meetingDates.filter((_, i) => i !== idx))}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-rose-500 opacity-0 group-hover/date:opacity-100 transition-all"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <p className="text-[9px] font-bold text-slate-400 mt-4 leading-relaxed italic">
                                * Tanggal ini akan diintegrasikan ke dalam analisis langkah-langkah pembelajaran di RPP Anda.
                              </p>
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* Section 3: Rancangan Pembelajaran */}
                      <section className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Desain Pembelajaran</h3>
                          </div>
                          <div className="hidden sm:flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest">AI Assisted</span>
                          </div>
                        </div>
                        
                        <div className="space-y-8">
                          <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-rose-600 to-amber-500 rounded-[30px] blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-focus-within:duration-200"></div>
                            <div className="relative space-y-2 bg-white rounded-[28px] p-2 border border-slate-100 shadow-xl">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mt-2 block">Topik Utama atau Materi Pokok</label>
                              <div className="relative flex items-center">
                                <Search className="absolute left-6 w-6 h-6 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
                                <input 
                                  type="text" 
                                  value={topic}
                                  onChange={(e) => setTopic(e.target.value)}
                                  placeholder="Contoh: Dampak Kolonialisme, Mobilitas Sosial, atau ASEAN..."
                                  className="w-full pl-16 pr-6 pb-6 pt-2 bg-transparent font-black text-2xl text-slate-800 placeholder:text-slate-200 outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Model Pembelajaran</label>
                              <div className="relative">
                                <select 
                                  value={learningModel}
                                  onChange={(e) => setLearningModel(e.target.value)}
                                  className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:border-rose-500 transition-all outline-none appearance-none cursor-pointer pr-10 shadow-sm"
                                >
                                  <option value="Problem Based Learning (PBL)">Problem Based Learning (PBL)</option>
                                  <option value="Project Based Learning (PjBL)">Project Based Learning (PjBL)</option>
                                  <option value="Discovery Learning">Discovery Learning</option>
                                  <option value="Inquiry Learning">Inquiry Learning</option>
                                  <option value="Cooperatif Learning (STAD/Jigsaw)">Cooperatif Learning</option>
                                  <option value="Flipped Classroom">Flipped Classroom</option>
                                  <option value="Lainnya">Lainnya...</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Media & Alat Pembelajaran</label>
                              <input 
                                type="text" 
                                value={teachingMedia}
                                onChange={(e) => setTeachingMedia(e.target.value)}
                                placeholder="Misal: Laptop, LCD, Canva, Video YouTube"
                                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:border-rose-500 focus:bg-white transition-all outline-none shadow-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* Section 4: 8 Dimensi Profil Lulusan */}
                      <section className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">8 Dimensi Profil Lulusan (Deep Learning)</h3>
                        </div>
                        
                        <p className="text-xs text-slate-400 font-medium mb-4 ml-1">Pilih dimensi profil lulusan pendekatan pembelajaran mendalam yang akan difokuskan:</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { label: 'Karakter', full: 'Karakter (Character)' },
                            { label: 'Kewarganegaraan', full: 'Kewarganegaraan (Citizenship)' },
                            { label: 'Berpikir Kritis', full: 'Berpikir Kritis (Critical Thinking)' },
                            { label: 'Kreativitas', full: 'Kreativitas (Creativity)' },
                            { label: 'Kolaborasi', full: 'Kolaborasi (Collaboration)' },
                            { label: 'Komunikasi', full: 'Komunikasi (Communication)' },
                            { label: 'Keimanan', full: 'Keimanan & Ketakwaan' },
                            { label: 'Kesejahteraan', full: 'Kesejahteraan (Well-being)' }
                          ].map(d => (
                            <button
                              key={d.full}
                              onClick={() => {
                                if (selectedP3.includes(d.full)) setSelectedP3(selectedP3.filter(item => item !== d.full));
                                else setSelectedP3([...selectedP3, d.full]);
                              }}
                              className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 flex flex-col items-center gap-2 text-center group ${
                                selectedP3.includes(d.full) 
                                  ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-200' 
                                  : 'bg-white border-slate-100 text-slate-400 hover:border-rose-200 hover:text-rose-600'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                selectedP3.includes(d.full) ? 'bg-white/20' : 'bg-slate-50 group-hover:bg-rose-50'
                              }`}>
                                {selectedP3.includes(d.full) ? <Check className="w-4 h-4" /> : <div className="w-1.5 h-1.5 rounded-full bg-current opacity-20" />}
                              </div>
                              {d.label}
                            </button>
                          ))}
                        </div>
                      </section>

                      <footer className="pt-10 border-t border-slate-100">
                        <button 
                          onClick={generateRPPMendalamAction}
                          disabled={isGenerating || !topic}
                          className="w-full relative overflow-hidden group/btn"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-rose-700 transition-all group-hover/btn:scale-110 duration-500"></div>
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                          <div className="relative flex items-center justify-center gap-4 py-6 px-8 text-white">
                            {isGenerating ? (
                              <Loader2 className="w-8 h-8 animate-spin" />
                            ) : (
                              <Sparkles className="w-8 h-8 group-hover/btn:rotate-12 transition-transform" />
                            )}
                            <div className="flex flex-col items-start">
                              <span className="font-black text-2xl tracking-tighter uppercase leading-none">Susun Modul Ajar</span>
                              <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mt-1">AI Pedagogical Analysis v3.0</span>
                            </div>
                          </div>
                        </button>
                        <div className="flex items-center justify-center gap-4 mt-6">
                          <div className="h-px flex-1 bg-slate-100" />
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Waktu Proses: ± 30-45 Detik</p>
                          <div className="h-px flex-1 bg-slate-100" />
                        </div>
                      </footer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'silabus' && (
              <motion.div 
                key="silabus"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="bg-white p-10 rounded-[32px] shadow-sm border border-slate-100">
                  <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">📋</div>
                    <h2 className="text-2xl font-bold text-text-dark mb-2">Penyusun Silabus IPS</h2>
                    <p className="text-text-light">Generate silabus komprehensif sesuai Kurikulum Merdeka.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-text-light uppercase tracking-widest mb-2 block ml-1">Kurikulum</label>
                        <select 
                          value={kurikulum}
                          onChange={(e) => setKurikulum(e.target.value)}
                          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium focus:border-primary focus:bg-white transition-all outline-none appearance-none"
                        >
                          <option value="Merdeka">Kurikulum Merdeka</option>
                          <option value="2013">Kurikulum 2013</option>
                          <option value="Berbasis Cinta">Kurikulum Berbasis Cinta ❤️</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-text-light uppercase tracking-widest mb-2 block ml-1">Semester</label>
                        <select 
                          value={semester}
                          onChange={(e) => setSemester(e.target.value)}
                          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium focus:border-primary focus:bg-white transition-all outline-none appearance-none"
                        >
                          <option value="Gasal">Gasal (Ganjil)</option>
                          <option value="Genap">Genap</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-text-light uppercase tracking-widest mb-2 block ml-1">Jenjang Kelas</label>
                        <select 
                          value={grade}
                          onChange={(e) => setGrade(e.target.value)}
                          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium focus:border-primary focus:bg-white transition-all outline-none appearance-none"
                        >
                          <option value="7">Kelas 7</option>
                          <option value="8">Kelas 8</option>
                          <option value="9">Kelas 9</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-text-light uppercase tracking-widest mb-2 block ml-1">Topik Utama Silabus</label>
                        <input 
                          type="text" 
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="Masukkan materi (misal: Kelangkaan Sumber Daya)"
                          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium focus:border-primary focus:bg-white transition-all outline-none"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={generateSyllabus}
                      disabled={isGenerating || !topic}
                      className="w-full bg-primary text-white py-5 rounded-2xl font-bold text-lg hover:bg-opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg transition-all"
                    >
                      {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                      Generate Silabus Komplit
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-8 justify-center">
                    {['Kebutuhan Manusia', 'Zaman Praaksara', 'Mobilitas Sosial', 'Konflik Sosial'].map(t => (
                      <button 
                        key={t}
                        onClick={() => setTopic(t)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-semibold text-text-light hover:border-primary hover:text-primary transition-all"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'rpp' && (
              <motion.div 
                key="rpp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="bg-white p-10 rounded-[32px] shadow-sm border border-slate-100">
                  <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">✨</div>
                    <h2 className="text-2xl font-bold text-text-dark mb-2">Penyihir Konten IPS</h2>
                    <p className="text-text-light">AI akan menyusun modul ajar lengkap khusus untuk Pak Catur.</p>
                  </div>

                  <div className="mb-6 flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-text-light uppercase tracking-widest mb-2 block ml-1">Kurikulum</label>
                      <select 
                        value={kurikulum}
                        onChange={(e) => setKurikulum(e.target.value)}
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium focus:border-primary focus:bg-white transition-all outline-none appearance-none"
                      >
                        <option value="Merdeka">Kurikulum Merdeka</option>
                        <option value="2013">Kurikulum 2013</option>
                        <option value="Berbasis Cinta">Kurikulum Berbasis Cinta ❤️</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-bold text-text-light uppercase tracking-widest mb-2 block ml-1">Jenjang Kelas</label>
                      <select 
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium focus:border-primary focus:bg-white transition-all outline-none appearance-none"
                      >
                        <option value="7">Kelas 7</option>
                        <option value="8">Kelas 8</option>
                        <option value="9">Kelas 9</option>
                      </select>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-indigo-500 rounded-[28px] blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-focus-within:duration-200"></div>
                    <div className="relative flex items-center bg-white rounded-[24px] overflow-hidden border-2 border-slate-100 shadow-xl p-2 h-24">
                      <div className="flex-1 px-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Materi Pelajaran</label>
                        <input 
                          type="text" 
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="Misal: Dinamika Penduduk Dunia, ASEAN, atau Perdagangan Internasional..."
                          className="w-full bg-transparent font-black text-xl text-slate-800 placeholder:text-slate-200 outline-none"
                          onKeyDown={(e) => e.key === 'Enter' && generateRPP()}
                        />
                      </div>
                      <button 
                        onClick={generateRPP}
                        disabled={isGenerating || !topic}
                        className="h-full px-10 bg-indigo-600 text-white rounded-[20px] font-black text-sm uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-3 shadow-lg shadow-indigo-200 transition-all active:scale-95 group"
                      >
                        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 group-hover:rotate-12" />}
                        <span>Generate</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-6 justify-center">
                    {['ASEAN', 'Peta & Skala', 'Globalisasi', 'Ekspor Impor', 'Majapahit'].map(t => (
                      <button 
                        key={t}
                        onClick={() => setTopic(t)}
                        className="px-5 py-2 bg-white border border-slate-200 rounded-full text-sm font-semibold text-text-light hover:border-primary hover:text-primary transition-all"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {isGenerating && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-6 p-8 bg-white rounded-[32px] border-2 border-indigo-100 shadow-2xl shadow-indigo-100/50"
                  >
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center relative">
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                      <div className="absolute inset-0 border-2 border-indigo-200/50 rounded-2xl animate-ping opacity-20" />
                    </div>
                    <div>
                      <p className="text-slate-800 font-black text-lg tracking-tight">AI Maestro Beraksi...</p>
                      <p className="text-slate-400 text-sm font-medium italic">{generatingMessage}</p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'materi' && (
              <motion.div 
                key="materi"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col gap-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">Ready to Review</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Hasil Generasi IPS</h2>
                    <p className="text-xs text-text-light font-bold mt-1">Selesai menyusun topik: <span className="text-primary uppercase tracking-wider">{topic || 'No Topic'}</span></p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      {(['A4', 'F4', 'Legal'] as const).map(size => (
                        <button
                          key={size}
                          onClick={() => setPageSize(size)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                            pageSize === size 
                              ? 'bg-white text-primary shadow-sm' 
                              : 'text-text-light hover:text-text-dark'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    
                    <button onClick={exportPDF} className="flex items-center gap-2 px-5 py-3 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-all shadow-sm">
                      <Download className="w-4 h-4" /> PDF
                    </button>
                    <button onClick={exportWord} className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm">
                      <FileText className="w-4 h-4" /> Word
                    </button>
                    <button onClick={() => { setIsQuizMode(true); setActiveTab('bank_soal'); }} className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-sm">
                      <Brain className="w-4 h-4" /> Kuis CBT
                    </button>
                    <button onClick={exportPlainText} className="flex items-center gap-2 px-5 py-3 bg-slate-600 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-all shadow-sm">
                      <ClipboardList className="w-4 h-4" /> Text
                    </button>
                    <button 
                      onClick={() => saveToDrive(`Backup_${topic.replace(/\s+/g, '_')}.md`, aiResult)}
                      disabled={!aiResult || !isAuthenticated}
                      className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> Save to Drive
                    </button>
                  </div>
                </div>

                <div className="flex-1 bg-slate-100/50 rounded-[32px] p-4 md:p-12 overflow-y-auto border border-slate-100 flex justify-center scrollbar-thin scrollbar-thumb-slate-200">
                  <div 
                    ref={contentRef} 
                    className={`bg-white shadow-2xl relative transition-all duration-500 overflow-hidden mx-auto ${
                      pageSize === 'F4' ? 'w-[215mm] min-h-[330mm]' : 
                      pageSize === 'Legal' ? 'w-[216mm] min-h-[356mm]' : 
                      'w-[210mm] min-h-[297mm]'
                    }`}
                  >
                    {/* Professional Document Frame (Bingkai) */}
                    <div className="absolute inset-0 pointer-events-none border-[1px] border-slate-400 m-1"></div>
                    <div className="absolute inset-0 pointer-events-none border-[0.5px] border-slate-300 m-2"></div>
                    <div className="absolute inset-6 pointer-events-none border-[1px] border-slate-800 shadow-[0_0_0_2px_rgba(30,41,59,0.05)] rounded-sm"></div>
                    <div className="absolute top-6 left-6 right-6 h-[1px] bg-slate-800/10"></div>
                    <div className="absolute bottom-6 left-6 right-6 h-[1px] bg-slate-800/10"></div>
                    <div className="absolute top-6 bottom-6 left-6 w-[1px] bg-slate-800/10"></div>
                    <div className="absolute top-6 bottom-6 right-6 w-[1px] bg-slate-800/10"></div>
                    
                    {/* Content Area with Standard Margins */}
                    <div className="h-full p-[25mm] md:p-[30mm] relative">
                      {aiResult ? (
                        <div className="markdown-body relative z-10 max-w-none">
                          {renderContentWithSignatures(aiResult)}
                        </div>
                      ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center py-12">
                          <div className="bg-slate-50 p-6 rounded-full mb-6">
                            <FileText className="w-20 h-20 opacity-40 text-slate-300" />
                          </div>
                          <p className="text-xl font-bold text-slate-400">Belum Ada Konten Aktif</p>
                          <p className="text-sm max-w-xs text-center mt-2 text-slate-400 mb-12">Pilih materi dari koleksi Bapak di bawah atau buat baru di tab 'Modul RPP'.</p>

                          {history.length > 0 && (
                            <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                  <BookOpen className="w-4 h-4 text-primary" /> Koleksi Bank Materi Bapak
                                </h3>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{history.length} Item</span>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-separate border-spacing-0">
                                  <thead>
                                    <tr>
                                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Judul Materi</th>
                                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Kategori</th>
                                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Tindakan</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {history.slice(0, 5).map(item => (
                                      <tr key={item.id} className="hover:bg-slate-50 transition-colors group even:bg-slate-50/30">
                                        <td className="px-6 py-4">
                                          <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm shadow-sm group-hover:scale-110 transition-transform">
                                              {item.type === 'Silabus' ? '📋' : '📝'}
                                            </div>
                                            <span className="font-bold text-slate-700">{item.topic}</span>
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-400">{item.type}</td>
                                        <td className="px-6 py-4 text-right">
                                          <button 
                                            onClick={() => setAiResult(item.content)}
                                            className="text-primary font-bold text-xs hover:underline"
                                          >
                                            Buka Dokumen
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              {history.length > 5 && (
                                <div className="p-4 text-center border-t border-slate-100">
                                  <button onClick={() => setActiveTab('riwayat')} className="text-xs font-bold text-slate-400 hover:text-primary transition-colors">Lihat {history.length - 5} materi lainnya di Riwayat →</button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer decoration */}
                    <div className="absolute bottom-10 right-10 opacity-5 pointer-events-none">
                       <p className="text-[40px] font-black text-slate-900 rotate-[-15deg]">IPS</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'drive' && (
              <motion.div 
                key="drive"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="bg-emerald-50 w-32 h-32 rounded-[40px] flex items-center justify-center mb-8 rotate-12 group hover:rotate-0 transition-transform duration-500 shadow-sm border border-emerald-100">
                  <HardDrive className="w-16 h-16 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-bold text-text-dark mb-3">Sync dengan Google Drive</h2>
                <p className="text-text-light max-w-sm mb-10 leading-relaxed text-lg">Setiap dokumen yang Bapak buat akan tersimpan rapi di folder <span className="text-emerald-600 font-bold">"IPS Maestro"</span> secara otomatis.</p>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                  <button 
                    disabled={!aiResult || !isAuthenticated}
                    onClick={() => {
                      fetch('/api/drive/upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: `IPS_${topic}.txt`, content: aiResult, mimeType: 'text/plain' })
                      })
                      .then(async (res) => {
                        if (!res.ok) {
                          const errData = await res.json().catch(() => ({}));
                          throw new Error(errData.error || 'Gagal upload ke Drive');
                        }
                        return res;
                      })
                      .then(() => {
                        confetti();
                        setStatus({ type: 'success', message: 'Berhasil diupload ke Drive!' });
                      })
                      .catch(err => setStatus({ type: 'error', message: err.message }));
                    }}
                    className="flex-1 bg-success text-white px-8 py-4 rounded-2xl font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-emerald-200"
                  >
                    Simpan Materi Ini
                  </button>
                  <button className="flex-1 border-2 border-emerald-100 text-emerald-600 px-8 py-4 rounded-2xl font-bold hover:bg-emerald-50 transition-all">
                    Lihat Folder Drive
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {modalImage && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-900/95 backdrop-blur-sm"
              onClick={() => setModalImage(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-[40px] overflow-hidden max-w-5xl w-full max-h-full flex flex-col md:flex-row shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="md:w-3/5 bg-slate-100 flex items-center justify-center relative overflow-hidden group min-h-[300px]">
                  <img 
                    src={modalImage.src} 
                    alt={modalImage.alt} 
                    className="max-w-full max-h-[70vh] object-contain shadow-2xl z-10 p-4"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  
                  <button 
                   onClick={() => setModalImage(null)}
                   className="absolute top-6 right-6 w-12 h-12 bg-white/90 backdrop-blur rounded-2xl flex items-center justify-center text-slate-800 shadow-xl hover:scale-110 active:scale-95 transition-all z-20"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="md:w-2/5 p-8 md:p-12 flex flex-col justify-between bg-white border-t md:border-t-0 md:border-l border-slate-100">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">Detail Visual</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Bank Materi IPS</span>
                    </div>
                    
                    <h3 className="text-3xl font-black text-slate-800 leading-tight">
                      {modalImage.title}
                    </h3>
                    
                    <p className="text-slate-500 font-medium leading-relaxed">
                      {modalImage.description}
                    </p>
                    
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-start gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm">📍</div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sumber Media</p>
                        <p className="text-sm font-bold text-slate-700">Modul Pembelajaran Kurikulum Merdeka - Pak Catur Pamungkas</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 mt-8">
                    <button 
                      onClick={() => window.open(modalImage.src, '_blank')}
                      className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Buka Full
                    </button>
                    <button 
                      onClick={() => setModalImage(null)}
                      className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Onboarding Overlay */}
        {showOnboarding && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl relative">
               <div className="absolute top-0 right-0 p-6">
                 <button onClick={() => setShowOnboarding(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
               </div>
               
               <div className="p-12">
                  <div className="w-20 h-20 bg-indigo-50 text-primary rounded-3xl flex items-center justify-center mb-8 mx-auto">
                    {onboardingStep === 0 ? <LayoutGrid className="w-10 h-10" /> : 
                     onboardingStep === 1 ? <Sparkles className="w-10 h-10" /> : 
                     <MonitorSmartphone className="w-10 h-10" />}
                  </div>
                  
                  <div className="text-center space-y-4">
                     <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                       {onboardingStep === 0 ? 'Selamat Datang di Maestro!' : 
                        onboardingStep === 1 ? 'Kekuatan AI dalam Genggaman' : 
                        'Akses Dimana Saja'}
                     </h2>
                     <p className="text-slate-500 text-lg">
                       {onboardingStep === 0 ? 'Platform all-in-one untuk Bapak/Ibu Guru IPS dalam menyusun administrasi pembelajaran secara modern dan otomatis.' : 
                        onboardingStep === 1 ? 'Gunakan fitur AI kami untuk membuat RPP, Bank Soal, dan Silabus hanya dengan memasukkan topik materi atau mengupload file.' : 
                        'Maestro sepenuhnya mobile-friendly. Bapak/Ibu bisa menggunakannya di smartphone maupun laptop dengan pengalaman yang sama baiknya.'}
                     </p>
                  </div>

                  <div className="mt-12 flex flex-col gap-4">
                    <button 
                      onClick={() => onboardingStep < 2 ? setOnboardingStep(onboardingStep + 1) : setShowOnboarding(false)}
                      className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 hover:scale-105 transition-all"
                    >
                      {onboardingStep === 2 ? 'Mulai Eksplorasi' : 'Selanjutnya'}
                    </button>
                    <div className="flex justify-center gap-2">
                       {[0, 1, 2].map(i => (
                         <div key={i} className={`w-2 h-2 rounded-full transition-all ${onboardingStep === i ? 'bg-primary w-6' : 'bg-slate-200'}`} />
                       ))}
                    </div>
                  </div>
               </div>
            </motion.div>
          </div>
        )}

        {/* Global CBT Interface Overlay */}
        <AnimatePresence>
          {quizView !== 'selection' && activeQuiz && (
            <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col overflow-hidden">
               {quizView === 'taking' && (
                 <motion.div 
                   key="taking"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="flex flex-col h-full w-full"
                 >
                   {/* CBT Header */}
                   <header className={`bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 transition-all duration-500 shadow-sm relative z-20 ${isFullscreen ? 'py-6 md:py-8' : 'py-4'}`}>
                     <div className="flex items-center gap-4 w-full sm:w-auto">
                       <div className="bg-primary p-2 md:p-3 rounded-2xl text-white shadow-lg shadow-primary/20">
                         <LayoutGrid className="w-6 h-6 md:w-7 md:h-7" />
                       </div>
                       <div>
                         <h2 className="font-black text-slate-800 leading-tight text-lg md:text-xl tracking-tight">CBT - {activeQuiz.title}</h2>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{activeQuiz.topic} • Grade {activeQuiz.grade}</p>
                       </div>
                     </div>

                     <div className="flex items-center justify-between sm:justify-end gap-3 md:gap-6 w-full sm:w-auto">
                       <button 
                         onClick={toggleFullscreen}
                         className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center border border-slate-100"
                         title={isFullscreen ? "Keluar Fullscreen" : "Masuk Fullscreen"}
                       >
                         {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
                       </button>

                       <div className={`px-5 py-2 md:px-8 md:py-3.5 rounded-2xl md:rounded-[24px] flex items-center gap-4 md:gap-5 border-2 transition-all duration-500 shadow-sm grow sm:grow-0 ${
                         timeLeft < 300 
                           ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse shadow-rose-100' 
                           : 'bg-white border-slate-100 text-slate-800'
                       }`}>
                         <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center ${timeLeft < 300 ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-slate-100 text-slate-500'}`}>
                           <Clock className="w-5 h-5 md:w-6 md:h-6" />
                         </div>
                         <div className="flex flex-col">
                           <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-none mb-1.5">Sisa Waktu</span>
                           <span className="font-black text-2xl md:text-3xl tabular-nums leading-none tracking-tight">{formatTime(timeLeft)}</span>
                         </div>
                       </div>

                       <button 
                         onClick={() => {
                            if (confirm('Apakah Anda yakin ingin menyelesaikan ujian?')) {
                              completeQuiz();
                            }
                         }}
                         className="bg-slate-900 text-white px-6 md:px-10 py-3.5 md:py-5 rounded-2xl md:rounded-[24px] font-black flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-slate-300 uppercase tracking-widest text-[10px] md:text-xs"
                       >
                         <Send className="w-4 h-4" />
                         <span className="hidden sm:inline">Selesai</span>
                       </button>
                     </div>
                   </header>

                   <div className="flex-1 overflow-hidden flex flex-col lg:flex-row relative">
                     {/* Fullscreen Timer Alert (Pulse) */}
                     {timeLeft > 0 && timeLeft <= 60 && (
                       <div className="absolute inset-0 pointer-events-none z-50 border-8 border-rose-500/20 animate-pulse" />
                     )}

                     {/* Left Panel: Question Content */}
                     <div className={`flex-1 overflow-y-auto p-4 md:p-10 flex flex-col transition-all duration-500 ${isFullscreen ? 'bg-slate-50/50' : 'bg-slate-50'}`}>
                       <div className="max-w-4xl mx-auto w-full flex-1">
                         <div className={`bg-white rounded-[32px] md:rounded-[48px] p-6 md:p-12 shadow-xl border border-slate-100 mb-10 transition-all duration-500 ${isFullscreen ? 'scale-[1.02] shadow-2xl' : ''}`}>
                           <div className="flex items-center gap-4 mb-10">
                             <span className="px-6 py-3 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black text-2xl min-w-[72px] shadow-sm">
                               {currentQuestionIndex + 1}
                             </span>
                             <div className="h-px flex-1 bg-slate-100" />
                             <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest hidden sm:block">Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}</span>
                           </div>

                           <motion.h3 
                             key={currentQuestionIndex}
                             initial={{ opacity: 0, y: 20 }}
                             animate={{ opacity: 1, y: 0 }}
                             className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-800 leading-tight mb-12 tracking-tight"
                           >
                             {activeQuiz.questions[currentQuestionIndex].question}
                           </motion.h3>

                           <motion.div 
                             key={`options-${currentQuestionIndex}`}
                             initial={{ opacity: 0, y: 10 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ delay: 0.1 }}
                             className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
                           >
                             {activeQuiz.questions[currentQuestionIndex].options?.map((option, idx) => {
                               const qId = activeQuiz.questions[currentQuestionIndex].id;
                               const isSelected = userAnswers[qId] === option;
                               return (
                                 <button 
                                   key={idx}
                                   onClick={() => submitAnswer(option)}
                                   className={`w-full p-6 md:p-8 rounded-[24px] md:rounded-[32px] text-left font-bold transition-all border-2 flex items-center gap-6 group relative ${
                                     isSelected 
                                       ? 'bg-indigo-50 border-primary text-primary shadow-2xl shadow-indigo-200/50 scale-[1.02]' 
                                       : 'bg-white border-slate-100 hover:border-primary/30 hover:bg-slate-50/50 text-slate-700 hover:scale-[1.01]'
                                   }`}
                                 >
                                   <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl md:rounded-3xl flex items-center justify-center text-lg font-black transition-all ${
                                     isSelected ? 'bg-primary text-white shadow-lg shadow-primary/30 rotate-3' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-primary group-hover:rotate-3'
                                   }`}>
                                     {String.fromCharCode(65 + idx)}
                                   </div>
                                   <span className="flex-1 text-lg md:text-xl font-bold leading-snug">{option}</span>
                                   {isSelected && (
                                     <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg animate-in zoom-in">
                                       <Check className="w-5 h-5" />
                                     </div>
                                   )}
                                 </button>
                               );
                             })}
                           </motion.div>
                         </div>
                       </div>

                       {/* Bottom Navigation */}
                       <div className="max-w-4xl mx-auto w-full pb-10 flex flex-wrap gap-4 justify-between items-center px-4 sm:px-0">
                         <div className="flex gap-4">
                           <button 
                             disabled={currentQuestionIndex === 0}
                             onClick={prevQuestion}
                             className="w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-white border-2 border-slate-200 text-slate-800 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm active:scale-95"
                           >
                             <ChevronLeft className="w-6 h-6 md:w-7 md:h-7" />
                           </button>

                           <button 
                             onClick={() => setMarkedDoubt(prev => ({...prev, [activeQuiz.questions[currentQuestionIndex].id]: !prev[activeQuiz.questions[currentQuestionIndex].id]}))}
                             className={`px-8 py-4 md:py-5 rounded-2xl md:rounded-3xl border-2 font-black flex items-center gap-3 transition-all uppercase tracking-widest text-[10px] active:scale-95 ${
                               markedDoubt[activeQuiz.questions[currentQuestionIndex].id]
                                 ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-200'
                                 : 'bg-white border-slate-200 text-slate-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-500'
                             }`}
                           >
                             <Flag className={`w-4 h-4 ${markedDoubt[activeQuiz.questions[currentQuestionIndex].id] ? 'fill-current' : ''}`} /> Ragu-ragu
                           </button>
                         </div>

                         <button 
                           onClick={() => {
                             if (currentQuestionIndex === activeQuiz.questions.length - 1) {
                                if (confirm('Selesaikan kuis sekarang?')) completeQuiz();
                             } else {
                                nextQuestion();
                             }
                           }}
                           className="px-10 md:px-14 py-4 md:py-6 rounded-2xl md:rounded-4xl bg-slate-900 text-white font-black flex items-center gap-4 hover:bg-black transition-all shadow-2xl shadow-slate-300 uppercase tracking-[0.2em] text-xs active:scale-95 group"
                         >
                           <span>{currentQuestionIndex === activeQuiz.questions.length - 1 ? 'Selesai' : 'Lanjut'}</span>
                           <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                         </button>
                       </div>
                     </div>

                     {/* Right Panel: Navigator */}
                     <div className={`w-full lg:w-96 bg-white border-l border-slate-200 p-8 flex flex-col transition-all duration-500 ${isFullscreen ? 'hidden xl:flex xl:w-28 overflow-hidden' : 'lg:flex'}`}>
                       <div className={`flex items-center gap-3 mb-8 ${isFullscreen ? 'xl:flex-col xl:items-center' : ''}`}>
                         <LayoutGrid className="w-6 h-6 text-slate-400" />
                         <h4 className={`font-black text-slate-800 uppercase tracking-widest text-sm ${isFullscreen ? 'xl:hidden text-center' : ''}`}>Navigator</h4>
                       </div>

                       <div className={`grid gap-3 transition-all ${isFullscreen ? 'grid-cols-1' : 'grid-cols-5 lg:grid-cols-4'} pr-1 overflow-y-auto`}>
                         {activeQuiz.questions.map((q, idx) => {
                           const isCurrent = idx === currentQuestionIndex;
                           const isAnswered = !!userAnswers[q.id];
                           const isMarked = !!markedDoubt[q.id];

                           return (
                             <button
                               key={idx}
                               onClick={() => setCurrentQuestionIndex(idx)}
                               className={`aspect-square rounded-xl md:rounded-2xl flex items-center justify-center font-black text-sm transition-all border-2 active:scale-90 shadow-sm ${
                                 isCurrent 
                                   ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30 scale-110' 
                                   : isMarked
                                     ? 'border-amber-400 bg-amber-400 text-white shadow-md shadow-amber-100'
                                     : isAnswered
                                       ? 'border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-100'
                                       : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-primary/30 hover:text-primary hover:bg-primary/5'
                               }`}
                             >
                               {idx + 1}
                             </button>
                           );
                         })}
                       </div>

                       {/* Legend */}
                       <div className="mt-auto pt-6 grid grid-cols-2 gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100">
                         <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full bg-emerald-500" />
                           <span>Terjawab</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full bg-amber-400" />
                           <span>Ragu-ragu</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full bg-slate-50 border border-slate-100" />
                           <span>Belum</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full bg-white border-2 border-primary" />
                           <span>Aktif</span>
                         </div>
                       </div>
                     </div>
                   </div>
                 </motion.div>
               )}

               {quizView === 'result' && (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto py-10 px-6 pb-20 w-full overflow-y-auto"
                  >
                    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
                      <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-12 text-center text-white relative">
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", damping: 12 }}
                          className="w-32 h-32 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-6 border border-white/30"
                        >
                          <Award className="w-16 h-16 text-white" />
                        </motion.div>
                        
                        <h2 className="text-4xl md:text-5xl font-black mb-2">Hasil Ujian CBT</h2>
                        <p className="text-indigo-100 font-medium mb-8">"{activeQuiz.title}"</p>
                        
                        <div className="flex justify-center items-center gap-8 md:gap-16">
                          <div className="text-center">
                            <p className="text-xs font-black uppercase tracking-widest text-indigo-200 mb-1">Skor Akhir</p>
                            <p className="text-5xl font-black tracking-tight">{quizScore}</p>
                          </div>
                          <div className="w-px h-12 bg-white/20" />
                          <div className="text-center">
                            <p className="text-xs font-black uppercase tracking-widest text-indigo-200 mb-1">Status</p>
                            <p className="text-2xl font-black uppercase tracking-wider">
                              {(quizScore || 0) >= 75 ? 'LULUS' : 'REMIDI'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-10">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 text-center">
                            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Soal</div>
                            <div className="text-2xl font-bold text-slate-700">{activeQuiz.questions.length}</div>
                          </div>
                          <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 text-center">
                            <div className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">Benar</div>
                            <div className="text-2xl font-bold text-emerald-600">
                              {activeQuiz.questions.filter(q => userAnswers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()).length}
                            </div>
                          </div>
                          <div className="p-6 rounded-3xl bg-rose-50 border border-rose-100 text-center">
                            <div className="text-xs font-black text-rose-400 uppercase tracking-widest mb-1">Salah</div>
                            <div className="text-2xl font-bold text-rose-600">
                              {activeQuiz.questions.filter(q => userAnswers[q.id] && userAnswers[q.id]?.toLowerCase().trim() !== q.correctAnswer.toLowerCase().trim()).length}
                            </div>
                          </div>
                          <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100 text-center">
                            <div className="text-xs font-black text-amber-400 uppercase tracking-widest mb-1">Ragu-ragu</div>
                            <div className="text-2xl font-bold text-amber-600">
                              {Object.keys(markedDoubt).filter(id => markedDoubt[id]).length}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-1.5 h-6 bg-primary rounded-full" />
                            <h3 className="text-xl font-black text-slate-800">Analisis Soal</h3>
                          </div>
                          
                          <div className="space-y-4">
                            {activeQuiz.questions.map((q, idx) => {
                              const isCorrect = userAnswers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
                               return (
                                <div key={idx} className="group">
                                  <div className={`p-6 rounded-3xl border-2 transition-all ${isCorrect ? 'bg-white border-emerald-100' : 'bg-white border-rose-100'}`}>
                                    <div className="flex items-start gap-4">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                        {idx + 1}
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-bold text-slate-800 mb-4">{q.question}</p>
                                        <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                                          <div className={`p-3 rounded-2xl border ${isCorrect ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
                                            <p className="text-[10px] uppercase font-black opacity-50 mb-1">Jawaban Kamu</p>
                                            <p className="font-bold">{userAnswers[q.id] || '-'}</p>
                                          </div>
                                          {!isCorrect && (
                                            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800">
                                              <p className="text-[10px] uppercase font-black opacity-50 mb-1">Kunci Jawaban</p>
                                              <p className="font-bold">{q.correctAnswer}</p>
                                            </div>
                                          )}
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                                          <p className="text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Penjelasan AI</p>
                                          <p className="text-sm text-slate-600 leading-relaxed italic">{q.explanation}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="mt-12 flex justify-center">
                          <button
                            onClick={() => {
                               setQuizView('selection');
                               setActiveQuiz(null);
                            }}
                            className="bg-slate-900 text-white px-10 py-5 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl shadow-slate-200"
                          >
                            Keluar dari Kuis
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
               )}
            </div>
          )}
        </AnimatePresence>

        {/* Floating AI Assistant Button */}
        <div className="fixed bottom-10 right-10 z-50">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 bg-primary text-white rounded-2xl shadow-2xl shadow-primary/30 flex items-center justify-center relative group"
            onClick={() => alert("Fitur Chat AI Asisten sedang dalam pengembangan oleh Pak Catur.")}
          >
            <div className="absolute -top-12 right-0 bg-white text-slate-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Tanya Pak Catur (AI)
            </div>
            <Sparkles className="w-8 h-8" />
          </motion.button>
        </div>

        {/* Floating AI Assistant Button */}
        <div className="fixed bottom-10 right-10 z-[60] flex flex-col items-end gap-4">
          <AnimatePresence>
            {activeQuiz && (
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-12 h-12 bg-white text-slate-800 rounded-2xl shadow-xl flex items-center justify-center hover:bg-slate-50 transition-all border border-slate-100"
              >
                <ChevronUp className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group flex items-center gap-3 bg-slate-900 text-white pl-5 pr-6 py-4 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:bg-black transition-all relative overflow-hidden"
            onClick={() => alert("Fitur Tanya AI Maestro: Ajukan pertanyaan tentang RPP, Silabus, atau Materi IPS Anda di sini. (Coming Soon)")}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="relative font-bold text-sm tracking-tight">Tanya AI Maestro</span>
          </motion.button>
        </div>

        <Footer />
      </main>
    </div>
  );
}
