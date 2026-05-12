<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use Backend\Database\DatabaseHandler;
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function json_response(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

try {
    $dsn = "mysql:host={$_ENV['DB_HOST']};port={$_ENV['DB_PORT']};dbname={$_ENV['DB_NAME']};charset=utf8mb4";
    
    $pdo = new PDO(
        $dsn,
        $_ENV['DB_USER'],
        $_ENV['DB_PASSWORD'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );

    $dbHandler = new DatabaseHandler($pdo);

    $method = $_SERVER['REQUEST_METHOD'];
    $resource = $_GET['resource'] ?? '';

    switch ($resource) {
        case 'werkzeuge':
            if ($method === 'GET') {
                json_response(['success' => true, 'data' => $dbHandler->getAllWerkzeuge()]);
            } 
            elseif ($method === 'POST') {
                $data = json_decode(file_get_contents('php://input'), true);
                $barcode = 'BAR-' . strtoupper(bin2hex(random_bytes(4)));
                
                $dbHandler->createWerkzeug(
                    $barcode,
                    $data['bezeichnung'],
                    $data['datum'] ?? date('Y-m-d'),
                    (int)($data['status_id'] ?? 1),
                    (int)$data['typ_id']
                );
                json_response(['success' => true, 'barcode' => $barcode], 201);
            }
            break;

        case 'ausleihe':
            if ($method === 'PATCH') {
                $data = json_decode(file_get_contents('php://input'), true);
                $dbHandler->checkoutWerkzeug($data['barcode'], (int)$data['mitarbeiter_id']);
                json_response(['success' => true, 'message' => 'Werkzeug ausgecheckt.']);
            }
            break;

        case 'rueckgabe':
            if ($method === 'PATCH') {
                $data = json_decode(file_get_contents('php://input'), true);
                $dbHandler->checkinWerkzeug($data['barcode'], $data['zustand'] ?? 'OK');
                json_response(['success' => true, 'message' => 'Werkzeug zurückgegeben.']);
            }
            break;

        case 'mitarbeiter':
            if ($method === 'GET') {
                json_response(['success' => true, 'data' => $dbHandler->getAllMitarbeiter()]);
            }
            break;

        default:
            json_response(['success' => false, 'error' => 'Ressource nicht gefunden.'], 404);
    }

} catch (Throwable $throwable) {  
    error_log($throwable->getMessage());
    json_response(['success' => false, 'error' => $throwable->getMessage()], 500);
}