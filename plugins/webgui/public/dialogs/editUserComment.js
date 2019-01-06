const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.factory('editUserCommentDialog', [ '$mdDialog', '$http', ($mdDialog, $http) => {
  const publicInfo = {
    status: 'show',
  };
  let dialogPromise = null;
  const isDialogShow = () => {
    if(dialogPromise && !dialogPromise.$$state.status) {
      return true;
    }
    return false;
  };
  const show = (userId, comment) => {
    if(isDialogShow()) {
      return dialogPromise;
    }
    publicInfo.status = 'show';
    publicInfo.userId = userId;
    publicInfo.comment = comment;
    dialogPromise = $mdDialog.show(dialog);
    return dialogPromise;
  };
  const close = () => {
    return $mdDialog.hide()
    .then(success => {
      dialogPromise = null;
      return;
    }).catch(err => {
      dialogPromise = null;
      return;
    });
  };
  const editComment = () => {
    publicInfo.status = 'loading';
    $http.put(`/api/admin/user/${ publicInfo.userId }/comment`, {
      comment: publicInfo.comment
    }).then(() => {
      close();
    }).catch(() => {
      publicInfo.status = 'error';
    });
  };
  publicInfo.close = close;
  publicInfo.editComment = editComment;
  const dialog = {
    templateUrl: `${ cdn }/public/views/dialog/editUserComment.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', 'bind', ($scope, bind) => {
      $scope.publicInfo = bind;
    }],
    clickOutsideToClose: false,
  };
  return {
    show,
  };
}]);
