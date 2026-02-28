@echo off
echo Running Prisma migration against Railway MySQL...
set DATABASE_URL=mysql://root:oOjJWkSfUilNqWyBdchIWcCxNWjFnSeD@turntable.proxy.rlwy.net:31805/railway
node node_modules\.bin\prisma db push --force-reset
echo.
echo Migration complete! Now running seed...
node -e "process.env.DATABASE_URL='mysql://root:oOjJWkSfUilNqWyBdchIWcCxNWjFnSeD@turntable.proxy.rlwy.net:31805/railway'" 
echo Done!
pause
