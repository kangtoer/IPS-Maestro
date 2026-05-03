import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

const getAI = () => {
  if (!genAI) {
    const key = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || "";
    genAI = new GoogleGenAI({ apiKey: key });
  }
  return genAI;
};

export const generateTeachingContent = async (type: string, topic: string, kurikulum: string = 'Merdeka') => {
  const ai = getAI();
  const model = "gemini-2.0-flash";
  const kurikulumText = kurikulum === 'Berbasis Cinta' 
    ? 'Kurikulum Berbasis Cinta (pendekatan humanistik, penuh kasih sayang, and berfokus pada kebahagiaan belajar siswa)' 
    : `Kurikulum ${kurikulum}`;

  const prompt = `Anda adalah asisten ahli untuk guru IPS SMP di Indonesia. 
  Buatlah ${type} untuk materi: ${topic}.
  Output harus dalam format Markdown yang rapi dan profesional.
  Sertakan bagian: 
  - Tujuan Pembelajaran
  - Materi Inti
  - Aktivitas Siswa
  - Soal Latihan (5 pilihan ganda + kunci jawaban)
  - Penutup
  - Daftar Pustaka (Wajib minimal 3 referensi relevan. Format: Penulis. (Tahun). Judul. Kota: Penerbit. Untuk sumber internet sertakan URL and tanggal akses. Gunakan bahasa Indonesia yang baik sesuai EYD & KBBI).
  
  Gunakan bahasa Indonesia yang sesuai dengan ${kurikulumText}.
  Atribusi: Dibuat oleh Catur Pamungkas, S.Pd.,Gr. (catatanguruips.blogspot.com)`;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt
  });
  return response.text;
};

export const generateSyllabusContent = async (topic: string, gradeInfo: string, kurikulum: string = 'Merdeka') => {
  const ai = getAI();
  const model = "gemini-2.0-flash";
  const kurikulumText = kurikulum === 'Berbasis Cinta'
    ? 'Kurikulum Berbasis Cinta (Pendekatan humanistik yang mengutamakan kasih sayang, empati, and kebahagiaan siswa dalam belajar IPS)'
    : `Kurikulum ${kurikulum}`;

  const prompt = `
    Anda adalah asisten ahli kurikulum IPS SMP di Indonesia. 
    Buatlah Silabus komplit untuk topik: "${topic}" untuk ${gradeInfo}.
    Kurikulum yang digunakan: ${kurikulumText}.
    
    Silabus harus mencakup:
    1. Identitas (Mata Pelajaran, Kelas, Semester, Kurikulum).
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
  kurikulum: string = 'Merdeka'
) => {
  const ai = getAI();
  const model = "gemini-2.0-flash";
  const kurikulumText = kurikulum === 'Berbasis Cinta'
    ? 'Kurikulum Berbasis Cinta (Pendekatan kasih sayang, humanistik, and student-centered yang mengutamakan kebahagiaan serta kedekatan emosional)'
    : `Kurikulum ${kurikulum}`;

  const prompt = `
    Anda adalah konsultan kurikulum senior di Indonesia. Buatlah "RENCANA PEMBELAJARAN MENDALAM" (RPM) yang sangat rapi and formal sesuai standar kedinasan (siap cetak/setor ke pengawas).
    
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
    - Fokus Dimensi Profil Pelajar Pancasila: ${dimensions.join(", ")}

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

    ## I. PENDAHULUAN & IDENTIFIKASI
    - **Profil Murid**: (Jelaskan secara mendalam tentang kesiapan, minat, and profil belajar siswa terkait topik ${topic}).
    - **Materi Inti**: (Rincian materi mendalam).
    - **Dimensi Profil Pelajar Pancasila (P3)**: (Uraikan bagaimana ${dimensions.join(", ")} diintegrasikan dalam pembelajaran ini).

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

export const generateQuizContent = async (topic: string, grade: string) => {
  const ai = getAI();
  const model = "gemini-2.0-flash";
  const prompt = `Anda adalah ahli pembuat soal IPS SMP. Buatlah kuis interaktif untuk topik: "${topic}" untuk Kelas ${grade}.
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

