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

    public function addWerkzeug(string $barcode, string $bezeichnung, int $typId, string $anschaffungsdatum = '', int $statusId = 1): bool
    {
        try {
            if ($anschaffungsdatum !== '') {
                $sql = "INSERT INTO Werkzeuge (Barcode, Bezeichnung, Typ_ID, Anschaffungsdatum, Status_ID)
                        VALUES (?, ?, ?, ?, ?)";
                $stmt = $this->pdo->prepare($sql);
                return $stmt->execute([$barcode, $bezeichnung, $typId, $anschaffungsdatum, $statusId]);
            }

            $sql = "INSERT INTO Werkzeuge (Barcode, Bezeichnung, Typ_ID, Anschaffungsdatum, Status_ID)
                    VALUES (?, ?, ?, CURDATE(), ?)";
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([$barcode, $bezeichnung, $typId, $statusId]);
        } catch (Exception $exception) {
            error_log("Fehler in addWerkzeug: " . $exception->getMessage());
            return false;
        }
    }

    public function deleteWerkzeug(string $barcode): bool
    {
        $this->pdo->beginTransaction();
        try {
            $sqlAusleihe = "DELETE FROM Ausleihe WHERE Barcode = ?";
            $stmt1 = $this->pdo->prepare($sqlAusleihe);
            $stmt1->execute([$barcode]);

            $sqlWerkzeug = "DELETE FROM Werkzeuge WHERE Barcode = ?";
            $stmt2 = $this->pdo->prepare($sqlWerkzeug);
            $stmt2->execute([$barcode]);

            return $this->pdo->commit();
        } catch (Exception $exception) {
            error_log("Fehler in deleteWerkzeug: " . $exception->getMessage());
            $this->pdo->rollBack();
            return false;
        }
    }

    public function addWerkzeugTyp(string $art): bool
    {
        try {
            $sql = "INSERT INTO Werkzeugtyp (Art) VALUES (?)";
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([$art]);
        } catch (Exception $exception) {
            error_log("Fehler in addWerkzeugTyp: " . $exception->getMessage());
            return false;
        }
    }

    public function deleteWerkzeugTyp(string $art): bool
    {
        $this->pdo->beginTransaction();
        try {
            $sqlTyp = "SELECT Typ_ID FROM Werkzeugtyp WHERE Art = ? LIMIT 1";
            $stmtTyp = $this->pdo->prepare($sqlTyp);
            $stmtTyp->execute([$art]);
            $typId = $stmtTyp->fetchColumn();

            if ($typId === false) {
                $this->pdo->rollBack();
                return false;
            }

            $sqlWerkzeuge = "SELECT COUNT(*) FROM Werkzeuge WHERE Typ_ID = ?";
            $stmtCount = $this->pdo->prepare($sqlWerkzeuge);
            $stmtCount->execute([(int)$typId]);

            if ((int)$stmtCount->fetchColumn() > 0) {
                $this->pdo->rollBack();
                return false;
            }

            $sqlDelete = "DELETE FROM Werkzeugtyp WHERE Typ_ID = ?";
            $stmtDelete = $this->pdo->prepare($sqlDelete);
            $stmtDelete->execute([(int)$typId]);

            return $this->pdo->commit();
        } catch (Exception $exception) {
            error_log("Fehler in deleteWerkzeugTyp: " . $exception->getMessage());
            $this->pdo->rollBack();
            return false;
        }
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
                            SET ZustandBeiRückgabe = ? 
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