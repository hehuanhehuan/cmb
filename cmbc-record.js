$.get(chrome.extension.getURL('/control-template.html'), function (data) {
    $(data).prependTo('body');
});

chrome.extension.sendMessage({cmd: 'watchdog'});

var token = '';
var api_url = {
    //"development": 'http://192.168.1.20:8190/index.php/Admin/ClientApi/alipay_charge',
    "development": 'https://www.baidu.com',
    "production": "https://www.poptop.cc/api/v1/withdrawals/alipay"
};


messageListener();
//console.log('get_storage');
//chrome.extension.sendMessage({cmd: 'get_storage'});

chrome.storage.local.get(null, function (data) {
    console.log(data);
    //if ("token" in data) {
    if (data.token !== undefined) {
        token = data['token'];
        console.log("token:" + token);
    }
    if ("env" in data) {
        $('select.env').val(data['env']);
        console.log("env:" + data['env']);
    }

    //if ("running" in data && data["running"] == true) {
    if (data.running === true) {
        console.log('now the extension status is running');
        $('#state').text('运行中');
        chrome.extension.sendMessage({cmd: 'searched'});
        setInterval(function () {
            t = $('#timer').data('timer');
            t = t - 1;
            if (t >= 0) {
                $('#timer').text(t);
                $('#timer').data('timer', t);
            }
        }, 1000);
        var trans = collection_trans();
        if (trans) {
            submit_trans(trans);
        }
    } else {
        console.log('now the extension status is stop');
        $('#state').text('停止');
    }
});


$('input.token').on('click', function () {
    var t = prompt('请输入密钥：');
    if (t != null && t != '') {
        chrome.storage.local.set({"token": t}, function () {
            token = t;
        })
    }
});

$('input.start').on('click', function () {
    if (token == '') {
        alert('请先设置密钥!');
        return
    }
    console.log('i click the start button to start the extension');
    chrome.storage.local.set({"running": true}, function () {
        setTimeout(function () {
            chrome.extension.sendMessage({cmd: 'watchdog'});
            chrome.extension.sendMessage({cmd: 'start'}, function (data) {
                set_form();
                search();
            });
        }, 3000);
    })
});

$('input.stop').on('click', function () {
    console.log('i click the stop button to stop the extension');
    chrome.storage.local.set({"running": false}, function () {
        setTimeout(function () {
            chrome.extension.sendMessage({cmd: 'watchdog'});
            chrome.extension.sendMessage({cmd: 'stop'}, function (data) {
                location.reload();
            });
        }, 3000);
    })
});

$('select.env').on('change', function () {
    chrome.storage.local.set({"env": $(this).val()});
});


function set_form() {
    $('select#ddlSubAccountList').val('371103633700001');
    $('select#ddlTransTypeList').val('-');
}

function collection_trans() {
    console.log('collection_trans');
    var trs = $('#tdQueryResult2 table.dgMain tr');
    console.log(trs);
    var results = [];
    if (trs.length < 2) {
        return results;
    }
    trs.each(function (i, tr) {
        //if(tr.hasClass('dgHeader')) {
        //console.log('the title');
        //}else {
        console.log(i);
        var tds = $(tr).find('td');
        var trade_amount = tds.eq(3).text();
        if (trade_amount > 0) {
            var trade_date = tds.eq(0).text();
            var trade_time = tds.eq(1).text();
            var trade_balance = tds.eq(4).text();
            var trade_type = tds.eq(5).text();
            var trade_remark = tds.eq(6).text();

            results.push({"name": "trans[][trade_date]", "value": trade_date});
            results.push({"name": "trans[][trade_time]", "value": trade_time});
            results.push({"name": "trans[][trade_amount]", "value": trade_amount});
            results.push({"name": "trans[][trade_balance]", "value": trade_balance});
            results.push({"name": "trans[][trade_type]", "value": trade_type});
            results.push({"name": "trans[][trade_remark]", "value": trade_remark});
        }
        //}
    });

    return results;
}

function submit_trans(trans) {

    trans.push({"name": "token", "value": token});
    trans.push({"name": "account", "value": $('#AccountNo').html()});
    var url = api_url[$('select.env').val()];
    $.post(url, trans, function (data) {
        if (data == 'true') {
            $("#error").text('');
        }
        else {
            $('#error').text(data);
        }
    }).fail(function (data) {
        $('#error').text(data.responseText);
    })
}

function messageListener() {
    console.log('messageListener');
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        if (message.cmd === 'search') {
            setTimeout(function () {
                chrome.extension.sendMessage({cmd: 'watchdog'});
                set_form();
                search();

            }, 3000);
        } else if (message.cmd == 'storage') {
            var data = message.data;
            console.log(data);
        }
    });
}

function search() {
    var form = $('#BtnOK');
    console.log(form);
    if (form.length > 0) {
        console.log('searched');
        chrome.extension.sendMessage({cmd: 'searched'});
        $('#BtnOK').click();
    }
}
