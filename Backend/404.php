<?php
http_response_code(404);
?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Seite nicht gefunden</title>
    <link rel="stylesheet" href="/style/style.css">
    <link rel="icon" type="image/png" href="/pics/favicon.png">
</head>
<body style="min-height: 100vh; display: flex; flex-direction: column;">
    <header class="header">
        <img class="header_logo" src="/pics/logo_big.png" alt="Easy Inventory Logo">
        <h1 id="title">Easy Inventory</h1>
    </header>

    <main style="flex: 1; display: flex; align-items: center; justify-content: center;">
        <div class="icon-header" style="width: 100%; justify-content: center;">
            <div style="width: 100%; text-align: center;">
                <h1 class="HeaderIconÜbersicht">Seite nicht gefunden</h1>
                <h1 style="font-size: 120px; line-height: 1; margin: 10px 0 20px; color: #000080;">404</h1>
                <p>Diese Seite gibt es hier nicht.</p>
                <p>Der Link ist vermutlich falsch, veraltet oder die Seite wurde verschoben.</p>
            </div>
        </div>
    </main>
</body>
</html>