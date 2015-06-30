/**
 * Created by pennsong on 6/23/15.
 */
var accountDB = require('./AccountDBManager');
var meetingDB = require('./MeetingDBManager');
var moment = require('moment');
var callback = function(msg)
{
    console.log(msg);
}

//accountDB.add('1','5','44','男',function(msg)
//{
//    accountDB.getAccount('5',callback);
//});

//accountDB.setStyle('5','FaXing','!@#123',function(msg)
//{
//    accountDB.getAccount('5',callback);
//});

//var c = new Date().getTime();
//console.log(c);
//var d = new Date(0);
//console.log(d);

//accountDB.getAccount('2',callback);

//accountDB.clearMeet('1',callback);
//accountDB.clearMeet('2',callback);
//accountDB.clearMeet('3',callback);
//accountDB.clearMeet('4',callback);
//accountDB.clearMeet('5',callback);
//accountDB.clearMeet('6',callback);
//meetingDB.clear(callback);
//accountDB.getAccount('1',callback);
//accountDB.getAccount('2',callback);
//accountDB.getAccount('3',callback);
//var now = moment('1410715640579','x');
//now = moment(new Date().getTime(),'x');
//moment.locale('zh-cn');
//console.log( moment(new Date().getTime()-1000000,'x').fromNow());
//console.log(moment().diff( moment(new Date().getTime()-1000000,'x')))
//var d = new Date();
//console.log(d.toLocaleTimeString());
var message = require('./MessageDBManager');
//message.add('1','2','t1',new Date(),callback);
//message.add('2','1','t2',new Date(),callback);\
message.get('1',callback);