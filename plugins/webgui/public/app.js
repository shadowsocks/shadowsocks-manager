require('babel-polyfill');
require('./index');

require('./directives/focusMe');

require('./services/preloadService.js');
require('./services/adminService.js');
require('./services/homeService.js');
require('./services/userService.js');
// require('./services/websocketService.js');

require('./configs/index.js');
require('./controllers/index.js');
require('./dialogs/index.js');
require('./filters/index.js');
require('./translate/index.js');
require('./routes/index.js');