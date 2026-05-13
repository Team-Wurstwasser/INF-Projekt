<?php

namespace Backend\Database;

use PDO;

class DatabaseHandler
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
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
        $sql = "SELECT m.Vorname as Vorname, m.Nachname as Nachname , m.Email as Email, m.Abteilung as Abteilung
                FROM Mitarbeiter m";
        return $this->pdo->query($sql)->fetchAll();
    }
}