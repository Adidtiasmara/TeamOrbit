# API Specification - TeamOrbit

## Base URL

```
http://localhost:8000/api
```

## Authentication

Semua endpoint selain register dan login memerlukan header:

```
Authorization: Bearer {token}
```

Token didapat dari response login.

## Format Response

Sukses (200 / 201):

```json
{
  "data": { ... }
}
```

204 (logout, delete task, remove assignee) dikembalikan tanpa body.

Error:

- `401` — belum login, token tidak valid, atau token sudah di-revoke. Body: `{"message": "Belum login atau token tidak valid."}`
- `403` — login tapi tidak berhak (mis. Member mengakses tugas orang lain, non-admin akses `/users`). Body: `{"message": "Akses ditolak."}`
- `404` — resource tidak ditemukan. Body: `{"message": "Data tidak ditemukan."}`
- `422` — validasi gagal, disertai `errors` per-field untuk ditampilkan di form:

```json
{
  "message": "Validasi gagal.",
  "errors": {
    "title": ["Judul wajib diisi, maksimal 100 karakter."]
  }
}
```

## Auth

### Register

```
POST /register
```

Body:

```json
{
  "name": "string, required",
  "email": "string, required, unique",
  "password": "string, required, min 8 karakter",
  "password_confirmation": "string, required, sama dengan password"
}
```

Response 201:

```json
{
  "data": {
    "user": { "id": 1, "name": "...", "email": "...", "role": "member" },
    "token": "..."
  }
}
```

### Login

```
POST /login
```

Body:

```json
{
  "email": "string, required",
  "password": "string, required"
}
```

Response 200:

```json
{
  "data": {
    "user": { "id": 1, "name": "...", "email": "...", "role": "member" },
    "token": "..."
  }
}
```

### Logout

```
POST /logout
```

Header: `Authorization: Bearer {token}`

Response 204 tanpa body. Token yang dipakai request ini dicabut.

### Get Current User

```
GET /me
```

Response 200:

```json
{
  "data": { "id": 1, "name": "...", "email": "...", "role": "member" }
}
```

## Tasks

### List Tasks

```
GET /tasks?status=belum_selesai|selesai
```

Query parameter:

- `status` (optional): filter status tugas. Kosong atau tidak dikirim = semua tugas yang berhak dilihat. Nilai selain `belum_selesai`/`selesai` ditolak `422`.

Urutan: tugas terbaru lebih dulu. Tanpa paginasi.

Response 200:

```json
{
  "data": [
    {
      "id": 1,
      "title": "...",
      "description": "...",
      "status": "belum_selesai",
      "created_by": { "id": 1, "name": "..." },
      "assignees": [ { "id": 2, "name": "..." } ],
      "tags": [ { "id": 1, "name": "urgent", "color": "merah" } ],
      "start_date": "2026-11-20",
      "due_date": "2026-11-25",
      "is_overdue": false,
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

`start_date` dan `due_date` berformat `YYYY-MM-DD` atau `null`. `is_overdue` bernilai `true` jika tugas belum selesai dan `due_date` sudah lewat menurut zona waktu tim (`TASK_TIMEZONE`, default `Asia/Jakarta`). Tugas yang deadline-nya hari ini belum dihitung terlambat.

Akses:

- Admin: semua tugas.
- Member: hanya tugas yang ia buat atau ditugaskan.

### Task Summary

```
GET /tasks/summary
```

Statistik tugas yang berhak dilihat user (aturan akses sama dengan List Tasks). Tidak menerima filter.

Response 200:

```json
{
  "data": {
    "total": 7,
    "done": 1,
    "pending": 6,
    "overdue": 1,
    "percent_done": 14
  }
}
```

`percent_done` dibulatkan ke bilangan bulat; `0` jika belum ada tugas.

### Create Task

```
POST /tasks
```

Body:

```json
{
  "title": "string, required, max 100 karakter",
  "description": "string, nullable",
  "status": "belum_selesai|selesai, default belum_selesai",
  "start_date": "YYYY-MM-DD, nullable",
  "due_date": "YYYY-MM-DD, nullable, tidak boleh sebelum start_date"
}
```

Jika `due_date` sebelum `start_date`, respons `422` dengan `errors.due_date` berisi `"Deadline tidak boleh sebelum tanggal mulai."`. Format tanggal yang salah ditolak `422`.

Spasi di awal/akhir `title` dipangkas sebelum validasi, jadi batas 100 karakter berlaku setelah trim. Pembuat tugas tidak otomatis menjadi assignee (`assignees` kosong).

Response 201:

```json
{
  "data": { "id": 1, "title": "...", ... }
}
```

### Show Task

```
GET /tasks/{id}
```

Response 200:

```json
{
  "data": { "id": 1, "title": "...", ... }
}
```

### Update Task

```
PUT /tasks/{id}
```

Akses: Admin dan pembuat tugas boleh mengubah semua field. Assignee hanya boleh mengirim `status`; body berisi field lain dari assignee ditolak `403`. Hapus tugas, kelola assignee, dan pasang/lepas tag juga hanya untuk Admin dan pembuat.

Body: field sama dengan create, tetapi semuanya opsional (update parsial). Hanya field yang dikirim yang divalidasi dan diubah; `title` yang dikirim tetap wajib terisi dan maksimal 100 karakter. Urutan tanggal dicek terhadap nilai yang tersimpan bila hanya salah satu tanggal dikirim; kirim `null` untuk mengosongkan tanggal. Contoh toggle status:

```json
{
  "status": "selesai"
}
```

Response 200:

```json
{
  "data": { "id": 1, "title": "...", ... }
}
```

### Delete Task

```
DELETE /tasks/{id}
```

Response 204 tanpa body.

## Assignees

### Add Assignee

```
POST /tasks/{id}/assignees
```

Body:

```json
{
  "user_id": 2
}
```

Response 201 dengan data tugas terbaru (termasuk `assignees`).

Error `422` jika `user_id` tidak valid atau user sudah menjadi assignee (duplikat); `403` jika tidak berhak mengelola tugas tersebut.

### Remove Assignee

```
DELETE /tasks/{id}/assignees/{userId}
```

Response 204.

Error `404` jika tugas atau user tidak ada, atau user bukan assignee tugas tersebut (`{"message": "User bukan assignee tugas ini."}`); `403` jika tidak berhak mengelola tugas tersebut.

### Assignable Users

```
GET /assignable-users
```

Daftar user untuk dropdown tambah assignee, urut nama. Bisa diakses semua user yang login (Admin dan Member). Hanya berisi `id` dan `name`.

Response 200:

```json
{
  "data": [
    { "id": 2, "name": "..." }
  ]
}
```

## Tags

Label bebas untuk mengelompokkan tugas. Semua user yang login boleh melihat dan membuat tag sesuai kebutuhan.

Setiap tag punya `color` dari palet tetap berikut (default `abu`):

| Nilai | Label di UI |
| --- | --- |
| `abu` | Abu-abu (default) |
| `merah` | Merah |
| `oranye` | Oranye |
| `kuning` | Kuning |
| `hijau` | Hijau |
| `biru` | Biru |
| `ungu` | Ungu |
| `merah_muda` | Merah muda |

`color` juga ada di setiap tag pada field `tags` objek tugas.

### List Tags

```
GET /tags
```

Response 200 (urut nama):

```json
{
  "data": [
    { "id": 1, "name": "urgent", "color": "merah" }
  ]
}
```

### Create Tag

```
POST /tags
```

Body:

```json
{
  "name": "string, required, max 50 karakter, unik",
  "color": "salah satu nilai palet, optional, default abu"
}
```

Spasi di awal/akhir dipangkas. Nama unik tanpa membedakan huruf besar/kecil (`Urgent` = `urgent`).

Response 201:

```json
{
  "data": { "id": 1, "name": "urgent", "color": "merah" }
}
```

Error `422` jika nama kosong, lebih dari 50 karakter, atau sudah dipakai (`"Tag dengan nama ini sudah ada."`), atau jika `color` bukan nilai palet (`errors.color`: `"Warna tag tidak valid."`).

### Attach Tag ke Tugas

```
POST /tasks/{id}/tags/{tagId}
```

Tanpa body. Response 201 dengan data tugas terbaru (termasuk `tags`, urut nama).

Error `422` jika tag sudah terpasang (`errors.tag_id`); `403` jika tidak berhak mengelola tugas tersebut (aturan sama dengan edit tugas); `404` jika tugas atau tag tidak ada.

### Detach Tag dari Tugas

```
DELETE /tasks/{id}/tags/{tagId}
```

Response 204.

Error `404` jika tugas/tag tidak ada atau tag tidak terpasang di tugas tersebut (`"Tag tidak terpasang di tugas ini."`); `403` jika tidak berhak.

Menghapus tugas ikut melepas semua tag-nya; tag itu sendiri tetap ada.

## Users (Admin Only)

### List Users

```
GET /users
```

Response 200:

```json
{
  "data": [
    { "id": 1, "name": "...", "email": "...", "role": "admin" }
  ]
}
```

### Update Role

```
PUT /users/{id}/role
```

Body:

```json
{
  "role": "admin|member"
}
```

Response 200 dengan data user terbaru.

Error `422` jika mencoba mengubah role diri sendiri (Admin tidak boleh mengubah role-nya sendiri), dengan `errors.role: ["Kamu tidak bisa mengubah role akunmu sendiri."]`, atau jika `role` bukan `admin`/`member`; `404` jika user tidak ada.

Akses: Admin saja. Non-admin selalu `403`, termasuk untuk `id` user yang tidak ada (role dicek sebelum data dicari).

Daftar user (`GET /users`) diurutkan berdasarkan nama. Perubahan role langsung berlaku untuk token user tersebut yang sudah ada.
