@echo off
sqlplus %1/%2@%3 as sysdba @%cd%\export.sql '%4'
@echo on
@exit;