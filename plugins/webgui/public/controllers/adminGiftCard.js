const app = angular.module('app');

app.controller('AdminGiftCardController', ['$scope', '$http', 'addGiftCardBatchDialog', '$state',
  ($scope, $http, addGiftCardBatchDialog, $state) => {
    $scope.setTitle('充值码管理');
    $scope.setMenuButton('arrow_back', 'admin.settings');
    const showBatch = () => {
      $http.get('/api/admin/giftcard/list').then(result => {
        $scope.batchList = result.data;
      });
    };
    $scope.showBatch = number => {
      $state.go('admin.giftcardBatchDetails', { batchNumber: number });
    };
    $scope.setFabButton(() => {
      addGiftCardBatchDialog.show().then(() => showBatch());
    });
    showBatch();
    $scope.batchColor = batch => {
      if(batch.status === 'REVOKED') {
        return {
          background: 'red-50', 'border-color': 'red-300',
        };
      }
      return {};
    };
  }
]).controller('AdminGiftCardBatchDetailsController', ['$scope', '$http', '$stateParams', 'confirmDialog', 'alertDialog',
  ($scope, $http, $stateParams, confirmDialog, alertDialog) => {
    const batchNumber = $stateParams.batchNumber;
    $scope.setTitle(`充值码[ ${batchNumber} ]`);
    $scope.setMenuButton('arrow_back', 'admin.listGiftCardBatch');
    const showDetails = () => {
      $http.get(`/api/admin/giftcard/details/${batchNumber}`).then(result => {
        $scope.batch = result.data;
        const content = $scope.batch.cards
          .filter(x => x.status === 'AVAILABLE')
          .map(x => `${x.id},${x.password}\r\n`)
          .reduce((a, b) => a + b, '');
        const blob = new Blob([content], { type: 'text/csv' });
        $scope.exportUrl = (window.URL || window.webkitURL).createObjectURL(blob);
      });
    };
    $scope.showPassword = (id, password) => {
      alertDialog.show(`卡号：${id}，密码：${password}`, '确定');
    };
    showDetails();

    $scope.revoke = () => {
      confirmDialog.show({
        text: '确实要召回这些卡片吗？该操作不可撤销。',
        cancel: '取消',
        confirm: '召回',
        error: '召回失败',
        fn: () => {
          return $http.post(`/api/admin/giftcard/revoke`, { batchNumber });
        },
      }).then(() => {
        showDetails();
      });
    };
  }
]);
