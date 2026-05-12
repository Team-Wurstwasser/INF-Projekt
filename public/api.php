<?php

declare(strict_types=1);

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

function json_response(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

try {
    $params = $_GET;

    if (empty($params)) {
        json_response([
            'success' => false,
            'error' => 'Keine URL-Parameter übergeben.'
        ], 400);
    }

    json_response([
        'success' => false,
        'error' => 'Unbekannte Anfrage.'
    ], 404);

} catch (Throwable $throwable) {
    error_log($throwable->getMessage());
    json_response([
        'success' => false,
        'error' => 'Interner Serverfehler.'
    ], 500);
}