<?php
// Match ResourceLoader::validateScriptFile, including its ES2019 language level.
$root = $argv[1] ?? '';
$peast = $argv[2] ?? '';
$baseline = $argv[3] ?? '';
$loaders = $argv[4] ?? $root;
if (!is_dir($root) || !is_dir($peast . '/lib/Peast')) {
    fwrite(STDERR, "Usage: php check_server_grammar.php dist/2.13.0 path/to/peast\n");
    exit(2);
}
spl_autoload_register(function ($class) use ($peast) {
    $prefix = 'Peast\\';
    if (strncmp($class, $prefix, strlen($prefix)) === 0) {
        require_once $peast . '/lib/Peast/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    }
});
$inputs = [
    ['common', file_get_contents($loaders . '/Carregador_common_js_RevisaWiki_v2_13_0.js'), false],
    ['community', file_get_contents($loaders . '/Carregador_comunitario_RevisaWiki_v2_13_0.js'), false],
    ['negative-optional-call', 'window.callback?.(1);', true],
    ['negative-optional-property', 'window.object?.property;', true],
    ['compatible-call', 'if (window.callback != null) { window.callback.call(window, 1); }', false],
    ['compatible-property', 'window.object == null ? undefined : window.object.property;', false],
];
foreach (glob($root . '/Chamada_fixa_*.js') as $file) {
    $inputs[] = [basename($file), file_get_contents($file), false];
}
if ($baseline !== '') {
    foreach (['Carregador_common_js_RevisaWiki_v2_13_0.js', 'Carregador_comunitario_RevisaWiki_v2_13_0.js'] as $file) {
        $inputs[] = ['baseline-' . $file, file_get_contents($baseline . '/' . $file), true];
    }
}
$results = [];
$failed = 0;
foreach ($inputs as [$name, $source, $expectError]) {
    $error = null;
    try {
        \Peast\Peast::ES2019($source)->parse();
    } catch (\Peast\Syntax\Exception $e) {
        $error = ['message' => $e->getMessage(), 'line' => $e->getPosition()->getLine()];
    }
    $pass = ($error !== null) === $expectError;
    if (!$pass) { $failed++; }
    $results[] = ['case' => $name, 'sha256' => hash('sha256', $source), 'expectedError' => $expectError, 'error' => $error, 'pass' => $pass];
}
foreach (glob($root . '/*.js') as $file) {
    $source = file_get_contents($file);
    // A save-time signature substitution must not change a JavaScript file.
    $pass = strpos($source, str_repeat('~', 3)) === false;
    if (!$pass) { $failed++; }
    $results[] = ['case' => 'save-transform-safe-' . basename($file), 'sha256' => hash('sha256', $source), 'pass' => $pass];
}
$oldFence = '/^[ \t]{0,3}(?:`{3}|' . str_repeat('~', 3) . ')/m';
$newFence = '/^[ \t]{0,3}(?:`{3}|~{3})/m';
$fenceChecks = 0;
$fenceFailed = 0;
foreach (['', 'text', "line\n", "'", '<nowiki>'] as $prefix) {
    foreach (range(0, 5) as $indent) {
        foreach (range(0, 8) as $count) {
            foreach (['~', '`', '-', 'x'] as $mark) {
                foreach (['', 'text', "\nend"] as $suffix) {
                    $sample = $prefix . str_repeat(' ', $indent) . str_repeat($mark, $count) . $suffix;
                    $fenceChecks++;
                    if (preg_match($oldFence, $sample) !== preg_match($newFence, $sample)) { $fenceFailed++; }
                }
            }
        }
    }
}
if ($fenceFailed) { $failed++; }
$results[] = ['case' => 'signature-safe-fence-regex-equivalence', 'samples' => $fenceChecks, 'failed' => $fenceFailed, 'pass' => $fenceFailed === 0];
echo json_encode(['gate' => 'ResourceLoader Peast::ES2019 and save-time signature safety', 'peastVersion' => '1.18.0', 'cases' => count($results), 'failed' => $failed, 'results' => $results], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
exit($failed ? 1 : 0);
