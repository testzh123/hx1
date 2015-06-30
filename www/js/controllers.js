function doFail1($scope, $rootScope, $ionicPopup, fl) {
    $rootScope.userInfo.chanceLeft = $rootScope.userInfo.chanceLeft - 1;
    if ($rootScope.userInfo.chanceLeft > 0) {
        var alertPopup = $ionicPopup.alert({
            title: '抱歉，您并没有选中！',
            template: '您还有' + $rootScope.userInfo.chanceLeft + '次机会.'
        });
        alertPopup.then(function () {
            $rootScope.jumpTo('filterSetting2');
        })
    }
    else {
        var alertPopup = $ionicPopup.alert({
            title: '抱歉，您并没有选中！',
            template: '缘分还是顺其自然吧.'
        });
        alertPopup.then(function () {
            var id = $rootScope.userInfo.currentMeetInfo._id;
            $rootScope.socket.emit("meetRes3", {
                action: 'fail',
                mid: id,
                sender: $rootScope.userInfo.currentMeetInfo.Sender
            });
            $rootScope.userInfo.meetInfo[id].Status = 3;
            $rootScope.userInfo.meetInfo[id].ReceiverRequest = $rootScope.userInfo.filter;
            $rootScope.userInfo.meetInfo[id].UpdatedTime = new Date().getTime();
            $rootScope.jumpTo('accountMain');
        })
    }
}

angular.module('starter.controllers', [, 'DBService'])

    .controller("accountLoginCtrl", function ($scope, DB, $rootScope, GPS) {

        var GPSonSuccess = function (position) {
            if ($rootScope.userInfo.GPSPoint.length < 2) {
                $rootScope.userInfo.GPSPoint[0] = position.coords.longitude;
                $rootScope.userInfo.GPSPoint[1] = position.coords.latitude;
                $rootScope.socket.emit("updateGPS", {
                    'account': $rootScope.userInfo.Account,
                    'log': position.coords.longitude,
                    'lat': position.coords.latitude
                });
            }
            else {
                var dist = calcCrow(position.coords.latitude, position.coords.longitude, $rootScope.userInfo.GPSPoint[1], $rootScope.userInfo.GPSPoint[0])
                if (dist >= 0.05) {
                    $rootScope.userInfo.GPSPoint[0] = position.coords.longitude;
                    $rootScope.userInfo.GPSPoint[1] = position.coords.latitude;
                    $rootScope.socket.emit("updateGPS", {
                        'account': $rootScope.userInfo.Account,
                        'log': position.coords.longitude,
                        'lat': position.coords.latitude
                    });
                }
            }

        }
        var GPSonError = function (error) {
        }

        var logValidation = function () {
            var msg = "";
            if ($scope.loginPassword == undefined || $scope.loginPassword.length == 0)
                msg = "请填写密码";
            if ($scope.loginAccount == undefined || $scope.loginAccount.length == 0)
                msg = "请填写用户名";
            return msg;
        }

        $scope.login = function () {
            var msg = logValidation();
            if (msg.length == 0) {
                DB.get({
                        function: 'accountLogin',
                        account: $scope.loginAccount,
                        password: $scope.loginPassword
                    },
                    function (res) {
                        if (res.Status == "success") {
                            $rootScope.userInfo = res;
                            $rootScope.userInfo.meetInfo = {};
                            $rootScope.userInfo.newFriendNum = 0;
                            $rootScope.userInfo.chat = {};
                            $rootScope.userInfo.chatCount = {};
                            $rootScope.socketInit();
                            GPS.watch(GPSonSuccess, GPSonError);
                        }
                        else {
                            myAlert(res.Status);
                        }
                    });
            }
            else {
                myAlert(msg);
            }
        }
    })

    .controller("accountRegistCtrl", function ($scope, DB, $rootScope) {
        var regValidation = function ($scope) {
            var msg = "";
            if ($("input[name='radioSex']:checked").val() == undefined)
                msg = "请选择性别";
            if ($scope.userPassword == undefined || $scope.userPassword != $scope.userPasswordR)
                msg = "密码不一致";
            if ($scope.userPassword == undefined || $scope.userPassword.length == 0)
                msg = "密码不能为空";
            if ($scope.userName == undefined || $scope.userName.length == 0)
                msg = "昵称不能为空";
            if ($scope.userAccount == undefined || $scope.userAccount.length == 0)
                msg = "用户名不能为空";
            return msg;
        }

        $scope.regist = function () {
            var msg = regValidation($scope);
            if (msg.length == 0) {
                DB.get({
                        function: 'accountRegist',
                        account: $scope.userAccount,
                        name: $scope.userName,
                        password: $scope.userPassword,
                        sex: $("input[name='radioSex']:checked").val()
                    },
                    function (res) {
                        if (res.Status == 'success') {
                            $rootScope.jumpTo('accountLogin');
                            myAlert("注册成功！");
                        }
                        else {
                            myAlert(res.Status);
                        }
                    });
            }
            else {
                myAlert(msg);
            }
        }
    })
    .controller('accountMainCtrl', function ($scope, $ionicPopup, $rootScope) {
        // $rootScope.userInfo.meetInfo['559093ec6a9b4ff6073ec2dd'].Alert="new";
        $(document).ready(function () {
            $("#mainContent").css("height", +(window.innerHeight - 110) + "px");
        });
        $(window).resize(function () {
            $("#mainContent").css("height", +(window.innerHeight - 110) + "px");
        });

        $scope.url1 = serverURL + "image?id=";

        $scope.getSrc = function (x) {
            if (x.Sender == $rootScope.userInfo.Account) {
                return serverURL + "image?id=" + x.ReceiverImage;
            }
            else {
                if (x.Status == 2)
                    return serverURL + "image?id=" + x.SenderImage;
                else
                    return serverURL + "image?id=";
            }
        }

        $scope.doMeet = function (id) {
            $rootScope.userInfo.meetInfo[id].Alert = undefined;
            if ($rootScope.userInfo.meetInfo[id].Sender == $rootScope.userInfo.Account) {
                if ($rootScope.userInfo.meetInfo[id].Status == 0) {
                    $rootScope.socket.emit('checkValids', id);
                }
                else {
                    $rootScope.userInfo.currentMeetInfo = $rootScope.userInfo.meetInfo[id];
                    $rootScope.jumpTo('meetInfo');
                }
            }
            else {
                if ($rootScope.userInfo.meetInfo[id].Status == 1) {
                    $rootScope.userInfo.filter = {};
                    $rootScope.userInfo.currentMeetInfo = $rootScope.userInfo.meetInfo[id];
                    $rootScope.userInfo.chanceLeft = 2;
                    $rootScope.jumpTo('filterSetting2');
                }
                else {
                    $rootScope.userInfo.currentMeetInfo = $rootScope.userInfo.meetInfo[id];
                    $rootScope.jumpTo('meetInfo');
                }
            }
        }

        $scope.getStatus = function (data) {
            if (data.Status == 0)
                return '不在其中';
            if (data.Status == 1 && data.Sender == $rootScope.userInfo.Account)
                return '待对方回复';
            if (data.Status == 1 && data.Receiver == $rootScope.userInfo.Account)
                return '待回复';
            if (data.Status == 2)
                return '成功';
            if (data.Status == 3)
                return '失败';
            return '未知';
        }

        $scope.getTime = function (time) {
            return moment(time, 'x').fromNow();
        }

        $scope.getInfo = function (data) {
            if (data.Alert == undefined)
                return "";
            else
                return data.Alert;
        }

        $scope.getNew = function () {
            if ($rootScope.userInfo.newFriendNum == undefined || $rootScope.userInfo.newFriendNum == 0)
                return "";
            else
                return $rootScope.userInfo.newFriendNum;
        }

        $scope.filterUI = function () {
            var style = $rootScope.userInfo.SpecialInfo;
            if (style.FaXing.length == 0 || style.YanJing.length == 0 || style.YiFuHuaWen.length == 0 || style.YiFuYanSe.length == 0 || style.YiFuLeiXing.length == 0) {
                var alertPopup = $ionicPopup.alert({
                    title: '不能进行匹配',
                    template: '您的个人信息不完整!'
                });
            }
            else {
                if ($rootScope.userInfo.GPSPoint.length < 2) {
                    var alertPopup = $ionicPopup.alert({
                        title: '不能进行匹配',
                        template: '您的位置无法获取!'
                    });
                }
                else {
                    $rootScope.userInfo.filter = {};
                    $rootScope.userInfo.filter = {'location': ''};
                    if ($rootScope.userInfo.Sex == '男')
                        $rootScope.userInfo.filter.Sex = '女';
                    else
                        $rootScope.userInfo.filter.Sex = '男';
                    $rootScope.jumpTo('filterSetting');
                }
            }
        }


    })

    .controller('accountSettingCtrl', function ($scope, $rootScope, $state, GPS) {

        if ($rootScope.userInfo.GPSPoint.length == 2 && $rootScope.userInfo.GPSPoint[0] != 0 && $rootScope.userInfo.GPSPoint[1] != 0) {
            setTimeout(function () {
                GPS.showMap();
            }, 500);
        }


        $scope.exitLogin = function () {
            $rootScope.online == undefined;
            $rootScope.userInfo = {};
            $rootScope.socket.disconnect();
            $rootScope.socket = undefined;
            GPS.clear();
            $state.go('accountLogin');
        }

        var GPSonSuccess = function (position) {
            $rootScope.userInfo.GPSPoint[0] = position.coords.longitude;
            $rootScope.userInfo.GPSPoint[1] = position.coords.latitude;
            $rootScope.socket.emit("updateGPS", {
                'account': $rootScope.userInfo.Account,
                'log': position.coords.longitude,
                'lat': position.coords.latitude
            })
            GPS.showMap();
        }

        var GPSonError = function (error) {
            myAlert("GPS定位失败" + " " + error);
        }

        $scope.updateAddress = function () {
            GPS.update(GPSonSuccess, GPSonError)
        };
    })

    .controller('styleSettingCtrl', function ($scope, $rootScope, $ionicPopup) {
        //alert($rootScope.userInfo.SpecialInfo);
        //alert($rootScope.userInfo.Image);
        $("#myPhoto").attr("src", serverURL + "image?id=" + $rootScope.userInfo.Image);

        function CameraOnSuccess(data) {
            $("#myPhoto").attr("src", 'data:image/jpeg;base64,' + data);
            $rootScope.socket.emit("updateImage", {
                'type': 'jpeg',
                'account': $rootScope.userInfo.Account,
                'data': data
            });
        }


        function CameraOnFail(err) {
            myAlert("拍摄失败.");
        }

        $scope.getPhoto = function () {
            navigator.camera.getPicture(CameraOnSuccess, CameraOnFail, {
                quality: 50,
                destinationType: Camera.DestinationType.DATA_URL,
                encodingType: Camera.EncodingType.JPEG,
                targetWidth: 240,
                targetHeight: 240,
                correctOrientation: true,
                saveToPhotoAlbum: false,
                cameraDirection: 1
            });
        }

        $scope.goBack = function () {
            var style = $rootScope.userInfo.SpecialInfo;
            if (style.FaXing.length == 0 || style.YanJing.length == 0 || style.YiFuHuaWen.length == 0 || style.YiFuYanSe.length == 0 || style.YiFuLeiXing.length == 0) {
                var confirmPopup = $ionicPopup.confirm({
                    title: '个人信息不完整',
                    template: '不完整的信息会导致不能参与匹配,确定继续退出?'
                });
                confirmPopup.then(function (res) {
                    if (res) {
                        $rootScope.jumpTo('accountMain');
                    } else {
                    }
                });
            }
            else {
                if ($rootScope.userInfo.WaitMeetings.length > 0) {
                    $rootScope.socket.emit('doneStyle', {
                        mids: $rootScope.userInfo.WaitMeetings,
                        account: $rootScope.userInfo.Account
                    });
                    $rootScope.userInfo.WaitMeetings = [];
                    alert("12345");
                }
                $rootScope.jumpTo('accountMain');
            }
        }
    })

    .controller('styleSettingCtrl2', function ($scope, $rootScope) {
        $scope.setStyle = function (a, v) {
            $rootScope.userInfo.SpecialInfo[a] = v;
            //alert($rootScope.userInfo.SpecialInfo[a]);
            var complete = 1;
            var style = $rootScope.userInfo.SpecialInfo;
            if ($rootScope.userInfo.WaitMeetings.length == 0)
                complete = 0;
            if (style.FaXing.length == 0 || style.YanJing.length == 0 || style.YiFuHuaWen.length == 0 || style.YiFuYanSe.length == 0 || style.YiFuLeiXing.length == 0) {
                complete = 0;
            }
            $rootScope.socket.emit('styleSet', {
                account: $rootScope.userInfo.Account,
                'key': a,
                'val': v,
                'complete': complete,
                mids: $rootScope.userInfo.WaitMeetings,
                style: $rootScope.userInfo.SpecialInfo
            });
            if (complete == 1) {
                $rootScope.userInfo.WaitMeetings = [];
            }
            $rootScope.jumpTo('styleSetting');
        }
    })

    .controller('filterSettingCtrl', function ($scope, $rootScope, $ionicPopup) {
        $rootScope.userInfo.jumpState = 'filterSetting';
        $scope.submit = function () {
            var fl = $rootScope.userInfo.filter;
            if (fl.Sex.length == 0 || fl.location.length == 0 || fl.FaXing == undefined || fl.YanJing == undefined || fl.YiFuYanSe == undefined
                || fl.YiFuLeiXing == undefined || fl.YiFuHuaWen == undefined) {
                var alertPopup = $ionicPopup.alert({
                    title: '不能进行匹配',
                    template: '您的邂逅信息不完整!'
                });
            }
            else {
                var arr = new Array();
                var ti = 0;
                for (ti = 0; ti < $rootScope.userInfo.Meetings.length; ti++) {
                    var mi = $rootScope.userInfo.meetInfo[$rootScope.userInfo.Meetings[ti]];
                    if (mi.Sender == $rootScope.userInfo.Account && mi.Status == 1) {
                        arr.push(mi.Receiver);
                    }
                }

                if ($rootScope.userInfo.Friends != undefined) {
                    for (ti = 0; ti < $rootScope.userInfo.Friends.length; ti++) {
                        arr.push($rootScope.userInfo.Friends[ti].Account);
                    }
                }
                arr.push($rootScope.userInfo.Account);

                $rootScope.socket.emit('meet', {
                    Sex: fl.Sex,
                    ss: $rootScope.userInfo.Sex,
                    location: fl.location,
                    FaXing: fl.FaXing,
                    YanJing: fl.YanJing,
                    YiFuYanSe: fl.YiFuYanSe,
                    YiFuHuaWen: fl.YiFuHuaWen,
                    YiFuLeiXing: fl.YiFuLeiXing,
                    cood: $rootScope.userInfo.GPSPoint,
                    meetings: arr,
                    account: $rootScope.userInfo.Account,
                    image: $rootScope.userInfo.Image
                });
            }
        }
    })


    .controller('filterSettingCtrl2', function ($scope, $rootScope) {
        $scope.setMeeting = function (a, v) {
            $rootScope.userInfo.filter[a] = v;
            //alert($rootScope.userInfo.jumpState);
            $rootScope.jumpTo($rootScope.userInfo.jumpState);
        }

        $scope.back1 = function () {
            $rootScope.jumpTo($rootScope.userInfo.jumpState);
        }
    })

    .controller('imageReviewCtrl', function ($scope, $rootScope) {
        $scope.url1 = serverURL + "image?id=";

        $scope.pick = function (x) {
            $rootScope.userInfo.select = x;
            $rootScope.jumpTo('selectOne');
        }

        $scope.noMatch = function () {
            $rootScope.userInfo.meetInfo[$rootScope.userInfo.currentMeet].UpdatedTime = new Date().getTime();
            $rootScope.jumpTo('accountMain');
        }
    })

    .controller('selectOneCtrl', function ($scope, $rootScope) {
        $scope.url1 = serverURL + "image?id=";
        $scope.pick = function () {

            $rootScope.userInfo.select.mid = $rootScope.userInfo.currentMeet;
            $rootScope.userInfo.meetInfo[$rootScope.userInfo.currentMeet].Receiver = $rootScope.userInfo.select.Account;
            $rootScope.userInfo.meetInfo[$rootScope.userInfo.currentMeet].ReceiverImage = $rootScope.userInfo.select.Image;
            $rootScope.userInfo.meetInfo[$rootScope.userInfo.currentMeet].UpdatedTime = new Date().getTime();
            $rootScope.userInfo.meetInfo[$rootScope.userInfo.currentMeet].Status = 1;
            //alert($rootScope.userInfo.select.mid+" // "+$rootScope.userInfo.select.Account);
            $rootScope.socket.emit("meetMatch", $rootScope.userInfo.select);
            $rootScope.jumpTo('accountMain');
        }
    })
    .controller('meetInfoCtrl', function ($scope, $rootScope) {
        $scope.currentMeetInfo;

        if ($rootScope.userInfo.currentMeetInfo.Sender == $rootScope.userInfo.Account) {
            $scope.currentMeetInfo = $rootScope.userInfo.currentMeetInfo.SenderRequest;
            $("#myImage").attr("src", serverURL + "image?id=" + $rootScope.userInfo.currentMeetInfo.ReceiverImage);
        }
        else {
            $scope.currentMeetInfo = $rootScope.userInfo.currentMeetInfo.ReceiverRequest;
            if ($rootScope.userInfo.currentMeetInfo.Status == 2)
                $("#myImage").attr("src", serverURL + "image?id=" + $rootScope.userInfo.currentMeetInfo.SenderImage);
            else
                $("#myImage").attr("src", serverURL + "image?id=");
        }

        $scope.currentMeetInfo.Address = $rootScope.userInfo.currentMeetInfo.Address;
        var status = "成功";
        if ($rootScope.userInfo.currentMeetInfo.Status == 0)
            status = "未找到";
        else {
            if ($rootScope.userInfo.currentMeetInfo.Status == 1)
                status = "等待中";
            else {
                if ($rootScope.userInfo.currentMeetInfo.Status == 3) {
                    status = "失败";
                }
            }
        }
        $scope.currentMeetInfo.Status = status;
        $scope.currentMeetInfo.Time = moment($rootScope.userInfo.currentMeetInfo.UpdatedTime, 'x').fromNow();
    })

    .controller('filterSetting2Ctrl', function ($scope, $rootScope, $ionicPopup) {
        $rootScope.userInfo.jumpState = 'filterSetting2';
        $rootScope.userInfo.filter.Address = $rootScope.userInfo.currentMeetInfo.Address;
        if ($rootScope.userInfo.Sex == '男')
            $rootScope.userInfo.filter.Sex = '女';
        else
            $rootScope.userInfo.filter.Sex = '男';

        $scope.submit = function () {

            var fl = $rootScope.userInfo.filter;

            if (fl.FaXing == undefined || fl.YanJing == undefined || fl.YiFuYanSe == undefined
                || fl.YiFuLeiXing == undefined || fl.YiFuHuaWen == undefined) {
                var alertPopup = $ionicPopup.alert({
                    title: '不能进行匹配',
                    template: '您的邂逅信息不完整!'
                });
            }
            else {
                var num = 0;
                if (fl.FaXing == $rootScope.userInfo.currentMeetInfo.SenderRequest.FaXing)
                    num++;
                if (fl.YanJing == $rootScope.userInfo.currentMeetInfo.SenderRequest.YanJing)
                    num++;
                if (fl.YiFuHuaWen == $rootScope.userInfo.currentMeetInfo.SenderRequest.YiFuHuaWen)
                    num++;
                if (fl.YiFuYanSe == $rootScope.userInfo.currentMeetInfo.SenderRequest.YiFuYanSe)
                    num++;
                if (fl.YiFuLeiXing == $rootScope.userInfo.currentMeetInfo.SenderRequest.YiFuLeiXing)
                    num++;

                if (num >= 4 && fl.Sex == $rootScope.userInfo.currentMeetInfo.SenderSex) {

                    var arr = new Array();
                    var ti = 0;
                    for (ti = 0; ti < $rootScope.userInfo.Meetings.length; ti++) {
                        var mi = $rootScope.userInfo.meetInfo[$rootScope.userInfo.Meetings[ti]];
                        if (mi.Sender == $rootScope.userInfo.Account && mi.Status == 1) {
                            arr.push(mi.Receiver);
                        }
                    }

                    if ($rootScope.userInfo.Friends != undefined) {
                        for (ti = 0; ti < $rootScope.userInfo.Friends.length; ti++) {
                            arr.push($rootScope.userInfo.Friends[ti].Account);
                        }
                    }
                    arr.push($rootScope.userInfo.Account);

                    $rootScope.socket.emit('meetRes3', {
                        action: 'find',
                        filter: fl,
                        mid: $rootScope.userInfo.currentMeetInfo._id,
                        cood: $rootScope.userInfo.currentMeetInfo.GPSPoint,
                        uids: arr
                    });
                }
                else {
                    doFail1($scope, $rootScope, $ionicPopup);
                }

            }
        }
    })
    .controller('imageReview2Ctrl', function ($scope, $rootScope, $ionicPopup) {
        $scope.url1 = serverURL + "image?id=";

        $scope.pick = function (x) {
            $rootScope.userInfo.select = x;
            $rootScope.jumpTo('selectOne2');
        }

        $scope.noMatch = function () {
            doFail1($scope, $rootScope, $ionicPopup);
        }
    })

    .controller('selectOne2Ctrl', function ($scope, $rootScope, $ionicPopup) {
        $scope.url1 = serverURL + "image?id=";
        $scope.pick = function () {
            var m = $rootScope.userInfo.meetInfo[$rootScope.userInfo.currentMeet];
            if (m.Sender == $rootScope.userInfo.select.Account) {
                $rootScope.userInfo.meetInfo[$rootScope.userInfo.currentMeet].UpdatedTime = new Date().getTime();
                $rootScope.userInfo.meetInfo[$rootScope.userInfo.currentMeet].Status = 2;
                $rootScope.userInfo.meetInfo[$rootScope.userInfo.currentMeet].ReceiverRequest = $rootScope.userInfo.filter;
                $rootScope.socket.emit('meetRes3', {
                    action: 'friend',
                    filter: $rootScope.userInfo.filter,
                    mid: m._id,
                    user1: m.Sender,
                    user2: m.Receiver,
                    img1: m.SenderImage,
                    img2: m.ReceiverImage,
                    n2: $rootScope.userInfo.Nickname
                });
                var alertPopup = $ionicPopup.alert({
                    title: '匹配成功！',
                    template: '缘分就此开启.'
                });
                alertPopup.then(function () {
                    $rootScope.jumpTo('accountMain');
                });
            }
            else {
                doFail1($scope, $rootScope, $ionicPopup);
            }
        }
    })
    .controller('friendsListCtrl', function ($scope, $rootScope) {
        $rootScope.userInfo.newFriendNum = 0;
        $scope.url1 = serverURL + "image?id=";
        $(document).ready(function () {
            $("#mainContent").css("height", +(window.innerHeight - 110) + "px");
        });
        $(window).resize(function () {
            $("#mainContent").css("height", +(window.innerHeight - 110) + "px");
        });
        $scope.deleteFriend = function (x) {
            var idx = 0;
            for (idx = 0; idx < $rootScope.userInfo.Friends.length; idx++) {
                var fx = $rootScope.userInfo.Friends[idx];
                if (fx.Account == x.Account) {
                    $rootScope.userInfo.Friends.splice(idx, 1);
                    break;
                }
            }
            $rootScope.socket.emit("deleteFriendS", {u1: x.Account, u2: $rootScope.userInfo.Account});
        }
        $scope.openChat = function (x) {
            $rootScope.userInfo.chatTarget = x;
            if ($rootScope.userInfo.chatCount[x.Account] == undefined)
                $rootScope.userInfo.chatCount[x.Account] = 0;
            if ($rootScope.userInfo.chat[x.Account] == undefined)
                $rootScope.userInfo.chat[x.Account] = [];
            $rootScope.jumpTo('chat');
        }

        $scope.getNew = function (account) {
            if ($rootScope.userInfo.chatCount[account] == undefined || $rootScope.userInfo.chatCount[account] == 0)
                return "";
            else
                return $rootScope.userInfo.chatCount[account];
        }
    })
    .controller('chatCtrl', function ($scope, $rootScope, $ionicScrollDelegate) {
        $rootScope.userInfo.chatCount[$rootScope.userInfo.chatTarget.Account] = 0;
        $scope.showTime = 0;
        $scope.test1 = moment;
        $scope.onSwipeLeft = function () {
            if ($scope.showTime == 0) {
                $scope.showTime = 1;
            }
        }

        $scope.onSwipeRight = function () {
            if ($scope.showTime == 1) {
                $scope.showTime = 0;
            }
        }

        $(document).ready(function () {
            $ionicScrollDelegate.$getByHandle('mainScroll').scrollBottom();
        });

        $(window).resize(function () {
            $ionicScrollDelegate.$getByHandle('mainScroll').scrollBottom();
        });

        $scope.message = "";

        $scope.getStyle = function(x)
        {
            if(x.Account == $rootScope.userInfo.Account)
            {
                if($scope.showTime==0)
                    return {'word-wrap': 'break-word','word-break':'break-all','width':'75%','color':'blue','position':'relative','left':'25%','text-align':'right','font-size':'25px'};
                else
                    return {'word-wrap': 'break-word','word-break':'break-all','width':'75%','color':'blue','position':'relative','left':'5%','text-align':'right','font-size':'25px'};
            }
            else
            {
                //alert(x.Time);
                return {'word-wrap': 'break-word','word-break':'break-all','width':'75%','color':'red','position':'relative','left':'0%','text-align':'left','font-size':'25px'};
            }
        }

        $scope.getStyle2 = function()
        {
            if($scope.showTime==0)
                return {'display':'none'};
            else
                return {'width:':'20%','float':'right','font-size':'14px','color':'black','position':'relative','top':'-10px'};
        }

        $scope.getTime = function (x) {
            return moment(x.Time.getTime(), 'x').fromNow();
        }

        $scope.sendMessage = function () {
            if ($scope.message.length > 0) {
                var data = {Account: $rootScope.userInfo.Account, Text: $scope.message, Time: new Date().getTime()};
                $rootScope.userInfo.chat[$rootScope.userInfo.chatTarget.Account].push(data);
                data.Target = $rootScope.userInfo.chatTarget.Account;
                $rootScope.socket.emit("chatS", data);
                $scope.message = "";
            }
        }
    })

