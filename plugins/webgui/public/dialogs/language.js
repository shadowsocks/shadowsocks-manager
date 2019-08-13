const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.factory('languageDialog' , [ '$mdDialog', $mdDialog => {
  const publicInfo = {};
  const hide = () => {
    return $mdDialog.hide()
    .then(success => {
      dialogPromise = null;
      return;
    }).catch(err => {
      dialogPromise = null;
      return;
    });
  };
  publicInfo.hide = hide;
  let dialogPromise = null;
  const isDialogShow = () => {
    if(dialogPromise && !dialogPromise.$$state.status) {
      return true;
    }
    return false;
  };
  const dialog = {
    templateUrl: `${ cdn }/public/views/dialog/language.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$translate', '$localStorage', 'bind', function($scope, $translate, $localStorage, bind) {
      $scope.publicInfo = bind;
      $scope.publicInfo.myLanguage = $localStorage.language || window.ssmgrConfig.language || navigator.language || 'zh-CN';
      $scope.chooseLanguage = () => {
        $translate.use($scope.publicInfo.myLanguage);
        $localStorage.language = $scope.publicInfo.myLanguage;
        $scope.publicInfo.hide();
      };
      $scope.languages = [
        { id: 'zh-CN', name: '中文' },
        { id: 'en-US', name: 'English' },
        { id: 'ja-JP', name: '日本語' },
        { id: 'ko-KR', name: '한국' },
        { id: 'ru-RU', name: 'Русский' },
      ];
      $scope.languages.forEach(language => {
        if(language.id === window.ssmgrConfig.language) {
          language.default = true;
        }
      });
      $scope.refresh = () => { window.location.reload(true); };
    }],
    clickOutsideToClose: true,
  };
  const show = () => {
    if(isDialogShow()) {
      return dialogPromise;
    }
    dialogPromise = $mdDialog.show(dialog);
    return dialogPromise;
  };
  return {
    show,
    hide,
  };
}]);
