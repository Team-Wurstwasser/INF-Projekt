<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use Backend\Email\ReminderEmail;

$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

try {
    $toEmail = 'alexander.goetzhome@gmail.com';
    $toName = 'Max Mustermann';
    $reminderTitle = 'Lagerbestand kritisch';
    $reminderMessage = 'Der Lagerbestand für Artikel XYZ ist kritisch niedrig. Bitte zeitnah nachbestellen.';
    $reminderDate = date('d.m.Y H:i', strtotime('+1 day'));

    $reminderEmail = new ReminderEmail();

    $result = $reminderEmail->sendEmail($toEmail, $toName, $reminderTitle, $reminderMessage, $reminderDate);

} catch (Exception $e) {
    echo "Fehler beim Senden der E-Mail: " . $e->getMessage();
}
