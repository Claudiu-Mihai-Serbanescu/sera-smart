<?php
// serty/backend/api/me/password.php
declare(strict_types=1);
require_once __DIR__ . '/../_bootstrap.php';

try {
    $pdo = db();
    // opțional, dacă nu e deja setat în db()
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $me = current_user($pdo); // dacă nu e logat, helperul tău ar trebui să returneze 401 JSON

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        json_err("Method Not Allowed", 405);
    }

    $in   = json_input();
    $curr = $in['currentPassword'] ?? '';
    $new  = $in['newPassword'] ?? '';

    if (!$curr || !$new) {
        json_err("Parolele lipsesc", 400);
    }
    if (strlen($new) < 8) {
        json_err("Parola nouă trebuie să aibă minim 8 caractere", 400);
    }

    // Luăm toată linia pentru a fi toleranți la numele coloanei de parolă
    $stmt = $pdo->prepare("SELECT * FROM users WHERE user_id = ? LIMIT 1");
    $stmt->execute([$me['user_id']]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        json_err("Utilizator inexistent", 404);
    }

    // Acceptă mai multe denumiri posibile ale coloanei
    $pwdColCandidates = ['parola', 'password', 'password_hash', 'parola_hash'];
    $hash = null;
    foreach ($pwdColCandidates as $c) {
        if (array_key_exists($c, $row) && !empty($row[$c])) {
            $hash = (string)$row[$c];
            break;
        }
    }
    if ($hash === null) {
        // nu s-a găsit nicio coloană de parolă în tabel
        json_err("Config eroană: coloana parolei lipsește din tabela users", 500);
    }

    if (!password_verify($curr, $hash)) {
        json_err("Parola curentă invalidă", 403);
    }

    $newHash = password_hash($new, PASSWORD_DEFAULT);

    // Actualizează în aceeași coloană din care am citit
    $stmt = $pdo->prepare("UPDATE users SET {$c} = ? WHERE user_id = ?");
    $stmt->execute([$newHash, $me['user_id']]);

    json_ok(['message' => 'Parola a fost schimbată']);
} catch (Throwable $e) {
    // log de server (vezi în error_log)
    error_log("[/api/me/password] " . $e->getMessage());
    // răspuns JSON, nu HTML 500 de la webserver
    json_err("Eroare internă server", 500);
}