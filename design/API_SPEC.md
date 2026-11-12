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

Error (422 / 401 / 403 / 404):

```json
{
  "message": "Deskpsi error"
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

Response 200:

```json
{
  "data": "Logged out"
}
```

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

- `status` (optional): filter status tugas.

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
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

Akses:

- Admin: semua tugas.
- Member: hanya tugas yang ia buat atau ditugaskan.

### Create Task

```
POST /tasks
```

Body:

```json
{
  "title": "string, required, max 100 karakter",
  "description": "string, nullable",
  "status": "belum_selesai|selesai, default belum_selesai"
}
```

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

Body: sama dengan create.

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

Response 204 atau `{ "data": "Deleted" }`.

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

Response 200.

### Remove Assignee

```
DELETE /tasks/{id}/assignees/{userId}
```

Response 204.

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

Response 200.

Akses: Admin saja.
