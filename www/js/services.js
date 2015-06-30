angular.module('DBService', ['ngResource'])

.factory('DB', function($resource) {
      var DBManager = $resource(serverURL + 'DBManager',
          {}, {
            get: {method: 'JSONP', params: {callback: 'JSON_CALLBACK'}},
            query: {method: 'JSONP', params: {callback: 'JSON_CALLBACK', isArray: true}}
          });
      return DBManager;
})

.factory('GPS',function($rootScope)
    {

        var watch = null;
        var showMap = function()
        {
            if($rootScope.userInfo.GPSPoint==undefined)
                return;

            var map = new BMap.Map("my-map");
            var gpsPoint = new BMap.Point($rootScope.userInfo.GPSPoint[0],$rootScope.userInfo.GPSPoint[1]);
            BMap.Convertor.translate(gpsPoint, 0, function (p2) {
                map.centerAndZoom(p2, 17);
                map.enableScrollWheelZoom(true);
                var marker = new BMap.Marker(p2);
                map.addOverlay(marker);
                marker.setAnimation(BMAP_ANIMATION_BOUNCE);
            });
        }


        var updateAddress = function(GPSonSuccess, GPSonError){
            navigator.geolocation.getCurrentPosition(GPSonSuccess, GPSonError, {timeout: 5000, enableHighAccuracy: true});}

        var clearWatch = function()
        {
            if(watch!=null)
                navigator.geolocation.clearWatch(watch);
        }

        var createWatch = function(GPSonSuccess, GPSonError)
        {
            clearWatch();
            watch = navigator.geolocation.watchPosition(GPSonSuccess, GPSonError, {enableHighAccuracy: true});
        }

        return {'update' : updateAddress,'showMap' : showMap,'watch' : createWatch,'clear' : clearWatch};
    })
