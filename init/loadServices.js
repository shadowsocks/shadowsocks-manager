const config = appRequire('services/config').all();

const shadowsocks = () => {
  appRequire('services/shadowsocks');
  appRequire('services/server');
};
const manager = () => {
  appRequire('services/manager');
};
if(config.type === 's') {
  shadowsocks();
} else if (config.type === 'm') {
  manager();
}
