// this.addEventListener('install', function(event) {
//     event.waitUntil(
//         caches.open('v3').then(function(cache) {
//             return cache.addAll([
//             ]);
//         })
//     );
// });

// // this.addEventListener('fetch', function(event) {
// //     event.respondWith(
// //         caches.match(event.request).then(function(resp) {
// //             return resp || fetch(event.request).then(function(response) {
// //                 return caches.open('v1').then(function(cache) {
// //                     cache.put(event.request, response.clone());
// //                     return response;
// //                 });
// //             });
// //         })
// //     );
// // });

// this.addEventListener('fetch', function(event) {
    
//     if(event.request.url.match(/^https:\/\/ss.gyteng.com\/admin\//) || event.request.url.match(/^https:\/\/ss.gyteng.com\/public\//) || event.request.url.match(/^https:\/\/ss.gyteng.com\/libs\//)) {

//         console.log(event);
//         event.respondWith(
//             caches.match(event.request)
//         );
//     } else {
        
//     }
// });