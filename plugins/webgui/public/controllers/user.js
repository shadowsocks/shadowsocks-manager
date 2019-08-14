const app = angular.module('app');

app
.controller('UserController', ['$scope', '$mdMedia', '$mdSidenav', '$state', '$http', '$interval', '$localStorage', 'userApi', 'configManager', '$window',
  ($scope, $mdMedia, $mdSidenav, $state, $http, $interval, $localStorage, userApi, configManager, $window) => {
    const config = configManager.getConfig();
    if(config.status === 'admin') {
      return $state.go('admin.index');
    } else if(!config.status) {
      return $state.go('home.index');
    } else {
      $scope.setMainLoading(false);
    }
    $scope.setConfig(config);
    
    $scope.innerSideNav = true;
    $scope.sideNavWidth = () => {
      if($scope.innerSideNav) {
        return {
          width: '200px',
        };
      } else {
        return {
          width: '60px',
        };
      }
    };
    $scope.menuButton = function() {
      if($scope.menuButtonIcon) {
        return $scope.menuButtonClick();
      }
      if ($mdMedia('gt-sm')) {
        $scope.innerSideNav = !$scope.innerSideNav;
      } else {
        $mdSidenav('left').toggle();
      }
    };
    $scope.menus = [{
      name: '首页',
      icon: 'home',
      click: 'user.index'
    }, {
      name: '账号',
      icon: 'account_circle',
      click: 'user.account'
    }, {
      name: '订单',
      icon: 'attach_money',
      click: 'user.order',
      hide: true,
    }, {
      name: '设置',
      icon: 'settings',
      click: 'user.settings'
    }, {
      name: 'divider',
    }, {
      name: '退出',
      icon: 'exit_to_app',
      click: function() {
        $http.post('/api/home/logout').then(() => {
          $localStorage.home = {};
          $localStorage.user = {};
          configManager.deleteConfig();
          if(config.crisp) {
            $crisp.push(['do', 'session:reset', [false]]);
          }
          $state.go('home.index');
        });
      },
    }];
    $scope.menuClick = index => {
      $mdSidenav('left').close();
      if(typeof $scope.menus[index].click === 'function') {
        $scope.menus[index].click();
      } else {
        $state.go($scope.menus[index].click);
      }
    };

    $http.get('/api/user/order').then(success => {
      if(success.data.length) {
        $scope.menus[2].hide = false;
      };
    });

    $scope.menuButtonIcon = '';
    $scope.menuButtonClick = () => {};
    $scope.setMenuButton = (icon, to) => {
      $scope.menuButtonIcon = icon;
      $scope.menuButtonClick = () => {
        $state.go(to);
      };
    };

    $scope.title = '';
    $scope.setTitle = str => { $scope.title = str; };
    $scope.fabButton = false;
    $scope.fabButtonIcon = '';
    $scope.fabButtonClick = () => {};
    $scope.setFabButton = (fn, icon = '') => {
      $scope.fabButtonIcon = icon;
      if(!fn) {
        $scope.fabButton = false;
        $scope.fabButtonClick = () => {};
        return;
      }
      $scope.fabButton = true;
      $scope.fabButtonClick = fn;
    };
    $scope.interval = null;
    $scope.setInterval = interval => {
      $scope.interval = interval;
    };
    $scope.$on('$stateChangeStart', function(event, toUrl, fromUrl) {
      $scope.fabButton = false;
      $scope.fabButtonIcon = '';
      $scope.title = '';
      $scope.interval && $interval.cancel($scope.interval);
      $scope.menuButtonIcon = '';
    });

    if(!$localStorage.user.serverInfo && !$localStorage.user.accountInfo) {
      userApi.getUserAccount().then(success => {
        $localStorage.user.serverInfo = {
          data: success.servers,
          time: Date.now(),
        };
        $localStorage.user.accountInfo = {
          data: success.account,
          time: Date.now(),
        };
      });
    };
    document.addEventListener('crispReady', function (e) {
      $crisp.push(['set', 'session:data', [[['user-type', 'ssmgr-user']]]]);
      $crisp.push(['set', 'session:data', [[['user-agent', navigator.userAgent]]]]);
      if(!$scope.crispToken) {
        $scope.crispToken = $crisp.get('session:identifier');
        $http.post('/api/user/crisp', { token: $scope.crispToken });
      }
    }, false);
    const startCrisp = () => {
      $crisp.push(['do', 'chat:hide']);
      $crisp.push(['on', 'chat:closed', () => {
        $crisp.push(['do', 'chat:hide']);
      }]);
      (function() {
        d = document;
        s = d.createElement('script');
        s.src = 'https://client.crisp.chat/l.js';
        s.async = 1;
        d.getElementsByTagName('head')[0].appendChild(s);
      })();
    };
    if(config.crisp) {
      $http.get('/api/user/crisp').then(success => {
        $scope.crispToken = success.data.token;
        $crisp.push(['set', 'user:email', config.email]);
        if(!$scope.crispToken) {
          startCrisp();
        } else {
          window.CRISP_TOKEN_ID = $scope.crispToken;
          startCrisp();
        }
      });
    }
  }
])
.controller('UserIndexController', ['$scope', '$state', 'userApi', 'markdownDialog', '$sessionStorage', 'autopopDialog',
  ($scope, $state, userApi, markdownDialog, $sessionStorage, autopopDialog) => {
    $scope.setTitle('首页');
    $scope.notices = [];
    userApi.getNotice().then(success => {
      $scope.notices = success;
      if(!$sessionStorage.showNotice) {
        $sessionStorage.showNotice = true;
        const autopopNotice = $scope.notices.filter(notice => notice.autopop);
        if(autopopNotice.length) {
          autopopDialog.show(autopopNotice);
        }
      }
    });
    userApi.getUsage().then(success => {
      $scope.usage = success;
    });
    $scope.toMyAccount = () => {
      $state.go('user.account');
    };
    $scope.showNotice = notice => {
      markdownDialog.show(notice.title, notice.content);
    };
    $scope.toTelegram = () => {
      $state.go('user.telegram');
    };
    $scope.toNotice = () => {
      $state.go('user.notice');
    };
    $scope.toRef = () => {
      $state.go('user.ref');
    };
    $scope.toCrisp = () => {
      $crisp.push(['do', 'chat:open']);
      $crisp.push(['do', 'chat:show']);
    };
  }
])
.controller('UserAccountController', ['$scope', '$http', '$mdMedia', 'userApi', 'alertDialog', 'payDialog', 'qrcodeDialog', '$interval', '$localStorage', 'changePasswordDialog', 'payByGiftCardDialog', 'subscribeDialog', '$q', '$state', 'wireGuardConfigDialog',
  ($scope, $http, $mdMedia, userApi, alertDialog, payDialog, qrcodeDialog, $interval, $localStorage, changePasswordDialog, payByGiftCardDialog, subscribeDialog, $q, $state, wireGuardConfigDialog) => {
    $scope.setTitle('账号');
    $scope.setFabButton($scope.config.multiAccount ? () => {
      $scope.createOrder();
    } : null);
    $scope.flexGtSm = 100;
    if(!$localStorage.user.serverInfo) {
      $localStorage.user.serverInfo = {
        time: Date.now(),
        data: [],
      };
    }
    $scope.servers = $localStorage.user.serverInfo.data;
    if(!$localStorage.user.accountInfo) {
      $localStorage.user.accountInfo = {
        time: Date.now(),
        data: [],
      };
    }
    $scope.account = $localStorage.user.accountInfo.data;
    if($scope.account.length >= 2) {
      $scope.flexGtSm = 50;
    }
    
    const setAccountServerList = (account, server) => {
      account.forEach(a => {
        a.serverList = $scope.servers.filter(f => {
          return !a.server || a.server.indexOf(f.id) >= 0;
        });
      });
    };
    setAccountServerList($scope.account, $scope.servers);

    const getUserAccountInfo = () => {
      userApi.getUserAccount().then(success => {
        $scope.servers = success.servers;
        if(success.account.map(m => m.id).join('') === $scope.account.map(m => m.id).join('')) {
          success.account.forEach((a, index) => {
            $scope.account[index].data = a.data;
            $scope.account[index].password = a.password;
            $scope.account[index].port = a.port;
            $scope.account[index].type = a.type;
            $scope.account[index].active = a.active;
          });
        } else {
          $scope.account = success.account;
          $scope.account.forEach(f => {
            const serverId = $scope.servers.filter((server, index) => {
              if(!f.server) { return index === 0; }
              return f.server.indexOf(server.id) >= 0;
            })[0].id;
            $scope.getServerPortData(f, serverId);
          });
        }
        setAccountServerList($scope.account, $scope.servers);
        $localStorage.user.serverInfo.data = success.servers;
        $localStorage.user.serverInfo.time = Date.now();
        $localStorage.user.accountInfo.data = success.account;
        $localStorage.user.accountInfo.time = Date.now();
        if($scope.account.length >= 2) {
          $scope.flexGtSm = 50;
        }
      });
    };
    getUserAccountInfo();

    const base64Encode = str => {
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
      }));
    };
    $scope.createQrCode = (server, account) => {
      if(!server) { return ''; }
      if(server.type === 'WireGuard') {
        const a = account.port % 254;
        const b = (account.port - a) / 254;
        return [
          '[Interface]',
          `Address = ${ server.net.split('.')[0] }.${ server.net.split('.')[1] }.${ b }.${ a + 1 }/32`,
          `PrivateKey = ${ account.privateKey }`,
          'DNS = 8.8.8.8',
          '[Peer]',
          `PublicKey = ${ server.key }`,
          `Endpoint = ${ server.host }:${ server.wgPort }`,
          `AllowedIPs = 0.0.0.0/0`,
        ].join('\n');
      } else {
        return 'ss://' + base64Encode(server.method + ':' + account.password + '@' + server.host + ':' + (account.port + server.shift));
      }
    };

    $scope.getServerPortData = (account, serverId) => {
      account.currentServerId = serverId;
      // const server = $scope.servers.filter(f => f.id === serverId);
      // const scale = server[0] ? server[0].scale : 1;
      if(!account.isFlowOutOfLimit) { account.isFlowOutOfLimit = {}; }
      userApi.getServerPortData(account, serverId).then(success => {
        account.lastConnect = success.lastConnect;
        account.serverPortFlow = success.flow;
        if(account.data) {
          account.isFlowOutOfLimit[serverId] = ((account.data.flow + account.data.flowPack) <= account.serverPortFlow);
        }
      });
      account.serverInfo = $scope.servers.filter(f => {
        return f.id === serverId;
      })[0];
    };

    $scope.$on('visibilitychange', (event, status) => {
      if(status === 'visible') {
        if($localStorage.user.accountInfo && Date.now() - $localStorage.user.accountInfo.time >= 10 * 1000) {
          // $q.all($scope.account.map(a => {
          //   return $scope.getServerPortData(a, a.currentServerId);
          // }));
          getUserAccountInfo();
        }
      }
    });
    $scope.setInterval($interval(() => {
      if(Date.now() - $localStorage.user.accountInfo.time <= 15 * 1000) { return; }
      getUserAccountInfo();
      // userApi.updateAccount($scope.account)
      // .then(() => {
      //   setAccountServerList($scope.account, $scope.servers);
      // });
      $scope.account.forEach(a => {
        const currentServerId = a.currentServerId;
        userApi.getServerPortData(a, a.currentServerId, a.port).then(success => {
          if(currentServerId !== a.currentServerId) { return; }
          a.lastConnect = success.lastConnect;
          a.serverPortFlow = success.flow;
        });
      });
    }, 60 * 1000));

    $scope.getQrCodeSize = () => {
      if($mdMedia('xs')) {
        return 230;
      }
      return 180;
    };
    $scope.showChangePasswordDialog = (accountId, password) => {
      changePasswordDialog.show(accountId, password).then(() => {
        getUserAccountInfo();
      });
    };
    $scope.subscribe = accountId => {
      subscribeDialog.show(accountId);
    };
    $scope.createOrder = account => {
      payDialog.choosePayType(account).then(success => {
        getUserAccountInfo();
      });
    };
    $scope.useGiftCard = (accountId) => {
      payByGiftCardDialog.show(accountId).then(() => getUserAccountInfo());
    };

    $scope.fontColor = account => {
      if(account.data.expire >= Date.now()) {
        return {
          color: '#333',
        };
      }
      return {
        color: '#a33',
      };
    };
    $scope.isAccountOutOfDate = account => {
      if(account.type >=2 && account.type <= 5) {
        return Date.now() >= account.data.expire;
      } else {
        return false;
      }
    };
    $scope.showQrcodeDialog = (server, account) => {
      const ssAddress = $scope.createQrCode(server, account);
      qrcodeDialog.show(server.name, ssAddress);
    };
    $scope.cycleStyle = account => {
      let percent = 0;
      if(account.type !== 1) {
        percent = ((Date.now() - account.data.from) / (account.data.to - account.data.from) * 100).toFixed(0);
      }
      if(percent > 100) {
        percent = 100;
      }
      return {
        background: `linear-gradient(90deg, rgba(0,0,0,0.12) ${ percent }%, rgba(0,0,0,0) 0%)`
      };
    };
    $scope.activeAccount = account => {
      $http.put(`/api/user/account/${ account.id }/active`).then(success => {
        // account.active = 1;
        getUserAccountInfo();
      });
    };
    $scope.isBlur = account => {
      if(account.active) { return {}; }
      return {
        filter: 'blur(4px)'
      };
    };
    $scope.clipboardSuccess = event => {
      $scope.toast('二维码链接已复制到剪贴板');
    };
    $scope.isWG = server => {
      return (server && server.type === 'WireGuard');
    };
    $scope.showWireGuard = (server, account) => {
      wireGuardConfigDialog.show(server, account);
    };
  }
])
.controller('UserSettingsController', ['$scope', '$state',
  ($scope, $state) => {
    $scope.setTitle('设置');
    $scope.toPassword = () => {
      $state.go('user.changePassword');
    };
    $scope.toTelegram = () => {
      $state.go('user.telegram');
    };
    $scope.toRef = () => {
      $state.go('user.ref');
    };
    $scope.toMac = () => {
      $state.go('user.macAddress');
    };
  }
])
.controller('UserChangePasswordController', ['$scope', '$state', 'userApi', 'alertDialog', '$http', '$localStorage',
  ($scope, $state, userApi, alertDialog, $http, $localStorage) => {
    $scope.setTitle('修改密码');
    $scope.setMenuButton('arrow_back', 'user.settings');
    $scope.data = {
      password: '',
      newPassword: '',
      newPasswordAgain: '',
    };
    $scope.confirm = () => {
      alertDialog.loading();
      userApi.changePassword($scope.data.password, $scope.data.newPassword).then(success => {
        alertDialog.show('修改密码成功，请重新登录', '确定')
        .then(() => {
          return $http.post('/api/home/logout');
        }).then(() => {
          $localStorage.home = {};
          $localStorage.user = {};
          $state.go('home.index');
        });
      }).catch(err => {
        alertDialog.show('修改密码失败', '确定');
      });
    };
  }
])
.controller('UserTelegramController', ['$scope', '$http', '$interval',
  ($scope, $http, $interval) => {
    $scope.setTitle('绑定Telegram');
    $scope.setMenuButton('arrow_back', 'user.settings');
    $scope.isLoading = true;
    $scope.code = {};
    const getCode = () => {
      $http.get('/api/user/telegram/code').then(success => {
        $scope.code = success.data;
        $scope.isLoading = false;
      });
    };
    $scope.setInterval($interval(() => {
      getCode();
    }, 5 * 1000));
    getCode();
    $scope.unbind = () => {
      $scope.isLoading = true;
      $http.post('/api/user/telegram/unbind');
    };
  }
])
.controller('UserRefController', ['$scope', '$http',
  ($scope, $http) => {
    $scope.setTitle('邀请码');
    $scope.setMenuButton('arrow_back', 'user.settings');
    $http.get('/api/user/ref/code').then(success => { $scope.code = success.data; });
    $http.get('/api/user/ref/user').then(success => { $scope.user = success.data; });
    $scope.getRefUrl = code => `${ $scope.config.site }/home/ref/${ code }`;
    $scope.clipboardSuccess = event => {
      $scope.toast('邀请链接已复制到剪贴板');
    };
  }
])
.controller('UserOrderController', ['$scope', '$http',
  ($scope, $http) => {
    $scope.setTitle('我的订单');
    $http.get('/api/user/order').then(success => {
      $scope.orders = success.data;
    });
  }
])
.controller('UserMacAddressController', ['$scope', '$state', '$http', 'addMacAccountDialog',
  ($scope, $state, $http, addMacAccountDialog) => {
    $scope.setTitle('MAC地址');
    $scope.setMenuButton('arrow_back', 'user.settings');
    const getMacAccount = () => {
      $http.get('/api/user/account/mac').then(success => {
        $scope.macAccounts = success.data;
        if(!$scope.macAccounts.length) {
          $scope.setFabButton(() => {
            addMacAccountDialog.show().then(() => {
              getMacAccount();
            }).catch(err => {
              getMacAccount();
            });
          });
        } else {
          $scope.setFabButton();
        }
      });
    };
    $scope.addMacAccount = () => {
      addMacAccountDialog.show().then(() => {
        getMacAccount();
      }).catch(err => {
        getMacAccount();
      });
    };
    getMacAccount();
  }
])
.controller('UserNoticeController', ['$scope', 'userApi', 'markdownDialog',
  ($scope, userApi, markdownDialog) => {
    $scope.setTitle('公告');
    $scope.setMenuButton('arrow_back', 'user.index');
    userApi.getNotice().then(success => {
      $scope.notices = success;
    });
    $scope.showNotice = notice => {
      markdownDialog.show(notice.title, notice.content);
    };
  }
])
;
