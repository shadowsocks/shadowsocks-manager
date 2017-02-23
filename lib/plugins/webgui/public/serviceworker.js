// importScripts('/libs/serviceworker-cache-polyfill.js');

var ONLINE_CACHE_NAME = '2017-02-23 18:52:47';
var onlineCacheUrl = [
  '/',

  '/libs/angular.min.js',
  '/libs/angular-animate.min.js',
  '/libs/angular-aria.min.js',
  '/libs/angular-messages.min.js',
  '/libs/angular-material.min.js',
  '/libs/angular-ui-router.min.js',
  '/libs/qrcode.min.js',
  '/libs/angular-qr.min.js',
  '/libs/ngStorage.min.js',
  '/libs/Chart.min.js',
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
  event.respondWith(
    caches.match(event.request)
    .then(function(response) {
        if (response) {
            return response;
        }
        return fetch(event.request);
    })
  );
});
