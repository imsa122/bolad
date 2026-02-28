@echo off
echo Resetting Prisma migrations for MySQL...

echo Removing existing migrations directory...
if exist "prisma\migrations" (
  rmdir /s /q "prisma\migrations"
  echo Migrations directory removed successfully!
) else (
  echo No existing migrations directory found.
)

echo Removing migration_lock.toml...
if exist "prisma\migration_lock.toml" (
  del /f /q "prisma\migration_lock.toml"
  echo migration_lock.toml removed successfully!
) else (
  echo No migration_lock.toml found.
)

echo Removing SQLite database file...
if exist "prisma\dev.db" (
  del /f /q "prisma\dev.db"
  echo SQLite database file removed successfully!
) else (
  echo No SQLite database file found.
)

echo.
echo Generating Prisma client...
call npx prisma generate

echo.
echo Running database migrations...
call npx prisma migrate dev --name init

echo.
echo Done!
