/**
 * Created by Administrator on 2015-06-02.
 */
var mongoose = require('mongoose');

var MyImageSchema = new mongoose.Schema({
    ID: {type:String,index:{unique:true}},
    Data:String,
    Type:String
});

MyImageSchema.virtual('Size').get(function () {
    return this.Data.length;
});

module.exports =  MyImageSchema;