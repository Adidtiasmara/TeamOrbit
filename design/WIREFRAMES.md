# Wireframes - TeamOrbit

> **CATATAN SCOPE:** Elemen berikut tampil di `mockup.html` hanya sebagai dekorasi visual dan BUKAN fitur TeamOrbit (tidak ada di skema database): Proyek, Tenggat/deadline, filter chip kategori (Marketing/Engineering/Design/Admin), dan stat "Jatuh tempo". Implementasi Fase 4/5 hanya mengikuti skema DB: title, description, status (belum_selesai/selesai), assignees. Daftar halaman di bawah ini adalah acuan UI yang berlaku.

Wireframe interaktif sudah dibuat sebagai HTML mockup di file berikut:

- `mockup.html`
- `style.css`
- `script.js`

Buka `mockup.html` di browser untuk melihat UI secara interaktif.

## Halaman yang ada di mockup

### 1. Login

- Logo TeamOrbit
- Input email dan password
- Tombol masuk
- Link ke register
- Demo credentials

### 2. Register

- Input nama, email, password, konfirmasi password
- Validasi password minimal 8 karakter
- Tombol daftar

### 3. Dashboard Tugas

- Topbar: judul halaman, tombol + Tugas baru, avatar user, menu Admin Users (hanya Admin), tombol Keluar
- Filter status: Semua, Belum Selesai, Selesai (mengirim `?status=`)
- Info role user yang login; Member hanya melihat tugas milik/ditugaskan
- List tugas: judul, status, assignees — klik menuju Detail Tugas

### 4. Detail Tugas

- Tombol kembali ke dashboard
- Judul tugas + status (bisa di-toggle selesai/belum selesai)
- Deskripsi, dibuat oleh
- Tombol Edit/Hapus hanya tampil jika user berhak (Admin: semua tugas; Member: milik/ditugaskan), selain itu backend menolak dengan 403
- Panel assignee: daftar assignee dengan tombol hapus per orang, form tambah assignee (dropdown daftar user)
- Pembuat tugas tidak otomatis masuk daftar assignee; ia menambahkan dirinya secara eksplisit bila mau

### 5. Admin Users

- Tabel user dengan kolom Nama, Email, Role, Aksi
- Dropdown ubah role (admin/member)
- Admin tidak bisa mengubah role dirinya sendiri

## Catatan Tambahan

- Mockup sudah responsive: sidebar otomatis menjadi off-canvas di mobile.
- Tersedia toggle role (Member/Admin) dan toggle tema gelap/terang di toolbar mockup.
