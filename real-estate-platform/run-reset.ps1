# PowerShell script to run reset-migrations.mjs

# Change to the real-estate-platform directory
Set-Location -Path $PSScriptRoot

# Run the reset-migrations.mjs script
Write-Host "Running reset-migrations.mjs..."
node .\reset-migrations.mjs

# Run Prisma generate
Write-Host "`nGenerating Prisma client..."
npx prisma generate

# Run Prisma migrate
Write-Host "`nRunning Prisma migrations..."
npx prisma migrate dev --name init

Write-Host "`nDone!"
