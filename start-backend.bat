@echo off
title SwiftChat Backend (Apache Tomcat 10.1)
echo ========================================================
echo Starting SwiftChat Backend on Apache Tomcat (Port 8090)
echo ========================================================
set CATALINA_HOME=C:\tools\apache-tomcat-10.1.60
call "%CATALINA_HOME%\bin\catalina.bat" run
pause
