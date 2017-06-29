let gcmSenderId = appRequire('services/config').get('plugins.webgui.gcmSenderId');
if(gcmSenderId) { gcmSenderId = gcmSenderId.toString(); }

const manifest = {
  short_name: 'ssmgr',
  name: 'Shadowsocks-Manager',
  icons: [
    {
      src: '/libs/favicon.png',
      type: 'image/png',
      sizes: '48x48'
    },
    {
      src: '/libs/favicon.png',
      type: 'image/png',
      sizes: '128x128'
    },
    {
      src: '/libs/favicon.png',
      type: 'image/png',
      sizes: '144x144'
    },
    {
      src: '/libs/favicon.png',
      type: 'image/png',
      sizes: '256x256'
    }
  ],
  start_url: '/',
  display: 'standalone',
  background_color: '#2196F3',
  theme_color: '#2196F3',
  gcm_sender_id: gcmSenderId,
};

exports.manifest = manifest;
