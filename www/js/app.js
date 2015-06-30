function myAlert(msg) {
    if (msg.length > 0) {
        $(".alert1P").text(msg);
        $(".alert1").fadeIn(0, function () {
            setTimeout(function () {
                $(".alert1").fadeOut(2000);
            }, 1000)
        });
    }
}

function calcCrow(lat1, lon1, lat2, lon2) {
    var R = 6371; // km
    var dLat = toRad(lat2 - lat1);
    var dLon = toRad(lon2 - lon1);
    var lat1 = toRad(lat1);
    var lat2 = toRad(lat2);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d;
}

// Converts numeric degrees to radians
function toRad(Value) {
    return Value * Math.PI / 180;
}

angular.module('starter', ['ionic', 'starter.controllers', 'DBService'])

    .run(function ($ionicPlatform, $rootScope, $state, $ionicPopup, GPS) {
        $ionicPlatform.ready(function () {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleLightContent();
            }

            moment.locale('zh-cn');
            window.plugins.jPushPlugin.init();

            $rootScope.jumpTo = function (state) {
                $state.go(state);
            }

            $rootScope.socketInit = function () {


                $rootScope.socket = io.connect(serverURL, {'force new connection': true});

                $rootScope.socket.on('connect', function () {
                    if ($rootScope.online == undefined) {
                        window.plugins.jPushPlugin.setAlias($rootScope.userInfo.Account);
                        $rootScope.socket.emit('setAccount', $rootScope.userInfo.Account);
                        $rootScope.socket.emit('meetInfo', {meets :$rootScope.userInfo.Meetings,id:$rootScope.userInfo.Account}, function (resx) {
                            var res0 = resx.meet;
                            var res1 = resx.msgs;
                            $rootScope.online = 123;
                            // var res1 = JSON.parse(res0);
                            //  alert(res1.length);
                            var m = 0;
                            for (m = 0; m < res0.length; m++) {
                                $rootScope.userInfo.meetInfo[res0[m]._id] = res0[m];
                            }
                            for(m=0;m<res1.length;m++)
                            {
                                //alert(res1[m].Text);
                                if($rootScope.userInfo.chat[res1[m].Account]==undefined)
                                    $rootScope.userInfo.chat[res1[m].Account] = [];
                                if($rootScope.userInfo.chatCount[res1[m].Account]==undefined)
                                    $rootScope.userInfo.chatCount[res1[m].Account] =0;
                                $rootScope.$apply(function()
                                {
                                    $rootScope.userInfo.chatCount[res1[m].Account] = $rootScope.userInfo.chatCount[res1[m].Account] + 1 ;
                                    $rootScope.userInfo.chat[res1[m].Account].push(res1[m]);
                                });
                            }
                            $rootScope.jumpTo('accountMain');
                        });
                    }
                });

                $rootScope.socket.on('quit', function (msg) {
                    $rootScope.online = undefined;
                    $rootScope.socket.disconnect();
                    $rootScope.socket = undefined;
                    $rootScope.userInfo = {};
                    GPS.clear();
                    var alertPopup = $ionicPopup.alert({
                        title: '您的账号在其他地方登入!',
                        template: '如不是本人操作,请立刻修改密码.'
                    });
                    alertPopup.then(function (res) {
                        $state.go('accountLogin');
                    });
                });

                $rootScope.socket.on('updateImage2', function (msg) {
                    $rootScope.userInfo.Image = msg;
                    $("#myPhoto").attr("src", serverURL + "image?id=" + $rootScope.userInfo.Image);
                });

                $rootScope.socket.on('newValid', function (id) {
                    $rootScope.$apply(function () {
                        $rootScope.userInfo.meetInfo[id].Alert = "new";
                    });
                });

                $rootScope.socket.on('meetRes1', function (data) {
                    if (data.status == 'success') {
                        $rootScope.userInfo.Meetings.push(data.meet._id);
                        $rootScope.userInfo.meetInfo[data.meet._id] = data.meet;
                        $rootScope.userInfo.meetInfo[data.meet._id].Valids = data.valids;
                        $rootScope.userInfo.currentMeet = data.meet._id;
                        $rootScope.userInfo.valids = data.valids;
                        $state.go('imageReview');
                    }
                    else {
                        var alertPopup = $ionicPopup.alert({
                            title: '发送失败',
                            template: '30S内只能发送一次.'
                        });
                    }
                });

                $rootScope.socket.on('meetRes2', function (data) {
                    $rootScope.userInfo.meetInfo[data.id].Valids = data.valids;
                    $rootScope.userInfo.currentMeet = data.id;
                    $rootScope.userInfo.valids = data.valids;
                    $state.go('imageReview');
                });

                $rootScope.socket.on('possibleMeet', function (mid) {
                    $rootScope.userInfo.WaitMeetings.push(mid);
                    if ($state.$current == 'styleSetting') {
                    }
                    else {
                        if ($rootScope.userInfo.lastStyleConf == undefined || new Date().getTime() - $rootScope.userInfo.lastStyleConf > 60000) {
                            $rootScope.userInfo.lastStyleConf = new Date().getTime();
                            var confirmPopup = $ionicPopup.confirm({
                                title: '您周围的人发起了嗨羞',
                                template: '是否前往更新您的个人信息?'
                            });
                            confirmPopup.then(function (res) {
                                if (res) {
                                    $rootScope.jumpTo('styleSetting');
                                } else {
                                }
                            });
                        }
                    }
                });

                $rootScope.socket.on('MeetAdd', function (data) {
                    $rootScope.$apply(function () {
                        $rootScope.userInfo.Meetings.push(data._id);
                        $rootScope.userInfo.meetInfo[data._id] = data;
                    });
                });

                $rootScope.socket.on('meetClose', function (id) {
                    $rootScope.$apply(function () {
                        $rootScope.userInfo.meetInfo[id].Status = 3;
                        $rootScope.userInfo.meetInfo[id].UpdatedTime = new Date().getTime();
                    });
                });

                $rootScope.socket.on('meetImages2', function (data) {
                    $rootScope.userInfo.currentMeet = data.mid;
                    $rootScope.userInfo.valids = data.valids;
                    $state.go('imageReview2');
                });

                $rootScope.socket.on('newFriend', function (data) {
                    $rootScope.$apply(function () {
                        $rootScope.userInfo.newFriendNum = $rootScope.userInfo.newFriendNum + 1;
                        $rootScope.userInfo.Friends.push(data);
                    });
                });

                $rootScope.socket.on('deleteFriendC', function (data) {
                    var idx = 0;
                    for (idx = 0; idx < $rootScope.userInfo.Friends.length; idx++) {
                        var fx = $rootScope.userInfo.Friends[idx];
                        if (fx.Account == data.id) {
                            $rootScope.$apply(function () {
                                $rootScope.userInfo.Friends.splice(idx, 1);
                            });
                            break;
                        }
                    }
                });

                $rootScope.socket.on('chatC',function(data)
                {
                    if($rootScope.userInfo.chat[data.Account]==undefined)
                        $rootScope.userInfo.chat[data.Account]=[];
                    if($rootScope.userInfo.chatCount[data.Account] == undefined)
                        $rootScope.userInfo.chatCount[data.Account] = 0;
                    $rootScope.$apply(function () {
                        $rootScope.userInfo.chat[data.Account].push(data);
                        $rootScope.userInfo.chatCount[data.Account] = $rootScope.userInfo.chatCount[data.Account]+1;
                    });
                })

                $rootScope.socket.on('successMeetC',function(data)
                {
                    $rootScope.$apply(function () {
                        $rootScope.userInfo.meetInfo[data.mid].Status = 2;
                        $rootScope.userInfo.meetInfo[data.mid].UpdatedTime = new Date().getTime();
                    });
                })

                $rootScope.socket.on("disconnect", function (msg) {
                    $rootScope.online = undefined;
                });

                $rootScope.socket.on('reconnect', function () {
                    $rootScope.online = 123;
                    $rootScope.socket.emit('setAccount', $rootScope.userInfo.Account);
                    alert("重连成功");
                })
            }
            $rootScope.userInfo = {};

        });

    })

    .config(function ($stateProvider, $urlRouterProvider) {

        // Ionic uses AngularUI Router which uses the concept of states
        // Learn more here: https://github.com/angular-ui/ui-router
        // Set up the various states which the app can be in.
        // Each state's controller can be found in controllers.js
        $stateProvider
            .state('accountLogin', {
                url: '/accountLogin',
                views: {
                    'main-view': {
                        templateUrl: 'templates/accountLogin.html'
                    }
                }
            })
            .state('accountRegist', {
                url: '/accountRegist',
                views: {
                    'main-view': {
                        templateUrl: 'templates/accountRegist.html'
                    }
                }
            })
            .state('accountMain', {
                url: '/accountMain',
                views: {
                    'main-view': {
                        templateUrl: 'templates/accountMain.html',
                        controller: 'accountMainCtrl'
                    }
                }
            })
            .state('accountSetting', {
                url: '/accountSetting',
                views: {
                    'main-view': {
                        templateUrl: 'templates/accountSetting.html',
                        controller: 'accountSettingCtrl'
                    }
                }
            })
            .state('styleSetting', {
                url: '/styleSetting',
                views: {
                    'main-view': {
                        templateUrl: 'templates/styleSetting.html',
                        controller: 'styleSettingCtrl'
                    }
                }
            })
            .state('psFaxing', {
                url: '/psFaxing',
                views: {
                    'main-view': {
                        templateUrl: 'templates/personStyle/faxing.html',
                        controller: 'styleSettingCtrl2'
                    }
                }
            })
            .state('psYanjing', {
                url: '/psYanjing',
                views: {
                    'main-view': {
                        templateUrl: 'templates/personStyle/yanjing.html',
                        controller: 'styleSettingCtrl2'
                    }
                }
            })
            .state('psYifuhuawen', {
                url: '/psYifuhuawen',
                views: {
                    'main-view': {
                        templateUrl: 'templates/personStyle/yifuhuawen.html',
                        controller: 'styleSettingCtrl2'
                    }
                }
            })
            .state('psYifuleixing', {
                url: '/psYifuleixing',
                views: {
                    'main-view': {
                        templateUrl: 'templates/personStyle/yifuleixing.html',
                        controller: 'styleSettingCtrl2'
                    }
                }
            })
            .state('psYifuyanse', {
                url: '/psYifuyanse',
                views: {
                    'main-view': {
                        templateUrl: 'templates/personStyle/yifuyanse.html',
                        controller: 'styleSettingCtrl2'
                    }
                }
            })
            .state('filterSetting', {
                url: '/filterSetting',
                views: {
                    'main-view': {
                        templateUrl: 'templates/filterSetting.html'
                    }
                }
            })
            .state('msXingbie', {
                url: '/msXingbie',
                views: {
                    'main-view': {
                        templateUrl: 'templates/filter/xingbie.html',
                        controller: 'filterSettingCtrl2'
                    }
                }
            })
            .state('msFaxing', {
                url: '/msFaxing',
                views: {
                    'main-view': {
                        templateUrl: 'templates/filter/faxing.html',
                        controller: 'filterSettingCtrl2'
                    }
                }
            })
            .state('msYanjing', {
                url: '/msYanjing',
                views: {
                    'main-view': {
                        templateUrl: 'templates/filter/yanjing.html',
                        controller: 'filterSettingCtrl2'
                    }
                }
            })
            .state('msYifuhuawen', {
                url: '/msYifuhuawen',
                views: {
                    'main-view': {
                        templateUrl: 'templates/filter/yifuhuawen.html',
                        controller: 'filterSettingCtrl2'
                    }
                }
            })
            .state('msYifuleixing', {
                url: '/msYifuleixing',
                views: {
                    'main-view': {
                        templateUrl: 'templates/filter/yifuleixing.html',
                        controller: 'filterSettingCtrl2'
                    }
                }
            })
            .state('msYifuyanse', {
                url: '/msYifuyanse',
                views: {
                    'main-view': {
                        templateUrl: 'templates/filter/yifuyanse.html',
                        controller: 'filterSettingCtrl2'
                    }
                }
            })
            .state('imageReview', {
                url: '/imageReview',
                views: {
                    'main-view': {
                        templateUrl: 'templates/imageReview.html',
                        controller: 'imageReviewCtrl'
                    }
                }
            })
            .state('selectOne', {
                url: '/selectOne',
                views: {
                    'main-view': {
                        templateUrl: 'templates/selectOne.html',
                        controller: 'selectOneCtrl'
                    }
                }
            })
            .state('meetInfo', {
                url: '/meetInfo',
                views: {
                    'main-view': {
                        templateUrl: 'templates/meetInfo.html',
                        controller: 'meetInfoCtrl'
                    }
                }
            })
            .state('filterSetting2', {
                url: '/filterSetting2',
                views: {
                    'main-view': {
                        templateUrl: 'templates/filterSetting2.html',
                        controller: 'filterSetting2Ctrl'
                    }
                }
            })
            .state('imageReview2', {
                url: '/imageReview2',
                views: {
                    'main-view': {
                        templateUrl: 'templates/imageReview2.html',
                        controller: 'imageReview2Ctrl'
                    }
                }
            })
            .state('selectOne2', {
                url: '/selectOne2',
                views: {
                    'main-view': {
                        templateUrl: 'templates/selectOne2.html',
                        controller: 'selectOne2Ctrl'
                    }
                }
            })
            .state('friendsList', {
                url: '/friendsList',
                views: {
                    'main-view': {
                        templateUrl: 'templates/friendsList.html',
                        controller: 'friendsListCtrl'
                    }
                }
            })
            .state('chat', {
                url: '/chat',
                views: {
                    'main-view': {
                        templateUrl: 'templates/chat.html',
                        controller: 'chatCtrl'
                    }
                }
            })
        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/accountLogin');

    });
