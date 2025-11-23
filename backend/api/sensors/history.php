<?php

declare(strict_types=1);

require_once __DIR__ . '/../_bootstrap.php';

// DEBUG din browser (ex: ?uid=3)
if (!isset($_SERVER['HTTP_X_USER_ID']) && isset($_GET['uid'])) {
    $_SERVER['HTTP_X_USER_ID'] = preg_replace('/\D+/', '', $_GET['uid'] ?? '');
}

$pdo = db();
$me  = current_user($pdo);

$boardId = $_GET['boardId'] ?? '';
$key     = $_GET['key']      ?? '';
$range   = $_GET['range']    ?? '24h';

// whitelist câmpuri din C_SNDATA (evită SQL injection pe numele coloanei)
$allowed = ['TEMPAER', 'UMDTAER', 'UMDTSOL1', 'UMDTSOL2', 'UMDTSOL3', 'UMDTSOL4', 'ILUMINARE', 'NIVELAPA', 'CALITAER'];

if ($boardId === '' || $key === '') {
    json_err('Missing boardId or key', 400);
}
if (!in_array($key, $allowed, true)) {
    json_err('Cheie senzor invalidă', 400);
}

// ACL: admin vede tot; altfel owner sau în board_access
if (!user_can_access_board($pdo, (int)$me['user_id'], $me['role'] ?? 'user', $boardId)) {
    json_err('Placa nu aparține utilizatorului', 403);
}

// interval
$now = new DateTimeImmutable('now');
switch ($range) {
    case '24h':
        $since = $now->modify('-24 hours');
        break;
    case '3d':
        $since = $now->modify('-3 days');
        break;
    case '7d':
        $since = $now->modify('-7 days');
        break;
    case '30d':
        $since = $now->modify('-30 days');
        break;
    case '90d':
        $since = $now->modify('-90 days');
        break;
    default:
        $since = $now->modify('-24 hours');
        break;
}

$sinceStr = $since->format('Y-m-d H:i:s');
$untilStr = $now->format('Y-m-d H:i:s');

// agregare pe oră (AVG)
$sql = "
SELECT
  DATE_FORMAT(s.STIMEACQ, '%Y-%m-%d %H:00:00') AS ts,
  AVG(s.$key) AS val
FROM C_SNDATA s
WHERE s.SBOARDID = ?
  AND s.STIMEACQ BETWEEN ? AND ?
GROUP BY DATE_FORMAT(s.STIMEACQ, '%Y-%m-%d %H:00:00')
ORDER BY ts ASC
";

$stmt = $pdo->prepare($sql);
$stmt->execute([$boardId, $sinceStr, $untilStr]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$points = array_map(static function ($r) {
    return [
        'ts'  => $r['ts'],
        'val' => is_null($r['val']) ? null : (float)$r['val'],
    ];
}, $rows);

json_ok($points);