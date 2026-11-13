# TeamOrbit

Aplikasi web internal untuk mencatat dan membagi pekerjaan tim. Admin dapat mengelola seluruh tugas dan role pengguna, sedangkan member bekerja pada tugas yang ia buat atau yang ditugaskan kepadanya.

**Teknologi:** Laravel 12 (PHP 8.3), MySQL 8.4, Next.js 15 (TypeScript, Tailwind CSS), Laravel Sanctum, Docker.

## Instalasi

Clone repositori:

```bash
git clone https://github.com/Adidtiasmara/TeamOrbit.git
cd TeamOrbit
```

Prasyarat:

- **Dengan Docker (disarankan):** Docker Desktop atau Docker Engine dengan Docker Compose v2.
- **Tanpa Docker:** PHP 8.3 (ekstensi `pdo_mysql` dan `mbstring`), Composer 2, MySQL 8, Node.js 24 dan npm.

## Menjalankan Aplikasi

### Dengan Docker

```bash
docker compose up --build
```

Migrasi database dan akun contoh disiapkan otomatis oleh container backend, jadi tidak ada langkah tambahan. Setelah semua container berjalan, buka:

- Aplikasi web: http://localhost:3000
- REST API: http://localhost:8000/api

Hentikan dengan `docker compose down`. Tambahkan `-v` untuk sekaligus menghapus data database.

Jika port `3000`, `8000`, atau `3307` sudah dipakai, salin `.env.example` di root repositori menjadi `.env`, ubah portnya, lalu jalankan ulang `docker compose up --build`.

### Tanpa Docker

**Backend** (terminal pertama):

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Ubah koneksi database di `backend/.env` sesuai MySQL Anda. Nilai `DB_HOST=db` hanya berlaku di Docker, jadi ganti menjadi `127.0.0.1`. 
Jika mengugnakan laragon/xampp default maka dbusername dan password setting seperti berikut:
DB_USERNAME=root
DB_PASSWORD=

Setelah itu jalankan:
```bash
php artisan migrate --seed
php artisan serve --port=8000
```

**Frontend** (terminal kedua):

```bash
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```

Buka http://localhost:3000. Pastikan `NEXT_PUBLIC_API_URL` di `frontend/.env.local` mengarah ke `http://localhost:8000/api`.

## Akun Contoh

Semua akun dibuat oleh seeder dan memakai password `password`.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@teamorbit.test` | `password` |
| Member | `budi@teamorbit.test` | `password` |
| Member | `ani@teamorbit.test` | `password` |
| Member | `citra@teamorbit.test` | `password` |

Tombol **Isi admin** dan **Isi member** di halaman login mengisi kredensial tersebut secara otomatis.

## Asumsi

1. Aplikasi dipakai oleh satu tim, tanpa konsep proyek atau workspace terpisah.
2. Role hanya `admin` dan `member`. Akun hasil registrasi selalu member. Admin pertama berasal dari seeder, dan admin lain dipromosikan lewat halaman **Kelola pengguna**.
3. Admin tidak dapat mengubah role dirinya sendiri, sehingga aplikasi selalu memiliki minimal satu admin.
4. Admin melihat semua tugas. Member hanya melihat tugas yang ia buat atau yang ditugaskan kepadanya.
5. Pembuat tugas tidak otomatis menjadi assignee. Assignee memiliki hak yang sama dengan pembuat untuk mengedit, mengubah status, menghapus, serta mengelola assignee dan tag tugas tersebut. 


Dokumentasi desain (ERD, spesifikasi API, matriks hak akses, wireframe) tersedia di folder [`design/`](design/).
