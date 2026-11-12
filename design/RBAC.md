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
| Edit tugas (owner/admin) | Y (semua) | Y (hanya tugas sendiri) |
| Hapus tugas (owner/admin) | Y (semua) | Y (hanya tugas sendiri) |
| Ubah status tugas | Y | Y (hanya tugas yang ia akses) |
| Tambah assignee pada tugas | Y (semua) | Y (hanya tugas sendiri) |
| Hapus assignee pada tugas | Y (semua) | Y (hanya tugas sendiri) |
| List semua user | Y | N |
| Ubah role user | Y | N (tidak bisa ubah role sendiri) |

## Keterangan Akses Tugas

Rule visibilitas tugas di backend:

```
WHERE tasks.created_by = current_user.id
   OR tasks.id IN (SELECT task_id FROM task_user WHERE user_id = current_user.id)
```

- Admin bypass rule di atas dan bisa akses semua tugas.
- Member hanya mendapat tugas yang ia buat atau yang ditugaskan kepadanya.
- Setiap tugas baru otomatis membuat pembuat sebagai salah satu assignee agar visibilitas tetap konsisten.
