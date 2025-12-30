@echo off
echo Gerando update.zip...

if exist update.zip del update.zip

powershell Compress-Archive -Path update-build\* -DestinationPath update.zip

echo Update gerado com sucesso!
pause
