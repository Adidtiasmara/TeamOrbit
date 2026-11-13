FROM php:8.3-cli

# pdo_mysql untuk database aplikasi; pdo_sqlite sudah bawaan image (dipakai test).
RUN apt-get update \
    && apt-get install -y --no-install-recommends unzip \
    && docker-php-ext-install pdo_mysql \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Dependency dipasang lebih dulu supaya layer ini di-cache selama composer.lock
# tidak berubah. Dev dependency ikut, agar test bisa dijalankan di container.
COPY composer.json composer.lock ./
RUN composer install --no-interaction --prefer-dist --no-progress --no-scripts --no-autoloader

COPY . .
RUN composer dump-autoload --optimize --no-interaction

EXPOSE 8000

ENTRYPOINT ["sh", "/var/www/html/docker/entrypoint.sh"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
