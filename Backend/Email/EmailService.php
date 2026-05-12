<?php

namespace Backend\Email;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class EmailService
{
    private $mail;
    
    public function __construct()
    {
        $this->mail = new PHPMailer(true);
        $this->configureSMTP();
    }
    
    private function configureSMTP()
    {
        try {
            $this->mail->isSMTP();
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
    
    public function sendEmail($toEmail, $toName, $subject, $body, $altBody = '')
    {
        try {
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
    
    public function getMailer()
    {
        return $this->mail;
    }
}