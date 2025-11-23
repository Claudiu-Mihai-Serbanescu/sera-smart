<?php
require_once __DIR__ . '/../_bootstrap.php';
if (!isset($_SERVER['HTTP_X_USER_ID']) && isset($_GET['uid'])) {
  $_SERVER['HTTP_X_USER_ID'] = preg_replace('/\D+/', '', $_GET['uid'] ?? '');
}
$pdo = db();
$me  = current_user($pdo);

if (($me['role'] ?? 'user') === 'admin') {
  $stmt = $pdo->query("SELECT board_id, user_id, nume_placa, locatie FROM boards ORDER BY board_id");
  json_ok($stmt->fetchAll());
}

$sql = "
  SELECT DISTINCT b.board_id, b.user_id, b.nume_placa, b.locatie
  FROM boards b
  LEFT JOIN board_access a ON a.board_id = b.board_id
  WHERE b.user_id = :uid OR a.user_id = :uid
  ORDER BY b.board_id
";
$stmt = $pdo->prepare($sql);
$stmt->execute([':uid' => $me['user_id']]);
json_ok($stmt->fetchAll());