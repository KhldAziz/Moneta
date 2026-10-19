# Moneta: Catat Keuangan Cukup dengan Foto Nota atau Chat AI

> Tagline: *"Foto sekali, keuangan terkendali."*  
> Dibangun berdasarkan **PRD Moneta Versi 3.0** (Kelompok 6, Kewirausahaan Berbasis Teknologi, Informatika UMM).

---

## 📱 Ringkasan Aplikasi

Moneta adalah aplikasi web pencatat keuangan *mobile-first* (PWA) khusus untuk mahasiswa di Indonesia. Cukup foto nota belanja atau ketik kalimat santai seperti:
- *"makan ayam bakar 20rb"*
- *"kopi susu 18k tadi pagi"*
- *"bakso 15rb dan es teh 5rb"* (transaksi ganda)
- *"bayar kos 750 ribu"*
- *"dapat uang saku 1,5jt"*

AI secara otomatis mengekstrak nominal, tanggal, merchant, dan kategori yang sesuai.

---

## 🛠️ Stack Teknologi

- **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts (Donut & Grafik Tren 30 Hari), Lucide Icons.
- **Backend**: Express + Vite (full-stack pada satu server port 3000), endpoint `/api/ai/parse`.
- **Database & Auth**: Firebase Authentication (Sign in with Google) + Cloud Firestore (`users/{uid}/...`), dilengkapi penyimpanan lokal reaktif & offline-ready.
- **AI Engine**: Gemini Flash (`GEMINI_MODEL = "gemini-2.5-flash"`), structured output JSON, rate limit 30 req/min, post-validation rules.
- **Desain**: *Plus Jakarta Sans*, mode terang (light-only), token warna resmi (`#0F766E`, `#14B8A6`, `#F8FAFC`, `#0F172A`, `#15803D`, `#B45309`, `#B91C1C`), layout responsif 360px tanpa scroll horizontal.

---

## 🚀 Cara Menjalankan

1. **Jalankan Aplikasi Development Server**:
   ```bash
   npm run dev
   ```
   Aplikasi dapat langsung diakses di browser: [http://localhost:3000](http://localhost:3000)

2. **Menjalankan Pengujian Otomatis (100% Lulus)**:
   ```bash
   npm test
   ```
   Menguji 19 unit test formula finansial murni (Wallet Health Score, periode siklus, auto-budget) dan 10 kasus uji kalimat teks PRD Bagian 9 & 10.

3. **Build Bundle Produksi**:
   ```bash
   npm run build
   ```

---

## 📋 Fitur yang Tersedia (F1 – F15)

1. **F1 Login Google**: Masuk dengan Google & Demo Mode Mahasiswa; sesi bertahan setelah refresh; tombol Keluar.
2. **F2 Onboarding**: Input uang saku bulanan & tanggal reset siklus (1–28, default 1).
3. **F3 Tambah lewat Chat AI**: Input kalimat santai, pengenalan suara (Web Speech API `id-ID`), dukungan multi-transaksi.
4. **F4 Tambah lewat Foto**: Kompresi otomatis di browser (max sisi 1568px, JPEG 0.8); deteksi nota & pesan ramah jika bukan struk.
5. **F5 Tambah Manual**: Input nominal besar dengan pemisah ribuan otomatis, chip kategori, tanggal, merchant, catatan.
6. **F6 Kartu Konfirmasi**: Detail transaksi, indikator garis amber untuk keyakinan 0.5–0.85, tombol suka/tidak suka AI, tombol Simpan dan Batal.
7. **F7 Auto-Kategori**: Belajar otomatis jika pengguna mengubah kategori suatu merchant (`categoryRules`).
8. **F8 Riwayat Transaksi**: Pengelompokan per tanggal, total harian, pencarian instan, filter bulan/kategori/sumber, edit modal, dan soft-delete dengan **Undo 5 detik**.
9. **F9 Budget & Peringatan**: Cincin total budget, progress bar per kategori (teal <80%, amber 80–99%, merah >=100%), banner & toast notifikasi 1x per periode.
10. **F10 Saran Budget Otomatis**: Tombol *"Isi otomatis dari uang saku"* memakai alokasi ideal mahasiswa (makan 30%, kos 25%, kopi 10%, dsb).
11. **F11 Rekap Mingguan**: Total pengeluaran 7 hari, 3 kategori teratas, perbandingan % dengan 7 hari sebelumnya, sisa budget.
12. **F12 Wallet Health Score**: Skor 0–100 (Rawan, Waspada, Sehat) dengan 1 kalimat rekomendasi ramah teman kos.
13. **F13 Beranda Lengkap**: Sisa uang paling besar, strip peringatan, rekap, skor, donut per kategori, grafik tren 30 hari, 5 transaksi terbaru.
14. **F14 Pengaturan**: Ubah uang saku & tanggal reset, ekspor CSV, hapus semua data dengan konfirmasi ketik `HAPUS`.
15. **F15 PWA & Responsif**: Manifest & ikon PWA, mobile-first 360px tanpa scroll horizontal.

---

## 🔒 Keamanan & Aturan Firestore

- Aturan Firestore disimpan di `firestore.rules` yang mengisolasi data per `users/{uid}` serta memvalidasi tipe `expense`/`income`, nominal 1 – 50.000.000, dan kategori valid.
- `GEMINI_API_KEY` disimpan dan dipanggil hanya di backend (`server/index.ts`), tidak pernah bocor ke frontend.
