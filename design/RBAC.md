# RBAC Matrix - TeamOrbit

## Legend

- Y: bisa
- N: tidak bisa

| Aksi | Admin | Member |
| --- | --- | --- |
| Register | Y (public) | Y (public) |
| Login | Y (public) | Y (public) |
| Logout | Y | Y |
| Lihat semua tugas | Y | N |
| Lihat tugas yang ia buat | Y | Y |
| Lihat tugas yang ditugaskan kepadanya | Y | Y |
| Buat tugas baru | Y | Y |
| Edit tugas | Y (semua) | Y (hanya yang ia buat) |
| Hapus tugas | Y (semua) | Y (hanya yang ia buat) |
| Ubah status tugas | Y | Y (milik atau ditugaskan) |
| Tambah assignee pada tugas | Y (semua) | Y (hanya yang ia buat) |
| Hapus assignee pada tugas | Y (semua) | Y (hanya yang ia buat) |
| Lihat daftar user untuk dropdown assignee (id & nama saja) | Y | Y |
| Lihat daftar tag & buat tag baru | Y | Y |
| Pasang/lepas tag pada tugas | Y (semua) | Y (hanya yang ia buat) |
| List semua user | Y | N |
| Ubah role user | Y (kecuali dirinya sendiri) | N |

## Keterangan Akses Tugas

Rule visibilitas tugas di backend:

```
WHERE tasks.created_by = current_user.id
   OR tasks.id IN (SELECT task_id FROM task_user WHERE user_id = current_user.id)
```

- Admin bypass rule di atas dan bisa akses semua tugas.
- Member hanya mendapat tugas yang ia buat atau yang ditugaskan kepadanya.
- Assignee boleh melihat tugas dan mengubah statusnya saja (`PUT /tasks/{id}` dengan body hanya `status`). Edit field lain, hapus tugas, dan kelola assignee/tag ditolak `403`; hanya pembuat atau Admin yang boleh.
- Pembuat tugas TIDAK otomatis menjadi assignee. Assignee ditambahkan eksplisit lewat endpoint assignees (boleh termasuk dirinya sendiri). Pembuat tetap bisa mengakses tugasnya melalui `created_by`.
