 = Get-ChildItem -Path "c:\Users\lenovo\Documents\RuknyGroup\Rukny.io\apps" -Filter "Dockerfile" -Recurse

foreach ($file in $dockerfiles) {
    $content = Get-Content $file.FullName -Raw

    if ($content -match "COPY packages/forms-shared") {
        if ($content -notmatch "COPY packages/Thmanyah-Font-Family") {
            $content = $content -replace "COPY apps/([^/]+)/package\.json", "COPY packages/Thmanyah-Font-Family ./packages/Thmanyah-Font-Family
COPY apps/$1/package.json"
        }

        if ($content -notmatch "COPY --from=deps /app/packages/Thmanyah-Font-Family") {
            $content = $content -replace "COPY apps/([^/]+) \.", "COPY --from=deps /app/packages/Thmanyah-Font-Family /app/packages/Thmanyah-Font-Family
COPY apps/$1 ."
        }

        if ($content -notmatch "node_modules/@rukny/thmanyah-font") {
            $content = $content -replace "cp -a /app/packages/forms-shared node_modules/@rukny/forms-shared", "cp -a /app/packages/forms-shared node_modules/@rukny/forms-shared \
  && rm -rf node_modules/@rukny/thmanyah-font \
  && cp -a /app/packages/Thmanyah-Font-Family node_modules/@rukny/thmanyah-font"
        }

        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated "
    }
}
