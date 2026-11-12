# Struktur Folder - TeamOrbit

```
teamorbit/
├── README.md
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── app/
│   │   ├── Console/
│   │   ├── Exceptions/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── Api/
│   │   │   │   │   ├── AuthController.php
│   │   │   │   │   ├── TaskController.php
│   │   │   │   │   ├── AssigneeController.php
│   │   │   │   │   └── UserController.php
│   │   │   └── Middleware/
│   │   │       └── RoleMiddleware.php
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── Task.php
│   │   │   ├── Tag.php
│   │   │   └── ...
│   │   ├── Policies/
│   │   │   └── TaskPolicy.php
│   │   ├── Providers/
│   │   ├── bootstrap/
│   │   ├── config/
│   │   ├── database/
│   │   │   ├── factories/
│   │   │   ├── migrations/
│   │   │   └── seeders/
│   │   ├── routes/
│   │   │   └── api.php
│   │   ├── tests/
│   │   │   ├── Feature/
│   │   │   │   ├── AuthTest.php
│   │   │   │   ├── TaskTest.php
│   │   │   │   └── AssigneeTest.php
│   │   │   └── Unit/
│   │   ├── artisan
│   │   ├── composer.json
│   │   ├── phpunit.xml
│   │   └── ...
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── tasks/
│   │   │   │   └── page.tsx
│   │   │   ├── tasks/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   └── users/
│   │   │       └── page.tsx
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── forms/
│   │   │   └── layouts/
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   └── types.ts
│   │   ├── hooks/
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── public/
│   ├── tests/
│   │   └── auth.test.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── vitest.config.ts
│   └── next.config.js
└── design/
    ├── mockup.html
    ├── style.css
    ├── script.js
    ├── ERD.md
    ├── API_SPEC.md
    ├── RBAC.md
    ├── WIREFRAMES.md
    └── STRUCTURE.md
```

## Penjelasan

- `backend/`: Laravel 12 monolitik yang menyediakan REST API.
- `frontend/`: Next.js 15 App Router, TypeScript, Tailwind CSS.
- `design/`: dokumentasi desain dan mockup interaktif.
- `docker-compose.yml`: orkestrasi container backend, frontend, dan MySQL.
