<?php

namespace Backend\Database;

use Exception;
use PDO;

class DatabaseHandler
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getAllAbgabenin48h(): array
    {
        $sql = "SELECT a.Rückgabedatum as Rückgabedatum, w.Barcode as Barcode, w.Bezeichnung as Bezeichnung, m.Vorname as Vorname, m.Nachname as Nachname , m.Email as Email
                FROM Ausleihe a
                JOIN Werkzeuge w ON a.Barcode = w.Barcode
                JOIN Mitarbeiter m ON a.Mitarbeiter_ID = m.Mitarbeiter_ID
                WHERE a.Rückgabedatum >= NOW() - INTERVAL 48 HOUR
                AND (a.EmailVersendet IS NULL OR a.EmailVersendet = 0)";
        return $this->pdo->query($sql)->fetchAll();
    }

    public function getAllWerkzeuge(): array
    {
        $sql = "SELECT w.Barcode as Barcode, w.Bezeichnung as Bezeichnung, t.Art as Typ, w.Anschaffungsdatum as Anschaffungsdatum, s.Bezeichnung as Status
                FROM Werkzeuge w
                JOIN Status s ON w.Status_ID = s.Status_ID
                JOIN Werkzeugtyp t ON w.Typ_ID = t.Typ_ID";
        return $this->pdo->query($sql)->fetchAll();
    }

    public function getAllWerkzeugeTypen(): array
    {
        $sql = "SELECT t.Art as Typ 
                FROM Werkzeugtyp t";
        return $this->pdo->query($sql)->fetchAll(PDO::FETCH_COLUMN);
    }

    public function getAllMitarbeiter(): array
    {
        $sql = "SELECT m.Vorname as Vorname, m.Nachname as Nachname , m.Email as Email, m.username as Username, m.Abteilung as Abteilung
                FROM Mitarbeiter m";
        return $this->pdo->query($sql)->fetchAll();
    }

    public function leiheWerkzeug(string $barcode, int $mitarbeiterId): bool
    {
        $this->pdo->beginTransaction();
        try {
            $sqlAusleihe = "INSERT INTO Ausleihe (Ausleihdatum, Mitarbeiter_ID, Barcode, EmailVersendet) 
                            VALUES (CURDATE(), ?, ?, 0)";
            $stmt1 = $this->pdo->prepare($sqlAusleihe);
            $stmt1->execute([$mitarbeiterId, $barcode]);

            $sqlStatus = "UPDATE Werkzeuge SET Status_ID = 2 WHERE Barcode = ?";
            $stmt2 = $this->pdo->prepare($sqlStatus);
            $stmt2->execute([$barcode]);

            return $this->pdo->commit();
        } catch (Exception $eception) {
            error_log("Fehler in leiheWerkzeug: " . $eception->getMessage());
            $this->pdo->rollBack();
            return false;
        }
    }

    public function gebeWerkzeugZurueck(string $barcode, string $zustand): bool
    {
        $this->pdo->beginTransaction();
        try {

            $sqlAusleihe = "UPDATE Ausleihe 
                            SET Rückgabedatum = CURDATE(), ZustandBeiRückgabe = ? 
                            WHERE Barcode = ? AND Rückgabedatum IS NULL";
            $stmt1 = $this->pdo->prepare($sqlAusleihe);
            $stmt1->execute([$zustand, $barcode]);

        
            $sqlStatus = "UPDATE Werkzeuge SET Status_ID = 1 WHERE Barcode = ?";
            $stmt2 = $this->pdo->prepare($sqlStatus);
            $stmt2->execute([$barcode]);

            return $this->pdo->commit();
        } catch (Exception $eception) {
            error_log("Fehler in gebeWerkzeugZurueck: " . $eception->getMessage());
            $this->pdo->rollBack();
            return false;
        }
    }
}