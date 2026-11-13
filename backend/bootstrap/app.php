<?php

use App\Http\Middleware\RoleMiddleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => RoleMiddleware::class,
        ]);

        // Cek role sebelum route model binding, supaya non-admin selalu
        // mendapat 403 (bukan 404 yang membocorkan ada/tidaknya data).
        $middleware->prependToPriorityList(
            before: SubstituteBindings::class,
            prepend: RoleMiddleware::class,
        );

        // API tidak punya halaman login: tamu di /api/* jangan di-redirect
        // ke route('login') (tidak ada, berujung 500), cukup dijawab 401.
        $middleware->redirectGuestsTo(
            fn (Request $request) => $request->is('api/*') ? null : route('login')
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Error di /api/* selalu dijawab JSON {message, errors?} berbahasa
        // Indonesia sesuai design/API_SPEC.md, walau tanpa header Accept.
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson()
        );

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Belum login atau token tidak valid.'], 401);
            }
        });

        // Termasuk penolakan dari TaskPolicy (AuthorizationException).
        $exceptions->render(function (AccessDeniedHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Akses ditolak.'], 403);
            }
        });

        // Termasuk route model binding yang tidak menemukan data,
        // supaya nama class model tidak bocor di pesan error.
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Data tidak ditemukan.'], 404);
            }
        });

        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Validasi gagal.',
                    'errors' => $e->errors(),
                ], $e->status);
            }
        });
    })->create();
