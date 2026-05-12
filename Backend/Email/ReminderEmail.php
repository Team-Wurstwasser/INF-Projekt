<?php

namespace Backend\Email;

class ReminderEmail
{
    private $emailService;
    
    public function __construct()
    {
        $this->emailService = new EmailService();
    }
    
    public function sendEmail($toEmail, $toName, $reminderTitle, $reminderMessage, $reminderDate = '')
    {
        try {
            $subject = "Erinnerung: " . $reminderTitle;
            $body = "<h2>Hallo " . $toName . "</h2>" .
                    "<p>" . $reminderMessage . "</p>" .
                    ($reminderDate ? "<p>Datum: " . $reminderDate . "</p>" : "");

            return $this->emailService->sendEmail($toEmail, $toName, $subject, $body);
        
        } catch (\Exception $e) {
            throw new \Exception("E-Mail konnte nicht versendet werden: " . $e->getMessage());
        }
    }
}