<?php
// serty/backend/api/lib/db.php
declare(strict_types=1);

/**
 * Ajustează credențialele DB.
 */
const DB_HOST = 'localhost';
const DB_NAME = 'greenhouse';
const DB_USER = 'greenhouse_user';
const DB_PASS = 'Ciocolata007!'; // sau parola ta

function db(): PDO
{
    static $pdo = null;
    if ($pdo) return $pdo;
    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    return $pdo;
}