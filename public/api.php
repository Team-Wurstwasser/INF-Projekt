<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Backend\Database\DatabaseHandler;
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET');
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
    if ($method !== 'GET') {
        json_response(['success' => false, 'error' => 'Methode nicht erlaubt.'], 405);
    }

    switch ($resource) {
        case 'werkzeuge':
            json_response(['success' => true, 'data' => $dbHandler->getAllWerkzeuge()]);
            break;

        case 'werkzeug_typen':
            json_response(['success' => true, 'data' => $dbHandler->getAllWerkzeugeTypen()]);
            break;

        case 'mitarbeiter':
            json_response(['success' => true, 'data' => $dbHandler->getAllMitarbeiter()]);
            break;

        case 'ausleihen':
            $barcode = $_GET['barcode'] ?? null;
            $mitarbeiter_id = $_GET['mitarbeiter_id'] ?? null;

            if ($barcode && $mitarbeiter_id) {
                $res = $dbHandler->leiheWerkzeug($barcode, (int)$mitarbeiter_id);
        
                if ($res) {
                    json_response(['success' => true, 'message' => 'Erfolgreich ausgeliehen']);
                } else {
                    json_response(['success' => false, 'error' => 'Fehler beim Ausleihen in der Datenbank.'], 500);
                }
            }
            json_response(['success' => false, 'error' => 'Parameter barcode und mitarbeiter_id fehlen.'], 400);
            break;

        case 'abgeben':
            $barcode = $_GET['barcode'] ?? null;
            $zustand = $_GET['zustand'] ?? 'OK';

            if ($barcode) {
                $res = $dbHandler->gebeWerkzeugZurueck($barcode, $zustand);
        
                if ($res) {
                    json_response(['success' => true, 'message' => 'Erfolgreich abgegeben']);
                } else {
                    json_response(['success' => false, 'error' => 'Fehler bei der Rückgabe in der Datenbank.'], 500);
                }
            }
            json_response(['success' => false, 'error' => 'Parameter barcode fehlt.'], 400);
            break;

        default:
            json_response(['success' => false, 'error' => 'Anfrage ungültig.'], 404);
    }

} catch (Throwable $throwable) {  
    error_log("API Error: " . $throwable->getMessage() . " in " . $throwable->getFile() . ":" . $throwable->getLine());
    json_response(['success' => false, 'error' => 'Interner Serverfehler.'], 500);
}