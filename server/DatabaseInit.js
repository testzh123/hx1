    /**
 * Created by Administrator on 2015-05-13.
 */
var account= require('./AccountDBManager');
var image = require('./MyImageDBManager')
//var image = require('./MyImageDBManager');
var meeting = require('./MeetingDBManager');
var message = require('./MessageDBManager');

//var filter = require('./MeetingFilterDBManager');
var callback = function(msg)
{
    console.log(msg);
}

account.clear(function(arg)
{
    account.add("user","password","name","男",callback);
    account.add("user","password","name1","男",callback);
    account.add("user","password","name1","那那那",callback);
});

image.clear(function(arg)
{
    var fs = require('fs');
    var d3 = fs.readFileSync('../www/img/third-person.png');
    var s = d3.toString('base64');
    console.log(s);
    image.add('0','data:image/png;base64,'+s,'png',callback);
});

meeting.clear(callback);
message.clear(callback);
