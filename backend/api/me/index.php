<?php

declare(strict_types=1);
require_once __DIR__ . '/../_bootstrap.php';

/* DEBUG: permite test din browser: /me/index.php?uid=1 (admin) sau ?uid=2 (user) */
if (!isset($_SERVER['HTTP_X_USER_ID']) && isset($_GET['uid'])) {
    $_SERVER['HTTP_X_USER_ID'] = preg_replace('/\D+/', '', $_GET['uid'] ?? '');
}

$pdo = db();

try {
    $me = current_user($pdo);
} catch (Throwable $e) {
    json_err('current_user() failed: ' . $e->getMessage(), 500);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    json_ok($me);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $in = json_input();
    $stmt = $pdo->prepare(
        "UPDATE users SET nume=?, telefon=?, email=?, adresa=? WHERE user_id=?"
    );
    $stmt->execute([
        $in['nume'] ?? $me['nume'],
        $in['telefon'] ?? $me['telefon'],
        $in['email'] ?? $me['email'],
        $in['adresa'] ?? $me['adresa'],
        $me['user_id']
    ]);

    // reîncărcăm userul și păstrăm role
    $stmt = $pdo->prepare("SELECT user_id, nume, telefon, email, adresa FROM users WHERE user_id=?");
    $stmt->execute([$me['user_id']]);
    $u = $stmt->fetch(PDO::FETCH_ASSOC);
    $u['role'] = $me['role'];
    json_ok($u);
}

json_err("Method Not Allowed", 405);