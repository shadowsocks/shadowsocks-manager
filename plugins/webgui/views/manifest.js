let gcmSenderId = appRequire('services/config').get('plugins.webgui.gcmSenderId');
if(gcmSenderId) { gcmSenderId = gcmSenderId.toString(); }

const manifest = {
  short_name: 'ssmgr',
  name: 'Shadowsocks-Manager',
  icons: [
    {
      src: '/favicon.png',
      type: 'image/png',
      sizes: '48x48'
    },
    {
      src: '/favicon.png',
      type: 'image/png',
      sizes: '128x128'
    },
    {
      src: '/favicon.png',
      type: 'image/png',
      sizes: '144x144'
    },
    {
      src: '/favicon.png',
      type: 'image/png',
      sizes: '256x256'
    }
  ],
  start_url: '/',
  display: 'fullscreen',
  background_color: '#2196F3',
  theme_color: '#2196F3',
  gcm_sender_id: gcmSenderId,
};

exports.manifest = manifest;
