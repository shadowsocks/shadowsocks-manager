app.controller('AdminMainController', function($scope, $http, $state, $mdSidenav, $window) {
        $scope.showMenu = function() {
            $mdSidenav('left').toggle();
        };
        $scope.menus = [
            {name: '首页', icon: 'home', click: 'admin.index'},
            {name: '服务器管理', icon: 'cloud', click: 'admin.server'},
            {name: '用户管理', icon: 'face'},
            {name: '续费码', icon: 'shop'},
            {name: '流量统计', icon: 'timeline'},
            {name: '历史记录', icon: 'watch_later'}
        ];
        $scope.publicInfo = {
            currentMenu: 0
        };
        $scope.menuClick = function(index) {
            $scope.publicInfo.currentMenu = index;
            $state.go($scope.menus[index].click);
            $mdSidenav('left').close();
        };
        $scope.bottomMenus = [
            {name: '退出登录', icon: 'exit_to_app', click: function() {
                $http.post('/user/logout').success(function(data) {
                    $window.location.reload();
                });
            }}
        ];
    })
    .controller('AdminIndexController', function($scope, $http, $state) {

    })
    .controller('AdminServerController', function($scope, $http, $state, $mdDialog) {
        $scope.init = function() {
            $http.get('/admin/server').success(function(data) {
                $scope.serverList = data;
            });
        };
        $scope.init();
        $scope.server = {};
        $scope.serverPort = {};
        $scope.addServerDialog = function() {
            $scope.dialog = $mdDialog.show({
                controller: AddServerDialogController,
                templateUrl: '/public/views/admin/addServer.html',
                locals : {
                    addServer : $scope.addServer,
                    server : $scope.server
                }
            });
        };
        $scope.addServerPortDialog = function(serverName) {
            $scope.dialog = $mdDialog.show({
                controller: AddServerPortDialogController,
                templateUrl: '/public/views/admin/addServerPort.html',
                locals : {
                    serverName: serverName,
                    serverPort : $scope.serverPort,
                    addServerPort : $scope.addServerPort
                }
            });
        };
        $scope.addServer = function() {
            $http.post('/admin/server', {
                name: $scope.server.name,
                ip: $scope.server.ip,
                port: $scope.server.port
            }).success(function(data) {
                $scope.init();
                $mdDialog.cancel();
            }).error(function(err) {
                console.log(err);
            });
        };
        $scope.addServerPort = function() {
            console.log($scope.serverPort);
            $http.post('/admin/serverPort', {
                name: $scope.serverPort.name,
                port: $scope.serverPort.port,
                password: $scope.serverPort.password
            }).success(function(data) {
                $scope.init();
                $mdDialog.cancel();
            }).error(function(err) {
                console.log(err);
            });
        };
        var AddServerDialogController = function($scope, $mdDialog, addServer, server) {
            $scope.server = server;
            $scope.cancel = function(){$mdDialog.cancel();};
            $scope.addServer = addServer;
        };
        var AddServerPortDialogController = function($scope, $mdDialog, serverPort, addServerPort, serverName) {
            $scope.serverPort = serverPort;
            $scope.serverPort.name = serverName;
            $scope.cancel = function(){$mdDialog.cancel();};
            $scope.addServerPort = addServerPort;
        };
    })
;