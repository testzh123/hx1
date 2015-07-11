/**
 * Created by cyzhabcde on 2015/5/6.
 */
var mongoose = require('mongoose');
var DBurl = 'mongodb://jingyu:testmm123@ds029317.mongolab.com:29317/jingyudb';
//var DBurl = ' mongodb://jingyu:testmm123@ds041992.mongolab.com:41992/jingyu2';
//var DBurl = 'mongodb://127.0.0.1:27017/jingyudb';
exports.db =  mongoose.createConnection(DBurl);