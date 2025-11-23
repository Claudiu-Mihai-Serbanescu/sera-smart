<?php
// serty/backend/api/me/confirm_reset.php
declare(strict_types=1);
require_once __DIR__ . '/../_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method Not Allowed', 405);

$pdo = db();
$in = json_input();
$token = $in['token'] ?? '';
$new   = $in['newPassword'] ?? '';

if (!$token || !$new) json_err('Date lipsă', 400);

// găsește orice reset care nu e expirat
$stmt = $pdo->query('SELECT user_id, token_hash, expires_at FROM password_resets');
$resetRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
$match = null;
$now = new DateTime();

foreach ($resetRows as $row) {
    if ($now > new DateTime($row['expires_at'])) continue;
    if (password_verify($token, $row['token_hash'])) {
        $match = $row;
        break;
    }
}

if (!$match) json_err('Token invalid sau expirat', 400);

// setează noua parolă
$newHash = password_hash($new, PASSWORD_DEFAULT);
$pdo->prepare('UPDATE users SET parola=? WHERE user_id=?')
    ->execute([$newHash, $match['user_id']]);

// invalidează tokenul
$pdo->prepare('DELETE FROM password_resets WHERE user_id=?')->execute([$match['user_id']]);

json_ok(['message' => 'Parola a fost resetată']);