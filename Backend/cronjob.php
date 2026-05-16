<?php

require_once __DIR__ . '/bootstrap.php';

use Backend\Email\ReminderEmail;

try {
    $abgabenIn48h = $dbHandler->getAllAbgabenin48h();

    $reminderEmail = new ReminderEmail();

    foreach ($abgabenIn48h as $abgabe) {
        $toEmail = $abgabe['Email'];
        $toName = $abgabe['Vorname'] . ' ' . $abgabe['Nachname'];
    
        $reminderTitle = "Rückgabe fällig: " . $abgabe['Bezeichnung'];
        $reminderMessage = "Dies ist eine automatische Erinnerung für " . $abgabe['Bezeichnung'] . ".";
    
        $rückgabeTermin = $abgabe['Fälligkeitsdatum'];
        $gegenstand = $abgabe['Bezeichnung'] . " (Barcode: " . $abgabe['Barcode'] . ")";

        try {
            $success = $reminderEmail->sendEmail($toEmail, $toName, $reminderTitle, $reminderMessage, $gegenstand, $rückgabeTermin);
        
            if ($success) {
                $dbHandler->setEmailSent($abgabe['Ausleih_ID']);
            }
        } catch (Exception $exception) {
            error_log("E-Mail Versand fehlgeschlagen für $toEmail: " . $exception->getMessage());
        }
    }
} catch (Exception $exception) {
    error_log("Allgemeiner Fehler " . $exception->getMessage());
}