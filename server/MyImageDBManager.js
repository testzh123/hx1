/**
 * Created by Administrator on 2015-06-02.
 */

var mongoose = require('mongoose');
var modelName = 'image2Shejiao';
var mySchema = require('./MyImageSchema');
var db = require('./DBConnection').db;
var myModel = db.model(modelName, mySchema);

exports.clear = function (callback) {
    myModel.remove({}, function (err) {
        if (err) {
            console.log(err);
            callback('Err1');
        }
        else {
            console.log('Image collection removed');
            callback(0);
        }
    });
}

exports.add = function (image, type, callback) {
    var doc = {Data: image, Type: type};
    var obj = new myModel(doc);
    obj.save(function (error) {
        if (error) {
            callback(0);
        } else {
            console.log("Image saved OK. "+obj._id+" // "+obj.Size);
            callback(obj._id);
        }
    });
}

exports.get = function(id,callback)
{
    //console.log(id);
    myModel.findOne({_id:id}, {}, {}, function (error, result) {
        //console.log("23456");
        if (error) {
            console.log("Image DB error : " + error.message);
            callback(1);
        }
        else {
            if (result == null) {
                console.log("Image not found.");
                callback(2);
            }
            else {
                //console.log(result);
               callback(result);
            }
        }
    });
}

exports.getAll = function(callback)
{
    myModel.find({}, {}, {}, function (error, result) {
        if (error) {
            console.log("Image DB error : " + error.message);
            callback(1);
        }
        else {
            if (result == {}) {
                callback(2);
            }
            else {
                callback(result);
            }
        }
    });
}
