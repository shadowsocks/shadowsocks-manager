const app = angular.module('app');
const window = require('window');

const config = window.ssmgrConfig;
app.config(['$mdThemingProvider', $mdThemingProvider => {
  const checkColor = color => {
    const colors = [
      'red',
      'pink',
      'purple',
      'deep-purple',
      'indigo',
      'blue',
      'light-blue',
      'cyan',
      'teal',
      'green',
      'light-green',
      'lime',
      'yellow',
      'amber',
      'orange',
      'deep-orange',
      'brown',
      'grey',
      'blue-grey',
    ];
    return colors.indexOf(color) >= 0;
  };
  checkColor(config.themePrimary) && $mdThemingProvider.theme('default').primaryPalette(config.themePrimary);
  checkColor(config.themeAccent) && $mdThemingProvider.theme('default').accentPalette(config.themeAccent);
  $mdThemingProvider.alwaysWatchTheme(true);
}]);
