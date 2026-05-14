<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Backend\Database\DatabaseHandler;
use Dotenv\Dotenv;
use Picqer\Barcode\Types\TypeEan13;
use Picqer\Barcode\Renderers\PngRenderer;

$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET, POST, DELETE, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

function json_response(array $payload, int $statusCode = 200): void
{
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function request_data(): array
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
    $rawInput = file_get_contents('php://input');
    $bodyData = [];

    if (stripos($contentType, 'application/json') !== false && $rawInput !== '') {
        $decoded = json_decode($rawInput, true);
        if (is_array($decoded)) {
            $bodyData = $decoded;
        }
    }
    else if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        parse_str($rawInput, $bodyData);
    }
    else {
        $bodyData = $_POST;
    }

    return array_merge($_GET, $bodyData);
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
    if ($method === 'OPTIONS') {
        http_response_code(204);
        exit;
    }

    if (!in_array($method, ['GET', 'POST', 'DELETE', 'PUT'], true)) {
        json_response(['success' => false, 'error' => 'Methode nicht erlaubt.'], 405);
    }

    $data = request_data();

    switch ($resource) {
        case 'barcode':
            if ($method == 'GET') {
         
                $hasCode = isset($data['code']) && trim((string)$data['code']) !== '';
                $customCode = trim((string)($data['code'] ?? ''));
            
                if (!$hasCode) {
                    $customCode = $dbHandler->generateUniqueBarcode();

                    if ($customCode === null) {
                        json_response(['success' => false, 'error' => 'Konnte keinen eindeutigen Barcode generieren'], 500);
                    }
                    
                    json_response(['success' => true, 'barcode' => $customCode]);
                }
            
                $barcodeGenerator = new TypeEan13();
                $renderer = new PngRenderer();

                $barcode = $barcodeGenerator->getBarcode($customCode);
                $imageData = $renderer->render($barcode, max($barcode->getWidth() * 2, 100), 50);
            
                header('Content-Type: image/png');
                header('Content-Length: ' . strlen($imageData));
                echo $imageData;
                exit;
            }

            json_response(['success' => false, 'error' => 'Anfrage ungültig.'], 405);
            break;

        case 'werkzeuge':
            if ($method === 'GET') {
                json_response(['success' => true, 'data' => $dbHandler->getAllWerkzeuge()]);
            }

            if ($method === 'POST') {
                $barcode = trim((string)($data['barcode'] ?? ''));
                $bezeichnung = trim((string)($data['bezeichnung'] ?? ''));
                $typId = (int)($data['typ_id'] ?? 0);
                $anschaffungsdatum = trim((string)($data['anschaffungsdatum'] ?? ''));
                $statusId = (int)($data['status_id'] ?? 1);

                if ($barcode === '' || $bezeichnung === '' || $typId <= 0) {
                    json_response(['success' => false, 'error' => 'Parameter barcode, bezeichnung und typ_id fehlen.'], 400);
                }

                $res = $dbHandler->addWerkzeug($barcode, $bezeichnung, $typId, $anschaffungsdatum, $statusId);
                if ($res) {
                    json_response(['success' => true, 'message' => 'Werkzeug erfolgreich hinzugefügt']);
                }

                json_response(['success' => false, 'error' => 'Werkzeug konnte nicht hinzugefügt werden.'], 500);
            }

            if ($method === 'DELETE') {
                $barcode = trim((string)($data['barcode'] ?? ''));

                if ($barcode === '') {
                    json_response(['success' => false, 'error' => 'Parameter barcode fehlt.'], 400);
                }

                $res = $dbHandler->deleteWerkzeug($barcode);
                if ($res) {
                    json_response(['success' => true, 'message' => 'Werkzeug erfolgreich gelöscht']);
                }

                json_response(['success' => false, 'error' => 'Werkzeug konnte nicht gelöscht werden.'], 500);
            }

            json_response(['success' => false, 'error' => 'Anfrage ungültig.'], 405);
            break;

        case 'werkzeug_typen':
        case 'typen':
        case 'art':
            if ($method === 'GET') {
                json_response(['success' => true, 'data' => $dbHandler->getAllWerkzeugeTypen()]);
            }

            if ($method === 'POST') {
                $art = trim((string)($data['art'] ?? ''));

                if ($art === '') {
                    json_response(['success' => false, 'error' => 'Parameter art fehlt.'], 400);
                }

                $res = $dbHandler->addWerkzeugTyp($art);
                if ($res) {
                    json_response(['success' => true, 'message' => 'Art erfolgreich hinzugefügt']);
                }

                json_response(['success' => false, 'error' => 'Art konnte nicht hinzugefügt werden.'], 500);
            }

            if ($method === 'DELETE') {
                $art = trim((string)($data['art'] ?? ''));

                if ($art === '') {
                    json_response(['success' => false, 'error' => 'Parameter art fehlt.'], 400);
                }

                $res = $dbHandler->deleteWerkzeugTyp($art);
                if ($res) {
                    json_response(['success' => true, 'message' => 'Art erfolgreich gelöscht']);
                }

                json_response(['success' => false, 'error' => 'Art konnte nicht gelöscht werden oder wird noch verwendet.'], 409);
            }

            if ($method === 'PUT') {
                $typId = (int)($data['typ_id'] ?? 0);
                $art = trim((string)($data['art'] ?? ''));

                if ($typId <= 0 || $art === '') {
                    json_response(['success' => false, 'error' => 'Parameter typ_id und art müssen gesetzt sein.'], 400);
                }

                $res = $dbHandler->updateWerkzeugTyp($typId, $art);
                if ($res) {
                    json_response(['success' => true, 'message' => 'Art erfolgreich aktualisiert']);
                }

                json_response(['success' => false, 'error' => 'Art konnte nicht aktualisiert werden.'], 500);
            }

            json_response(['success' => false, 'error' => 'Anfrage ungültig.'], 405);
            break;

        case 'status':
            if ($method === 'GET') {
                json_response(['success' => true, 'data' => $dbHandler->getAllStatus()]);
            }

            if ($method === 'POST') {
                $bezeichnung = trim((string)($data['bezeichnung'] ?? ''));

                if ($bezeichnung === '') {
                    json_response(['success' => false, 'error' => 'Parameter bezeichnung fehlt.'], 400);
                }

                $res = $dbHandler->addStatus($bezeichnung);
                if ($res) {
                    json_response(['success' => true, 'message' => 'Status erfolgreich hinzugefügt']);
                }

                json_response(['success' => false, 'error' => 'Status konnte nicht hinzugefügt werden.'], 500);
            }

            if ($method === 'PUT') {
                $statusId = (int)($data['status_id'] ?? 0);
                $bezeichnung = trim((string)($data['bezeichnung'] ?? ''));

                if ($statusId <= 0 || $bezeichnung === '') {
                    json_response(['success' => false, 'error' => 'Parameter status_id und bezeichnung müssen gesetzt sein.'], 400);
                }

                $res = $dbHandler->updateStatus($statusId, $bezeichnung);
                if ($res) {
                    json_response(['success' => true, 'message' => 'Status erfolgreich aktualisiert']);
                }

                json_response(['success' => false, 'error' => 'Status konnte nicht aktualisiert werden.'], 500);
            }

            if ($method === 'DELETE') {
                $statusId = (int)($data['status_id'] ?? 0);

                if ($statusId <= 0) {
                    json_response(['success' => false, 'error' => 'Parameter status_id fehlt.'], 400);
                }

                $res = $dbHandler->deleteStatus($statusId);
                if ($res) {
                    json_response(['success' => true, 'message' => 'Status erfolgreich gelöscht']);
                }

                json_response(['success' => false, 'error' => 'Status konnte nicht gelöscht werden oder wird noch verwendet.'], 409);
            }

            json_response(['success' => false, 'error' => 'Anfrage ungültig.'], 405);
            break;

        case 'abteilung':
        case 'abteilungen':
            if ($method === 'GET') {
                json_response(['success' => true, 'data' => $dbHandler->getAllAbteilungen()]);
            }

            if ($method === 'POST') {
                $name = trim((string)($data['name'] ?? ''));

                if ($name === '') {
                    json_response(['success' => false, 'error' => 'Parameter name fehlt.'], 400);
                }

                $res = $dbHandler->addAbteilung($name);
                if ($res) {
                    json_response(['success' => true, 'message' => 'Abteilung erfolgreich hinzugefügt']);
                }

                json_response(['success' => false, 'error' => 'Abteilung konnte nicht hinzugefügt werden.'], 500);
            }

            if ($method === 'PUT') {
                $abteilungId = (int)($data['abteilung_id'] ?? 0);
                $name = trim((string)($data['name'] ?? ''));

                if ($abteilungId <= 0 || $name === '') {
                    json_response(['success' => false, 'error' => 'Parameter abteilung_id und name müssen gesetzt sein.'], 400);
                }

                $res = $dbHandler->updateAbteilung($abteilungId, $name);
                if ($res) {
                    json_response(['success' => true, 'message' => 'Abteilung erfolgreich aktualisiert']);
                }

                json_response(['success' => false, 'error' => 'Abteilung konnte nicht aktualisiert werden.'], 500);
            }

            if ($method === 'DELETE') {
                $abteilungId = (int)($data['abteilung_id'] ?? 0);

                if ($abteilungId <= 0) {
                    json_response(['success' => false, 'error' => 'Parameter abteilung_id fehlt.'], 400);
                }

                $res = $dbHandler->deleteAbteilung($abteilungId);
                if ($res) {
                    json_response(['success' => true, 'message' => 'Abteilung erfolgreich gelöscht']);
                }

                json_response(['success' => false, 'error' => 'Abteilung konnte nicht gelöscht werden oder wird noch verwendet.'], 409);
            }

            json_response(['success' => false, 'error' => 'Anfrage ungültig.'], 405);
            break;

        case 'mitarbeiter':
            json_response(['success' => true, 'data' => $dbHandler->getAllMitarbeiter()]);
            break;

        case 'ausleihen':
            if ($method == 'POST') {
                $barcode = trim((string)($data['barcode'] ?? ''));
                $mitarbeiter_id = (int)($data['mitarbeiter_id'] ?? 0);
                $ausleihdauer = (int)($data['ausleihdauer'] ?? 0);

                if ($barcode !== '' && $mitarbeiter_id > 0 && $ausleihdauer > 0) {
                    $res = $dbHandler->leiheWerkzeug($barcode, $mitarbeiter_id, $ausleihdauer);

                    if ($res) {
                        json_response(['success' => true, 'message' => 'Erfolgreich ausgeliehen']);
                    } else {
                        json_response(['success' => false, 'error' => 'Fehler beim Ausleihen'], 500);
                    }
                }
                json_response(['success' => false, 'error' => 'Parameter barcode, mitarbeiter_id oder ausleihdauer fehlen.'], 400);
            }

            json_response(['success' => false, 'error' => 'Anfrage ungültig.'], 405);
            break;

        case 'abgeben':
            if ($method == 'POST') {
                $barcode = trim((string)($data['barcode'] ?? ''));
                $zustand = trim((string)($data['zustand'] ?? 'OK'));

                if ($barcode !== '') {
                    $res = $dbHandler->gebeWerkzeugZurueck($barcode, $zustand);
        
                    if ($res) {
                        json_response(['success' => true, 'message' => 'Erfolgreich abgegeben']);
                    } else {
                        json_response(['success' => false, 'error' => 'Fehler bei der Rückgabe in der Datenbank.'], 500);
                    }
                }
                json_response(['success' => false, 'error' => 'Parameter barcode fehlt.'], 400);
            }

            json_response(['success' => false, 'error' => 'Anfrage ungültig.'], 405);
            break;

        case 'ausgeliehene_sachen':
        case 'ausgeliehen':
            if ($method === 'GET') {
                json_response(['success' => true, 'data' => $dbHandler->getAllAusgelieheneSachen()]);
            }

            json_response(['success' => false, 'error' => 'Anfrage ungültig.'], 405);
            break;

        default:
            json_response(['success' => false, 'error' => 'Anfrage ungültig.'], 404);
    }

} catch (Throwable $throwable) {  
    error_log("API Error: " . $throwable->getMessage() . " in " . $throwable->getFile() . ":" . $throwable->getLine());
    json_response(['success' => false, 'error' => 'Interner Serverfehler.'], 500);
}