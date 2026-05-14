import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

const getAI = () => {
  if (!genAI) {
    const key = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || "";
    genAI = new GoogleGenAI({ apiKey: key });
  }
  return genAI;
};

export const generateTeachingContent = async (type: string, topic: string, kurikulum: string = 'Merdeka', grade: string = '', subject: string = 'IPS', level: string = 'SMP') => {
  const ai = getAI();
  const model = "gemini-2.0-flash";
  const kurikulumText = kurikulum === 'Berbasis Cinta' 
    ? 'Kurikulum Berbasis Cinta (pendekatan humanistik, penuh kasih sayang, and berfokus pada kebahagiaan belajar siswa)' 
    : `Kurikulum ${kurikulum}`;

  const gradeText = grade ? ` untuk tingkat Kelas ${grade} ${level}` : '';

  const prompt = `Anda adalah asisten ahli untuk guru ${subject} ${level} di Indonesia. 
  Buatlah ${type} untuk materi: ${topic}${gradeText}.
  Output harus dalam format Markdown yang rapi dan profesional sesuai standar kedinasan.
  Sertakan bagian: 
  - Identitas (Mata Pelajaran: ${subject}, Kelas: ${grade}, Semester, Topik: ${topic})
  - Capaian Pembelajaran / Kompetensi Dasar
  - Tujuan Pembelajaran
  - Materi Inti (Mendalam and komprehensif)
  - Metode and Media Pembelajaran
  - Langkah-langkah Pembelajaran (Pendahuluan, Inti, Penutup)
  - Asesmen (Sertakan 5 soal pilihan ganda HOTS + kunci jawaban)
  - Daftar Pustaka (Wajib minimal 3 referensi relevan. Format: Penulis. (Tahun). Judul. Kota: Penerbit. Untuk sumber internet sertakan URL and tanggal akses. Gunakan bahasa Indonesia yang baik sesuai EYD & KBBI).
  
  Gunakan bahasa Indonesia yang sesuai dengan ${kurikulumText}.
  Atribusi: Dibuat oleh Catur Pamungkas, S.Pd.,Gr. (catatanguruips.blogspot.com)`;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt
  });
  return response.text;
};

export const generateSyllabusContent = async (topic: string, gradeInfo: string, kurikulum: string = 'Merdeka', subject: string = 'IPS', level: string = 'SMP') => {
  const ai = getAI();
  const model = "gemini-2.0-flash";
  const kurikulumText = kurikulum === 'Berbasis Cinta'
    ? 'Kurikulum Berbasis Cinta (Pendekatan humanistik yang mengutamakan kasih sayang, empati, and kebahagiaan siswa dalam belajar ${subject})'
    : `Kurikulum ${kurikulum}`;

  const prompt = `
    Anda adalah asisten ahli kurikulum ${subject} ${level} di Indonesia. 
    Buatlah Silabus komplit untuk topik: "${topic}" untuk ${gradeInfo}.
    Kurikulum yang digunakan: ${kurikulumText}.
    
    Silabus harus mencakup:
    1. Identitas (Mata Pelajaran: ${subject}, Kelas, Semester, Kurikulum).
    2. Tujuan Pembelajaran (TP).
    3. Alur Tujuan Pembelajaran (ATP).
    4. Materi Pokok.
    5. Kegiatan Pembelajaran (Jika Kurikulum Berbasis Cinta, pastikan aktivitas sangat humanis and menyenangkan).
    6. Penilaian/Asesmen.
    7. Alokasi Waktu.
    8. Sumber Belajar.
    9. Daftar Pustaka (Wajib minimal 3 referensi relevan, format: Penulis. (Tahun). Judul. Kota: Penerbit. Untuk internet sertakan URL & tanggal akses. Gunakan standar EYD & KBBI).

    Gunakan format Markdown yang rapi.
    Gunakan Bahasa Indonesia yang formal namun tetap menginspirasi.
    Atribusi: Dibuat oleh Catur Pamungkas, S.Pd.,Gr. (catatanguruips.blogspot.com)
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt
  });
  return response.text;
};

export const generateRPPMendalam = async (
  topic: string, 
  subject: string, 
  dimensions: string[],
  teacherName: string,
  nip: string,
  school: string,
  grade: string,
  semester: string,
  meetings: string,
  media: string,
  learningModel: string,
  kurikulum: string = 'Merdeka',
  meetingDates: string[] = []
) => {
  const ai = getAI();
  const model = "gemini-2.0-flash";
  const kurikulumText = kurikulum === 'Berbasis Cinta'
    ? 'Kurikulum Berbasis Cinta (Pendekatan kasih sayang, humanistik, and student-centered yang mengutamakan kebahagiaan serta kedekatan emosional)'
    : `Kurikulum ${kurikulum}`;

  const datesInfo = meetingDates.length > 0 
    ? `JADWAL PELAKSANAAN:\n${meetingDates.map((d, i) => `- Pertemuan ${i+1}: ${d}`).join('\n')}`
    : '';

  const prompt = `
    Anda adalah konsultan kurikulum senior di Indonesia yang ahli dalam Pendekatan Pembelajaran Mendalam (Deep Learning/NPDL). Buatlah "RENCANA PEMBELAJARAN MENDALAM" (RPM) yang sangat rapi and formal sesuai standar kedinasan (siap cetak/setor ke pengawas).
    
    DATA IDENTITAS:
    - Nama Guru: ${teacherName}
    - NIP: ${nip}
    - Satuan Pendidikan: ${school}
    - Kelas / Semester: Kelas ${grade} / ${semester}
    - Mata Pelajaran: ${subject}
    - Kurikulum: ${kurikulumText}
    - Topik: ${topic}
    - Jumlah Pertemuan: ${meetings}
    - Media Pembelajaran: ${media}
    - Model Pembelajaran: ${learningModel}
    - Fokus 8 Dimensi Profil Lulusan Pendekatan Pembelajaran Mendalam: ${dimensions.join(", ")}
    ${datesInfo}

    STRUKTUR OUTPUT (WAJIB MENGIKUTI FORMAT BERIKUT DALAM MARKDOWN):

    # RENCANA PEMBELAJARAN MENDALAM (RPM)
    
    **Identitas Madrasah/Sekolah**
    - **Nama Guru** : ${teacherName}
    - **NIP** : ${nip}
    - **Satuan Pendidikan** : ${school}
    - **Kelas / Semester** : Kelas ${grade} / ${semester}
    - **Mata Pelajaran** : ${subject}
    - **Kurikulum** : ${kurikulumText}
    - **Topik** : ${topic}
    - **Alokasi Waktu** : ${meetings}
    - **Media Pembelajaran** : ${media}
    - **Model Pembelajaran** : ${learningModel}
    ${meetingDates.length > 0 ? `- **Jadwal Pelaksanaan** :\n${meetingDates.map((d, i) => `  * Pertemuan ${i+1}: ${d}`).join('\n')}` : ''}

    ## I. PENDAHULUAN & IDENTIFIKASI
    - **Profil Murid**: (Jelaskan secara mendalam tentang kesiapan, minat, and profil belajar siswa terkait topik ${topic}).
    - **Materi Inti**: (Rincian materi mendalam yang menantang pemikiran kritis).
    - **8 Dimensi Profil Lulusan Pendekatan Pembelajaran Mendalam**: (Uraikan bagaimana dimensi ${dimensions.join(", ")} diintegrasikan secara holistik dalam alur pembelajaran ini untuk mencapai kompetensi yang mendalam).

    ## II. DESAIN PEMBELAJARAN
    - **Capaian Pembelajaran (CP)**: (Tuliskan CP yang relevan secara naratif).
    - **Tujuan Pembelajaran (TP)**: (List minimal 3 TP yang spesifik, terukur, and menantang).
    - **Model/Metode Pembelajaran**: ${learningModel}
    - **Lingkungan & Sumber Belajar**: (Paparkan lingkungan fisik/virtual and kemitraan pembelajaran).

    ## III. LANGKAH-LANGKAH PEMBELAJARAN (ALUR BELAJAR)
    ### A. KEGIATAN AWAL (Mindful & Meaningful)
    - Orientasi, Apersepsi (Pertanyaan Pemantik), and Motivasi.
    
    ### B. KEGIATAN INTI (Mindful, Meaningful, & Joyful)
    - Integrasikan Diferensiasi (Konten/Proses/Produk).
    - Langkah eksplorasi materi ${topic}.
    - Aktivitas kolaboratif and pemanfaatan perangkat digital.
    - Pengolahan informasi and verifikasi hasil.
    - Penguatan Literasi & Numerasi.

    ### C. KEGIATAN PENUTUP (Mindful)
    - Refleksi bersama siswa (Metakognisi).
    - Resume and penguatan materi.
    - Doa and penutup yang hangat.

    ## IV. ASESMEN & TINDAK LANJUT
    - **Asesmen Awal (Diagnostic)**
    - **Asesmen Proses (Formatif)**
    - **Asesmen Akhir (Sumatif)**

    ## V. DAFTAR PUSTAKA
    (Wajib sertakan minimal 3 referensi relevan menggunakan gaya penulisan formal Indonesia sesuai EYD and KBBI:
    - Format Buku: Nama Penulis. (Tahun). Judul Buku. Kota: Penerbit.
    - Format Internet: Nama Penulis/Instansi. (Tahun). Judul Artikel. Diakses dari [URL] pada [Tanggal].
    Pastikan semua referensi valid and berkaitan erat dengan materi ${topic}).

    ## VI. PENGESAHAN
    [SEKSI_PENGESAHAN]
    Kota: Kebumen
    Tanggal: ${new Date().toLocaleDateString('id-ID')}
    Kepala Sekolah: (Nama Kepala Sekolah)
    NIP Kepala: (NIP Kepala Sekolah)
    Guru Mata Pelajaran: ${teacherName}
    NIP Guru: ${nip}
    [/SEKSI_PENGESAHAN]

    ---
    *Dibuat secara profesional oleh AI Maestro - Atribusi: Catur Pamungkas, S.Pd.,Gr. (catatanguruips.blogspot.com)*
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt
  });
  return response.text;
};

export const generateQuizFromData = async (textData: string, grade: string, subject: string = 'IPS', level: string = 'SMP') => {
  const ai = getAI();
  const model = "gemini-2.0-flash";
  const prompt = `Anda adalah ahli pembuat soal ${subject} ${level} dengan spesialisasi HOTS (Higher Order Thinking Skills).
  Buatlah kuis interaktif berdasarkan materi berikut untuk Kelas ${grade} ${level}.
  Materi:
  ${textData.substring(0, 15000)} // Batasi panjang teks untuk menghindari error token

  Kuis harus terdiri dari 10 soal dengan level kognitif HOTS (C4: Menganalisis, C5: Mengevaluasi):
  - 10 soal Pilihan Ganda (multiple-choice)

  Setiap soal HARUS memiliki:
  - id (string unik)
  - type ('multiple-choice')
  - question (pertanyaan dalam Bahasa Indonesia, harus mengukur kemampuan analisis/evaluasi, bukan sekadar ingatan)
  - options (4 pilihan jawaban: A, B, C, D)
  - correctAnswer (jawaban yang benar)
  - explanation (penjelasan mendalam mengapa jawaban tersebut benar dan jawaban lain salah)
  
  Output HARUS dalam format JSON murni.
  Gunakan skema: { "title": string, "topic": string, "grade": string, "difficulty": "Sulit", "questions": Array<{ "id": string, "type": string, "question": string, "options": string[], "correctAnswer": string, "explanation": string }> }`;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      temperature: 0.7,
      responseMimeType: "application/json"
    }
  });
  return response.text;
};

export interface BankSoalConfig {
  topic: string;
  baseText?: string;
  grade: string;
  subject: string;
  educationLevel: string;
  difficulty: string; // 'C1', 'C2', 'C3', 'C4', 'C5', 'C6'
  countMC: number;
  countComplexMC: number;
  countMatch: number;
  countOrder: number;
  countTF: number;
  withImages?: boolean;
}

export const generateBankSoal = async (config: BankSoalConfig) => {
  const ai = getAI();
  const model = "gemini-2.0-flash";
  const levels: Record<string, string> = {
    "C1": "C1 (Mengingat): Mengetahui informasi dasar, definisi, dan fakta.",
    "C2": "C2 (Memahami): Menjelaskan ide atau konsep, menginterpretasikan makna.",
    "C3": "C3 (Mengaplikasikan): Menggunakan informasi dalam situasi baru dan konkret.",
    "C4": "C4 (Menganalisis): Membedah konsep, mencari hubungan, memeriksa struktur.",
    "C5": "C5 (Mengevaluasi): Membuat penilaian berdasarkan kriteria dan standar.",
    "C6": "C6 (Mencipta): Menggabungkan elemen-elemen untuk membentuk keseluruhan baru yang utuh/kreatif."
  };

  const typesStr = [];
  if (config.countMC > 0) typesStr.push(`- ${config.countMC} soal Pilihan Ganda (type: 'mc')`);
  if (config.countComplexMC > 0) typesStr.push(`- ${config.countComplexMC} soal Pilihan Ganda Kompleks (type: 'complex_mc', jawaban benar lebih dari satu)`);
  if (config.countMatch > 0) typesStr.push(`- ${config.countMatch} soal Menjodohkan (type: 'match')`);
  if (config.countOrder > 0) typesStr.push(`- ${config.countOrder} soal Mengurutkan (type: 'order')`);
  if (config.countTF > 0) typesStr.push(`- ${config.countTF} soal Benar/Salah (type: 'tf')`);

  const promptImage = config.withImages ? "PENTING: Untuk setiap soal, tambahkan field 'imagePrompt' (string) berisi deskripsi visual mendetail (dalam Bahasa Inggris agar generator AI bekerja maksimal) yang menggambarkan situasi atau objek dalam soal tersebut. Deskripsi harus spesifik dan artistik untuk men-generate gambar ilustrasi pendukung yang berkualitas tinggi. Jangan biarkan field ini null." : "";

  const prompt = `Anda adalah ahli pembuat soal pendidikan kelas dunia dengan pengalaman level taksonomi Bloom.
Buatlah Bank Soal ${config.subject} untuk tingkat ${config.educationLevel} Kelas ${config.grade} berdasarkan data berikut:
Topik/Perintah: ${config.topic}
Teks Referensi (Opsional): ${config.baseText?.substring(0, 10000) || "Tidak ada teks referensi, gunakan pengetahuan Anda."}
Level Kesulitan Kognitif (Taksonomi Bloom): ${levels[config.difficulty] || config.difficulty}

Setiap soal HARUS memiliki:
- id (string unik)
- type ('mc', 'complex_mc', 'match', 'order', 'tf')
- question (pertanyaan, bisa disajikan dengan konteks jika HOTS)
- options (array of strings, wajib untuk 'mc', 'complex_mc', 'order')
  - Untuk 'match', options berisi pasangan, e.g., ["A - 1", "B - 2"]
  - Untuk 'tf', options abaikan saja atau kosongkan
- answer (string, atau dipisahkan koma, berisi kunci jawaban yang benar)
- explanation (penjelasan mendetail kunci jawaban, referensi level Bloom)
- imagePrompt (wajib ada jika disuruh oleh sistem, berisi deskripsi visual)

${promptImage}

Output HARUS dalam format JSON murni.
Gunakan skema: 
{ 
  "title": string, 
  "topic": string, 
  "grade": string, 
  "subject": string,
  "level": string,
  "difficulty": string, 
  "questions": Array<{ 
    "id": string, 
    "type": string, 
    "question": string, 
    "options": string[], 
    "answer": string, 
    "explanation": string,
    "imagePrompt"?: string
  }> 
}`;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      temperature: 0.7,
      responseMimeType: "application/json"
    }
  });
  return response.text;
};

export const generateSingleImagePrompt = async (question: string) => {
  const ai = getAI();
  const model = "gemini-2.0-flash";
  const prompt = `Task: Create a vivid, highly descriptive, and artistic visual prompt for an AI image generator (like DALL-E or Midjourney) based on this question: "${question}".
  The prompt should be in English, include style keywords (e.g., "digital illustration, educational, high detail, vibrant colors"), and avoid text or labels. 
  Output ONLY the prompt string.`;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      temperature: 0.9
    }
  });
  return response.text;
};

export const generateQuizContent = async (topic: string, grade: string, subject: string = 'IPS', level: string = 'SMP') => {
  const ai = getAI();
  const model = "gemini-2.0-flash";
  const prompt = `Anda adalah ahli pembuat soal ${subject} ${level}. Buatlah kuis interaktif untuk topik: "${topic}" untuk Kelas ${grade} ${level}.
  Kuis harus terdiri dari 5 soal:
  - 3 soal Pilihan Ganda (multiple-choice)
  - 2 soal Isian Singkat (short-answer)
  
  Setiap soal HARUS memiliki:
  - id (string unik)
  - type ('multiple-choice' atau 'short-answer')
  - question (pertanyaan dalam Bahasa Indonesia)
  - options (hanya untuk multiple-choice, minimal 4 pilihan)
  - correctAnswer (jawaban yang benar)
  - explanation (penjelasan mengapa itu jawaban yang benar)
  
  Output HARUS dalam format JSON murni.
  Gunakan skema: { "title": string, "topic": string, "grade": string, "difficulty": "Mudah" | "Sedang" | "Sulit", "questions": Array<{ "id": string, "type": string, "question": string, "options"?: string[], "correctAnswer": string, "explanation": string }> }`;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      temperature: 0.7,
      responseMimeType: "application/json"
    }
  });
  return response.text;
};

