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
        $sql = "SELECT a.Ausleih_ID as Ausleih_ID, DATE_ADD(a.Ausleihdatum, INTERVAL a.Ausleihdauer DAY) as Fälligkeitsdatum, w.Barcode as Barcode, w.Bezeichnung as Bezeichnung, m.Vorname as Vorname, m.Nachname as Nachname, m.Email as Email
                FROM Ausleihe a
                JOIN Werkzeuge w ON a.Barcode = w.Barcode
                JOIN Mitarbeiter m ON a.Mitarbeiter_ID = m.Mitarbeiter_ID
                WHERE a.Rückgabedatum IS NULL
                AND a.EmailVersendet = 0
                AND DATE_ADD(a.Ausleihdatum, INTERVAL a.Ausleihdauer DAY) <= (NOW() + INTERVAL 48 HOUR)
                AND DATE_ADD(a.Ausleihdatum, INTERVAL a.Ausleihdauer DAY) >= NOW()";

        return $this->pdo->query($sql)->fetchAll();
    }

    public function getAllAusgelieheneSachen(): array
    {
        $sql = "SELECT a.Ausleih_ID as Ausleih_ID, a.Ausleihdatum as Ausleihdatum, DATE_ADD(a.Ausleihdatum, INTERVAL a.Ausleihdauer DAY) as Fälligkeitsdatum, a.Barcode as Barcode, w.Bezeichnung as Bezeichnung, m.Vorname as Vorname, m.Nachname as Nachname, m.Email as Email
                FROM Ausleihe a
                JOIN Werkzeuge w ON a.Barcode = w.Barcode
                JOIN Mitarbeiter m ON a.Mitarbeiter_ID = m.Mitarbeiter_ID
                WHERE a.Rückgabedatum IS NULL";

        return $this->pdo->query($sql)->fetchAll();
    }

    public function getAusgeliehenHistorie(): array
    {
        $sql = "SELECT a.Ausleih_ID as Ausleih_ID, a.Ausleihdatum as Ausleihdatum, DATE_ADD(a.Ausleihdatum, INTERVAL a.Ausleihdauer DAY) as Fälligkeitsdatum, a.Rückgabedatum as Rückgabedatum, a.Barcode as Barcode, w.Bezeichnung as Bezeichnung, m.Vorname as Vorname, m.Nachname as Nachname, m.Email as Email, a.ZustandBeiRückgabe as ZustandBeiRückgabe
                FROM Ausleihe a
                JOIN Werkzeuge w ON a.Barcode = w.Barcode
                JOIN Mitarbeiter m ON a.Mitarbeiter_ID = m.Mitarbeiter_ID";

        return $this->pdo->query($sql)->fetchAll();
    }

    public function setEmailSent(int $ausleiId): bool
    {
        try {
            $sql = "UPDATE Ausleihe SET EmailVersendet = 1 WHERE Ausleih_ID = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$ausleiId]);
            return $stmt->rowCount() > 0;
        } catch (Exception $exception) {
            error_log("Fehler in setEmailSent: " . $exception->getMessage());
            return false;
    }
    }

    public function getAllWerkzeuge(): array
    {
        $sql = "SELECT w.Barcode as Barcode, w.Bezeichnung as Bezeichnung, t.Art as Typ, w.Anschaffungsdatum as Anschaffungsdatum, s.Bezeichnung as Status, s.Status_ID as Status_ID, t.Typ_ID as Typ_ID
                FROM Werkzeuge w
                JOIN Status s ON w.Status_ID = s.Status_ID
                JOIN Werkzeugtyp t ON w.Typ_ID = t.Typ_ID";
        return $this->pdo->query($sql)->fetchAll();
    }

    public function barcodeExists(string $barcode): bool
    {
        $sql = "SELECT COUNT(*) FROM Werkzeuge WHERE Barcode = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$barcode]);
        return $stmt->fetchColumn() > 0;
    }

    public function isValidEan13Barcode(string $barcode): bool
    {
        if (!preg_match('/^\d{13}$/', $barcode)) {
            return false;
        }

        $sum = 0;
        for ($i = 0; $i < 12; $i++) {
            $digit = (int)$barcode[$i];
            $sum += $digit * (($i % 2 === 0) ? 1 : 3);
        }

        $checkDigit = (10 - ($sum % 10)) % 10;

        return $checkDigit === (int)$barcode[12];
    }

    public function generateBarcode(): string
    {
        do {
            $randomDigits = mt_rand(0, 999999999);
            $baseCode = '200' . str_pad((string)$randomDigits, 9, '0', STR_PAD_LEFT);

            $sum = 0;
            for ($i = 0; $i < 12; $i++) {
                $sum += (int)$baseCode[$i] * ($i % 2 === 0 ? 1 : 3);
            }
            $checkDigit = (10 - ($sum % 10)) % 10;
        
            $fullBarcode = $baseCode . $checkDigit;
        
        } while ($this->barcodeExists($fullBarcode));

        return $fullBarcode;
    }

    public function getAllWerkzeugeTypen(): array
    {
        $sql = "SELECT t.Typ_ID as Typ_ID, t.Art as Typ 
                FROM Werkzeugtyp t";
        return $this->pdo->query($sql)->fetchAll();
    }

    public function getAllStatus(): array
    {
        $sql = "SELECT s.Status_ID as Status_ID, s.Bezeichnung as Bezeichnung
                FROM Status s";
        return $this->pdo->query($sql)->fetchAll();
    }

    public function getAllAbteilungen(): array
    {
        $sql = "SELECT a.Abteilung_ID as Abteilung_ID, a.Name as Name
                FROM Abteilung a";
        return $this->pdo->query($sql)->fetchAll();
    }

    public function addWerkzeug(string $barcode, string $bezeichnung, int $typId, string $anschaffungsdatum = ''): bool
    {
        try {
            if (!$this->isValidEan13Barcode($barcode)) {
                error_log("Fehler in addWerkzeug: Barcode ist kein gültiger EAN-13-Code.");
                return false;
            }

            if ($this->barcodeExists($barcode)) {
                error_log("Fehler in addWerkzeug: Barcode existiert bereits.");
                return false;
            }

            if ($anschaffungsdatum !== '') {
                $sql = "INSERT INTO Werkzeuge (Barcode, Bezeichnung, Typ_ID, Anschaffungsdatum, Status_ID)
                        VALUES (?, ?, ?, ?, 1)";
                $stmt = $this->pdo->prepare($sql);
                return $stmt->execute([$barcode, $bezeichnung, $typId, $anschaffungsdatum]);
            }

            $sql = "INSERT INTO Werkzeuge (Barcode, Bezeichnung, Typ_ID, Anschaffungsdatum, Status_ID)
                    VALUES (?, ?, ?, CURDATE(), 1)";
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([$barcode, $bezeichnung, $typId]);
        } catch (Exception $exception) {
            error_log("Fehler in addWerkzeug: " . $exception->getMessage());
            return false;
        }
    }

    public function updateWerkzeug(string $barcode, string $bezeichnung, int $typId, int $statusId, string $anschaffungsdatum = ''): bool
    {
        try {
            if ($anschaffungsdatum !== '') {
                $sql = "UPDATE Werkzeuge
                        SET Bezeichnung = ?, Typ_ID = ?, Status_ID = ?, Anschaffungsdatum = ?
                        WHERE Barcode = ?";
                $stmt = $this->pdo->prepare($sql);
                return $stmt->execute([$bezeichnung, $typId, $statusId, $anschaffungsdatum, $barcode]);
            }else {
                $sql = "UPDATE Werkzeuge
                        SET Bezeichnung = ?, Typ_ID = ?, Status_ID = ?
                        WHERE Barcode = ?";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([$bezeichnung, $typId, $statusId, $barcode]);
            }
            return $stmt->rowCount() > 0;
        } catch (Exception $exception) {
            error_log("Fehler in updateWerkzeug: " . $exception->getMessage());
            return false;
        }
    }

    public function updateWerkzeugStatus(string $barcode, int $statusId): bool
    {
        try {
            $sql = "UPDATE Werkzeuge SET Status_ID = ? WHERE Barcode = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$statusId, $barcode]);
            return $stmt->rowCount() > 0;
        } catch (Exception $exception) {
            error_log("Fehler in updateWerkzeugStatus: " . $exception->getMessage());
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

    public function addStatus(string $bezeichnung): bool
    {
        try {
            $sql = "INSERT INTO Status (Bezeichnung) VALUES (?)";
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([$bezeichnung]);
        } catch (Exception $exception) {
            error_log("Fehler in addStatus: " . $exception->getMessage());
            return false;
        }
    }

    public function addAbteilung(string $name): bool
    {
        try {
            $sql = "INSERT INTO Abteilung (Name) VALUES (?)";
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([$name]);
        } catch (Exception $exception) {
            error_log("Fehler in addAbteilung: " . $exception->getMessage());
            return false;
        }
    }

    public function updateWerkzeugTyp(int $typId, string $art): bool
    {
        try {
            $sql = "UPDATE Werkzeugtyp SET Art = ? WHERE Typ_ID = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$art, $typId]);
            return $stmt->rowCount() > 0;
        } catch (Exception $exception) {
            error_log("Fehler in updateWerkzeugTyp: " . $exception->getMessage());
            return false;
        }
    }

    public function updateStatus(int $statusId, string $bezeichnung): bool
    {
        try {
            $sql = "UPDATE Status SET Bezeichnung = ? WHERE Status_ID = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$bezeichnung, $statusId]);
            return $stmt->rowCount() > 0;
        } catch (Exception $exception) {
            error_log("Fehler in updateStatus: " . $exception->getMessage());
            return false;
        }
    }

    public function updateAbteilung(int $abteilungId, string $name): bool
    {
        try {
            $sql = "UPDATE Abteilung SET Name = ? WHERE Abteilung_ID = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$name, $abteilungId]);
            return $stmt->rowCount() > 0;
        } catch (Exception $exception) {
            error_log("Fehler in updateAbteilung: " . $exception->getMessage());
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

    public function deleteStatus(int $statusId): bool
    {
        $this->pdo->beginTransaction();
        try {
            $sqlCount = "SELECT COUNT(*) FROM Werkzeuge WHERE Status_ID = ?";
            $stmtCount = $this->pdo->prepare($sqlCount);
            $stmtCount->execute([$statusId]);

            if ((int)$stmtCount->fetchColumn() > 0) {
                $this->pdo->rollBack();
                return false;
            }

            $sqlDelete = "DELETE FROM Status WHERE Status_ID = ?";
            $stmtDelete = $this->pdo->prepare($sqlDelete);
            $stmtDelete->execute([$statusId]);

            return $this->pdo->commit();
        } catch (Exception $exception) {
            error_log("Fehler in deleteStatus: " . $exception->getMessage());
            $this->pdo->rollBack();
            return false;
        }
    }

    public function deleteAbteilung(int $abteilungId): bool
    {
        $this->pdo->beginTransaction();
        try {
            $sqlCount = "SELECT COUNT(*) FROM Mitarbeiter WHERE Abteilung_ID = ?";
            $stmtCount = $this->pdo->prepare($sqlCount);
            $stmtCount->execute([$abteilungId]);

            if ((int)$stmtCount->fetchColumn() > 0) {
                $this->pdo->rollBack();
                return false;
            }

            $sqlDelete = "DELETE FROM Abteilung WHERE Abteilung_ID = ?";
            $stmtDelete = $this->pdo->prepare($sqlDelete);
            $stmtDelete->execute([$abteilungId]);

            return $this->pdo->commit();
        } catch (Exception $exception) {
            error_log("Fehler in deleteAbteilung: " . $exception->getMessage());
            $this->pdo->rollBack();
            return false;
        }
    }

    public function getAllMitarbeiter(): array
    {
        $sql = "SELECT m.Mitarbeiter_ID as Mitarbeiter_ID, m.Vorname as Vorname, m.Nachname as Nachname , m.Email as Email, ab.Name as Abteilung, ab.Abteilung_ID as Abteilung_ID
                FROM Mitarbeiter m
                JOIN Abteilung ab ON m.Abteilung_ID = ab.Abteilung_ID";
        return $this->pdo->query($sql)->fetchAll();
    }

    public function isWerkzeugAusgeliehen(string $barcode): bool
    {
        try {
            $sql = "SELECT COUNT(*) FROM Ausleihe WHERE Barcode = ? AND Rückgabedatum IS NULL";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$barcode]);
            return $stmt->fetchColumn() > 0;
        } catch (Exception $exception) {
            error_log("Fehler in isWerkzeugAusgeliehen: " . $exception->getMessage());
            return false;
        }
    }

    public function addMitarbeiter(string $vorname, string $nachname, string $email, int $abteilungId): bool
    {
        try {
            $sql = "INSERT INTO Mitarbeiter (Vorname, Nachname, Email, Abteilung_ID) VALUES (?, ?, ?, ?)";
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([$vorname, $nachname, $email, $abteilungId]);
        } catch (Exception $exception) {
            error_log("Fehler in addMitarbeiter: " . $exception->getMessage());
            return false;
        }
    }

    public function updateMitarbeiter(int $mitarbeiterId, string $vorname, string $nachname, string $email, int $abteilungId): bool
    {
        try {
            $sql = "UPDATE Mitarbeiter SET Vorname = ?, Nachname = ?, Email = ?, Abteilung_ID = ? WHERE Mitarbeiter_ID = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$vorname, $nachname, $email, $abteilungId, $mitarbeiterId]);
            return $stmt->rowCount() > 0;
        } catch (Exception $exception) {
            error_log("Fehler in updateMitarbeiter: " . $exception->getMessage());
            return false;
        }
    }

    public function deleteMitarbeiter(int $mitarbeiterId): bool
    {
        $this->pdo->beginTransaction();
        try {
            $sqlAusleihe = "DELETE FROM Ausleihe WHERE Mitarbeiter_ID = ?";
            $stmtAusleihe = $this->pdo->prepare($sqlAusleihe);
            $stmtAusleihe->execute([$mitarbeiterId]);

            $sqlMitarbeiter = "DELETE FROM Mitarbeiter WHERE Mitarbeiter_ID = ?";
            $stmtMitarbeiter = $this->pdo->prepare($sqlMitarbeiter);
            $stmtMitarbeiter->execute([$mitarbeiterId]);

            return $this->pdo->commit();
        } catch (Exception $exception) {
            error_log("Fehler in deleteMitarbeiter: " . $exception->getMessage());
            $this->pdo->rollBack();
            return false;
        }
    }

    public function leiheWerkzeug(string $barcode, int $mitarbeiterId, int $ausleihdauer): bool
    {
        $this->pdo->beginTransaction();
        try {
            $sqlAusleihe = "INSERT INTO Ausleihe (Ausleihdatum, Ausleihdauer, Mitarbeiter_ID, Barcode, EmailVersendet) 
                            VALUES (CURDATE(), ?, ?, ?, 0)";
            $stmt1 = $this->pdo->prepare($sqlAusleihe);
            $stmt1->execute([$ausleihdauer, $mitarbeiterId, $barcode]);

            $sqlStatus = "UPDATE Werkzeuge SET Status_ID = 2 WHERE Barcode = ?";
            $stmt2 = $this->pdo->prepare($sqlStatus);
            $stmt2->execute([$barcode]);

            return $this->pdo->commit();
        } catch (Exception $exception) {
            error_log("Fehler in leiheWerkzeug: " . $exception->getMessage());
            $this->pdo->rollBack();
            return false;
        }
    }

    public function gebeWerkzeugZurueck(string $barcode, string $zustand): bool
    {
        $this->pdo->beginTransaction();
        try {

            $sqlAusleihe = "UPDATE Ausleihe 
                            SET ZustandBeiRückgabe = ?, Rückgabedatum = CURDATE()
                            WHERE Barcode = ? AND Rückgabedatum IS NULL";
            $stmt1 = $this->pdo->prepare($sqlAusleihe);
            $stmt1->execute([$zustand, $barcode]);

            if ($stmt1->rowCount() === 0) {
                $this->pdo->rollBack();
                return false;
            }

            $sqlStatus = "UPDATE Werkzeuge SET Status_ID = 1 WHERE Barcode = ?";
            $stmt2 = $this->pdo->prepare($sqlStatus);
            $stmt2->execute([$barcode]);

            return $this->pdo->commit();
        } catch (Exception $exception) {
            error_log("Fehler in gebeWerkzeugZurueck: " . $exception->getMessage());
            $this->pdo->rollBack();
            return false;
        }
    }

    public function extendAusleihen(int $ausleihId, int $zusatzTage): bool
    {
        try {
            $sql = "UPDATE Ausleihe SET Ausleihdauer = Ausleihdauer + ?, EmailVersendet = 0 WHERE Ausleih_ID = ? AND Rückgabedatum IS NULL";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$zusatzTage, $ausleihId]);
            return $stmt->rowCount() > 0;
        } catch (Exception $exception) {
            error_log("Fehler in extendAusleihen: " . $exception->getMessage());
            return false;
        }
    }
}
