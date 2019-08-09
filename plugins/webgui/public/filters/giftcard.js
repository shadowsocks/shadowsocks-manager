const app = angular.module('app');

app.filter('prettyPrintBatchStatus', function () {
    return function (status) {
        const result = {
            AVAILABLE: '可用',
            USEDUP: '售罄',
            REVOKED: '已召回'
        };
        return result[status] || '其它';
    };
});
