/**
 * Created by Administrator on 2015-06-02.
 */
var mongoose = require('mongoose');

var MyImageSchema = new mongoose.Schema({
    Data:Buffer,
    Type:String
});

MyImageSchema.virtual('Size').get(function () {
    return this.Data.length;
});

module.exports =  MyImageSchema;