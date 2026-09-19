# Copies the Anycubic Slicer Next access token to the clipboard.
#
# The token is never printed -- only where it was found, how long it is and
# when it expires. Paste it straight into the integration's config flow.
#
# Slicer Next 2.x logs it as `id_token=<jwt>` inside the portal URLs it opens.
# Up to 1.4.x it was a separate `accessToken = <jwt>` line, which 2.x no longer
# writes, so both spellings are searched and the newest hit wins.

$ErrorActionPreference = 'Stop'

$logDir = Join-Path $env:AppData 'AnycubicSlicerNext\log'

if (-not (Test-Path $logDir)) {
    throw "Kein Logverzeichnis unter $logDir - ist Slicer Next installiert und mindestens einmal gestartet?"
}

$logs = Get-ChildItem $logDir -Filter 'debug_*.log' -File -ErrorAction SilentlyContinue
if (-not $logs) {
    throw "Keine debug_*.log in $logDir - im Slicer einmal ab- und wieder anmelden."
}

# Slicer Next 2.x masks the token in some lines as `id_token=***`; the character
# class excludes `*`, so those are skipped rather than copied as a bogus value.
$patterns = @(
    'id_token=([A-Za-z0-9\-_\.]{20,})',
    'accessToken\s*=\s*([A-Za-z0-9\-_\.]{20,})'
)

$hits = foreach ($log in $logs) {
    $lineNo = 0
    foreach ($line in (Get-Content $log.FullName)) {
        $lineNo++
        foreach ($pattern in $patterns) {
            $m = [regex]::Match($line, $pattern)
            if (-not $m.Success) { continue }

            # Prefer the timestamp on the line itself; fall back to the file.
            $time = $log.LastWriteTime
            $t = [regex]::Match($line, '(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})')
            if ($t.Success) {
                $time = [datetime]::ParseExact($t.Groups[1].Value, 'yyyy-MM-dd HH:mm:ss', $null)
            }

            [pscustomobject]@{
                Time  = $time
                Token = $m.Groups[1].Value
                File  = $log.Name
                Line  = $lineNo
            }
            break
        }
    }
}

$hit = $hits | Sort-Object Time | Select-Object -Last 1

if (-not $hit) {
    throw "Kein Token gefunden - im Slicer einmal abmelden und wieder anmelden, dann erneut ausfuehren."
}

# Read only the expiry out of the JWT payload. A silently expired token is the
# usual reason the integration answers "Authentication failed. Check
# credentials.", which reads like a wrong token rather than an old one.
function Get-JwtExpiry([string]$jwt) {
    $parts = $jwt.Split('.')
    if ($parts.Count -lt 2) { return $null }

    $b64 = $parts[1].Replace('-', '+').Replace('_', '/')
    switch ($b64.Length % 4) {
        2 { $b64 += '==' }
        3 { $b64 += '=' }
        1 { return $null }
    }

    try {
        $payload = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($b64))
        $exp = [regex]::Match($payload, '"exp"\s*:\s*(\d+)')
        if ($exp.Success) {
            return [DateTimeOffset]::FromUnixTimeSeconds([int64]$exp.Groups[1].Value).LocalDateTime
        }
    } catch {
        return $null
    }

    return $null
}

$hit.Token | Set-Clipboard

$parts = $hit.Token.Split('.').Count
Write-Output ("OK - kopiert: {0} Zeichen, {1} JWT-Teile" -f $hit.Token.Length, $parts)
Write-Output ("     Quelle : {0}, Zeile {1} ({2})" -f $hit.File, $hit.Line, $hit.Time)

if ($parts -ne 3) {
    Write-Warning "Das sieht nicht nach einem JWT aus (erwartet: drei durch Punkte getrennte Teile)."
}

$expiry = Get-JwtExpiry $hit.Token
if ($expiry) {
    if ($expiry -lt (Get-Date)) {
        Write-Warning ("Token ist seit {0} abgelaufen - im Slicer neu anmelden und das Skript erneut ausfuehren." -f $expiry)
    } else {
        Write-Output ("     Gueltig bis {0}" -f $expiry)
    }
}
