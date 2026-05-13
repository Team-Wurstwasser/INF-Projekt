<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Backend\Database\DatabaseHandler;
use Dotenv\Dotenv;
use PDO;
use Backend\Email\ReminderEmail;

$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

try {
    $dsn = "mysql:host={$_ENV['DB_HOST']};port={$_ENV['DB_PORT']};dbname={$_ENV['DB_NAME']};charset=utf8mb4";
        
    $pdo = new PDO($dsn, $_ENV['DB_USER'], $_ENV['DB_PASSWORD'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);

    $databaseHandler = new DatabaseHandler($pdo);
    $abgabenIn48h = $databaseHandler->getAllAbgabenin48h();

    $reminderEmail = new ReminderEmail();

    foreach ($abgabenIn48h as $abgabe) {
        $toEmail = $abgabe['Email'];
        $toName = $abgabe['Vorname'] . ' ' . $abgabe['Nachname'];
        
        $reminderTitle = "Rückgabe fällig: " . $abgabe['Bezeichnung'];
        $reminderMessage = "Dies ist eine automatische Erinnerung, dass das Werkzeug '" . $abgabe['Bezeichnung'] . "' (Barcode: " . $abgabe['Barcode'] . ") zur Rückgabe bereitsteht oder bereits fällig ist.";
        $reminderDate = $abgabe['Rückgabedatum'];

        try {
            $success = $reminderEmail->sendEmail($toEmail, $toName, $reminderTitle, $reminderMessage, $reminderDate);
            
            if ($success) {
                $updateSql = "UPDATE Ausleihe SET EmailVersendet = 1 WHERE Barcode = :barcode AND Rückgabedatum = :datum";
                $stmt = $pdo->prepare($updateSql);
                $stmt->execute([
                    ':barcode' => $abgabe['Barcode'],
                    ':datum'   => $abgabe['Rückgabedatum']
                ]);
            }
        } catch (Exception $e) {
            error_log("E-Mail Versand fehlgeschlagen für $toEmail. Fehler: " . $e->getMessage());
        }
    }
} catch (Exception $e) {
    error_log("Allgemeiner Fehler " . $e->getMessage());
}