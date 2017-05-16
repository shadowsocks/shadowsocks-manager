// importScripts('/libs/serviceworker-cache-polyfill.js');

var ONLINE_CACHE_NAME = '2017-05-17 00:53:27';
var onlineCacheUrl = [
  '/',

  '/libs/angular.min.js',
  '/libs/angular-inview.js',
  '/libs/angular-animate.min.js',
  '/libs/angular-aria.min.js',
  '/libs/angular-messages.min.js',
  '/libs/angular-material.min.js',
  '/libs/angular-ui-router.min.js',
  '/libs/qrcode.min.js',
  '/libs/angular-qr.min.js',
  '/libs/ngStorage.min.js',
  '/libs/Chart.min.js',
  '/libs/marked.min.js',
  '/libs/angular-marked.min.js',
  '/libs/angular-chart.min.js',
  '/libs/moment.min.js',
  '/libs/angular-moment.min.js',
  '/libs/angular-websocket.min.js',
  '/libs/bundle.js',

  '/libs/favicon.png',
  '/libs/home.png',

  '/libs/style.css',
  '/libs/angular-material.min.css',

  '/libs/MaterialIcons-Regular.woff2',
  '/libs/MaterialIcons-Regular.woff',
  '/libs/MaterialIcons-Regular.ttf',
  '/libs/MaterialIcons-Regular.eot',

  '/public/views/home/alertDialog.html',
  '/public/views/home/home.html',
  '/public/views/home/index.html',
  '/public/views/home/login.html',
  '/public/views/home/resetPassword.html',
  '/public/views/home/signup.html',

  '/public/views/user/account.html',
  '/public/views/user/changePassword.html',
  '/public/views/user/index.html',
  '/public/views/user/payDialog.html',
  '/public/views/user/user.html',

  '/public/views/admin/account.html',
  '/public/views/admin/accountPage.html',
  '/public/views/admin/accountSortAndFilterDialog.html',
  '/public/views/admin/addAccount.html',
  '/public/views/admin/addServer.html',
  '/public/views/admin/admin.html',
  '/public/views/admin/editAccount.html',
  '/public/views/admin/editNotice.html',
  '/public/views/admin/editServer.html',
  '/public/views/admin/index.html',
  '/public/views/admin/newNotice.html',
  '/public/views/admin/notice.html',
  '/public/views/admin/orderDialog.html',
  '/public/views/admin/orderFilterDialog.html',
  '/public/views/admin/pay.html',
  '/public/views/admin/pickAccount.html',
  '/public/views/admin/pickTime.html',
  '/public/views/admin/server.html',
  '/public/views/admin/serverPage.html',
  '/public/views/admin/settings.html',
  '/public/views/admin/unfinished.html',
  '/public/views/admin/user.html',
  '/public/views/admin/userPage.html',
  '/public/views/admin/userSortDialog.html',
];

this.addEventListener('activate', function(event) {
  var cacheWhitelist = [ONLINE_CACHE_NAME];
  event.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (cacheWhitelist.indexOf(key) === -1) {
          console.log('delete ' + key);
          return caches.delete(key);
        }
      }));
    })
  );
});

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(ONLINE_CACHE_NAME)
    .then(function(cache) {
      console.log('Opened cache');
      return cache.addAll(onlineCacheUrl);
    })
  );
});

self.addEventListener('fetch', function(event) {
  var isMatch = function () {
    return (
      event.request.url.match(self.registration.scope + 'user/') ||
      event.request.url.match(self.registration.scope + 'home/') ||
      event.request.url.match(self.registration.scope + 'admin/')
    );
  };
  if (isMatch()) {
    event.respondWith(
      fetch(event.request)
      .then(function(response) {
        return response;
      }).catch(function(err) {
        var request = new Request('/');
        return caches.match(request);
      }).then(function(response) {
        return response;
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request)
      .then(function(response) {
          if (response) {
              return response;
          }
          return fetch(event.request);
      })
    );
  }
});

self.addEventListener('push', function (event) {
  // if (!(self.Notification && self.notification.permission === 'granted')) {
  //   return;
  // }
  var data = event.data.json();
  var title = data.title;
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.options.body,
      icon: '/libs/favicon.png',
    }));
});
