#!/bin/sh
# Persiapan otomatis setiap container backend menyala, supaya
# `docker compose up` jalan tanpa setup manual.
set -e

cd /var/www/html

# .env khusus container (tidak ikut repo). Variabel dari docker-compose
# tetap menang atas isi file ini.
if [ ! -f .env ]; then
    cp .env.example .env
fi

if ! grep -q '^APP_KEY=base64:' .env; then
    php artisan key:generate --force --no-interaction
fi

# Healthcheck MySQL sudah ditunggu lewat depends_on; percobaan ulang ini
# hanya cadangan kalau MySQL masih menyelesaikan start-up.
attempt=1
until php artisan migrate --force --no-interaction; do
    if [ "$attempt" -ge 10 ]; then
        echo "Database belum bisa dipakai setelah $attempt percobaan." >&2
        exit 1
    fi
    echo "Database belum siap, coba lagi ($attempt/10)..."
    attempt=$((attempt + 1))
    sleep 3
done

# Akun demo; aman diulang karena seeder tidak menduplikasi/menimpa akun.
php artisan db:seed --force --no-interaction

exec "$@"
