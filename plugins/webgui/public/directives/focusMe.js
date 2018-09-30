const app = angular.module('app');

app.directive('focusMe', ['$timeout', $timeout => {
  return {
    restrict: 'A',
    link: ($scope, $element) => {
      $timeout(() => {
        $element[0].focus();
      });
    }
  };
}]);

app.directive('ga', () => {
  return {
    restrict: 'E',
    scope: {
      adClient: '@',
      adSlot: '@',
      adFormat: '@',
    },
    template: `
      <span ng-if="show">
      <script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
      <ins class="adsbygoogle"
        style="display:block"
        data-ad-client="{{ adClient || 'ca-pub-5143063449426529' }}"
        data-ad-slot="{{ adSlot || '4410958191' }}"
        data-ad-format="{{ adFormat || 'auto' }}"
        data-full-width-responsive="true"></ins>
      </span>
    `,
    controller: ['$scope', '$timeout', ($scope, $timeout) => {
      $scope.show = Math.random() >= 0.95;
      if($scope.show) {
        $timeout(function () {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        });
      }
    }]
  };
});
