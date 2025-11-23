<?php

declare(strict_types=1);

// Încarcă bootstrap-ul (CORS, helpers, auth etc)
require_once dirname(__DIR__, 2) . '/_bootstrap.php';

/**
 * Obține un PDO funcțional din diferite surse (bootstrap, config, helpers) sau îl construiește.
 * Aruncă RuntimeException cu mesaj clar dacă nu reușește.
 *
 * @return PDO
 */
function ensure_pdo(): PDO
{
    // 1) $pdo global expus de bootstrap?
    if (isset($GLOBALS['pdo']) && $GLOBALS['pdo'] instanceof PDO) {
        return $GLOBALS['pdo'];
    }

    // 2) variabilă locală din include (uneori e setată, dar nu în $GLOBALS)
    if (isset($pdo) && $pdo instanceof PDO) {
        return $pdo;
    }

    // 3) DSN/constante tipice din bootstrap/config
    if (defined('DB_DSN') && defined('DB_USER')) {
        $pdo = new PDO(
            DB_DSN,
            DB_USER,
            defined('DB_PASS') ? DB_PASS : '',
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );
        return $pdo;
    }
    if (defined('DB_HOST') && defined('DB_NAME') && defined('DB_USER')) {
        $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_NAME);
        $pdo = new PDO(
            $dsn,
            DB_USER,
            defined('DB_PASS') ? DB_PASS : '',
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );
        return $pdo;
    }

    // 4) Include helper-e uzuale și încearcă funcții cunoscute
    $candidates = [
        dirname(__DIR__, 2) . '/lib/db.php',
        dirname(__DIR__, 2) . '/config/db.php',
        dirname(__DIR__, 3) . '/backend/lib/db.php',
        dirname(__DIR__, 3) . '/backend/config/db.php',
    ];
    foreach ($candidates as $f) {
        if (is_file($f)) {
            require_once $f;
        }
    }
    foreach (['pdo', 'db', 'get_pdo', 'getPdo', 'Database::getConnection'] as $fn) {
        if ($fn === 'Database::getConnection' && class_exists('Database') && method_exists('Database', 'getConnection')) {
            $pdo = Database::getConnection();
            if ($pdo instanceof PDO) return $pdo;
        } elseif (function_exists($fn)) {
            $pdo = call_user_func($fn);
            if ($pdo instanceof PDO) return $pdo;
        }
    }

    throw new RuntimeException('Nu pot obține conexiunea PDO: $pdo inexistent și niciun config/DSN valid găsit.');
}

try {
    $pdo = ensure_pdo();

    // AUTH + ACL (dacă nu ai aceste funcții, comentează-le temporar pentru test)
    $user   = current_user($pdo); // aruncă 401 dacă nu e logat
    $userId = (int)$user['user_id'];
    $role   = (string)$user['role'];

    // Parametru
    $boardId = $_GET['boardId'] ?? '';
    if (!preg_match('/^[a-zA-Z0-9_-]{4,64}$/', $boardId)) {
        json_err('Parametru invalid: boardId', 400);
    }

    // ACL (comentează linia următoare dacă nu ai implementarea încă, doar pentru a testa DB-ul)
    if (!user_can_access_board($pdo, $userId, $role, $boardId)) {
        json_err('Acces interzis la această placă', 403);
    }

    // Query pe C_SNDATA (conform structurii tale)
    $sql = "
        SELECT
            `TEMPAER`,
            `UMDTAER`,
            `UMDTSOL1`,
            `UMDTSOL2`,
            `UMDTSOL3`,
            `UMDTSOL4`,
            `ILUMINARE`,
            `NIVELAPA`,
            `CALITAER`,
            `STIMEACQ` AS `created_at`
        FROM `C_SNDATA`
        WHERE `SBOARDID` = :boardId
        ORDER BY `STIMEACQ` DESC, `SDATA_ID` DESC
        LIMIT 1
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':boardId' => $boardId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    header('Content-Type: application/json; charset=utf-8');
    echo $row ? json_encode($row, JSON_UNESCAPED_UNICODE)
        : json_encode(new stdClass(), JSON_UNESCAPED_UNICODE);
    exit;
} catch (Throwable $e) {
    $dbg = isset($_GET['dbg']) && $_GET['dbg'] === '1';
    error_log('[sensors/latest] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(
        $dbg ? ['ok' => false, 'error' => $e->getMessage()]
            : ['ok' => false, 'error' => 'Internal Server Error'],
        JSON_UNESCAPED_UNICODE
    );
    exit;
}