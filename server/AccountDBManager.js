/**
 * Created by Administrator on 2015-05-05.
 */
var mongoose = require('mongoose');
var modelName = 'accountShejiao2';
var MySchema = require('./AccountDataSchema');
var db = require('./DBConnection').db;
var myModel = db.model(modelName, MySchema);


exports.clear = function (callback) {
    myModel.remove({}, function (err) {
        if (err) {
            console.log(err);
            callback(1);
        }
        else {
            console.log('Account collection removed');
            callback(0);
        }
    });
}

exports.add = function (account, password, name, sex, callback) {
    var info = {FaXing: '', YanJing: '', YiFuLeiXing: '', YiFuYanSe: '', YiFuHuaWen: '', Update: 0};
    var doc = {
        Account: account,
        Password: password,
        Nickname: name,
        Sex: sex,
        RegistDate: new Date().getTime(),
        MeetingSent: {left: 2, update: 0},
        SpecialInfo: info
    };
    var obj = new myModel(doc);
    obj.save(function (error) {
        if (error) {
            console.log("Account DB error : " + error.message);
            if (error.message.indexOf("Account") >= 0) {
                callback("用户名已被使用");
            }
            else {
                callback("数据错误");
            }
        } else {
            console.log('Account saved OK!');
            callback('success');
        }
    });
}

exports.getInfo = function (account, password, callback) {
    myModel.findOne({Account: account, Password: password}, {}, {}, function (error, result) {
        if (error) {
            console.log("Account DB error : " + error.message);
            callback('{"Status":"服务器错误!"}');
        }
        else {
            if (result == null) {
                //console.log(num+" // ");
                callback('{"Status":"账号或者密码错误"}');
            }
            else {
                var t1 = JSON.stringify(result);
                var t2 = t1.substring(0, t1.length - 1);
                t2 = t2 + ',"Status":"success"}'
                t2.Status = "success";
                callback(t2);
            }
        }
    });
}

exports.logIn = function (account, callback) {
    myModel.update({Account: account}, {Online: 1}, {}, function (error) {
        if (error) {
            console.log("Account DB error : " + error.message);
            callback('Err0');
        }
        else {
            console.log("Account " + account + " log in . ");
            callback(0);
        }
    })
}

exports.logOut = function (account, callback) {
    myModel.update({Account: account}, {Online: 0}, {}, function (error) {
        if (error) {
            console.log("Account DB error : " + error.message);
            callback('Err0');
        }
        else {
            console.log("Account " + account + " log out . ");
            callback(0);
        }
    })
}

exports.getAccount = function (account, callback) {
    myModel.findOne({Account: account}, {}, {}, function (error, res) {
        if (error)
            callback('Err0');
        else
            callback(res);
    })
}

exports.updateGPS = function (account, log, lat, callback) {
    var arr = new Array(log, lat);
    myModel.update({Account: account}, {GPSPoint: arr, GPSUpdate: new Date().getTime()}, {}, function (error) {
        if (error)
            callback('Err0');
        else {
            console.log(account + " GPS UPDATED OK.");
            callback(0);
        }
    })
}

exports.updateImage = function (account, img_id, callback) {

    myModel.update(
        {Account: account},
        {Image: img_id},
        {safe: true},
        function (err) {
            if (err) {
                console.log(err);
                callback('Err1');
            }
            else {
                console.log("image updated OK!" + " // " + img_id);
                callback(0);
            }
        });
}

exports.setStyle = function (account, key, val, callback) {
    var temp = {};
    var temp1 = 'SpecialInfo.' + key;
    temp[temp1] = val;
    temp['Update'] = new Date().getTime();
    //console.log(JSON.stringify(temp));
    myModel.update(
        {Account: account},
        temp,
        {},
        function (err) {
            if (err)
                callback('Err1');
            else {
                console.log('Update ' + key + '=' + val + ' OK!');
                callback(0);
            }
        }
    );
}

exports.searchNear = function (sex, cood, mids, callback) {
    myModel.geoNear({type: "Point", coordinates: cood}, {
        spherical: true,
        maxDistance: 500,
        query: {Sex: sex, Account: {'$nin': mids}}
    })
        .then(function (doc) {
            //console.log(doc);
            callback(doc);
        })
}

exports.addMeet = function (account, mid, callback) {
    myModel.update({Account: account}, {
            $push: {Meetings: mid}, 'MeetingSent.update': new Date().getTime()
        }, {}, function (err) {
            if(err)
                callback('Err1');
            else {
                console.log(account+" add meet "+mid+" OK!");
                callback(0);
            }
        }
    )
}

exports.clearMeet = function(account,callback)
{
    myModel.update({Account: account}, {Meetings: [],WaitMeetings:[]}, {}, function (err) {
            if(err)
                callback('Err1');
            else {
                console.log('Meet clear OK!');
                callback(0);
            }
        }
    )
}

exports.clearWaitMeets = function(account,callback)
{
    myModel.update({Account: account}, {WaitMeetings:[]}, {}, function (err) {
            if(err)
                callback('Err1');
            else {
                console.log('WaitMeet clear OK!');
                callback(0);
            }
        }
    )
}

exports.updateWaitedMeetings = function(accounts,mid,callback)
{
    myModel.update({Account:{$in:accounts}},{$push: {WaitMeetings:mid}},{multi: true},function(err)
    {
        if(err)
            callback('Err1');
        else {
            console.log('Wait Meetings update OK!');
            callback(0);
        }
    })
}

exports.updateMeetTime = function(account,callback)
{
    myModel.update({Account:account},{'MeetingSent.update':new Date().getTime()},{},function(err)
    {
        if(err)
            callback('Err1');
        else {
            console.log(account+' meet sent time update OK!');
            callback(0);
        }
    })
}

exports.checkMeetTime = function(account,callback)
{
    myModel.findOne({Account:account},{MeetingSent:1},{},function(err,res)
    {
        if(err)
        {
            console.log(err);
            callback(null);
        }
        else
        {
            callback(res);
        }
    });
}

exports.getImages = function(accounts,callback)
{
    myModel.find({Account:{$in : accounts}},{Image:1,Account:1},{},function(err,res)
    {
        if(err)
        {
            console.log(err);
            callback([]);
        }
        else
        {
            console.log("Get Images OK");
            callback(res);
        }
    })
}

exports.addFriend = function(account,uid,name,img,callback)
{
    myModel.update({Account:account},{$push : {Friends : {Account:uid,Nickname:name,Image:img}}},{},function(err)
    {
        if(err)
        {
            console.log(err);
            callback('ERR1');
        }
        else
        {
            console.log(account+" Friend Add OK");
            callback(0);
        }
    })
}

exports.deleteFriend = function(account,uid,callback)
{
    myModel.update({Account:account},{$pull : {Friends : {Account:uid}}},{},function(err)
    {
        if(err)
        {
            console.log(err);
            callback('ERR1');
        }
        else
        {
            console.log(account+" Friend Delete OK");
            callback(0);
        }
    })
}

exports.getNickname = function(account,callback)
{
    myModel.findOne({Account:account},{Nickname:1},{},function(err,res)
    {
        if(err)
        {
            console.log(err);
            callback(null);
        }
        else
        {
            console.log("Nickname Get OK");
            if(res==null)
                callback(null);
            else
                callback(res.Nickname);
        }
    })
}

