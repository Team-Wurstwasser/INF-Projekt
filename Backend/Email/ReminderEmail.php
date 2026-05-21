<?php

namespace Backend\Email;

use Exception;

/**
 * ReminderEmail
 *
 * Baut standardisierte Erinnerungs-E-Mails für auslaufende Ausleihen und
 * verwendet EmailService zum Versenden.
 */
class ReminderEmail
{
    private $emailService;

    public function __construct()
    {
        $this->emailService = new EmailService();
    }

    /**
     * Sendet eine Erinnerungs-E-Mail mit Titel, Nachricht und Angaben zum Gegenstand.
     *
     * @param string $toEmail Empfänger-E-Mail
     * @param string $toName Empfänger-Name
     * @param string $reminderTitle Kurzer Titel der Erinnerung
     * @param string $reminderMessage Nachrichtentext
     * @param string $gegenstand Beschreibung des zurückzugebenden Gegenstands
     * @param string $rückgabeTermin Datum der Fälligkeit
     * @return bool true bei erfolgreichem Versand
     * @throws Exception wenn das Senden fehlschlägt
     */
    public function sendEmail($toEmail, $toName, $reminderTitle, $reminderMessage, $gegenstand, $rückgabeTermin)
    {
        try {
            // Baut Subject und HTML-Body zusammen und nutzt EmailService zum Senden
            $subject = "Erinnerung: " . $reminderTitle;

            $body = $this->generateEmailTemplate($toName, $reminderTitle, $reminderMessage, $gegenstand, $rückgabeTermin);

            return $this->emailService->sendEmail($toEmail, $toName, $subject, $body);
        } catch (Exception $exception) {
            error_log("E-Mail Sende-Fehler an " . $toEmail . ": " . $exception->getMessage());
            throw new Exception("E-Mail konnte nicht versendet werden.");
        }
    }

    /**
     * Generiert das HTML-Template für die Erinnerungs-E-Mail.
     *
     * @return string HTML-String der E-Mail
     */
    private function generateEmailTemplate($toName, $reminderTitle, $reminderMessage, $gegenstand, $rückgabeTermin)
    {
        $dateRow = '
        <tr>
            <td style="padding-top: 15px; border-top: 1px solid #f1f1f1; color: #e74c3c;">
                <strong>Rückgabetermin:</strong> ' . htmlspecialchars($rückgabeTermin) . '
            </td>
        </tr>';

        $template = '
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f4f4f4; font-family: Arial, sans-serif; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; }
        .device-info { background-color: #ffffff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .button { background-color: #0000bf; color: #ffffff !important; padding: 14px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; }
    </style>
</head>
<body>
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e1e1e1; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <tr>
                        <td align="left" style="background-color: #0000bf; padding: 25px 40px; color: #ffffff;">
                            <h1 style="margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 0.5px;">Easy Inventory</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px; color: #333333; line-height: 1.6;">
                            <h2 style="margin-top: 0; color: #0000bf; font-size: 20px;">' . htmlspecialchars($reminderTitle) . '</h2>
                            <p>Hallo ' . htmlspecialchars($toName) . ',</p>
                            <p>' . nl2br(htmlspecialchars($reminderMessage)) . '</p>
                            
                            <div class="device-info">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="padding-bottom: 10px;">
                                            <strong>Gegenstand:</strong> ' . htmlspecialchars($gegenstand) . '
                                        </td>
                                    </tr>
                                    ' . $dateRow . '
                                </table>
                            </div>
                            
                            <p>Bitte stelle sicher, dass das Werkzeug bis zum genannten Termin zurückgegeben oder die Leihfrist im Portal verlängert wird.</p>
                            <br>
                            <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <a href="https://mhp.hallo123wert.de/" class="button">Jetzt im Portal bearbeiten</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>';

        return $template;
    }
}
