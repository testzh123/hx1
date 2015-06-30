/**
 * Created by Administrator on 2015-06-30.
 */
var mongoose = require('mongoose');

var MessageDataSchema = new mongoose.Schema({
    Account:String,
    Target:String,
    Text:String,
    Time:Number
});

module.exports =  MessageDataSchema;