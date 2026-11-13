<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(4),
            'description' => fake()->optional()->paragraph(),
            'status' => Task::STATUS_PENDING,
            'created_by' => User::factory(),
        ];
    }

    public function done(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Task::STATUS_DONE,
        ]);
    }
}
