<?php
// serty/backend/api/me/request_reset.php
declare(strict_types=1);
require_once __DIR__ . '/../_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method Not Allowed', 405);

$pdo = db();
$in = json_input();
$email = trim($in['email'] ?? '');
if (!$email) json_err('Email lipsă', 400);

$stmt = $pdo->prepare('SELECT user_id, email FROM users WHERE email=? LIMIT 1');
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Răspunde „OK” chiar dacă emailul nu există (pentru a nu dezvălui existența contului)
if (!$user) json_ok(['message' => 'Dacă emailul există, vei primi instrucțiuni.']);

$token = bin2hex(random_bytes(32)); // 64 chars
$tokenHash = password_hash($token, PASSWORD_DEFAULT);
$expiresAt = (new DateTime('+30 minutes'))->format('Y-m-d H:i:s');

// upsert pe user_id ca PK (un singur token activ per user)
$pdo->prepare('REPLACE INTO password_resets (user_id, token_hash, expires_at) VALUES (?,?,?)')
    ->execute([$user['user_id'], $tokenHash, $expiresAt]);

$link = 'https://serty.ro/reset-parola?token=' . urlencode($token);

// trimite mail – înlocuiește cu integrările tale (SMTP, etc.)
$subj = 'Resetare parolă cont Serty';
$body = "Salut,\n\nAm primit o cerere de resetare a parolei. Apasă linkul (valabil 30 min):\n\n$link\n\nDacă nu ai cerut tu, ignoră acest mesaj.";
@mail($user['email'], $subj, $body, 'From: no-reply@serty.ro');

json_ok(['message' => 'Dacă emailul există, vei primi instrucțiuni.']);