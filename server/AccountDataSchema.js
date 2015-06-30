/**
 * Created by Administrator on 2015-05-05.
 */
var mongoose = require('mongoose');

var AccountDataSchema = new mongoose.Schema({
    Account: {type:String,index:{unique:true}},
    Password:String,
    Nickname: {type:String},
    RegistDate:{type:Number,default: 0},
    Sex:{type:String,enum:['男','女'],default: '男'},
    Image:{type:String,default: ''},
    GPSPoint:{type:[Number],default:new Array(0,0),index: '2dsphere'},
    GPSUpdate:{type:Number,default:0},
    SpecialInfo:{FaXing:String,YanJing:String,YiFuLeiXing:String,YiFuYanSe:String,YiFuHuaWen:String,Update:Number},
    Meetings:{type:Array,default: []},
    WaitMeetings:{type:Array,default:[]},
    MeetingSent:{left:Number,update:Number},
    Friends:{type:Array,default:[]},
    Online:{type:Number,default:0}  // Online 1,Offline 0
});

module.exports = AccountDataSchema;