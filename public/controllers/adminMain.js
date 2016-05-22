app.controller('AdminMainController', function($scope, $http, $state, $mdSidenav, $window, $mdDialog) {
        

        $scope.menuButton = function() {
            if(!$scope.publicInfo.menuButtonState) {
                $mdSidenav('left').toggle();
            } else {
                $state.go($scope.publicInfo.menuButtonState, $scope.publicInfo.menuButtonStateParams);
            }
        };
        $scope.menus = [
            {name: '首页', icon: 'home', click: 'admin.index'},
            {name: '服务器管理', icon: 'cloud', click: 'admin.server'},
            {name: '用户管理', icon: 'face', click: 'admin.user'},
            {name: '续费码', icon: 'shop', click: 'admin.unfinish'},
            {name: '流量统计', icon: 'timeline', click: 'admin.flow'},
            {name: '历史记录', icon: 'watch_later', click: 'admin.unfinish'}
        ];
        $scope.publicInfo = {
            title: '',              //标题
            menuButtonIcon: 'menu', //菜单或返回按钮
            menuButtonState: '',    //返回按钮跳转页面，非空时为返回按钮
            menuButtonStateParams: {},
            fabButtonIcon: '',
            fabButtonClick: '',
            closeDialog: ''
        };
        // var dialog = $mdDialog.prompt({
        //     templateUrl: '/public/views/admin/loading.html',
        //     escapeToClose : false,
        //     scope: $scope,
        //     controller: function($scope, $mdDialog, $timeout) {
        //         // console.log($scope.publicInfo);
        //         $scope.publicInfo.closeDialog = function() {
        //             $mdDialog.cancel();
        //         };
        //         // $timeout(function() {$mdDialog.cancel();}, 5000);
        //     }
        // });

        // $scope.loadingText = '正在加载';

        // $scope.loading = function(isLoading) {
        //     if(isLoading) {
        //         $mdDialog.show(dialog);
        //     } else {
        //         console.log($scope.publicInfo);
        //         console.log($scope.publicInfo.closeDialog);
        //         $scope.publicInfo.closeDialog();
        //     }
        // };
        $scope.initPublicInfo = function() {
            // $scope.loading(1);
            $http.get('/admin/server').then(function(success) {
                $scope.publicInfo.servers = success.data;
                // $scope.loading(0);
            });
        };
        $scope.initPublicInfo();
        $scope.setTitle = function(str) {
            $scope.publicInfo.title = str;
        };
        $scope.setMenuButton = function(str, obj) {
            if(str === 'default') {
                $scope.publicInfo.menuButtonIcon = 'menu';
                $scope.publicInfo.menuButtonState = '';
                $scope.publicInfo.menuButtonStateParams = {};
            } else {
                $scope.publicInfo.menuButtonIcon = 'arrow_back';
                $scope.publicInfo.menuButtonState = str;
                if(obj) {
                    $scope.publicInfo.menuButtonStateParams = obj;
                }
            }
        };
        $scope.setFabButtonClick = function(fn) {
            $scope.publicInfo.fabButtonClick = fn;
        };
        $scope.menuClick = function(index) {
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

        $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
            $scope.publicInfo.title = '';
            $scope.publicInfo.menuButtonIcon = 'menu';
            $scope.publicInfo.menuButtonState = '';
            $scope.publicInfo.menuButtonStateParams = {};
            $scope.publicInfo.fabButtonClick = '';
        });

    });