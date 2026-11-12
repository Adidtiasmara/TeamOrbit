# TeamOrbit

Aplikasi internal untuk mencatat dan membagi pekerjaan tim.

## Stack

- Backend: Laravel 12 + PHP 8.3 + MySQL
- Frontend: Next.js 15 + TypeScript + Tailwind CSS
- Auth: Laravel Sanctum
- Container: Docker + docker-compose

## Cara Menjalankan (Docker)

1. Copy environment:

   ```bash
   cp .env.example .env
   ```

2. Pastikan APP_KEY sudah diisi di `.env`.
3. Jalankan container:

   ```bash
   docker-compose up --build -d
   ```

4. Jalankan migrasi dan seeder:

   ```bash
   docker exec teamorbit_backend php artisan migrate --seed
   ```

5. Buka:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api

## Cara Menjalankan (Lokal Manual)

### Backend

```bash
cd backend
cp .env.example .env
php artisan key:generate
# Sesuaikan DB_* di .env, lalu:
php artisan migrate --seed
php artisan serve --host=0.0.0.0 --port=8000
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Akun Demo

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@teamorbit.test | password |
| Member | budi@teamorbit.test | password |

## Struktur Branch

- `main`: kode stabil/release
- `develop`: integrasi fitur
- `feature/*`: satu fitur per branch

## Fase Pengembangan

1. FASE 0 - Design: ERD, API Spec, RBAC, Wireframe
2. FASE 1 - Setup: repo, docker, migrasi, seeder
3. FASE 2 - Backend Auth
4. FASE 3 - Backend Tugas + Assignee
5. FASE 4 - Frontend Auth + Dashboard
6. FASE 5 - Frontend Role
7. FASE 6 - Fitur Tambahan (Admin Users, Tags)
8. FASE 7 - Testing + Docker
9. FASE 8 - README lengkap + Finish
