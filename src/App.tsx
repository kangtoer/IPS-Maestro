import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
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
  Upload
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
import { generateTeachingContent, generateQuizContent, generateQuizFromData, generateBankSoal } from './lib/gemini';
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
  serverTimestamp,
  orderBy,
  getDocFromServer
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
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

type Tab = 'beranda' | 'rpp' | 'materi' | 'drive' | 'silabus' | 'rpp_mendalam' | 'bank_soal' | 'penilaian' | 'riwayat';

interface HistoryItem {
  id: string;
  type: 'RPP' | 'Silabus' | 'RPP Mendalam' | 'Kuis';
  topic: string;
  content: string;
  date: string;
  userId: string;
}

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
  const [subject, setSubject] = useState('IPS (Ilmu Pengetahuan Sosial)');
  const [teacherName, setTeacherName] = useState('Catur Pamungkas, S.Pd.,Gr.');
  const [nip, setNip] = useState('199001012023011001');
  const [school, setSchool] = useState('SMP PGRI 1 Kuwarasan, Kebumen');
  const [meetings, setMeetings] = useState('1 Pertemuan (2JP x 40 menit)');
  const [teachingMedia, setTeachingMedia] = useState('LCD, Power Point, Lingkungan Sekitar');
  const [learningModel, setLearningModel] = useState('Problem Based Learning (PBL)');
  const [selectedP3, setSelectedP3] = useState<string[]>(['Keimanan dan Ketakwaan terhadap Tuhan YME']);
  const [semester, setSemester] = useState('Gasal');
  const [kurikulum, setKurikulum] = useState('Merdeka');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [aiResult, setAiResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [pageSize, setPageSize] = useState<'A4' | 'F4' | 'Legal'>('A4');
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
  });
  const [bankSoalData, setBankSoalData] = useState<any>(null);
  const [bankSoalBaseText, setBankSoalBaseText] = useState('');

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

  const filteredAssessments = filterGrade === 'All' 
    ? assessments 
    : assessments.filter(a => a.grade === filterGrade);

  const contentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Auth Check ---
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

      const qResults = query(collection(db, 'quizResults'));
      unsubResults = onSnapshot(qResults, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setQuizResultsList(items);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'quizResults'));
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
    };
  }, [user, userRole]);

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

  function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
  }

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

  const handleDocumentUploadForQuiz = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setDocumentFile(file);
  };

  const generateQuizFromDocument = async () => {
    if (!documentFile) return;

    setIsGenerating(true);
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
        throw new Error(`Respons API tidak valid (Bukan JSON). Server text: ${textResponse.substring(0, 50)}...`);
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
          throw new Error('Respons API tidak valid.');
        }
        documentContent = data.text + '\n' + documentContent;
      }

      setStatus({ type: null, message: "AI sedang membuat variasi soal..." });
      
      const configFetch = {
        ...bankSoalConfig,
        grade,
        baseText: documentContent,
      };

      const resultText = await generateBankSoal(configFetch);
      
      let cleanJson = resultText;
      if (cleanJson.includes("```json")) {
        cleanJson = cleanJson.split("```json")[1].split("```")[0].trim();
      } else if (cleanJson.includes("```")) {
        cleanJson = cleanJson.split("```")[1].split("```")[0].trim();
      }
      
      const parsedData = JSON.parse(cleanJson);
      setBankSoalData(parsedData);

      setStatus({ type: 'success', message: 'Berhasil membuat Bank Soal!' });
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
        kurikulum
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

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setQuizView('taking');
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setQuizFeedback({});
    setQuizScore(null);
  };

  const submitAnswer = (answer: string) => {
    if (!activeQuiz) return;
    const currentQuestion = activeQuiz.questions[currentQuestionIndex];
    
    const isCorrect = answer.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();
    
    // Track feedback for this specific step
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
      // Calculate final score
      let correctCount = 0;
      activeQuiz.questions.forEach(q => {
        if (userAnswers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) {
          correctCount++;
        }
      });
      setQuizScore(Math.round((correctCount / activeQuiz.questions.length) * 100));
      setQuizView('result');
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
    setAiResult('');
    try {
      const res = await generateTeachingContent(`RPP Lengkap Kurikulum ${kurikulum}`, topic, kurikulum);
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

  const exportBankSoalPDF = () => {
    if (!bankSoalData?.questions) return;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    let y = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth() - 2 * margin;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("BANK SOAL IPS", margin, y);
    y += 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    
    doc.text(`Topik: ${bankSoalData.topic || bankSoalConfig.topic}`, margin, y); y+=7;
    doc.text(`Kelas: ${bankSoalData.grade || grade}`, margin, y); y+=7;
    doc.text(`Kesulitan: ${bankSoalData.difficulty || bankSoalConfig.difficulty}`, margin, y); y+=10;

    bankSoalData.questions.forEach((q: any, i: number) => {
      const qText = `${i + 1}. [${q.type.toUpperCase()}] ${q.question}`;
      const lines = doc.splitTextToSize(qText, pageWidth);
      
      if (y + (lines.length * 7) > 280) { doc.addPage(); y = 20; }
      
      doc.setFont("helvetica", "bold");
      doc.text(lines, margin, y);
      y += lines.length * 6 + 2;
      
      doc.setFont("helvetica", "normal");
      if (q.options?.length > 0) {
        q.options.forEach((opt: string) => {
          const optLines = doc.splitTextToSize(`- ${opt}`, pageWidth - 5);
          if (y + (optLines.length * 7) > 280) { doc.addPage(); y = 20; }
          doc.text(optLines, margin + 5, y);
          y += optLines.length * 5 + 1;
        });
        y += 2;
      }

      if (y + 15 > 280) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "italic");
      const ansLines = doc.splitTextToSize(`Jawaban: ${q.answer || q.correctAnswer}`, pageWidth);
      doc.text(ansLines, margin, y);
      y += ansLines.length * 5 + 1;
      
      const expLines = doc.splitTextToSize(`Penjelasan: ${q.explanation}`, pageWidth);
      doc.text(expLines, margin, y);
      y += expLines.length * 5 + 6;
    });

    doc.save(`Bank_Soal_IPS_${new Date().toISOString().split('T')[0]}.pdf`);
    setStatus({ type: 'success', message: 'Bank Soal PDF berhasil diunduh!' });
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

  const Sidebar = () => {
    const items: { id: Tab, icon: any, label: string }[] = [
      { id: 'beranda', icon: Layout, label: 'Dashboard' },
      { id: 'riwayat', icon: Search, label: 'Riwayat' },
      { id: 'rpp_mendalam', icon: FileText, label: 'RPP Mendalam' },
      { id: 'silabus', icon: ClipboardList, label: 'Silabus' },
      { id: 'bank_soal', icon: FileText, label: 'Bank Soal' },
      { id: 'penilaian', icon: BarChart3, label: 'Penilaian' },
      { id: 'rpp', icon: FileText, label: 'Modul RPP / MA' },
      { id: 'materi', icon: BookOpen, label: 'Bank Materi' },
      { id: 'drive', icon: HardDrive, label: 'Drive Cloud' },
    ];

    return (
      <aside className="w-full md:w-[260px] bg-white border-b md:border-b-0 md:border-r-2 border-slate-200 flex flex-col p-6 h-auto md:h-screen sticky top-0">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg">
            IPS
          </div>
          <div className="font-bold text-lg text-text-dark">Maestro</div>
        </div>

        <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap md:whitespace-normal ${
                activeTab === item.id 
                  ? 'bg-primary-light text-primary' 
                  : 'text-text-light hover:bg-slate-50'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-primary' : 'text-text-light'}`} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100 hidden md:block">
          {isAuthenticated && (
            <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">AI Maestro Limit</span>
                <span className="text-[10px] font-bold text-slate-600">{todayUsage} / {DAILY_LIMIT}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${usagePercentage}%` }}
                  className={`h-full rounded-full ${usagePercentage > 90 ? 'bg-rose-500' : usagePercentage > 70 ? 'bg-amber-500' : 'bg-primary'}`}
                />
              </div>
              {todayUsage >= DAILY_LIMIT && (
                <p className="text-[9px] text-rose-500 font-bold mt-2 animate-pulse">Limit harian tercapai!</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-text-light mb-4">
            <div className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-success' : 'bg-slate-300'}`}></div>
            <span>Drive Sync: {isAuthenticated ? 'Aktif' : 'Nonaktif'}</span>
          </div>
          
          <div className="mt-4">
            {isAuthenticated ? (
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-rose-600 font-bold text-xs hover:text-rose-700 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Keluar Akun
              </button>
            ) : (
              <button 
                onClick={handleLogin}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-sm"
              >
                Connect Google
              </button>
            )}
          </div>
        </div>
      </aside>
    );
  };

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
                         <p className="text-xs text-slate-500 mt-2">Dibuat: {quiz.date}</p>
                       </div>
                       <button 
                         onClick={() => { 
                           setActiveQuiz(quiz); 
                           setQuizView('taking'); 
                           setCurrentQuestionIndex(0); 
                           setUserAnswers({}); 
                           setQuizScore(null); 
                           setQuizFeedback({}); 
                         }}
                         className="mt-6 w-full bg-slate-900 text-white p-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
                       >
                         Mulai Kerjakan
                       </button>
                     </div>
                   ))
                 )}
               </div>
             </>
           )}

           {quizView === 'taking' && activeQuiz && (
             <div className="max-w-3xl mx-auto">
               <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-6">
                 <div className="flex justify-between items-center mb-6 text-sm font-bold text-slate-500 uppercase tracking-widest pb-6 border-b border-slate-100">
                   <span>Soal {currentQuestionIndex + 1} dari {activeQuiz.questions.length}</span>
                   <span>Kelas {activeQuiz.grade}</span>
                 </div>
                 
                 <h3 className="text-xl font-medium mb-8 leading-relaxed">
                   {activeQuiz.questions[currentQuestionIndex].question}
                 </h3>

                 <div className="space-y-3">
                   {activeQuiz.questions[currentQuestionIndex].options?.map((option, idx) => {
                     const isSelected = userAnswers[currentQuestionIndex] === option;
                     return (
                       <button
                         key={idx}
                         onClick={() => setUserAnswers({...userAnswers, [currentQuestionIndex]: option})}
                         className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${isSelected ? 'border-primary bg-indigo-50 text-indigo-900 font-medium' : 'border-slate-100 hover:border-slate-300 bg-white'}`}
                       >
                         {option}
                       </button>
                     );
                   })}
                 </div>
                 
                 <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between">
                   <button
                     onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                     disabled={currentQuestionIndex === 0}
                     className="px-6 py-3 rounded-xl font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors"
                   >
                     Sebelumnya
                   </button>
                   
                   {currentQuestionIndex === activeQuiz.questions.length - 1 ? (
                     <button
                       onClick={async () => {
                         let correctCount = 0;
                         const computedFeedback: any = {};
                         activeQuiz.questions.forEach((q, idx) => {
                           const isCorrect = userAnswers[idx] === q.correctAnswer;
                           if (isCorrect) correctCount++;
                           computedFeedback[idx] = { isCorrect, feedback: q.explanation };
                         });
                         
                         const finalScore = Math.round((correctCount / activeQuiz.questions.length) * 100);
                         setQuizScore(finalScore);
                         setQuizFeedback(computedFeedback);
                         setQuizView('result');

                         try {
                           await addDoc(collection(db, 'quizResults'), {
                             quizId: activeQuiz.id,
                             quizTitle: activeQuiz.title,
                             studentId: user?.uid,
                             studentName: user?.displayName || studentUsername || 'Anonymous',
                             score: finalScore,
                             answers: userAnswers,
                             date: new Date().toLocaleDateString('id-ID')
                           });
                           setStatus({ type: 'success', message: 'Hasil kuis berhasil disimpan!' });
                         } catch (error) {
                           handleFirestoreError(error, OperationType.CREATE, 'quizResults');
                         }
                       }}
                       className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-colors"
                     >
                       Kumpulkan
                     </button>
                   ) : (
                     <button
                       onClick={() => setCurrentQuestionIndex(Math.min(activeQuiz.questions.length - 1, currentQuestionIndex + 1))}
                       className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-slate-800 transition-colors"
                     >
                       Selanjutnya
                     </button>
                   )}
                 </div>
               </div>
             </div>
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
                           <span className="text-text-light">Jawabanmu:</span> <span className="font-medium">{userAnswers[idx] || '-'}</span>
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
      
      <main className="flex-1 p-6 md:p-10 flex flex-col min-h-screen overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start gap-4 mb-10">
          <div className="welcome">
            <h2 className="text-3xl font-bold text-text-dark mb-1">Halo, Pak Catur! 👋</h2>
            <p className="text-text-light">Siap untuk menginspirasi siswa hari ini? Kelola semua kebutuhan IPS Anda di satu tempat.</p>
          </div>
          
          <div className="flex gap-2">
            {!isAuthenticated && (
              <button 
                onClick={handleLogin}
                className="md:hidden flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm"
              >
                Connect Google
              </button>
            )}
          </div>
        </header>
        
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'beranda' && (
              <motion.div 
                key="beranda"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid md:grid-cols-3 gap-6"
              >
                {/* Stats Card */}
                <div className="md:col-span-3 bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/10 rounded-full -ml-10 -mb-10 blur-2xl" />
                  
                  <div className="relative flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-indigo-200" />
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-100">Kapasitas AI Harian</span>
                      </div>
                      <h3 className="text-4xl font-black mb-2 flex items-baseline gap-3">
                        {DAILY_LIMIT - todayUsage} 
                        <span className="text-xl font-medium text-indigo-200 uppercase tracking-widest leading-none">Limit Tersisa</span>
                      </h3>
                      <p className="text-indigo-100/80 text-sm max-w-sm">
                        Anda telah menggunakan {todayUsage} dari {DAILY_LIMIT} kuota harian untuk menyusun RPP, Silabus, dan Materi IPS.
                      </p>
                    </div>
                    
                    <div className="w-full md:w-64">
                      <div className="flex justify-between text-xs font-bold mb-2 text-indigo-100 uppercase tracking-widest">
                        <span>Pemakaian</span>
                        <span>{Math.round(usagePercentage)}%</span>
                      </div>
                      <div className="h-4 bg-white/10 rounded-full overflow-hidden p-1 backdrop-blur-sm shadow-inner">
                        <motion.div 
                          className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                          initial={{ width: 0 }}
                          animate={{ width: `${usagePercentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                      <p className="mt-4 text-[10px] text-center font-bold text-indigo-200 uppercase tracking-[0.1em]">Limit akan direset setiap 24 jam</p>
                    </div>
                  </div>
                </div>

                {/* Card 0: Riwayat Sesi */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-50 flex flex-col group hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition-transform">
                    🕒
                  </div>
                  <h3 className="text-xl font-bold mb-3">Riwayat Sesi</h3>
                  <p className="text-sm text-text-light leading-relaxed flex-1">
                    Akses kembali file RPP dan Silabus yang pernah Bapak buat sebelumnya.
                  </p>
                  <button 
                    onClick={() => setActiveTab('riwayat')}
                    className="mt-6 bg-slate-800 text-white py-3 rounded-xl font-bold text-sm hover:bg-black transition-all text-center"
                  >
                    Lihat Riwayat ({history.length})
                  </button>
                </div>

                {/* Card 1: RPP Mendalam */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-50 flex flex-col group hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition-transform">
                    🎯
                  </div>
                  <h3 className="text-xl font-bold mb-3">RPP Mendalam</h3>
                  <p className="text-sm text-text-light leading-relaxed flex-1">
                    Rencana Pembelajaran Mendalam (BSKAP) dengan integrasi 8 Dimensi Profil Lulusan.
                  </p>
                  <button 
                    onClick={() => setActiveTab('rpp_mendalam')}
                    className="mt-6 bg-rose-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-rose-700 transition-all text-center"
                  >
                    Buka RPP Mendalam
                  </button>
                </div>

                {/* Card 2: Silabus */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-50 flex flex-col group hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition-transform">
                    📋
                  </div>
                  <h3 className="text-xl font-bold mb-3">Silabus IPS</h3>
                  <p className="text-sm text-text-light leading-relaxed flex-1">
                    Susun rencana pembelajaran semester (Silabus/ATP) secara otomatis dan terstruktur.
                  </p>
                  <button 
                    onClick={() => setActiveTab('silabus')}
                    className="mt-6 bg-primary text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all text-center"
                  >
                    Buka Silabus
                  </button>
                </div>

                {/* Card 2: RPP Wizard */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-50 flex flex-col group hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition-transform">
                    📝
                  </div>
                  <h3 className="text-xl font-bold mb-3">Modul RPP / MA</h3>
                  <p className="text-sm text-text-light leading-relaxed flex-1">
                    Buat Modul Ajar interaktif berbasis Kurikulum Merdeka secara instan dengan bantuan AI.
                  </p>
                  <button 
                    onClick={() => setActiveTab('rpp')}
                    className="mt-6 bg-secondary text-text-dark py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all text-center"
                  >
                    Mulai Buat Modul
                  </button>
                </div>

                {/* Card 2: Materials */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-50 flex flex-col group hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition-transform">
                    🌍
                  </div>
                  <h3 className="text-xl font-bold mb-3">Bank Materi</h3>
                  <p className="text-sm text-text-light leading-relaxed flex-1">
                    Kumpulan materi sejarah, geografi dan ekonomi terpadu untuk pembelajaran di kelas.
                  </p>
                  <button 
                    onClick={() => setActiveTab('materi')}
                    className="mt-6 bg-primary text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all text-center"
                  >
                    Buka Galeri
                  </button>
                </div>

                {/* Card 3: Assessment */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-50 flex flex-col group hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition-transform">
                    📊
                  </div>
                  <h3 className="text-xl font-bold mb-3">Penilaian</h3>
                  <p className="text-sm text-text-light leading-relaxed flex-1">
                    Input nilai formatif dan sumatif secara sistematis. Export otomatis ke Drive Database.
                  </p>
                  <button 
                    onClick={() => setActiveTab('penilaian')}
                    className="mt-6 bg-primary text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all text-center"
                  >
                    Input Nilai
                  </button>
                </div>

                {/* Card 4.5: Bank Soal */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-50 flex flex-col group hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition-transform">
                    📝
                  </div>
                  <h3 className="text-xl font-bold mb-3">Bank Soal & Kuis</h3>
                  <p className="text-sm text-text-light leading-relaxed flex-1">
                    Generate soal HOTS (C1-C6) dengan AI dari teks/dokumen. Export ke PDF, Word, Excel.
                  </p>
                  <button 
                    onClick={() => setActiveTab('bank_soal')}
                    className="mt-6 bg-primary text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all text-center"
                  >
                    Buka Bank Soal
                  </button>
                </div>

                {/* Card 5: Drive */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-50 flex flex-col group hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition-transform">
                    📁
                  </div>
                  <h3 className="text-xl font-bold mb-3">Drive Cloud</h3>
                  <p className="text-sm text-text-light leading-relaxed flex-1">
                    Akses database file ajar di Google Drive. Sinkronisasi otomatis antar perangkat.
                  </p>
                  <button 
                    onClick={() => setActiveTab('drive')}
                    className="mt-6 bg-success text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all text-center"
                  >
                    Buka Drive
                  </button>
                </div>


              </motion.div>
            )}

            {activeTab === 'riwayat' && (
              <motion.div 
                key="riwayat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto space-y-8"
              >
                <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Search className="text-primary" /> Riwayat Generasi AI
                      </h3>
                      <p className="text-sm text-text-light">Lihat dan akses kembali RPP atau Silabus yang telah dibuat.</p>
                    </div>
                  </div>

                  {history.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">
                      <FileText className="w-16 h-16 mx-auto mb-4 opacity-10" />
                      <p>Belum ada riwayat generasi.</p>
                    </div>
                  ) : (
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
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">IPS Maestro AI</p>
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
                            <td className="px-6 py-5 text-center whitespace-nowrap">
                              <span className="text-xs font-bold text-slate-500">{item.date}</span>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => {
                                    setAiResult(item.content);
                                    setActiveTab('materi');
                                  }}
                                  className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-sm"
                                >
                                  Preview
                                </button>
                                <button 
                                  onClick={async () => {
                                    try {
                                      await deleteDoc(doc(db, 'history', item.id));
                                    } catch (error) {
                                      handleFirestoreError(error, OperationType.DELETE, 'history');
                                    }
                                  }}
                                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
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

                      <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 hover:border-primary/50 transition-colors cursor-pointer group relative overflow-hidden">
                        <input 
                          type="file" 
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                        />
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-lg shadow-sm text-primary group-hover:scale-110 transition-transform"><Upload className="w-6 h-6" /></div>
                          <div>
                            <p className="font-bold text-slate-700 mb-1">Upload File Referensi</p>
                            <p className="text-xs text-slate-500">{documentFile ? documentFile.name : 'Format PDF, DOC, atau TXT (Opsional)'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Target Kelas</label>
                        <select 
                          value={grade}
                          onChange={(e) => setGrade(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="7">Kelas 7</option>
                          <option value="8">Kelas 8</option>
                          <option value="9">Kelas 9</option>
                        </select>
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
                      <div className="flex gap-2">
                        <button onClick={exportBankSoalText} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors border border-slate-200" title="Export Text (TXT)"><FileText className="w-5 h-5" /></button>
                        <button onClick={exportBankSoalWord} className="p-2 bg-slate-50 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors border border-slate-200" title="Export Word (DOCX)"><FileText className="w-5 h-5" /></button>
                        <button onClick={exportBankSoalPDF} className="p-2 bg-slate-50 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors border border-slate-200" title="Export PDF"><Download className="w-5 h-5" /></button>
                        <button onClick={exportBankSoalExcel} className="p-2 bg-slate-50 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors border border-slate-200" title="Export Excel (CSV)"><TableIcon className="w-5 h-5" /></button>
                      </div>
                    </div>

                    <div className="space-y-8 mt-8">
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
                  </motion.div>
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
                {/* Tab Switcher for Penilaian */}
                <div className="flex justify-center">
                  <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 flex gap-1">
                    <button 
                      onClick={() => setIsQuizMode(false)}
                      className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${!isQuizMode ? 'bg-primary text-white shadow-md' : 'text-text-light hover:bg-slate-50'}`}
                    >
                      <TableIcon className="w-4 h-4" /> Daftar Nilai
                    </button>
                    <button 
                      onClick={() => setIsQuizMode(true)}
                      className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${isQuizMode ? 'bg-primary text-white shadow-md' : 'text-text-light hover:bg-slate-50'}`}
                    >
                      <Brain className="w-4 h-4" /> Kuis Interaktif
                    </button>
                  </div>
                </div>

                {!isQuizMode ? (
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
                          <p className="text-xs text-text-light mb-4">Generate kuis instan berbasis AI dari topik yang aktif.</p>
                          <button 
                            onClick={generateQuiz}
                            disabled={isGenerating}
                            className="w-full bg-primary text-white py-3 rounded-2xl font-bold shadow-md hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2 disabled:bg-slate-400 disabled:translate-y-0"
                          >
                            {isGenerating ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Proses...</>
                            ) : (
                              <><Wand2 className="w-4 h-4" /> Kuis dari Topik</>
                            )}
                          </button>
                        </div>
                        
                        <div className="pt-6 border-t border-slate-100">
                          <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                            <Upload className="text-primary w-5 h-5" /> Kuis dari File
                          </h3>
                          <p className="text-[11px] text-text-light mb-4">Upload dokumen PDF/Word untuk diekstrak menjadi soal HOTS (C4-C5).</p>
                          
                          <label className="block mb-4">
                            <span className="sr-only">Pilih File Dokumen</span>
                            <input 
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={handleDocumentUploadForQuiz}
                              className="block w-full text-xs text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-xs file:font-semibold
                                file:bg-primary/10 file:text-primary
                                hover:file:bg-primary/20
                                transition-all cursor-pointer"
                            />
                          </label>
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

                        {topic && (
                          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                            <div className="text-lg">📍</div>
                            <div className="text-xs">
                              <p className="font-bold text-text-light uppercase tracking-widest mb-1">Topik Aktif</p>
                              <p className="font-medium text-slate-700">{topic}</p>
                            </div>
                          </div>
                        )}
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
                                <div className="flex items-center gap-2 mb-4">
                                  <span className="text-[10px] text-text-light flex items-center gap-1">
                                    <ClipboardList className="w-3 h-3" /> {quiz.questions.length} Soal
                                  </span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
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
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="max-w-3xl mx-auto"
                    >
                      <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 overflow-hidden relative">
                        {/* Progress bar */}
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
                          <motion.div 
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>

                        <div className="flex justify-between items-center mb-8 pt-2">
                          <button 
                            onClick={() => setQuizView('selection')}
                            className="text-xs font-bold text-text-light hover:text-rose-500 transition-colors flex items-center gap-1"
                          >
                            <X className="w-4 h-4" /> Batal
                          </button>
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 mb-1">
                              <Timer className="w-4 h-4 text-primary" />
                              <span className="text-sm font-black text-slate-800 tracking-tight">Soal {currentQuestionIndex + 1} dari {activeQuiz.questions.length}</span>
                            </div>
                            <div className="flex gap-1">
                              {activeQuiz.questions.map((_, idx) => (
                                <div 
                                  key={idx} 
                                  className={`w-4 h-1 rounded-full transition-all ${idx === currentQuestionIndex ? 'bg-primary w-8' : idx < currentQuestionIndex ? 'bg-emerald-400' : 'bg-slate-100'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="w-16"></div> {/* Spacer to keep center alignment */}
                        </div>

                        <div className="mb-10 text-left">
                          <h3 className="text-2xl font-bold mb-8 leading-tight">
                            {activeQuiz.questions[currentQuestionIndex].question}
                          </h3>

                          {activeQuiz.questions[currentQuestionIndex].type === 'multiple-choice' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {activeQuiz.questions[currentQuestionIndex].options?.map((option, idx) => {
                                const qId = activeQuiz.questions[currentQuestionIndex].id;
                                const isSelected = userAnswers[qId] === option;
                                const feedback = quizFeedback[qId];
                                
                                return (
                                  <button 
                                    key={idx}
                                    disabled={!!feedback}
                                    onClick={() => submitAnswer(option)}
                                    className={`w-full p-6 rounded-2xl text-left font-bold transition-all border flex items-center gap-4 ${
                                      isSelected 
                                        ? feedback 
                                          ? feedback.isCorrect ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-rose-50 border-rose-500 text-rose-700'
                                          : 'bg-primary border-primary text-white shadow-lg'
                                        : feedback && option === activeQuiz.questions[currentQuestionIndex].correctAnswer
                                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                          : 'bg-slate-50 border-slate-100 hover:border-slate-300 text-slate-700'
                                    }`}
                                  >
                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shadow-sm ${isSelected ? 'bg-white/20' : 'bg-white'}`}>
                                      {String.fromCharCode(65 + idx)}
                                    </span>
                                    {option}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <input 
                                type="text"
                                placeholder="Ketik jawaban Anda di sini..."
                                className={`w-full p-6 rounded-2xl font-bold bg-slate-50 border-2 outline-none transition-all ${
                                  quizFeedback[activeQuiz.questions[currentQuestionIndex].id]
                                    ? quizFeedback[activeQuiz.questions[currentQuestionIndex].id].isCorrect
                                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                      : 'border-rose-500 bg-rose-50 text-rose-700'
                                    : 'border-slate-100 focus:border-primary focus:bg-white'
                                }`}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.currentTarget.value) {
                                    submitAnswer(e.currentTarget.value);
                                    e.currentTarget.value = '';
                                  }
                                }}
                              />
                              <p className="text-[10px] text-text-light font-bold uppercase tracking-widest px-1">Tekan Enter untuk Menjawab</p>
                            </div>
                          )}
                        </div>

                        {/* Feedback Section */}
                        <AnimatePresence>
                          {quizFeedback[activeQuiz.questions[currentQuestionIndex].id] && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className={`p-6 rounded-2xl mb-8 border border-slate-100 text-left ${quizFeedback[activeQuiz.questions[currentQuestionIndex].id].isCorrect ? 'bg-emerald-50' : 'bg-rose-50'}`}
                            >
                              <div className="flex items-start gap-4">
                                <div className="text-2xl">
                                  {quizFeedback[activeQuiz.questions[currentQuestionIndex].id].isCorrect ? '✅' : '❌'}
                                </div>
                                <div>
                                  <p className={`font-bold mb-1 ${quizFeedback[activeQuiz.questions[currentQuestionIndex].id].isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    {quizFeedback[activeQuiz.questions[currentQuestionIndex].id].isCorrect ? 'Jawaban Anda Benar!' : `Belum tepat. Jawaban yang benar adalah: ${activeQuiz.questions[currentQuestionIndex].correctAnswer}`}
                                  </p>
                                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                    {quizFeedback[activeQuiz.questions[currentQuestionIndex].id].feedback}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="flex gap-4">
                          <button 
                            disabled={currentQuestionIndex === 0}
                            onClick={prevQuestion}
                            className={`flex-1 py-5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border ${
                              currentQuestionIndex === 0
                                ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <ChevronLeft className="w-5 h-5" /> Sebelumnya
                          </button>
                          <button 
                            disabled={!userAnswers[activeQuiz.questions[currentQuestionIndex].id]}
                            onClick={nextQuestion}
                            className={`flex-[2] py-5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all group ${
                              !userAnswers[activeQuiz.questions[currentQuestionIndex].id]
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-primary text-white shadow-lg shadow-primary/30 hover:scale-[1.01]'
                            }`}
                          >
                            {currentQuestionIndex === activeQuiz.questions.length - 1 ? 'Selesaikan Kuis' : 'Berikutnya'}
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </button>
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

            {activeTab === 'rpp_mendalam' && (
              <motion.div 
                key="rpp_mendalam"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="bg-white p-10 rounded-[32px] shadow-sm border border-slate-100">
                  <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🎯</div>
                    <h2 className="text-2xl font-bold text-text-dark mb-2">RPP Mendalam (BSKAP)</h2>
                    <p className="text-text-light">Susun Rencana Pembelajaran Mendalam dengan integrasi 8 Dimensi Profil Lulusan.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-text-light uppercase tracking-widest mb-2 block ml-1">Kurikulum Utama</label>
                        <select 
                          value={kurikulum}
                          onChange={(e) => setKurikulum(e.target.value)}
                          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium focus:border-primary focus:bg-white transition-all outline-none appearance-none"
                        >
                          <option value="Merdeka">Kurikulum Merdeka (Standar Nasional)</option>
                          <option value="2013">Kurikulum 2013 (Revisi)</option>
                          <option value="Berbasis Cinta">Kurikulum Berbasis Cinta ❤️ (Pendekatan Kasih Sayang)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-text-light uppercase tracking-widest mb-2 block ml-1">Nama Guru</label>
                        <input 
                          type="text" 
                          value={teacherName}
                          onChange={(e) => setTeacherName(e.target.value)}
                          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium focus:border-primary focus:bg-white transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-text-light uppercase tracking-widest mb-2 block ml-1">NIP</label>
                        <input 
                          type="text" 
                          value={nip}
                          onChange={(e) => setNip(e.target.value)}
                          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium focus:border-primary focus:bg-white transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-text-light uppercase tracking-widest mb-2 block ml-1">Satuan Pendidikan</label>
                        <input 
                          type="text" 
                          value={school}
                          onChange={(e) => setSchool(e.target.value)}
                          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium focus:border-primary focus:bg-white transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-text-light uppercase tracking-widest mb-2 block ml-1">Mata Pelajaran</label>
                        <input 
                          type="text" 
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium focus:border-primary focus:bg-white transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-text-light uppercase tracking-widest mb-2 block ml-1">Kelas</label>
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
                        <label className="text-xs font-bold text-text-light uppercase tracking-widest mb-2 block ml-1">Semester</label>
                        <select 
                          value={semester}
                          onChange={(e) => setSemester(e.target.value)}
                          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium focus:border-primary focus:bg-white transition-all outline-none appearance-none"
                        >
                          <option value="Gasal">Gasal</option>
                          <option value="Genap">Genap</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-text-light uppercase tracking-widest mb-2 block ml-1">Jumlah Pertemuan</label>
                        <input 
                          type="text" 
                          value={meetings}
                          onChange={(e) => setMeetings(e.target.value)}
                          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium focus:border-primary focus:bg-white transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-text-light uppercase tracking-widest mb-2 block ml-1">Topik Utama</label>
                        <input 
                          type="text" 
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="Misal: Dampak Revolusi Industri"
                          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium focus:border-primary focus:bg-white transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-text-light uppercase tracking-widest mb-2 block ml-1">Model Pembelajaran</label>
                        <select 
                          value={learningModel}
                          onChange={(e) => setLearningModel(e.target.value)}
                          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium focus:border-primary focus:bg-white transition-all outline-none appearance-none"
                        >
                          <option value="Problem Based Learning (PBL)">Problem Based Learning (PBL)</option>
                          <option value="Project Based Learning (PjBL)">Project Based Learning (PjBL)</option>
                          <option value="Discovery Learning">Discovery Learning</option>
                          <option value="Inquiry Learning">Inquiry Learning</option>
                          <option value="Cooperatif Learning (STAD/Jigsaw)">Cooperatif Learning</option>
                          <option value="Contextual Teaching & Learning (CTL)">Contextual Teaching & Learning</option>
                          <option value="Flipped Classroom">Flipped Classroom</option>
                          <option value="Lainnya">Lainnya...</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-text-light uppercase tracking-widest mb-2 block ml-1">Media Pembelajaran</label>
                      <input 
                        type="text" 
                        value={teachingMedia}
                        onChange={(e) => setTeachingMedia(e.target.value)}
                        placeholder="Misal: LCD, Power Point, Video, Bahan Ajar"
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium focus:border-primary focus:bg-white transition-all outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-text-light uppercase tracking-widest mb-4 block ml-1">8 Dimensi Profil Lulusan (Pilih Sesuai Kebutuhan)</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-6 rounded-[24px] border-2 border-slate-100">
                        {[
                          'Keimanan dan Ketakwaan terhadap Tuhan YME',
                          'Kewargaan',
                          'Penalaran Kritis',
                          'Kreativitas',
                          'Kolaborasi',
                          'Kemandirian',
                          'Kesehatan',
                          'Komunikasi'
                        ].map(d => (
                          <label key={d} className="flex items-center gap-3 cursor-pointer group">
                            <input 
                              type="checkbox"
                              checked={selectedP3.includes(d)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedP3([...selectedP3, d]);
                                else setSelectedP3(selectedP3.filter(item => item !== d));
                              }}
                              className="w-5 h-5 rounded border-2 border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                            />
                            <span className="text-sm font-medium text-text-dark group-hover:text-rose-600 transition-colors uppercase tracking-tight text-[11px] font-bold">{d}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={generateRPPMendalamAction}
                      disabled={isGenerating || !topic}
                      className="w-full bg-rose-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg transition-all"
                    >
                      {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                      Generate RPP Mendalam
                    </button>
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
                    <input 
                      type="text" 
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Contoh: Interaksi Antarruang di ASEAN, Masa Praaksara..."
                      className="w-full p-6 pr-40 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg font-medium focus:border-primary focus:bg-white transition-all outline-none"
                      onKeyDown={(e) => e.key === 'Enter' && generateRPP()}
                    />
                    <button 
                      onClick={generateRPP}
                      disabled={isGenerating || !topic}
                      className="absolute right-3 top-3 bottom-3 px-8 bg-primary text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-lg"
                    >
                      {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      Generate
                    </button>
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
                  <div className="bg-primary/5 p-8 rounded-3xl flex items-center gap-6 border border-primary/10 animate-pulse">
                    <div className="bg-primary p-3 rounded-xl">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                    <div>
                      <p className="text-primary font-bold">Proses Berlangsung...</p>
                      <p className="text-primary/70 text-sm italic">AI sedang menyusun diksi pedagogis terbaik untuk Pak Catur.</p>
                    </div>
                  </div>
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
                    <h2 className="text-2xl font-bold">Modul Preview</h2>
                    <p className="text-sm text-text-light">Topik: <span className="text-primary font-bold uppercase">{topic || 'No Topic'}</span></p>
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

        <Footer />
      </main>
    </div>
  );
}
