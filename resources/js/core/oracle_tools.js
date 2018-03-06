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
$(document).ready(function (){
    var optionType = getParameter('type');
    if(optionType == 'restore')
    {
        $('#versionLabel').css('display', 'none');
        $('#version').css('display', 'none');
        $('#dbUrl').removeClass('textCol');
        $('#dbUrl').addClass('textCol2');
    }
    else
    {
        $('#versionLabel').css('display', 'inline-block');
        $('#version').css('display', 'inline-block');
        $('#dbUrl').removeClass('textCol2');
        $('#dbUrl').addClass('textCol');
    }
    dbConfig.option = optionType;
    $('#' + optionType + 'Content').removeClass('hd');
    $('#importFile').on('change', function (evt) {
        $('#selectFileTxt').val(this.value);
    });
    $('#exportPath').on('change', function (evt) {
        $('#selectPathTxt').val(this.value);
    });
    $('#userName').on('change', function (evt) {
        if($('#option').val() == 'backup') {
            $('#targetUser').val(this.value);
        }
    });
    $('#returnFirstBtn').click(function () {
        $('#loadTypeContainer', parent.document).addClass('hd');
        $('#firstStepContainer', parent.document).removeClass('hd');
        $('#firstStep', parent.document).addClass('on');
        $('#secondStep', parent.document).removeClass('on');
    });
    $('#secondStepBtn').click(function () {
        if(!$('#userName').val() || $('#userName').val() == '' || !$('#password').val() || $('#password').val() == ''
            || !$('#dbUrl').val() || $('#dbUrl').val() == '' || !$('#dbPort').val() || $('#dbPort').val() == '' ||
            !$('#netName').val() || $('#netName').val() == '') {
            $('#errorMsg').removeClass('hd');
            $('#errorMsg').addClass('show');
            $('#errorMsg').text('请将红色星号内容填充完整！');
            return;
        }
        dbConfig.userName = $('#userName').val();
        dbConfig.password = $('#password').val();
        dbConfig.url = $('#dbUrl').val();
        dbConfig.port = $('#dbPort').val();
        dbConfig.netName = $('#netName').val();
        if($('#version').val() && $('#version').val() != null && $('#version').val() != '')
        {
            dbConfig.version = $('#version').val();
        }
        $('#errorMsg').addClass('hd');
        if(optionType == 'restore') {
            if(!$('#selectFileTxt').val() || $('#selectFileTxt').val() == '') {
                $('#errorMsg').removeClass('hd');
                $('#errorMsg').text('请选择导入文件！');
                return;
            }
            dbConfig.importFile = $('#selectFileTxt').val();
            $("#loadingcontent",parent.document).removeClass('hd');
            $("#loading",parent.document).removeClass('hd');
            $("#loading_text",parent.document).text('正在准备，请稍候...');
            // init db information
            initImportDB(dbConfig);
        } else {
            if(!$('#selectPathTxt').val() || $('#selectPathTxt').val() == '') {
                $('#errorMsg').removeClass('hd');
                $('#errorMsg').text('请选择备份路径！');
                return;
            }
            dbConfig.targetUser = $('#targetUser').val();
            dbConfig.expFile = $('#expFileName').val() ? $('#expFileName').val() : 'default';
            dbConfig.expPath = $('#selectPathTxt').val();
            $('#fourthStepContainer').removeClass('hd');
            $('#thirdStepContainer').addClass('hd');
            $('#secondStepContainer').addClass('hd');
            $('#thirdStep',parent.document).addClass('on');
            $('#secondStep',parent.document).removeClass('on');
            $('#resultContent').addClass('hd');
            $('#importProgress').removeClass('hd');
            $('#loadingprogress').text('正在备份数据库，请稍候...');
            exportDB(dbConfig);
        }
    });
    $('#returnSecondBtn').click(function () {
        $('#thirdStepContainer').addClass('hd');
        $('#secondStepContainer').removeClass('hd');
        $('#loadingcontent').addClass('hd');
        $('#loading').addClass('hd');
    });
    $('#beginRestoreBtn').click(function () {
        $('#fourthStepContainer').removeClass('hd');
        $('#thirdStepContainer').addClass('hd');
        $('#secondStepContainer').addClass('hd');
        $('#thirdStep', parent.document).addClass('on');
        $('#secondStep' ,parent.document).removeClass('on');
        $('#resultContent').addClass('hd');
        $('#importProgress').removeClass('hd');
        $('#loadingprogress').text('数据正在导入，请稍候...');
        if($('#sourceTBspace').val()) {
            dbConfig.sourceTbs = $('#sourceTBspace').val();
            dbConfig.newTbs = $('#newTBspace').val();
        }
        if($('#sourceUser').val()) {
            dbConfig.sourceUser = $('#sourceUser').val();
            dbConfig.newUser = $('#newUser').val();
        }
        importFile(dbConfig);
    });
});

function initImportDB(config)
{
    var validateCmd = 'tnsping ' + config.url + ':' + config.port + '/' + config.netName;
    var proc = childProc.exec(validateCmd,{encoding: 'binary'}, function(error,stdout,stderr){
        if(error) {
            return;
        }
        var execPath = path.dirname(process.execPath) + '/imexp';
        childProc.execFile(execPath + '/import.bat', [config.userName, config.password, config.url + ':' + config.port + '/' + config.netName, path.dirname(config.importFile)], {cwd:execPath}, function(error, stdout, stderr) {
            if(error) {
                $('#importProgress').addClass('hd');
                $('#loadingcontent', parent.document).addClass('hd');
                $('#loading', parent.document).addClass('hd');
                $('#resultContent').removeClass('hd');
                $('#resultContent').append('<p>导入失败</p>');
            }
            fs.readFile(execPath + '/tablespace.xml', 'utf-8', function (err, file) {
                parseString(file, {explicitArray : false}, function (err, result) {
                    if(err) {
                        return;
                    }
                    if(result != null && result.TABLESPACES && result.TABLESPACES.TABLESPACE && result.TABLESPACES.TABLESPACE.length > 0) {
                        var tablespaceList = result.TABLESPACES.TABLESPACE;
                        var tbsSelect = $('#newTBspace');
                        for(var i = 0, l = tablespaceList.length; i < l; i++)
                        {
                            var option = $('<option></option>');
                            option.val(tablespaceList[i].TABLESPACE_NAME);
                            option.text(tablespaceList[i].TABLESPACE_NAME);
                            tbsSelect.append(option);
                        }
                        $('#newUser').val(config.userName);
                        $('#thirdStepContainer').removeClass('hd');
                        $('#secondStepContainer').addClass('hd');
                        $('#loadingcontent', parent.document).addClass('hd');
                        $('#loading', parent.document).addClass('hd');
                    }
                });
            });
        });
    });
    readline.createInterface({
        input     : proc.stderr,
        terminal  : false
    }).on('line', function (line) {
        $('#importProgress').addClass('hd');
        var buf = new Buffer(line, 'binary');
        var str = iconv.decode(buf, 'GBK');
        $('#resultContent').removeClass('hd');
        $('#resultContent').append('<p>' + str + '</p>');
    });
    readline.createInterface({
        input     : proc.stdout,
        terminal  : false
    }).on('line', function (line) {
        if(line != null && line != '')
        {
            $('#importProgress').addClass('hd');
            var buf = new Buffer(line, 'binary');
            var str = iconv.decode(buf, 'GBK');
            $('#resultContent').removeClass('hd');
            $('#resultContent').append('<p>' + str + '</p>');
        }
    });
}

function exportDB(config)
{
    async.auto({
        validateTNS: function (cb) {
            var validateCmd = 'tnsping ' + config.url + ':' + config.port + '/' + config.netName;
            var proc = childProc.exec(validateCmd,{encoding: 'binary'}, function(error,stdout,stderr){
                if(error) {
                    cb(error);
                    return;
                }
                cb(null);
            });
            readline.createInterface({
                input     : proc.stderr,
                terminal  : false
            }).on('line', function (line) {
                $('#importProgress').addClass('hd');
                var buf = new Buffer(line, 'binary');
                var str = iconv.decode(buf, 'GBK');
                $('#resultContent').removeClass('hd');
                $('#resultContent').append('<p>' + str + '</p>');
            });
            readline.createInterface({
                input     : proc.stdout,
                terminal  : false
            }).on('line', function (line) {
                if(line != null && line != '')
                {
                    $('#importProgress').addClass('hd');
                    var buf = new Buffer(line, 'binary');
                    var str = iconv.decode(buf, 'GBK');
                    $('#resultContent').removeClass('hd');
                    $('#resultContent').append('<p>' + str + '</p>');
                }
            });
        },
        grantPath: ['validateTNS', function (cb, results) {
            var execPath = path.dirname(process.execPath) + '/imexp';
            childProc.execFile(execPath + '/export.bat', [config.userName, config.password, config.url + ':' + config.port + '/' + config.netName, config.expPath], {cwd:execPath}, function(error, stdout, stderr) {
                cb(error, stdout);
            });
        }],
        exportFile: ['grantPath', function (cb, results) {
            var command = 'expdp ' + config.userName + '/' + config.password + '@' + config.url + ':'
                + config.port + '/' + config.netName + ' DIRECTORY=EXPORT_TEMP_DIR DUMPFILE='
                + config.expFile + '.dmp ' + ' logfile=' + new Date().getTime() + '.log';
            if(dbConfig.version)
            {
                command += ' VERSION=' + dbConfig.version;
            }
            if(config.targetUser)
            {
                command += ' SCHEMAS=' + config.targetUser;
            }
            console.log(command);
            var proc = childProc.exec(command,{encoding: 'binary'}, function(error,stdout,stderr){});
            readline.createInterface({
                input     : proc.stderr,
                terminal  : false
            }).on('line', function (line) {
                $('#importProgress').addClass('hd');
                var buf = new Buffer(line, 'binary');
                var str = iconv.decode(buf, 'GBK');
                $('#resultContent').removeClass('hd');
                $('#resultContent').append('<p>' + str + '</p>');
            });
            readline.createInterface({
                input     : proc.stdout,
                terminal  : false
            }).on('line', function (line) {
                if(line != null && line != '')
                {
                    $('#importProgress').addClass('hd');
                    var buf = new Buffer(line, 'binary');
                    var str = iconv.decode(buf, 'GBK');
                    $('#resultContent').removeClass('hd');
                    $('#resultContent').append('<p>' + str + '</p>');
                }
            });
        }]
    }, function (err, results) {
        if(err) {
            console.log(err);
            return;
        }
    });
}

function importFile(config)
{
    var importPath = path.dirname(config.importFile);
    var command = 'impdp '+ config.userName + '/' + config.password +
        '@' + config.url + ':' + config.port + '/' + config.netName +
        ' DIRECTORY=IMPORT_TEMP_DIR DUMPFILE='+ path.basename(config.importFile, path.extname(config.importFile));
    if(config.sourceUser) {
        command += ' REMAP_SCHEMA=' + config.sourceUser + ':' + config.newUser;
    }
    if(config.sourceTbs) {
        command += ' REMAP_TABLESPACE=' + config.sourceTbs + ':' + config.newTbs;
    }
    var proc = childProc.exec(command,{encoding: 'binary'}, function(error,stdout,stderr){});
    readline.createInterface({
        input     : proc.stderr,
        terminal  : false
    }).on('line', function (line) {
        $('#importProgress').addClass('hd');
        var buf = new Buffer(line, 'binary');
        var str = iconv.decode(buf, 'GBK');
        $('#resultContent').removeClass('hd');
        $('#resultContent').append('<p>' + str + '</p>');
    });
    readline.createInterface({
        input     : proc.stdout,
        terminal  : false
    }).on('line', function (line) {
        if(line != null && line != '')
        {
            $('#importProgress').addClass('hd');
            var buf = new Buffer(line, 'binary');
            var str = iconv.decode(buf, 'GBK');
            $('#resultContent').removeClass('hd');
            $('#resultContent').append('<p>' + str + '</p>');
        }
    });
}
