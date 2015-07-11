/**
 * Created by Administrator on 2015-06-07.
 */
var mongoose = require('mongoose');
var modelName = 'meetingShejiao2';
var MySchema = require('./MeetingDataSchema');
var db = require('./DBConnection').db;
var myModel = db.model(modelName, MySchema);

exports.clear = function (callback) {
    myModel.remove({}, function (err) {
        if (err) {
            console.log(err);
            callback(1);
        }
        else {
            console.log('Meeting collection removed');
            callback(0);
        }
    });
}

exports.add = function (sender,img,ss,sex,faxing,address,yanjing,yifuleixing,yifuyanse,yifuhuawen,gps,style,callback) {
    var doc = {Sender:sender,SenderImage:img,SenderSex:ss,SenderRequest:{Sex:sex,FaXing:faxing,YanJing:yanjing,YiFuLeiXing:yifuleixing,YiFuYanSe:yifuyanse,YiFuHuaWen:yifuhuawen}
        ,ReceiverRequest:{Sex:'',FaXing:style.FaXing,YanJing:style.YanJing,YiFuLeiXing:style.YiFuLeiXing,YiFuYanSe:style.YiFuYanSe,YiFuHuaWen:style.YiFuHuaWen},Address:address,UpdatedTime:new Date().getTime(),GPSPoint:gps};
    var obj = new myModel(doc);
    obj.save(function (error) {
        if (error) {
            console.log("Meeting DB error : " + error.message);
            callback(0);
        } else {
            console.log('Meeting saved OK!');
            //console.log(obj);
            callback(obj);
        }
    });
}

exports.getMeet = function(mid,callback)
{
    myModel.findOne({_id: mid}, {}, {}, function (error, res) {
        if (error)
            callback('Err0');
        else
            callback(res);
    })
}

exports.getMeets = function(mids,callback)
{
    myModel.find({_id: {$in: mids}}, {}, {}, function (error, res) {
        if (error)
            callback('Err0');
        else
        {
            console.log('meets get OK .');
            callback(res);
        }
    })
}

exports.update = function(mid,account,img,callback)
{
    myModel.update({_id: mid}, {Receiver:account,ReceiverImage:img,Status:1,UpdatedTime:new Date().getTime()}, {}, function (error, res) {
        if (error)
        {
            callback('Err0');
        }
        else
        {
            console.log('Meet '+mid+" Update OK .");
            callback(0);
        }
    })
}

exports.updateValids = function(mid,valids,callback)
{
    myModel.update({_id: mid}, { $pushAll: {Valids: valids}}, {}, function (error, res) {
        if (error)
        {
            callback('Err0');
        }
        else
        {
            console.log('Meet '+mid+" Update Valid OK .");
            callback(0);
        }
    })
}

exports.updateValid = function(mid,valid,callback)
{
    myModel.update({_id: mid}, { $push: {Valids: valid}}, {}, function (error, res) {
        if (error)
        {
            callback('Err0');
        }
        else
        {
            console.log('Meet '+mid+" Update Valid OK .");
            callback(0);
        }
    })
}

exports.getValids = function(mid,callback)
{
    myModel.findOne({_id:mid},{Valids:1},{},function(error,res)
    {
        if (error)
        {
            callback('Err0');
        }
        else
        {
            console.log('Meet Valids Get OK .');
            callback(res);
        }
    });
}

exports.closeMeet = function(mid,callback)
{
    myModel.update({_id: mid}, {Status:3,UpdatedTime:new Date().getTime()}, {}, function (error, res) {
        if (error)
        {
            callback('Err0');
        }
        else
        {
            console.log('Meet '+mid+" Close OK .");
            callback(0);
        }
    })
}

exports.successMeet = function(mid,filter,callback)
{
    myModel.update({_id:mid},{Status:2,UpdatedTime:new Date().getTime(),ReceiverRequest:{Sex:filter.Sex,FaXing:filter.FaXing,YanJing:filter.YanJing,
        YiFuLeiXing:filter.YiFuLeiXing,YiFuYanSe:filter.YiFuYanSe,YiFuHuaWen:filter.YiFuHuaWen}},{}, function (error, res)
    {
        if (error)
        {
            callback('Err0');
        }
        else
        {
            console.log('Meet '+mid+" Success OK .");
            callback(0);
        }
    })
}

exports.successMeet2 = function(mid,callback)
{
    myModel.update({_id:mid},{Status:2,UpdatedTime:new Date().getTime()},{}, function (error, res)
    {
        if (error)
        {
            callback('Err0');
        }
        else
        {
            console.log('Meet '+mid+" Success OK .");
            callback(0);
        }
    })
}

exports.decreaseChance = function(id,callback)
{
    myModel.update({_id:id},{$inc:{Tries:-1}},{},function(error)
    {
        if (error)
        {
            callback('Err0');
        }
        else
        {
            console.log('Meet '+id+" decrease OK .");
            callback(0);
        }
    })
}

exports.meetMatch = function(sender,receiver,callback)
{
    myModel.findOne({Sender:sender,Receiver:receiver,Status:1},{Sender:1,Receiver:1,SenderImage:1,ReceiverImage:1},{},function(error,res)
    {
        if(error)
            callback(0);
        else
        {
            if(res==null)
                callback(0);
            else
            {
                console.log('found');
                callback(res);
            }
        }
    })
}

exports.getAll = function(callback)
{
    myModel.find({},{},{},function(err,res)
    {
        callback(res);
    })
}
