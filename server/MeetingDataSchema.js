/**
 * Created by Administrator on 2015-06-02.
 */

var mongoose = require('mongoose');
var MeetingDataSchema = new mongoose.Schema({
    SenderImage:String,
    ReceiverImage:{type:String,default:'0'},
    Sender:{type:String},
    SenderSex:{type:String},
    Receiver:{type:String,default:''},
    Address:String,
    Status:{type:Number,default:0},
    UpdatedTime:{type:Number,default:0},
    SenderRequest:{Sex:String,FaXing:String,YanJing:String,YiFuYanSe:String,YiFuHuaWen:String,YiFuLeiXing:String},
    ReceiverRequest:{Sex:String,FaXing:String,YanJing:String,YiFuYanSe:String,YiFuHuaWen:String,YiFuLeiXing:String},
    Valids:{type:Array,default:[]},
    GPSPoint:{type:[Number]},
    Tries:{type:Number,default:2}
});

module.exports =  MeetingDataSchema;