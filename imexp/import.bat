@echo off
sqlplus %1/%2@%3 as sysdba @%cd%\import.sql '%cd%' '%4'
@echo on
@exit;