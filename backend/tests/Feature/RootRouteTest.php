<?php

namespace Tests\Feature;

use Tests\TestCase;

class RootRouteTest extends TestCase
{
    public function test_root_menjelaskan_bahwa_ini_backend_api(): void
    {
        $this->get('/')
            ->assertStatus(200)
            ->assertExactJson([
                'message' => 'TeamOrbit API',
                'api' => '/api',
            ]);
    }

    public function test_health_check_tetap_tersedia(): void
    {
        $this->get('/up')->assertStatus(200);
    }
}
