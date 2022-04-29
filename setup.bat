@echo off
::ECHO ----- Software Installation Step -----
::ECHO If any software is already installed you can skip its installation.
::ECHO.
::ECHO Installing Node.JS v16.13.0...
::START /wait ./softwares/node-v16.13.0-x64.msi
::ECHO Installing MySQL v8.0.29.0...
::START /wait ./softwares/mysql-installer-community-8.0.29.0.msi
::ECHO Installing JDK v15.0.2...
::START /wait ./softwares/jdk-15.0.2_windows-x64_bin.exe
::ECHO Installing Android Studio v2021.1.1.23...
::START /wait ./softwares/android-studio-2021.1.1.23-windows.exe

ECHO ----- Node.JS Modules Installation Step -----
call npm install -g yarn
cls

ECHO ----- Yarn Modules Installation Step -----
call yarn install
pause