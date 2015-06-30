/**
 * Created by Administrator on 2015-06-30.
 */
var mongoose = require('mongoose');
var modelName = 'messageShejiao2';
var MySchema = require('./MessageDataSchema');
var db = require('./DBConnection').db;
var myModel = db.model(modelName, MySchema);

exports.clear = function (callback) {
    myModel.remove({}, function (err) {
        if (err) {
            console.log(err);
            callback(1);
        }
        else {
            console.log('Message collection removed');
            callback(0);
        }
    });
}

exports.add = function(account,target,text,time,callback)
{
    var doc = {
        Account: account,
        Target: target,
        Text: text,
        Time: time
    };
    var obj = new myModel(doc);
    obj.save(function (error) {
        if (error) {
            console.log("Message DB error : " + error.message);
            callback('ERR1');
        } else {
            console.log('Message saved OK!');
            callback(0);
        }
    });
}

exports.get = function(account,callback)
{
    myModel.find({Target:account},{},{Time:1},function(err,res)
    {
        if(err)
        {
            console.log("Message DB error : " + error.message);
            callback([]);
        }
        else
        {
            console.log('Message Get OK');
            var ti = 0;
            for(ti=0;ti<res.length;ti++)
            {
                var obj = new myModel(res[ti]);
                obj.remove(function(err2){});
            }
            callback(res);
        }
    })
}

exports.getAll = function(callback)
{
    myModel.find({},{},{Time:1},function(err,res)
    {
        if(err)
        {
            console.log("Message DB error : " + error.message);
            callback([]);
        }
        else
        {
            console.log('Message Get OK');
            callback(res);
        }
    })
}