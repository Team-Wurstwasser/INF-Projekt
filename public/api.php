<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Backend\Database\DatabaseHandler;
use Dotenv\Dotenv;
use PDO;
use Throwable;

$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

function json_response(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}


try {
    $dsn = "mysql:host={$_ENV['DB_HOST']};port={$_ENV['DB_PORT']};dbname={$_ENV['DB_NAME']};charset=utf8mb4";
    
    $pdo = new PDO($dsn, $_ENV['DB_USER'], $_ENV['DB_PASSWORD'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);

    $dbHandler = new DatabaseHandler($pdo);
    $resource = $_GET['resource'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($resource) {
        case 'werkzeuge':
            if ($method === 'GET') {
                json_response(['success' => true, 'data' => $dbHandler->getAllWerkzeuge()]);
            }
            break;
        case 'werkzeug_typen':
            if ($method === 'GET') {
                json_response(['success' => true, 'data' => $dbHandler->getAllWerkzeugeTypen()]);
            }
            break;

        case 'mitarbeiter':
            if ($method === 'GET') {
                json_response(['success' => true, 'data' => $dbHandler->getAllMitarbeiter()]);
            }
            break;

        default:
            json_response(['success' => false, 'error' => 'Anfrage ungültig.'], 404);
    }

} catch (Throwable $throwable) {  
    error_log("API Error: " . $throwable->getMessage() . " in " . $throwable->getFile() . ":" . $throwable->getLine());
    json_response(['success' => false, 'error' => 'Interner Serverfehler.'], 500);
}