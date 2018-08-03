const app = angular.module('app');

app.filter('flow', function() {
  const K = 1000;
  const M = 1000 * 1000;
  const G = 1000 * 1000 * 1000;
  const T = 1000 * 1000 * 1000 * 1000;
  const P = 1000 * 1000 * 1000 * 1000 * 1000;
  return function(input) {
    if (input < K) {
      return input + ' B';
    } else if (input < M) {
      return (input / K).toFixed(1) + ' KB';
    } else if (input < G) {
      return (input / M).toFixed(1) + ' MB';
    } else if (input < T) {
      return (input / G).toFixed(2) + ' GB';
    } else if (input < P) {
      return (input / T).toFixed(3) + ' TB';
    } else {
      return input;
    }
  };
});

app.filter('flowStr2Num', function() {
  const K = 1000;
  const M = 1000 * 1000;
  const G = 1000 * 1000 * 1000;
  const T = 1000 * 1000 * 1000 * 1000;
  const P = 1000 * 1000 * 1000 * 1000 * 1000;
  return function(input) {
    if(!input) {
      return 0;
    } else if(Number.isInteger(+input)) {
      return +input;
    }else if(input.match(/^\d{1,}.?\d{0,}[Kk]$/)) {
      return +input.substr(0, input.length - 1) * K;
    } else if(input.match(/^\d{1,}.?\d{0,}[Mm]$/)) {
      return +input.substr(0, input.length - 1) * M;
    } else if(input.match(/^\d{1,}.?\d{0,}[Gg]$/)) {
      return +input.substr(0, input.length - 1) * G;
    } else if(input.match(/^\d{1,}.?\d{0,}[Tt]$/)) {
      return +input.substr(0, input.length - 1) * T;
    } else  {
      return 1;
    }
  };
});

app.filter('flowNum2Str', function() {
  const K = 1000;
  const M = 1000 * 1000;
  const G = 1000 * 1000 * 1000;
  const T = 1000 * 1000 * 1000 * 1000;
  const P = 1000 * 1000 * 1000 * 1000 * 1000;
  return function(input) {
    if (input < K) {
      return input;
    } else if (input < M) {
      return +(input / K).toFixed(1) + 'K';
    } else if (input < G) {
      return +(input / M).toFixed(1) + 'M';
    } else if (input < T) {
      return +(input / G).toFixed(2) + 'G';
    } else if (input < P) {
      return +(input / T).toFixed(3) + 'T';
    } else {
      return input;
    }
  };
});
