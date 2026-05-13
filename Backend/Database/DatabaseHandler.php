<?php

namespace Backend\Database;

use Exception;

class DatabaseHandler
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getAllWerkzeuge(): array
    {
        $sql = "SELECT w.*, s.Bezeichnung as Status_Klartext, t.Art as Typ_Art 
                FROM Werkzeuge w
                JOIN Status s ON w.Status_ID = s.Status_ID
                JOIN Werkzeugtyp t ON w.Typ_ID = t.Typ_ID";
        return $this->pdo->query($sql)->fetchAll();
    }

    public function createWerkzeug(string $barcode, string $bezeichnung, string $datum, int $statusId, int $typId): bool
    {
        $sql = "INSERT INTO Werkzeuge (Barcode, Bezeichnung, Anschaffungsdatum, Status_ID, Typ_ID) 
                VALUES (?, ?, ?, ?, ?)";
        return $this->pdo->prepare($sql)->execute([$barcode, $bezeichnung, $datum, $statusId, $typId]);
    }

    public function checkoutWerkzeug(string $barcode, int $mitarbeiterId): bool
    {
        $this->pdo->beginTransaction();
        try {
            $this->pdo->prepare("UPDATE Werkzeuge SET Status_ID = 2 WHERE Barcode = ?")
                      ->execute([$barcode]);

            $this->pdo->prepare("INSERT INTO Ausleihe (Ausleihdatum, Mitarbeiter_ID, Barcode) VALUES (CURDATE(), ?, ?)")
                      ->execute([$mitarbeiterId, $barcode]);

            $this->pdo->commit();
            return true;
        } catch (Exception $exception) {
            $this->pdo->rollBack();
            error_log("Fehler beim Checkout (Barcode: $barcode): " . $exception->getMessage());
            throw new Exception("Interner Datenbankfehler.");
        }
    }

    public function checkinWerkzeug(string $barcode, string $zustand): bool
    {
        $this->pdo->beginTransaction();
        try {
            $this->pdo->prepare("UPDATE Werkzeuge SET Status_ID = 1 WHERE Barcode = ?")
                      ->execute([$barcode]);

            $sql = "UPDATE Ausleihe SET Rückgabedatum = CURDATE(), ZustandBeiRückgabe = ? 
                    WHERE Barcode = ? AND Rückgabedatum IS NULL";
            $this->pdo->prepare($sql)->execute([$zustand, $barcode]);

            $this->pdo->commit();
            return true;
        } catch (Exception $exception) {
            $this->pdo->rollBack();
            error_log("Fehler beim Check-in (Barcode: $barcode): " . $exception->getMessage());
            throw new Exception("Interner Datenbankfehler.");
        }
    }
    
    public function getAllMitarbeiter(): array
    {
        return $this->pdo->query("SELECT * FROM Mitarbeiter")->fetchAll();
    }
}