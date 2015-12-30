'use strict';

angular.module('app', [])

.factory('owncloud', function () {
    return window.owncloud;
})

.run(['owncloud', function (owncloud) {
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
            
            $scope.$digest();
        });
    };
    
    $scope.share = function () {
        owncloud.fn.share($scope.data.selected).done(function (data) {
            $scope.data.shared = data;
            
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
        $scope.data.selected = null;
    };
    
    $scope.reset();
}]);