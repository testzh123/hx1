/**
 * Created by jin on 7/2/15.
 */
function getImage(iid, cid, l, $rootScope) {

    if ($rootScope.tempImages [iid] == undefined) {
        $rootScope.socket.emit('imageS', {id: iid, cid: cid, len: l});
    }
    else {
        showImage(iid, cid, l, $rootScope);
    }
}

function showImage(iid, cid, l, $rootScope) {
    var w = $rootScope.tempImages [iid].w;
    var h = $rootScope.tempImages [iid].h;
    if (w >= h) {
        var nh = Math.floor(l / w * h);
        if (nh < 10)
            nh = 10;
        $(cid).css('height', nh + 'px');
    }
    else {
        var nw = Math.floor(l / h * w);
        if (nw < 10)
            nw = 10;
        $(cid).css('width', nw + 'px');
    }
    $(cid).attr('src', $rootScope.tempImages [iid].Data);
}

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

