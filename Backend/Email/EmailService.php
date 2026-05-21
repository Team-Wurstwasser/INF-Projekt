<?php

namespace Backend\Email;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

/**
 * EmailService
 *
 * Verwaltet die Konfiguration von PHPMailer und das Versenden von E-Mails.
 * Lädt Zugangsdaten aus Umgebungsvariablen und bietet eine einfache Schnittstelle
 * sendEmail(...) zum Versenden von HTML-E-Mails mit optionalem Alt-Text.
 */
class EmailService
{
    private $mail;
    
    public function __construct()
    {
        // Initialisiert PHPMailer und konfiguriert SMTP anhand der Umgebungsvariablen
        $this->mail = new PHPMailer(true);
        $this->configureSMTP();
    }
    
    private function configureSMTP()
    {
        try {
            $this->mail->isSMTP();
            // Host, Credentials und Port werden aus der .env geladen
            $this->mail->Host = $_ENV['SMTP_HOST'];
            $this->mail->SMTPAuth = true;
            $this->mail->Username = $_ENV['SMTP_USER'];
            $this->mail->Password = $_ENV['SMTP_PASSWORD'];
            $this->mail->SMTPSecure = $_ENV['SMTP_SECURE'];
            $this->mail->Port = $_ENV['SMTP_PORT'];
            
            $this->mail->CharSet = 'UTF-8';
        } catch (Exception $exception) {
            error_log("SMTP-Konfigurationsfehler: " . $exception->getMessage());
            throw new Exception("Interner Konfigurationsfehler.");
        }
    }
    
    /**
     * Sendet eine E-Mail an einen Empfänger.
     *
     * @param string $toEmail Empfänger-E-Mail-Adresse
     * @param string $toName Empfänger-Name
     * @param string $subject Betreff der E-Mail
     * @param string $body HTML-Inhalt der E-Mail
     * @param string $altBody optionaler Alt-Text (falls nicht gesetzt, wird aus HTML erzeugt)
     * @return bool true bei erfolgreichem Versand
     * @throws Exception bei Fehlern im PHPMailer
     */
    public function sendEmail($toEmail, $toName, $subject, $body, $altBody = '')
    {
        try {
            // Bereitet die E-Mail vor und sendet sie über PHPMailer
            $this->mail->addAddress($toEmail, $toName);
            
            $this->mail->setFrom($_ENV['SMTP_USER'], $_ENV['Email_AnzeigeName']);
            
            $this->mail->Subject = $subject;
            $this->mail->isHTML(true);
            $this->mail->Body = $body;
            $this->mail->AltBody = $altBody ?: strip_tags($body);
            
            return $this->mail->send();
        } catch (Exception $e) {
            error_log("E-Mail Sende-Fehler an " . $toEmail . ": " . $e->getMessage());
            throw new Exception("E-Mail konnte nicht versendet werden.");
        } finally {
            $this->mail->clearAddresses();
        }
    }
}