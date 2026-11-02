# PROJECT SPECIFICATION
# Sistem Informasi Keuangan UMKM

## 1. Tujuan Proyek

Membangun aplikasi web untuk membantu UMKM mengelola transaksi keuangan, melihat laporan, memprediksi arus kas, dan mendeteksi potensi risiko kekurangan kas melalui Early Warning System.

## 2. Teknologi

- Frontend: Vue.js
- Backend: Node.js dan Express.js
- Database: MySQL
- Visualisasi grafik: Chart.js
- Deployment: Docker

Gunakan struktur kode modular dan pisahkan frontend, backend, dan database.

## 3. Jenis Pengguna

Pengguna utama adalah pemilik UMKM yang telah memiliki akun dan mengelola data keuangannya sendiri.

Setiap pengguna hanya boleh mengakses data usaha yang menjadi haknya.

## 4. Fitur Utama

### A. Authentication
- Registrasi
- Login dan logout
- Pengelolaan sesi atau token autentikasi
- Proteksi halaman dan API

### B. Dashboard
- Saldo kas saat ini
- Total pemasukan
- Total pengeluaran
- Ringkasan laba atau rugi sederhana
- Grafik arus kas
- Ringkasan prediksi saldo
- Ringkasan peringatan keuangan

### C. Transaksi Keuangan
- Tambah transaksi
- Lihat daftar transaksi
- Edit transaksi
- Hapus transaksi
- Kategori pemasukan dan pengeluaran
- Filter berdasarkan tanggal dan kategori
- Validasi nominal, tanggal, dan jenis transaksi

### D. Prediksi Arus Kas
- Menggunakan data historis pemasukan dan pengeluaran
- Menampilkan proyeksi arus kas untuk 7, 14, atau 30 hari
- Menampilkan grafik aktual dan prediksi
- Menjelaskan metode dan keterbatasan prediksi
- Menguji akurasi prediksi menggunakan data historis jika memungkinkan

Mulai dengan metode statistik sederhana yang dapat dijelaskan dan diuji. Jangan mengklaim prediksi sebagai nilai pasti.

### E. Early Warning System
- Pengguna dapat menetapkan batas minimum saldo kas.
- Sistem memeriksa proyeksi saldo terhadap batas tersebut.
- Sistem memberikan peringatan apabila proyeksi saldo berada di bawah batas aman.
- Setiap peringatan memiliki alasan, tanggal perkiraan, dan tingkat urgensi.
- Hindari notifikasi duplikat untuk risiko yang sama.
- Peringatan harus berasal dari perhitungan yang dapat dijelaskan.

### F. Laporan Keuangan
- Laporan pemasukan dan pengeluaran
- Filter periode
- Ringkasan saldo
- Perbandingan prediksi dengan realisasi
- Ekspor laporan jika diperlukan

### G. Pengaturan
- Profil pengguna dan usaha
- Saldo awal
- Batas minimum kas
- Kategori transaksi

## 5. Alur Sistem

1. Pengguna melakukan registrasi atau login.
2. Pengguna melihat dashboard.
3. Pengguna memasukkan transaksi keuangan.
4. Backend memvalidasi dan menyimpan transaksi.
5. Sistem menghitung saldo dan ringkasan keuangan.
6. Sistem memprediksi arus kas berdasarkan data yang tersedia.
7. Early Warning System memeriksa potensi risiko.
8. Dashboard menampilkan prediksi dan peringatan.
9. Pengguna membuka laporan dan mengambil keputusan berdasarkan informasi tersebut.

## 6. Prinsip Implementasi

- Jangan membuat seluruh aplikasi dalam satu file besar.
- Gunakan validasi pada frontend dan backend.
- Gunakan database relasional dengan foreign key yang sesuai.
- Lindungi password dengan hashing yang aman.
- Pastikan pengguna tidak dapat membaca atau mengubah data milik pengguna lain.
- Jangan menyimpan password atau secret di dalam source code.
- Gunakan transaksi database bila diperlukan untuk menjaga konsistensi data.
- Jangan mengarang data keuangan sebagai data nyata.
- Data demo harus diberi label sebagai data simulasi.
- Sertakan pengujian untuk perhitungan saldo, prediksi, dan peringatan.

## 7. Urutan Pengerjaan

Tahap 1: Analisis kebutuhan dan rancangan arsitektur.

Tahap 2: Rancangan database dan autentikasi.

Tahap 3: CRUD transaksi dan dashboard.

Tahap 4: Laporan keuangan.

Tahap 5: Prediksi arus kas.

Tahap 6: Early Warning System.

Tahap 7: Pengujian, keamanan, dan deployment.

## 8. Instruksi untuk Codex

Baca dokumen ini secara menyeluruh sebelum melakukan perubahan kode.

Periksa struktur proyek yang sudah ada dan pertahankan implementasi yang masih sesuai.

Jangan langsung membuat semua fitur sekaligus. Mulailah dengan menganalisis kebutuhan, struktur folder, arsitektur, dan rencana pengerjaan. Jelaskan asumsi serta keputusan teknis sebelum implementasi besar.

Implementasikan fitur secara bertahap dan uji setiap tahap sebelum melanjutkan ke tahap berikutnya.