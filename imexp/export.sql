create or replace directory EXPORT_TEMP_DIR as '&1';
grant read, write on directory EXPORT_TEMP_DIR to public;
exit;