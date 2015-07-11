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
            setTimeout(function()
            {
                window.plugins.jPushPlugin.init();
            },500);


            $rootScope.jumpTo = function (state) {
                $state.go(state);
            }

            $rootScope.tempImages = {};

            $rootScope.socketInit = function () {

                $rootScope.socket = io.connect(serverURL, {'force new connection': true});

                $rootScope.socket.on('connect', function () {
                    setTimeout(function()
                    {
                        window.plugins.jPushPlugin.setAlias($rootScope.userInfo.Account);
                    },500);
                    $rootScope.socket.emit('setAccount', $rootScope.userInfo.Account);
                    $rootScope.socket.emit('myInfo', {
                        uid: $rootScope.userInfo.Account
                    }, function (resx) {
                        $rootScope.userInfo = resx.uinfo;
                        $rootScope.userInfo.meetInfo = {};
                        $rootScope.userInfo.newFriendNum = 0;
                        $rootScope.userInfo.chat = {};
                        $rootScope.userInfo.chatCount = {};
                        var res0 = resx.meet;
                        var res1 = resx.msgs;
                        var m = 0;
                        for (m = 0; m < res0.length; m++) {
                            $rootScope.userInfo.meetInfo[res0[m]._id] = res0[m];
                        }
                        for (m = 0; m < res1.length; m++) {
                            if ($rootScope.userInfo.chat[res1[m].Account] == undefined)
                                $rootScope.userInfo.chat[res1[m].Account] = [];
                            if ($rootScope.userInfo.chatCount[res1[m].Account] == undefined)
                                $rootScope.userInfo.chatCount[res1[m].Account] = 0;
                            $rootScope.$apply(function () {
                                $rootScope.userInfo.chatCount[res1[m].Account] = $rootScope.userInfo.chatCount[res1[m].Account] + 1;
                                $rootScope.userInfo.chat[res1[m].Account].push(res1[m]);
                            });
                        }
                        $rootScope.jumpTo('accountMain');
                        $rootScope.online = 's0';
                    });
                });

                $rootScope.socket.on('imageC', function (data) {
                    //setTimeout(function()
                    //{
                    var img = new Image();
                    img.src = data.Data;
                    img.onload = function () {
                        $rootScope.$apply(function () {
                            $rootScope.tempImages [data.id] = {w: img.width, h: img.height, Data: data.Data};
                            showImage(data.id, data.cid, data.len, $rootScope);
                        });
                    }
                    //},10000);
                });

                $rootScope.socket.on('quit', function (msg) {

                    $rootScope.online = undefined;
                    $rootScope.socket.disconnect();
                    $rootScope.socket = undefined;
                    $rootScope.userInfo = {};
                    $state.go('accountLogin');
                    GPS.clear();
                    $rootScope.online = 's0';
                    var alertPopup = $ionicPopup.alert({
                        title: '您的账号在其他地方登入!',
                        template: '如不是本人操作,请立刻修改密码.'
                    });
                });

                $rootScope.socket.on('updateImageC', function (msg) {
                    //$rootScope.tempImages[msg] = $rootScope.tempImages[$rootScope.userInfo.Image];
                    //$rootScope.userInfo.Image = msg;
                });

                $rootScope.socket.on('newValid', function (id) {
                    $rootScope.$apply(function () {
                        $rootScope.userInfo.meetInfo[id].Alert = "new";
                    });
                });

                $rootScope.socket.on('meetRes1', function (data) {
                    if (data.status == 'success') {
                        $rootScope.$apply(function()
                        {
                            $rootScope.userInfo.Meetings.push(data.meet._id);
                            $rootScope.userInfo.meetInfo[data.meet._id] = data.meet;
                            $rootScope.userInfo.meetInfo[data.meet._id].Valids = data.valids;
                            $rootScope.userInfo.currentMeet = data.meet._id;
                            $rootScope.userInfo.valids = data.valids;
                            $rootScope.userInfo.meetInfo[data.id].before = '几秒前';
                        });
                        $state.go('imageReview');
                    }
                    else {
                        var alertPopup = $ionicPopup.alert({
                            title: '发送失败',
                            template: '30S内只能发送一次.'
                        });
                        alertPopup.then(function () {
                            $rootScope.jumpTo('accountMain');
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
                    if ($rootScope.userInfo.lastStyleNotify == undefined || new Date().getTime() - $rootScope.userInfo.lastStyleNotify >= 600000) {
                        $rootScope.userInfo.lastStyleNotify = new Date().getTime();
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
                    }
                });

                $rootScope.socket.on('MeetAdd', function (data) {
                    $rootScope.$apply(function () {
                        $rootScope.userInfo.Meetings.push(data._id);
                        $rootScope.userInfo.meetInfo[data._id] = data;
                        $rootScope.userInfo.meetInfo[data._id].Alert = 'new';
                    });
                });

                $rootScope.socket.on('meetClose', function (id) {
                    $rootScope.$apply(function () {
                        $rootScope.userInfo.meetInfo[id].Alert = 'new';
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
                    var confirmPopup = $ionicPopup.confirm({
                        title: '新的好友',
                        template: '您已经与'+data.Nickname+'成功成为好友，是否前去聊天?'
                    });
                    confirmPopup.then(function (res) {
                        if (res) {
                            var x = data;
                            $rootScope.userInfo.chatTarget = x;
                            if ($rootScope.userInfo.chatCount[x.Account] == undefined)
                                $rootScope.userInfo.chatCount[x.Account] = 0;
                            if ($rootScope.userInfo.chat[x.Account] == undefined)
                                $rootScope.userInfo.chat[x.Account] = [];
                            $rootScope.jumpTo('chat');
                        } else {
                        }
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

                $rootScope.socket.on('chatC', function (data) {
                    if ($rootScope.userInfo.chat[data.Account] == undefined)
                        $rootScope.userInfo.chat[data.Account] = [];
                    if ($rootScope.userInfo.chatCount[data.Account] == undefined)
                        $rootScope.userInfo.chatCount[data.Account] = 0;
                    $rootScope.$apply(function () {
                        $rootScope.userInfo.chat[data.Account].push(data);
                        $rootScope.userInfo.chatCount[data.Account] = $rootScope.userInfo.chatCount[data.Account] + 1;
                    });
                })

                $rootScope.socket.on('successMeetC', function (data) {
                    $rootScope.$apply(function () {
                        $rootScope.userInfo.meetInfo[data.mid].Status = 2;
                        $rootScope.userInfo.meetInfo[data.mid].Alert = 'new';
                        $rootScope.userInfo.meetInfo[data.mid].UpdatedTime = new Date().getTime();
                    });
                })

                $rootScope.socket.on('successMeetC2', function (data) {
                    $rootScope.$apply(function () {
                        delete $rootScope.userInfo.meetInfo[data.mid];
                    });
                })

                $rootScope.socket.on("disconnect", function (msg) {
                    if ($rootScope.online == 's2') {

                    }
                    else {
                        alert("断线了");
                    }
                    $rootScope.online = 's0';
                });

                $rootScope.socket.on('reconnect', function () {
                    alert("已重连");
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
            .state('psFaxingF', {
                url: '/psFaxingF',
                views: {
                    'main-view': {
                        templateUrl: 'templates/personStyle/faxingF.html',
                        controller: 'styleSettingCtrl2'
                    }
                }
            })
            .state('psYanjingF', {
                url: '/psYanjingF',
                views: {
                    'main-view': {
                        templateUrl: 'templates/personStyle/yanjingF.html',
                        controller: 'styleSettingCtrl2'
                    }
                }
            })
            .state('psYifuhuawenF', {
                url: '/psYifuhuawenF',
                views: {
                    'main-view': {
                        templateUrl: 'templates/personStyle/yifuhuawenF.html',
                        controller: 'styleSettingCtrl2'
                    }
                }
            })
            .state('psYifuleixingF', {
                url: '/psYifuleixingF',
                views: {
                    'main-view': {
                        templateUrl: 'templates/personStyle/yifuleixingF.html',
                        controller: 'styleSettingCtrl2'
                    }
                }
            })
            .state('psYifuyanseF', {
                url: '/psYifuyanseF',
                views: {
                    'main-view': {
                        templateUrl: 'templates/personStyle/yifuyanseF.html',
                        controller: 'styleSettingCtrl2'
                    }
                }
            })
            .state('psFaxingM', {
                url: '/psFaxingM',
                views: {
                    'main-view': {
                        templateUrl: 'templates/personStyle/faxingM.html',
                        controller: 'styleSettingCtrl2'
                    }
                }
            })
            .state('psYanjingM', {
                url: '/psYanjingM',
                views: {
                    'main-view': {
                        templateUrl: 'templates/personStyle/yanjingM.html',
                        controller: 'styleSettingCtrl2'
                    }
                }
            })
            .state('psYifuhuawenM', {
                url: '/psYifuhuawenM',
                views: {
                    'main-view': {
                        templateUrl: 'templates/personStyle/yifuhuawenM.html',
                        controller: 'styleSettingCtrl2'
                    }
                }
            })
            .state('psYifuleixingM', {
                url: '/psYifuleixingM',
                views: {
                    'main-view': {
                        templateUrl: 'templates/personStyle/yifuleixingM.html',
                        controller: 'styleSettingCtrl2'
                    }
                }
            })
            .state('psYifuyanseM', {
                url: '/psYifuyanseM',
                views: {
                    'main-view': {
                        templateUrl: 'templates/personStyle/yifuyanseM.html',
                        controller: 'styleSettingCtrl2'
                    }
                }
            })
            .state('psXingbie', {
                url: 'psXingbie',
                views: {
                    'main-view': {
                        templateUrl: 'templates/personStyle/xingbie.html',
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
