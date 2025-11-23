<?php
// serty/backend/api/_bootstrap.php
declare(strict_types=1);

/**
 *  Bootstrap comun pentru toate endpoint-urile API
 *  - CORS corect (inclusiv pentru requests cu credentials)
 *  - Preflight OPTIONS
 *  - Conexiune DB și helper-e JSON
 *  - current_user() + user_can_access_board()
 */

/* ---------- CORS (înainte de orice output) ---------- */
$allowedOrigins = [
    'http://localhost:5173',
    'https://serty.ro',
];

// Originul care a făcut requestul (dacă există)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Dacă originul e în whitelist, răspundem cu el și permitem credentials.
// Altfel, permitem doar acces generic (fără credentials).
if ($origin && in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
} else {
    header('Access-Control-Allow-Origin: https://serty.ro');
    // Fără Allow-Credentials aici ca să nu violăm CORS
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-User-Id');

// Preflight: răspundem fără body și ieșim
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/* ---------- Răspunsurile noastre sunt JSON ---------- */
header('Content-Type: application/json; charset=utf-8');

/* ---------- DEBUG (dezactivează în producție) ---------- */
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

/* ---------- DB ---------- */
require_once __DIR__ . '/lib/db.php';

/* ---------- Helper-e JSON ---------- */
function json_input(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function json_ok($data = null, int $code = 200): void
{
    http_response_code($code);
    echo json_encode(['ok' => true, 'data' => $data], JSON_UNESCAPED_UNICODE);
    exit;
}

function json_err(string $msg, int $code = 400): never
{
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

function to_bool($v): int
{
    return ($v === true || $v === 1 || $v === '1' || $v === 'true' || $v === 'on') ? 1 : 0;
}

/* ---------- Autentificare simplă (temporar) ---------- */
/**
 * Acceptă:
 *  - Header "X-User-Id" (numeric)
 *  - Parametru GET ?uid= (doar pentru test rapid din browser)
 * Returnează: user_id, nume, telefon, email, adresa, role
 */
function current_user(PDO $pdo): array
{
    // Permite test din browser: ?uid=3 / ?uid=4
    if (!isset($_SERVER['HTTP_X_USER_ID']) && isset($_GET['uid'])) {
        $_SERVER['HTTP_X_USER_ID'] = preg_replace('/\D+/', '', $_GET['uid'] ?? '');
    }

    $hdr = $_SERVER['HTTP_X_USER_ID'] ?? null;
    if ($hdr && ctype_digit($hdr)) {
        $stmt = $pdo->prepare("SELECT user_id, nume, telefon, email, adresa, role FROM users WHERE user_id = ?");
        $stmt->execute([$hdr]);
        $u = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($u) return $u;
    }

    // Fallback de test (până finalizezi loginul real):
    foreach ([3, 4] as $id) {
        $stmt = $pdo->prepare("SELECT user_id, nume, telefon, email, adresa, role FROM users WHERE user_id = ? LIMIT 1");
        $stmt->execute([$id]);
        if ($u = $stmt->fetch(PDO::FETCH_ASSOC)) {
            return $u;
        }
    }

    json_err('Neautentificat', 401);
}

/* ---------- ACL: drepturi pe plăci ---------- */
/**
 * admin = vede toate plăcile
 * user  = vede plăcile deținute (boards.user_id = user_id) SAU cele partajate în board_access
 */
function user_can_access_board(PDO $pdo, int $userId, string $role, string $boardId): bool
{
    if ($role === 'admin') return true;

    $sql = "
        SELECT 1
        FROM boards b
        WHERE b.board_id = ?
          AND (
                b.user_id = ?
                OR EXISTS (
                    SELECT 1 FROM board_access ba
                    WHERE ba.board_id = b.board_id
                      AND ba.user_id = ?
                )
          )
        LIMIT 1
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$boardId, $userId, $userId]);
    return (bool)$stmt->fetchColumn();
}