/**
 * Created by pennsong on 6/22/15.
 */
var http = require('http');
var request = require('request');
var mongoose = require('mongoose');
var URL = require('url');
var crypto = require('crypto');
var crypto_key = "88580850";
var JPush = require("jpush-sdk");
var JPushclient = JPush.buildClient('52d656115f4f91199e49deaa', '8468e9d99e5d7a62f2004264');
var accountDB = require('./AccountDBManager');
var imageDB = require('./MyImageDBManager');
var meetDB = require('./MeetingDBManager');
var msgDB = require('./MessageDBManager');
var asMap = {};
var iaMap = {};
var pmMap = {};
var pushMap = {};

var pushMsg = function(uid,msg)
{
    if(pushMap[uid]==undefined || new Date().getTime()-pushMap[uid]>=600000)
    {
        pushMap[uid] = new Date().getTime();
        JPushclient.push().setPlatform(JPush.ALL)
            .setAudience(JPush.alias(uid))
            .setNotification('Hi, JPush', JPush.ios(msg))
            .send(function(err, res) {
                if (err) {
                    console.log(err.message);
                } else {
                    console.log('Sendno: ' + res.sendno);
                    console.log('Msg_id: ' + res.msg_id);
                }
            });
    }
}

var styleMatch= function(s1,s2)
{
    var num = 0;
    if(s1.FaXing == s2.FaXing)
        num++;
    if(s1.YanJing == s2.YanJing)
        num++;
    if(s1.YiFuHuaWen == s2.YiFuHuaWen)
        num++;
    if(s1.YiFuYanSe == s2.YiFuYanSe)
        num++;
    if(s1.YiFuLeiXing == s2.YiFuLeiXing)
        num++;
    return num;
}

var DBRouter = function (p, req, res) {
    if (p.query.function != undefined && p.query.callback != undefined) {

        if (p.query.function == 'accountRegist') {
            accountDB.add(p.query.account, p.query.password, p.query.name, p.query.sex, function (msg) {
                res.writeHead(200, 'charset=utf-8');
                res.end(p.query.callback + '({"Status": "' + msg + '" })');
            })
        }

        if (p.query.function == 'accountLogin') {
            accountDB.logIn(p.query.account, p.query.password, function (msg) {
                var js = JSON.parse(msg);
                if (asMap[p.query.account] != undefined) {
                    asMap[p.query.account].emit('quit', "");
                    iaMap[asMap[p.query.account].id] = undefined;
                    asMap[p.query.account] = undefined;
                }
                res.writeHead(200, 'charset=utf-8');
                res.end(p.query.callback + '(' + msg + ')');
            })
        }

        if(p.query.function == 'getImage')
        {
            getImage2(p,req,res);
        }

    }
    else {
        res.end(0);
    }

}


var getImage = function (p, req, res) {
    if (p.query.id != undefined && p.query.id.length>1) {
        imageDB.get(p.query.id, function (msg) {
            //console.log(msg);
            if (msg == 1 || msg == 2) {
                res.end();
            }
            else {
                var d = msg.Data.substr(msg.Data.indexOf(',')+1);
                d = new Buffer(d,'base64')
                res.writeHead(200, {"Content-type": "image/"+msg.Type});
                res.end(d);
            }
        })
    }
    else {
        imageDB.get('0', function (msg) {
            if (msg == 1 || msg == 2) {
                res.end();
            }
            else {
                var d = msg.Data.substr(msg.Data.indexOf(',')+1);
                d = new Buffer(d,'base64')
                res.writeHead(200, {"Content-type": "image/"+msg.Type});
                res.end(d);
            }
        })
    }
}

var getImage2 = function (p, req, res) {
    if (p.query.id != undefined && p.query.id.length>1) {
        imageDB.get(p.query.id, function (msg) {
            //console.log(msg);
            if (msg == 1 || msg == 2) {
                res.end();
            }
            else {
                res.writeHead(200, 'charset=utf-8');
                msg.Status =='success';
                console.log(msg);
                res.end(p.query.callback + '(' + msg + ')');
            }
        })
    }
    else {
        imageDB.get('0', function (msg) {
            if (msg == 1 || msg == 2) {
                res.end();
            }
            else {
                res.writeHead(200, 'charset=utf-8');
                console.log(msg);
                res.end(p.query.callback + '(' + msg.Data + ')');
            }
        })
    }
}

var requestFunction = function (req, res) {

    var p = URL.parse(req.url, true);
    var valid = 0;

    if (p.query == "/favicon.ico") {
        valid = 1;
        res.end();
        return;
    }


    (p.query != null && p.query.pathname != '/socket.io')
    console.log(req.method + " ; " + p.pathname + " ; " + req.url);

    if (p.pathname == '/DBManager') {
        valid = 1;
        DBRouter(p, req, res);
    }

    if (p.pathname == '/image') {
        valid = 1;
        getImage(p, req, res);
    }

    if (valid == 0)
        res.end();
}

var server = http.createServer();
server.on('request', requestFunction);
var port1 = process.env.PORT || 4334;
server.listen(port1);

var io = require('socket.io')(server);
io.on('connection', function (socket) {

    socket.on('setAccount', function (data) {
        iaMap[socket.id] = data+"";
        asMap[data+""] = socket;
        console.log("Account " + data + " log in . ");
    });

    socket.on('disconnect', function () {
        var account = iaMap[socket.id];
        if (account != undefined) {
            console.log("Account " + account + " log out . ");
            asMap[account] = undefined;
            iaMap[socket.id] = undefined;
        }
    });

    socket.on('myInfo',function(data,fn)
    {
        accountDB.getAccount(data.uid,function(res0)
        {
            if(res0!=null)
            {
                meetDB.getMeets(res0.Meetings,function(res1)
                {
                    msgDB.get(data.uid,function(res2)
                    {
                        fn({uinfo:res0,meet: res1,msgs:res2});
                    });
                });
            }
        })
    });

    socket.on('updateGPS',function(data)
    {
        accountDB.updateGPS(data.account,data.log,data.lat,function(msg){});
    });

    socket.on('updateImageS',function(data)
    {
        imageDB.add(data.id,data.data, data.type, function (id) {
            //socket.emit('updateImageC',data.id);
            accountDB.updateImage(data.account, data.id, function (r2) {});
        });
    });

    socket.on('styleSet',function(data)
    {
        accountDB.setStyle(data.account,data.key,data.val,function(msg){
            if(data.complete==1 && data.mids.length>0)
            {
                //console.log("!!"+data.mids);
                meetDB.getMeets(data.mids,function(res)
                {
                    //console.log("!!!"+res.length);
                    var i0 =0;
                    for(i0=0;i0<res.length;i0++)
                    {
                        var m =res[i0];
                        if(m.Status == 0 && styleMatch(m.SenderRequest,data.style)>=4)
                        {
                            meetDB.updateValid(m._id,data.account,function(msg){});
                            var uid = m.Sender;
                            //console.log(uid);
                            if(asMap[uid]!=undefined)
                            {
                                asMap[uid].emit("newValid", m._id);
                            }
                            else
                            {
                                //push methods
                            }
                        }
                    }
                })
                accountDB.clearWaitMeets(data.account,function(err){});
            }
        });
    });

    socket.on('meet',function(data)
    {
        console.log(JSON.stringify(data));
       accountDB.checkMeetTime(data.account,function(res0)
       {
            if(res0!=null && new Date().getTime()-res0.MeetingSent.update>30000)
            {
                meetDB.add(data.account,data.image,data.ss,data.Sex,data.FaXing,data.location,data.YanJing,data.YiFuLeiXing,data.YiFuYanSe,data.YiFuHuaWen,data.cood,data.senderStyle,function(res1)
                {
                    accountDB.updateMeetTime(data.account,function(msg){});
                    accountDB.searchNear(data.Sex,data.cood,data.meetings,function(res2)
                    {
                        var ti=0;
                        var valid = [];
                        var uncomplete = [];

                        for(ti=0;ti<res2.length;ti++)
                        {
                            var obj = res2[ti].obj;
                            if(obj.Account == data.account)
                                continue;
                            if(obj.SpecialInfo.FaXing.length==0 || obj.SpecialInfo.YanJing.length==0 || obj.SpecialInfo.YiFuHuaWen.length==0
                                || obj.SpecialInfo.YiFuLeiXing.length==0 || obj.SpecialInfo.YiFuYanSe.length==0)
                            {
                                uncomplete.push(obj.Account);
                            }
                            else
                            {
                                var num =styleMatch(obj.SpecialInfo,data);
                                if(num>=4)
                                {
                                    valid.push({Account:obj.Account,Image:obj.Image});
                                }
                            }
                        }

                        accountDB.addMeet(data.account,res1._id,function(msg){});
                        meetDB.updateValids(res1._id,valid,function(msg){});
                        socket.emit('meetRes1',{meet:res1,valids:valid,status:'success'});
                        if(uncomplete.length>0)
                            pmMap[res1._id] = uncomplete;
                    });
                })
            }
            else
            {
                console.log(new Date().getTime()-res0.MeetingSent.update);
                socket.emit('meetRes1',{status:'ERR'});
            }
        })


    })

    socket.on('checkValids',function(data)
    {
        //console.log("!"+data);
        meetDB.getValids(data,function(msg)
        {
            if(msg!=null && msg!='ERR0')
            {
                //console.log(msg);
                socket.emit('meetRes2',{valids:msg.Valids,id:data});
            }
        })
    });

    socket.on('meetMatch',function(data)
    {
        console.log(JSON.stringify(data));
        meetDB.meetMatch(data.Account,data.sender,function(res)
        {
            if(res==0)
            {
                pushMsg(data.Account,'有人发起了新嗨羞');
                accountDB.addMeet(data.Account,data.mid,function(msg1){});
                meetDB.update(data.mid,data.Account,data.Image,function(msg2){
                    meetDB.getMeet(data.mid,function(msg3)
                    {
                        if(asMap[data.Account]!=undefined)
                        {
                            console.log(msg3);
                            asMap[data.Account].emit('MeetAdd',msg3);
                        }
                        else
                        {
                        }
                    })
                });
            }
            else
            {
                console.log(JSON.stringify(res));
                meetDB.successMeet2(res._id,function(msg){});
                meetDB.successMeet2(data.mid,function(msg){});
                accountDB.deleteMeet(data.sender,data.mid,function(msg){});
                if(asMap[data.Account] != undefined)
                {
                    asMap[data.Account].emit('successMeetC',{mid:res._id});
                }
                else
                {

                }

                socket.emit('successMeetC',{mid:res._id});
                socket.emit('successMeetC2',{mid:data.mid});

                accountDB.getNickname(data.sender,function(n1)
                {
                    accountDB.getNickname(data.Account,function(n2)
                    {
                        accountDB.addFriend(data.sender,data.Account,n2,res.SenderImage,new Date().getTime(),function(msg){});
                        accountDB.addFriend(data.Account,data.sender,n1,res.ReceiverImage,new Date().getTime(),function(msg){});
                        if(asMap[data.Account] != undefined)
                        {
                            asMap[data.Account].emit('newFriend',{Account:data.sender,Nickname:n1,Image:res.ReceiverImage,Time:new Date().getTime()});
                        }
                        else
                        {

                        }
                        socket.emit('newFriend',{Account:data.Account,Nickname:n2,Image:res.SenderImage,Time:new Date().getTime()})
                    })
                })
            }
        });
    });

    socket.on('meetUncomplete',function(data)
    {
        var uncomplete =   pmMap[data.id];
        if(uncomplete!=undefined && uncomplete.length>0)
        {
            accountDB.updateWaitedMeetings(uncomplete,data.id,function(err){});
            var ti = 0;
            for(ti=0;ti<uncomplete.length;ti++)
            {
                if(asMap[uncomplete[ti]]!=undefined)
                {
                    asMap[uncomplete[ti]].emit('possibleMeet',data.id);
                }
                else
                {
                }
            }
        }
    });

    socket.on('meetRes3',function(data)
    {
       if(data.action=='fail')
       {
           console.log("!"+data.mid);
           meetDB.closeMeet(data.mid,function(msg){});
           if(asMap[data.sender]!=undefined)
           {
               asMap[data.sender].emit('meetClose',data.mid);
           }
           else
           {
               //push methods
           }
       }

        if(data.action=='find')
        {
            //console.log(data);
            accountDB.searchNear(data.filter.Sex,data.cood,data.uids,function(res2) {
                //console.log(res2);
                var ti = 0;
                var valid = [];

                for (ti = 0; ti < res2.length; ti++) {
                    var obj = res2[ti].obj;
                    if (obj.SpecialInfo.FaXing.length == 0 || obj.SpecialInfo.YanJing.length == 0 || obj.SpecialInfo.YiFuHuaWen.length == 0
                        || obj.SpecialInfo.YiFuLeiXing.length == 0 || obj.SpecialInfo.YiFuYanSe.length == 0) {
                    }
                    else
                    {
                        var num =styleMatch(obj.SpecialInfo,data.filter);
                        if(num>=4)
                        {
                            valid.push({Account:obj.Account,Image:obj.Image});
                        }
                        else
                        {
                            console.log(JSON.stringify(data.filter)+" // "+num);
                        }
                    }
                }

                while(valid.length<4)
                    valid.push({Account:"11fake11",Image:'0'})

                socket.emit('meetImages2',{mid:data.mid,valids:valid,status:'success'});
                //console.log(valid);
            });
        }

        if(data.action=='friend')
        {
            console.log(JSON.stringify(data));
            meetDB.successMeet(data.mid,data.filter,function(msg){});
            accountDB.addFriend(data.user1,data.user2,data.n2,data.img2,data.time,function(msg){});
            accountDB.getNickname(data.user1,function(n1)
            {
                accountDB.addFriend(data.user2,data.user1,n1,data.img1,data.time,function(msg){
                    if(asMap[data.user1] != undefined)
                    {
                        asMap[data.user1].emit('newFriend',{Account:data.user2,Nickname:data.n2,Image:data.img2,Time:data.time});
                        asMap[data.user1].emit('successMeetC',{mid:data.mid});
                    }
                    else
                    {

                    }
                    if(asMap[data.user2] != undefined)
                    {
                        asMap[data.user2].emit('newFriend',{Account:data.user1,Nickname:n1,Image:data.img1,Time:data.time});
                    }
                    else
                    {

                    }
                });
            })
        }
    });

    socket.on('deleteFriendS',function(data)
    {
        if(asMap[data.u1] != undefined)
        {
            asMap[data.u1].emit('deleteFriendC',{id : data.u2});
        }
        else
        {

        }
        accountDB.deleteFriend(data.u1,data.u2,function(msg){});
        accountDB.deleteFriend(data.u2,data.u1,function(msg){});
    });

    socket.on('chatS',function(data)
    {
        console.log(data);
        pushMsg(data.Target,'有人发给你一条新消息');
        if(asMap[data.Target]!=undefined)
        {
            asMap[data.Target].emit("chatC",data);
        }
        else
        {
            msgDB.add(data.Account,data.Target,data.Text,data.Time,function(msg){});
        }
    })

    socket.on('imageS',function(data)
    {
        console.log(data);
        if (data.id != undefined && data.id.length>1) {
            imageDB.get(data.id, function (msg) {
                socket.emit('imageC',{Data:msg.Data,id:data.id,cid:data.cid,len:data.len});
            })
        }
        else {
            imageDB.get('0', function (msg) {
                  socket.emit('imageC',{Data:msg.Data,id:data.id,cid:data.cid,len:data.len});
            })
        }
    })

    socket.on('meetDecrease',function(data)
    {
        meetDB.decreaseChance(data.id,function(msg){});
    })
});

console.log('Server running at ' + process.env.IP + ":" + process.env.PORT);