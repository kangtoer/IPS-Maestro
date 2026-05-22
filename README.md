# IPS Maestro 🎓🌋

**IPS Maestro** adalah asisten kecerdasan buatan (AI) paling canggih, interaktif, dan komprehensif yang dirancang khusus untuk para pendidik Ilmu Pengetahuan Sosial (IPS) tingkat SMP di seluruh Indonesia. Aplikasi cerdas ini membantu merancang pembelajaran berbasis Kurikulum Merdeka secara lengkap, cepat, dan berstandar tinggi.

Aplikasi ini menggabungkan kecanggihan **Model AI Gemini** dengan antarmuka yang sangat responsif, modern, dan ramah pengguna, memungkinkan para guru menghasilkan RPP, Silabus, LKPD, Bank Soal HOTS, hingga merekap Jurnal Pembelajaran dengan sangat praktis secara digital.

---

## ✨ Fitur Utama

### 1. 📝 Pembuatan LKPD (Lembar Kerja Peserta Didik)
*   Menghasilkan LKPD siap pakai berdasarkan topik IPS.
*   Mendukung format visual yang rapi dan kontekstual dengan sosial budaya Indonesia.
*   Terintegrasi dengan opsi penyimpanan ke Google Drive atau unduh dalam format **PDF / DOCX**.

### 2. 📅 Maestro Silabus & RPP (Rencana Pelaksanaan Pembelajaran)
*   Sistem generate instan Silabus Kurikulum Merdeka dan RPP yang interaktif.
*   Penyesuaian tingkat kognitif dan metode pengajaran dinamis (Problem-Based Learning, Discovery Learning, dll).
*   Sertakan video materi esensial secara otomatis untuk pengayaan materi.

### 3. 🎯 Bank Soal HOTS & Kisi-Kisi
*   Membuat instrumen evaluasi berstandar tinggi (Higher Order Thinking Skills).
*   Mendukung 5 jenis tipe soal: **Pilihan Ganda, Pilihan Ganda Kompleks, Menjodohkan, Mengurutkan Langkah, dan Benar-Salah**.
*   Menghasilkan analisis butir soal secara mendalam dengan kunci jawaban dan pembahasan pedagogis yang lengkap.
*   Dapat diekspor ke **JSON, CSV, PDF, atau DOCX** serta disimpan langsung ke **Google Drive**.

### 4. 📒 Jurnal Aktivitas Guru
*   Sistem pencatatan jurnal mengajar harian berbasis kelas dan topik.
*   Validasi pintar nama & gelar guru yang lazim (contoh: *Catur Pamungkas, S.Pd., Gr.*).
*   Fitur **format bullet list otomatis** pada Isian *Inti Aktivitas* dan *Refleksi* ketika diekspor ke file Excel/CSV.

### 5. 📂 Integrasi Google Drive & Penyimpanan Offline
*   Koneksi aman ke Google Drive Anda untuk menyimpan karya Anda langsung ke cloud.
*   Akses materi pelajaran sejarah, geografi, ekonomi, dan sosiologi secara offline dengan cepat.

---

## 🛠️ Tech Stack

*   **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion (untuk animasi masuk hasil yang ultra-halus)
*   **Backend & API**: Node.js & Express (Full-Stack Proxy untuk menyembunyikan API key dari browser)
*   **AI Engine**: `@google/genai` TypeScript SDK (Gemini API)
*   **Dokumen & Export**: `jspdf` (PDF), `docx` (Word), `autoTable` (Tabel PDF)

---

## 🚀 Panduan Menginstal & Menjalankan Lokal

Ikuti langkah-langkah di bawah ini untuk menjalankan **IPS Maestro** di komputer lokal Anda:

### 1. Clone Project dari GitHub
Jika Anda telah mengekspor kode dari Google AI Studio, jalankan perintah berikut:
```bash
git clone https://github.com/USERNAME/nama-repo-anda.git
cd nama-repo-anda
```

### 2. Instalasi Dependensi
Gunakan Node.js versi 18 ke atas:
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Buat file baru bernama `.env` di direktori utama (root) berdasarkan `.env.example`:
```env
# Salin isi dari .env.example
GEMINI_API_KEY=Kunci_API_Gemini_Anda_Di_Sini
```
> **Penting**: *Jangan pernah membagikan atau mempublikasikan file `.env` yang berisi kunci rahasia Kunci API ke repositori publik GitHub Anda.*

### 4. Jalankan Server Pengembangan (Dev Mode)
Untuk menjalankan aplikasi secara lokal dengan reload otomatis:
```bash
npm run dev
```
Aplikasi akan secara otomatis berjalan di browser Anda pada alamat: [http://localhost:3000](http://localhost:3000)

### 5. Build untuk Produksi
Gunakan perintah berikut untuk membangun berkas yang siap dideploy ke server produksi:
```bash
npm run build
```
Untuk menjalankannya setelah di-build:
```bash
npm run start
```

---

## 📤 Cara Mengekspor/Meluncurkan ke GitHub dari Google AI Studio

Untuk meluncurkan aplikasi ini ke koleksi proyek GitHub Anda secara langsung, sangat praktis melalui platform Google AI Studio:

1.  **Dapatkan Kode**: Pergi ke **Settings (Setelan) / Menu Utama** di pojok kanan atau kiri atas di antarmuka Google AI Studio Build.
2.  **Klik tombol Export atau Hubungkan ke GitHub**: 
    *   Pilih opsi **"Export to GitHub"**.
    *   Anda akan diminta untuk memberikan izin otorisasi akun GitHub Anda ke platform Google AI Studio.
    *   Buat repositori baru atau pilih salah satu repositori yang sudah ada, lalu klik **Export** atau **Push**.
3.  **Deploy dengan Mudah**: 
    *   Anda juga bisa menggunakan web-hosting modern gratis seperti **Vercel**, **Netlify**, atau **Cloud Run** dengan menghubungkan repositori GitHub baru Anda tersebut.
    *   **Penting**: Pada dashboard penyedia web-hosting tersebut, tambahkan *Environment Variable*: `GEMINI_API_KEY` di bagian settings konfigurasi hosting Anda.

---

## 👩‍🏫 Kontribusi & Lisensi

Aplikasi ini dikembangkan untuk memajukan kualitas pendidikan di Indonesia. Masukan, saran, dan kontribusi dari sesama pendidik, akademisi, atau developer sangat kami harapkan.
Salam Takdzim.
Catur Pamungkas, S.Pd.,Gr.
Follow Channel WA : 
https://whatsapp.com/channel/0029Vb6R2Ny2v1J1dll5Mq27
Find me s.id/toer
*Salam Guru Maestro, Belajar Tanpa Batas!* 🇮🇩
