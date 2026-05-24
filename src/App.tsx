import React, { useState, useEffect, useRef } from "react";
import {
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
  Video,
  Link,
  Sparkles,
  Loader2,
  CheckCircle2,
  Check,
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
  TableProperties,
  FolderPlus,
  ChevronLeft,
  SortAsc,
  WifiOff,
  Zap,
  Award,
  Target,
  CloudOff,
  Cloud,
  FileJson,
  UploadCloud,
  Eye,
  XCircle,
  Tag,
  Filter,
  Layers,
  Edit2,
  LayoutGrid,
  List,
  Folder,
  Info,
  Bookmark,
  BookmarkPlus,
  BookmarkX,
  ListX,
  BrainCircuit,
  Bell,
  Clock,
  Calendar,
  MoreHorizontal,
  Sliders,
  Lock,
  Unlock,
  Database,
  ShieldCheck,
  Printer
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  HeadingLevel,
  VerticalAlign,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
} from "docx";
import { saveAs } from "file-saver";
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
  Cell,
} from "recharts";
import { initAuth, googleSignIn, getAccessToken, logout, handleFirestoreError, OperationType } from "./lib/firebase";
import {
  uploadToDrive,
  listDriveFiles,
  deleteDriveFile,
  createDriveFolder,
  getDriveFileBlob,
} from "./services/driveService";
import {
  saveFileOffline,
  removeFileOffline,
  getOfflineFile,
  listOfflineFiles,
} from "./services/offlineService";
import { User } from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  writeBatch
} from "firebase/firestore";
import { db } from "./lib/firebase";

// --- TYPES ---
type Tab =
  | "beranda"
  | "chatbot"
  | "lkpd"
  | "rpp"
  | "silabus"
  | "bank_soal"
  | "penilaian"
  | "jurnal"
  | "materi"
  | "pengaturan";

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

const formatFileSize = (bytes?: string) => {
  if (!bytes) return "Ukuran tidak diketahui";
  const n = parseInt(bytes);
  if (isNaN(n)) return "Ukuran tidak diketahui";
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + " MB";
  return (n / (1024 * 1024 * 1024)).toFixed(1) + " GB";
};

const formatToBulletList = (text: string): string => {
  if (!text) return "";
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length === 0) return "";
  
  const formattedLines = lines.map(line => {
    const listRegex = /^([•\-*+]|\d+[\.)])\s+/i;
    if (listRegex.test(line)) {
      return line;
    }
    return `- ${line}`;
  });
  
  return formattedLines.join("\n");
};

const getNodeText = (node: any): string => {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (node.value) return node.value;
  if (Array.isArray(node)) return node.map(getNodeText).join(" ");
  if (node.children) return node.children.map(getNodeText).join(" ");
  if (node.props && node.props.children) {
    if (Array.isArray(node.props.children))
      return node.props.children.map(getNodeText).join(" ");
    return getNodeText(node.props.children);
  }
  return "";
};

const RPPItemThemeSelector = ({
  selectedTheme,
  onChange,
  isDarkMode,
}: {
  selectedTheme: string;
  onChange: (theme: any) => void;
  isDarkMode: boolean;
}) => {
  const options = [
    { id: "match", label: "Match", hex: "transparent" },
    { id: "blue", label: "Blue", hex: "#3b82f6" },
    { id: "emerald", label: "Emerald", hex: "#10b981" },
    { id: "indigo", label: "Indigo", hex: "#6366f1" },
    { id: "amber", label: "Amber", hex: "#f59e0b" },
    { id: "rose", label: "Rose", hex: "#f43f5e" },
    { id: "teal", label: "Teal", hex: "#14b8a6" },
  ];

  return (
    <div className="flex items-center gap-1.5 mt-2 pl-12 py-1">
      <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mr-1">
        Tema:
      </span>
      <div className="flex gap-1.5 flex-wrap">
        {options.map((opt) => {
          const isSelected = selectedTheme === opt.id;
          if (opt.id === "match") {
            return (
              <button
                key={opt.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onChange("match");
                }}
                className={`w-4 h-4 rounded-full border text-[7px] font-black transition-all flex items-center justify-center ${
                  isSelected
                    ? "border-slate-850 dark:border-white scale-110 font-bold bg-slate-100 dark:bg-slate-800 ring-2 ring-blue-500/55"
                    : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400"
                } ${isDarkMode ? "text-white" : "text-slate-700"}`}
                title="Sama dengan tema utama RPP"
              >
                M
              </button>
            );
          }
          return (
            <button
              key={opt.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onChange(opt.id);
              }}
              className={`w-4 h-4 rounded-full border transition-all flex items-center justify-center relative ${
                isSelected
                  ? "border-slate-850 dark:border-white scale-110 ring-2 ring-slate-400"
                  : "border-transparent hover:scale-110"
              }`}
              style={{ backgroundColor: opt.hex }}
              title={opt.label}
            >
              {isSelected && <div className="w-1 h-1 bg-white rounded-full" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const getFileTypeName = (file: any) => {
  if (file.mimeType === "application/vnd.google-apps.folder") return "Folder";
  const mime = (file.mimeType || "").toLowerCase();
  const name = (file.name || "").toLowerCase();

  if (mime.includes("pdf") || name.endsWith(".pdf")) return "PDF";
  if (
    mime.includes("word") ||
    mime.includes("officedocument.wordprocessingml") ||
    name.endsWith(".docx") ||
    name.endsWith(".doc")
  )
    return "DOCX";
  if (
    mime.includes("excel") ||
    mime.includes("officedocument.spreadsheetml") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".xls")
  )
    return "Spreadsheet";
  if (
    mime.includes("presentation") ||
    mime.includes("officedocument.presentationml") ||
    name.endsWith(".pptx") ||
    name.endsWith(".ppt")
  )
    return "Slide";
  if (
    mime.includes("image/") ||
    ["png", "jpg", "jpeg", "gif", "webp", "svg"].some((ext) =>
      name.endsWith("." + ext),
    )
  )
    return "Gambar";
  return "Dokumen";
};

interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: Date;
}

// --- APP COMPONENT ---
export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("rpp");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLkpdConfigOpen, setIsLkpdConfigOpen] = useState(false);
  const [isRppConfigOpen, setIsRppConfigOpen] = useState(false);
  const [isSilabusConfigOpen, setIsSilabusConfigOpen] = useState(false);
  const [isBankSoalConfigOpen, setIsBankSoalConfigOpen] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "loading" | null;
    message: string;
  }>({ type: null, message: "" });
  const [isLoadingApp, setIsLoadingApp] = useState(true);
  const [randomQuote, setRandomQuote] = useState("");

  const maestroAI = async (params: {
    prompt?: string;
    contents?: any;
    systemInstruction?: string;
    temperature?: number;
    retries?: number;
    delay?: number;
  }): Promise<string> => {
    const {
      prompt,
      contents,
      systemInstruction,
      temperature = 0.7,
      retries = 3,
      delay = 3000,
    } = params;

    try {
      const response = await fetch("/api/generate-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          contents,
          systemInstruction,
          temperature,
        }),
      });

      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");

      if (!response.ok) {
        // Jika status rintangan adalah 403, kemungkinan besar Kunci API Gemini bocor atau dinonaktifkan
        if (response.status === 403) {
          throw new Error(
            "Kunci API (API Key) Gemini Anda dilaporkan bocor atau dinonaktifkan oleh Google. Harap ganti/perbarui Kunci API Anda dengan yang baru melalui panel Settings (Setelan) -> Secrets di pojok bawah Google AI Studio."
          );
        }

        // Retry logic for 500 (Internal Error), 503 (High Demand) and 429 (Rate Limit)
        const shouldRetry = [500, 502, 503, 504, 429].includes(response.status);

        if (shouldRetry && retries > 0) {
          const statusMsg =
            response.status === 429
              ? "Batas penggunaan tercapai. Menunggu sejenak..."
              : `Maestro sedang sibuk (${response.status}). Mencoba kembali...`;

          setStatus({ type: "loading", message: statusMsg });
          await new Promise((resolve) => setTimeout(resolve, delay));
          return maestroAI({
            ...params,
            retries: retries - 1,
            delay: delay * 1.5,
          });
        }

        // If it's HTML, it's likely a proxy error
        if (!isJson) {
          throw new Error(
            `Kesalahan Server (${response.status}). Silakan muat ulang halaman.`,
          );
        }

        const data = await response.json();
        const errorMsg =
          data?.error ||
          `Kesalahan Sistem (${response.status}). Silakan coba sesaat lagi.`;
        throw new Error(errorMsg);
      }

      if (!isJson) {
        throw new Error("Respon server tidak valid (bukan JSON).");
      }

      const data = await response.json();
      if (!data || !data.text) {
        throw new Error(
          "Maestro tidak memberikan respon teks. Silakan coba sesaat lagi.",
        );
      }

      return data.text;
    } catch (err: any) {
      if (
        err.name === "TypeError" &&
        err.message === "Failed to fetch" &&
        retries > 0
      ) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return maestroAI({
          ...params,
          retries: retries - 1,
          delay: delay * 1.5,
        });
      }
      console.error("Maestro AI Error:", err);
      throw err;
    }
  };

  const quotes = [
    "Guru adalah pilar peradaban. Tetaplah menginspirasi.",
    "Pendidikan adalah senjata paling ampuh untuk mengubah dunia. - Nelson Mandela",
    "Sebaik-baiknya guru adalah yang memberi teladan.",
    "Kesabaran adalah kunci dalam mendidik putra-putri bangsa.",
    "Teknologi hanya alat, dalam hal memotivasi anak-anak, guru adalah yang paling penting. - Bill Gates",
    "Jadilah guru yang dirindukan kehadirannya oleh setiap murid.",
    "Setiap anak adalah bintang, dan guru adalah langit yang membiarkan mereka bersinar.",
    "Mengajar adalah belajar dua kali.",
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
      id: "welcome",
      role: "model",
      content:
        "Halo Bapak/Ibu Guru! Saya **IPS Maestro Chatbot**. Ada yang bisa saya bantu terkait materi IPS, strategi mengajar, atau LKPD hari ini?",
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("ips-maestro-dark-mode");
    return saved ? JSON.parse(saved) : false;
  });
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem("ips-maestro-accent-color") || "indigo";
  });
  const [activeFont, setActiveFont] = useState(() => {
    return localStorage.getItem("ips-maestro-active-font") || "font-inter";
  });

  const [aiTemperature, setAiTemperature] = useState(() => {
    const saved = localStorage.getItem("ips-maestro-ai-temp");
    return saved ? parseFloat(saved) : 0.7;
  });

  const [aiChatSystemPrompt, setAiChatSystemPrompt] = useState(() => {
    return (
      localStorage.getItem("ips-maestro-ai-system-prompt") ||
      "Anda adalah IPS Maestro Chatbot, asisten kecerdasan buatan paling cerdas dan inspiratif bagi para pendidik Ilmu Pengetahuan Sosial (IPS) tingkat SMP di seluruh Indonesia.\n\n**Identitas & Persona:**\n- Anda adalah refleksi dari seorang Guru Maestro: ahli, bijak, hangat, dan selalu memberikan solusi pedagogis yang inovatif.\n- Anda memiliki pemahaman mendalam tentang Kurikulum Merdeka, Standar Isi SMP, dan kearifan lokal Indonesia.\n- Gaya komunikasi Anda: Profesional namun ramah, inspiratif, menggunakan Bahasa Indonesia yang baku namun tetap luwes (tidak kaku).\n\n**Tugas Utama:**\n1. **Pendamping Perencanaan:** Membantu guru menyusun rancangan pembelajaran (RPP/Modul Ajar), menentukan metode pengajaran (PBL, Discovery Learning, dll.), dan menyusun strategi penilaian.\n2. **Narasumber Materi:** Memberikan penjelasan materi geografi, sejarah, ekonomi, dan sosiologi dengan akurasi tinggi dan relevansi yang kuat dengan fenomena terkini di Indonesia.\n3. **Penyedia Ide Kreatif:** Memberikan ide aktivitas belajar yang aktif, interaktif, dan berpusat pada siswa (student-centered).\n4. **Instruktur HOTS:** Selalu mendorong penulisan soal dan aktivitas yang melatih Higher Order Thinking Skills.\n\n**Prinsip Jawaban:**\n- **Konteks Indonesia:** Selalu hubungkan jawaban dengan contoh nyata di Indonesia (misal: ekonomi pasar tradisional, sejarah kemerdekaan nasional, geografi kepulauan).\n- **Struktur Markdown:** Gunakan heading, bullet points, dan blok kode agar jawaban sangat mudah dibaca.\n- **Pedagogis:** Jika guru bertanya tentang masalah di kelas, berikan saran yang didukung teori pendidikan namun praktis.\n- **Interaktif:** Akhiri jawaban dengan pertanyaan pemantik atau saran langkah selanjutnya."
    );
  });

  useEffect(() => {
    localStorage.setItem("ips-maestro-ai-temp", aiTemperature.toString());
  }, [aiTemperature]);

  useEffect(() => {
    localStorage.setItem("ips-maestro-ai-system-prompt", aiChatSystemPrompt);
  }, [aiChatSystemPrompt]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("ips-maestro-dark-mode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem("ips-maestro-accent-color", accentColor);
  }, [accentColor]);

  useEffect(() => {
    localStorage.setItem("ips-maestro-active-font", activeFont);
  }, [activeFont]);

  // LKPD State
  const [lkpdTopic, setLkpdTopic] = useState("");
  const [lkpdGrade, setLkpdGrade] = useState("VII");
  const [lkpdType, setLkpdType] = useState("Literasi & Analisis");
  const [lkpdResult, setLkpdResult] = useState<string | null>(null);
  const [lkpdExportFormat, setLkpdExportFormat] = useState<"pdf" | "docx">(
    "pdf",
  );
  const [isGeneratingLkpd, setIsGeneratingLkpd] = useState(false);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);

  // RPP State
  const [rppTopic, setRppTopic] = useState("");
  const [rppGrade, setRppGrade] = useState("VII");
  const [rppResult, setRppResult] = useState<string | null>(null);
  const [rppExportFormat, setRppExportFormat] = useState<"pdf" | "docx">("pdf");
  const [isGeneratingRpp, setIsGeneratingRpp] = useState(false);
  const [isUploadingRppToDrive, setIsUploadingRppToDrive] = useState(false);
  const [savedRpps, setSavedRpps] = useState<any[]>(() => {
    const saved = localStorage.getItem("ips-maestro-saved-rpps");
    return saved ? JSON.parse(saved) : [];
  });
  const [rppMode, setRppMode] = useState<"generate" | "saved">("generate");
  const [selectedRppsForPrint, setSelectedRppsForPrint] = useState<string[]>([]);
  const [selectedBanksForPrint, setSelectedBanksForPrint] = useState<string[]>([]);
  const [rppIncludeVideo, setRppIncludeVideo] = useState(true);
  const [rppIncludeQuiz, setRppIncludeQuiz] = useState(true);
  const [rppIncludeLinks, setRppIncludeLinks] = useState(true);

  // Silabus State
  const [silabusTopic, setSilabusTopic] = useState("");
  const [silabusGrade, setSilabusGrade] = useState("VII");
  const [silabusObjectives, setSilabusObjectives] = useState("");
  const [silabusResult, setSilabusResult] = useState<string | null>(null);
  const [silabusExportFormat, setSilabusExportFormat] = useState<
    "pdf" | "docx"
  >("pdf");
  const [isGeneratingSilabus, setIsGeneratingSilabus] = useState(false);
  const [isUploadingSilabusToDrive, setIsUploadingSilabusToDrive] =
    useState(false);

  // Bank Soal State
  const [bankSoalTopic, setBankSoalTopic] = useState("");
  const [bankSoalGrade, setBankSoalGrade] = useState("VII");
  const [bankSoalCount, setBankSoalCount] = useState(5);
  const [bankSoalDifficulty, setBankSoalDifficulty] = useState<
    "mudah" | "sedang" | "sukar"
  >("sedang");
  const [bankSoalOptionCount, setBankSoalOptionCount] = useState(4);
  const [bankSoalResult, setBankSoalResult] = useState<any>(null);
  const [isGeneratingBankSoal, setIsGeneratingBankSoal] = useState(false);
  const [isUploadingBankSoalToDrive, setIsUploadingBankSoalToDrive] =
    useState(false);
  const [bankSoalFile, setBankSoalFile] = useState<File | null>(null);
  const [bankSoalFileText, setBankSoalFileText] = useState("");
  const [isExtractingBankSoalFile, setIsExtractingBankSoalFile] =
    useState(false);
  const [bankSoalQuestions, setBankSoalQuestions] = useState<any[]>([]);
  const [bankSoalKisiKisi, setBankSoalKisiKisi] = useState<any[]>([]);
  const [bankSoalSearchFilter, setBankSoalSearchFilter] = useState("");
  const [bankSoalTopicFilter, setBankSoalTopicFilter] = useState("all");
  const [bankSoalTagFilter, setBankSoalTagFilter] = useState("all");
  const [bankSoalLevelFilter, setBankSoalLevelFilter] = useState("all");
  const [bankSoalView, setBankSoalView] = useState<
    "questions" | "kisi-kisi" | "kunci"
  >("questions");
  const [bankSoalQuestionLayout, setBankSoalQuestionLayout] = useState<
    "card" | "table"
  >("card");
  const [bankSoalSavedLayout, setBankSoalSavedLayout] = useState<
    "card" | "table"
  >(() => {
    return (
      (localStorage.getItem("ips-maestro-bank-soal-layout") as
        | "card"
        | "table") || "table"
    );
  });
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<
    number | null
  >(null);
  const [editingQuestionData, setEditingQuestionData] = useState<any>(null);
  const [savedQuestionBanks, setSavedQuestionBanks] = useState<any[]>(() => {
    const saved = localStorage.getItem("ips-maestro-saved-banks");
    return saved ? JSON.parse(saved) : [];
  });
  const [bankSoalMode, setBankSoalMode] = useState<
    "generate" | "result" | "saved"
  >("generate");
  const [bankSoalAllowedTypes, setBankSoalAllowedTypes] = useState<string[]>([
    "pilihan_ganda",
    "pilihan_ganda_kompleks",
    "menjodohkan",
    "mengurutkan",
    "benar_salah",
  ]);

  // Personalization settings for each module type
  const [lkpdTheme, setLkpdTheme] = useState<
    "blue" | "emerald" | "amber" | "rose" | "indigo" | "teal"
  >(() => {
    return (localStorage.getItem("ips-maestro-lkpd-theme") as any) || "emerald";
  });
  const [lkpdFont, setLkpdFont] = useState<
    "font-inter" | "font-outfit" | "font-space" | "font-playfair"
  >(() => {
    return (
      (localStorage.getItem("ips-maestro-lkpd-font") as any) || "font-inter"
    );
  });
  const [lkpdLayout, setLkpdLayout] = useState<
    "classic" | "modern" | "minimalist"
  >(() => {
    return (localStorage.getItem("ips-maestro-lkpd-layout") as any) || "modern";
  });

  const [rppTheme, setRppTheme] = useState<
    "blue" | "emerald" | "amber" | "rose" | "indigo" | "teal"
  >(() => {
    return (localStorage.getItem("ips-maestro-rpp-theme") as any) || "blue";
  });
  const [rppFont, setRppFont] = useState<
    "font-inter" | "font-outfit" | "font-space" | "font-playfair"
  >(() => {
    return (
      (localStorage.getItem("ips-maestro-rpp-font") as any) || "font-inter"
    );
  });
  const [rppLayout, setRppLayout] = useState<
    "classic" | "modern" | "minimalist"
  >(() => {
    return (localStorage.getItem("ips-maestro-rpp-layout") as any) || "modern";
  });

  const [rppVideoTheme, setRppVideoTheme] = useState<
    "blue" | "emerald" | "amber" | "rose" | "indigo" | "teal" | "match"
  >(() => {
    return (
      (localStorage.getItem("ips-maestro-rpp-video-theme") as any) || "match"
    );
  });
  const [rppQuizTheme, setRppQuizTheme] = useState<
    "blue" | "emerald" | "amber" | "rose" | "indigo" | "teal" | "match"
  >(() => {
    return (
      (localStorage.getItem("ips-maestro-rpp-quiz-theme") as any) || "match"
    );
  });
  const [rppLinksTheme, setRppLinksTheme] = useState<
    "blue" | "emerald" | "amber" | "rose" | "indigo" | "teal" | "match"
  >(() => {
    return (
      (localStorage.getItem("ips-maestro-rpp-links-theme") as any) || "match"
    );
  });

  const [silabusTheme, setSilabusTheme] = useState<
    "blue" | "emerald" | "amber" | "rose" | "indigo" | "teal"
  >(() => {
    return (localStorage.getItem("ips-maestro-silabus-theme") as any) || "teal";
  });
  const [silabusFont, setSilabusFont] = useState<
    "font-inter" | "font-outfit" | "font-space" | "font-playfair"
  >(() => {
    return (
      (localStorage.getItem("ips-maestro-silabus-font") as any) || "font-inter"
    );
  });
  const [silabusLayout, setSilabusLayout] = useState<
    "classic" | "modern" | "minimalist"
  >(() => {
    return (
      (localStorage.getItem("ips-maestro-silabus-layout") as any) || "modern"
    );
  });

  const [bankSoalTheme, setBankSoalTheme] = useState<
    "blue" | "emerald" | "amber" | "rose" | "indigo" | "teal"
  >(() => {
    return (
      (localStorage.getItem("ips-maestro-banksoal-theme") as any) || "indigo"
    );
  });
  const [bankSoalFont, setBankSoalFont] = useState<
    "font-inter" | "font-outfit" | "font-space" | "font-playfair"
  >(() => {
    return (
      (localStorage.getItem("ips-maestro-banksoal-font") as any) || "font-inter"
    );
  });
  const [bankSoalLayoutSetting, setBankSoalLayoutSetting] = useState<
    "classic" | "modern" | "minimalist"
  >(() => {
    return (
      (localStorage.getItem("ips-maestro-banksoal-layout") as any) || "modern"
    );
  });

  const [isLkpdStylistOpen, setIsLkpdStylistOpen] = useState(false);
  const [isRppStylistOpen, setIsRppStylistOpen] = useState(false);
  const [isSilabusStylistOpen, setIsSilabusStylistOpen] = useState(false);
  const [isBankSoalStylistOpen, setIsBankSoalStylistOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("ips-maestro-lkpd-theme", lkpdTheme);
  }, [lkpdTheme]);
  useEffect(() => {
    localStorage.setItem("ips-maestro-lkpd-font", lkpdFont);
  }, [lkpdFont]);
  useEffect(() => {
    localStorage.setItem("ips-maestro-lkpd-layout", lkpdLayout);
  }, [lkpdLayout]);

  useEffect(() => {
    localStorage.setItem("ips-maestro-rpp-theme", rppTheme);
  }, [rppTheme]);
  useEffect(() => {
    localStorage.setItem("ips-maestro-rpp-font", rppFont);
  }, [rppFont]);
  useEffect(() => {
    localStorage.setItem("ips-maestro-rpp-layout", rppLayout);
  }, [rppLayout]);
  useEffect(() => {
    localStorage.setItem("ips-maestro-rpp-video-theme", rppVideoTheme);
  }, [rppVideoTheme]);
  useEffect(() => {
    localStorage.setItem("ips-maestro-rpp-quiz-theme", rppQuizTheme);
  }, [rppQuizTheme]);
  useEffect(() => {
    localStorage.setItem("ips-maestro-rpp-links-theme", rppLinksTheme);
  }, [rppLinksTheme]);

  useEffect(() => {
    localStorage.setItem("ips-maestro-silabus-theme", silabusTheme);
  }, [silabusTheme]);
  useEffect(() => {
    localStorage.setItem("ips-maestro-silabus-font", silabusFont);
  }, [silabusFont]);
  useEffect(() => {
    localStorage.setItem("ips-maestro-silabus-layout", silabusLayout);
  }, [silabusLayout]);

  useEffect(() => {
    localStorage.setItem("ips-maestro-banksoal-theme", bankSoalTheme);
  }, [bankSoalTheme]);
  useEffect(() => {
    localStorage.setItem("ips-maestro-banksoal-font", bankSoalFont);
  }, [bankSoalFont]);
  useEffect(() => {
    localStorage.setItem("ips-maestro-banksoal-layout", bankSoalLayoutSetting);
  }, [bankSoalLayoutSetting]);

  const getModuleThemeClasses = (themeId: string) => {
    const themes: Record<
      string,
      {
        primary: string;
        primaryText: string;
        gradient: string;
        bgLight: string;
        textStrong: string;
        border: string;
        fill: string;
        badge: string;
      }
    > = {
      emerald: {
        primary: "emerald-500",
        primaryText: "text-emerald-500",
        gradient: "from-emerald-500 to-teal-500",
        bgLight: "bg-emerald-50 dark:bg-emerald-950/20",
        textStrong: "text-emerald-700 dark:text-emerald-400",
        border: "border-emerald-500",
        fill: "bg-emerald-500",
        badge:
          "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
      },
      blue: {
        primary: "blue-500",
        primaryText: "text-blue-500",
        gradient: "from-blue-600 to-indigo-700",
        bgLight: "bg-blue-50 dark:bg-blue-950/20",
        textStrong: "text-blue-700 dark:text-blue-400",
        border: "border-blue-500",
        fill: "bg-blue-500",
        badge:
          "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800",
      },
      indigo: {
        primary: "indigo-500",
        primaryText: "text-indigo-500",
        gradient: "from-indigo-600 to-violet-700",
        bgLight: "bg-indigo-50 dark:bg-indigo-950/20",
        textStrong: "text-indigo-700 dark:text-indigo-400",
        border: "border-indigo-500",
        fill: "bg-indigo-500",
        badge:
          "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800",
      },
      amber: {
        primary: "amber-500",
        primaryText: "text-amber-500",
        gradient: "from-amber-500 to-orange-600",
        bgLight: "bg-amber-50 dark:bg-amber-950/20",
        textStrong: "text-amber-700 dark:text-amber-400",
        border: "border-amber-500",
        fill: "bg-amber-500",
        badge:
          "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800",
      },
      rose: {
        primary: "rose-500",
        primaryText: "text-rose-500",
        gradient: "from-rose-500 to-pink-600",
        bgLight: "bg-rose-50 dark:bg-rose-950/20",
        textStrong: "text-rose-700 dark:text-rose-400",
        border: "border-rose-500",
        fill: "bg-rose-500",
        badge:
          "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800",
      },
      teal: {
        primary: "teal-500",
        primaryText: "text-teal-500",
        gradient: "from-teal-500 to-cyan-600",
        bgLight: "bg-teal-50 dark:bg-teal-950/20",
        textStrong: "text-teal-700 dark:text-teal-400",
        border: "border-teal-500",
        fill: "bg-teal-500",
        badge:
          "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-800",
      },
    };
    return themes[themeId] || themes.blue;
  };

  // Reminder State
  const [reminderEnabled, setReminderEnabled] = useState(() => {
    const saved = localStorage.getItem("ips-maestro-reminder-enabled");
    return saved ? JSON.parse(saved) : false;
  });
  const [reminderType, setReminderType] = useState(() => {
    return localStorage.getItem("ips-maestro-reminder-type") || "daily";
  });
  const [reminderDay, setReminderDay] = useState(() => {
    const saved = localStorage.getItem("ips-maestro-reminder-day");
    return saved ? parseInt(saved) : 1; // Monday default
  });
  const [reminderTime, setReminderTime] = useState(() => {
    return localStorage.getItem("ips-maestro-reminder-time") || "16:00";
  });

  useEffect(() => {
    localStorage.setItem(
      "ips-maestro-reminder-enabled",
      JSON.stringify(reminderEnabled),
    );
    localStorage.setItem("ips-maestro-reminder-type", reminderType);
    localStorage.setItem("ips-maestro-reminder-day", reminderDay.toString());
    localStorage.setItem("ips-maestro-reminder-time", reminderTime);
  }, [reminderEnabled, reminderType, reminderDay, reminderTime]);

  // Check for reminders
  useEffect(() => {
    if (!reminderEnabled) return;

    const checkReminder = () => {
      const now = new Date();
      const currentDay = now.getDay();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();

      const [remHours, remMinutes] = reminderTime.split(":").map(Number);

      if (currentHours === remHours && currentMinutes === remMinutes) {
        if (reminderType === "daily") {
          const lastNotified = localStorage.getItem(
            "ips-maestro-last-reminder",
          );
          const todayStr = now.toDateString();
          if (lastNotified !== todayStr) {
            setStatus({
              type: "success",
              message: "🔔 Waktunya memperbarui Jurnal Guru Anda!",
            });
            localStorage.setItem("ips-maestro-last-reminder", todayStr);
            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification("IPS Maestro Reminder", {
                body: "Sudahkah Anda mengisi jurnal hari ini?",
                icon: "/logo.png",
              });
            }
          }
        } else if (reminderType === "weekly" && currentDay === reminderDay) {
          const lastNotified = localStorage.getItem(
            "ips-maestro-last-reminder",
          );
          const todayStr = now.toDateString();
          if (lastNotified !== todayStr) {
            setStatus({
              type: "success",
              message: "🔔 Pengingat Mingguan: Jangan lupa isi Jurnal Guru!",
            });
            localStorage.setItem("ips-maestro-last-reminder", todayStr);
            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification("IPS Maestro Weekly Reminder", {
                body: "Waktunya merekap jurnal mingguan Anda.",
                icon: "/logo.png",
              });
            }
          }
        }
      }
    };

    const interval = setInterval(checkReminder, 60000);
    return () => clearInterval(interval);
  }, [reminderEnabled, reminderType, reminderDay, reminderTime]);

  const getNextReminderText = () => {
    if (!reminderEnabled) return "Pengingat dinonaktifkan";
    const dayNames = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    if (reminderType === "daily") {
      return `Setiap hari pada pukul ${reminderTime}`;
    }
    return `Setiap hari ${dayNames[reminderDay]} pada pukul ${reminderTime}`;
  };

  const handleTestNotification = () => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("IPS Maestro", {
          body: "Tes notifikasi berhasil! Pengingat Anda aktif.",
          icon: "/logo.png",
        });
        setStatus({ type: "success", message: "Tes notifikasi terkirim!" });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") handleTestNotification();
        });
      } else {
        setStatus({
          type: "error",
          message: "Izin notifikasi diblokir oleh browser.",
        });
      }
    } else {
      setStatus({
        type: "success",
        message: "🔔 Tes: Waktunya mengisi jurnal!",
      });
    }
  };

  useEffect(() => {
    localStorage.setItem(
      "ips-maestro-saved-banks",
      JSON.stringify(savedQuestionBanks),
    );
  }, [savedQuestionBanks]);

  useEffect(() => {
    localStorage.setItem(
      "ips-maestro-saved-rpps",
      JSON.stringify(savedRpps),
    );
  }, [savedRpps]);

  useEffect(() => {
    localStorage.setItem("ips-maestro-bank-soal-layout", bankSoalSavedLayout);
  }, [bankSoalSavedLayout]);

  // Sync markdown result when questions change
  useEffect(() => {
    if (bankSoalQuestions.length > 0) {
      setBankSoalResult(qToMarkdown(bankSoalQuestions));
    } else {
      setBankSoalResult("");
    }
  }, [bankSoalQuestions]);

  const handleDeleteQuestion = (index: number) => {
    if (confirm("Hapus soal ini dari daftar?")) {
      const newQuestions = [...bankSoalQuestions];
      newQuestions.splice(index, 1);
      setBankSoalQuestions(newQuestions);
      setStatus({ type: "success", message: "Soal berhasil dihapus." });
    }
  };

  const handleSaveBankSoal = (title: string) => {
    if (bankSoalQuestions.length === 0) return;

    const newBank = {
      id: Math.random().toString(36).substring(7),
      title:
        title ||
        bankSoalTopic ||
        `Bank Soal ${new Date().toLocaleDateString()}`,
      topic: bankSoalTopic,
      grade: bankSoalGrade,
      questions: bankSoalQuestions,
      createdAt: new Date().toISOString(),
    };

    setSavedQuestionBanks([newBank, ...savedQuestionBanks]);
    setStatus({
      type: "success",
      message: "Bank Soal berhasil disimpan ke koleksi!",
    });
  };

  const handleLoadBankSoal = (bank: any) => {
    setBankSoalQuestions(bank.questions);
    setBankSoalTopic(bank.topic);
    setBankSoalGrade(bank.grade);
    setBankSoalMode("result");
    setStatus({ type: "success", message: `Berhasil memuat: ${bank.title}` });
  };

  const handleDeleteSavedBank = (id: string) => {
    if (confirm("Hapus koleksi ini secara permanen?")) {
      setSavedQuestionBanks(savedQuestionBanks.filter((b) => b.id !== id));
      setStatus({ type: "success", message: "Koleksi berhasil dihapus." });
    }
  };

  const handleStartEdit = (index: number) => {
    setEditingQuestionIndex(index);
    setEditingQuestionData({ ...bankSoalQuestions[index] });
  };

  const handleSaveEdit = () => {
    if (editingQuestionIndex !== null && editingQuestionData) {
      // Validasi Butir Soal
      if (
        !editingQuestionData.question ||
        editingQuestionData.question.trim().length < 10
      ) {
        setStatus({
          type: "error",
          message: "Butir soal minimal 10 karakter.",
        });
        return;
      }

      // Validasi Pembahasan
      if (
        !editingQuestionData.explanation ||
        editingQuestionData.explanation.trim().length < 10
      ) {
        setStatus({
          type: "error",
          message: "Pembahasan minimal 10 karakter.",
        });
        return;
      }

      // Validasi Opsi Jawaban
      const options = editingQuestionData.options;
      const invalidOptions = ["A", "B", "C", "D"].filter(
        (key) => !options[key] || options[key].trim() === "",
      );

      if (invalidOptions.length > 0) {
        setStatus({
          type: "error",
          message: `Opsi jawaban ${invalidOptions.join(", ")} tidak boleh kosong.`,
        });
        return;
      }

      const newQuestions = [...bankSoalQuestions];
      newQuestions[editingQuestionIndex] = editingQuestionData;
      setBankSoalQuestions(newQuestions);
      setEditingQuestionIndex(null);
      setEditingQuestionData(null);
      setStatus({ type: "success", message: "Soal berhasil diperbarui." });
    }
  };

  // Penilaian State
  const [assessmentTitle, setAssessmentTitle] = useState(
    "Ulangan Harian: Interaksi Sosial",
  );
  const [studentScores, setStudentScores] = useState<{ id?: string; name: string; score: number; timestamp?: number; userId?: string }[]>(() => {
    const saved = localStorage.getItem("ips-maestro-student-scores");
    if (saved) return JSON.parse(saved);
    return [
      { name: "Andi", score: 85 },
      { name: "Budi", score: 72 },
      { name: "Citra", score: 90 },
      { name: "Dedi", score: 65 },
      { name: "Eka", score: 88 },
      { name: "Fani", score: 78 },
      { name: "Gita", score: 92 },
      { name: "Hani", score: 81 },
    ];
  });

  useEffect(() => {
    localStorage.setItem("ips-maestro-student-scores", JSON.stringify(studentScores));
  }, [studentScores]);

  // Backup / Restore States
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [backupPasscode, setBackupPasscode] = useState("");
  const [restorePasscode, setRestorePasscode] = useState("");
  const [restoreFileContent, setRestoreFileContent] = useState("");
  const [restoreFileName, setRestoreFileName] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentScore, setNewStudentScore] = useState("");
  const [scoreTrends, setScoreTrends] = useState([
    { period: "UH-1", avg: 72, target: 75 },
    { period: "UH-2", avg: 78, target: 75 },
    { period: "UTS", avg: 74, target: 75 },
    { period: "UH-3", avg: 82, target: 75 },
    { period: "UAS", avg: 85, target: 75 },
  ]);

  const handleAddScore = () => {
    if (!newStudentName || !newStudentScore) return;
    setStudentScores([
      ...studentScores,
      { name: newStudentName, score: parseInt(newStudentScore) },
    ]);
    setNewStudentName("");
    setNewStudentScore("");
    setStatus({ type: "success", message: "Data nilai berhasil ditambahkan!" });
  };

  const deleteScore = (index: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus entri ini?")) {
      setStudentScores(studentScores.filter((_, i) => i !== index));
      setStatus({ type: "success", message: "Data nilai dihapus." });
    }
  };

  const getStats = () => {
    if (studentScores.length === 0)
      return { avg: 0, max: 0, min: 0, passCount: 0 };
    const scores = studentScores.map((s) => s.score);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const passCount = scores.filter((s) => s >= 75).length;
    return { avg: avg.toFixed(1), max, min, passCount };
  };

  const stats = getStats();
  const pieData = [
    { name: "Tuntas (>=75)", value: stats.passCount },
    {
      name: "Belum Tuntas (<75)",
      value: studentScores.length - stats.passCount,
    },
  ];
  const COLORS = ["#10b981", "#f43f5e"];

  // Jurnal State
  const [journalDate, setJournalDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [journalActivity, setJournalActivity] = useState("");
  const [journalClass, setJournalClass] = useState("VII-A");
  const [journalTopic, setJournalTopic] = useState("");
  const [journalNotes, setJournalNotes] = useState("");
  const [journalTeacher, setJournalTeacher] = useState(
    "Catur Pamungkas, S.Pd.,Gr.",
  );
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem("ips-maestro-journal-entries");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "seed-1",
        date: "2026-05-20",
        class: "VII-A",
        topic: "Interaksi Sosial dan Lembaga Sosial",
        activity:
          "Melaksanakan pembelajaran interaktif dengan model Problem-Based Learning (PBL) tentang pengaruh interaksi sosial terhadap pembentukan lembaga sosial di masyarakat. Siswa dibagi ke dalam kelompok heterogen untuk menganalisis studi kasus mengenai pembentukan Pos Ronda (Siskamling) dan dampaknya bagi keteraturan wilayah pemukiman.",
        notes:
          "Pertemuan berjalan sangat dinamis dan komunikatif. Sebagian besar siswa terampil merumuskan kesimpulan hubungan sosiologis kelembagaan. Tindak Lanjut (RTL): Untuk pertemuan berikutnya, pembatasan waktu presentasi tiap kelompok diperketat maksimal 5 menit agar sesi evaluasi bersama lebih komprehensif.",
        teacher: "Catur Pamungkas, S.Pd.,Gr.",
        timestamp: Date.now(),
      },
      {
        id: "seed-2",
        date: "2026-05-19",
        class: "VIII-A",
        topic: "Perubahan Keruangan di Negara ASEAN",
        activity:
          'Mengadakan analisis keruangan berbasis mitigasi kebencanaan geologis di kawasan Asia Tenggara. Siswa melakukan pengamatan geospasial sederhana menggunakan peta tematik "Ring of Fire" dunia untuk mengidentifikasi negara kepulauan yang berada di zona rawan gempa serta mendiskusikan langkah kesiapsiagaan sekolah siaga bencana.',
        notes:
          "Sebagian besar siswa berhasil mengorelasikan garis tektonik dengan ancaman vulkanisme. Adapun 3 siswa yang kurang aktif dikoordinasikan untuk mendapatkan bimbingan sebaya (peer tutoring) pada pertemuan pengerjaan LKP/LKPD berikutnya.",
        teacher: "Catur Pamungkas, S.Pd.,Gr.",
        timestamp: Date.now() - 86400000,
      },
      {
        id: "seed-3",
        date: "2026-05-18",
        class: "VII-B",
        topic: "Kegiatan Ekonomi dan Rantai Kelangkaan",
        activity:
          "Menerapkan metode role-playing (bermain peran) dalam simulasi alur rantai distribusi pangan lokal dari produsen agraris pedesaan hingga konsumen perkotaan. Siswa memerankan fungsi pedagang besar, makelar, pengecer, dan pembeli serta menyaksikan secara visual timbulnya biaya transportasi sebagai pembentuk harga akhir barang.",
        notes:
          "Konsep dasar alur pemenuhan kebutuhan hidup (kegiatan ekonomi) dipahami dengan sangat baik melalui keterlibatan langsung bermain peran. Refleksi: Minggu depan akan ditingkatkan pada materi penentuan harga pasar seimbang dan konsep dasar inflasi lokal.",
        teacher: "Catur Pamungkas, S.Pd.,Gr.",
        timestamp: Date.now() - 86400000 * 2,
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem(
      "ips-maestro-journal-entries",
      JSON.stringify(journalEntries),
    );
  }, [journalEntries]);

  // Decryption & Encryption Helper Functions
  const encryptBackupData = (plainText: string, passcode: string): string => {
    let tempHash = 5381;
    for (let i = 0; i < passcode.length; i++) {
      tempHash = (tempHash * 33) ^ passcode.charCodeAt(i);
    }
    
    let seed = tempHash;
    const nextRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const safeText = btoa(unescape(encodeURIComponent(plainText)));
    let cipherText = "";
    for (let i = 0; i < safeText.length; i++) {
      const charCode = safeText.charCodeAt(i);
      const keyByte = Math.floor(nextRandom() * 256);
      const xorVal = charCode ^ keyByte;
      let hex = xorVal.toString(16);
      if (hex.length < 2) hex = "0" + hex;
      cipherText += hex;
    }
    return `IM_SECURE_V1:${cipherText}`;
  };

  const decryptBackupData = (cipherEnvelope: string, passcode: string): string => {
    if (!cipherEnvelope.startsWith("IM_SECURE_V1:")) {
      throw new Error("Format file backup tidak dikenali.");
    }
    const cipherText = cipherEnvelope.substring("IM_SECURE_V1:".length).trim();
    
    let tempHash = 5381;
    for (let i = 0; i < passcode.length; i++) {
      tempHash = (tempHash * 33) ^ passcode.charCodeAt(i);
    }
    
    let seed = tempHash;
    const nextRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    let decryptedB64 = "";
    for (let i = 0; i < cipherText.length; i += 2) {
      const hexByte = cipherText.substring(i, i + 2);
      const xorVal = parseInt(hexByte, 16);
      const keyByte = Math.floor(nextRandom() * 256);
      const charCode = xorVal ^ keyByte;
      decryptedB64 += String.fromCharCode(charCode);
    }
    return decodeURIComponent(escape(atob(decryptedB64)));
  };

  const handleDownloadBackup = (passcode: string) => {
    const trimmed = passcode.trim();
    if (!trimmed || trimmed.length < 6) {
      setStatus({
        type: "error",
        message: "Kata sandi pengaman minimal harus berukuran 6 karakter.",
      });
      return;
    }

    try {
      const backupPayload = {
        signature: "IPS_MAESTRO_SECURE_BACKUP",
        version: "1.0",
        timestamp: Date.now(),
        data: {
          studentScores,
          journalEntries,
        },
      };

      const plainText = JSON.stringify(backupPayload);
      const encryptedStr = encryptBackupData(plainText, trimmed);

      const blob = new Blob([encryptedStr], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      link.href = url;
      link.download = `IPS_Maestro_Backup_${dateStr}.imb`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus({
        type: "success",
        message: "Backup berhasil diunduh. Simpan file .imb ini di tempat yang sangat aman!",
      });
      setShowBackupModal(false);
      setBackupPasscode("");
    } catch (err: any) {
      setStatus({
        type: "error",
        message: `Gagal membuat backup: ${err.message}`,
      });
    }
  };

  const handleRestoreBackup = (passcode: string) => {
    if (!restoreFileContent) {
      setStatus({
        type: "error",
        message: "Silakan pilih berkas backup terlebih dahulu.",
      });
      return;
    }
    const trimmed = passcode.trim();
    if (!trimmed) {
      setStatus({
        type: "error",
        message: "Kata sandi diperlukan untuk mendekripsi data.",
      });
      return;
    }

    try {
      const decryptedText = decryptBackupData(restoreFileContent, trimmed);
      const backupPayload = JSON.parse(decryptedText);

      if (backupPayload.signature !== "IPS_MAESTRO_SECURE_BACKUP") {
        throw new Error("Berkas backup tidak valid atau rusak.");
      }

      const { studentScores: restoredScores, journalEntries: restoredJournals } = backupPayload.data;

      if (!Array.isArray(restoredScores) || !Array.isArray(restoredJournals)) {
        throw new Error("Struktur data cadangan tidak lengkap.");
      }

      const confirmMessage = `Konfirmasi Restorasi:\n\nDitemukan ${restoredJournals.length} entri jurnal dan ${restoredScores.length} data nilai siswa.\n\nApakah Anda yakin ingin mengganti data saat ini dengan data cadangan tersebut? Tindakan ini akan menimpa data yang ada sekarang secara permanen.`;
      if (window.confirm(confirmMessage)) {
        setStudentScores(restoredScores);
        setJournalEntries(restoredJournals);
        setStatus({
          type: "success",
          message: "Semua data berhasil dipulihkan secara aman!",
        });
        setShowRestoreModal(false);
        setRestoreFileContent("");
        setRestoreFileName("");
        setRestorePasscode("");
      }
    } catch (err: any) {
      console.error(err);
      setStatus({
        type: "error",
        message: "Gagal memulihkan cadangan: Kata sandi salah atau format tidak kompatibel.",
      });
    }
  };

  const validateTeacherNameWithTitle = (name: string): { isValid: boolean; errorMsg?: string } => {
    const trimmed = name.trim();
    if (!trimmed) {
      return { isValid: false, errorMsg: "Nama guru tidak boleh kosong." };
    }
    if (trimmed.length < 5) {
      return { isValid: false, errorMsg: "Nama guru terlalu pendek (minimal 5 karakter)." };
    }
    
    const allowedCharRegex = /^[A-Za-z\s.,'-]+$/;
    if (!allowedCharRegex.test(trimmed)) {
      return { isValid: false, errorMsg: "Nama dan gelar hanya boleh berisi huruf, spasi, titik (.), koma (,), tanda hubung (-), dan tanda petik (')." };
    }

    const lowercase = trimmed.toLowerCase();
    
    const hasCommonPrefix = /^(drs|dra|prof|dr|ustadz|ustazah|bu|pak)\b/i.test(lowercase);
    
    const commonGelarPattern = /\b(s\.?pd|m\.?pd|gr|s\.?si|s\.?s|s\.?psi|s\.?sos|s\.?ag|m\.?si|m\.?a|s\.?kom|lc|h\.?j?|s\.?h|s\.?e|m\.?m)\b/i;
    const hasCommonSuffix = commonGelarPattern.test(lowercase);
    
    if (!hasCommonPrefix && !hasCommonSuffix) {
      return { 
        isValid: false, 
        errorMsg: "Format nama guru tidak lazim. Harap sertakan gelar akademik/profesi (contoh: 'Catur Pamungkas, S.Pd.' atau 'Dra. Sri Wahyuni')." 
      };
    }

    if (trimmed.includes(",") && !/,\s*[A-Za-z]/i.test(trimmed)) {
      return {
        isValid: false,
        errorMsg: "Format spasi setelah tanda koma (,) sebelum penulisan gelar kurang tepat (contoh yang benar: 'Nama, S.Pd.')."
      };
    }

    if (/\b(spd|mpd|ssi|spsi|ssos|msi)\b/i.test(lowercase)) {
      return {
        isValid: false,
        errorMsg: "Penulisan gelar disarankan menggunakan tanda titik yang benar (contoh: 'S.Pd.', 'M.Pd.', 'S.Si.')."
      };
    }

    return { isValid: true };
  };

  const handleAddJournalEntry = () => {
    if (!journalActivity || !journalTopic) {
      setStatus({
        type: "error",
        message: "Harap isi aktivitas dan materi jurnal.",
      });
      return;
    }

    const nameValidation = validateTeacherNameWithTitle(journalTeacher);
    if (!nameValidation.isValid) {
      setStatus({
        type: "error",
        message: nameValidation.errorMsg || "Gelar atau format nama guru tidak sesuai.",
      });
      return;
    }

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: journalDate,
      activity: journalActivity,
      class: journalClass,
      topic: journalTopic,
      notes: journalNotes,
      teacher: journalTeacher.trim(),
      timestamp: Date.now(),
    };

    setJournalEntries((prev) => [newEntry, ...prev]);
    setJournalActivity("");
    setJournalTopic("");
    setJournalNotes("");
    setStatus({ type: "success", message: "Jurnal berhasil disimpan!" });
  };

  const handleDeleteJournalEntry = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus entri ini?")) {
      setJournalEntries((prev) => prev.filter((e) => e.id !== id));
      setStatus({ type: "success", message: "Jurnal berhasil dihapus." });
    }
  };

  const handleExportJournalCSV = () => {
    if (journalEntries.length === 0) {
      setStatus({
        type: "error",
        message: "Tidak ada data jurnal untuk diekspor.",
      });
      return;
    }

    // Header CSV
    const headers = [
      "Tanggal",
      "Kelas",
      "Topik",
      "Aktivitas",
      "Catatan",
      "Guru",
    ];

    // Data CSV
    const csvContent = [
      headers.join(","),
      ...journalEntries.map((entry) =>
        [
          `"${entry.date}"`,
          `"${entry.class}"`,
          `"${entry.topic.replace(/"/g, '""')}"`,
          `"${formatToBulletList(entry.activity).replace(/"/g, '""')}"`,
          `"${formatToBulletList(entry.notes || "").replace(/"/g, '""')}"`,
          `"${entry.teacher}"`,
        ].join(","),
      ),
    ].join("\n");

    // Buat Blob dan link download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Jurnal_Guru_IPS_Maestro_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setStatus({ type: "success", message: "Jurnal berhasil diekspor ke CSV!" });
  };

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [needsDriveAuth, setNeedsDriveAuth] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadDataFromFirebase = async (uid: string) => {
    try {
      const journalsQuery = query(collection(db, "journals"), where("userId", "==", uid));
      const journalsSnapshot = await getDocs(journalsQuery);
      if (!journalsSnapshot.empty) {
        const loadedJournals = journalsSnapshot.docs.map((doc) => doc.data() as JournalEntry);
        setJournalEntries(loadedJournals);
      }

      const scoresQuery = query(collection(db, "studentScores"), where("userId", "==", uid));
      const scoresSnapshot = await getDocs(scoresQuery);
      if (!scoresSnapshot.empty) {
        const loadedScores = scoresSnapshot.docs.map((doc) => doc.data() as any);
        setStudentScores(loadedScores);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "journals/studentScores");
    }
  };

  const syncDataToFirebase = async () => {
    if (!user) {
      setStatus({ type: "error", message: "Silakan login Google terlebih dahulu untuk sinkronisasi." });
      return;
    }
    
    setIsSyncing(true);
    setStatus({ type: "loading", message: "Sedang mensinkronisasi data ke cloud..." });
    let isSuccess = true;

    try {
      const batch = writeBatch(db);
      
      journalEntries.forEach(entry => {
        const ref = doc(db, "journals", entry.id);
        const data = { ...entry, userId: user.uid, timestamp: entry.timestamp || Date.now() };
        batch.set(ref, data, { merge: true });
      });
      
      studentScores.forEach(score => {
        const id = score.id || `score_${Date.now()}_${Math.random().toString(36).substring(2,9)}`;
        const ref = doc(db, "studentScores", id);
        const data = { ...score, id, userId: user.uid, timestamp: score.timestamp || Date.now() };
        batch.set(ref, data, { merge: true });
      });

      await batch.commit();
      
      const updatedScores = studentScores.map(score => ({
         ...score,
         id: score.id || `score_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
         timestamp: score.timestamp || Date.now(),
         userId: user.uid
      }));
      setStudentScores(updatedScores);
      
    } catch (err: any) {
       isSuccess = false;
       setStatus({ type: "error", message: "Gagal memproses sinkronisasi." });
       handleFirestoreError(err, OperationType.WRITE, "journals/studentScores");
    } finally {
       setIsSyncing(false);
       if (isSuccess) {
           setStatus({ type: "success", message: "Sinkronisasi berhasil! ☁️" });
       }
    }
  };

  useEffect(() => {
    const unsubscribe = initAuth(
      (u) => {
        setUser(u);
        setNeedsDriveAuth(false);
        loadDataFromFirebase(u.uid);
      },
      () => {
        setUser(null);
        setNeedsDriveAuth(true);
      },
    );
    return () => unsubscribe();
  }, []);

  // Materi State
  const [materials, setMaterials] = useState<any[]>([]);
  const [isFetchingMaterials, setIsFetchingMaterials] = useState(false);
  const [materialSearch, setMaterialSearch] = useState("");
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState("root");
  const [currentFolderName, setCurrentFolderName] = useState("Root");
  const [folderStack, setFolderStack] = useState<
    { id: string; name: string }[]
  >([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [offlineFileIds, setOfflineFileIds] = useState<Set<string>>(new Set());
  const [offlineMaterials, setOfflineMaterials] = useState<any[]>([]);
  const [materiView, setMateriView] = useState<"drive" | "offline">("drive");
  const [materiFilter, setMateriFilter] = useState<
    "all" | "pdf" | "docx" | "image" | "folder"
  >("all");
  const [materialViewMode, setMaterialViewMode] = useState<"grid" | "list">(
    "grid",
  );
  const [materialSort, setMaterialSort] = useState<
    "name" | "newest" | "oldest"
  >("name");
  const [syncingStatuses, setSyncingStatuses] = useState<
    Record<string, "downloading" | "finished" | "failed">
  >({});
  const [previewFile, setPreviewFile] = useState<{
    id: string;
    name: string;
    mimeType: string;
    url: string;
    size?: string;
    createdTime?: string;
    description?: string;
  } | null>(null);

  const handlePreviewMaterial = async (file: any) => {
    if (previewFile) {
      if (previewFile.url && previewFile.url.startsWith("blob:")) {
        URL.revokeObjectURL(previewFile.url);
      }
      setPreviewFile(null);
    }

    const isOffline = offlineFileIds.has(file.id);
    const fileDetails = {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
      createdTime: file.createdTime,
      description: file.description,
    };

    if (isOffline) {
      const offlineFile = await getOfflineFile(file.id);
      if (offlineFile && offlineFile.data) {
        const url = URL.createObjectURL(offlineFile.data);
        setPreviewFile({ ...fileDetails, url });
      } else {
        setStatus({
          type: "error",
          message: "File offline tidak ditemukan di database.",
        });
      }
    } else {
      // Use Google Drive Preview link
      const drivePreviewUrl = `https://drive.google.com/file/d/${file.id}/preview`;
      setPreviewFile({ ...fileDetails, url: drivePreviewUrl });
    }
  };

  const refreshOfflineFiles = async () => {
    const offlineFiles = await listOfflineFiles();
    setOfflineFileIds(new Set(offlineFiles.map((f) => f.id)));
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
      setSyncingStatuses((prev) => {
        const next = { ...prev };
        delete next[file.id];
        return next;
      });
      setStatus({
        type: "success",
        message: `File ${file.name} dihapus dari akses offline.`,
      });
    } else {
      if (!token) {
        setStatus({
          type: "error",
          message: "Token Google Drive kedaluwarsa. Silakan login kembali.",
        });
        return;
      }

      setSyncingStatuses((prev) => ({ ...prev, [file.id]: "downloading" }));
      setStatus({
        type: "success",
        message: `Mengunduh ${file.name} untuk akses offline...`,
      });

      try {
        const blob = await getDriveFileBlob(token, file.id);
        await saveFileOffline(
          { id: file.id, name: file.name, mimeType: file.mimeType },
          blob,
        );

        setSyncingStatuses((prev) => ({ ...prev, [file.id]: "finished" }));
        setStatus({
          type: "success",
          message: `${file.name} kini tersedia offline!`,
        });

        setTimeout(() => {
          setSyncingStatuses((prev) => {
            const next = { ...prev };
            if (next[file.id] === "finished") delete next[file.id];
            return next;
          });
        }, 3000);
      } catch (err: any) {
        setSyncingStatuses((prev) => ({ ...prev, [file.id]: "failed" }));
        setStatus({
          type: "error",
          message: `Gagal mengunduh untuk offline: ${err.message}`,
        });
        return;
      }
    }
    refreshOfflineFiles();
  };

  const handleDownloadOffline = async (fileId: string) => {
    const offlineFile = await getOfflineFile(fileId);
    if (!offlineFile) {
      setStatus({
        type: "error",
        message: "File tidak ditemukan di penyimpanan offline.",
      });
      return;
    }
    const url = URL.createObjectURL(offlineFile.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = offlineFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatus({
      type: "success",
      message: "Berhasil mengunduh dari penyimpanan offline.",
    });
  };

  const handleDownloadDrive = async (file: any) => {
    const token = getAccessToken();
    if (!token) {
      setStatus({
        type: "error",
        message: "Hanya tersedia jika terhubung ke Drive.",
      });
      return;
    }

    setStatus({
      type: "loading",
      message: `Menyiapkan unduhan: ${file.name}...`,
    });
    try {
      if (file.webContentLink) {
        // Use direct link if available
        window.open(file.webContentLink, "_blank");
        setStatus({ type: "success", message: "Unduhan dimulai!" });
      } else {
        // Fallback to blob download
        const blob = await getDriveFileBlob(token, file.id);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setStatus({ type: "success", message: "Unduhan selesai!" });
      }
    } catch (err: any) {
      setStatus({ type: "error", message: `Gagal mengunduh: ${err.message}` });
    }
  };

  const fetchMaterials = async (folderId: string = "root") => {
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
    if (activeTab === "materi" && user) {
      fetchMaterials(currentFolderId);
    }
  }, [activeTab, user, currentFolderId]);

  const handleCreateFolder = async () => {
    const folderName = prompt("Nama folder baru:");
    if (!folderName) return;

    const token = getAccessToken();
    if (!token) return;

    setIsCreatingFolder(true);
    try {
      await createDriveFolder(token, folderName, currentFolderId);
      setStatus({ type: "success", message: "Folder berhasil dibuat!" });
      fetchMaterials(currentFolderId);
    } catch (err: any) {
      setStatus({
        type: "error",
        message: `Gagal membuat folder: ${err.message}`,
      });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleNavigateFolder = (folderId: string, folderName: string) => {
    setFolderStack((prev) => [
      ...prev,
      { id: currentFolderId, name: currentFolderName },
    ]);
    setCurrentFolderId(folderId);
    setCurrentFolderName(folderName);
  };

  const handleGoBack = () => {
    if (folderStack.length === 0) return;
    const prev = folderStack[folderStack.length - 1];
    setFolderStack((prevStack) => prevStack.slice(0, -1));
    setCurrentFolderId(prev.id);
    setCurrentFolderName(prev.name);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = getAccessToken();
    if (!token) {
      setStatus({
        type: "error",
        message: "Hanya tersedia jika terhubung ke Drive.",
      });
      return;
    }

    setIsUploadingMaterial(true);
    setStatus({ type: "success", message: "Mengunggah file..." });
    try {
      await uploadToDrive(token, file.name, file, file.type, currentFolderId);
      setStatus({ type: "success", message: "File berhasil diunggah!" });
      fetchMaterials(currentFolderId);
    } catch (err: any) {
      setStatus({ type: "error", message: `Gagal unggah: ${err.message}` });
    } finally {
      setIsUploadingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (fileId: string) => {
    const token = getAccessToken();
    if (!token) return;

    if (!confirm("Hapus file ini permanen?")) return;

    try {
      await deleteDriveFile(token, fileId);
      setStatus({ type: "success", message: "File dihapus." });
      fetchMaterials();
    } catch (err: any) {
      setStatus({ type: "error", message: `Gagal hapus: ${err.message}` });
    }
  };

  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsDriveAuth(false);
        setStatus({
          type: "success",
          message: "Berhasil terhubung ke Google Drive!",
        });
      }
    } catch (err) {
      setStatus({
        type: "error",
        message: "Gagal menghubungkan Google Drive.",
      });
    }
  };

  useEffect(() => {
    if (activeTab === "chatbot" && chatEndRef.current) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }, 100);
    }
  }, [chatMessages, activeTab, isSendingChat]);

  const handleSendChat = async () => {
    if (!chatInput.trim() || isSendingChat) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsSendingChat(true);

    try {
      const history = chatMessages.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      }));

      const contents = [
        ...history,
        { role: "user", parts: [{ text: chatInput }] },
      ];
      const text = await maestroAI({
        contents,
        systemInstruction: aiChatSystemPrompt,
        temperature: aiTemperature,
      });

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        content: text,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setStatus({
        type: "error",
        message: err.message || "Gagal menghubungi Maestro Chat.",
      });
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

      const text = await maestroAI({ prompt });
      setLkpdResult(text);
    } catch (err: any) {
      setStatus({
        type: "error",
        message: err.message || "Gagal membuat LKPD.",
      });
    } finally {
      setIsGeneratingLkpd(false);
    }
  };

  const exportPDF = async (
    elementId: string,
    filename: string,
    shouldDownload: boolean = true,
  ) => {
    if (shouldDownload && !confirm("Siapkan unduhan file PDF?")) return null;
    const element = document.getElementById(elementId);
    if (!element) return null;
    setStatus({ type: "success", message: "Menyiapkan PDF..." });

    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgHeightInMm = (imgProps.height * pdfWidth) / imgProps.width;

    let heightLeft = imgHeightInMm;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeightInMm);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeightInMm;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeightInMm);
      heightLeft -= pdfHeight;
    }

    if (shouldDownload) {
      pdf.save(`${filename}.pdf`);
      setStatus({ type: "success", message: "PDF berhasil diunduh!" });
      return null;
    }

    return pdf.output("blob");
  };

  const exportDOCX = async (
    elementId: string,
    filename: string,
    shouldDownload: boolean = true,
  ) => {
    if (shouldDownload && !confirm("Siapkan unduhan file DOCX?")) return null;
    const element = document.getElementById(elementId);
    if (!element) return null;
    setStatus({ type: "success", message: "Menyiapkan DOCX..." });

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

      const response = await fetch("/api/generate-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: htmlContent, filename }),
      });

      if (!response.ok) throw new Error("Gagal dari server");

      const docxBlob = await response.blob();

      if (shouldDownload) {
        const url = URL.createObjectURL(docxBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}.docx`;
        link.click();
        URL.revokeObjectURL(url);
        setStatus({ type: "success", message: "DOCX berhasil diunduh!" });
        return null;
      }

      return docxBlob;
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: "Gagal membuat DOCX." });
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
      setStatus({
        type: "error",
        message: "Token akses tidak ditemukan. Silakan login kembali.",
      });
      setNeedsDriveAuth(true);
      return;
    }

    setIsUploadingToDrive(true);
    try {
      const fileName = `LKPD_Maestro_${lkpdTopic.replace(/\s+/g, "_")}`;
      let blob;
      if (lkpdExportFormat === "pdf") {
        blob = await exportPDF("lkpd-result-content", fileName, false);
      } else {
        blob = await exportDOCX("lkpd-result-content", fileName, false);
      }

      if (!blob)
        throw new Error(
          `Gagal menghasilkan file ${lkpdExportFormat.toUpperCase()}`,
        );

      await uploadToDrive(token, `${fileName}.${lkpdExportFormat}`, blob);
      setStatus({
        type: "success",
        message: `LKPD (.${lkpdExportFormat}) berhasil disimpan ke Google Drive Anda!`,
      });
    } catch (err: any) {
      setStatus({
        type: "error",
        message: `Gagal simpan ke Drive: ${err.message}`,
      });
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
         ${rppIncludeVideo ? "- Wajib sertakan minimal 1 rekomendasi tautan Video YouTube yang relevan untuk stimulus." : ""}
         ${rppIncludeQuiz ? '- Wajib sertakan bagian "Kuis Interaktif Singkat" (3-5 soal) yang bisa langsung dikerjakan siswa.' : ""}
         ${rppIncludeLinks ? '- Wajib sertakan "Portal Sumber Belajar" yang berisi tautan eksternal ke situs web kredibel (Kemdikbud, BBC, dll).' : ""}
      5. Asesmen (Diagnostik, Formatif, Sumatif).
      6. Pengayaan & Remedial.
      7. Lampiran (Glosarium, Daftar Pustaka).

      Gunakan format Markdown yang sangat rapi, emoji yang relevan, dan pastikan langkah pembelajaran sangat detail dan kreatif (Maestro Style). Masukkan elemen interaktif tersebut secara organik di dalam langkah-langkah pembelajaran atau bagian khusus yang menarik visualnya.`;

      const text = await maestroAI({
        prompt,
        systemInstruction: "Anda adalah pakar pembuat RPP Kurikulum Merdeka.",
      });

      setRppResult(text);
      setStatus({ type: "success", message: "RPP Maestro berhasil dibuat!" });
    } catch (err: any) {
      setStatus({
        type: "error",
        message: err.message || "Gagal membuat RPP.",
      });
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
      setStatus({ type: "error", message: "Token akses tidak ditemukan." });
      setNeedsDriveAuth(true);
      return;
    }

    setIsUploadingRppToDrive(true);
    try {
      const fileName = `RPP_${rppGrade}_${rppTopic.replace(/\s+/g, "_")}`;
      let blob;
      if (rppExportFormat === "pdf") {
        blob = await exportPDF("rpp-result-content", fileName, false);
      } else {
        blob = await exportDOCX("rpp-result-content", fileName, false);
      }

      if (!blob)
        throw new Error(
          `Gagal menghasilkan file ${rppExportFormat.toUpperCase()}`,
        );

      await uploadToDrive(token, `${fileName}.${rppExportFormat}`, blob);
      setStatus({
        type: "success",
        message: `RPP (.${rppExportFormat}) berhasil disimpan ke Google Drive!`,
      });
    } catch (err: any) {
      setStatus({
        type: "error",
        message: `Gagal simpan ke Drive: ${err.message}`,
      });
    } finally {
      setIsUploadingRppToDrive(false);
    }
  };

  const handleSaveRppToCollection = () => {
    if (!rppResult) return;
    const newRpp = {
      id: "rpp_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      topic: rppTopic,
      grade: rppGrade,
      content: rppResult,
      date: new Date().toISOString(),
    };
    setSavedRpps((prev) => [newRpp, ...prev]);
    setStatus({ type: "success", message: "RPP berhasil disimpan ke Koleksi Saya." });
  };

  const handleDeleteSavedRpp = (id: string) => {
    setSavedRpps((prev) => prev.filter((r) => r.id !== id));
    setSelectedRppsForPrint((prev) => prev.filter((r) => r !== id));
    setStatus({ type: "success", message: "RPP dihapus dari Koleksi." });
  };

  const handleBulkPrintRpp = async () => {
    if (selectedRppsForPrint.length === 0) return;
    setStatus({ type: "loading", message: "Menyiapkan Bulk Print RPP..." });
    
    // Tunggu render
    setTimeout(async () => {
      try {
        const fileName = `BulkPrint_RPP_${Date.now()}`;
        
        let confirmBackup = window.confirm;
        window.confirm = () => true; // Bypass confirm inside exportPDF for bulk
        
        const result = await exportPDF("bulk-rpp-print-container", fileName, true);
        
        window.confirm = confirmBackup; // restore
        
        // Wait, exportPDF with shouldDownload=true returns null but calls pdf.save()
        // so we don't need to throw an error if result is null, it's expected.
        setStatus({ type: "success", message: "Bulk print RPP berhasil disiapkan." });
      } catch (err: any) {
        setStatus({ type: "error", message: `Gagal bulk print RPP: ${err.message}` });
      } finally {
        setSelectedRppsForPrint([]);
      }
    }, 500);
  };

  const handleGenerateSilabus = async () => {
    if (!silabusTopic) return;
    setIsGeneratingSilabus(true);
    setSilabusResult(null);

    try {
      const prompt = `Anda adalah "IPS Maestro", pakar pengembangan kurikulum IPS SMP di Indonesia. 
      Buatkan Silabus (Alur Tujuan Pembelajaran) yang sistematis dan mendalam untuk tingkat SMP Kelas ${silabusGrade} dengan topik: "${silabusTopic}".
      Tujuan Pembelajaran Khusus: ${silabusObjectives || "Sesuai standar Kurikulum Merdeka"}.

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

      const text = await maestroAI({
        prompt,
        systemInstruction:
          "Anda adalah pakar pengembang kurikulum dan silabus IPS.",
      });

      setSilabusResult(text);
      setStatus({
        type: "success",
        message: "Silabus Maestro berhasil dibuat!",
      });
    } catch (err: any) {
      setStatus({
        type: "error",
        message: err.message || "Gagal membuat Silabus.",
      });
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
      setStatus({ type: "error", message: "Token akses tidak ditemukan." });
      setNeedsDriveAuth(true);
      return;
    }

    setIsUploadingSilabusToDrive(true);
    try {
      const fileName = `Silabus_${silabusGrade}_${silabusTopic.replace(/\s+/g, "_")}`;
      let blob;
      if (silabusExportFormat === "pdf") {
        blob = await exportPDF("silabus-result-content", fileName, false);
      } else {
        blob = await exportDOCX("silabus-result-content", fileName, false);
      }

      if (!blob)
        throw new Error(
          `Gagal menghasilkan file ${silabusExportFormat.toUpperCase()}`,
        );

      await uploadToDrive(token, `${fileName}.${silabusExportFormat}`, blob);
      setStatus({
        type: "success",
        message: `Silabus (.${silabusExportFormat}) berhasil disimpan ke Google Drive!`,
      });
    } catch (err: any) {
      setStatus({
        type: "error",
        message: `Gagal simpan ke Drive: ${err.message}`,
      });
    } finally {
      setIsUploadingSilabusToDrive(false);
    }
  };

  const handleBankSoalFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBankSoalFile(file);
    setIsExtractingBankSoalFile(true);
    setStatus({
      type: "success",
      message: `Mengekstrak teks dari ${file.name}...`,
    });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/extract-text", {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");
      const data = isJson ? await response.json() : null;

      if (!response.ok) {
        throw new Error(
          data?.error || `Gagal mengekstrak teks (Status: ${response.status})`,
        );
      }

      setBankSoalFileText(data?.text || "");
      if (data?.text) {
        setStatus({
          type: "success",
          message:
            "Teks berhasil diekstrak! AI siap membuat soal dari dokumen ini.",
        });
      } else {
        throw new Error("Teks tidak ditemukan dalam dokumen.");
      }
    } catch (err) {
      console.error("Extraction error:", err);
      setStatus({ type: "error", message: "Gagal mengekstrak teks dokumen." });
    } finally {
      setIsExtractingBankSoalFile(false);
    }
  };

  const handleExportBankSoalJSON = () => {
    if (bankSoalQuestions.length === 0) return;
    const blob = new Blob([JSON.stringify(bankSoalQuestions, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `BankSoal_${bankSoalTopic.replace(/\s+/g, "_")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatus({
      type: "success",
      message: "Bank Soal berhasil diekspor ke JSON.",
    });
  };

  const handleExportBankSoalCSV = () => {
    if (bankSoalQuestions.length === 0) return;

    const headers = [
      "Soal",
      "A",
      "B",
      "C",
      "D",
      "Kunci",
      "Pembahasan",
      "Level",
      "Subtopik",
      "Tag",
    ];
    const rows = bankSoalQuestions.map((q) => [
      q.question,
      q.options.A,
      q.options.B,
      q.options.C,
      q.options.D,
      q.answer,
      q.explanation,
      q.level,
      q.subtopic || "",
      (q.tags || []).join("; "),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => `"${(cell || "").toString().replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `BankSoal_${bankSoalTopic.replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatus({
      type: "success",
      message: "Bank Soal berhasil diekspor ke CSV.",
    });
  };

  const handleExportBankSoalPDF = () => {
    if (bankSoalQuestions.length === 0) return;

    const doc = new jsPDF();
    const title = `Bank Soal: ${bankSoalTopic}`;

    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Dicetak pada: ${new Date().toLocaleDateString("id-ID")}`, 14, 30);

    const tableData = bankSoalQuestions.map((q, idx) => {
      let optionsText = "";
      if (q.type === "menjodohkan" && q.pairs) {
        optionsText = q.pairs.map((p: any, i: number) => `P${i+1}: ${p.premise}\nR${i+1}: ${p.response}`).join("\n");
      } else if (q.type === "mengurutkan" && q.items) {
        optionsText = q.items.map((it: any, i: number) => `${i+1}. ${it}`).join("\n");
      } else if (q.type === "benar_salah" && q.statements) {
        optionsText = q.statements.map((s: any, i: number) => `${i+1}. ${s.statement} (${s.answer})`).join("\n");
      } else if (q.options) {
        optionsText = Object.entries(q.options).map(([k, v]) => `${k}: ${v}`).join("\n");
      } else {
        optionsText = "-";
      }

      const answerText = Array.isArray(q.answer) ? q.answer.join(", ") : String(q.answer);

      return [
        (idx + 1).toString(),
        q.question,
        optionsText,
        answerText,
        q.level || "C4",
      ];
    });

    autoTable(doc, {
      startY: 40,
      head: [["No", "Pertanyaan", "Pilihan Jawaban", "Kunci", "Level"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 80 },
        2: { cellWidth: 60 },
        3: { cellWidth: 15, halign: "center" },
        4: { cellWidth: 15, halign: "center" },
      },
    });

    doc.save(`BankSoal_${bankSoalTopic.replace(/\s+/g, "_")}.pdf`);
    setStatus({
      type: "success",
      message: "Bank Soal berhasil diekspor ke PDF.",
    });
  };

  const handlePrintMonthlyReport = () => {
    setStatus({ type: "loading", message: "Menyiapkan Laporan Bulanan..." });
    try {
      const doc = new jsPDF();
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const currentMonthStr = currentDate.toLocaleDateString("id-ID", { month: 'long', year: 'numeric' });
      
      const isCurrentMonth = (dateStrOrNum: string | number | undefined) => {
        if (!dateStrOrNum) return true;
        const date = new Date(dateStrOrNum);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      };

      const monthRpps = savedRpps.filter(r => isCurrentMonth(r.date));
      const monthBanks = savedQuestionBanks.filter(b => isCurrentMonth(b.createdAt));
      const monthJournals = journalEntries.filter(j => isCurrentMonth(j.timestamp));

      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42);
      doc.text("Laporan Aktivitas Mengajar", 14, 22);
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Periode: ${currentMonthStr}`, 14, 30);
      doc.text(`Nama Guru: ${user?.displayName || "-"}\nEmail Guru: ${user?.email || "-"}`, 14, 36);

      let startY = 55;
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text("Ringkasan Aktivitas", 14, startY);
      
      startY += 10;
      doc.setFontSize(11);
      doc.setTextColor(50);
      doc.text(`Total Modul Ajar (RPP): ${monthRpps.length} Dokumen`, 14, startY);
      startY += 7;
      doc.text(`Total Bank Soal: ${monthBanks.length} Dokumen`, 14, startY);
      startY += 7;
      doc.text(`Total Jurnal Terisi: ${monthJournals.length} Entri`, 14, startY);
      
      startY += 20;

      if (monthRpps.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text("Daftar Modul Ajar (RPP)", 14, startY);
        
        autoTable(doc, {
          startY: startY + 5,
          head: [["No", "Tanggal", "Materi/Topik", "Kelas"]],
          body: monthRpps.map((r, i) => [
            (i + 1).toString(),
            new Date(r.date).toLocaleDateString("id-ID"),
            r.topic,
            r.grade
          ]),
          theme: "grid",
          headStyles: { fillColor: [59, 130, 246] },
          styles: { fontSize: 9 },
        });
        startY = (doc as any).lastAutoTable.finalY + 15;
      }

      if (monthBanks.length > 0) {
        if (startY > 250) { doc.addPage(); startY = 20; }
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text("Daftar Bank Soal", 14, startY);
        
        autoTable(doc, {
          startY: startY + 5,
          head: [["No", "Tanggal", "Topik", "Jumlah Soal"]],
          body: monthBanks.map((b, i) => [
            (i + 1).toString(),
            new Date(b.createdAt).toLocaleDateString("id-ID"),
            b.topic || b.title,
            (b.questions?.length || 0).toString()
          ]),
          theme: "grid",
          headStyles: { fillColor: [79, 70, 229] },
          styles: { fontSize: 9 },
        });
        startY = (doc as any).lastAutoTable.finalY + 15;
      }

      if (monthJournals.length > 0) {
         if (startY > 250) { doc.addPage(); startY = 20; }
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text("Daftar Jurnal Mengajar", 14, startY);
        
        autoTable(doc, {
          startY: startY + 5,
          head: [["No", "Tanggal", "Aktivitas", "Topik", "Kelas"]],
          body: monthJournals.map((j, i) => [
            (i + 1).toString(),
            new Date(j.timestamp || Date.now()).toLocaleDateString("id-ID"),
            j.activity,
            j.topic,
            j.class
          ]),
          theme: "grid",
          headStyles: { fillColor: [16, 185, 129] },
          styles: { fontSize: 9 },
        });
      }

      doc.save(`Laporan_Bulanan_${Date.now()}.pdf`);
      setStatus({ type: "success", message: "Laporan bulanan berhasil dicetak." });
    } catch(err: any) {
      setStatus({ type: "error", message: `Gagal mencetak laporan: ${err.message}` });
    }
  };

  const handleBulkPrintBankSoal = () => {
    if (selectedBanksForPrint.length === 0) return;

    setStatus({ type: "loading", message: "Sedang menyiapkan dokumen cetak banyak..." });
    const doc = new jsPDF();
    const selected = savedQuestionBanks.filter((b) => selectedBanksForPrint.includes(b.id));

    selected.forEach((bank, bankIdx) => {
      if (bankIdx > 0) {
        doc.addPage();
      }
      const title = `Bank Soal: ${bank.topic}`;

      doc.setFontSize(18);
      doc.text(title, 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Dicetak pada: ${new Date().toLocaleDateString("id-ID")}`, 14, 30);

      const tableData = bank.questions.map((q: any, idx: number) => {
        let optionsText = "";
        if (q.type === "menjodohkan" && q.pairs) {
          optionsText = q.pairs.map((p: any, i: number) => `P${i + 1}: ${p.premise}\nR${i + 1}: ${p.response}`).join("\n");
        } else if (q.type === "mengurutkan" && q.items) {
          optionsText = q.items.map((it: any, i: number) => `${i + 1}. ${it}`).join("\n");
        } else if (q.type === "benar_salah" && q.statements) {
          optionsText = q.statements.map((s: any, i: number) => `${i + 1}. ${s.statement} (${s.answer})`).join("\n");
        } else if (q.options) {
          optionsText = Object.entries(q.options).map(([k, v]) => `${k}: ${v}`).join("\n");
        } else {
          optionsText = "-";
        }

        const answerText = Array.isArray(q.answer) ? q.answer.join(", ") : String(q.answer);

        return [
          (idx + 1).toString(),
          q.question,
          optionsText,
          answerText,
          q.level || "C4",
        ];
      });

      autoTable(doc, {
        startY: 40,
        head: [["No", "Pertanyaan", "Pilihan Jawaban", "Kunci", "Level"]],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 80 },
          2: { cellWidth: 60 },
          3: { cellWidth: 15, halign: "center" },
          4: { cellWidth: 15, halign: "center" },
        },
      });
    });

    doc.save(`BulkPrint_BankSoal_${Date.now()}.pdf`);
    setStatus({
      type: "success",
      message: "File cetak banyak berhasil diunduh.",
    });
    setSelectedBanksForPrint([]); // Reset selection
  };
  
  const handleExportBankSoalDOCX = async () => {
    if (bankSoalQuestions.length === 0) return;

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: `BANK SOAL: ${bankSoalTopic.toUpperCase()}`,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ text: "No", style: "bold" })],
                      width: { size: 5, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({ text: "Pertanyaan", style: "bold" }),
                      ],
                      width: { size: 45, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({ text: "Pilihan", style: "bold" }),
                      ],
                      width: { size: 35, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({ text: "Kunci", style: "bold" }),
                      ],
                      width: { size: 15, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
                ...bankSoalQuestions.map((q, idx) => {
                  let optionParagraphs: any[] = [];
                  if (q.type === "menjodohkan" && q.pairs) {
                    optionParagraphs = q.pairs.map((p: any, i: number) => new Paragraph(`Premis ${i+1}: ${p.premise} -> Respon: ${p.response}`));
                  } else if (q.type === "mengurutkan" && q.items) {
                    optionParagraphs = q.items.map((it: any, i: number) => new Paragraph(`${i+1}. ${it}`));
                  } else if (q.type === "benar_salah" && q.statements) {
                    optionParagraphs = q.statements.map((s: any, i: number) => new Paragraph(`${i+1}. ${s.statement} [${s.answer}]`));
                  } else if (q.options) {
                    optionParagraphs = Object.entries(q.options).map(([k, v]) => new Paragraph(`${k}. ${v}`));
                  } else {
                    optionParagraphs = [new Paragraph("-")];
                  }

                  const answerText = Array.isArray(q.answer) ? q.answer.join(", ") : String(q.answer);

                  return new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph((idx + 1).toString())],
                      }),
                      new TableCell({
                        children: [new Paragraph(q.question)],
                      }),
                      new TableCell({
                        children: optionParagraphs,
                      }),
                      new TableCell({
                        children: [new Paragraph(answerText)],
                      }),
                    ],
                  });
                }),
              ],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `BankSoal_${bankSoalTopic.replace(/\s+/g, "_")}.docx`);
    setStatus({
      type: "success",
      message: "Bank Soal berhasil diekspor ke DOCX.",
    });
  };

  const handleGenerateBankSoal = async () => {
    if (!bankSoalTopic && !bankSoalFileText) {
      setStatus({
        type: "error",
        message: "Harap tentukan topik atau unggah dokumen.",
      });
      return;
    }
    setIsGeneratingBankSoal(true);
    setBankSoalResult(null);
    setBankSoalQuestions([]);
    setBankSoalKisiKisi([]);

    try {
      const prompt = `Anda adalah "IPS Maestro", pakar evaluasi pendidikan Indonesia.
      Tugas: Buat Bank Soal IPS & Kisi-Kisi Instrumen Penilaian Standar Profesional Dinas Pendidikan.

      ${bankSoalFileText ? `REFERENSI DOKUMEN:\n---\n${bankSoalFileText.substring(0, 10000)}\n---\n` : ""}
      
      PARAMETER:
      - TOPIK: ${bankSoalTopic}
      - KELAS: ${bankSoalGrade}
      - JUMLAH SOAL: ${bankSoalCount}
      - TINGKAT KESUKARAN TARGET: ${bankSoalDifficulty.toUpperCase()}
      - JUMLAH OPSI (Untuk MCQ): ${bankSoalOptionCount} (Pilihan A-${String.fromCharCode(64 + bankSoalOptionCount)})
      - FORMAT SOAL YANG DIPERBOLEHKAN: ${bankSoalAllowedTypes.join(", ")}

      PENTING (KATA KERJA OPERASIONAL TAKSONOMI BLOOM):
      Sesuaikan level kognitif soal dengan TINGKAT KESUKARAN TARGET (${bankSoalDifficulty.toUpperCase()}):
      - Jika MUDAH: Fokus pada level LOTS (C1 Pengetahuan, C2 Pemahaman). Gunakan KKO seperti: Menyebutkan, Menjelaskan, Mengidentifikasi, Menunjukkan, Mengklasifikasikan, Memberi contoh.
      - Jika SEDANG: Fokus pada level MOTS (C3 Aplikasi). Gunakan KKO seperti: Menerapkan, Menghitung, Mengurutkan, Menentukan, Meramalkan.
      - Jika SUKAR: Fokus pada level HOTS (C4 Analisis, C5 Evaluasi, C6 Kreasi). Gunakan KKO seperti: Menganalisis, Menyimpulkan, Membandingkan, Mengkritisi, Menilai, Merancang, Mengkonstruksi.

      OUTPUT HARUS JSON VALID dengan struktur:
      {
        "title": "Judul Bank Soal",
        "topic": "${bankSoalTopic}",
        "kisi_kisi": [
          {
            "no_soal": 1,
            "kompetensi_dasar": "KD/CP yang relevan",
            "materi": "Materi pokok",
            "indikator_soal": "Indikator soal spesifik",
            "level_kognitif": "L1/L2/L3 (C1-C6)",
            "bentuk_soal": "Pilihan Ganda / Pilihan Ganda Kompleks / Menjodohkan / Mengurutkan / Benar-Salah yang sesuai",
            "tingkat_kesukaran": "Mudah/Sedang/Sukar"
          }
        ],
        "questions": [
          {
            "type": "pilihan_ganda | pilihan_ganda_kompleks | menjodohkan | mengurutkan | benar_salah",
            "question": "teks soal...",
            // Di bawah ini opsional & disesuaikan tergantung dari "type":
            "options": { "A": "...", "B": "...", "C": "...", "D": "..." }, // HANYA untuk "pilihan_ganda" & "pilihan_ganda_kompleks"
            "pairs": [ { "premise": "Premis 1", "response": "Respon Pasangan 1" } ], // HANYA untuk "menjodohkan"
            "items": [ "Langkah 2", "Langkah 1", "Langkah 3" ], // HANYA untuk "mengurutkan" (shuffled/diacak)
            "statements": [ { "statement": "Pernyataan 1", "answer": "Benar" }, { "statement": "Pernyataan 2", "answer": "Salah" } ], // HANYA untuk "benar_salah"
            
            // "answer" format:
            // - Jika "pilihan_ganda": string kunci (misal "A")
            // - Jika "pilihan_ganda_kompleks": array kunci (misal ["A", "C"])
            // - Jika "mengurutkan": array berisi item dengan urutan kronologis/logis BENAR (misal ["Langkah 1", "Langkah 2", "Langkah 3"])
            // - Jika "menjodohkan": "Sesuai Pasangan"
            // - Jika "benar_salah": "Benar/Salah Tertera"
            "answer": "A", 
            
            "explanation": "pembahasan lengkap...",
            "analysis": "Analisa Butir Soal: Mengapa soal ini valid & materi apa yang diukur",
            "level": "C1/C2/C3/C4/C5/C6",
            "subtopic": "sub-materi",
            "tags": ["tag1"]
          }
        ]
      }

      PANDUAN:
      1. Berikan stimulus (kasus, kutipan teks, tabel, data) bila memungkinkan, terutama untuk soal HOTS.
      2. Pastikan kata kerja operasional (KKO) di dalam setiap soal sesuai dengan level kognitif yang ditentukan.
      3. Di dalam array "questions", kombinasikan types yang diperbolehkan secara variatif dan proporsional.
      4. Kisi-kisi harus sinkron dengan butir soal yang dibuat.
      5. Analisa butir soal harus memberikan wawasan pedagogis bagi guru dan menjelaskan mengapa soal tsb HOTS/MOTS/LOTS.`;

      const text = await maestroAI({
        prompt,
        systemInstruction:
          "Anda adalah pakar pembuat soal HOTS IPS & Kisi-Kisi Pendidikan. HANYA keluarkan JSON murni.",
      });

      const cleanJson = text.replace(/```json|```/g, "").trim();
      const resultObj = JSON.parse(cleanJson);

      setBankSoalQuestions(resultObj.questions || []);
      setBankSoalKisiKisi(resultObj.kisi_kisi || []);
      setBankSoalResult(resultObj);
      setBankSoalMode("result");
      setBankSoalView("questions");
      setStatus({
        type: "success",
        message: "Bank Soal & Kisi-Kisi Profesional berhasil diciptakan!",
      });
    } catch (err) {
      console.error("Bank Soal AI error:", err);
      setStatus({
        type: "error",
        message:
          "Gagal membuat Bank Soal. Pastikan dokumen tidak terlalu besar.",
      });
    } finally {
      setIsGeneratingBankSoal(false);
    }
  };

  const qToMarkdown = (questions: any[]) => {
    return questions
      .map((q, idx) => {
        let body = "";
        if (q.type === "menjodohkan" && q.pairs) {
          body = `**Pasangkan Premis dengan Respon yang Tepat:**\n` +
            q.pairs.map((p: any, i: number) => `- Premis ${i+1}: ${p.premise} ----> Respon: ${p.response}`).join("\n");
        } else if (q.type === "mengurutkan" && q.items) {
          body = `**Urutan Langkah/Kronologi (Acak):**\n` +
            q.items.map((it: any, i: number) => `${i+1}. ${it}`).join("\n") +
            `\n\n**Urutan Benar:**\n` +
            (Array.isArray(q.answer) ? q.answer.join(" -> ") : String(q.answer));
        } else if (q.type === "benar_salah" && q.statements) {
          body = `**Berikut Pernyataan dan Evaluasi Benar/Salah:**\n` +
            q.statements.map((s: any, i: number) => `- Pernyataan ${i+1}: "${s.statement}" [Kunci: **${s.answer}**]`).join("\n");
        } else {
          // Default MCQ / Multi-select
          const optsText = q.options ? Object.entries(q.options).map(([k, v]) => `- **${k}.** ${v}`).join("\n") : "Tidak ada opsi pilihan.";
          body = `**Pilihan Jawaban:**\n${optsText}`;
        }

        const ansText = typeof q.answer === "object" && q.answer !== null ? JSON.stringify(q.answer) : String(q.answer);

        return `
### [SOAL ${idx + 1}] - LEVEL ${q.level || "C4"} ${q.subtopic ? `(${q.subtopic})` : ""}

${q.question}

${body}

---
**KUNCI JAWABAN:** ${ansText}

**ANALISIS & PEMBAHASAN:**
${q.explanation || "Tidak ada pembahasan."}

${q.tags && q.tags.length > 0 ? `*Tags: ${q.tags.join(", ")}*` : ""}
`;
      })
      .join("\n\n---\n\n");
  };

  const handleSaveBankSoalToDrive = async () => {
    if (needsDriveAuth) {
      await handleLogin();
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setStatus({ type: "error", message: "Token akses tidak ditemukan." });
      setNeedsDriveAuth(true);
      return;
    }

    setIsUploadingBankSoalToDrive(true);
    try {
      const pdfBlob = await exportPDF(
        "bank-soal-result-content",
        `BankSoal_${bankSoalGrade}_${bankSoalTopic.replace(/\s+/g, "_")}`,
        false,
      );
      if (!pdfBlob) throw new Error("Gagal menghasilkan file PDF");

      await uploadToDrive(
        token,
        `BankSoal_Maestro_${bankSoalTopic}.pdf`,
        pdfBlob,
      );
      setStatus({
        type: "success",
        message: "Bank Soal berhasil disimpan ke Google Drive!",
      });
    } catch (err: any) {
      setStatus({
        type: "error",
        message: `Gagal simpan ke Drive: ${err.message}`,
      });
    } finally {
      setIsUploadingBankSoalToDrive(false);
    }
  };

  const SidebarItem = ({
    id,
    icon: Icon,
    label,
    color,
  }: {
    id: Tab;
    icon: any;
    label: string;
    color: string;
  }) => {
    const isMainAccent = id === "beranda";
    const activeColor = isMainAccent ? accentColor : color;
    const isActive = activeTab === id;

    return (
      <button
        onClick={() => {
          setActiveTab(id);
          setIsMobileMenuOpen(false);
        }}
        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
          isActive
            ? `text-white shadow-lg shadow-${activeColor}-500/20`
            : `text-slate-500 hover:text-${activeColor}-600 dark:hover:text-${activeColor}-400 hover:bg-${activeColor}-50/50 dark:hover:bg-${activeColor}-900/10`
        }`}
      >
        {isActive && (
          <motion.div
            layoutId="active-bg"
            className={`absolute inset-0 bg-gradient-to-r from-${activeColor}-600 to-${activeColor}-500 z-0`}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <div className="relative z-10 flex items-center gap-4 w-full">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300 ${isActive ? "bg-white/20" : `bg-${activeColor}-500/10 group-hover:scale-110`}`}
          >
            <Icon
              className={`w-4.5 h-4.5 ${isActive ? "text-white" : `text-${activeColor}-500`}`}
            />
          </div>
          <span
            className={`font-black text-sm tracking-tight transition-all duration-300 ${isActive ? "text-white" : "group-hover:translate-x-1"}`}
          >
            {label}
          </span>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="ml-auto"
            >
              <ChevronRight className="w-4 h-4 text-white/70" />
            </motion.div>
          )}
        </div>
      </button>
    );
  };

  const getFilteredMaterials = () => {
    return (materiView === "drive" ? materials : offlineMaterials)
      .filter((f) => {
        const matchesSearch = f.name
          .toLowerCase()
          .includes(materialSearch.toLowerCase());
        if (!matchesSearch) return false;

        if (materiFilter === "all") return true;

        const isFolder = f.mimeType === "application/vnd.google-apps.folder";
        if (materiFilter === "folder") return isFolder;
        if (isFolder) return false;

        const mime = (f.mimeType || "").toLowerCase();
        const ext = f.name.toLowerCase().split(".").pop();

        if (materiFilter === "pdf")
          return mime.includes("pdf") || ext === "pdf";
        if (materiFilter === "docx")
          return (
            mime.includes("word") ||
            mime.includes("officedocument.wordprocessingml") ||
            ext === "docx" ||
            ext === "doc"
          );
        if (materiFilter === "image")
          return (
            mime.includes("image/") ||
            ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")
          );

        return true;
      })
      .sort((a, b) => {
        if (materialSort === "name") {
          return a.name.localeCompare(b.name);
        } else if (materialSort === "newest") {
          const dateA = new Date(a.createdTime || Date.now()).getTime();
          const dateB = new Date(b.createdTime || Date.now()).getTime();
          return dateB - dateA;
        } else if (materialSort === "oldest") {
          const dateA = new Date(a.createdTime || Date.now()).getTime();
          const dateB = new Date(b.createdTime || Date.now()).getTime();
          return dateA - dateB;
        }
        return 0;
      });
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
              <div
                className={`w-24 h-24 bg-${accentColor}-600 rounded-[32px] flex items-center justify-center shadow-2xl shadow-${accentColor}-500/40 relative`}
              >
                <Sparkles className="w-12 h-12 text-white animate-pulse" />
                <div
                  className={`absolute -inset-4 border-4 border-${accentColor}-500/20 rounded-[48px] animate-[ping_3s_infinite]`}
                ></div>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-black tracking-tighter">
                  IPS MAESTRO{" "}
                  <span className="text-slate-500 text-2xl font-light">
                    v2.1
                  </span>
                </h1>
                <div className="h-1 w-24 bg-gradient-to-r from-transparent via-slate-500 to-transparent mx-auto"></div>
              </div>

              <div className="max-w-md bg-white/5 backdrop-blur-md p-8 rounded-[40px] border border-white/10 shadow-xl">
                <p className="text-xl font-medium leading-relaxed italic text-slate-300">
                  "{randomQuote}"
                </p>
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

      <div
        className={`min-h-screen ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"} flex flex-col md:flex-row ${activeFont} selection:bg-${accentColor}-100 dark:selection:bg-${accentColor}-900 selection:text-${accentColor}-900 dark:selection:text-${accentColor}-100 transition-colors duration-300`}
      >
        {/* Mobile Header */}
        <div
          className={`md:hidden flex items-center justify-between p-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"} border-b sticky top-0 z-50`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 bg-${accentColor}-600 rounded-xl flex items-center justify-center shadow-lg shadow-${accentColor}-100 dark:shadow-none`}
            >
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <span
              className={`font-black tracking-tighter ${isDarkMode ? "text-white" : "text-slate-900"}`}
            >
              IPS MAESTRO
            </span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-500"
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Sidebar - Off-canvas mobile drawer with smooth interactions */}
        <div
          className={`fixed inset-0 z-40 md:relative md:inset-auto md:z-auto ${isMobileMenuOpen ? "visible" : "invisible md:visible"} transition-all duration-300`}
        >
          {/* Backdrop overlay (dim & blur) for mobile */}
          <div
            className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm md:hidden transition-opacity duration-300 ${
              isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer panel with responsive height, scrolling, and custom styling */}
          <div
            className={`fixed md:relative top-0 bottom-0 left-0 z-50 md:z-auto w-72 h-full ${isDarkMode ? "bg-slate-900 border-slate-800 shadow-none" : "bg-white border-slate-100 shadow-2xl shadow-slate-200"} border-r p-8 flex flex-col transition-transform duration-300 ease-out transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} overflow-y-auto custom-scrollbar`}
          >
            {/* Mobile Panel Header (with Close Button) */}
            <div className="flex md:hidden items-center justify-between mb-8 pb-4 border-b border-dashed border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 bg-${accentColor}-600 rounded-xl flex items-center justify-center shadow-lg relative`}
                >
                  <Sparkles className="text-white w-6 h-6" />
                </div>
                <span
                  className={`font-black tracking-tighter ${isDarkMode ? "text-white" : "text-slate-900"}`}
                >
                  IPS MAESTRO
                </span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className={`p-2 rounded-xl transition-colors ${
                  isDarkMode
                    ? "hover:bg-slate-800 text-slate-450 hover:text-rose-400"
                    : "hover:bg-slate-150 text-slate-500 hover:text-rose-500"
                }`}
                title="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="hidden md:flex items-center gap-4 mb-12 px-2">
              <div
                className={`w-12 h-12 bg-${accentColor}-600 rounded-2xl flex items-center justify-center shadow-xl shadow-${accentColor}-200 dark:shadow-none rotate-3`}
              >
                <Sparkles className="text-white w-7 h-7" />
              </div>
              <div>
                <h1
                  className={`font-black text-xl tracking-tighter leading-none ${isDarkMode ? "text-white" : "text-slate-900"}`}
                >
                  IPS MAESTRO
                </h1>
                <p
                  className={`text-[10px] font-bold text-${accentColor}-500 uppercase tracking-widest mt-1`}
                >
                  Guru Digital v2.1
                </p>
              </div>
            </div>

            <div className="space-y-2 flex-1">
              <SidebarItem
                id="beranda"
                icon={LayoutGrid}
                label="Dashboard"
                color={accentColor}
              />
              <SidebarItem
                id="lkpd"
                icon={FileSpreadsheet}
                label="LKPD Generator"
                color="emerald"
              />
              <SidebarItem
                id="chatbot"
                icon={MessageSquare}
                label="Diskusi AI"
                color="rose"
              />
              <SidebarItem
                id="rpp"
                icon={FileText}
                label="RPP Creator"
                color="blue"
              />
              <SidebarItem
                id="silabus"
                icon={LayoutList}
                label="Silabus Generator"
                color="teal"
              />
              <SidebarItem
                id="penilaian"
                icon={BarChart3}
                label="Analisis Penilaian"
                color="rose"
              />
              <SidebarItem
                id="materi"
                icon={FolderRoot}
                label="Manajemen Materi"
                color="sky"
              />
              <SidebarItem
                id="bank_soal"
                icon={ClipboardList}
                label="Bank Soal"
                color="slate"
              />
              <SidebarItem
                id="jurnal"
                icon={PenLine}
                label="Jurnal Guru"
                color="amber"
              />
            </div>

            <div
              className={`mt-auto space-y-2 pt-8 border-t ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}
            >
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-black text-sm transition-all group ${
                  isDarkMode
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-slate-100/50 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isDarkMode ? "bg-indigo-500/20 group-hover:scale-110" : "bg-amber-500/10 group-hover:scale-110"}`}
                  >
                    {isDarkMode ? (
                      <Moon className="w-4.5 h-4.5 text-indigo-400" />
                    ) : (
                      <Sun className="w-4.5 h-4.5 text-amber-500" />
                    )}
                  </div>
                  <span className="tracking-tight">
                    {isDarkMode ? "Mode Gelap" : "Mode Terang"}
                  </span>
                </div>
                <div
                  className={`w-10 h-5 rounded-full p-1 transition-colors ${isDarkMode ? "bg-indigo-500" : "bg-slate-300"}`}
                >
                  <div
                    className={`w-3 h-3 bg-white rounded-full transition-transform ${isDarkMode ? "translate-x-5" : "translate-x-0"}`}
                  />
                </div>
              </button>
              <button
                onClick={() => setActiveTab("pengaturan")}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black text-sm relative overflow-hidden group ${
                  activeTab === "pengaturan"
                    ? "text-white"
                    : "text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                {activeTab === "pengaturan" && (
                  <motion.div
                    layoutId="active-bg"
                    className="absolute inset-0 bg-slate-900 dark:bg-white z-0"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className="relative z-10 flex items-center gap-4 w-full">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${activeTab === "pengaturan" ? (isDarkMode ? "bg-slate-900/20" : "bg-white/20") : "bg-slate-500/10 group-hover:scale-110"}`}
                  >
                    <Settings
                      className={`w-4.5 h-4.5 ${activeTab === "pengaturan" ? (isDarkMode ? "text-slate-900" : "text-white") : "text-slate-500"}`}
                    />
                  </div>
                  <span
                    className={`tracking-tight ${activeTab === "pengaturan" ? (isDarkMode ? "text-slate-900" : "text-white") : "group-hover:translate-x-1 transition-transform"}`}
                  >
                    Pengaturan
                  </span>
                  {activeTab === "pengaturan" && (
                    <ChevronRight
                      className={`ml-auto w-4 h-4 ${isDarkMode ? "text-slate-900/70" : "text-white/70"}`}
                    />
                  )}
                </div>
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
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`fixed top-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border ${
                  status.type === "success"
                    ? isDarkMode
                      ? "bg-emerald-950 border-emerald-900 text-emerald-400"
                      : "bg-emerald-50 border-emerald-100 text-emerald-800"
                    : isDarkMode
                      ? "bg-rose-950 border-rose-900 text-rose-400"
                      : "bg-rose-50 border-rose-100 text-rose-800"
                }`}
              >
                {status.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="font-bold text-sm">{status.message}</span>
                <button
                  onClick={() => setStatus({ type: null, message: "" })}
                  className="ml-4 p-1 hover:bg-white/50 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Leaked API Key Alert Banner */}
          {status.type === "error" && (status.message.includes("Kunci API") || status.message.includes("403") || status.message.includes("bocor")) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-8 p-6 rounded-[32px] border-2 ${isDarkMode ? "bg-rose-950/40 border-rose-900/60 text-rose-200" : "bg-rose-50 border-rose-100 text-rose-900"} text-left space-y-4`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-200 dark:shadow-none">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-lg tracking-tight">Kunci API (API Key) Terbocor atau Tidak Aktif</h3>
                  <p className="text-xs font-semibold opacity-90 leading-relaxed">
                    Sistem mendeteksi bahwa kunci API Gemini Anda telah dinonaktifkan secara otomatis oleh Google karena teridentifikasi bocor (misalnya, jika kode terunggah ke repositori publik di GitHub). Jangan khawatir, Anda dapat memperbaruinya dalam 1 menit dengan mengikuti langkah-langkah mudah di bawah ini:
                  </p>
                </div>
              </div>

              <div className="pl-0 md:pl-16 space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-bold text-[11px] uppercase tracking-wider text-slate-400">
                  <div className="p-5 bg-white/60 dark:bg-slate-900/40 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-2">
                    <span className="text-rose-500 font-extrabold text-xs block">LANGKAH 1</span>
                    <p className={`text-xs ${isDarkMode ? "text-slate-300 font-medium" : "text-slate-700 font-medium"} normal-case leading-normal`}>
                      Buka Google AI Studio di <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline hover:text-blue-600 font-black">aistudio.google.com</a> dan buat kunci API baru (Klik tombol <b>Get API key</b>).
                    </p>
                  </div>
                  <div className="p-5 bg-white/60 dark:bg-slate-900/40 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-2">
                    <span className="text-rose-500 font-extrabold text-xs block">LANGKAH 2</span>
                    <p className={`text-xs ${isDarkMode ? "text-slate-300 font-medium" : "text-slate-700 font-medium"} normal-case leading-normal`}>
                      Kunjungi dasbor Google AI Studio tempat ini dijalankan, buka panel <b>Settings (Setelan)</b> di pojok kiri bawah, lalu klik sub-menu <b>Secrets</b>.
                    </p>
                  </div>
                  <div className="p-5 bg-white/60 dark:bg-slate-900/40 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-2">
                    <span className="text-rose-500 font-extrabold text-xs block">LANGKAH 3</span>
                    <p className={`text-xs ${isDarkMode ? "text-slate-300 font-medium" : "text-slate-700 font-medium"} normal-case leading-normal`}>
                      Cari variabel bernama <b>GEMINI_API_KEY</b> dan ganti nilainya dengan kunci API baru yang baru Anda buat. Simpan perubahan dan lakukan refresh pada halaman web!
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 text-[10px] uppercase font-black tracking-widest text-[#d97706] dark:text-[#fbbf24]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Kunci Anda aman secara penuh 100% di server privat jika ditaruh di Secrets panel.</span>
                </div>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === "beranda" && (
              <motion.div
                key="beranda"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-12"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h1
                      className={`text-4xl md:text-5xl font-black tracking-tight leading-tight ${isDarkMode ? "text-white" : "text-slate-800"}`}
                    >
                      Selamat Datang, <br />
                      <span
                        className={`bg-gradient-to-r from-${accentColor}-600 to-${accentColor}-400 bg-clip-text text-transparent`}
                      >
                        {user?.displayName || "Bapak/Ibu Guru!"}
                      </span>
                    </h1>
                    <p
                      className={`font-medium mt-4 text-lg ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Siap membantu Anda mengelola pembelajaran hari ini.
                    </p>
                  </div>
                  <div className="flex -space-x-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`w-14 h-14 rounded-full border-4 ${isDarkMode ? "border-slate-950 bg-slate-800" : "border-white bg-slate-200"} overflow-hidden shadow-xl shadow-black/10 transition-transform hover:scale-110 hover:z-10 cursor-pointer`}
                      >
                        <img
                          src={`https://i.pravatar.cc/100?img=${i + 10}`}
                          alt="User"
                        />
                      </div>
                    ))}
                    <div
                      className={`w-14 h-14 rounded-full border-4 ${isDarkMode ? "border-slate-950 bg-slate-800" : "border-white bg-indigo-50"} flex items-center justify-center shadow-xl shadow-black/10 text-${accentColor}-500 transition-transform hover:scale-110 hover:z-10 cursor-pointer`}
                    >
                      <Plus className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Promo Card */}
                  {(() => {
                    const gradients: Record<string, string> = {
                      indigo: "from-indigo-600 to-violet-700",
                      emerald: "from-emerald-600 to-teal-700",
                      rose: "from-rose-600 to-pink-700",
                      amber: "from-amber-500 to-orange-600",
                      blue: "from-blue-600 to-indigo-700",
                      violet: "from-violet-600 to-purple-700",
                      pink: "from-pink-600 to-rose-700",
                      sky: "from-sky-600 to-blue-700",
                      orange: "from-orange-500 to-red-600",
                      teal: "from-teal-600 to-emerald-700",
                    };
                    const currentGradient =
                      gradients[accentColor] || gradients.indigo;

                    return (
                      <div
                        className={`lg:col-span-2 bg-gradient-to-br ${currentGradient} rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-${accentColor}-200 dark:shadow-none group`}
                      >
                        <div className="relative z-10 max-w-lg">
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black tracking-widest uppercase mb-6">
                            <Sparkles className="w-3 h-3" /> Baru: LKPD
                            Generator
                          </div>
                          <h3 className="text-4xl font-black mb-4 leading-tight tracking-tight">
                            Buat Lembar Kerja Siswa Dalam Detik!
                          </h3>
                          <p className="text-white/80 font-bold text-lg mb-8 leading-relaxed">
                            Hemat waktu berjam-jam. Biarkan AI merancang LKPD
                            yang estetik dan sesuai Kurikulum Merdeka untuk
                            Anda.
                          </p>
                          <button
                            onClick={() => setActiveTab("lkpd")}
                            className={`group/btn flex items-center gap-3 px-8 py-4 bg-white text-${accentColor}-600 rounded-2xl font-black text-sm shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95`}
                          >
                            Mulai Sekarang{" "}
                            <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                          </button>
                        </div>
                        <Sparkles className="absolute -bottom-10 -right-10 w-80 h-80 text-white/10 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
                      </div>
                    );
                  })()}

                  {/* Stats / Mini Card */}
                  <div
                    className={`bg-white dark:bg-slate-900 rounded-[40px] p-10 border ${isDarkMode ? "border-slate-800" : "border-slate-100"} shadow-xl shadow-slate-100 dark:shadow-none flex flex-col`}
                  >
                    <div className="w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-rose-100 dark:shadow-none mb-8 self-end -mr-4 -mt-4 rotate-6">
                      <MessageSquare className="w-8 h-8" />
                    </div>
                    <h4
                      className={`text-2xl font-black mb-2 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                    >
                      Punya Pertanyaan?
                    </h4>
                    <p
                      className={`font-bold mb-8 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Diskusikan materi IPS atau strategi mengajar dengan
                      asisten AI Maestro.
                    </p>
                    <button
                      onClick={() => setActiveTab("chatbot")}
                      className={`mt-auto w-full py-4 ${isDarkMode ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-900 hover:bg-slate-800"} text-white rounded-2xl font-bold transition-colors shadow-lg`}
                    >
                      Buka Chatbot AI
                    </button>
                  </div>
                  
                  {/* Laporan Bulanan Card */}
                  <div className={`lg:col-span-3 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"} rounded-[40px] p-10 border shadow-xl shadow-slate-100 dark:shadow-none flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-${accentColor}-300 transition-colors`}>
                     <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 bg-${accentColor}-500/10 rounded-2xl flex items-center justify-center text-${accentColor}-500 group-hover:scale-110 transition-transform`}>
                           <Printer className="w-8 h-8" />
                        </div>
                        <div>
                           <h4 className={`text-2xl font-black mb-2 ${isDarkMode ? "text-white" : "text-slate-800"}`}>Laporan Aktivitas Bulanan</h4>
                           <p className={`font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Cetak ringkasan kinerja mengajar Anda (RPP, Bank Soal, Jurnal) bulan ini.</p>
                        </div>
                     </div>
                     <button
                        onClick={handlePrintMonthlyReport}
                        className={`px-8 py-4 bg-${accentColor}-600 hover:bg-${accentColor}-700 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-${accentColor}-500/20 active:scale-95 whitespace-nowrap`}
                     >
                        Cetak Laporan PDF
                     </button>
                  </div>

                </div>
              </motion.div>
            )}

            {activeTab === "lkpd" && (
              <motion.div
                key="lkpd"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <header className="mb-0">
                  <h2
                    className={`text-4xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-800"}`}
                  >
                    LKPD{" "}
                    <span className="text-emerald-500">Generator Maestro</span>
                  </h2>
                  <p
                    className={`font-medium mt-2 text-lg ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Rancang Lembar Kerja Peserta Didik profesional untuk siswa
                    SMP.
                  </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                  {/* Form Sidebar Column */}
                  <div className="lg:col-span-4 sticky top-8 space-y-6">
                    <div
                      className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-100"} p-8 rounded-[40px] border space-y-8`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <span
                          className={`font-black text-sm uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-800"}`}
                        >
                          Konfigurasi LKPD
                        </span>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic px-1">
                            Topik / Materi
                          </label>
                          <textarea
                            value={lkpdTopic}
                            onChange={(e) => setLkpdTopic(e.target.value)}
                            placeholder="Contoh: Dampak Interaksi Antar Ruang di Asia..."
                            className={`w-full ${isDarkMode ? "bg-slate-800/50 border-slate-700 text-white" : "bg-slate-50 border-slate-100/50"} border-2 rounded-[24px] p-5 text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all min-h-[120px] placeholder:opacity-30`}
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic px-1">
                            Tingkat Kelas
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {["VII", "VIII", "IX"].map((g) => (
                              <button
                                key={g}
                                onClick={() => setLkpdGrade(g)}
                                className={`flex-1 min-w-[70px] py-4 rounded-2xl font-black text-[11px] transition-all border-2 ${lkpdGrade === g ? "bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-500/20" : isDarkMode ? "bg-slate-800 border-slate-700 text-slate-500" : "bg-white border-slate-100 text-slate-400 hover:border-emerald-200"}`}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic px-1">
                            Tipe Aktivitas
                          </label>
                          <select
                            value={lkpdType}
                            onChange={(e) => setLkpdType(e.target.value)}
                            className={`w-full ${isDarkMode ? "bg-slate-800/50 border-slate-700 text-white" : "bg-slate-50 border-slate-100/50"} border-2 rounded-[20px] p-4 text-xs font-black focus:outline-none appearance-none`}
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
                          onClick={handleGenerateLKPD}
                          disabled={!lkpdTopic || isGeneratingLkpd}
                          className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-black text-sm tracking-[0.2em] uppercase shadow-2xl shadow-emerald-500/20 hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-40"
                        >
                          {isGeneratingLkpd ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Sparkles className="w-5 h-5" />
                          )}
                          Mulai Generate
                        </button>
                      </div>
                    </div>

                    {/* AI Stylist Customization Card (LKPD) */}
                    <div
                      className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-100"} p-8 rounded-[40px] border space-y-6`}
                    >
                      <button
                        onClick={() => setIsLkpdStylistOpen(!isLkpdStylistOpen)}
                        className="w-full flex items-center justify-between group hover:opacity-80 transition-opacity"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 ${getModuleThemeClasses(lkpdTheme).bgLight} ${getModuleThemeClasses(lkpdTheme).primaryText} rounded-xl flex items-center justify-center transition-all`}
                          >
                            <Palette className="w-5 h-5" />
                          </div>
                          <span
                            className={`font-black text-xs uppercase tracking-widest text-left ${isDarkMode ? "text-white" : "text-slate-800"}`}
                          >
                            🎨 Tema & Tata Letak LKPD
                          </span>
                        </div>
                        <span className="text-slate-400 font-bold text-xs">
                          {isLkpdStylistOpen ? "Tutup" : "Sesuaikan"} &rarr;
                        </span>
                      </button>

                      {isLkpdStylistOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800"
                        >
                          {/* Tema Warna (Color Theme) */}
                          <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                              Tema Warna Dokumen
                            </label>
                            <div className="grid grid-cols-6 gap-2">
                              {[
                                {
                                  id: "emerald",
                                  hex: "#10b981",
                                  label: "Emerald",
                                },
                                { id: "blue", hex: "#3b82f6", label: "Blue" },
                                {
                                  id: "indigo",
                                  hex: "#6366f1",
                                  label: "Indigo",
                                },
                                { id: "amber", hex: "#f59e0b", label: "Amber" },
                                { id: "rose", hex: "#f43f5e", label: "Rose" },
                                { id: "teal", hex: "#14b8a6", label: "Teal" },
                              ].map((themeOpt) => (
                                <button
                                  key={themeOpt.id}
                                  onClick={() =>
                                    setLkpdTheme(themeOpt.id as any)
                                  }
                                  className={`w-full aspect-square rounded-xl transition-all border-2 flex items-center justify-center ${lkpdTheme === themeOpt.id ? "border-slate-800 dark:border-white scale-110 shadow" : "border-transparent opacity-60 hover:opacity-100"}`}
                                  style={{ backgroundColor: themeOpt.hex }}
                                  title={themeOpt.label}
                                >
                                  {lkpdTheme === themeOpt.id && (
                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Tipografi (Font Selection) */}
                          <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                              Tipografi (Font)
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: "font-inter", label: "Inter" },
                                { id: "font-outfit", label: "Outfit" },
                                { id: "font-space", label: "Space Grotesk" },
                                {
                                  id: "font-playfair",
                                  label: "Playfair Display",
                                },
                              ].map((fontOpt) => (
                                <button
                                  key={fontOpt.id}
                                  onClick={() => setLkpdFont(fontOpt.id as any)}
                                  className={`py-2 px-3 border rounded-xl text-[9px] font-black tracking-widest uppercase transition-all ${lkpdFont === fontOpt.id ? `bg-${getModuleThemeClasses(lkpdTheme).primary} border-${getModuleThemeClasses(lkpdTheme).primary} text-white` : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"}`}
                                >
                                  {fontOpt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Tata Letak/Layout Style */}
                          <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                              Tata Letak (Layout)
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { id: "classic", label: "Klasik" },
                                { id: "modern", label: "Modern" },
                                { id: "minimalist", label: "Minimalis" },
                              ].map((layoutOpt) => (
                                <button
                                  key={layoutOpt.id}
                                  onClick={() =>
                                    setLkpdLayout(layoutOpt.id as any)
                                  }
                                  className={`py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${lkpdLayout === layoutOpt.id ? `bg-${getModuleThemeClasses(lkpdTheme).primary} border-${getModuleThemeClasses(lkpdTheme).primary} text-white` : "border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400"}`}
                                >
                                  {layoutOpt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Result */}
                  <div className="lg:col-span-8">
                    {lkpdResult ? (
                      <motion.div
                        className="space-y-6"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      >
                        <div
                          className={`flex justify-between items-center ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"} p-4 rounded-2xl border`}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">
                              Preview LKPD Maestro
                            </span>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                              {["pdf", "docx"].map((fmt) => (
                                <button
                                  key={fmt}
                                  onClick={() =>
                                    setLkpdExportFormat(fmt as "pdf" | "docx")
                                  }
                                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${lkpdExportFormat === fmt ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                                >
                                  {fmt}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={handleSaveToDrive}
                              disabled={isUploadingToDrive}
                              className={`flex items-center gap-2 px-5 py-2.5 ${isDarkMode ? "bg-indigo-900 text-indigo-100 hover:bg-indigo-800" : "bg-indigo-500 text-white hover:bg-indigo-600"} rounded-xl text-xs font-bold shadow-lg transition-all disabled:opacity-50`}
                            >
                              {isUploadingToDrive ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <HardDrive className="w-4 h-4" />
                              )}
                              Simpan ke Drive
                            </button>
                            <button
                              onClick={() => {
                                const fileName = `LKPD_${lkpdGrade}_${lkpdTopic.substring(0, 20)}`;
                                if (lkpdExportFormat === "pdf")
                                  exportPDF("lkpd-content", fileName);
                                else exportDOCX("lkpd-content", fileName);
                              }}
                              className={`flex items-center gap-2 px-5 py-2.5 bg-${getModuleThemeClasses(lkpdTheme).primary} text-white rounded-xl text-xs font-bold hover:brightness-110 shadow-lg shadow-${getModuleThemeClasses(lkpdTheme).primary}/20 transition-all`}
                            >
                              <Download className="w-4 h-4" /> Download{" "}
                              {lkpdExportFormat.toUpperCase()}
                            </button>
                          </div>
                        </div>

                        <div
                          id="lkpd-content"
                          className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"} p-12 rounded-[40px] border shadow-2xl shadow-slate-100 dark:shadow-none min-h-[800px] relative overflow-hidden ${lkpdFont}`}
                        >
                          <div
                            id="lkpd-result-content"
                            className="relative z-10"
                          >
                            {/* Header Decoration based on layout & theme */}
                            {lkpdLayout === "modern" && (
                              <div
                                className={`absolute top-0 left-0 right-0 h-4 bg-gradient-to-r ${getModuleThemeClasses(lkpdTheme).gradient}`}
                              />
                            )}
                            {lkpdLayout === "classic" && (
                              <div
                                className={`absolute top-0 left-0 right-0 h-2 bg-${getModuleThemeClasses(lkpdTheme).primary} border-b`}
                              />
                            )}
                            {lkpdLayout === "minimalist" && null}

                            <div className="flex flex-col md:flex-row justify-between items-start mb-8 pb-6 border-b border-dashed dark:border-slate-800">
                              <div className="flex items-center gap-4">
                                <div
                                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${getModuleThemeClasses(lkpdTheme).gradient}`}
                                >
                                  <FileSpreadsheet className="w-6 h-6" />
                                </div>
                                <div>
                                  <h3
                                    className={`text-xl font-black ${isDarkMode ? "text-white" : "text-slate-900"} uppercase tracking-tighter`}
                                  >
                                    Lembar Kerja Siswa (LKPD)
                                  </h3>
                                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    IPS Maestro Stylist •{" "}
                                    {lkpdLayout.toUpperCase()}{" "}
                                    {lkpdTheme.toUpperCase()}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div
                              className={`prose ${isDarkMode ? "prose-invert" : "prose-slate"} max-w-none 
                              prose-headings:font-black prose-headings:tracking-tight prose-headings:uppercase
                              prose-h1:text-3xl prose-h1:mb-6 prose-h1:${getModuleThemeClasses(lkpdTheme).textStrong}
                              prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-l-4 prose-h2:${getModuleThemeClasses(lkpdTheme).border} prose-h2:pl-4
                              prose-strong:${getModuleThemeClasses(lkpdTheme).textStrong}
                              prose-ul:list-none prose-ul:pl-0
                              prose-li:relative prose-li:pl-8 prose-li:mb-2
                            `}
                            >
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  a: ({ node, ...props }) => (
                                    <a
                                      {...props}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`underline font-bold text-${getModuleThemeClasses(lkpdTheme).primary}`}
                                    />
                                  ),
                                  img: ({ node, ...props }) => (
                                    <img
                                      {...props}
                                      className="rounded-2xl shadow-lg object-cover w-full max-h-96 my-8"
                                      referrerPolicy="no-referrer"
                                    />
                                  ),
                                  li: ({ node, children, ...props }) => (
                                    <li
                                      {...props}
                                      className="relative pl-8 mb-3 group"
                                    >
                                      {lkpdLayout === "modern" ? (
                                        <span
                                          className={`absolute left-0 top-1.5 w-5 h-5 ${getModuleThemeClasses(lkpdTheme).bgLight} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}
                                        >
                                          <div
                                            className={`w-1.5 h-1.5 ${getModuleThemeClasses(lkpdTheme).fill} rounded-full`}
                                          />
                                        </span>
                                      ) : lkpdLayout === "classic" ? (
                                        <span className="absolute left-0 top-1.5 flex items-center justify-center font-bold text-slate-500">
                                          •
                                        </span>
                                      ) : (
                                        <span
                                          className={`absolute left-0 top-1.5 w-1.5 h-1.5 ${getModuleThemeClasses(lkpdTheme).fill} rounded-sm`}
                                        />
                                      )}
                                      <div
                                        className={`${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
                                      >
                                        {children}
                                      </div>
                                    </li>
                                  ),
                                  blockquote: ({
                                    node,
                                    children,
                                    ...props
                                  }) => (
                                    <blockquote
                                      {...props}
                                      className={`p-6 rounded-[24px] border-l-4 ${getModuleThemeClasses(lkpdTheme).border} ${lkpdLayout === "modern" ? `${getModuleThemeClasses(lkpdTheme).bgLight} my-6` : lkpdLayout === "classic" ? "bg-slate-50 dark:bg-slate-800" : "italic my-4 border-l-2 pl-4"} relative overflow-hidden`}
                                    >
                                      <div className="relative z-10 text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                                        {children}
                                      </div>
                                    </blockquote>
                                  ),
                                }}
                              >
                                {lkpdResult}
                              </ReactMarkdown>
                            </div>

                            {/* Footer Decoration */}
                            <div
                              className={`mt-12 pt-8 border-t ${isDarkMode ? "border-slate-800" : "border-slate-100"} flex justify-between items-end opacity-40 italic text-[10px]`}
                            >
                              <div>Goresan Pena Digital: IPS Maestro AI</div>
                              <div className="font-bold tracking-widest uppercase">
                                Edisi Merdeka {new Date().getFullYear()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="bg-white border-4 border-dashed border-slate-100 rounded-[40px] h-full min-h-[400px] flex flex-col items-center justify-center p-12 text-center group">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                          <BookOpen className="w-10 h-10 text-slate-300" />
                        </div>
                        <h5 className="text-xl font-black text-slate-400">
                          Belum Ada LKPD Dibuat
                        </h5>
                        <p className="max-w-xs text-slate-400 font-bold text-sm mt-2 opacity-70">
                          Gunakan formulir disamping untuk merancang lembar
                          kerja siswa yang kreatif dalam sekejap.
                        </p>
                        {isGeneratingLkpd && (
                          <div className="mt-12 flex flex-col items-center">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
                            <span className="text-emerald-600 font-black text-xs uppercase tracking-widest animate-pulse">
                              Meracik Materi...
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "chatbot" && (
              <motion.div
                key="chatbot"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col h-[calc(100dvh-160px)] md:h-[calc(100vh-140px)]"
              >
                <header className="mb-6 flex justify-between items-end">
                  <div>
                    <h2
                      className={`text-3xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-800"}`}
                    >
                      Diskusi <span className="text-rose-500">AI Maestro</span>
                    </h2>
                    <p
                      className={`font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Asisten cerdas untuk materi, strategi, dan pedagogi guru
                      IPS.
                    </p>
                  </div>
                  <button
                    onClick={() => setChatMessages([])}
                    className="text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors mb-2"
                  >
                    Hapus Chat
                  </button>
                </header>

                <div
                  className={`flex-1 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"} rounded-[32px] shadow-2xl shadow-slate-100 dark:shadow-none border flex flex-col overflow-hidden`}
                >
                  <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar">
                    {chatMessages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{
                          opacity: 0,
                          x: msg.role === "user" ? 20 : -20,
                        }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] p-6 rounded-[28px] ${msg.role === "user" ? `bg-${accentColor}-600 text-white rounded-tr-none shadow-xl shadow-${accentColor}-100 dark:shadow-none` : isDarkMode ? "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700" : "bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100"}`}
                        >
                          <div className="prose prose-sm max-w-none text-inherit prose-p:leading-relaxed prose-strong:text-inherit">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                a: ({ node, ...props }) => (
                                  <a
                                    {...props}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  />
                                ),
                                img: ({ node, ...props }) => (
                                  <img
                                    {...props}
                                    className="rounded-xl shadow-md object-cover max-h-64 my-4"
                                    referrerPolicy="no-referrer"
                                  />
                                ),
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                          <div
                            className={`text-[9px] mt-4 font-black uppercase tracking-widest opacity-40 ${msg.role === "user" ? "text-white" : "text-slate-400"}`}
                          >
                            {msg.timestamp.toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            • {msg.role === "user" ? "Saya" : "Maestro AI"}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {isSendingChat && (
                      <div className="flex justify-start">
                        <div
                          className={`${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-100"} p-6 rounded-[28px] rounded-tl-none border`}
                        >
                          <div className="flex gap-2">
                            {[0, 0.2, 0.4].map((d) => (
                              <motion.div
                                key={d}
                                animate={{ y: [0, -5, 0] }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 0.6,
                                  delay: d,
                                }}
                                className="w-1.5 h-1.5 bg-rose-400 rounded-full"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <div
                    className={`p-4 md:p-8 ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"} border-t relative`}
                  >
                    <div className="max-w-4xl mx-auto flex items-center gap-3 md:gap-4">
                      <div className="relative flex-1 group">
                        <input
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleSendChat()
                          }
                          placeholder="Tanyakan materi..."
                          className={`w-full ${isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200"} border-2 rounded-[20px] px-5 md:px-8 py-3.5 md:py-5 text-sm font-bold focus:outline-none focus:border-rose-500 transition-all shadow-sm pr-14 md:pr-16`}
                        />
                        <button
                          onClick={handleSendChat}
                          disabled={!chatInput.trim() || isSendingChat}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 md:p-3.5 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-200 hover:scale-105 active:scale-95 transition-all ${chatInput.trim() ? "opacity-100" : "opacity-0 group-focus-within:opacity-100"}`}
                        >
                          <Send className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                      </div>
                    </div>
                    <p className="hidden md:block text-[10px] text-center text-slate-400 mt-6 font-black uppercase tracking-[0.2em] italic">
                      Edisi Pedagogi • Diterjemahkan Oleh Hati AI
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "pengaturan" && (
              <motion.div
                key="pengaturan"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-3xl mx-auto space-y-12 py-8"
              >
                <header className="text-center">
                  <div
                    className={`w-24 h-24 ${isDarkMode ? "bg-white text-slate-900" : "bg-slate-900 text-white"} rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-2xl rotate-12`}
                  >
                    <Settings className="w-10 h-10" />
                  </div>
                  <h2
                    className={`text-4xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-800"}`}
                  >
                    Pusat Kendali Maestro
                  </h2>
                  <p
                    className={`font-bold mt-2 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Kustomisasi asisten mengajar digital Anda.
                  </p>
                </header>

                <div className="grid gap-8">
                  {/* Profile Section */}
                  <div
                    className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"} p-8 rounded-[32px] border shadow-xl shadow-slate-50 dark:shadow-none flex items-center justify-between group hover:border-indigo-100 transition-all`}
                  >
                    <div className="flex items-center gap-6">
                      <div
                        className={`w-14 h-14 ${isDarkMode ? "bg-slate-800" : "bg-indigo-50"} rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform`}
                      >
                        <PenLine className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h4
                          className={`font-black uppercase tracking-widest text-xs mb-1 ${isDarkMode ? "text-slate-500" : "text-slate-800"}`}
                        >
                          Identitas Guru
                        </h4>
                        <p
                          className={`font-bold ${isDarkMode ? "text-slate-200" : "text-slate-500"}`}
                        >
                          Catur Pamungkas, S.Pd.,Gr.
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">
                          IPS SMP • Guru Penggerak
                        </p>
                      </div>
                    </div>
                    <button
                      className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isDarkMode ? "bg-slate-800 text-slate-400 hover:bg-indigo-600 hover:text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-900 hover:text-white"}`}
                    >
                      Ubah
                    </button>
                  </div>

                  {/* Theme Customizer Section */}
                  <div
                    className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"} p-10 rounded-[40px] border shadow-2xl shadow-slate-100 dark:shadow-none space-y-10`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 bg-${accentColor}-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-${accentColor}-100 dark:shadow-none`}
                      >
                        <Palette className="w-6 h-6" />
                      </div>
                      <h4
                        className={`text-xl font-black ${isDarkMode ? "text-white" : "text-slate-800"}`}
                      >
                        Tema & Tampilan
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {/* Dark Mode Toggle */}
                      <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                          Mode Visual
                        </label>
                        <div className="flex grid grid-cols-2 gap-4">
                          <button
                            onClick={() => setIsDarkMode(false)}
                            className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${!isDarkMode ? `border-${accentColor}-500 bg-${accentColor}-50 dark:bg-${accentColor}-950/20` : "border-slate-100 dark:border-slate-800 bg-transparent opacity-60"}`}
                          >
                            <Sun
                              className={`w-6 h-6 ${!isDarkMode ? `text-${accentColor}-600` : "text-slate-400"}`}
                            />
                            <span
                              className={`text-xs font-black uppercase tracking-widest ${!isDarkMode ? `text-${accentColor}-700` : "text-slate-500"}`}
                            >
                              Terang
                            </span>
                          </button>
                          <button
                            onClick={() => setIsDarkMode(true)}
                            className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${isDarkMode ? `border-${accentColor}-500 bg-${accentColor}-950/20` : "border-slate-100 bg-transparent opacity-60"}`}
                          >
                            <Moon
                              className={`w-6 h-6 ${isDarkMode ? `text-${accentColor}-400` : "text-slate-400"}`}
                            />
                            <span
                              className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? `text-${accentColor}-400` : "text-slate-500"}`}
                            >
                              Gelap
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Accent Color Picker */}
                      <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                          Warna Aksen Maestro
                        </label>
                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                          {[
                            { id: "indigo", hex: "#6366f1" },
                            { id: "emerald", hex: "#10b981" },
                            { id: "rose", hex: "#f43f5e" },
                            { id: "amber", hex: "#f59e0b" },
                            { id: "blue", hex: "#3b82f6" },
                            { id: "violet", hex: "#8b5cf6" },
                            { id: "pink", hex: "#ec4899" },
                            { id: "sky", hex: "#0ea5e9" },
                            { id: "orange", hex: "#f97316" },
                            { id: "teal", hex: "#14b8a6" },
                          ].map((color) => (
                            <button
                              key={color.id}
                              onClick={() => setAccentColor(color.id)}
                              className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all border-4 relative ${accentColor === color.id ? "border-white dark:border-slate-800 scale-110 shadow-lg shadow-black/10" : "border-transparent opacity-50 hover:opacity-100"}`}
                              style={{ backgroundColor: color.hex }}
                            >
                              {accentColor === color.id && (
                                <motion.div
                                  layoutId="color-check"
                                  className="w-2 h-2 bg-white rounded-full"
                                />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Font Selector */}
                      <div className="space-y-4 md:col-span-2 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                          Tipografi (Font) Maestro
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {[
                            {
                              id: "font-inter",
                              label: "Inter (Standar)",
                              desc: "Modern & Bersih",
                            },
                            {
                              id: "font-outfit",
                              label: "Outfit (Modern)",
                              desc: "Geometris & Ramah",
                            },
                            {
                              id: "font-space",
                              label: "Space Grotesk",
                              desc: "Teknis & Tajam",
                            },
                            {
                              id: "font-playfair",
                              label: "Playfair Display",
                              desc: "Klasik & Mewah",
                            },
                          ].map((font) => (
                            <button
                              key={font.id}
                              onClick={() => setActiveFont(font.id)}
                              className={`flex flex-col p-5 rounded-[28px] border-2 transition-all text-left ${activeFont === font.id ? `border-${accentColor}-500 bg-${accentColor}-50/50 dark:bg-${accentColor}-950/20` : "border-slate-100 dark:border-slate-800 bg-transparent opacity-60 hover:opacity-100"}`}
                            >
                              <span
                                className={`text-lg font-black ${font.id} ${activeFont === font.id ? `text-${accentColor}-600 dark:text-${accentColor}-400` : "text-slate-700 dark:text-slate-300"}`}
                              >
                                Aa
                              </span>
                              <span
                                className={`text-[10px] font-black uppercase tracking-widest mt-2 ${activeFont === font.id ? `text-${accentColor}-700 dark:text-${accentColor}-200` : "text-slate-500"}`}
                              >
                                {font.label}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                                {font.desc}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Assistant Configuration Section */}
                  <div
                    className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-2xl shadow-slate-100 dark:shadow-none"} p-10 rounded-[40px] border space-y-10`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-100 dark:shadow-none">
                        <Zap className="w-6 h-6" />
                      </div>
                      <h4
                        className={`text-xl font-black ${isDarkMode ? "text-white" : "text-slate-800"}`}
                      >
                        Konfigurasi AI Assistant
                      </h4>
                    </div>

                    <div className="space-y-8">
                      <div>
                        <div className="flex justify-between items-end mb-4">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                            Temperatur AI (Kreativitas)
                          </label>
                          <span
                            className={`text-xs font-black px-3 py-1 rounded-lg ${isDarkMode ? "bg-slate-800 text-rose-400" : "bg-rose-50 text-rose-600"}`}
                          >
                            {aiTemperature.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className="text-[10px] font-bold text-slate-400">
                            Formal
                          </span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={aiTemperature}
                            onChange={(e) =>
                              setAiTemperature(parseFloat(e.target.value))
                            }
                            className={`flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500`}
                          />
                          <span className="text-[10px] font-bold text-slate-400">
                            Kreatif
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-4 font-medium leading-relaxed italic">
                          *Nilai rendah untuk jawaban yang lebih berfakta dan
                          konsisten. Nilai tinggi untuk jawaban yang lebih
                          kreatif dan variatif.
                        </p>
                      </div>

                      <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic mb-4">
                          Default System Prompt Chatbot
                        </label>
                        <textarea
                          value={aiChatSystemPrompt}
                          onChange={(e) =>
                            setAiChatSystemPrompt(e.target.value)
                          }
                          placeholder="Instruksi sistem untuk chatbot AI..."
                          className={`w-full ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100 shadow-inner"} border-2 rounded-2xl p-6 text-sm font-bold focus:outline-none focus:border-rose-500 transition-all min-h-[200px] leading-relaxed`}
                        />
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => {
                              if (confirm("Kembalikan ke pengaturan awal?")) {
                                setAiChatSystemPrompt(
                                  "Anda adalah IPS Maestro Chatbot, asisten kecerdasan buatan paling cerdas dan inspiratif bagi para pendidik Ilmu Pengetahuan Sosial (IPS) tingkat SMP di seluruh Indonesia.\n\n**Identitas & Persona:**\n- Anda adalah refleksi dari seorang Guru Maestro: ahli, bijak, hangat, dan selalu memberikan solusi pedagogis yang inovatif.\n- Anda memiliki pemahaman mendalam tentang Kurikulum Merdeka, Standar Isi SMP, dan kearifan lokal Indonesia.\n- Gaya komunikasi Anda: Profesional namun ramah, inspiratif, menggunakan Bahasa Indonesia yang baku namun tetap luwes (tidak kaku).\n\n**Tugas Utama:**\n1. **Pendamping Perencanaan:** Membantu guru menyusun rancangan pembelajaran (RPP/Modul Ajar), menentukan metode pengajaran (PBL, Discovery Learning, dll.), dan menyusun strategi penilaian.\n2. **Narasumber Materi:** Memberikan penjelasan materi geografi, sejarah, ekonomi, dan sosiologi dengan akurasi tinggi dan relevansi yang kuat dengan fenomena terkini di Indonesia.\n3. **Penyedia Ide Kreatif:** Memberikan ide aktivitas belajar yang aktif, interaktif, dan berpusat pada siswa (student-centered).\n4. **Instruktur HOTS:** Selalu mendorong penulisan soal dan aktivitas yang melatih Higher Order Thinking Skills.\n\n**Prinsip Jawaban:**\n- **Konteks Indonesia:** Selalu hubungkan jawaban dengan contoh nyata di Indonesia (misal: ekonomi pasar tradisional, sejarah kemerdekaan nasional, geografi kepulauan).\n- **Struktur Markdown:** Gunakan heading, bullet points, dan blok kode agar jawaban sangat mudah dibaca.\n- **Pedagogis:** Jika guru bertanya tentang masalah di kelas, berikan saran yang didukung teori pendidikan namun praktis.\n- **Interaktif:** Akhiri jawaban dengan pertanyaan pemantik atau saran langkah selanjutnya.",
                                );
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

                  {/* Journal Reminder Section */}
                  <div
                    className={`${isDarkMode ? "bg-slate-900 border-slate-800 shadow-none" : "bg-white border-slate-100 shadow-2xl shadow-slate-100"} p-10 rounded-[40px] border space-y-10 group hover:border-blue-100 transition-all`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100 dark:shadow-none">
                          <Bell className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                          <h4
                            className={`text-xl font-black ${isDarkMode ? "text-white" : "text-slate-800"}`}
                          >
                            Pengingat Jurnal Guru
                          </h4>
                          <p
                            className={`text-[10px] font-bold uppercase tracking-widest italic ${reminderEnabled ? "text-emerald-500" : "text-slate-400"}`}
                          >
                            {getNextReminderText()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setReminderEnabled(!reminderEnabled)}
                        className={`w-14 h-8 rounded-full relative transition-all ${reminderEnabled ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-800"}`}
                      >
                        <motion.div
                          animate={{ x: reminderEnabled ? 28 : 4 }}
                          className="w-6 h-6 bg-white rounded-full absolute top-1 shadow-md"
                        />
                      </button>
                    </div>

                    <AnimatePresence>
                      {reminderEnabled && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-8 pt-6 border-t border-slate-100 dark:border-slate-800"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Frequency */}
                            <div className="space-y-4">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                                Frekuensi Pengingat
                              </label>
                              <div className="flex p-1.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <button
                                  onClick={() => setReminderType("daily")}
                                  className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reminderType === "daily" ? "bg-white dark:bg-slate-700 text-blue-500 shadow-sm" : "text-slate-400"}`}
                                >
                                  Harian
                                </button>
                                <button
                                  onClick={() => setReminderType("weekly")}
                                  className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reminderType === "weekly" ? "bg-white dark:bg-slate-700 text-blue-500 shadow-sm" : "text-slate-400"}`}
                                >
                                  Mingguan
                                </button>
                              </div>
                            </div>

                            {/* Time */}
                            <div className="space-y-4">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                                Waktu Pengingat
                              </label>
                              <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                  type="time"
                                  value={reminderTime}
                                  onChange={(e) =>
                                    setReminderTime(e.target.value)
                                  }
                                  className={`w-full ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100 shadow-inner"} border-2 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all`}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Weekly Day Selector */}
                          {reminderType === "weekly" && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-4"
                            >
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                                Hari Pengingat
                              </label>
                              <div className="grid grid-cols-7 gap-2">
                                {[
                                  "Min",
                                  "Sen",
                                  "Sel",
                                  "Rab",
                                  "Kam",
                                  "Jum",
                                  "Sab",
                                ].map((day, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setReminderDay(idx)}
                                    className={`aspect-square sm:aspect-auto sm:h-12 rounded-xl text-[10px] font-black transition-all border-2 ${reminderDay === idx ? "bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-100 dark:shadow-none" : "border-slate-100 dark:border-slate-800 text-slate-400 hover:border-blue-200"}`}
                                  >
                                    {day}
                                  </button>
                                ))}
                              </div>
                              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                                <p className="text-[10px] text-slate-400 font-medium italic">
                                  *Pengingat akan muncul sebagai notifikasi di
                                  aplikasi pada waktu yang ditentukan.
                                </p>
                                <button
                                  onClick={handleTestNotification}
                                  className={`px-5 py-2.5 rounded-xl border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest`}
                                >
                                  Tes Notifikasi
                                </button>
                              </div>
                            </motion.div>
                          )}

                          {reminderType === "daily" && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4"
                            >
                              <p className="text-[10px] text-slate-400 font-medium italic">
                                *Pengingat akan muncul setiap hari pada pukul{" "}
                                {reminderTime}.
                              </p>
                              <button
                                onClick={handleTestNotification}
                                className={`px-5 py-2.5 rounded-xl border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest`}
                              >
                                Tes Notifikasi
                              </button>
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Status Section */}
                  <div
                    className={`${isDarkMode ? "bg-slate-900 border-slate-800 shadow-none" : "bg-white border-slate-100 shadow-xl shadow-slate-50"} p-8 rounded-[32px] border flex items-center justify-between group transition-all text-left`}
                  >
                    <div className="flex items-center gap-6">
                      <div
                        className={`w-14 h-14 ${isDarkMode ? "bg-slate-800" : "bg-blue-50"} rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform`}
                      >
                        <HardDrive className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4
                          className={`font-black uppercase tracking-widest text-xs mb-1 ${isDarkMode ? "text-slate-500" : "text-slate-800"}`}
                        >
                          Integrasi Google Drive
                        </h4>
                        <p
                          className={`font-bold ${isDarkMode ? "text-slate-200" : "text-slate-500"}`}
                        >
                          {needsDriveAuth
                            ? "Belum Terhubung"
                            : user?.email || "Terhubung"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">
                          Untuk Simpan LKPD & RPP Otomatis
                        </p>
                      </div>
                    </div>
                    {needsDriveAuth ? (
                      <button
                        onClick={handleLogin}
                        className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isDarkMode ? "bg-indigo-900 text-indigo-100 hover:bg-indigo-700" : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100"}`}
                      >
                        Hubungkan
                      </button>
                    ) : (
                      <button
                        onClick={logout}
                        className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isDarkMode ? "bg-slate-800 text-slate-400 hover:bg-rose-600 hover:text-white" : "bg-slate-50 text-slate-400 hover:bg-rose-600 hover:text-white"}`}
                      >
                        Putus
                      </button>
                    )}
                  </div>

                  {/* Meta Status Section */}
                  <div
                    className={`${isDarkMode ? "bg-slate-900 border-slate-800 shadow-none" : "bg-white border-slate-100 shadow-xl shadow-slate-50"} p-8 rounded-[32px] border flex items-center justify-between group hover:border-rose-100 transition-all text-left`}
                  >
                    <div className="flex items-center gap-6">
                      <div
                        className={`w-14 h-14 ${isDarkMode ? "bg-slate-800" : "bg-rose-50"} rounded-2xl flex items-center justify-center group-hover:-rotate-12 transition-transform`}
                      >
                        <RotateCcw className="w-6 h-6 text-rose-600" />
                      </div>
                      <div>
                        <h4
                          className={`font-black uppercase tracking-widest text-xs mb-1 ${isDarkMode ? "text-slate-500" : "text-slate-800"}`}
                        >
                          Penyimpanan Maestro
                        </h4>
                        <p
                          className={`font-bold ${isDarkMode ? "text-slate-200" : "text-slate-500"} italic`}
                        >
                          Sinkronisasi Cloud Aktif
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">
                        Live
                      </span>
                    </div>
                  </div>

                  {/* Backup / Restore Section */}
                  <div
                    className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-2xl shadow-slate-100 dark:shadow-none"} p-10 rounded-[40px] border space-y-10 text-left`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-100 dark:shadow-none`}>
                          <Database className="w-6 h-6" />
                        </div>
                        <div>
                          <h4
                            className={`text-xl font-black ${isDarkMode ? "text-white" : "text-slate-800"}`}
                          >
                            Cadangan & Sinkronisasi
                          </h4>
                          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">
                            Amankan data Anda secara luring maupun daring via Firebase
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={syncDataToFirebase}
                        disabled={isSyncing || !user}
                        className={`flex items-center justify-center gap-2 px-5 py-3.5 ${user ? 'bg-blue-500 hover:bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'} text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg ${user ? 'shadow-blue-100' : ''} dark:shadow-none`}
                      >
                       {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" /> }
                       Sync ke Firebase
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className={`p-6 rounded-3xl border-2 ${isDarkMode ? "bg-slate-800/30 border-slate-800" : "bg-amber-50/20 border-amber-100/50"} flex flex-col justify-between h-full text-left`}>
                        <div className="mb-4">
                          <h5 className={`font-black uppercase tracking-widest text-xs mb-2 text-amber-500`}>
                            Simpan Cadangan (Backup)
                          </h5>
                          <p className={`text-xs ${isDarkMode ? "text-slate-400 font-medium" : "text-slate-500 font-bold"} leading-relaxed`}>
                            Unduh seluruh jurnal pembelajaran dan rekap nilai siswa ke dalam satu berkas terenkripsi keamanan tinggi (.imb). Anda dapat menyimpannya sebagai cadangan pribadi yang aman.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowBackupModal(true)}
                          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-amber-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-amber-600 active:scale-[0.98] transition-all shadow-lg shadow-amber-100 dark:shadow-none mt-4"
                        >
                          <Lock className="w-4 h-4" /> Backup Semua Data
                        </button>
                      </div>

                      <div className={`p-6 rounded-3xl border-2 ${isDarkMode ? "bg-slate-800/30 border-slate-800" : "bg-emerald-50/20 border-emerald-100/50"} flex flex-col justify-between h-full text-left`}>
                        <div className="mb-4">
                          <h5 className={`font-black uppercase tracking-widest text-xs mb-2 text-emerald-500`}>
                            Pulihkan Data (Restore)
                          </h5>
                          <p className={`text-xs ${isDarkMode ? "text-slate-400 font-medium" : "text-slate-500 font-bold"} leading-relaxed`}>
                            Unggah kembali file cadangan .imb Anda dan masukkan kata sandi pengaman aslinya untuk mengembalikan semua entri jurnal dan daftar nilai siswa secara instan.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowRestoreModal(true)}
                          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-lg shadow-emerald-100 dark:shadow-none mt-4"
                        >
                          <Unlock className="w-4 h-4" /> Pulihkan Data Cadangan
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "jurnal" && (
              <motion.div
                key="jurnal"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-12"
              >
                <header className="flex justify-between items-end gap-6 flex-wrap">
                  <div>
                    <h2
                      className={`text-4xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-800"}`}
                    >
                      Jurnal{" "}
                      <span className="text-amber-500">Guru Maestro</span>
                    </h2>
                    <p
                      className={`font-medium mt-2 text-lg ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Dokumentasikan aktivitas mengajar Anda secara rapi dan
                      profesional.
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleExportJournalCSV}
                      className={`flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-700 shadow-xl shadow-amber-100 dark:shadow-none transition-all transition-transform active:scale-95`}
                    >
                      <Download className="w-4 h-4" /> Ekspor Jurnal
                    </button>
                    <div
                      className={`px-4 py-2 rounded-xl border ${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-white border-slate-100 text-slate-500"} text-xs font-black uppercase tracking-widest`}
                    >
                      {journalEntries.length} Entri Tersimpan
                    </div>
                  </div>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
                  <div
                    className={`xl:col-span-4 ${isDarkMode ? "bg-slate-900 border-slate-800 shadow-none" : "bg-white border-slate-100 shadow-xl shadow-slate-100"} p-8 rounded-[40px] border space-y-6 sticky top-8 transition-colors`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white">
                        <PenLine className="w-5 h-5" />
                      </div>
                      <span
                        className={`font-black text-sm uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-800"}`}
                      >
                        Catat Jurnal Baru
                      </span>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic px-1">
                          Tanggal Entri
                        </label>
                        <input
                          type="date"
                          value={journalDate}
                          onChange={(e) => setJournalDate(e.target.value)}
                          className={`w-full ${isDarkMode ? "bg-slate-800/50 border-slate-700 text-white" : "bg-slate-50 border-slate-100/50"} border-2 rounded-[24px] p-5 text-sm font-bold focus:outline-none focus:border-amber-500 transition-all`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic px-1">
                            Pilih Kelas
                          </label>
                          <select
                            value={journalClass}
                            onChange={(e) => setJournalClass(e.target.value)}
                            className={`w-full ${isDarkMode ? "bg-slate-800/50 border-slate-700 text-white" : "bg-slate-50 border-slate-100/50"} border-2 rounded-2xl p-5 text-sm font-bold focus:outline-none focus:border-amber-500 transition-all appearance-none`}
                          >
                            {[
                              "VII-A",
                              "VII-B",
                              "VII-C",
                              "VIII-A",
                              "VIII-B",
                              "VIII-C",
                              "IX-A",
                              "IX-B",
                              "IX-C",
                            ].map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic px-1">
                            Nama Guru
                          </label>
                          <input
                            type="text"
                            value={journalTeacher}
                            onChange={(e) => setJournalTeacher(e.target.value)}
                            className={`w-full ${isDarkMode ? "bg-slate-800/50 border-slate-700 text-white" : "bg-slate-50 border-slate-100/50"} border-2 rounded-2xl p-5 text-sm font-bold focus:outline-none focus:border-amber-500 transition-all`}
                          />
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium px-1 leading-normal leading-relaxed">
                            Contoh gelar yang lazim: <span className="font-bold">Catur Pamungkas, S.Pd., Gr.</span> atau <span className="font-bold">Dra. Sri Wahyuni</span>.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic px-1">
                          Materi / Topik Pelajaran
                        </label>
                        <input
                          type="text"
                          value={journalTopic}
                          onChange={(e) => setJournalTopic(e.target.value)}
                          placeholder="Misal: Perubahan Keruangan ASEAN & Mitigasi Kebencanaan"
                          className={`w-full ${isDarkMode ? "bg-slate-800/50 border-slate-700 text-white" : "bg-slate-50 border-slate-100/50"} border-2 rounded-[24px] p-5 text-sm font-bold focus:outline-none focus:border-amber-500 transition-all placeholder:opacity-30`}
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic px-1">
                          Inti Aktivitas
                        </label>
                        <textarea
                          value={journalActivity}
                          onChange={(e) => setJournalActivity(e.target.value)}
                          placeholder="Misal: Siswa menganalisis letak geografis ASEAN via diskusi kelompok berbasis Problem-Based Learning (PBL) menggunakan peta tematik..."
                          className={`w-full ${isDarkMode ? "bg-slate-800/50 border-slate-700 text-white" : "bg-slate-50 border-slate-100/50"} border-2 rounded-[24px] p-5 text-sm font-bold focus:outline-none focus:border-amber-500 transition-all min-h-[100px] placeholder:opacity-30`}
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic px-1">
                          Refleksi & Catatan Tambahan
                        </label>
                        <textarea
                          value={journalNotes}
                          onChange={(e) => setJournalNotes(e.target.value)}
                          placeholder="Misal: Penguasaan konsep letak astronomis sudah sangat baik, namun 3 siswa butuh asisten sebaya (peer tutoring) minggu depan."
                          className={`w-full ${isDarkMode ? "bg-slate-800/50 border-slate-700 text-white" : "bg-slate-50 border-slate-100/50"} border-2 rounded-[24px] p-5 text-sm font-bold focus:outline-none focus:border-amber-500 transition-all min-h-[80px] placeholder:opacity-30`}
                        />
                      </div>

                      <button
                        onClick={handleAddJournalEntry}
                        className="w-full py-5 bg-amber-600 text-white rounded-[24px] font-black text-sm tracking-[0.2em] uppercase shadow-2xl shadow-amber-500/20 hover:bg-amber-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                      >
                        <Cloud className="w-5 h-5" /> Simpan Entri Jurnal
                      </button>
                    </div>
                  </div>

                  <div className="xl:col-span-8 space-y-6">
                    {journalEntries.length === 0 ? (
                      <div
                        className={`p-16 border-4 border-dashed ${isDarkMode ? "border-slate-800" : "border-slate-100"} rounded-[40px] text-center`}
                      >
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                          <ClipboardList className="w-8 h-8 text-slate-300" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-400">
                          Belum Ada Entri Jurnal
                        </h4>
                        <p className="text-slate-400 text-sm mt-2 font-medium opacity-60">
                          Catatan aktivitas mengajar Anda akan muncul di sini
                          secara berurutan.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {journalEntries.map((entry) => (
                          <motion.div
                            layout
                            key={entry.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`${isDarkMode ? "bg-slate-900 border-slate-800 shadow-none" : "bg-white border-slate-100 shadow-xl shadow-slate-200/40"} p-8 rounded-[40px] border relative group hover:border-amber-400 transition-all duration-500 overflow-hidden flex flex-col h-full`}
                          >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.03] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />

                            <div className="flex items-center justify-between mb-8 relative z-10">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200 dark:shadow-none">
                                  <PenLine className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col">
                                  <span
                                    className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}
                                  >
                                    {entry.class}
                                  </span>
                                  <span className="text-slate-400 font-bold text-[9px] uppercase tracking-tighter">
                                    {new Date(entry.date).toLocaleDateString(
                                      "id-ID",
                                      {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      },
                                    )}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                  onClick={() =>
                                    setStatus({
                                      type: "success",
                                      message: "Fitur Edit segera hadir!",
                                    })
                                  }
                                  className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-500 transition-all"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteJournalEntry(entry.id)
                                  }
                                  className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-500 transition-all"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="flex-1 relative z-10">
                              <h4
                                className={`text-xl font-black mb-4 leading-tight ${isDarkMode ? "text-white" : "text-slate-800"}`}
                              >
                                {entry.topic}
                              </h4>
                              <p
                                className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"} leading-relaxed font-medium mb-6 line-clamp-4`}
                              >
                                {entry.activity}
                              </p>
                              {entry.notes && (
                                <div
                                  className={`p-4 ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"} rounded-2xl border-l-4 border-amber-500 mb-6 group-hover:bg-amber-50 dark:group-hover:bg-amber-900/10 transition-colors duration-300`}
                                >
                                  <p
                                    className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}
                                  >
                                    Refleksi Maestro:
                                  </p>
                                  <p
                                    className={`text-xs italic font-medium ${isDarkMode ? "text-slate-300" : "text-slate-500"}`}
                                  >
                                    {entry.notes}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between relative z-10">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[8px] font-black text-white">
                                  {entry.teacher.charAt(0)}
                                </div>
                                <span
                                  className={`font-black text-[10px] ${isDarkMode ? "text-slate-400" : "text-slate-700"}`}
                                >
                                  {entry.teacher}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-300 dark:text-slate-600">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span className="text-[8px] font-black uppercase tracking-widest">
                                  Tersimpan
                                </span>
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

            {activeTab === "materi" && (
              <motion.div
                key="materi"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
              >
                <header className="flex justify-between items-end gap-6 flex-wrap">
                  <div>
                    <h2
                      className={`text-4xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-800"}`}
                    >
                      Manajemen{" "}
                      <span className="text-sky-500">Materi Maestro</span>
                    </h2>
                    <p
                      className={`font-medium mt-2 text-lg ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Kelola, simpan, dan cari aset materi ajar Anda di satu
                      tempat terpusat.
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className={`px-4 py-2 rounded-xl border ${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-white border-slate-100 text-slate-500"} text-xs font-black uppercase tracking-widest flex items-center gap-2`}
                    >
                      <Zap className="w-3 h-3 text-amber-500" />{" "}
                      {offlineFileIds.size} Offline
                    </div>
                    <button
                      onClick={handleCreateFolder}
                      className={`flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-700 shadow-xl shadow-amber-100 transition-all ${isCreatingFolder ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      {isCreatingFolder ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FolderPlus className="w-4 h-4" />
                      )}
                      Folder Baru
                    </button>
                    <label
                      className={`flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-sky-700 shadow-xl shadow-sky-100 cursor-pointer transition-all ${isUploadingMaterial ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      {isUploadingMaterial ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Unggah Materi
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={isUploadingMaterial}
                      />
                    </label>
                  </div>
                </header>

                <div className="space-y-8">
                  <div className="flex items-center gap-6 flex-wrap">
                    <div
                      className={`flex items-center gap-2 p-1 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-50"} rounded-2xl border`}
                    >
                      <button
                        onClick={() => setMateriView("drive")}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${materiView === "drive" ? "bg-sky-600 text-white shadow-lg shadow-sky-200" : "text-slate-400 hover:text-slate-600"}`}
                      >
                        <Cloud className="w-4 h-4" /> Drive
                      </button>
                      <button
                        onClick={() => setMateriView("offline")}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${materiView === "offline" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "text-slate-400 hover:text-slate-600"}`}
                      >
                        <div className="relative">
                          <Cloud className="w-4 h-4 fill-current" />
                          <CheckCircle2 className="w-2 h-2 text-white bg-emerald-600 rounded-full absolute -bottom-0.5 -right-0.5 border border-emerald-600" />
                        </div>
                        Offline
                      </button>
                    </div>

                    {/* Layout Toggle */}
                    <div
                      className={`flex items-center gap-2 p-1 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-50"} rounded-2xl border`}
                    >
                      <button
                        onClick={() => setMaterialViewMode("grid")}
                        className={`p-2.5 rounded-xl transition-all ${materialViewMode === "grid" ? (isDarkMode ? "bg-slate-800 text-sky-500 shadow-lg" : "bg-slate-50 text-sky-600 shadow-inner") : "text-slate-400 hover:text-slate-600"}`}
                        title="Grid View"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setMaterialViewMode("list")}
                        className={`p-2.5 rounded-xl transition-all ${materialViewMode === "list" ? (isDarkMode ? "bg-slate-800 text-sky-500 shadow-lg" : "bg-slate-50 text-sky-600 shadow-inner") : "text-slate-400 hover:text-slate-600"}`}
                        title="List View"
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Sort Toggle */}
                    <div
                      className={`flex items-center gap-2 p-1 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-50"} rounded-2xl border`}
                    >
                      <button
                        onClick={() => setMaterialSort("name")}
                        className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${materialSort === "name" ? "bg-slate-800 text-white dark:bg-slate-700" : "text-slate-400 hover:text-slate-600"}`}
                      >
                        <SortAsc className="w-3.5 h-3.5" /> Nama
                      </button>
                      <button
                        onClick={() => setMaterialSort("newest")}
                        className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${materialSort === "newest" ? "bg-slate-800 text-white dark:bg-slate-700" : "text-slate-400 hover:text-slate-600"}`}
                      >
                        <Clock className="w-3.5 h-3.5" /> Terbaru
                      </button>
                      <button
                        onClick={() => setMaterialSort("oldest")}
                        className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${materialSort === "oldest" ? "bg-slate-800 text-white dark:bg-slate-700" : "text-slate-400 hover:text-slate-600"}`}
                      >
                        <Calendar className="w-3.5 h-3.5" /> Terlama
                      </button>
                    </div>

                    {/* Filter Toggle */}
                    <div
                      className={`flex items-center gap-2 p-1 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-50"} rounded-2xl border`}
                    >
                      <button
                        onClick={() => setMateriFilter("all")}
                        className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${materiFilter === "all" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-slate-600"}`}
                      >
                        <Filter className="w-3.5 h-3.5" /> Semua
                      </button>
                      <button
                        onClick={() => setMateriFilter("pdf")}
                        className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${materiFilter === "pdf" ? "bg-rose-500 text-white" : "text-slate-400 hover:text-slate-600"}`}
                      >
                        PDF
                      </button>
                      <button
                        onClick={() => setMateriFilter("docx")}
                        className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${materiFilter === "docx" ? "bg-blue-500 text-white" : "text-slate-400 hover:text-slate-600"}`}
                      >
                        DOCX
                      </button>
                      <button
                        onClick={() => setMateriFilter("image")}
                        className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${materiFilter === "image" ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-slate-600"}`}
                      >
                        Gambar
                      </button>
                      {materiView === "drive" && (
                        <button
                          onClick={() => setMateriFilter("folder")}
                          className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${materiFilter === "folder" ? "bg-amber-500 text-white" : "text-slate-400 hover:text-slate-600"}`}
                        >
                          Folder
                        </button>
                      )}
                    </div>

                    <div
                      className={`flex items-center gap-4 p-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-50"} rounded-3xl border w-full max-w-sm`}
                    >
                      <Search className="w-5 h-5 text-slate-400 ml-2" />
                      <input
                        type="text"
                        placeholder={
                          materiView === "drive"
                            ? "Cari materi di Drive..."
                            : "Cari materi offline..."
                        }
                        value={materialSearch}
                        onChange={(e) => setMaterialSearch(e.target.value)}
                        className="bg-transparent border-none w-full font-bold text-sm focus:outline-none placeholder:text-slate-400"
                      />
                    </div>

                    {materiView === "drive" && folderStack.length > 0 && (
                      <button
                        onClick={handleGoBack}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all`}
                      >
                        <ChevronLeft className="w-4 h-4" /> Kembali
                      </button>
                    )}
                  </div>

                  {/* Breadcrumbs - Only show in Drive view */}
                  {materiView === "drive" && (
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                      <button
                        onClick={() => {
                          setCurrentFolderId("root");
                          setCurrentFolderName("Root");
                          setFolderStack([]);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentFolderId === "root" ? "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                      >
                        <FolderRoot className="w-4 h-4" /> Root
                      </button>
                      {folderStack.map((folder, idx) => (
                        <React.Fragment key={folder.id}>
                          {folder.id !== "root" && (
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
                      {currentFolderId !== "root" && (
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
                    <div
                      className={`p-20 text-center border-4 border-dashed ${isDarkMode ? "border-slate-800" : "border-slate-100"} rounded-[40px]`}
                    >
                      <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/30 rounded-3xl flex items-center justify-center mx-auto mb-8">
                        <HardDrive className="w-10 h-10 text-indigo-500" />
                      </div>
                      <h3
                        className={`text-2xl font-black mb-4 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                      >
                        Google Drive Belum Terhubung
                      </h3>
                      <p className="text-slate-400 font-bold max-w-md mx-auto mb-10 leading-relaxed">
                        Hubungkan ke Google Drive untuk mengaktifkan fitur
                        penyimpanan materi secara otomatis dan aman.
                      </p>
                      <button
                        onClick={handleLogin}
                        className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                      >
                        Hubungkan Sekarang
                      </button>
                    </div>
                  ) : isFetchingMaterials ? (
                    <div className="flex flex-col items-center justify-center py-20 grayscale opacity-40">
                      <Loader2 className="w-10 h-10 animate-spin text-sky-500 mb-4" />
                      <p className="font-black text-xs uppercase tracking-widest">
                        Sinkronisasi Materi...
                      </p>
                    </div>
                  ) : (
                    <div>
                      {(() => {
                        const filtered = getFilteredMaterials();

                        if (filtered.length === 0) {
                          return (
                            <div className="py-20 text-center opacity-40">
                              <CloudOff className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                              <p className="text-xl font-black uppercase tracking-widest text-slate-400">
                                {materialSearch
                                  ? "Tidak ada materi yang cocok dengan pencarian"
                                  : materiFilter !== "all"
                                    ? `Tidak ada materi dengan format ${materiFilter.toUpperCase()}`
                                    : materiView === "drive"
                                      ? "Tidak ada materi ditemukan"
                                      : "Belum ada file untuk akses offline"}
                              </p>
                            </div>
                          );
                        }

                        if (materialViewMode === "list") {
                          return (
                            <div
                              className={`overflow-x-auto rounded-[24px] border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-50"}`}
                            >
                              <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                  <tr
                                    className={`border-b ${isDarkMode ? "bg-slate-800 border-slate-700/50 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-500"}`}
                                  >
                                    <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-[0.2em]">
                                      Nama File
                                    </th>
                                    <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-[0.2em] w-[15%]">
                                      Tipe
                                    </th>
                                    <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-[0.2em] w-[15%]">
                                      Ukuran
                                    </th>
                                    <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-[0.2em] w-[20%]">
                                      Status Offline
                                    </th>
                                    <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-[0.2em] text-right w-[20%]">
                                      Aksi
                                    </th>
                                  </tr>
                                </thead>
                                <tbody
                                  className={`divide-y ${isDarkMode ? "divide-slate-800" : "divide-slate-100"}`}
                                >
                                  {filtered.map((file, idx) => {
                                    const isFolder =
                                      file.mimeType ===
                                      "application/vnd.google-apps.folder";
                                    const isOffline = offlineFileIds.has(
                                      file.id,
                                    );
                                    const syncingStatus =
                                      syncingStatuses[file.id];
                                    return (
                                      <motion.tr
                                        key={file.id}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                          duration: 0.2,
                                          delay: Math.min(idx * 0.03, 0.3),
                                        }}
                                        className={`group hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-all duration-300 cursor-pointer`}
                                        onClick={() =>
                                          isFolder && materiView === "drive"
                                            ? handleNavigateFolder(
                                                file.id,
                                                file.name,
                                              )
                                            : handlePreviewMaterial(file)
                                        }
                                      >
                                        {/* Nama File Column */}
                                        <td className="px-6 py-4">
                                          <div className="flex items-center gap-3">
                                            <div
                                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${isFolder ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30" : "bg-sky-100 text-sky-600 dark:bg-sky-900/30"}`}
                                            >
                                              {isFolder ? (
                                                <Folder className="w-5 h-5 fill-amber-500" />
                                              ) : file.thumbnailLink ? (
                                                <img
                                                  src={file.thumbnailLink}
                                                  className="w-10 h-10 rounded-xl object-cover"
                                                  referrerPolicy="no-referrer"
                                                />
                                              ) : (
                                                <FileText className="w-5 h-5 fill-sky-500" />
                                              )}
                                            </div>
                                            <div className="flex flex-col min-w-0 max-w-md">
                                              <span
                                                className={`text-sm font-black truncate leading-tight ${isDarkMode ? "text-slate-100" : "text-slate-800"} group-hover:text-sky-500 transition-colors`}
                                              >
                                                {file.name}
                                              </span>
                                              <span
                                                className={`text-[10px] font-bold ${isDarkMode ? "text-slate-500" : "text-slate-400"} mt-0.5`}
                                              >
                                                ID: {file.id.substring(0, 12)}
                                                ...
                                              </span>
                                            </div>
                                          </div>
                                        </td>

                                        {/* Tipe Column */}
                                        <td className="px-6 py-4">
                                          <span
                                            className={`inline-flex items-center px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border ${
                                              isFolder
                                                ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30"
                                                : getFileTypeName(file) ===
                                                    "PDF"
                                                  ? "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30"
                                                  : getFileTypeName(file) ===
                                                      "DOCX"
                                                    ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30"
                                                    : getFileTypeName(file) ===
                                                        "Spreadsheet"
                                                      ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
                                                      : getFileTypeName(
                                                            file,
                                                          ) === "Slide"
                                                        ? "bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/30"
                                                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-150 dark:border-slate-700"
                                            }`}
                                          >
                                            {getFileTypeName(file)}
                                          </span>
                                        </td>

                                        {/* Ukuran Column */}
                                        <td className="px-6 py-4">
                                          <span
                                            className={`text-xs font-bold ${isDarkMode ? "text-slate-400" : "text-slate-600 font-medium"}`}
                                          >
                                            {isFolder
                                              ? "-"
                                              : formatFileSize(file.size)}
                                          </span>
                                        </td>

                                        {/* Status Offline Column */}
                                        <td className="px-6 py-4">
                                          {syncingStatus === "downloading" ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 rounded-lg text-[9px] font-black uppercase tracking-wider border border-sky-100 dark:border-sky-900/30">
                                              <Loader2 className="w-3 h-3 animate-spin" />
                                              <span>Downloading...</span>
                                            </span>
                                          ) : isOffline ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-wider border border-emerald-100 dark:border-emerald-900/30">
                                              <Cloud className="w-3 h-3 fill-current" />
                                              <span>Tersedia Offline</span>
                                            </span>
                                          ) : isFolder ? (
                                            <span
                                              className={`text-[10px] font-bold ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}
                                            >
                                              -
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-850 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-wider border border-slate-150 dark:border-slate-700">
                                              <CloudOff className="w-3 h-3" />
                                              <span>Online Saja</span>
                                            </span>
                                          )}
                                        </td>

                                        {/* Aksi Column */}
                                        <td
                                          className="px-6 py-4 text-right"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div className="flex items-center justify-end gap-2">
                                            {!isFolder && (
                                              <>
                                                <button
                                                  onClick={() =>
                                                    handlePreviewMaterial(file)
                                                  }
                                                  className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-700 rounded-xl transition-all"
                                                  title="Pratinjau"
                                                >
                                                  <Eye className="w-4 h-4" />
                                                </button>

                                                {file.webViewLink && (
                                                  <a
                                                    href={file.webViewLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-xl transition-all"
                                                    title="Buka Google Drive"
                                                  >
                                                    <ExternalLink className="w-4 h-4" />
                                                  </a>
                                                )}

                                                <button
                                                  onClick={() =>
                                                    isOffline
                                                      ? handleDownloadOffline(
                                                          file.id,
                                                        )
                                                      : handleDownloadDrive(
                                                          file,
                                                        )
                                                  }
                                                  className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-xl transition-all"
                                                  title="Unduh Offline"
                                                >
                                                  <Download className="w-4 h-4" />
                                                </button>

                                                <button
                                                  onClick={() =>
                                                    handleToggleOffline(file)
                                                  }
                                                  className={`p-2 rounded-xl transition-all ${
                                                    isOffline
                                                      ? "bg-rose-50 dark:bg-rose-950/20 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40"
                                                      : "bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-700"
                                                  }`}
                                                  title={
                                                    isOffline
                                                      ? "Hapus dari Offline"
                                                      : "Simpan Offline"
                                                  }
                                                >
                                                  {isOffline ? (
                                                    <CloudOff className="w-4 h-4" />
                                                  ) : (
                                                    <Cloud className="w-4 h-4" />
                                                  )}
                                                </button>
                                              </>
                                            )}

                                            <button
                                              onClick={() =>
                                                handleDeleteMaterial(file.id)
                                              }
                                              className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-xl transition-all"
                                              title="Hapus"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </td>
                                      </motion.tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          );
                        }

                        // Grid View
                        return (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {filtered.map((file, idx) => {
                              const isFolder =
                                file.mimeType ===
                                "application/vnd.google-apps.folder";
                              const isOffline = offlineFileIds.has(file.id);
                              return (
                                <motion.div
                                  layout
                                  key={file.id}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  onClick={() => {
                                    if (isFolder && materiView === "drive") {
                                      handleNavigateFolder(file.id, file.name);
                                    } else if (!isFolder) {
                                      handlePreviewMaterial(file);
                                    }
                                  }}
                                  className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-50"} rounded-[32px] border p-6 group shadow-sm hover:shadow-xl hover:shadow-sky-500/10 hover:border-sky-300 transition-all ${isFolder ? "cursor-pointer" : "cursor-default"} overflow-hidden relative`}
                                >
                                  <div className="aspect-square bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mb-6 overflow-hidden relative">
                                    {isOffline && (
                                      <div className="absolute top-4 left-4 z-10">
                                        <div className="relative w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse">
                                          <Cloud className="w-5 h-5 fill-current" />
                                          <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5">
                                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 fill-current" />
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {syncingStatuses[file.id] ===
                                      "downloading" && (
                                      <div className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-sky-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xl border border-sky-400">
                                        <Loader2 className="w-2.5 h-2.5 animate-spin" />{" "}
                                        Mengunduh...
                                      </div>
                                    )}
                                    {syncingStatuses[file.id] ===
                                      "finished" && (
                                      <div className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xl">
                                        <CheckCircle2 className="w-2.5 h-2.5" />{" "}
                                        Selesai
                                      </div>
                                    )}
                                    {syncingStatuses[file.id] === "failed" && (
                                      <div className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-rose-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xl">
                                        <AlertCircle className="w-2.5 h-2.5" />{" "}
                                        Gagal
                                      </div>
                                    )}
                                    {isFolder ? (
                                      <div className="flex flex-col items-center gap-4">
                                        <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                          <FolderRoot className="w-10 h-10 text-amber-500" />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                          Direktori
                                        </span>
                                      </div>
                                    ) : file.thumbnailLink ? (
                                      <div className="w-full h-full absolute inset-0 overflow-hidden">
                                        <img
                                          src={file.thumbnailLink}
                                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                          referrerPolicy="no-referrer"
                                        />
                                        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/20 transition-colors" />
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center gap-4">
                                        <div
                                          className={`w-16 h-16 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ${file.mimeType.includes("pdf") ? "bg-rose-500/10" : "bg-sky-500/10"}`}
                                        >
                                          <File
                                            className={`w-8 h-8 ${file.mimeType.includes("pdf") ? "text-rose-500" : "text-sky-500"}`}
                                          />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                          {(file.mimeType || "")
                                            .split("/")
                                            .pop()
                                            ?.toUpperCase() || "FILE"}
                                        </span>
                                      </div>
                                    )}
                                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
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
                                            <a
                                              href={file.webViewLink}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-3 bg-white text-sky-600 rounded-xl shadow-lg hover:scale-110 transition-transform"
                                              title="Buka Google Drive"
                                            >
                                              <ExternalLink className="w-5 h-5" />
                                            </a>
                                          )}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              isOffline
                                                ? handleDownloadOffline(file.id)
                                                : handleDownloadDrive(file);
                                            }}
                                            className="p-3 bg-white text-emerald-600 rounded-xl shadow-lg hover:scale-110 transition-transform flex items-center justify-center"
                                            title="Unduh Offline"
                                          >
                                            <Download className="w-5 h-5" />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleToggleOffline(file);
                                            }}
                                            className={`p-3 rounded-xl shadow-lg hover:scale-110 transition-all ${isOffline ? "bg-rose-50 text-white" : "bg-white text-slate-400"}`}
                                            title={
                                              isOffline
                                                ? "Hapus dari Offline"
                                                : "Simpan Offline"
                                            }
                                          >
                                            {isOffline ? (
                                              <CloudOff className="w-5 h-5" />
                                            ) : (
                                              <Cloud className="w-5 h-5" />
                                            )}
                                          </button>
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
                                  <h4
                                    className={`text-sm font-black truncate mb-1 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                                  >
                                    {file.name}
                                  </h4>
                                  <div className="flex items-center justify-between mt-4 bg-slate-50/80 dark:bg-slate-800/80 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 backdrop-blur-sm">
                                    <div className="flex items-center gap-1.5">
                                      {!isFolder && file.iconLink ? (
                                        <img
                                          src={file.iconLink}
                                          className="w-3.5 h-3.5 opacity-60"
                                        />
                                      ) : (
                                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                      )}
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">
                                        {isFolder ? "Folder" : getFileTypeName(file)}
                                      </span>
                                    </div>
                                    {!isFolder && (
                                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                        <button
                                          onClick={() => handlePreviewMaterial(file)}
                                          className="p-1.5 bg-slate-100 dark:bg-slate-700 hover:text-sky-500 rounded-lg text-slate-500 transition-colors"
                                          title="Pratinjau"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        {file.webViewLink && (
                                          <a
                                            href={file.webViewLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 bg-slate-100 dark:bg-slate-700 hover:text-indigo-500 rounded-lg text-slate-500 transition-colors flex items-center justify-center"
                                            title="Buka Google Drive"
                                          >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                          </a>
                                        )}
                                        <button
                                          onClick={() =>
                                            isOffline
                                              ? handleDownloadOffline(file.id)
                                              : handleDownloadDrive(file)
                                          }
                                          className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all group/btn"
                                          title="Unduh Offline"
                                        >
                                          <Download className="w-3 h-3 group-hover/btn:animate-bounce" />
                                          <span>Unduh</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* PDF/File Preview Overlay */}
                  <AnimatePresence>
                    {previewFile && (
                      <motion.div
                        key="file-preview-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-slate-900/90 backdrop-blur-md"
                        onClick={() => {
                          if (
                            previewFile.url &&
                            previewFile.url.startsWith("blob:")
                          )
                            URL.revokeObjectURL(previewFile.url);
                          setPreviewFile(null);
                        }}
                      >
                        <motion.div
                          initial={{ scale: 0.9, y: 20 }}
                          animate={{ scale: 1, y: 0 }}
                          exit={{ scale: 0.9, y: 20 }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full h-full max-w-7xl bg-white dark:bg-slate-900 rounded-[40px] overflow-hidden flex flex-col relative shadow-2xl"
                        >
                          {/* Header */}
                          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white">
                                <File className="w-5 h-5" />
                              </div>
                              <div>
                                <h4
                                  className={`text-sm font-black truncate max-w-[200px] md:max-w-md ${isDarkMode ? "text-white" : "text-slate-800"}`}
                                >
                                  {previewFile.name}
                                </h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  {previewFile.mimeType}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                if (
                                  previewFile.url &&
                                  previewFile.url.startsWith("blob:")
                                )
                                  URL.revokeObjectURL(previewFile.url);
                                setPreviewFile(null);
                              }}
                              className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors text-slate-400 hover:text-rose-500"
                            >
                              <XCircle className="w-6 h-6" />
                            </button>
                          </div>

                          {/* Split Body */}
                          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                            {/* Main Content Area */}
                            <div className="flex-1 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
                              {previewFile.mimeType.includes("pdf") ||
                              previewFile.url.includes("drive.google.com") ? (
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
                                  <h5 className="text-xl font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Pratinjau Tidak Tersedia
                                  </h5>
                                  <p className="text-sm font-bold text-slate-400 max-w-xs">
                                    {previewFile.mimeType} mungkin tidak
                                    didukung untuk pratinjau langsung. Silakan
                                    unduh file untuk melihat konten melalui opsi
                                    di samping.
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Sidebar Details */}
                            <div
                              className={`w-full lg:w-96 border-l border-slate-100 dark:border-slate-800 p-8 flex flex-col gap-8 bg-white dark:bg-slate-900 overflow-y-auto`}
                            >
                              <div>
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">
                                  Informasi Berkas
                                </h5>
                                <div className="space-y-6">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                      Nama File
                                    </span>
                                    <p
                                      className={`text-sm font-bold leading-relaxed ${isDarkMode ? "text-white" : "text-slate-700"}`}
                                    >
                                      {previewFile.name}
                                    </p>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                      Ukuran
                                    </span>
                                    <p
                                      className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-700"}`}
                                    >
                                      {formatFileSize(previewFile.size)}
                                    </p>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                      Dibuat Pada
                                    </span>
                                    <p
                                      className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-700"}`}
                                    >
                                      {previewFile.createdTime
                                        ? new Date(
                                            previewFile.createdTime,
                                          ).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })
                                        : "-"}
                                    </p>
                                  </div>
                                  {previewFile.description && (
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                        Deskripsi
                                      </span>
                                      <p
                                        className={`text-sm font-bold leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
                                      >
                                        {previewFile.description}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="pt-8 border-t border-slate-50 dark:border-slate-800 space-y-4">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">
                                  Tindakan
                                </h5>
                                <a
                                  href={previewFile.url}
                                  download={previewFile.name}
                                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none hover:scale-105 transition-transform"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Download className="w-4 h-4" /> Unduh Berkas
                                </a>
                                <button
                                  onClick={async () => {
                                    const isOff = offlineFileIds.has(
                                      previewFile.id,
                                    );
                                    await handleToggleOffline({
                                      id: previewFile.id,
                                      name: previewFile.name,
                                      mimeType: previewFile.mimeType,
                                    });
                                  }}
                                  className={`w-full flex items-center justify-center gap-3 px-6 py-4 ${offlineFileIds.has(previewFile.id) ? "bg-rose-500" : "bg-emerald-500"} text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-100 dark:shadow-none hover:scale-105 transition-transform`}
                                >
                                  {offlineFileIds.has(previewFile.id) ? (
                                    <CloudOff className="w-4 h-4" />
                                  ) : (
                                    <Cloud className="w-4 h-4" />
                                  )}
                                  {offlineFileIds.has(previewFile.id)
                                    ? "Hapus Offline"
                                    : "Simpan Offline"}
                                </button>
                              </div>

                              <div className="mt-auto p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-2 text-rose-400 mb-2">
                                  <AlertCircle className="w-4 h-4" />
                                  <span className="text-[9px] font-black uppercase tracking-widest">
                                    Keamanan
                                  </span>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 leading-relaxed italic">
                                  Gunakan file ini secara bijaksana sesuai
                                  dengan hak kekayaan intelektual.
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {activeTab === "penilaian" && (
              <motion.div
                key="penilaian"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-12"
              >
                <header className="flex justify-between items-end gap-6 flex-wrap">
                  <div>
                    <h2
                      className={`text-4xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-800"}`}
                    >
                      Analisis{" "}
                      <span className="text-rose-500">Penilaian Maestro</span>
                    </h2>
                    <p
                      className={`font-medium mt-2 text-lg ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Visualisasikan perkembangan capaian belajar murid secara
                      akurat.
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() =>
                        setStatus({
                          type: "success",
                          message: "Fitur Cetak segera hadir!",
                        })
                      }
                      className={`flex items-center gap-2 px-5 py-2.5 ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-white border border-slate-100 text-slate-600 shadow-sm"} rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all`}
                    >
                      <Download className="w-4 h-4" /> Ekspor Laporan
                    </button>
                  </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div
                    className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-50"} p-8 rounded-[32px] border`}
                  >
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Rata-rata Kelas
                    </p>
                    <h4
                      className={`text-3xl font-black ${isDarkMode ? "text-white" : "text-slate-800"}`}
                    >
                      {stats.avg}
                    </h4>
                  </div>
                  <div
                    className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-50"} p-8 rounded-[32px] border`}
                  >
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Nilai Tertinggi
                    </p>
                    <h4 className={`text-3xl font-black text-emerald-500`}>
                      {stats.max}
                    </h4>
                  </div>
                  <div
                    className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-50"} p-8 rounded-[32px] border`}
                  >
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Nilai Terendah
                    </p>
                    <h4 className={`text-3xl font-black text-rose-500`}>
                      {stats.min}
                    </h4>
                  </div>
                  <div
                    className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-50"} p-8 rounded-[32px] border`}
                  >
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Persentase Ketuntasan
                    </p>
                    <h4 className={`text-3xl font-black text-blue-500`}>
                      {studentScores.length > 0
                        ? (
                            (stats.passCount / studentScores.length) *
                            100
                          ).toFixed(0)
                        : 0}
                      %
                    </h4>
                  </div>
                </div>

                {/* Tren Nilai Section */}
                <div
                  className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-2xl shadow-slate-100"} p-10 rounded-[40px] border mb-10`}
                >
                  <div className="flex justify-between items-center mb-10">
                    <div>
                      <h3
                        className={`font-black text-xl ${isDarkMode ? "text-white" : "text-slate-800"}`}
                      >
                        Tren Capaian Nilai Rata-rata
                      </h3>
                      <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                        Progress Kolektif per Periode Assessment
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase">
                          Rata-rata
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-dashed border-slate-400 rounded-full" />
                        <span className="text-[10px] font-black text-slate-400 uppercase">
                          Target KKM
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={scoreTrends}>
                        <defs>
                          <linearGradient
                            id="colorAvg"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#f43f5e"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#f43f5e"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke={isDarkMode ? "#334155" : "#e2e8f0"}
                        />
                        <XAxis
                          dataKey="period"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill: "#94a3b8",
                            fontWeight: "bold",
                            fontSize: 12,
                          }}
                          dy={10}
                        />
                        <YAxis
                          domain={[0, 100]}
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill: "#94a3b8",
                            fontWeight: "bold",
                            fontSize: 12,
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "16px",
                            border: "none",
                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                            background: isDarkMode ? "#0f172a" : "#fff",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="avg"
                          stroke="#f43f5e"
                          strokeWidth={4}
                          fillOpacity={1}
                          fill="url(#colorAvg)"
                        />
                        <Line
                          type="monotone"
                          dataKey="target"
                          stroke="#94a3b8"
                          strokeDasharray="5 5"
                          strokeWidth={2}
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                  <div
                    className={`xl:col-span-8 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-2xl shadow-slate-100"} p-10 rounded-[40px] border`}
                  >
                    <div className="flex justify-between items-center mb-10">
                      <h3
                        className={`font-black text-xl ${isDarkMode ? "text-white" : "text-slate-800"}`}
                      >
                        Grafik Distribusi Nilai
                      </h3>
                      <input
                        type="text"
                        value={assessmentTitle}
                        onChange={(e) => setAssessmentTitle(e.target.value)}
                        className={`text-right bg-transparent border-none font-bold text-slate-400 focus:outline-none focus:text-rose-500 transition-colors italic text-sm`}
                      />
                    </div>
                    <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={studentScores}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke={isDarkMode ? "#334155" : "#e2e8f0"}
                          />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fill: "#94a3b8",
                              fontWeight: "bold",
                              fontSize: 12,
                            }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fill: "#94a3b8",
                              fontWeight: "bold",
                              fontSize: 12,
                            }}
                          />
                          <Tooltip
                            cursor={{
                              fill: isDarkMode ? "#1e293b" : "#f8fafc",
                            }}
                            contentStyle={{
                              borderRadius: "16px",
                              border: "none",
                              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                              background: isDarkMode ? "#0f172a" : "#fff",
                            }}
                          />
                          <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                            {studentScores.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.score >= 75 ? "#10b981" : "#f43f5e"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className={`xl:col-span-4 space-y-6`}>
                    <div
                      className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-100"} p-8 rounded-[40px] border`}
                    >
                      <h3
                        className={`font-black text-sm uppercase tracking-widest mb-6 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                      >
                        Status Ketuntasan
                      </h3>
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
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-500" />
                          <span className="text-[10px] font-black text-slate-400 uppercase">
                            Tuntas
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-rose-500" />
                          <span className="text-[10px] font-black text-slate-400 uppercase">
                            Belum
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-100"} p-8 rounded-[40px] border`}
                    >
                      <h3
                        className={`font-black text-sm uppercase tracking-widest mb-6 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                      >
                        Input Nilai Cepat
                      </h3>
                      <div className="space-y-4">
                        <input
                          type="text"
                          placeholder="Nama Murid"
                          value={newStudentName}
                          onChange={(e) => setNewStudentName(e.target.value)}
                          className={`w-full ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100"} border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-rose-500 transition-all`}
                        />
                        <input
                          type="number"
                          placeholder="Nilai (0-100)"
                          value={newStudentScore}
                          onChange={(e) => setNewStudentScore(e.target.value)}
                          className={`w-full ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100"} border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-rose-500 transition-all`}
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

                <div
                  className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-2xl shadow-slate-50"} p-10 rounded-[40px] border overflow-hidden`}
                >
                  <h3
                    className={`font-black text-xl mb-8 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                  >
                    Daftar Nilai Siswa
                  </h3>
                  <div className="overflow-x-auto rounded-[24px] border border-slate-100 dark:border-slate-800">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr
                          className={`text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-50/50 border-slate-100"}`}
                        >
                          <th className="py-5 px-6 w-20 text-center">#</th>
                          <th className="py-5 px-6">Nama Murid</th>
                          <th className="py-5 px-6 w-28">Skor</th>
                          <th className="py-5 px-6 w-36">Status</th>
                          <th className="py-5 px-6 text-right w-24">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {studentScores.map((student, idx) => (
                          <tr
                            key={idx}
                            className="group hover:bg-slate-50/75 dark:hover:bg-slate-800/30 transition-all duration-300"
                          >
                            <td className="py-5 px-6 text-center">
                              <span className="inline-flex w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs items-center justify-center">
                                {idx + 1}
                              </span>
                            </td>
                            <td
                              className={`py-5 px-6 font-black text-sm ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}
                            >
                              {student.name}
                            </td>
                            <td className="py-5 px-6 font-black">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-sm font-black ${student.score >= 75 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                {student.score}
                              </span>
                            </td>
                            <td className="py-5 px-6">
                              <span
                                className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider ${student.score >= 75 ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/40" : "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-100 dark:border-rose-900/40"}`}
                              >
                                {student.score >= 75 ? "Tuntas" : "Remedial"}
                              </span>
                            </td>
                            <td className="py-5 px-6 text-right">
                              <button
                                onClick={() => deleteScore(idx)}
                                className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-850 transition-all"
                                title="Hapus Nilai"
                              >
                                <Trash2 className="w-4 h-4" />
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

            {activeTab === "bank_soal" && (
              <motion.div
                key="bank_soal"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
              >
                <header>
                  <h2
                    className={`text-4xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-800"}`}
                  >
                    Bank Soal{" "}
                    <span className="text-slate-500">HOTS Maestro</span>
                  </h2>
                  <p
                    className={`font-medium mt-2 text-lg ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Kembangkan instrumen penilaian berstandar tinggi untuk
                    mengukur kemampuan berpikir kritis.
                  </p>
                </header>

                {/* Mode Toggle Navigation */}
                <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-[32px] w-fit border border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setBankSoalMode("generate")}
                    className={`px-8 py-3.5 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2.5 ${bankSoalMode === "generate" ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xl shadow-slate-200/50 dark:shadow-none translate-y-[-1px]" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    <Sparkles className="w-4 h-4" /> Generator
                  </button>
                  <button
                    onClick={() => setBankSoalMode("result")}
                    className={`px-8 py-3.5 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2.5 ${bankSoalMode === "result" ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xl shadow-slate-200/50 dark:shadow-none translate-y-[-1px]" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    <List className="w-4 h-4" /> Hasil Sekarang
                    {bankSoalQuestions.length > 0 && (
                      <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-sm">
                        {bankSoalQuestions.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setBankSoalMode("saved")}
                    className={`px-8 py-3.5 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2.5 ${bankSoalMode === "saved" ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xl shadow-slate-200/50 dark:shadow-none translate-y-[-1px]" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    <Bookmark className="w-4 h-4" /> Koleksi Saya
                    {savedQuestionBanks.length > 0 && (
                      <span className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-sm">
                        {savedQuestionBanks.length}
                      </span>
                    )}
                  </button>
                </div>

                {bankSoalMode === "generate" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    {/* Sidebar Column */}
                    <div className="lg:col-span-4 sticky top-8 space-y-6">
                      <div
                        className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-100"} p-8 rounded-[40px] border space-y-8`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-white">
                            <ClipboardList className="w-5 h-5" />
                          </div>
                          <span
                            className={`font-black text-sm uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-800"}`}
                          >
                            Konfigurasi Soal
                          </span>
                        </div>

                        <div className="space-y-8">
                          <div className="space-y-6">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between px-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                                  Topik Materi
                                </label>
                                <span className="text-[10px] font-bold text-slate-300">
                                  Wajib
                                </span>
                              </div>
                              <input
                                type="text"
                                value={bankSoalTopic}
                                onChange={(e) =>
                                  setBankSoalTopic(e.target.value)
                                }
                                placeholder="Misal: Perubahan Keruangan ASEAN"
                                className={`w-full ${isDarkMode ? "bg-slate-800/50 border-slate-700 text-white" : "bg-slate-50 border-slate-100/50"} border-2 rounded-[24px] p-5 text-sm font-bold focus:outline-none focus:border-${accentColor}-400 transition-all placeholder:opacity-30`}
                              />
                            </div>

                            <div className="space-y-3">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic px-1">
                                Tingkat Kelas
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {["VII", "VIII", "IX"].map((grade) => (
                                  <button
                                    key={grade}
                                    onClick={() => setBankSoalGrade(grade)}
                                    className={`flex-1 min-w-[70px] py-4 rounded-2xl font-black text-[11px] transition-all border-2 ${bankSoalGrade === grade ? `bg-${accentColor}-600 border-${accentColor}-600 text-white shadow-xl shadow-${accentColor}-500/20` : isDarkMode ? "bg-slate-800 border-slate-700 text-slate-500" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"}`}
                                  >
                                    KELAS {grade}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                            <div className="space-y-3">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic px-1">
                                Tingkat Kesukaran
                              </label>
                              <div className="grid grid-cols-3 p-1.5 bg-slate-100 dark:bg-slate-850 rounded-[20px] border border-slate-200 dark:border-slate-700">
                                {["mudah", "sedang", "sukar"].map((diff) => (
                                  <button
                                    key={diff}
                                    onClick={() =>
                                      setBankSoalDifficulty(diff as any)
                                    }
                                    className={`py-3 text-[9px] font-black uppercase rounded-2xl transition-all ${bankSoalDifficulty === diff ? `bg-white dark:bg-slate-700 shadow-xl text-${accentColor}-600 dark:text-white` : "text-slate-400"}`}
                                  >
                                    {diff}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic px-1">
                                  Jumlah Butir
                                </label>
                                <select
                                  value={bankSoalCount}
                                  onChange={(e) =>
                                    setBankSoalCount(parseInt(e.target.value))
                                  }
                                  className={`w-full ${isDarkMode ? "bg-slate-800/50 border-slate-700 text-white" : "bg-slate-50 border-slate-100/50"} border-2 rounded-2xl p-4 text-xs font-black focus:outline-none appearance-none`}
                                >
                                  {[5, 10, 15, 20].map((c) => (
                                    <option key={c} value={c}>
                                      {c} Soal
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-3">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic px-1">
                                  Opsi Jawaban
                                </label>
                                <select
                                  value={bankSoalOptionCount}
                                  onChange={(e) =>
                                    setBankSoalOptionCount(
                                      parseInt(e.target.value),
                                    )
                                  }
                                  className={`w-full ${isDarkMode ? "bg-slate-800/50 border-slate-700 text-white" : "bg-slate-50 border-slate-100/50"} border-2 rounded-2xl p-4 text-xs font-black focus:outline-none appearance-none`}
                                >
                                  <option value={4}>4 Opsi (A-D)</option>
                                  <option value={5}>5 Opsi (A-E)</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 px-1 italic">
                              Tipe & Bentuk Soal
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: "pilihan_ganda", label: "Pilihan Ganda" },
                                { id: "pilihan_ganda_kompleks", label: "Pilihan Ganda Kompleks" },
                                { id: "menjodohkan", label: "Menjodohkan" },
                                { id: "mengurutkan", label: "Mengurutkan" },
                                { id: "benar_salah", label: "Benar-Salah" },
                              ].map((t) => {
                                const isSelected = bankSoalAllowedTypes.includes(t.id);
                                return (
                                  <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        if (bankSoalAllowedTypes.length > 1) {
                                          setBankSoalAllowedTypes(bankSoalAllowedTypes.filter((x) => x !== t.id));
                                        } else {
                                          setStatus({ type: "error", message: "Minimal harus memilih satu bentuk soal!" });
                                        }
                                      } else {
                                        setBankSoalAllowedTypes([...bankSoalAllowedTypes, t.id]);
                                      }
                                    }}
                                    className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                                      isSelected
                                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none"
                                        : isDarkMode
                                          ? "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                                          : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                                    }`}
                                  >
                                    <div className={`w-3.5 h-3.5 rounded-md flex items-center justify-center border ${isSelected ? "bg-white text-indigo-600 border-white" : "border-slate-300 dark:border-slate-600"}`}>
                                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-wider leading-tight">{t.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 italic px-1">
                              Sumber Dokumen (Opsional)
                            </label>
                            <label
                              className={`group block w-full border-2 border-dashed ${bankSoalFile ? `border-${accentColor}-500 bg-${accentColor}-500/5` : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"} rounded-[32px] p-8 text-center cursor-pointer transition-all active:scale-[0.98]`}
                            >
                              {isExtractingBankSoalFile ? (
                                <div className="flex flex-col items-center gap-3">
                                  <div className="relative">
                                    <div
                                      className={`w-12 h-12 bg-${accentColor}-500/10 rounded-full flex items-center justify-center`}
                                    >
                                      <Loader2
                                        className={`w-6 h-6 animate-spin text-${accentColor}-500`}
                                      />
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Mengekstrak Teks...
                                  </span>
                                </div>
                              ) : bankSoalFile ? (
                                <div className="flex flex-col items-center gap-3">
                                  <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-emerald-500" />
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                                    {bankSoalFile.name}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-3">
                                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <UploadCloud className="w-6 h-6 text-slate-400" />
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                      Unggah Dokumen
                                    </span>
                                    <p className="text-[8px] font-medium text-slate-400 mt-1 uppercase">
                                      PDF, DOCX, TXT
                                    </p>
                                  </div>
                                </div>
                              )}
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.docx,.txt"
                                onChange={handleBankSoalFileUpload}
                              />
                            </label>
                            {bankSoalFile && (
                              <button
                                onClick={() => {
                                  setBankSoalFile(null);
                                  setBankSoalFileText("");
                                }}
                                className="mt-3 flex items-center gap-2 mx-auto text-[9px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" /> Hapus Dokumen
                              </button>
                            )}
                          </div>

                          <button
                            onClick={handleGenerateBankSoal}
                            disabled={
                              (!bankSoalTopic && !bankSoalFileText) ||
                              isGeneratingBankSoal
                            }
                            className={`w-full py-5 bg-${accentColor}-600 text-white rounded-[24px] font-black text-sm tracking-[0.2em] uppercase shadow-2xl shadow-${accentColor}-500/20 hover:bg-${accentColor}-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:hover:scale-100`}
                          >
                            {isGeneratingBankSoal ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Sparkles className="w-5 h-5" />
                            )}
                            Mulai Generate
                          </button>
                        </div>
                      </div>

                      {/* AI Stylist Customization Card (Bank Soal) */}
                      <div
                        className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-100"} p-8 rounded-[40px] border space-y-6`}
                      >
                        <button
                          onClick={() =>
                            setIsBankSoalStylistOpen(!isBankSoalStylistOpen)
                          }
                          className="w-full flex items-center justify-between group hover:opacity-80 transition-opacity"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 ${getModuleThemeClasses(bankSoalTheme).bgLight} ${getModuleThemeClasses(bankSoalTheme).primaryText} rounded-xl flex items-center justify-center transition-all`}
                            >
                              <Palette className="w-5 h-5" />
                            </div>
                            <span
                              className={`font-black text-xs uppercase tracking-widest text-left ${isDarkMode ? "text-white" : "text-slate-800"}`}
                            >
                              🎨 Tema & Tata Letak Bank Soal
                            </span>
                          </div>
                          <span className="text-slate-400 font-bold text-xs">
                            {isBankSoalStylistOpen ? "Tutup" : "Sesuaikan"}{" "}
                            &rarr;
                          </span>
                        </button>

                        {isBankSoalStylistOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800"
                          >
                            {/* Tema Warna (Color Theme) */}
                            <div className="space-y-3">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                                Tema Warna Dokumen
                              </label>
                              <div className="grid grid-cols-6 gap-2">
                                {[
                                  {
                                    id: "emerald",
                                    hex: "#10b981",
                                    label: "Emerald",
                                  },
                                  { id: "blue", hex: "#3b82f6", label: "Blue" },
                                  {
                                    id: "indigo",
                                    hex: "#6366f1",
                                    label: "Indigo",
                                  },
                                  {
                                    id: "amber",
                                    hex: "#f59e0b",
                                    label: "Amber",
                                  },
                                  { id: "rose", hex: "#f43f5e", label: "Rose" },
                                  { id: "teal", hex: "#14b8a6", label: "Teal" },
                                ].map((themeOpt) => (
                                  <button
                                    key={themeOpt.id}
                                    onClick={() =>
                                      setBankSoalTheme(themeOpt.id as any)
                                    }
                                    className={`w-full aspect-square rounded-xl transition-all border-2 flex items-center justify-center ${bankSoalTheme === themeOpt.id ? "border-slate-800 dark:border-white scale-110 shadow" : "border-transparent opacity-60 hover:opacity-100"}`}
                                    style={{ backgroundColor: themeOpt.hex }}
                                    title={themeOpt.label}
                                  >
                                    {bankSoalTheme === themeOpt.id && (
                                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Tipografi (Font Selection) */}
                            <div className="space-y-3">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                                Tipografi (Font)
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  { id: "font-inter", label: "Inter" },
                                  { id: "font-outfit", label: "Outfit" },
                                  { id: "font-space", label: "Space Grotesk" },
                                  {
                                    id: "font-playfair",
                                    label: "Playfair Display",
                                  },
                                ].map((fontOpt) => (
                                  <button
                                    key={fontOpt.id}
                                    onClick={() =>
                                      setBankSoalFont(fontOpt.id as any)
                                    }
                                    className={`py-2 px-3 border rounded-xl text-[9px] font-black tracking-widest uppercase transition-all ${bankSoalFont === fontOpt.id ? `bg-${getModuleThemeClasses(bankSoalTheme).primary} border-${getModuleThemeClasses(bankSoalTheme).primary} text-white` : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"}`}
                                  >
                                    {fontOpt.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Tata Letak/Layout Style */}
                            <div className="space-y-3">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                                Tata Letak (Layout)
                              </label>
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  { id: "classic", label: "Klasik" },
                                  { id: "modern", label: "Modern" },
                                  { id: "minimalist", label: "Minimalis" },
                                ].map((layoutOpt) => (
                                  <button
                                    key={layoutOpt.id}
                                    onClick={() =>
                                      setBankSoalLayoutSetting(
                                        layoutOpt.id as any,
                                      )
                                    }
                                    className={`py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${bankSoalLayoutSetting === layoutOpt.id ? `bg-${getModuleThemeClasses(bankSoalTheme).primary} border-${getModuleThemeClasses(bankSoalTheme).primary} text-white` : "border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400"}`}
                                  >
                                    {layoutOpt.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-8">
                      <div className="flex flex-col items-center justify-center h-full min-h-[400px] opacity-20 italic">
                        <BrainCircuit className="w-32 h-32 mb-6" />
                        <p className="font-black uppercase tracking-[0.3em]">
                          Siap Untuk Menciptakan...
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {bankSoalMode === "result" && (
                  <div className="lg:col-span-12 space-y-32">
                    {/* Sub-Navigation for Result Views */}
                    <div className="flex flex-wrap items-center gap-4 p-2 bg-slate-50 dark:bg-slate-900 rounded-[32px] w-fit border border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => setBankSoalView("questions")}
                        className={`px-8 py-4 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 ${bankSoalView === "questions" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-xl" : "text-slate-400"}`}
                      >
                        <List className="w-4 h-4" /> Butir Soal
                      </button>
                      <button
                        onClick={() => setBankSoalView("kisi-kisi")}
                        className={`px-8 py-4 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 ${bankSoalView === "kisi-kisi" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-xl" : "text-slate-400"}`}
                      >
                        <TableProperties className="w-4 h-4" /> Kisi-Kisi
                        (Blueprints)
                      </button>
                      <button
                        onClick={() => setBankSoalView("kunci")}
                        className={`px-8 py-4 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 ${bankSoalView === "kunci" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-xl" : "text-slate-400"}`}
                      >
                        <CheckCircle2 className="w-4 h-4" /> Kunci & Analisis
                      </button>
                    </div>
                    {bankSoalView === "kisi-kisi" && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`p-10 rounded-[48px] ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-2xl shadow-slate-100"} border`}
                      >
                        <header className="mb-10 text-center">
                          <h3
                            className={`text-2xl font-black ${isDarkMode ? "text-white" : "text-slate-800"} tracking-tighter uppercase mb-2`}
                          >
                            Kisi-Kisi Instrumen Penilaian IPS
                          </h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                            Standar Kompetensi Lulusan (SKL) • Kurikulum
                            Merdeka/K13
                          </p>
                        </header>

                        <div className="relative group/scroll">
                          <div className="overflow-x-auto pb-6 scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-800 dark:scrollbar-thumb-slate-700">
                            <table className="w-full text-left border-separate border-spacing-0 min-w-[1200px]">
                              <thead>
                                <tr
                                  className={`${isDarkMode ? "bg-slate-800 text-white" : "bg-slate-900 text-white"}`}
                                >
                                  <th
                                    className="sticky left-0 z-20 px-6 py-5 text-[10px] font-black uppercase tracking-widest rounded-tl-2xl shadow-[4px_0_10px_rgba(0,0,0,0.1)] border-r border-white/10"
                                    style={{
                                      backgroundColor: isDarkMode
                                        ? "#1e293b"
                                        : "#0f172a",
                                    }}
                                  >
                                    No.
                                  </th>
                                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">
                                    Kompetensi Dasar / CP
                                  </th>
                                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest border-l border-white/10">
                                    Materi / Subtopik
                                  </th>
                                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest border-l border-white/10">
                                    Indikator Soal
                                  </th>
                                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest border-l border-white/10">
                                    Tags
                                  </th>
                                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest border-l border-white/10">
                                    Level
                                  </th>
                                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest rounded-tr-2xl border-l border-white/10">
                                    Kesukaran
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {bankSoalKisiKisi.map((k, idx) => {
                                  const q =
                                    bankSoalQuestions.find(
                                      (curr) =>
                                        bankSoalQuestions.indexOf(curr) + 1 ===
                                        k.no_soal,
                                    ) || bankSoalQuestions[idx];
                                  return (
                                    <tr
                                      key={idx}
                                      className={`group/row hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors`}
                                    >
                                      <td
                                        className="sticky left-0 z-10 px-6 py-6 font-black text-indigo-500 shadow-[2px_0_5px_rgba(0,0,0,0.02)] border-r border-slate-100 dark:border-slate-800 text-center"
                                        style={{
                                          backgroundColor: isDarkMode
                                            ? "#0f172a"
                                            : "#ffffff",
                                        }}
                                      >
                                        {k.no_soal}
                                      </td>
                                      <td
                                        className={`px-6 py-6 text-xs font-bold leading-relaxed w-[20%] ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
                                      >
                                        {k.kompetensi_dasar}
                                      </td>
                                      <td className="px-6 py-6 w-[15%]">
                                        <div
                                          className={`text-xs font-black italic text-indigo-500 mb-1`}
                                        >
                                          {k.materi}
                                        </div>
                                        {q?.subtopic && (
                                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded w-fit">
                                            {q.subtopic}
                                          </div>
                                        )}
                                      </td>
                                      <td
                                        className={`px-6 py-6 text-xs font-bold leading-relaxed w-[30%] ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
                                      >
                                        {k.indikator_soal}
                                      </td>
                                      <td className="px-6 py-6 w-[15%]">
                                        <div className="flex flex-wrap gap-1.5">
                                          {q?.tags?.map(
                                            (tag: string, tidx: number) => (
                                              <span
                                                key={tidx}
                                                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[8px] font-black rounded-md uppercase tracking-tighter border border-slate-200 dark:border-slate-700"
                                              >
                                                {tag}
                                              </span>
                                            ),
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-6 py-6 w-[10%]">
                                        <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 text-[9px] font-black rounded-lg uppercase flex items-center justify-center w-fit border border-indigo-100 dark:border-indigo-800/20">
                                          {k.level_kognitif}
                                        </span>
                                      </td>
                                      <td className="px-6 py-6 w-[10%]">
                                        <span
                                          className={`px-3 py-1 ${k.tingkat_kesukaran === "Sukar" ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"} text-[9px] font-black rounded-lg uppercase border flex items-center justify-center w-fit`}
                                        >
                                          {k.tingkat_kesukaran}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          {/* Scroll Indicator Overlay */}
                          <div className="absolute right-0 top-0 bottom-6 w-12 bg-gradient-to-l from-white dark:from-slate-900 to-transparent pointer-events-none opacity-0 group-hover/scroll:opacity-100 transition-opacity" />
                        </div>
                      </motion.div>
                    )}

                    {bankSoalView === "kunci" && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                      >
                        {bankSoalQuestions.map((q, idx) => (
                          <div
                            key={idx}
                            className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-100"} p-10 rounded-[40px] border space-y-8 group hover:border-emerald-500 transition-all`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                                {idx + 1}
                              </div>
                              <div className="text-4xl font-black text-indigo-600">
                                PILIHAN {q.answer}
                              </div>
                            </div>
                            <div className="pt-6 border-t border-slate-50 dark:border-slate-800">
                              <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-4">
                                Analisa Butir Soal
                              </h5>
                              <p
                                className={`text-xs font-bold italic leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                              >
                                "{q.analysis || "Tidak ada analisis tersedia"}"
                              </p>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {bankSoalView === "questions" && (
                      <div className="space-y-6">
                        {/* Filtering UI */}
                        <div
                          className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-50"} p-6 rounded-[32px] border space-y-4`}
                        >
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Cari soal, subtopik, atau tag..."
                                value={bankSoalSearchFilter}
                                onChange={(e) =>
                                  setBankSoalSearchFilter(e.target.value)
                                }
                                className={`w-full ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100"} border-2 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-500 transition-all`}
                              />
                            </div>
                            <button
                              onClick={() => handleSaveBankSoal("")}
                              className="px-6 py-3 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
                            >
                              <BookmarkPlus className="w-4 h-4" /> Simpan Ke
                              Koleksi
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">
                                <Filter className="w-3 h-3" /> Subtopik
                              </label>
                              <select
                                value={bankSoalTopicFilter}
                                onChange={(e) =>
                                  setBankSoalTopicFilter(e.target.value)
                                }
                                className={`w-full ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100"} border-2 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none`}
                              >
                                <option value="all">Semua Subtopik</option>
                                {Array.from(
                                  new Set(
                                    bankSoalQuestions
                                      .map((q) => q.subtopic)
                                      .filter(Boolean),
                                  ),
                                ).map((topic: any) => (
                                  <option key={topic} value={topic}>
                                    {topic}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">
                                <Tag className="w-3 h-3" /> Tag
                              </label>
                              <select
                                value={bankSoalTagFilter}
                                onChange={(e) =>
                                  setBankSoalTagFilter(e.target.value)
                                }
                                className={`w-full ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100"} border-2 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none`}
                              >
                                <option value="all">Semua Tag</option>
                                {Array.from(
                                  new Set(
                                    bankSoalQuestions
                                      .flatMap((q) => q.tags || [])
                                      .filter(Boolean),
                                  ),
                                ).map((tag: any) => (
                                  <option key={tag} value={tag}>
                                    {tag}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">
                                <Zap className="w-3 h-3" /> Level HOTS
                              </label>
                              <select
                                value={bankSoalLevelFilter}
                                onChange={(e) =>
                                  setBankSoalLevelFilter(e.target.value)
                                }
                                className={`w-full ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100"} border-2 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none`}
                              >
                                <option value="all">Semua Level</option>
                                <option value="C4">C4 - Analisis</option>
                                <option value="C5">C5 - Evaluasi</option>
                                <option value="C6">C6 - Kreasi</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <div
                          className={`flex flex-wrap justify-between items-center ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"} p-4 rounded-2xl border gap-4`}
                        >
                          <div className="flex items-center gap-4 px-4 font-black">
                            <span className="text-xs text-slate-400 uppercase tracking-widest ">
                              Preview Bank Soal
                            </span>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                              <button
                                onClick={() =>
                                  setBankSoalQuestionLayout("card")
                                }
                                className={`p-2 rounded-lg transition-all ${bankSoalQuestionLayout === "card" ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-500" : "text-slate-400"}`}
                                title="Tampilan Kartu"
                              >
                                <Layers className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  setBankSoalQuestionLayout("table")
                                }
                                className={`p-2 rounded-lg transition-all ${bankSoalQuestionLayout === "table" ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-500" : "text-slate-400"}`}
                                title="Tampilan Tabel"
                              >
                                <List className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] ${isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}
                            >
                              {
                                bankSoalQuestions.filter((q) => {
                                  const matchesSearch =
                                    q.question
                                      .toLowerCase()
                                      .includes(
                                        bankSoalSearchFilter.toLowerCase(),
                                      ) ||
                                    (q.subtopic &&
                                      q.subtopic
                                        .toLowerCase()
                                        .includes(
                                          bankSoalSearchFilter.toLowerCase(),
                                        )) ||
                                    (q.tags &&
                                      q.tags.some((t: string) =>
                                        t
                                          .toLowerCase()
                                          .includes(
                                            bankSoalSearchFilter.toLowerCase(),
                                          ),
                                      ));
                                  const matchesTopic =
                                    bankSoalTopicFilter === "all" ||
                                    q.subtopic === bankSoalTopicFilter;
                                  const matchesTag =
                                    bankSoalTagFilter === "all" ||
                                    (q.tags &&
                                      q.tags.includes(bankSoalTagFilter));
                                  const matchesLevel =
                                    bankSoalLevelFilter === "all" ||
                                    q.level === bankSoalLevelFilter;
                                  return (
                                    matchesSearch &&
                                    matchesTopic &&
                                    matchesTag &&
                                    matchesLevel
                                  );
                                }).length
                              }{" "}
                              Soal
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={handleExportBankSoalJSON}
                              className={`flex items-center gap-2 px-5 py-2.5 ${isDarkMode ? "bg-amber-900 text-amber-100" : "bg-amber-500 text-white"} rounded-xl text-xs font-bold shadow-lg transition-all`}
                              title="Ekspor ke JSON"
                            >
                              <FileJson className="w-4 h-4" /> JSON
                            </button>
                            <button
                              onClick={handleExportBankSoalCSV}
                              className={`flex items-center gap-2 px-5 py-2.5 ${isDarkMode ? "bg-emerald-900 text-emerald-100" : "bg-emerald-500 text-white"} rounded-xl text-xs font-bold shadow-lg transition-all`}
                              title="Ekspor ke CSV"
                            >
                              <FileSpreadsheet className="w-4 h-4" /> CSV
                            </button>
                            <button
                              onClick={handleExportBankSoalPDF}
                              className={`flex items-center gap-2 px-5 py-2.5 ${isDarkMode ? "bg-rose-900 text-rose-100" : "bg-rose-500 text-white"} rounded-xl text-xs font-bold shadow-lg transition-all`}
                              title="Ekspor ke PDF"
                            >
                              <File className="w-4 h-4" /> PDF
                            </button>
                            <button
                              onClick={handleExportBankSoalDOCX}
                              className={`flex items-center gap-2 px-5 py-2.5 ${isDarkMode ? "bg-blue-900 text-blue-100" : "bg-blue-500 text-white"} rounded-xl text-xs font-bold shadow-lg transition-all`}
                              title="Ekspor ke Word (DOCX)"
                            >
                              <FileText className="w-4 h-4" /> Word
                            </button>
                            <button
                              onClick={handleSaveBankSoalToDrive}
                              disabled={isUploadingBankSoalToDrive}
                              className={`flex items-center gap-2 px-5 py-2.5 ${isDarkMode ? "bg-indigo-900 text-indigo-100 hover:bg-indigo-800" : "bg-indigo-500 text-white hover:bg-indigo-600"} rounded-xl text-xs font-bold shadow-lg transition-all disabled:opacity-50`}
                            >
                              {isUploadingBankSoalToDrive ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <HardDrive className="w-4 h-4" />
                              )}
                              Simpan ke Drive
                            </button>
                            <button
                              onClick={() =>
                                exportPDF(
                                  "bank-soal-content",
                                  `BankSoal_${bankSoalGrade}_${bankSoalTopic.substring(0, 20)}`,
                                )
                              }
                              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 shadow-lg shadow-slate-100 transition-all"
                            >
                              <Download className="w-4 h-4" /> PDF
                            </button>
                          </div>
                        </div>
                        {/* Beautiful Printable & Style personalized Container */}
                        <div
                          id="bank-soal-content"
                          className={`${bankSoalFont} space-y-8 relative overflow-hidden`}
                        >
                          {/* Printable Branding Header (Adjusts to theme & layout) */}
                          <div
                            className={`p-8 md:p-12 rounded-[40px] border shadow-2xl ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-slate-100/50"} relative overflow-hidden`}
                          >
                            {bankSoalLayoutSetting === "modern" && (
                              <div
                                className={`absolute top-0 left-0 right-0 h-4 bg-gradient-to-r ${getModuleThemeClasses(bankSoalTheme).gradient}`}
                              />
                            )}
                            {bankSoalLayoutSetting === "classic" && (
                              <div
                                className={`absolute top-0 left-0 right-0 h-3 bg-${getModuleThemeClasses(bankSoalTheme).primary}`}
                              />
                            )}

                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                              <div className="flex items-center gap-5">
                                <div
                                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${getModuleThemeClasses(bankSoalTheme).gradient} shadow-lg shadow-${getModuleThemeClasses(bankSoalTheme).primary}/20`}
                                >
                                  <ClipboardList className="w-7 h-7" />
                                </div>
                                <div>
                                  <h2
                                    className={`text-2xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"} uppercase`}
                                  >
                                    Koleksi Bank Soal Maestro
                                  </h2>
                                  <p
                                    className={`text-[10px] font-black uppercase tracking-[0.2em] ${getModuleThemeClasses(bankSoalTheme).textStrong}`}
                                  >
                                    Topik:{" "}
                                    {bankSoalTopic ||
                                      "Perubahan Keruangan ASEAN"}{" "}
                                    • Kelas {bankSoalGrade}
                                  </p>
                                </div>
                              </div>
                              <div className="text-left md:text-right">
                                <span
                                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${getModuleThemeClasses(bankSoalTheme).badge} border border-current/15`}
                                >
                                  TEMA: {bankSoalTheme.toUpperCase()} •{" "}
                                  {bankSoalLayoutSetting.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {bankSoalQuestionLayout === "card" ? (
                            <div className="grid gap-8">
                              {bankSoalQuestions
                                .filter((q) => {
                                  const matchesSearch =
                                    q.question
                                      .toLowerCase()
                                      .includes(
                                        bankSoalSearchFilter.toLowerCase(),
                                      ) ||
                                    (q.subtopic &&
                                      q.subtopic
                                        .toLowerCase()
                                        .includes(
                                          bankSoalSearchFilter.toLowerCase(),
                                        )) ||
                                    (q.tags &&
                                      q.tags.some((t: string) =>
                                        t
                                          .toLowerCase()
                                          .includes(
                                            bankSoalSearchFilter.toLowerCase(),
                                          ),
                                      ));
                                  const matchesTopic =
                                    bankSoalTopicFilter === "all" ||
                                    q.subtopic === bankSoalTopicFilter;
                                  const matchesTag =
                                    bankSoalTagFilter === "all" ||
                                    (q.tags &&
                                      q.tags.includes(bankSoalTagFilter));
                                  const matchesLevel =
                                    bankSoalLevelFilter === "all" ||
                                    q.level === bankSoalLevelFilter;
                                  return (
                                    matchesSearch &&
                                    matchesTopic &&
                                    matchesTag &&
                                    matchesLevel
                                  );
                                })
                                .map((q, qIdx) => {
                                  const originalIdx =
                                    bankSoalQuestions.indexOf(q);
                                  const hotColors: Record<string, string> = {
                                    C4: `bg-${getModuleThemeClasses(bankSoalTheme).primary} text-white border-${getModuleThemeClasses(bankSoalTheme).primary} shadow-sm`,
                                    C5: "bg-amber-500 text-white border-amber-200 shadow-sm",
                                    C6: "bg-rose-500 text-white border-rose-200 shadow-sm",
                                  };

                                  const hotLightColors: Record<string, string> =
                                    {
                                      C4: `${getModuleThemeClasses(bankSoalTheme).bgLight} ${getModuleThemeClasses(bankSoalTheme).primaryText}`,
                                      C5: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
                                      C6: "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400",
                                    };

                                  const hotIcons: Record<string, any> = {
                                    C4: (
                                      <Zap className="w-3.5 h-3.5 fill-current" />
                                    ),
                                    C5: <Target className="w-3.5 h-3.5" />,
                                    C6: <Award className="w-3.5 h-3.5" />,
                                  };

                                  const hotLabels: Record<string, string> = {
                                    C4: "Analisis (C4)",
                                    C5: "Evaluasi (C5)",
                                    C6: "Kreasi (C6)",
                                  };

                                  const hotDescriptions: Record<
                                    string,
                                    string
                                  > = {
                                    C4: "Menguraikan materi ke dalam komponen-komponennya dan menentukan hubungan antarbagian.",
                                    C5: "Membuat pertimbangan berdasarkan kriteria dan standar tertentu.",
                                    C6: "Menempatkan elemen secara bersama-sama untuk membentuk satu kesatuan yang utuh atau fungsional.",
                                  };

                                  return (
                                    <motion.div
                                      key={originalIdx}
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: qIdx * 0.1 }}
                                      className={`${
                                        bankSoalLayoutSetting === "classic"
                                          ? "rounded-2xl border-2 shadow-md"
                                          : bankSoalLayoutSetting ===
                                              "minimalist"
                                            ? "rounded-none border-b border-t-0 border-l-0 border-r-0 shadow-none px-0 py-10"
                                            : "rounded-[56px] shadow-2xl shadow-slate-100 dark:shadow-none"
                                      } ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"} p-8 md:p-12 border relative overflow-hidden group`}
                                    >
                                      {/* Background Accent */}
                                      {bankSoalLayoutSetting !==
                                        "minimalist" && (
                                        <div
                                          className={`absolute top-0 right-0 w-96 h-96 ${hotLightColors[q.level] || "bg-slate-50"} opacity-10 blur-[100px] -mr-48 -mt-48 transition-all duration-700 group-hover:scale-150`}
                                        />
                                      )}

                                      {/* Header Section */}
                                      <div className="flex flex-wrap items-center justify-between mb-10 gap-6 pb-8 border-b border-slate-100 dark:border-slate-800 relative z-10">
                                        <div className="flex flex-wrap items-center gap-4">
                                          <div
                                            className={`px-6 py-3 ${hotColors[q.level] || "bg-slate-500 text-white"} ${
                                              bankSoalLayoutSetting ===
                                              "classic"
                                                ? "rounded-lg"
                                                : bankSoalLayoutSetting ===
                                                    "minimalist"
                                                  ? "rounded-none"
                                                  : "rounded-[24px]"
                                            } text-[11px] font-black uppercase tracking-[0.2em] shadow-xl flex items-center gap-3`}
                                          >
                                            {hotIcons[q.level] || (
                                              <Sparkles className="w-3.5 h-3.5" />
                                            )}
                                            SOAL {qIdx + 1}
                                          </div>
                                          <div
                                            className={`flex items-center gap-3 px-5 py-2.5 ${hotLightColors[q.level] || "bg-slate-50 text-slate-500"} ${
                                              bankSoalLayoutSetting ===
                                              "classic"
                                                ? "rounded-lg"
                                                : bankSoalLayoutSetting ===
                                                    "minimalist"
                                                  ? "rounded-none"
                                                  : "rounded-2xl"
                                            } border border-current/10`}
                                          >
                                            <div className="text-[10px] font-black uppercase tracking-widest">
                                              {hotLabels[q.level] || q.level}
                                            </div>
                                          </div>
                                          {q.subtopic && (
                                            <span
                                              className={`px-4 py-2 ${isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-400"} ${
                                                bankSoalLayoutSetting ===
                                                "classic"
                                                  ? "rounded-lg"
                                                  : bankSoalLayoutSetting ===
                                                      "minimalist"
                                                    ? "rounded-none"
                                                    : "rounded-2xl"
                                              } text-[9px] font-black uppercase tracking-[0.1em] border border-transparent dark:border-slate-700`}
                                            >
                                              {q.subtopic}
                                            </span>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-700">
                                          <button
                                            onClick={() =>
                                              handleStartEdit(originalIdx)
                                            }
                                            className="p-2.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-blue-500 transition-all hover:scale-110"
                                            title="Edit Soal"
                                          >
                                            <Edit2 className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleDeleteQuestion(originalIdx)
                                            }
                                            className="p-2.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-rose-500 transition-all hover:scale-110"
                                            title="Hapus Soal"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>

                                      {/* HOTS Level Description */}
                                      <div className="mb-8 p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-100 dark:border-slate-700 relative z-10">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 italic">
                                          Ranah Kognitif:
                                        </p>
                                        <p
                                          className={`text-xs font-black ${isDarkMode ? "text-slate-300" : "text-slate-600"} leading-relaxed`}
                                        >
                                          {hotDescriptions[q.level] ||
                                            "Higher Order Thinking Skills"}
                                        </p>
                                      </div>

                                      {/* Question Body */}
                                      <div
                                        className={`prose ${isDarkMode ? "prose-invert" : "prose-slate"} max-w-none text-xl md:text-2xl font-black mb-12 leading-relaxed tracking-tight text-slate-800 dark:text-slate-100 relative z-10`}
                                      >
                                        <ReactMarkdown
                                          remarkPlugins={[remarkGfm]}
                                          components={{
                                            a: ({ node, ...props }) => (
                                              <a
                                                {...props}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 underline"
                                              />
                                            ),
                                            img: ({ node, ...props }) => (
                                              <div className="my-10 relative">
                                                <img
                                                  {...props}
                                                  className="rounded-[40px] shadow-2xl object-cover w-full max-h-[500px] border-8 border-white dark:border-slate-800"
                                                  referrerPolicy="no-referrer"
                                                />
                                                <div className="absolute top-6 right-6 p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-lg">
                                                  <Search className="w-4 h-4 text-slate-400" />
                                                </div>
                                              </div>
                                            ),
                                          }}
                                        >
                                          {q.question}
                                        </ReactMarkdown>
                                      </div>

                                      {/* Options / Elements rendering based on type */}
                                      {(q.type === "pilihan_ganda" || q.type === "pilihan_ganda_kompleks" || (!q.type && q.options)) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 relative z-10 w-full">
                                          {Object.entries(q.options || {}).map(
                                            ([key, value]) => {
                                              const isCorrect = q.type === "pilihan_ganda_kompleks"
                                                ? (Array.isArray(q.answer) ? q.answer.includes(key) : String(q.answer).split(",").map(x => x.trim()).includes(key))
                                                : q.answer === key;
                                              return (
                                                <div
                                                  key={key}
                                                  className={`flex items-start gap-5 p-7 ${
                                                    bankSoalLayoutSetting === "classic"
                                                      ? "rounded-xl"
                                                      : bankSoalLayoutSetting === "minimalist"
                                                        ? "rounded-none border shadow-none"
                                                        : "rounded-[32px]"
                                                  } border-2 transition-all duration-300 group/opt ${
                                                    isCorrect
                                                      ? `bg-emerald-55/65 dark:bg-emerald-900/20 border-emerald-500 shadow-lg shadow-emerald-100/50 dark:shadow-none translate-y-[-2px]`
                                                      : isDarkMode
                                                        ? "bg-slate-800/40 border-slate-700 hover:border-slate-500"
                                                        : "bg-white border-slate-100/80 hover:border-slate-300 shadow-sm hover:shadow-md"
                                                  }`}
                                                >
                                                  <div
                                                    className={`w-12 h-12 ${
                                                      bankSoalLayoutSetting === "classic"
                                                        ? "rounded-lg"
                                                        : bankSoalLayoutSetting === "minimalist"
                                                          ? "rounded-none"
                                                          : "rounded-[20px]"
                                                    } flex items-center justify-center flex-shrink-0 text-base font-black transition-all ${
                                                      isCorrect
                                                        ? "bg-emerald-500 text-white shadow-xl shadow-emerald-200 dark:shadow-none"
                                                        : isDarkMode
                                                          ? "bg-slate-700 text-slate-400"
                                                          : "bg-slate-50 text-slate-400"
                                                    }`}
                                                  >
                                                    {key}
                                                  </div>
                                                  <div
                                                    className={`text-sm md:text-base font-bold pt-3 leading-relaxed ${isCorrect ? "text-emerald-800 dark:text-emerald-300" : isDarkMode ? "text-slate-300" : "text-slate-600"}`}
                                                  >
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                      {value as string}
                                                    </ReactMarkdown>
                                                  </div>
                                                </div>
                                              );
                                            }
                                          )}
                                        </div>
                                      )}

                                      {q.type === "menjodohkan" && q.pairs && (
                                        <div className="space-y-4 mb-12 relative z-10 w-full">
                                          <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 italic mb-3">Pasangkan Premis (Kiri) Dengan Respon (Kanan):</h5>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                              <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider block px-1">Premis</span>
                                              {q.pairs.map((p: any, i: number) => (
                                                <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm">
                                                  {i + 1}. {p.premise}
                                                </div>
                                              ))}
                                            </div>
                                            <div className="space-y-3">
                                              <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider block px-1">Respon Sesuai Pasangan</span>
                                              {q.pairs.map((p: any, i: number) => (
                                                <div key={i} className="p-4 bg-emerald-50/20 dark:bg-emerald-900/10 border-2 border-emerald-500 border-dashed rounded-2xl font-bold text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                                                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                                                  {p.response}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {q.type === "mengurutkan" && q.items && (
                                        <div className="space-y-4 mb-12 relative z-10 w-full">
                                          <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 italic mb-3">Urutan Langkah Kronologis / Logis yang Benar:</h5>
                                          <div className="flex flex-col gap-3">
                                            {(Array.isArray(q.answer) ? q.answer : q.items).map((item: any, i: number) => (
                                              <div key={i} className="flex items-center gap-4 p-4 bg-emerald-50/30 dark:bg-emerald-950/25 border-2 border-emerald-500/50 rounded-2xl">
                                                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                                                  {i + 1}
                                                </div>
                                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                  {item}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {q.type === "benar_salah" && q.statements && (
                                        <div className="space-y-4 mb-12 relative z-10 w-full">
                                          <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 italic mb-4">Evaluasi Pernyataan Benar atau Salah:</h5>
                                          <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-b border-slate-100 dark:border-slate-800">
                                            {q.statements.map((st: any, i: number) => (
                                              <div key={i} className="py-4 flex items-center justify-between gap-6">
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                  {i + 1}. {st.statement}
                                                </span>
                                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                                                  st.answer === "Benar"
                                                    ? "bg-emerald-50/20 text-emerald-600 border border-emerald-500/20"
                                                    : "bg-rose-50/20 text-rose-500 border border-rose-500/20"
                                                }`}>
                                                  {st.answer}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Key & Analysis Section */}
                                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 w-full">
                                        <div
                                          className={`lg:col-span-4 p-8 ${
                                            bankSoalLayoutSetting === "classic"
                                              ? "rounded-xl border-2"
                                              : bankSoalLayoutSetting ===
                                                  "minimalist"
                                                ? "rounded-none border shadow-none"
                                                : "rounded-[40px] border-2"
                                          } ${isDarkMode ? "bg-emerald-900/10 border-emerald-500/30" : "bg-emerald-50/50 border-emerald-100"} flex flex-col justify-center items-center text-center gap-6 group/key transition-all hover:border-emerald-350`}
                                        >
                                          <div
                                            className={`w-20 h-20 bg-emerald-500 ${
                                              bankSoalLayoutSetting ===
                                              "classic"
                                                ? "rounded-xl"
                                                : bankSoalLayoutSetting ===
                                                    "minimalist"
                                                  ? "rounded-none"
                                                  : "rounded-[32px]"
                                            } flex items-center justify-center text-white shadow-2xl shadow-emerald-200 dark:shadow-none group-hover:scale-110 transition-transform`}
                                          >
                                            <CheckCircle2 className="w-10 h-10" />
                                          </div>
                                          <div>
                                            <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.4em] mb-2">
                                              Kunci Jawaban
                                            </div>
                                            <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 break-words leading-tight">
                                              {q.type === "pilihan_ganda_kompleks" && (
                                                <span>Pilihan: {Array.isArray(q.answer) ? q.answer.join(", ") : String(q.answer)}</span>
                                              )}
                                              {q.type === "menjodohkan" && (
                                                <span>Sesuai Pasangan</span>
                                              )}
                                              {q.type === "mengurutkan" && (
                                                <span>Urutan Kronologis</span>
                                              )}
                                              {q.type === "benar_salah" && (
                                                <span>Benar / Salah Tertera</span>
                                              )}
                                              {(!q.type || q.type === "pilihan_ganda") && (
                                                <span className="text-4xl font-black">PILIHAN {q.answer}</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        <div
                                          className={`lg:col-span-8 p-10 ${
                                            bankSoalLayoutSetting === "classic"
                                              ? "rounded-xl border-2"
                                              : bankSoalLayoutSetting ===
                                                  "minimalist"
                                                ? "rounded-none border shadow-none"
                                                : "rounded-[40px] border-2"
                                          } ${
                                            isDarkMode
                                              ? "bg-slate-850 border-slate-700"
                                              : `${getModuleThemeClasses(bankSoalTheme).bgLight} border-${getModuleThemeClasses(bankSoalTheme).primary}/20`
                                          } border-2 relative overflow-hidden group/exp transition-all hover:border-${getModuleThemeClasses(bankSoalTheme).primary}/50`}
                                        >
                                          <div className="absolute top-10 right-10 opacity-[0.03] group-hover/exp:scale-125 transition-transform duration-700">
                                            <Info className="w-32 h-32" />
                                          </div>
                                          <div className="relative z-10">
                                            <div
                                              className={`flex items-center gap-3 text-[11px] font-black ${getModuleThemeClasses(bankSoalTheme).primaryText} uppercase tracking-[0.4em] mb-6`}
                                            >
                                              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                              Analisis & Pembahasan
                                            </div>
                                            <div
                                              className={`prose ${isDarkMode ? "prose-invert opacity-90" : "prose-slate"} max-w-none font-bold text-sm md:text-base leading-relaxed`}
                                            >
                                              <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                  img: ({ node, ...props }) => (
                                                    <img
                                                      {...props}
                                                      className="rounded-2xl shadow-xl object-cover max-h-80 my-8 border-4 border-white dark:border-slate-800"
                                                      referrerPolicy="no-referrer"
                                                    />
                                                  ),
                                                  li: ({ node, ...props }) => (
                                                    <li
                                                      {...props}
                                                      className="mb-2"
                                                    />
                                                  ),
                                                }}
                                              >
                                                {q.explanation}
                                              </ReactMarkdown>
                                            </div>
                                            {q.tags && q.tags.length > 0 && (
                                              <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
                                                {q.tags.map(
                                                  (
                                                    tag: string,
                                                    tIdx: number,
                                                  ) => (
                                                    <span
                                                      key={tIdx}
                                                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${isDarkMode ? "bg-slate-800 text-slate-500" : "bg-white text-slate-400 shadow-sm"} border border-current/10`}
                                                    >
                                                      #{tag}
                                                    </span>
                                                  ),
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                            </div>
                          ) : (
                            <div
                              className={`rounded-[40px] border overflow-hidden ${isDarkMode ? "bg-slate-900 border-slate-800 shadow-none" : "bg-white border-slate-100 shadow-2xl shadow-slate-200/40"}`}
                            >
                              <div className="relative group/scroll overflow-hidden">
                                <div className="overflow-x-auto pb-4 custom-scrollbar">
                                  <table className="w-full text-left border-separate border-spacing-0 min-w-[1100px]">
                                    <thead>
                                      <tr
                                        className={
                                          isDarkMode
                                            ? "bg-slate-800 text-slate-400"
                                            : "bg-slate-900 text-white"
                                        }
                                      >
                                        <th
                                          className="sticky left-0 z-30 px-8 py-7 text-[10px] font-black uppercase tracking-[0.2em] border-r border-white/5"
                                          style={{
                                            backgroundColor: isDarkMode
                                              ? "#1e293b"
                                              : "#0f172a",
                                          }}
                                        >
                                          No.
                                        </th>
                                        <th className="px-8 py-7 text-[10px] font-black uppercase tracking-[0.2em]">
                                          Butir Instrumen Soal
                                        </th>
                                        <th className="px-8 py-7 text-[10px] font-black uppercase tracking-[0.2em] border-l border-white/5">
                                          Subtopik
                                        </th>
                                        <th className="px-8 py-7 text-[10px] font-black uppercase tracking-[0.2em] border-l border-white/5">
                                          Klasifikasi
                                        </th>
                                        <th className="px-8 py-7 text-[10px] font-black uppercase tracking-[0.2em] border-l border-white/5">
                                          Level Kognitif
                                        </th>
                                        <th className="px-8 py-7 text-[10px] font-black uppercase tracking-[0.2em] border-l border-white/5 text-center">
                                          Kunci
                                        </th>
                                        <th className="px-8 py-7 text-[10px] font-black uppercase tracking-[0.2em] border-l border-white/5 text-right">
                                          Manajemen
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                      {bankSoalQuestions
                                        .filter((q) => {
                                          const matchesSearch =
                                            q.question
                                              .toLowerCase()
                                              .includes(
                                                bankSoalSearchFilter.toLowerCase(),
                                              ) ||
                                            (q.subtopic &&
                                              q.subtopic
                                                .toLowerCase()
                                                .includes(
                                                  bankSoalSearchFilter.toLowerCase(),
                                                )) ||
                                            (q.tags &&
                                              q.tags.some((t: string) =>
                                                t
                                                  .toLowerCase()
                                                  .includes(
                                                    bankSoalSearchFilter.toLowerCase(),
                                                  ),
                                              ));
                                          const matchesTopic =
                                            bankSoalTopicFilter === "all" ||
                                            q.subtopic === bankSoalTopicFilter;
                                          const matchesTag =
                                            bankSoalTagFilter === "all" ||
                                            (q.tags &&
                                              q.tags.includes(
                                                bankSoalTagFilter,
                                              ));
                                          const matchesLevel =
                                            bankSoalLevelFilter === "all" ||
                                            q.level === bankSoalLevelFilter;
                                          return (
                                            matchesSearch &&
                                            matchesTopic &&
                                            matchesTag &&
                                            matchesLevel
                                          );
                                        })
                                        .map((q, qIdx) => {
                                          const originalIdx =
                                            bankSoalQuestions.indexOf(q);
                                          return (
                                            <tr
                                              key={originalIdx}
                                              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-all duration-300 group cursor-pointer"
                                            >
                                              <td
                                                className="sticky left-0 z-20 px-8 py-7 font-black text-indigo-500 border-r border-slate-100 dark:border-slate-800 shadow-[4px_0_15px_rgba(0,0,0,0.03)] align-middle"
                                                style={{
                                                  backgroundColor: isDarkMode
                                                    ? "#0f172a"
                                                    : "#ffffff",
                                                }}
                                              >
                                                <span className="opacity-40 text-[10px]">
                                                  #
                                                </span>
                                                {qIdx + 1}
                                              </td>
                                              <td
                                                className={`px-8 py-7 text-sm font-bold leading-relaxed w-[40%] align-middle ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}
                                              >
                                                <div className="line-clamp-2 md:line-clamp-3 text-ellipsis overflow-hidden group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                                  {q.question}
                                                </div>
                                              </td>
                                              <td className="px-8 py-7 w-[15%] align-middle">
                                                {q.subtopic && (
                                                  <div
                                                    className={`text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border text-center whitespace-normal break-words ${isDarkMode ? "bg-indigo-900/10 border-indigo-500/20 text-indigo-400" : "bg-indigo-50 border-indigo-100 text-indigo-600"}`}
                                                  >
                                                    {q.subtopic}
                                                  </div>
                                                )}
                                              </td>
                                              <td className="px-8 py-7 w-[18%] align-middle">
                                                <div className="flex flex-wrap gap-1.5 justify-start focus-within:ring-2">
                                                  {q.tags?.map(
                                                    (
                                                      tag: string,
                                                      tidx: number,
                                                    ) => (
                                                      <span
                                                        key={tidx}
                                                        className={`px-2.5 py-1.5 ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-500"} text-[8px] font-black rounded-lg uppercase tracking-widest border whitespace-nowrap`}
                                                      >
                                                        {tag}
                                                      </span>
                                                    ),
                                                  )}
                                                </div>
                                              </td>
                                              <td className="px-8 py-7 w-[10%] align-middle">
                                                <div className="flex justify-center">
                                                  <span
                                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase flex items-center justify-center min-w-[70px] text-center ${
                                                      q.level === "C4"
                                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none w-full"
                                                        : q.level === "C5"
                                                          ? "bg-amber-500 text-white shadow-lg shadow-amber-200 dark:shadow-none w-full"
                                                          : "bg-rose-500 text-white shadow-lg shadow-rose-200 dark:shadow-none w-full"
                                                    }`}
                                                  >
                                                    {q.level}
                                                  </span>
                                                </div>
                                              </td>
                                              <td className="px-8 py-7 w-[7%] text-center align-middle">
                                                <div
                                                  className={`w-11 h-11 ${isDarkMode ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border-emerald-100"} border rounded-2xl flex items-center justify-center text-[15px] font-black shadow-sm mx-auto transition-transform duration-350 hover:scale-110 hover:rotate-6`}
                                                >
                                                  {q.answer}
                                                </div>
                                              </td>
                                              <td className="px-8 py-7 w-[10%] text-right align-middle">
                                                <div className="flex items-center justify-end gap-2.5">
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleStartEdit(
                                                        originalIdx,
                                                      );
                                                    }}
                                                    className="w-10 h-10 flex items-center justify-center bg-indigo-50 dark:bg-slate-800 border border-indigo-100/50 dark:border-slate-700 rounded-xl text-indigo-500 dark:text-indigo-400 hover:text-white hover:bg-indigo-500 dark:hover:bg-indigo-500 shadow-md hover:shadow-indigo-500/10 transition-all shrink-0"
                                                    title="Edit Soal"
                                                  >
                                                    <Edit2 className="w-4.5 h-4.5" />
                                                  </button>
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleDeleteQuestion(
                                                        originalIdx,
                                                      );
                                                    }}
                                                    className="w-10 h-10 flex items-center justify-center bg-rose-50 dark:bg-slate-800 border border-rose-100/50 dark:border-slate-700 rounded-xl text-rose-500 hover:text-white hover:bg-rose-500 dark:hover:bg-rose-500 shadow-md hover:shadow-rose-500/10 transition-all shrink-0"
                                                    title="Hapus Soal"
                                                  >
                                                    <Trash2 className="w-4.5 h-4.5" />
                                                  </button>
                                                </div>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                    </tbody>
                                  </table>
                                </div>
                                <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-white dark:from-slate-900 to-transparent pointer-events-none opacity-0 group-hover/scroll:opacity-100 transition-opacity" />
                                <div className="absolute left-16 top-0 bottom-4 w-8 bg-gradient-to-r from-white dark:from-slate-900 to-transparent pointer-events-none opacity-0 group-hover/scroll:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          )}
                        </div>{" "}
                        {/* Ends bank-soal-content wrapper */}
                      </div>
                    )}

                    <div className="flex justify-center p-10 mt-12 bg-slate-50/50 dark:bg-slate-900/50 rounded-[40px] border border-dashed border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => setBankSoalMode("generate")}
                        className="px-10 py-5 bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white rounded-3xl font-black text-sm uppercase tracking-[0.4em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
                      >
                        <Sparkles className="w-5 h-5" />
                        Rancang Bank Soal Baru
                      </button>
                    </div>
                  </div>
                )}

                {bankSoalMode === "saved" && (
                  <div className="space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                      <div>
                        <h3
                          className={`text-2xl font-black ${isDarkMode ? "text-white" : "text-slate-800"} tracking-tighter`}
                        >
                          Koleksi Maestro
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                          Akses Cepat Ke Bank Soal Yang Telah Disimpan
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        {savedQuestionBanks.length > 0 && (
                          <button
                            onClick={handleBulkPrintBankSoal}
                            disabled={selectedBanksForPrint.length === 0}
                            className={`flex items-center gap-2 px-6 py-3 rounded-[20px] font-black text-[10px] uppercase tracking-widest transition-all ${selectedBanksForPrint.length > 0 ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:scale-105" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                          >
                            <Printer className="w-4 h-4" /> Cetak ({selectedBanksForPrint.length})
                          </button>
                        )}
                        <div className="relative w-full sm:w-80">
                          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Cari koleksi judul atau topik..."
                            value={bankSoalSearchFilter}
                            onChange={(e) =>
                              setBankSoalSearchFilter(e.target.value)
                            }
                            className={`w-full ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100 shadow-inner"} border-2 rounded-[24px] pl-16 pr-6 py-4 text-sm font-black focus:outline-none focus:border-slate-500 transition-all`}
                          />
                        </div>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[20px] border border-slate-200 dark:border-slate-700 shadow-inner">
                          <button
                            onClick={() => setBankSoalSavedLayout("card")}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${bankSoalSavedLayout === "card" ? "bg-white dark:bg-slate-700 shadow-xl text-indigo-600 dark:text-indigo-400 font-black" : "text-slate-400 hover:text-slate-600"} text-[10px] uppercase tracking-widest`}
                          >
                            <LayoutGrid className="w-4 h-4" /> Kartu
                          </button>
                          <button
                            onClick={() => setBankSoalSavedLayout("table")}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${bankSoalSavedLayout === "table" ? "bg-white dark:bg-slate-700 shadow-xl text-indigo-600 dark:text-indigo-400 font-black" : "text-slate-400 hover:text-slate-600"} text-[10px] uppercase tracking-widest`}
                          >
                            <List className="w-4 h-4" /> Tabel
                          </button>
                        </div>
                      </div>
                    </div>

                    {savedQuestionBanks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-32 opacity-20 italic">
                        <BookmarkX className="w-32 h-32 mb-6" />
                        <p className="font-black uppercase tracking-[0.3em]">
                          Koleksi Masih Kosong
                        </p>
                      </div>
                    ) : bankSoalSavedLayout === "card" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {savedQuestionBanks.filter(
                          (b) =>
                            b.title
                              .toLowerCase()
                              .includes(bankSoalSearchFilter.toLowerCase()) ||
                            b.topic
                              .toLowerCase()
                              .includes(bankSoalSearchFilter.toLowerCase()),
                        ).length === 0 ? (
                          <div className="col-span-full py-20 text-center opacity-40 font-black uppercase tracking-widest italic">
                            Pencarian Tidak Ditemukan
                          </div>
                        ) : (
                          savedQuestionBanks
                            .filter(
                              (b) =>
                                b.title
                                  .toLowerCase()
                                  .includes(
                                    bankSoalSearchFilter.toLowerCase(),
                                  ) ||
                                b.topic
                                  .toLowerCase()
                                  .includes(bankSoalSearchFilter.toLowerCase()),
                            )
                            .map((bank) => (
                              <motion.div
                                key={bank.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ y: -8, rotate: 1 }}
                                className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-2xl shadow-slate-200/50"} p-10 rounded-[56px] border group hover:border-amber-500 transition-all cursor-pointer relative overflow-hidden`}
                                onClick={() => handleLoadBankSoal(bank)}
                              >
                                <div className="absolute top-6 left-6 z-20" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={selectedBanksForPrint.includes(bank.id)}
                                    onChange={(e) => {
                                      if(e.target.checked) setSelectedBanksForPrint(prev => [...prev, bank.id]);
                                      else setSelectedBanksForPrint(prev => prev.filter(id => id !== bank.id));
                                    }}
                                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-100 border-slate-300 cursor-pointer hover:scale-110 transition-transform"
                                  />
                                </div>
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
                                  <Bookmark className="w-48 h-48" />
                                </div>

                                <div className="flex items-start justify-between mb-10 relative z-10 pl-6">
                                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-[28px] flex items-center justify-center text-white shadow-xl shadow-amber-200 dark:shadow-none">
                                    <FileText className="w-8 h-8" />
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSavedBank(bank.id);
                                      }}
                                      className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-[20px] transition-all shadow-sm"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </div>
                                </div>

                                <div className="relative z-10">
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-xl uppercase tracking-widest">
                                      KELAS {bank.grade}
                                    </div>
                                    <div
                                      className={`px-4 py-1.5 ${isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500"} text-[10px] font-black rounded-xl uppercase tracking-widest border border-transparent dark:border-slate-700`}
                                    >
                                      {bank.questions.length} Butir Soal
                                    </div>
                                  </div>
                                  <h4
                                    className={`text-xl font-black ${isDarkMode ? "text-white" : "text-slate-800"} mb-3 line-clamp-2 tracking-tight`}
                                  >
                                    {bank.title}
                                  </h4>
                                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest italic mb-10 line-clamp-1">
                                    {bank.topic}
                                  </p>

                                  <div className="flex items-center justify-between pt-8 border-t border-slate-50 dark:border-slate-800">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                      {new Date(
                                        bank.createdAt,
                                      ).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </div>
                                    <div className="flex items-center gap-2 text-amber-500 font-black text-[10px] uppercase tracking-widest group-hover:translate-x-3 transition-all duration-300">
                                      Buka Koleksi{" "}
                                      <ChevronRight className="w-5 h-5" />
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))
                        )}
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`rounded-[40px] border overflow-hidden ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-2xl shadow-slate-200/50"}`}
                      >
                        <div className="relative group/scroll overflow-hidden">
                          <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                            <table className="w-full text-left border-separate border-spacing-0 min-w-[1000px]">
                              <thead>
                                <tr
                                  className={
                                    isDarkMode
                                      ? "bg-slate-800 text-slate-400"
                                      : "bg-slate-900 text-white"
                                  }
                                >
                                  <th
                                    className="sticky left-0 z-30 px-6 py-7 border-r border-white/10"
                                    style={{
                                      backgroundColor: isDarkMode ? "#1e293b" : "#0f172a",
                                      width: "50px"
                                    }}
                                  >
                                    <div className="flex justify-center h-full items-center">
                                       <Bookmark className="w-4 h-4 opacity-50" />
                                    </div>
                                  </th>
                                  <th
                                    className="sticky left-[65px] z-30 px-8 py-7 text-[10px] font-black uppercase tracking-[0.2em] border-r border-white/10"
                                    style={{
                                      backgroundColor: isDarkMode
                                        ? "#1e293b"
                                        : "#0f172a",
                                    }}
                                  >
                                    Judul Maestro
                                  </th>
                                  <th className="px-8 py-7 text-[10px] font-black uppercase tracking-[0.2em] border-l border-white/10">
                                    Topik Utama
                                  </th>
                                  <th className="px-8 py-7 text-[10px] font-black uppercase tracking-[0.2em] border-l border-white/10 text-center">
                                    Kelas
                                  </th>
                                  <th className="px-8 py-7 text-[10px] font-black uppercase tracking-[0.2em] border-l border-white/10 text-center">
                                    Jumlah Soal
                                  </th>
                                  <th className="px-8 py-7 text-[10px] font-black uppercase tracking-[0.2em] border-l border-white/10 text-center">
                                    Terakhir Diperbarui
                                  </th>
                                  <th className="px-8 py-7 text-[10px] font-black uppercase tracking-[0.2em] border-l border-white/10 text-right">
                                    Manajemen
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {savedQuestionBanks
                                  .filter(
                                    (b) =>
                                      b.title
                                        .toLowerCase()
                                        .includes(
                                          bankSoalSearchFilter.toLowerCase(),
                                        ) ||
                                      b.topic
                                        .toLowerCase()
                                        .includes(
                                          bankSoalSearchFilter.toLowerCase(),
                                        ),
                                  )
                                  .map((bank) => (
                                    <tr
                                      key={bank.id}
                                      className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-all duration-300 cursor-pointer"
                                      onClick={() => handleLoadBankSoal(bank)}
                                    >
                                      <td
                                        className="sticky left-0 z-20 px-6 py-7 border-r border-slate-100 dark:border-slate-800 shadow-[4px_0_15px_rgba(0,0,0,0.03)] align-middle"
                                        style={{
                                          backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
                                          width: "50px"
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div className="flex justify-center h-full items-center">
                                          <input
                                            type="checkbox"
                                            checked={selectedBanksForPrint.includes(bank.id)}
                                            onChange={(e) => {
                                              if(e.target.checked) setSelectedBanksForPrint(prev => [...prev, bank.id]);
                                              else setSelectedBanksForPrint(prev => prev.filter(id => id !== bank.id));
                                            }}
                                            className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-100 border-slate-300 cursor-pointer hover:scale-110 transition-transform"
                                          />
                                        </div>
                                      </td>
                                      <td
                                        className="sticky left-[65px] z-20 px-8 py-7 border-r border-slate-100 dark:border-slate-800 shadow-[4px_0_15px_rgba(0,0,0,0.03)] align-middle"
                                        style={{
                                          backgroundColor: isDarkMode
                                            ? "#0f172a"
                                            : "#ffffff",
                                        }}
                                      >
                                        <div className="flex items-center gap-5">
                                          <div className="w-11 h-11 bg-amber-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-200/50 dark:shadow-none transition-transform duration-500 group-hover:scale-105">
                                            <FileText className="w-5.5 h-5.5" />
                                          </div>
                                          <div className="flex flex-col min-w-[220px] max-w-xs">
                                            <span
                                              className={`text-[15px] font-black leading-tight ${isDarkMode ? "text-slate-100" : "text-slate-900"} group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors break-words`}
                                            >
                                              {bank.title}
                                            </span>
                                            <span
                                              className={`text-[9px] font-black uppercase tracking-widest mt-1.5 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}
                                            >
                                              Koleksi Maestro
                                            </span>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-8 py-7 align-middle max-w-sm">
                                        <div className="flex flex-col">
                                          <span
                                            className={`text-xs font-bold leading-relaxed italic ${isDarkMode ? "text-slate-400" : "text-slate-600"} line-clamp-2 break-words`}
                                          >
                                            "{bank.topic}"
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-8 py-7 text-center align-middle">
                                        <div className="inline-flex items-center justify-center px-4 py-2 bg-slate-950 text-white text-[10px] font-black rounded-xl uppercase tracking-[0.2em] shadow-sm">
                                          Kelas {bank.grade}
                                        </div>
                                      </td>
                                      <td className="px-8 py-7 text-center align-middle">
                                        <div
                                          className={`inline-flex items-center justify-center px-4 py-2 text-[10px] font-black rounded-xl uppercase border ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 border-slate-200/50 text-slate-700"}`}
                                        >
                                          {bank.questions.length} Butir
                                        </div>
                                      </td>
                                      <td className="px-8 py-7 text-center align-middle">
                                        <div className="inline-flex flex-col items-center gap-1.5 whitespace-nowrap">
                                          <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            <Calendar className="w-3.5 h-3.5 opacity-70" />
                                            <span>Dibuat</span>
                                          </div>
                                          <span
                                            className={`text-[11px] font-black ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
                                          >
                                            {new Date(
                                              bank.createdAt,
                                            ).toLocaleDateString("id-ID", {
                                              day: "numeric",
                                              month: "short",
                                              year: "numeric",
                                            })}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-8 py-7 text-right align-middle">
                                        <div className="flex items-center justify-end gap-2.5">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteSavedBank(bank.id);
                                            }}
                                            className="w-10 h-10 flex items-center justify-center bg-rose-50 dark:bg-slate-800 border border-rose-100/50 dark:border-slate-700 rounded-xl text-rose-500 hover:text-white hover:bg-rose-500 dark:hover:bg-rose-500 shadow-md hover:shadow-rose-500/10 transition-all shrink-0"
                                            title="Hapus Koleksi"
                                          >
                                            <Trash2 className="w-4.5 h-4.5" />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleLoadBankSoal(bank);
                                            }}
                                            className="h-10 px-5 bg-amber-500 dark:bg-amber-600 text-white rounded-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 dark:hover:bg-amber-500 transition-all shadow-md hover:shadow-amber-500/10 shrink-0"
                                            title="Buka Koleksi"
                                          >
                                            <span>Buka</span>
                                            <ChevronRight className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                          {/* Scroll indicators */}
                          <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-white dark:from-slate-900 to-transparent pointer-events-none opacity-0 group-hover/scroll:opacity-100 transition-opacity" />
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "silabus" && (
              <motion.div
                key="silabus"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
              >
                <header>
                  <h2
                    className={`text-4xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-800"}`}
                  >
                    Silabus{" "}
                    <span className="text-teal-500">Generator Maestro</span>
                  </h2>
                  <p
                    className={`font-medium mt-2 text-lg ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Ciptakan Alur Tujuan Pembelajaran (ATP) yang komprehensif
                    dan sistematis.
                  </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                  {/* Sidebar Column */}
                  <div className="lg:col-span-4 sticky top-8 space-y-6">
                    <div
                      className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-100"} p-8 rounded-[40px] border space-y-8`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center text-white">
                          <LayoutList className="w-5 h-5" />
                        </div>
                        <span
                          className={`font-black text-sm uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-800"}`}
                        >
                          Konfigurasi Silabus
                        </span>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic px-1">
                            Topik Utama
                          </label>
                          <input
                            type="text"
                            value={silabusTopic}
                            onChange={(e) => setSilabusTopic(e.target.value)}
                            placeholder="Misal: Kehidupan Sosial Manusia"
                            className={`w-full ${isDarkMode ? "bg-slate-800/50 border-slate-700 text-white" : "bg-slate-50 border-slate-100/50"} border-2 rounded-[24px] p-5 text-sm font-bold focus:outline-none focus:border-teal-500 transition-all placeholder:opacity-30`}
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic px-1">
                            Tingkat Kelas
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {["VII", "VIII", "IX"].map((grade) => (
                              <button
                                key={grade}
                                onClick={() => setSilabusGrade(grade)}
                                className={`flex-1 min-w-[70px] py-4 rounded-2xl font-black text-[11px] transition-all border-2 ${silabusGrade === grade ? "bg-teal-600 border-teal-600 text-white shadow-xl shadow-teal-500/20" : isDarkMode ? "bg-slate-800 border-slate-700 text-slate-500" : "bg-white border-slate-100 text-slate-400 hover:border-teal-200"}`}
                              >
                                KELAS {grade}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic px-1">
                            Tujuan Pembelajaran (Opsional)
                          </label>
                          <textarea
                            value={silabusObjectives}
                            onChange={(e) =>
                              setSilabusObjectives(e.target.value)
                            }
                            placeholder="Masukkan poin-poin tujuan jika ada..."
                            className={`w-full ${isDarkMode ? "bg-slate-800/50 border-slate-700 text-white" : "bg-slate-50 border-slate-100/50"} border-2 rounded-[24px] p-5 text-sm font-bold focus:outline-none focus:border-teal-500 transition-all min-h-[100px] placeholder:opacity-30`}
                          />
                        </div>

                        <button
                          onClick={handleGenerateSilabus}
                          disabled={!silabusTopic || isGeneratingSilabus}
                          className="w-full py-5 bg-teal-600 text-white rounded-[24px] font-black text-sm tracking-[0.2em] uppercase shadow-2xl shadow-teal-500/20 hover:bg-teal-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-40"
                        >
                          {isGeneratingSilabus ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Sparkles className="w-5 h-5" />
                          )}
                          Mulai Generate
                        </button>
                      </div>
                    </div>

                    {/* AI Stylist Customization Card (Silabus) */}
                    <div
                      className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-100"} p-8 rounded-[40px] border space-y-6`}
                    >
                      <button
                        onClick={() =>
                          setIsSilabusStylistOpen(!isSilabusStylistOpen)
                        }
                        className="w-full flex items-center justify-between group hover:opacity-80 transition-opacity"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 ${getModuleThemeClasses(silabusTheme).bgLight} ${getModuleThemeClasses(silabusTheme).primaryText} rounded-xl flex items-center justify-center transition-all`}
                          >
                            <Palette className="w-5 h-5" />
                          </div>
                          <span
                            className={`font-black text-xs uppercase tracking-widest text-left ${isDarkMode ? "text-white" : "text-slate-800"}`}
                          >
                            🎨 Tema & Tata Letak Silabus
                          </span>
                        </div>
                        <span className="text-slate-400 font-bold text-xs">
                          {isSilabusStylistOpen ? "Tutup" : "Sesuaikan"} &rarr;
                        </span>
                      </button>

                      {isSilabusStylistOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800"
                        >
                          {/* Tema Warna (Color Theme) */}
                          <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                              Tema Warna Dokumen
                            </label>
                            <div className="grid grid-cols-6 gap-2">
                              {[
                                {
                                  id: "emerald",
                                  hex: "#10b981",
                                  label: "Emerald",
                                },
                                { id: "blue", hex: "#3b82f6", label: "Blue" },
                                {
                                  id: "indigo",
                                  hex: "#6366f1",
                                  label: "Indigo",
                                },
                                { id: "amber", hex: "#f59e0b", label: "Amber" },
                                { id: "rose", hex: "#f43f5e", label: "Rose" },
                                { id: "teal", hex: "#14b8a6", label: "Teal" },
                              ].map((themeOpt) => (
                                <button
                                  key={themeOpt.id}
                                  onClick={() =>
                                    setSilabusTheme(themeOpt.id as any)
                                  }
                                  className={`w-full aspect-square rounded-xl transition-all border-2 flex items-center justify-center ${silabusTheme === themeOpt.id ? "border-slate-800 dark:border-white scale-110 shadow" : "border-transparent opacity-60 hover:opacity-100"}`}
                                  style={{ backgroundColor: themeOpt.hex }}
                                  title={themeOpt.label}
                                >
                                  {silabusTheme === themeOpt.id && (
                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Tipografi (Font Selection) */}
                          <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                              Tipografi (Font)
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: "font-inter", label: "Inter" },
                                { id: "font-outfit", label: "Outfit" },
                                { id: "font-space", label: "Space Grotesk" },
                                {
                                  id: "font-playfair",
                                  label: "Playfair Display",
                                },
                              ].map((fontOpt) => (
                                <button
                                  key={fontOpt.id}
                                  onClick={() =>
                                    setSilabusFont(fontOpt.id as any)
                                  }
                                  className={`py-2 px-3 border rounded-xl text-[9px] font-black tracking-widest uppercase transition-all ${silabusFont === fontOpt.id ? `bg-${getModuleThemeClasses(silabusTheme).primary} border-${getModuleThemeClasses(silabusTheme).primary} text-white` : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"}`}
                                >
                                  {fontOpt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Tata Letak/Layout Style */}
                          <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                              Tata Letak (Layout)
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { id: "classic", label: "Klasik" },
                                { id: "modern", label: "Modern" },
                                { id: "minimalist", label: "Minimalis" },
                              ].map((layoutOpt) => (
                                <button
                                  key={layoutOpt.id}
                                  onClick={() =>
                                    setSilabusLayout(layoutOpt.id as any)
                                  }
                                  className={`py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${silabusLayout === layoutOpt.id ? `bg-${getModuleThemeClasses(silabusTheme).primary} border-${getModuleThemeClasses(silabusTheme).primary} text-white` : "border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400"}`}
                                >
                                  {layoutOpt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-8">
                    {silabusResult ? (
                      <motion.div
                        className="space-y-6"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      >
                        <div
                          className={`flex justify-between items-center ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"} p-4 rounded-2xl border`}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">
                              Preview Silabus Maestro
                            </span>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                              {["pdf", "docx"].map((fmt) => (
                                <button
                                  key={fmt}
                                  onClick={() =>
                                    setSilabusExportFormat(
                                      fmt as "pdf" | "docx",
                                    )
                                  }
                                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${silabusExportFormat === fmt ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                                >
                                  {fmt}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={handleSaveSilabusToDrive}
                              disabled={isUploadingSilabusToDrive}
                              className={`flex items-center gap-2 px-5 py-2.5 ${isDarkMode ? "bg-indigo-900 text-indigo-100 hover:bg-indigo-800" : "bg-indigo-500 text-white hover:bg-indigo-600"} rounded-xl text-xs font-bold shadow-lg transition-all disabled:opacity-50`}
                            >
                              {isUploadingSilabusToDrive ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <HardDrive className="w-4 h-4" />
                              )}
                              Simpan ke Drive
                            </button>
                            <button
                              onClick={() => {
                                const fileName = `Silabus_${silabusGrade}_${silabusTopic.substring(0, 20)}`;
                                if (silabusExportFormat === "pdf")
                                  exportPDF("silabus-content", fileName);
                                else exportDOCX("silabus-content", fileName);
                              }}
                              className={`flex items-center gap-2 px-5 py-2.5 bg-${getModuleThemeClasses(silabusTheme).primary} text-white rounded-xl text-xs font-bold hover:brightness-110 shadow-lg shadow-${getModuleThemeClasses(silabusTheme).primary}/20 transition-all`}
                            >
                              <Download className="w-4 h-4" /> Download{" "}
                              {silabusExportFormat.toUpperCase()}
                            </button>
                          </div>
                        </div>

                        <div
                          id="silabus-content"
                          className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"} p-12 rounded-[40px] border shadow-2xl shadow-slate-100 dark:shadow-none min-h-[800px] relative overflow-hidden ${silabusFont}`}
                        >
                          <div id="silabus-result-content">
                            {/* Header Decoration based on layout */}
                            {silabusLayout === "modern" && (
                              <div
                                className={`absolute top-0 left-0 right-0 h-4 bg-gradient-to-r ${getModuleThemeClasses(silabusTheme).gradient}`}
                              />
                            )}
                            {silabusLayout === "classic" && (
                              <div
                                className={`absolute top-0 left-0 right-0 h-2 bg-${getModuleThemeClasses(silabusTheme).primary} border-b`}
                              />
                            )}
                            {silabusLayout === "minimalist" && null}

                            <div className="flex flex-col md:flex-row justify-between items-start mb-8 pb-6 border-b border-dashed dark:border-slate-800">
                              <div className="flex items-center gap-4">
                                <div
                                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${getModuleThemeClasses(silabusTheme).gradient}`}
                                >
                                  <LayoutList className="w-6 h-6" />
                                </div>
                                <div>
                                  <h3
                                    className={`text-xl font-black ${isDarkMode ? "text-white" : "text-slate-900"} uppercase tracking-tighter`}
                                  >
                                    Silabus Merdeka
                                  </h3>
                                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    IPS Maestro Stylist •{" "}
                                    {silabusLayout.toUpperCase()}{" "}
                                    {silabusTheme.toUpperCase()}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div
                              className={`prose ${isDarkMode ? "prose-invert" : "prose-slate"} max-w-none 
                              prose-headings:font-black prose-headings:tracking-tight prose-headings:uppercase
                              prose-h1:text-3xl prose-h1:mb-6 prose-h1:${getModuleThemeClasses(silabusTheme).textStrong}
                              prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-l-4 prose-h2:${getModuleThemeClasses(silabusTheme).border} prose-h2:pl-4
                              prose-strong:${getModuleThemeClasses(silabusTheme).textStrong}
                              prose-ul:list-none prose-ul:pl-0
                              prose-li:relative prose-li:pl-8 prose-li:mb-2
                              prose-table:border-collapse prose-table:w-full prose-table:my-8
                              prose-th:bg-slate-50 dark:prose-th:bg-slate-800 prose-th:p-4 prose-th:text-xs prose-th:font-black prose-th:uppercase prose-th:tracking-widest prose-th:border prose-th:border-slate-200 dark:prose-th:border-slate-700
                              prose-td:p-4 prose-td:text-sm prose-td:border prose-td:border-slate-100 dark:prose-td:border-slate-800
                            `}
                            >
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  a: ({ node, ...props }) => (
                                    <a
                                      {...props}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`underline font-bold text-${getModuleThemeClasses(silabusTheme).primary}`}
                                    />
                                  ),
                                  img: ({ node, ...props }) => (
                                    <img
                                      {...props}
                                      className="rounded-2xl shadow-lg object-cover w-full max-h-96 my-8"
                                      referrerPolicy="no-referrer"
                                    />
                                  ),
                                  li: ({ node, children, ...props }) => (
                                    <li
                                      {...props}
                                      className="relative pl-8 mb-3 group"
                                    >
                                      {silabusLayout === "modern" ? (
                                        <span
                                          className={`absolute left-0 top-1.5 w-5 h-5 ${getModuleThemeClasses(silabusTheme).bgLight} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}
                                        >
                                          <div
                                            className={`w-1.5 h-1.5 ${getModuleThemeClasses(silabusTheme).fill} rounded-full`}
                                          />
                                        </span>
                                      ) : silabusLayout === "classic" ? (
                                        <span className="absolute left-0 top-1.5 flex items-center justify-center font-bold text-slate-500">
                                          •
                                        </span>
                                      ) : (
                                        <span
                                          className={`absolute left-0 top-1.5 w-1.5 h-1.5 ${getModuleThemeClasses(silabusTheme).fill} rounded-sm`}
                                        />
                                      )}
                                      <div
                                        className={`${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
                                      >
                                        {children}
                                      </div>
                                    </li>
                                  ),
                                  blockquote: ({
                                    node,
                                    children,
                                    ...props
                                  }) => (
                                    <blockquote
                                      {...props}
                                      className={`p-6 rounded-[24px] border-l-4 ${getModuleThemeClasses(silabusTheme).border} ${silabusLayout === "modern" ? `${getModuleThemeClasses(silabusTheme).bgLight} my-6` : silabusLayout === "classic" ? "bg-slate-50 dark:bg-slate-800" : "italic my-4 border-l-2 pl-4"} relative overflow-hidden`}
                                    >
                                      <div className="relative z-10 text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                                        {children}
                                      </div>
                                    </blockquote>
                                  ),
                                }}
                              >
                                {silabusResult}
                              </ReactMarkdown>
                            </div>
                            <div
                              className={`mt-12 pt-8 border-t ${isDarkMode ? "border-slate-800" : "border-slate-100"} flex justify-between items-end opacity-40 italic text-[10px]`}
                            >
                              <div>Goresan Pena Digital: IPS Maestro AI</div>
                              <div className="font-bold tracking-widest uppercase">
                                Edisi Merdeka {new Date().getFullYear()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div
                        className={`h-[600px] border-4 border-dashed ${isDarkMode ? "border-slate-800" : "border-slate-100"} rounded-[40px] flex flex-col items-center justify-center text-center p-12`}
                      >
                        <div
                          className={`w-20 h-20 ${isDarkMode ? "bg-slate-900" : "bg-slate-50"} rounded-[32px] flex items-center justify-center mb-8 -rotate-6 transition-all`}
                        >
                          <LayoutList className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3
                          className={`text-2xl font-black mb-3 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                        >
                          Silabus Belum Tersedia
                        </h3>
                        <p className="text-slate-400 font-bold max-w-sm leading-relaxed">
                          Tentukan topik dan kelas untuk merumuskan alur
                          pembelajaran yang terstruktur.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "rpp" && (
              <motion.div
                key="rpp"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
              >
                <header>
                  <h2
                    className={`text-4xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-800"}`}
                  >
                    RPP <span className="text-blue-500">Creator Maestro</span>
                  </h2>
                  <p
                    className={`font-medium mt-2 text-lg ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Rancang Modul Ajar Kurikulum Merdeka secara otomatis dan
                    mendalam.
                  </p>
                </header>

                <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-[32px] w-fit border border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setRppMode("generate")}
                    className={`px-8 py-3.5 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2.5 ${rppMode === "generate" ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xl shadow-slate-200/50 dark:shadow-none translate-y-[-1px]" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    <Sparkles className="w-4 h-4" /> Generator
                  </button>
                  <button
                    onClick={() => setRppMode("saved")}
                    className={`px-8 py-3.5 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2.5 ${rppMode === "saved" ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xl shadow-slate-200/50 dark:shadow-none translate-y-[-1px]" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    <Bookmark className="w-4 h-4" /> Koleksi Saya
                    {savedRpps.length > 0 && (
                      <span className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-sm">
                        {savedRpps.length}
                      </span>
                    )}
                  </button>
                </div>
                
                {rppMode === "generate" && (
                  <div className="space-y-12">
                    {/* Mobile Configuration Toggle */}
                <div className="lg:hidden flex items-center justify-between p-4 bg-blue-500/10 dark:bg-blue-500/5 rounded-3xl border border-blue-500/20 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center text-white">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <span className={`font-black text-xs uppercase tracking-widest ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                        Parameter RPP
                      </span>
                      <p className="text-[10px] text-slate-400 font-bold">Atur topik & elemen pembelajaran</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsRppConfigOpen(true)}
                    className="px-5 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20"
                  >
                    Atur Form
                  </button>
                </div>

                {/* RPP Configuration Drawer for Mobile */}
                <div
                  className={`lg:hidden fixed inset-0 z-50 ${isRppConfigOpen ? "visible" : "invisible"} transition-all duration-300`}
                >
                  {/* Backdrop */}
                  <div
                    className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${
                      isRppConfigOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                    onClick={() => setIsRppConfigOpen(false)}
                  />
                  {/* Drawer Panel */}
                  <div
                    className={`fixed top-0 bottom-0 right-0 z-50 w-full max-w-[320px] h-full ${isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-800"} border-l p-6 flex flex-col transition-transform duration-300 ease-out transform ${isRppConfigOpen ? "translate-x-0" : "translate-x-full"} overflow-y-auto custom-scrollbar`}
                  >
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-dashed border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                          <FileText className="w-5 h-5" />
                        </div>
                        <span className={`font-black text-sm uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                          Konfigurasi RPP
                        </span>
                      </div>
                      <button
                        onClick={() => setIsRppConfigOpen(false)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-xl"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {/* Render Form directly in drawer on mobile */}
                    <div className="space-y-8">
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic px-1">
                            Topik Utama
                          </label>
                          <input
                            type="text"
                            value={rppTopic}
                            onChange={(e) => setRppTopic(e.target.value)}
                            placeholder="Misal: Dampak Kenaikan Harga BBM"
                            className={`w-full ${isDarkMode ? "bg-slate-800/50 border-slate-700 text-white" : "bg-slate-50 border-slate-100/50"} border-2 rounded-[24px] p-5 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all placeholder:opacity-30`}
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic px-1">
                            Tingkat Kelas
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {["VII", "VIII", "IX"].map((grade) => (
                              <button
                                key={grade}
                                onClick={() => setRppGrade(grade)}
                                className={`flex-1 min-w-[70px] py-4 rounded-2xl font-black text-[11px] transition-all border-2 ${rppGrade === grade ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20" : isDarkMode ? "bg-slate-800 border-slate-700 text-slate-500" : "bg-white border-slate-100 text-slate-400 hover:border-blue-200"}`}
                              >
                                KELAS {grade}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic px-1">
                            Elemen Interaktif
                          </label>
                          <div className="grid grid-cols-1 gap-3">
                            <div className="flex flex-col p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800/50">
                              <div
                                className="flex items-center gap-3 cursor-pointer"
                                onClick={() =>
                                  setRppIncludeVideo(!rppIncludeVideo)
                                }
                              >
                                <div
                                  className={`w-10 h-6 p-1 rounded-full transition-all ${rppIncludeVideo ? `bg-${getModuleThemeClasses(rppTheme).primary}` : "bg-slate-200 dark:bg-slate-700"}`}
                                >
                                  <div
                                    className={`w-4 h-4 bg-white rounded-full transition-all ${rppIncludeVideo ? "translate-x-4" : "translate-x-0"}`}
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <span
                                    className={`text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-1.5 ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}
                                  >
                                    Stimulus Video
                                  </span>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    YouTube / Drive
                                  </span>
                                </div>
                              </div>
                              {rppIncludeVideo && (
                                <RPPItemThemeSelector
                                  selectedTheme={rppVideoTheme}
                                  onChange={setRppVideoTheme}
                                  isDarkMode={isDarkMode}
                                />
                              )}
                            </div>

                            <div className="flex flex-col p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800/50">
                              <div
                                className="flex items-center gap-3 cursor-pointer"
                                onClick={() =>
                                  setRppIncludeQuiz(!rppIncludeQuiz)
                                }
                              >
                                <div
                                  className={`w-10 h-6 p-1 rounded-full transition-all ${rppIncludeQuiz ? `bg-${getModuleThemeClasses(rppTheme).primary}` : "bg-slate-200 dark:bg-slate-700"}`}
                                >
                                  <div
                                    className={`w-4 h-4 bg-white rounded-full transition-all ${rppIncludeQuiz ? "translate-x-4" : "translate-x-0"}`}
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <span
                                    className={`text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-1.5 ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}
                                  >
                                    Kuis Interaktif
                                  </span>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    3-5 Soal Pemahaman
                                  </span>
                                </div>
                              </div>
                              {rppIncludeQuiz && (
                                <RPPItemThemeSelector
                                  selectedTheme={rppQuizTheme}
                                  onChange={setRppQuizTheme}
                                  isDarkMode={isDarkMode}
                                />
                              )}
                            </div>

                            <div className="flex flex-col p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800/50">
                              <div
                                className="flex items-center gap-3 cursor-pointer"
                                onClick={() =>
                                  setRppIncludeLinks(!rppIncludeLinks)
                                }
                              >
                                <div
                                  className={`w-10 h-6 p-1 rounded-full transition-all ${rppIncludeLinks ? `bg-${getModuleThemeClasses(rppTheme).primary}` : "bg-slate-200 dark:bg-slate-700"}`}
                                >
                                  <div
                                    className={`w-4 h-4 bg-white rounded-full transition-all ${rppIncludeLinks ? "translate-x-4" : "translate-x-0"}`}
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <span
                                    className={`text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-1.5 ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}
                                  >
                                    Tautan Referensi
                                  </span>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    Sumber Belajar Digital
                                  </span>
                                </div>
                              </div>
                              {rppIncludeLinks && (
                                <RPPItemThemeSelector
                                  selectedTheme={rppLinksTheme}
                                  onChange={setRppLinksTheme}
                                  isDarkMode={isDarkMode}
                                />
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            handleGenerateRPP();
                            setIsRppConfigOpen(false);
                          }}
                          disabled={!rppTopic || isGeneratingRpp}
                          className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black text-sm tracking-[0.2em] uppercase shadow-2xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-40"
                        >
                          {isGeneratingRpp ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Sparkles className="w-5 h-5" />
                          )}
                          Mulai Generate
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                  {/* Sidebar Column */}
                  <div className="hidden lg:block lg:col-span-4 sticky top-8 space-y-6">
                    <div
                      className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-100"} p-8 rounded-[40px] border space-y-8`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                          <FileText className="w-5 h-5" />
                        </div>
                        <span
                          className={`font-black text-sm uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-800"}`}
                        >
                          Konfigurasi RPP
                        </span>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic px-1">
                            Topik Utama
                          </label>
                          <input
                            type="text"
                            value={rppTopic}
                            onChange={(e) => setRppTopic(e.target.value)}
                            placeholder="Misal: Dampak Kenaikan Harga BBM"
                            className={`w-full ${isDarkMode ? "bg-slate-800/50 border-slate-700 text-white" : "bg-slate-50 border-slate-100/50"} border-2 rounded-[24px] p-5 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all placeholder:opacity-30`}
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic px-1">
                            Tingkat Kelas
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {["VII", "VIII", "IX"].map((grade) => (
                              <button
                                key={grade}
                                onClick={() => setRppGrade(grade)}
                                className={`flex-1 min-w-[70px] py-4 rounded-2xl font-black text-[11px] transition-all border-2 ${rppGrade === grade ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20" : isDarkMode ? "bg-slate-800 border-slate-700 text-slate-500" : "bg-white border-slate-100 text-slate-400 hover:border-blue-200"}`}
                              >
                                KELAS {grade}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic px-1">
                            Elemen Interaktif
                          </label>
                          <div className="grid grid-cols-1 gap-3">
                            <div className="flex flex-col p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800/50">
                              <div
                                className="flex items-center gap-3 cursor-pointer"
                                onClick={() =>
                                  setRppIncludeVideo(!rppIncludeVideo)
                                }
                              >
                                <div
                                  className={`w-10 h-6 p-1 rounded-full transition-all ${rppIncludeVideo ? `bg-${getModuleThemeClasses(rppTheme).primary}` : "bg-slate-200 dark:bg-slate-700"}`}
                                >
                                  <div
                                    className={`w-4 h-4 bg-white rounded-full transition-all ${rppIncludeVideo ? "translate-x-4" : "translate-x-0"}`}
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <span
                                    className={`text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-1.5 ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}
                                  >
                                    Stimulus Video
                                  </span>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    YouTube / Drive
                                  </span>
                                </div>
                              </div>
                              {rppIncludeVideo && (
                                <RPPItemThemeSelector
                                  selectedTheme={rppVideoTheme}
                                  onChange={setRppVideoTheme}
                                  isDarkMode={isDarkMode}
                                />
                              )}
                            </div>

                            <div className="flex flex-col p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800/50">
                              <div
                                className="flex items-center gap-3 cursor-pointer"
                                onClick={() =>
                                  setRppIncludeQuiz(!rppIncludeQuiz)
                                }
                              >
                                <div
                                  className={`w-10 h-6 p-1 rounded-full transition-all ${rppIncludeQuiz ? `bg-${getModuleThemeClasses(rppTheme).primary}` : "bg-slate-200 dark:bg-slate-700"}`}
                                >
                                  <div
                                    className={`w-4 h-4 bg-white rounded-full transition-all ${rppIncludeQuiz ? "translate-x-4" : "translate-x-0"}`}
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <span
                                    className={`text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-1.5 ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}
                                  >
                                    Kuis Interaktif
                                  </span>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    3-5 Soal Pemahaman
                                  </span>
                                </div>
                              </div>
                              {rppIncludeQuiz && (
                                <RPPItemThemeSelector
                                  selectedTheme={rppQuizTheme}
                                  onChange={setRppQuizTheme}
                                  isDarkMode={isDarkMode}
                                />
                              )}
                            </div>

                            <div className="flex flex-col p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800/50">
                              <div
                                className="flex items-center gap-3 cursor-pointer"
                                onClick={() =>
                                  setRppIncludeLinks(!rppIncludeLinks)
                                }
                              >
                                <div
                                  className={`w-10 h-6 p-1 rounded-full transition-all ${rppIncludeLinks ? `bg-${getModuleThemeClasses(rppTheme).primary}` : "bg-slate-200 dark:bg-slate-700"}`}
                                >
                                  <div
                                    className={`w-4 h-4 bg-white rounded-full transition-all ${rppIncludeLinks ? "translate-x-4" : "translate-x-0"}`}
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <span
                                    className={`text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-1.5 ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}
                                  >
                                    Tautan Referensi
                                  </span>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    Sumber Belajar Digital
                                  </span>
                                </div>
                              </div>
                              {rppIncludeLinks && (
                                <RPPItemThemeSelector
                                  selectedTheme={rppLinksTheme}
                                  onChange={setRppLinksTheme}
                                  isDarkMode={isDarkMode}
                                />
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={handleGenerateRPP}
                          disabled={!rppTopic || isGeneratingRpp}
                          className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black text-sm tracking-[0.2em] uppercase shadow-2xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-40"
                        >
                          {isGeneratingRpp ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Sparkles className="w-5 h-5" />
                          )}
                          Mulai Generate
                        </button>
                      </div>
                    </div>

                    {/* AI Stylist Customization Card (RPP) */}
                    <div
                      className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-100"} p-8 rounded-[40px] border space-y-6`}
                    >
                      <button
                        onClick={() => setIsRppStylistOpen(!isRppStylistOpen)}
                        className="w-full flex items-center justify-between group hover:opacity-80 transition-opacity"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 ${getModuleThemeClasses(rppTheme).bgLight} ${getModuleThemeClasses(rppTheme).primaryText} rounded-xl flex items-center justify-center transition-all`}
                          >
                            <Palette className="w-5 h-5" />
                          </div>
                          <span
                            className={`font-black text-xs uppercase tracking-widest text-left ${isDarkMode ? "text-white" : "text-slate-800"}`}
                          >
                            🎨 Tema & Tata Letak RPP
                          </span>
                        </div>
                        <span className="text-slate-400 font-bold text-xs">
                          {isRppStylistOpen ? "Tutup" : "Sesuaikan"} &rarr;
                        </span>
                      </button>

                      {isRppStylistOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800"
                        >
                          {/* Tema Warna (Color Theme) */}
                          <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                              Tema Warna Dokumen
                            </label>
                            <div className="grid grid-cols-6 gap-2">
                              {[
                                {
                                  id: "emerald",
                                  hex: "#10b981",
                                  label: "Emerald",
                                },
                                { id: "blue", hex: "#3b82f6", label: "Blue" },
                                {
                                  id: "indigo",
                                  hex: "#6366f1",
                                  label: "Indigo",
                                },
                                { id: "amber", hex: "#f59e0b", label: "Amber" },
                                { id: "rose", hex: "#f43f5e", label: "Rose" },
                                { id: "teal", hex: "#14b8a6", label: "Teal" },
                              ].map((themeOpt) => (
                                <button
                                  key={themeOpt.id}
                                  onClick={() =>
                                    setRppTheme(themeOpt.id as any)
                                  }
                                  className={`w-full aspect-square rounded-xl transition-all border-2 flex items-center justify-center ${rppTheme === themeOpt.id ? "border-slate-800 dark:border-white scale-110 shadow" : "border-transparent opacity-60 hover:opacity-100"}`}
                                  style={{ backgroundColor: themeOpt.hex }}
                                  title={themeOpt.label}
                                >
                                  {rppTheme === themeOpt.id && (
                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Tipografi (Font Selection) */}
                          <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                              Tipografi (Font)
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: "font-inter", label: "Inter" },
                                { id: "font-outfit", label: "Outfit" },
                                { id: "font-space", label: "Space Grotesk" },
                                {
                                  id: "font-playfair",
                                  label: "Playfair Display",
                                },
                              ].map((fontOpt) => (
                                <button
                                  key={fontOpt.id}
                                  onClick={() => setRppFont(fontOpt.id as any)}
                                  className={`py-2 px-3 border rounded-xl text-[9px] font-black tracking-widest uppercase transition-all ${rppFont === fontOpt.id ? `bg-${getModuleThemeClasses(rppTheme).primary} border-${getModuleThemeClasses(rppTheme).primary} text-white` : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"}`}
                                >
                                  {fontOpt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Tata Letak/Layout Style */}
                          <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                              Tata Letak (Layout)
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { id: "classic", label: "Klasik" },
                                { id: "modern", label: "Modern" },
                                { id: "minimalist", label: "Minimalis" },
                              ].map((layoutOpt) => (
                                <button
                                  key={layoutOpt.id}
                                  onClick={() =>
                                    setRppLayout(layoutOpt.id as any)
                                  }
                                  className={`py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${rppLayout === layoutOpt.id ? `bg-${getModuleThemeClasses(rppTheme).primary} border-${getModuleThemeClasses(rppTheme).primary} text-white` : "border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400"}`}
                                >
                                  {layoutOpt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-8">
                    {rppResult ? (
                      <motion.div
                        className="space-y-6"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      >
                        <div
                          className={`flex justify-between items-center ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"} p-4 rounded-2xl border`}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">
                              Preview Modul Ajar
                            </span>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                              {["pdf", "docx"].map((fmt) => (
                                <button
                                  key={fmt}
                                  onClick={() =>
                                    setRppExportFormat(fmt as "pdf" | "docx")
                                  }
                                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${rppExportFormat === fmt ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                                >
                                  {fmt}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={handleSaveRppToCollection}
                              className={`flex items-center gap-2 px-5 py-2.5 ${isDarkMode ? "bg-amber-900/50 text-amber-200 hover:bg-amber-800" : "bg-amber-100 text-amber-700 hover:bg-amber-200"} rounded-xl text-xs font-bold transition-all`}
                            >
                              <Bookmark className="w-4 h-4" /> 
                              <span className="hidden sm:inline">Simpan Koleksi</span>
                            </button>
                            <button
                              onClick={handleSaveRppToDrive}
                              disabled={isUploadingRppToDrive}
                              className={`flex items-center gap-2 px-5 py-2.5 ${isDarkMode ? "bg-indigo-900 text-indigo-100 hover:bg-indigo-800" : "bg-indigo-500 text-white hover:bg-indigo-600"} rounded-xl text-xs font-bold shadow-lg transition-all disabled:opacity-50`}
                            >
                              {isUploadingRppToDrive ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <HardDrive className="w-4 h-4" />
                              )}
                              <span className="hidden sm:inline">Simpan Drive</span>
                            </button>
                            <button
                              onClick={() => {
                                const fileName = `RPP_${rppGrade}_${rppTopic.substring(0, 20)}`;
                                if (rppExportFormat === "pdf")
                                  exportPDF("rpp-content", fileName);
                                else exportDOCX("rpp-content", fileName);
                              }}
                              className={`flex items-center gap-2 px-5 py-2.5 bg-${getModuleThemeClasses(rppTheme).primary} text-white rounded-xl text-xs font-bold hover:brightness-110 shadow-lg shadow-${getModuleThemeClasses(rppTheme).primary}/20 transition-all`}
                            >
                              <Download className="w-4 h-4" /> <span className="hidden sm:inline">Download</span>{" "}
                              {rppExportFormat.toUpperCase()}
                            </button>
                          </div>
                        </div>

                        <div
                          id="rpp-content"
                          className={`${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"} p-8 md:p-16 rounded-[40px] border shadow-2xl shadow-slate-200/50 dark:shadow-none min-h-[1000px] relative overflow-hidden ${rppFont}`}
                        >
                          <div
                            id="rpp-result-content"
                            className="relative z-10"
                          >
                            {/* Document Watermark/Header Deco */}
                            <div className="absolute top-0 right-0 opacity-[0.03] pointer-events-none -mr-20 -mt-20">
                              <FileText className="w-96 h-96 rotate-12" />
                            </div>

                            {/* Header Decoration based on layout */}
                            {rppLayout === "modern" && (
                              <div
                                className={`absolute top-0 left-0 right-0 h-4 bg-gradient-to-r ${getModuleThemeClasses(rppTheme).gradient}`}
                              />
                            )}
                            {rppLayout === "classic" && (
                              <div
                                className={`absolute top-0 left-0 right-0 h-2 bg-${getModuleThemeClasses(rppTheme).primary} border-b`}
                              />
                            )}
                            {rppLayout === "minimalist" && null}

                            <div
                              className={`flex flex-col md:flex-row justify-between items-start mb-16 gap-8 border-b-4 border-${getModuleThemeClasses(rppTheme).primary} pb-10`}
                            >
                              <div className="flex items-center gap-6">
                                <div
                                  className={`w-16 h-16 bg-gradient-to-br ${getModuleThemeClasses(rppTheme).gradient} rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-blue-200 dark:shadow-none`}
                                >
                                  <BookOpen className="w-8 h-8" />
                                </div>
                                <div>
                                  <h2
                                    className={`text-2xl font-black ${isDarkMode ? "text-white" : "text-slate-900"} uppercase tracking-tighter`}
                                  >
                                    Modul Ajar Pelopor
                                  </h2>
                                  <p
                                    className={`text-[10px] font-black uppercase tracking-[0.3em] italic text-${getModuleThemeClasses(rppTheme).primary}`}
                                  >
                                    IPS Maestro AI • Kurikulum Merdeka •{" "}
                                    {rppLayout.toUpperCase()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right flex flex-col items-end">
                                <div
                                  className={`px-4 py-1.5 ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-50 text-slate-500"} rounded-full text-[9px] font-black uppercase tracking-widest mb-2`}
                                >
                                  ID:{" "}
                                  {Math.random()
                                    .toString(36)
                                    .substring(7)
                                    .toUpperCase()}
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic font-mono">
                                  {new Date().toLocaleDateString("id-ID", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </div>
                              </div>
                            </div>

                            <div
                              className={`prose ${isDarkMode ? "prose-invert" : "prose-slate"} max-w-none 
                              prose-headings:font-black prose-headings:tracking-tight prose-headings:uppercase
                              prose-h1:text-4xl prose-h1:mb-8 prose-h1:text-${getModuleThemeClasses(rppTheme).primary}
                              prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-l-4 prose-h2:${getModuleThemeClasses(rppTheme).border} prose-h2:pl-6
                              prose-p:text-base prose-p:leading-relaxed prose-p:text-slate-600 dark:prose-p:text-slate-400
                              prose-strong:text-${getModuleThemeClasses(rppTheme).primary}
                              prose-ul:list-none prose-ul:pl-0
                              prose-li:relative prose-li:pl-8 prose-li:mb-2
                              prose-table:border-collapse prose-table:w-full prose-table:my-8
                              prose-th:bg-slate-50 dark:prose-th:bg-slate-800 prose-th:p-4 prose-th:text-xs prose-th:font-black prose-th:uppercase prose-th:tracking-widest prose-th:border prose-th:border-slate-200 dark:prose-th:border-slate-700
                              prose-td:p-4 prose-td:text-sm prose-td:border prose-td:border-slate-100 dark:prose-td:border-slate-800
                            `}
                            >
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h2: ({ node, children, ...props }) => {
                                    const text = node ? getNodeText(node).toLowerCase() : "";
                                    let elementTheme = rppTheme;
                                    if (text.includes("video") || text.includes("stimulus")) {
                                      elementTheme = rppVideoTheme === "match" ? rppTheme : rppVideoTheme;
                                    } else if (text.includes("kuis") || text.includes("interaktif") || text.includes("quiz")) {
                                      elementTheme = rppQuizTheme === "match" ? rppTheme : rppQuizTheme;
                                    } else if (text.includes("tautan") || text.includes("referensi") || text.includes("portal") || text.includes("sumber")) {
                                      elementTheme = rppLinksTheme === "match" ? rppTheme : rppLinksTheme;
                                    }
                                    const themeClasses = getModuleThemeClasses(elementTheme);
                                    return (
                                      <h2
                                        {...props}
                                        className={`text-2xl font-black mt-12 mb-6 border-l-4 ${themeClasses.border} pl-6 ${isDarkMode ? "text-white" : "text-slate-900"} uppercase tracking-tight`}
                                      >
                                        {children}
                                      </h2>
                                    );
                                  },
                                  h3: ({ node, children, ...props }) => {
                                    const text = node ? getNodeText(node).toLowerCase() : "";
                                    let elementTheme = rppTheme;
                                    if (text.includes("video") || text.includes("stimulus")) {
                                      elementTheme = rppVideoTheme === "match" ? rppTheme : rppVideoTheme;
                                    } else if (text.includes("kuis") || text.includes("interaktif") || text.includes("quiz")) {
                                      elementTheme = rppQuizTheme === "match" ? rppTheme : rppQuizTheme;
                                    } else if (text.includes("tautan") || text.includes("referensi") || text.includes("portal") || text.includes("sumber")) {
                                      elementTheme = rppLinksTheme === "match" ? rppTheme : rppLinksTheme;
                                    }
                                    const themeClasses = getModuleThemeClasses(elementTheme);
                                    return (
                                      <h3
                                        {...props}
                                        className={`text-xl font-bold mt-8 mb-4 ${themeClasses.primaryText} uppercase tracking-tight`}
                                      >
                                        {children}
                                      </h3>
                                    );
                                  },
                                  a: ({ node, children, ...props }) => {
                                    const text = node ? getNodeText(node).toLowerCase() : "";
                                    let elementTheme = rppLinksTheme === "match" ? rppTheme : rppLinksTheme;
                                    if (text.includes("video") || text.includes("youtube") || text.includes("youtu.be")) {
                                      elementTheme = rppVideoTheme === "match" ? rppTheme : rppVideoTheme;
                                    }
                                    return (
                                      <a
                                        {...props}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`underline font-bold text-${getModuleThemeClasses(elementTheme).primary}`}
                                      >
                                        {children}
                                      </a>
                                    );
                                  },
                                  img: ({ node, ...props }) => (
                                    <figure className="my-10">
                                      <img
                                        {...props}
                                        className="rounded-[32px] shadow-2xl object-cover w-full max-h-[500px] border-8 border-white dark:border-slate-800"
                                        referrerPolicy="no-referrer"
                                      />
                                      {props.alt && (
                                        <figcaption className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4 italic">
                                          {props.alt}
                                        </figcaption>
                                      )}
                                    </figure>
                                  ),
                                  li: ({ node, children, ...props }) => {
                                    const text = node ? getNodeText(node).toLowerCase() : "";
                                    let elementTheme = rppTheme;
                                    if (text.includes("video") || text.includes("stimulus") || text.includes("youtube")) {
                                      elementTheme = rppVideoTheme === "match" ? rppTheme : rppVideoTheme;
                                    } else if (text.includes("kuis") || text.includes("interaktif") || text.includes("quiz") || text.includes("soal")) {
                                      elementTheme = rppQuizTheme === "match" ? rppTheme : rppQuizTheme;
                                    } else if (text.includes("tautan") || text.includes("referensi") || text.includes("portal") || text.includes("sumber")) {
                                      elementTheme = rppLinksTheme === "match" ? rppTheme : rppLinksTheme;
                                    }
                                    const themeClasses = getModuleThemeClasses(elementTheme);
                                    return (
                                      <li
                                        {...props}
                                        className="relative pl-8 mb-3 group"
                                      >
                                        {rppLayout === "modern" ? (
                                          <span
                                            className={`absolute left-0 top-1.5 w-5 h-5 ${themeClasses.bgLight} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}
                                          >
                                            <div
                                              className={`w-1.5 h-1.5 ${themeClasses.fill} rounded-full`}
                                            />
                                          </span>
                                        ) : rppLayout === "classic" ? (
                                          <span className="absolute left-0 top-1.5 flex items-center justify-center font-bold text-slate-500">
                                            •
                                          </span>
                                        ) : (
                                          <span
                                            className={`absolute left-0 top-1.5 w-1.5 h-1.5 ${themeClasses.fill} rounded-sm`}
                                          />
                                        )}
                                        <div
                                          className={`${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
                                        >
                                          {children}
                                        </div>
                                      </li>
                                    );
                                  },
                                  blockquote: ({
                                    node,
                                    children,
                                    ...props
                                  }) => {
                                    const text = node ? getNodeText(node).toLowerCase() : "";
                                    let elementTheme = rppTheme;
                                    let IconComponent = MessageSquare;
                                    if (text.includes("video") || text.includes("stimulus") || text.includes("youtube")) {
                                      elementTheme = rppVideoTheme === "match" ? rppTheme : rppVideoTheme;
                                      IconComponent = Video;
                                    } else if (text.includes("kuis") || text.includes("interaktif") || text.includes("quiz") || text.includes("soal")) {
                                      elementTheme = rppQuizTheme === "match" ? rppTheme : rppQuizTheme;
                                      IconComponent = BookOpen;
                                    } else if (text.includes("tautan") || text.includes("referensi") || text.includes("portal") || text.includes("sumber") || text.includes("http")) {
                                      elementTheme = rppLinksTheme === "match" ? rppTheme : rppLinksTheme;
                                      IconComponent = Link;
                                    }
                                    const themeClasses = getModuleThemeClasses(elementTheme);
                                    return (
                                      <blockquote
                                        {...props}
                                        className={`p-8 rounded-[32px] border-l-8 ${themeClasses.border} italic my-10 relative overflow-hidden ${rppLayout === "modern" ? `${themeClasses.bgLight}` : rppLayout === "classic" ? "bg-slate-50 dark:bg-slate-800" : "border-slate-200 dark:border-slate-700 italic bg-transparent p-4"}`}
                                      >
                                        <div className="absolute top-4 right-8 opacity-[0.05]">
                                          <IconComponent className="w-20 h-20" />
                                        </div>
                                        <div className="relative z-10 text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                                          {children}
                                        </div>
                                      </blockquote>
                                    );
                                  },
                                }}
                              >
                                {rppResult}
                              </ReactMarkdown>
                            </div>
                            <div
                              className={`mt-20 pt-10 border-t-2 border-dashed ${isDarkMode ? "border-slate-800" : "border-slate-100"} flex flex-col md:flex-row justify-between items-center gap-6 opacity-60`}
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
                                </div>
                                <div>
                                  <div className="text-[10px] font-black uppercase tracking-widest">
                                    Goresan Pena Digital
                                  </div>
                                  <div className="text-[9px] font-bold text-slate-400 italic">
                                    Terverifikasi IPS Maestro AI Engine
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-[10px] font-black tracking-widest uppercase mb-1">
                                  Edisi Merdeka {new Date().getFullYear()}
                                </div>
                                <div className="text-[8px] font-bold text-slate-400">
                                  Dicetak secara digital:{" "}
                                  {new Date().toLocaleDateString("id-ID")} •{" "}
                                  {new Date().toLocaleTimeString("id-ID")}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div
                        className={`h-[600px] border-4 border-dashed ${isDarkMode ? "border-slate-800" : "border-slate-100"} rounded-[40px] flex flex-col items-center justify-center text-center p-12`}
                      >
                        <div
                          className={`w-20 h-20 ${isDarkMode ? "bg-slate-900" : "bg-slate-50"} rounded-[32px] flex items-center justify-center mb-8 rotate-12 transition-all`}
                        >
                          <FileText className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3
                          className={`text-2xl font-black mb-3 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                        >
                          Belum Ada RPP Dibuat
                        </h3>
                        <p className="text-slate-400 font-bold max-w-sm leading-relaxed">
                          Masukkan topik di sebelah kiri untuk menghasilkan RPP
                          yang disesuaikan dengan Kurikulum Merdeka.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
                
            {rppMode === "saved" && (
                  <div className="space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                      <div>
                        <h3 className={`text-2xl font-black ${isDarkMode ? "text-white" : "text-slate-800"} tracking-tighter`}>
                          Koleksi RPP Maestro
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                          Akses Cepat Ke RPP Yang Telah Disimpan
                        </p>
                      </div>
                      
                      {savedRpps.length > 0 && (
                        <div className="flex items-center gap-4">
                          <button
                            onClick={handleBulkPrintRpp}
                            disabled={selectedRppsForPrint.length === 0}
                            className={`flex items-center gap-2 px-6 py-3 rounded-[20px] font-black text-[10px] uppercase tracking-widest transition-all ${selectedRppsForPrint.length > 0 ? "bg-rose-500 text-white shadow-lg shadow-rose-200 hover:scale-105" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                          >
                            <Printer className="w-4 h-4" /> Cetak Pilihan ({selectedRppsForPrint.length})
                          </button>
                        </div>
                      )}
                    </div>

                    {savedRpps.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-32 opacity-20 italic">
                        <BookmarkX className="w-32 h-32 mb-6" />
                        <p className="font-black uppercase tracking-[0.3em]">
                          Koleksi Masih Kosong
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {savedRpps.map((rpp) => (
                           <motion.div
                             key={rpp.id}
                             initial={{ opacity: 0, scale: 0.95 }}
                             animate={{ opacity: 1, scale: 1 }}
                             whileHover={{ y: -8, rotate: 1 }}
                             className={`relative ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-2xl shadow-slate-200/50"} p-10 rounded-[56px] border group hover:border-amber-500 transition-all cursor-pointer overflow-hidden`}
                             onClick={() => {
                               setRppTopic(rpp.topic);
                               setRppGrade(rpp.grade);
                               setRppResult(rpp.content);
                               setRppMode("generate");
                             }}
                           >
                             <div className="absolute top-6 left-6 z-20" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={selectedRppsForPrint.includes(rpp.id)}
                                  onChange={(e) => {
                                    if(e.target.checked) setSelectedRppsForPrint(prev => [...prev, rpp.id]);
                                    else setSelectedRppsForPrint(prev => prev.filter(id => id !== rpp.id));
                                  }}
                                  className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500 bg-slate-100 border-slate-300 cursor-pointer hover:scale-110 transition-transform"
                                />
                             </div>
                             
                             <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
                               <Bookmark className="w-48 h-48" />
                             </div>
                             
                             <div className="flex items-start justify-between mb-10 relative z-10 pl-6">
                               <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-[28px] flex items-center justify-center text-white shadow-xl shadow-blue-200 dark:shadow-none">
                                 <FileText className="w-8 h-8" />
                               </div>
                               <div className="flex gap-2">
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleDeleteSavedRpp(rpp.id);
                                   }}
                                   className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-[20px] transition-all shadow-sm"
                                 >
                                   <Trash2 className="w-5 h-5" />
                                 </button>
                               </div>
                             </div>
                             
                             <div className="relative z-10">
                               <div className="flex items-center gap-3 mb-4">
                                 <div className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-xl uppercase tracking-widest">
                                   KELAS {rpp.grade}
                                 </div>
                               </div>
                               <h4 className={`text-xl font-black ${isDarkMode ? "text-white" : "text-slate-800"} mb-3 line-clamp-2 tracking-tight`}>
                                 {rpp.topic}
                               </h4>
                               <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest italic mb-10 line-clamp-1">
                                 Disimpan: {new Date(rpp.date).toLocaleDateString("id-ID")}
                               </p>
                             </div>
                           </motion.div>
                         ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Hidden Render Container for RPP Bulk Print */}
                <div className="absolute left-[-9999px] top-[-9999px] h-0 overflow-hidden">
                  <div id="bulk-rpp-print-container" className="bg-white p-16 text-black max-w-[800px]">
                    {savedRpps
                      .filter((r) => selectedRppsForPrint.includes(r.id))
                      .map((rpp, idx) => (
                        <div key={rpp.id} className="pb-8">
                          {idx > 0 && <div style={{ borderTop: "2px dashed #999", margin: "40px 0" }} />}
                          <h1 className="text-4xl font-black mb-6 uppercase border-b-4 border-slate-900 pb-4">RPP: {rpp.topic} (Kelas {rpp.grade})</h1>
                          <div className="prose prose-slate max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{rpp.content}</ReactMarkdown>
                          </div>
                        </div>
                    ))}
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
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter decoration-indigo-500 decoration-4 underline-offset-8 underline italic">
                  Segera Hadir
                </h3>
                <p className="text-slate-400 font-bold mt-4 max-w-sm">
                  Fitur {activeTab.toUpperCase()} sedang dalam tahap penyetelan
                  akhir untuk performa maksimal.
                </p>
                <button
                  onClick={() => setActiveTab("beranda")}
                  className="mt-10 px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all"
                >
                  Kembali Ke Beranda
                </button>
              </div>
            )}
          </AnimatePresence>
        </main>

        {/* Quick Access Footer - Mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 p-4 grid grid-cols-5 gap-2 z-50 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
          {[
            { id: "beranda", icon: LayoutGrid },
            { id: "lkpd", icon: FileSpreadsheet },
            { id: "chatbot", icon: MessageSquare },
            { id: "rpp", icon: FileText },
            { id: "pengaturan", icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`flex items-center justify-center p-3 rounded-2xl transition-all ${activeTab === item.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110 -translate-y-2" : "text-slate-400"}`}
            >
              <item.icon className="w-6 h-6" />
            </button>
          ))}
        </div>
        {/* Editing Question Modal Overlay */}
        <AnimatePresence>
          {editingQuestionIndex !== null && editingQuestionData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-10 bg-slate-900/90 backdrop-blur-md"
              onClick={() => setEditingQuestionIndex(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto ${isDarkMode ? "bg-slate-900" : "bg-white"} rounded-[40px] shadow-2xl flex flex-col p-10 space-y-8`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white">
                      <Edit2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3
                        className={`text-xl font-black ${isDarkMode ? "text-white" : "text-slate-800"}`}
                      >
                        Edit Soal HOTS
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Sesuaikan butir soal maestro Anda
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingQuestionIndex(null)}
                    className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors text-slate-400"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">
                        Butir Soal (Markdown)
                      </label>
                      <textarea
                        value={editingQuestionData.question}
                        onChange={(e) =>
                          setEditingQuestionData({
                            ...editingQuestionData,
                            question: e.target.value,
                          })
                        }
                        className={`w-full h-40 ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100"} border-2 rounded-2xl p-4 text-sm font-bold focus:outline-none ${!editingQuestionData.question || editingQuestionData.question.trim().length < 10 ? "border-rose-500/50" : "focus:border-blue-500"}`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">
                          Level
                        </label>
                        <select
                          value={editingQuestionData.level}
                          onChange={(e) =>
                            setEditingQuestionData({
                              ...editingQuestionData,
                              level: e.target.value,
                            })
                          }
                          className={`w-full ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100"} border-2 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none`}
                        >
                          <option value="C4">C4 - Analisis</option>
                          <option value="C5">C5 - Evaluasi</option>
                          <option value="C6">C6 - Kreasi</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">
                          Hapus
                        </label>
                        <button
                          onClick={() => {
                            if (editingQuestionIndex !== null) {
                              handleDeleteQuestion(editingQuestionIndex);
                              setEditingQuestionIndex(null);
                            }
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2 bg-rose-50 text-rose-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-100 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Hapus
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">
                        Pilihan Jawaban
                      </label>
                      <div className="space-y-3">
                        {["A", "B", "C", "D"].map((key) => (
                          <div key={key} className="flex items-center gap-3">
                            <button
                              onClick={() =>
                                setEditingQuestionData({
                                  ...editingQuestionData,
                                  answer: key,
                                })
                              }
                              className={`w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center font-black transition-all ${editingQuestionData.answer === key ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200"}`}
                            >
                              {key}
                            </button>
                            <input
                              value={editingQuestionData.options[key]}
                              onChange={(e) =>
                                setEditingQuestionData({
                                  ...editingQuestionData,
                                  options: {
                                    ...editingQuestionData.options,
                                    [key]: e.target.value,
                                  },
                                })
                              }
                              className={`flex-1 ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100"} border-2 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none ${!editingQuestionData.options[key] || editingQuestionData.options[key].trim() === "" ? "border-rose-500/50" : "focus:border-emerald-500"}`}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-[9px] text-slate-400 mt-3 font-bold italic">
                        *Klik huruf (A/B/C/D) untuk mengatur kunci jawaban.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">
                        Subtopik / Kelompok
                      </label>
                      <input
                        value={editingQuestionData.subtopic || ""}
                        onChange={(e) =>
                          setEditingQuestionData({
                            ...editingQuestionData,
                            subtopic: e.target.value,
                          })
                        }
                        className={`w-full ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100"} border-2 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">
                        Tag (Pisahkan dengan koma)
                      </label>
                      <input
                        value={(editingQuestionData.tags || []).join(", ")}
                        onChange={(e) =>
                          setEditingQuestionData({
                            ...editingQuestionData,
                            tags: e.target.value
                              .split(",")
                              .map((t: string) => t.trim())
                              .filter(Boolean),
                          })
                        }
                        className={`w-full ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100"} border-2 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">
                        Pembahasan / Rasionalisasi
                      </label>
                      <textarea
                        value={editingQuestionData.explanation}
                        onChange={(e) =>
                          setEditingQuestionData({
                            ...editingQuestionData,
                            explanation: e.target.value,
                          })
                        }
                        className={`w-full h-32 ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100"} border-2 rounded-2xl p-4 text-xs font-bold focus:outline-none ${!editingQuestionData.explanation || editingQuestionData.explanation.trim().length < 10 ? "border-rose-500/50" : "focus:border-blue-500"}`}
                      />
                    </div>
                    <div className="pt-4 flex gap-4">
                      <button
                        onClick={() => setEditingQuestionIndex(null)}
                        className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 dark:shadow-none hover:bg-emerald-600 hover:scale-[1.02] transition-all"
                      >
                        Simpan Perubahan
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Backup Modal Overlay */}
        <AnimatePresence>
          {showBackupModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md"
              onClick={() => {
                setShowBackupModal(false);
                setBackupPasscode("");
              }}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-md ${isDarkMode ? "bg-slate-900 border border-slate-800" : "bg-white"} rounded-[32px] shadow-2xl p-8 space-y-6 text-left`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`text-lg font-black ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                        Sandi Pengaman Backup
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Keamanan Cadangan Data Anda
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowBackupModal(false);
                      setBackupPasscode("");
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <span className={`text-xs block ${isDarkMode ? "text-slate-200 font-medium" : "text-slate-600 font-bold"} leading-relaxed`}>
                    Demi keamanan data siswa dan aktivitas mengajar Anda, harap tetapkan kata sandi/passcode untuk melakukan enkripsi pada file hasil backup. Anda akan membutuhkan kata sandi ini saat memulihkan data tersebut nantinya.
                  </span>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">
                      Kata Sandi Keamanan (Min 6 Karakter)
                    </label>
                    <input
                      type="password"
                      value={backupPasscode}
                      onChange={(e) => setBackupPasscode(e.target.value)}
                      placeholder="Masukkan kata sandi pengaman..."
                      className={`w-full ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100 shadow-inner"} border-2 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-amber-500 transition-colors`}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => {
                      setShowBackupModal(false);
                      setBackupPasscode("");
                    }}
                    className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-sans"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleDownloadBackup(backupPasscode)}
                    disabled={backupPasscode.trim().length < 6}
                    className={`flex-1 py-3.5 bg-amber-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all ${backupPasscode.trim().length >= 6 ? "hover:bg-amber-600 shadow-xl shadow-amber-100 dark:shadow-none hover:scale-[1.02]" : "opacity-45 cursor-not-allowed"}`}
                  >
                    Mulai Unduh
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Restore Modal Overlay */}
        <AnimatePresence>
          {showRestoreModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md"
              onClick={() => {
                setShowRestoreModal(false);
                setRestorePasscode("");
                setRestoreFileContent("");
                setRestoreFileName("");
              }}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-md ${isDarkMode ? "bg-slate-900 border border-slate-800" : "bg-white"} rounded-[32px] shadow-2xl p-8 space-y-6 text-left`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                      <Unlock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`text-lg font-black ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                        Pulihkan Data Cadangan
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Enkripsi & Verifikasi Berkas
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowRestoreModal(false);
                      setRestorePasscode("");
                      setRestoreFileContent("");
                      setRestoreFileName("");
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Drop File or Select File */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                      Pilih Berkas Cadangan (.imb)
                    </label>
                    <div className={`relative px-4 py-8 border-2 border-dashed rounded-2xl text-center transition-colors ${restoreFileName ? "border-emerald-500 bg-emerald-50/10" : "border-slate-200 dark:border-slate-800 hover:border-emerald-500/50"}`}>
                      <input
                        type="file"
                        accept=".imb"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setRestoreFileName(file.name);
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              const content = evt.target?.result as string;
                              setRestoreFileContent(content);
                            };
                            reader.readAsText(file);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {restoreFileName ? (
                        <div className="space-y-2">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto animate-bounce" />
                          <p className={`text-xs font-black truncate max-w-xs ${isDarkMode ? "text-white" : "text-slate-800"} px-4`}>
                            {restoreFileName}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                            Klik kembali jika ingin mengganti berkas
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 py-4">
                          <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                          <span className={`text-[11px] block font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"} px-4`}>
                            Seret & lepas berkas di sini atau klik untuk mencari berkas
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {restoreFileContent && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                        Kata Sandi Enkripsi Berkas
                      </label>
                      <input
                        type="password"
                        value={restorePasscode}
                        onChange={(e) => setRestorePasscode(e.target.value)}
                        placeholder="Masukkan kata sandi dekripsi..."
                        className={`w-full ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100 shadow-inner"} border-2 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-emerald-500 transition-colors`}
                      />
                    </motion.div>
                  )}
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => {
                      setShowRestoreModal(false);
                      setRestorePasscode("");
                      setRestoreFileContent("");
                      setRestoreFileName("");
                    }}
                    className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-sans"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleRestoreBackup(restorePasscode)}
                    disabled={!restoreFileContent || !restorePasscode.trim()}
                    className={`flex-1 py-3.5 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                      restoreFileContent && restorePasscode.trim() ? "hover:bg-emerald-600 shadow-xl shadow-emerald-100 dark:shadow-none hover:scale-[1.02]" : "opacity-45 cursor-not-allowed"
                    }`}
                  >
                    Pulihkan Data
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
