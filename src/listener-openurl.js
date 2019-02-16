const { Config } = require('./Config');
const { OpenURLServer } = require('./OpenURLServer');

const cfg = new Config();
const server = new OpenURLServer(cfg);

server.okapiLogin().then(res => {
  server.listen(3012);
  cfg.log('start', 'starting');
});
