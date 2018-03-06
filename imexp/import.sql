create or replace directory CLIENT_TEMP_DIR as '&1';
grant read, write on directory CLIENT_TEMP_DIR to public;
create or replace directory IMPORT_TEMP_DIR as '&2';
grant read, write on directory IMPORT_TEMP_DIR to public;
DECLARE
 xml_ctx    dbms_xmlgen.ctxHandle;
 xml_txt    CLOB;
BEGIN
 xml_ctx:= dbms_xmlgen.newContext('select tablespace_name from dba_tablespaces');
 dbms_xmlgen.setRowSetTag(xml_ctx,'TABLESPACES');
 dbms_xmlgen.setRowTag(xml_ctx,'TABLESPACE');
 xml_txt := to_clob(dbms_xmlgen.getXML(xml_ctx));
 DBMS_XSLPROCESSOR.clob2file(xml_txt,'CLIENT_TEMP_DIR','tablespace.xml');
 dbms_xmlgen.closeContext(xml_ctx);
END;
/
exit;