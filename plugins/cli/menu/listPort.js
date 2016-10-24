'use strict';

exports.menu = {
  type: 'list',
  name: 'size',
  message: 'What size do you need?',
  choices: ['Large', 'Medium', 'Small'],
  filter: function(val) {
    return val.toLowerCase();
  }
};
