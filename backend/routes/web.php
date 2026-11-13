<?php

use Illuminate\Support\Facades\Route;

// Backend hanya menyediakan REST API; UI ada di frontend Next.js.
Route::get('/', fn () => response()->json([
    'message' => 'TeamOrbit API',
    'api' => '/api',
]));
