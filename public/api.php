<?php

require_once __DIR__ . '/../Backend/bootstrap.php';

use Picqer\Barcode\Types\TypeEan13;
use Picqer\Barcode\Renderers\PngRenderer;

header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET, POST, DELETE, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

function jsonResponse(array $payload, int $statusCode = 200): void
{
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function requestData(): array
{
    $rawInput = file_get_contents('php://input');
    $bodyData = json_decode($rawInput, true);

    if (!is_array($bodyData)) {
        parse_str($rawInput, $bodyData);
    }

    return array_merge($_GET, $_POST, $bodyData);
}

try {
    $resource = $_GET['resource'] ?? '';
    
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method === 'OPTIONS') {
        http_response_code(204);
        exit;
    }

    if (!in_array($method, ['GET', 'POST', 'DELETE', 'PUT'], true)) {
        jsonResponse(['success' => false, 'error' => 'Methode nicht erlaubt.'], 405);
    }

    $data = requestData();

    switch ($resource) {
        case 'barcode':
            if ($method == 'GET') {
         
                $hasCode = isset($data['code']) && trim((string)$data['code']) !== '';
                $barcode = trim((string)($data['code'] ?? ''));
            
                if (!$hasCode) {
                    $barcode = $dbHandler->generateBarcode();
                    jsonResponse(['success' => true, 'barcode' => $barcode]);
                }
            
                if (!$dbHandler->isValidEan13Barcode($barcode)) {
                    jsonResponse(['success' => false, 'error' => 'Barcode muss ein gültiger EAN-13-Code sein.'], 400);
                }

                $barcodeGenerator = new TypeEan13();
                $renderer = new PngRenderer();

                $barcodeforimage = $barcodeGenerator->getBarcode($barcode);
                $imageData = $renderer->render($barcodeforimage, max($barcodeforimage->getWidth() * 2, 100), 50);
            
                header('Cache-Control: public, max-age=31536000, immutable');
                header('Content-Type: image/png');
                header('Content-Length: ' . strlen($imageData));
                echo $imageData;
                exit;
            }

            jsonResponse(['success' => false, 'error' => 'Anfrage ungültig.'], 405);
            break;

        case 'werkzeuge':
            if ($method === 'GET') {
                jsonResponse(['success' => true, 'data' => $dbHandler->getAllWerkzeuge()]);
            }

            if ($method === 'POST') {
                $barcode = trim((string)($data['barcode'] ?? ''));
                $bezeichnung = trim((string)($data['bezeichnung'] ?? ''));
                $typId = (int)($data['typ_id'] ?? 0);
                $anschaffungsdatum = trim((string)($data['anschaffungsdatum'] ?? ''));

                if ($barcode === '' || $bezeichnung === '' || $typId <= 0) {
                    jsonResponse(['success' => false, 'error' => 'Parameter barcode, bezeichnung und typ_id fehlen.'], 400);
                }

                if (!$dbHandler->isValidEan13Barcode($barcode)) {
                    jsonResponse(['success' => false, 'error' => 'Barcode muss ein gültiger EAN-13-Code sein.'], 400);
                }

                if ($dbHandler->barcodeExists($barcode)) {
                    jsonResponse(['success' => false, 'error' => 'Barcode existiert bereits.'], 409);
                }

                $geklappt = $dbHandler->addWerkzeug($barcode, $bezeichnung, $typId, $anschaffungsdatum);
                if ($geklappt) {
                    jsonResponse(['success' => true, 'message' => 'Werkzeug erfolgreich hinzugefügt']);
                }

                jsonResponse(['success' => false, 'error' => 'Werkzeug konnte nicht hinzugefügt werden.'], 500);
            }

            if ($method === 'PUT') {
                $barcode = trim((string)($data['barcode'] ?? ''));
                $bezeichnung = trim((string)($data['bezeichnung'] ?? ''));
                $typId = (int)($data['typ_id'] ?? 0);
                $anschaffungsdatum = trim((string)($data['anschaffungsdatum'] ?? ''));
                $statusId = (int)($data['status_id'] ?? 0);

                if ($barcode === '' || $bezeichnung === '' || $typId <= 0 || $statusId <= 0) {
                    jsonResponse(['success' => false, 'error' => 'Parameter barcode, bezeichnung, typ_id und status_id fehlen.'], 400);
                }

                $geklappt = $dbHandler->updateWerkzeug($barcode, $bezeichnung, $typId, $statusId, $anschaffungsdatum);
                if ($geklappt) {
                    jsonResponse(['success' => true, 'message' => 'Werkzeug erfolgreich aktualisiert']);
                }

                jsonResponse(['success' => false, 'error' => 'Werkzeug konnte nicht aktualisiert werden.'], 500);
            }

            if ($method === 'DELETE') {
                $barcode = trim((string)($data['barcode'] ?? ''));

                if ($barcode === '') {
                    jsonResponse(['success' => false, 'error' => 'Parameter barcode fehlt.'], 400);
                }

                $geklappt = $dbHandler->deleteWerkzeug($barcode);
                if ($geklappt) {
                    jsonResponse(['success' => true, 'message' => 'Werkzeug erfolgreich gelöscht']);
                }

                jsonResponse(['success' => false, 'error' => 'Werkzeug konnte nicht gelöscht werden.'], 500);
            }

            jsonResponse(['success' => false, 'error' => 'Anfrage ungültig.'], 405);
            break;
            
        case 'werkzeug_typen':
            if ($method === 'GET') {
                jsonResponse(['success' => true, 'data' => $dbHandler->getAllWerkzeugeTypen()]);
            }

            if ($method === 'POST') {
                $art = trim((string)($data['art'] ?? ''));

                if ($art === '') {
                    jsonResponse(['success' => false, 'error' => 'Parameter art fehlt.'], 400);
                }

                $geklappt = $dbHandler->addWerkzeugTyp($art);
                if ($geklappt) {
                    jsonResponse(['success' => true, 'message' => 'Art erfolgreich hinzugefügt']);
                }

                jsonResponse(['success' => false, 'error' => 'Art konnte nicht hinzugefügt werden.'], 500);
            }

            if ($method === 'DELETE') {
                $art = trim((string)($data['art'] ?? ''));

                if ($art === '') {
                    jsonResponse(['success' => false, 'error' => 'Parameter art fehlt.'], 400);
                }

                $geklappt = $dbHandler->deleteWerkzeugTyp($art);
                if ($geklappt) {
                    jsonResponse(['success' => true, 'message' => 'Art erfolgreich gelöscht']);
                }

                jsonResponse(['success' => false, 'error' => 'Art konnte nicht gelöscht werden oder wird noch verwendet.'], 409);
            }

            if ($method === 'PUT') {
                $typId = (int)($data['typ_id'] ?? 0);
                $art = trim((string)($data['art'] ?? ''));

                if ($typId <= 0 || $art === '') {
                    jsonResponse(['success' => false, 'error' => 'Parameter typ_id und art müssen gesetzt sein.'], 400);
                }

                $geklappt = $dbHandler->updateWerkzeugTyp($typId, $art);
                if ($geklappt) {
                    jsonResponse(['success' => true, 'message' => 'Art erfolgreich aktualisiert']);
                }

                jsonResponse(['success' => false, 'error' => 'Art konnte nicht aktualisiert werden.'], 500);
            }

            jsonResponse(['success' => false, 'error' => 'Anfrage ungültig.'], 405);
            break;

        case 'status':
            if ($method === 'GET') {
                jsonResponse(['success' => true, 'data' => $dbHandler->getAllStatus()]);
            }

            if ($method === 'POST') {
                $bezeichnung = trim((string)($data['bezeichnung'] ?? ''));

                if ($bezeichnung === '') {
                    jsonResponse(['success' => false, 'error' => 'Parameter bezeichnung fehlt.'], 400);
                }

                $geklappt = $dbHandler->addStatus($bezeichnung);
                if ($geklappt) {
                    jsonResponse(['success' => true, 'message' => 'Status erfolgreich hinzugefügt']);
                }

                jsonResponse(['success' => false, 'error' => 'Status konnte nicht hinzugefügt werden.'], 500);
            }

            if ($method === 'PUT') {
                $statusId = (int)($data['status_id'] ?? 0);
                $bezeichnung = trim((string)($data['bezeichnung'] ?? ''));

                if ($statusId <= 0 || $bezeichnung === '') {
                    jsonResponse(['success' => false, 'error' => 'Parameter status_id und bezeichnung müssen gesetzt sein.'], 400);
                }

                $geklappt = $dbHandler->updateStatus($statusId, $bezeichnung);
                if ($geklappt) {
                    jsonResponse(['success' => true, 'message' => 'Status erfolgreich aktualisiert']);
                }

                jsonResponse(['success' => false, 'error' => 'Status konnte nicht aktualisiert werden.'], 500);
            }

            if ($method === 'DELETE') {
                $statusId = (int)($data['status_id'] ?? 0);

                if ($statusId <= 0) {
                    jsonResponse(['success' => false, 'error' => 'Parameter status_id fehlt.'], 400);
                }

                $geklappt = $dbHandler->deleteStatus($statusId);
                if ($geklappt) {
                    jsonResponse(['success' => true, 'message' => 'Status erfolgreich gelöscht']);
                }

                jsonResponse(['success' => false, 'error' => 'Status konnte nicht gelöscht werden oder wird noch verwendet.'], 409);
            }

            jsonResponse(['success' => false, 'error' => 'Anfrage ungültig.'], 405);
            break;

        case 'abteilung':
        case 'abteilungen':
            if ($method === 'GET') {
                jsonResponse(['success' => true, 'data' => $dbHandler->getAllAbteilungen()]);
            }

            if ($method === 'POST') {
                $name = trim((string)($data['name'] ?? ''));

                if ($name === '') {
                    jsonResponse(['success' => false, 'error' => 'Parameter name fehlt.'], 400);
                }

                $geklappt = $dbHandler->addAbteilung($name);
                if ($geklappt) {
                    jsonResponse(['success' => true, 'message' => 'Abteilung erfolgreich hinzugefügt']);
                }

                jsonResponse(['success' => false, 'error' => 'Abteilung konnte nicht hinzugefügt werden.'], 500);
            }

            if ($method === 'PUT') {
                $abteilungId = (int)($data['abteilung_id'] ?? 0);
                $name = trim((string)($data['name'] ?? ''));

                if ($abteilungId <= 0 || $name === '') {
                    jsonResponse(['success' => false, 'error' => 'Parameter abteilung_id und name müssen gesetzt sein.'], 400);
                }

                $geklappt = $dbHandler->updateAbteilung($abteilungId, $name);
                if ($geklappt) {
                    jsonResponse(['success' => true, 'message' => 'Abteilung erfolgreich aktualisiert']);
                }

                jsonResponse(['success' => false, 'error' => 'Abteilung konnte nicht aktualisiert werden.'], 500);
            }

            if ($method === 'DELETE') {
                $abteilungId = (int)($data['abteilung_id'] ?? 0);

                if ($abteilungId <= 0) {
                    jsonResponse(['success' => false, 'error' => 'Parameter abteilung_id fehlt.'], 400);
                }

                $geklappt = $dbHandler->deleteAbteilung($abteilungId);
                if ($geklappt) {
                    jsonResponse(['success' => true, 'message' => 'Abteilung erfolgreich gelöscht']);
                }

                jsonResponse(['success' => false, 'error' => 'Abteilung konnte nicht gelöscht werden oder wird noch verwendet.'], 409);
            }

            jsonResponse(['success' => false, 'error' => 'Anfrage ungültig.'], 405);
            break;

        case 'mitarbeiter':
            if ($method === 'GET') {
                jsonResponse(['success' => true, 'data' => $dbHandler->getAllMitarbeiter()]);
            }

            if ($method === 'POST') {
                $vorname = trim((string)($data['vorname'] ?? ''));
                $nachname = trim((string)($data['nachname'] ?? ''));
                $email = trim((string)($data['email'] ?? ''));
                $abteilungId = (int)($data['abteilung_id'] ?? 0);

                if ($vorname === '' || $nachname === '' || $email === '' || $abteilungId <= 0) {
                    jsonResponse(['success' => false, 'error' => 'Parameter vorname, nachname, email und abteilung_id fehlen.'], 400);
                }

                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    jsonResponse(['success' => false, 'error' => 'Die angegebene E-Mail-Adresse ist ungültig.'], 400);
                }

                $geklappt = $dbHandler->addMitarbeiter($vorname, $nachname, $email, $abteilungId);
                if ($geklappt) {
                    jsonResponse(['success' => true, 'message' => 'Mitarbeiter erfolgreich hinzugefügt']);
                }

                jsonResponse(['success' => false, 'error' => 'Mitarbeiter konnte nicht hinzugefügt werden.'], 500);
            }

            if ($method === 'PUT') {
                $mitarbeiterId = (int)($data['mitarbeiter_id'] ?? 0);
                $vorname = trim((string)($data['vorname'] ?? ''));
                $nachname = trim((string)($data['nachname'] ?? ''));
                $email = trim((string)($data['email'] ?? ''));
                $abteilungId = (int)($data['abteilung_id'] ?? 0);

                if ($mitarbeiterId <= 0 || $vorname === '' || $nachname === '' || $email === '' || $abteilungId <= 0) {
                    jsonResponse(['success' => false, 'error' => 'Parameter mitarbeiter_id, vorname, nachname, email und abteilung_id müssen gesetzt sein.'], 400);
                }

                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    jsonResponse(['success' => false, 'error' => 'Die angegebene E-Mail-Adresse ist ungültig.'], 400);
                }

                $geklappt = $dbHandler->updateMitarbeiter($mitarbeiterId, $vorname, $nachname, $email, $abteilungId);
                if ($geklappt) {
                    jsonResponse(['success' => true, 'message' => 'Mitarbeiter erfolgreich aktualisiert']);
                }

                jsonResponse(['success' => false, 'error' => 'Mitarbeiter konnte nicht aktualisiert werden.'], 500);
            }

            if ($method === 'DELETE') {
                $mitarbeiterId = (int)($data['mitarbeiter_id'] ?? 0);

                if ($mitarbeiterId <= 0) {
                    jsonResponse(['success' => false, 'error' => 'Parameter mitarbeiter_id fehlt.'], 400);
                }

                $geklappt = $dbHandler->deleteMitarbeiter($mitarbeiterId);
                if ($geklappt) {
                    jsonResponse(['success' => true, 'message' => 'Mitarbeiter erfolgreich gelöscht']);
                }

                jsonResponse(['success' => false, 'error' => 'Mitarbeiter konnte nicht gelöscht werden oder wird noch verwendet.'], 409);
            }

            jsonResponse(['success' => false, 'error' => 'Anfrage ungültig.'], 405);
            break;

        case 'ausleihen':
            if ($method == 'POST') {
                $barcode = trim((string)($data['barcode'] ?? ''));
                $mitarbeiter_id = (int)($data['mitarbeiter_id'] ?? 0);
                $ausleihdauer = (int)($data['ausleihdauer'] ?? 0);

                if ($barcode == '' || $mitarbeiter_id <= 0 || $ausleihdauer <= 0) {
                    jsonResponse(['success' => false, 'error' => 'Parameter barcode, mitarbeiter_id oder ausleihdauer fehlen.'], 400);
                }

                if ($dbHandler->isWerkzeugAusgeliehen($barcode)) {
                    jsonResponse(['success' => false, 'error' => 'Werkzeug ist bereits ausgeliehen.'], 409);
                }

                $geklappt = $dbHandler->leiheWerkzeug($barcode, $mitarbeiter_id, $ausleihdauer);
                if ($geklappt) {
                    jsonResponse(['success' => true, 'message' => 'Erfolgreich ausgeliehen']);
                }

                jsonResponse(['success' => false, 'error' => 'Fehler beim Ausleihen'], 500);
            }

            jsonResponse(['success' => false, 'error' => 'Anfrage ungültig.'], 405);
            break;

        case 'abgeben':
            if ($method == 'POST') {
                $barcode = trim((string)($data['barcode'] ?? ''));
                $zustand = trim((string)($data['zustand'] ?? 'OK'));

                if ($barcode == '') {
                    jsonResponse(['success' => false, 'error' => 'Parameter barcode fehlt.'], 400);
                }

                if (!$dbHandler->isWerkzeugAusgeliehen($barcode)) {
                    jsonResponse(['success' => false, 'error' => 'Werkzeug ist nicht ausgeliehen.'], 409);
                }

                $geklappt = $dbHandler->gebeWerkzeugZurueck($barcode, $zustand);
                if ($geklappt) {
                    jsonResponse(['success' => true, 'message' => 'Erfolgreich abgegeben']);
                }

                jsonResponse(['success' => false, 'error' => 'Fehler bei der Rückgabe in der Datenbank.'], 500);
            }

            jsonResponse(['success' => false, 'error' => 'Anfrage ungültig.'], 405);
            break;

        case 'ausgeliehen':
            if ($method === 'GET') {
                jsonResponse(['success' => true, 'data' => $dbHandler->getAllAusgelieheneSachen()]);
            }

            jsonResponse(['success' => false, 'error' => 'Anfrage ungültig.'], 405);
            break;

        case 'ausgeliehen_historie':
            if ($method === 'GET') {
                jsonResponse(['success' => true, 'data' => $dbHandler->getAusgeliehenHistorie()]);
            }

            jsonResponse(['success' => false, 'error' => 'Anfrage ungültig.'], 405);
            break;

        case 'verlängern':
            if ($method === 'PUT' || $method === 'POST') {
                $ausleihId = (int)($data['ausleih_id'] ?? 0);
                $zusatzTage = (int)($data['zusatz_tage'] ?? 0);

                if ($ausleihId <= 0 || $zusatzTage <= 0) {
                    jsonResponse(['success' => false, 'error' => 'Parameter ausleih_id und zusatz_tage müssen gesetzt sein und größer als 0 sein.'], 400);
                }

                $geklappt = $dbHandler->extendAusleihen($ausleihId, $zusatzTage);
                if ($geklappt) {
                    jsonResponse(['success' => true, 'message' => 'Ausleihe erfolgreich verlängert']);
                }

                jsonResponse(['success' => false, 'error' => 'Ausleihe konnte nicht verlängert werden.'], 404);
            }

            jsonResponse(['success' => false, 'error' => 'Anfrage ungültig.'], 405);
            break;

        default:
            jsonResponse(['success' => false, 'error' => 'Anfrage ungültig.'], 404);
    }

} catch (Throwable $throwable) {  
    error_log("API Error: " . $throwable->getMessage() . " in " . $throwable->getFile() . ":" . $throwable->getLine());
    jsonResponse(['success' => false, 'error' => 'Interner Serverfehler.'], 500);
}