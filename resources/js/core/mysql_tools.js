/**
 * Created by JUHCH-PC on 2016/10/12.
 */
var dbConfig = {};
var childProc = require('child_process');
var path = require('path');
var parseString = require('xml2js').parseString;
var fs = require('fs');
var iconv = require('iconv-lite');
var readline = require('readline');
var async = require('async');
var mysql = require('mysql');
var BufferHelper = require('bufferhelper');
$(document).ready(function (){
    var optionType = getParameter('type');
    dbConfig.option = optionType;
    $('#' + optionType + 'Content').removeClass('hd');
    $('#importFile').on('change', function (evt) {
        $('#selectFileTxt').val(this.value);
    });
    $('#exportPath').on('change', function (evt) {
        $('#selectPathTxt').val(this.value);
    })
    $('#secondStepBtn').click(function () {
        if(!$('#userName').val() || $('#userName').val() == '' || !$('#password').val() || $('#password').val() == ''
            || !$('#dbUrl').val() || $('#dbUrl').val() == '' || !$('#dbPort').val() || $('#dbPort').val() == '' ||
            !$('#netName').val() || $('#netName').val() == '') {
            $('#errorMsg').removeClass('hd');
            $('#errorMsg').text('请将红色星号内容填充完整！');
            return;
        }
        dbConfig.userName = $('#userName').val();
        dbConfig.password = $('#password').val();
        dbConfig.url = $('#dbUrl').val();
        dbConfig.port = $('#dbPort').val();
        dbConfig.netName = $('#netName').val();
        $('#errorMsg').addClass('hd');
        if(optionType == 'restore') {
            if(!$('#selectFileTxt').val() || $('#selectFileTxt').val() == '') {
                $('#errorMsg').removeClass('hd');
                $('#errorMsg').text('请选择导入文件！');
                return;
            }
            dbConfig.importFile = $('#selectFileTxt').val();
            $('#thirdStepContainer').removeClass('hd');
            $('#secondStepContainer').addClass('hd');
            $('#thirdStep',parent.document).addClass('on');
            $('#secondStep',parent.document).removeClass('on');
            $('#resultContent').addClass('hd');
            $('#importProgress').removeClass('hd');
            $('#loadingprogress').text('程序开发中，敬请期待...');
          //  $('#loadingprogress').text('正在导入，请稍候...');
          //  importDB(dbConfig);
           /* $("#loadingcontent",parent.document).removeClass('hd');
            $('#importProgress').removeClass('hd');
            $('#loadingprogress').text('数据正在导入，请稍候...');
            $("#loading",parent.document).removeClass('hd');
            $("#loading_text",parent.document).text('正在准备，请稍候...');
            // init db information
            importDB(dbConfig);*/
        } else {
            if(!$('#selectPathTxt').val() || $('#selectPathTxt').val() == '') {
                $('#errorMsg').removeClass('hd');
                $('#errorMsg').text('请选择备份路径！');
                return;
            }
            dbConfig.expFile = $('#expFileName').val() ? $('#expFileName').val() : 'default';
            dbConfig.expPath = $('#selectPathTxt').val();
            $('#thirdStepContainer').removeClass('hd');
            $('#secondStepContainer').addClass('hd');
            $('#thirdStep',parent.document).addClass('on');
            $('#secondStep',parent.document).removeClass('on');
            $('#resultContent').addClass('hd');
            $('#importProgress').removeClass('hd');
            $('#loadingprogress').text('正在备份数据库，请稍候...');
            exportDB(dbConfig);
        }
    });
});

function exportDB(dbConfig)
{
    async.auto({
        initConnection: function (cb) {
            var connection = mysql.createConnection({
                host: dbConfig.url,
                port: dbConfig.port,
                user: dbConfig.userName,
                password: dbConfig.password,
                database: dbConfig.netName
            });
            connection.connect(function (err) {
                if(err) {
                    cb(err);
                    return;
                }
                cb(null, connection);
            });
        },
        getTables: ['initConnection', function (cb, results) {
            var connection = results.initConnection;
            connection.query('SHOW TABLES', function (err, tables) {
                if(err) {
                    cb(err);
                    return;
                }
                cb(null, tables);
            });
        }],
        createTableSql: ['initConnection', 'getTables', function (cb, results) {
            var connection = results.initConnection;
            var tables = results.getTables;
            var counter = 0;
            var expStr = '';
            for (var table in tables)
            {
                counter++;
                connection.query('SHOW CREATE TABLE ' + tables[table]['Tables_in_' + dbConfig.netName], function (error, r) {
                    if(error) {
                        cb(error);
                        return;
                    }
                    for (var t in r)
                    {
                        expStr += 'DROP TABLE ' + r[t].Table + ';\n';
                        expStr += r[t]['Create Table'] + ';\n';
                    }
                    counter--;
                    if(counter == 0)
                    {
                        saveExpFile(dbConfig.expPath + '/' + dbConfig.expFile + '.sql', expStr, tables, connection, cb);
                    }
                });
            }
        }]
    }, function (err, results) {
        $('#importProgress').addClass('hd');
        $('#resultContent').removeClass('hd');
        if(err) {
            $('#resultContent').append('<p>' + err + '</p>');
            return;
        }
        $('#resultContent').append('<p>备份成功！</p>');
    });
}

function saveExpFile(filePath, expStr, tables, connection, cb)
{
    var createInsertCount = 0;
    for(var table in tables)
    {
        createInsertCount++;
        connection.query('select * from ' + tables[table]['Tables_in_' + dbConfig.netName], function (error, rows, fields) {
            if(error) {
                cb(error);
                return;
            }
            if(rows && rows.length > 0)
            {
                // 生成insert语句
                expStr += 'INSERT INTO ' + tables[table]['Tables_in_' + dbConfig.netName] + ' VALUES (';
                for(var row in rows)
                {
                    for(var i = 0, l = fields.length; i < l; i++)
                    {
                        if(i != 0)
                        {
                            expStr += ',';
                        }
                        expStr += '"'+rows[row][fields[i].name]+'"';
                    }
                }
                expStr += ');' + '\n';
            }
            createInsertCount--;
            if(createInsertCount == 0)
            {
                connection.destroy();
                fs.writeFile(filePath, expStr, function (err) {
                    if(err) {
                        cb(err);
                        return;
                    }
                    cb(null);
                });
            }
        });
    }
}

function importDB(dbConfig)
{
    var inputStream = fs.createReadStream(dbConfig.importFile, {encoding:'utf8'});
    var bufferHelper = new BufferHelper();
    inputStream.on('data', function (chunk) {
        bufferHelper.concat(chunk);
    });
    inputStream.on('error', function () {
        $('#resultContent').empty();
        $('#resultContent').append('<p>读取导入文件失败！</p>');
    });
    inputStream.on('end', function () {
        var connection = mysql.createConnection({
            host: dbConfig.url,
            port: dbConfig.port,
            user: dbConfig.userName,
            password: dbConfig.password,
            database: dbConfig.netName
        });
        connection.connect(function (err) {
            if(err) {
                return;
            }
            var sql = 'DROP TABLE mbti_answers;Create table mbti_answers (id int(11) not null AUTO_INCREMENT,title varchar(3000) not null)';
            connection.query(sql, function (err) {
                if(err) {
                    console.log(err);
                    return;
                }
                console.log('成功');
            });
        });
        /*var execSql = bufferHelper.toBuffer().toString();
        async.auto({
            initConnection: function (cb) {
                var connection = mysql.createConnection({
                    host: dbConfig.url,
                    port: dbConfig.port,
                    user: dbConfig.userName,
                    password: dbConfig.password,
                    database: dbConfig.netName
                });
                connection.connect(function (err) {
                    if(err) {
                        cb(err);
                        return;
                    }
                    cb(null, connection);
                });
            },
            importSQL: ['initConnection', function (cb, results) {
                var connection = results.initConnection;
                connection.query(execSql, function (err) {
                    if(err) {
                        cb(err);
                        return;
                    }
                    cb(null);
                });
            }]
        }, function (err, results) {
            $('#importProgress').addClass('hd');
            $('#resultContent').removeClass('hd');
            $('#resultContent').empty();
            if(err) {
                $('#resultContent').append('<p>' + err + '</p>');
                return;
            }
            $('#resultContent').append('<p>导入成功！</p>');
        });*/
    });
}