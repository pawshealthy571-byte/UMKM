# LKUMKM

Aplikasi pencatatan keuangan UMKM dengan Vue, Express, MySQL, dan Docker.

## Menjalankan aplikasi

Pastikan Docker Desktop aktif, kemudian jalankan dari folder proyek:

```sh
docker compose up --build -d
```

- Website: http://localhost:5173
- Backend: http://localhost:3000/api/health
- MySQL: `localhost:3306`

Compose menggunakan `.env` lokal untuk kredensial MySQL dan akun demo. Jangan unggah `.env` ke repositori.

## Akun demo

- Email: `demo@lkumkm.test`
- Kata sandi: `DemoLKUMKM2026!`

Akun demo dibuat otomatis saat backend pertama kali dimulai jika alamat email tersebut belum terdaftar. Seluruh transaksi demo diberi label **SIMULASI** dan bukan catatan usaha nyata. Gunakan tombol **Masuk dengan akun demo** di halaman login.

## Halaman aplikasi

- Dashboard ringkasan saldo, pemasukan/pengeluaran, grafik, prediksi, dan peringatan.
- Transaksi dengan pencarian, filter periode/kategori/jenis, pengurutan, dan pagination.
- Prediksi arus kas 7, 14, atau 30 hari dengan penjelasan metode dan data historis.
- Peringatan saldo minimum berdasarkan proyeksi backend.
- Laporan dengan grafik arus kas, rincian biaya per kategori, perbandingan prediksi/realisasi, dan ekspor CSV.
- Pengaturan profil, saldo awal, batas minimum kas, dan preferensi indikator peringatan.

Data akun dan transaksi disimpan di MySQL. Setiap API transaksi dibatasi ke akun pemilik yang sedang masuk.
