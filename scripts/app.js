'use strict';

angular.module('app', [])

.factory('owncloud', function () {
    return window.owncloud;
})

.run(['owncloud', function (owncloud) {
    owncloud.fn.setup({url_root: 'http://127.0.0.1/inwin/owncloud/8.0.4/index.php'});
    owncloud.fn.login('admin', 'admin');
}])

.controller('RootCtrl', ['$scope', '$http', 'owncloud', function ($scope, $http, owncloud) {
    $scope.getFiles = function (dir) {
        $scope.reset();
        
        owncloud.fn.files(dir).done(function (data) {
            $scope.files = data.files.map(function (file) {
                file.dir = file.type === 'dir';
                
                return file;
            });
            $scope.data.isRoot = owncloud.value.isRoot;
            $scope.data.selected = [];

            $scope.$digest();
        });
    };
    
    $scope.toggle = function (item) {
        var list = $scope.data.selected.map(function (data) {
            return data.name;
        });

        var idx = list.indexOf(item.name);
        
        if (idx > -1) {
            $scope.data.selected.splice(idx, 1);
        } else {
            $scope.data.selected.push(item);
        }
    }

    $scope.exists = function (item) {
        var list = $scope.data.selected.map(function (data) {
            return data.name;
        });

        return list.indexOf(item.name) > -1;
    }

    $scope.share = function () {
        $scope.expiration = '02-08-2016';
        $scope.password = 1234;

        owncloud.fn.share($scope.data.selected, $scope.expiration, $scope.password).done(function (data) {
            $scope.data.shared = data.link;
            $scope.data.email = data.email;
            $scope.data.selected = [];

            $scope.$digest();
        });
    };
    
    $scope.download = function () {
        $http({
            method: 'GET',
            url: 'download.php',
            params: {
                url: owncloud.fn.getDownloadUrl($scope.data.selected.name),
                name: $scope.data.selected.name
            }
        }).then(function (response) {
            
        });
    };
    
    $scope.reset = function () {
        $scope.data = {};
        $scope.data.isRoot = true;
        $scope.data.selected = [];
    };
    
    $scope.reset();
}]);