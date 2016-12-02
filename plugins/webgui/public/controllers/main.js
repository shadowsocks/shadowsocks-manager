const app = require('../index').app;

app.controller('MainController', ['$scope',
  ($scope) => {
    console.log('Main');
    $scope.innerSideNav = true;
        $scope.menuButton = function() {
            if(!$scope.publicInfo.menuButtonState) {
                if($mdMedia('gt-sm')) {
                    $scope.innerSideNav = !$scope.innerSideNav;
                } else {
                    $mdSidenav('left').toggle();
                }

            } else if(!$scope.publicInfo.menuButtonHistoryBackState) {
                $state.go($scope.publicInfo.menuButtonState, $scope.publicInfo.menuButtonStateParams);
            } else {
                $state.go($scope.publicInfo.menuButtonHistoryBackState, $scope.publicInfo.menuButtonHistoryBackStateParams);
            }
        };
        $scope.menus = [
            {name: '首页', icon: 'home', click: 'admin.index'},
            {name: '服务器管理', icon: 'cloud', click: 'admin.server'},
            {name: '用户管理', icon: 'face', click: 'admin.user'},
            {name: '续费码', icon: 'shop', click: 'admin.renew'},
            {name: '流量统计', icon: 'timeline', click: 'admin.flow.server'},
            {name: '系统设置', icon: 'settings', click: 'admin.options'}
        ];
  }
]);
