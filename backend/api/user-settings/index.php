<?php
// serty/backend/api/user-settings/index.php
declare(strict_types=1);
require_once __DIR__ . '/../_bootstrap.php';

$pdo = db();
$me = current_user($pdo);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare("SELECT * FROM user_settings WHERE user_id=? LIMIT 1");
    $stmt->execute([$me['user_id']]);
    $s = $stmt->fetch() ?: [];
    json_ok($s);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $in = json_input();

    // Există rând?
    $stmt = $pdo->prepare("SELECT setting_id FROM user_settings WHERE user_id=? LIMIT 1");
    $stmt->execute([$me['user_id']]);
    $exists = $stmt->fetchColumn();

    $fields = [
        'tipAbonament',
        'dataContract',
        'dataExpirare',
        'numarContract',
        'numeFerma',
        'cui',
        'suprafataTotala',
        'numarSere',
        'notificariEmail',
        'notificariSMS',
        'notificariPush',
        'alerteTemperatura',
        'alerteUmiditate',
        'alerteVent',
        'limba',
        'unitatiMasura',
        'fusOrar',
        'intervalActualizare'
    ];

    // normalizări minime
    $in['notificariEmail']   = to_bool($in['notificariEmail'] ?? 1);
    $in['notificariSMS']     = to_bool($in['notificariSMS'] ?? 0);
    $in['notificariPush']    = to_bool($in['notificariPush'] ?? 0);
    $in['alerteTemperatura'] = to_bool($in['alerteTemperatura'] ?? 1);
    $in['alerteUmiditate']   = to_bool($in['alerteUmiditate'] ?? 1);
    $in['alerteVent']        = to_bool($in['alerteVent'] ?? 1);

    if ($exists) {
        $set = [];
        $vals = [];
        foreach ($fields as $f) {
            $set[] = "$f = ?";
            $vals[] = $in[$f] ?? null;
        }
        $vals[] = $me['user_id'];
        $sql = "UPDATE user_settings SET " . implode(',', $set) . " WHERE user_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($vals);
    } else {
        $cols = implode(',', array_merge(['user_id'], $fields));
        $qs   = implode(',', array_fill(0, count($fields) + 1, '?'));
        $vals = [$me['user_id']];
        foreach ($fields as $f) $vals[] = $in[$f] ?? null;
        $stmt = $pdo->prepare("INSERT INTO user_settings ($cols) VALUES ($qs)");
        $stmt->execute($vals);
    }

    // returnăm starea curentă
    $stmt = $pdo->prepare("SELECT * FROM user_settings WHERE user_id=? LIMIT 1");
    $stmt->execute([$me['user_id']]);
    $s = $stmt->fetch() ?: [];
    json_ok($s);
}

json_err("Method Not Allowed", 405);