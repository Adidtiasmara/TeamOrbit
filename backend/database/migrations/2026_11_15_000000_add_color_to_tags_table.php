<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tag yang sudah ada otomatis mendapat warna default "abu".
     * Nilai yang boleh dipakai ada di Tag::COLORS.
     */
    public function up(): void
    {
        Schema::table('tags', function (Blueprint $table) {
            $table->string('color', 20)->default('abu')->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('tags', function (Blueprint $table) {
            $table->dropColumn('color');
        });
    }
};
