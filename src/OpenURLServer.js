// Creates an OpenURL server that contains a configured Koa app.

const Koa = require('koa');
const _ = require('lodash');
const { ContextObject } = require('./ContextObject');
const { ReshareRequest } = require('./ReshareRequest');
const { OkapiSession } = require('./OkapiSession');

class OpenURLServer {
  constructor(cfg) {
    this.okapi = new OkapiSession(cfg);
    this.cfg = cfg;

    this.app = new Koa();
    this.app.use(ctx => {
      const co = new ContextObject(cfg, ctx.query);
      cfg.log('co', `got ContextObject ${co.getType()} query`, JSON.stringify(co.getQuery(), null, 2));
      const admindata = co.getAdmindata();
      const metadata = co.getMetadata();
      cfg.log('admindata', JSON.stringify(admindata, null, 2));
      cfg.log('metadata', JSON.stringify(metadata, null, 2));

      if (_.get(admindata, ['svc', 'id']) === 'contextObject') {
        return new Promise((resolve) => {
          ctx.body = { admindata, metadata };
          resolve();
        });
      }

      const rr = new ReshareRequest(co);
      const req = rr.getRequest();
      cfg.log('rr', JSON.stringify(req, null, 2));
      return this.okapi.post('/rs/patronrequests', req)
        .then(res => {
          cfg.log('posted', `sent request, status ${res.status}`);
          ctx.body = this.htmlBody(res);
        });
    });
  }

  okapiLogin() { return this.okapi.login(); }
  listen(...args) { return this.app.listen(...args); }

  htmlBody(res) {
    const ss = `${res.status}`;
    const ok = (ss[0] === '2');
    const template = this.cfg.getTemplate(ok ? 'good' : 'bad');
    const vars = { status: ss };
    return template(vars);
  }
}

module.exports = { OpenURLServer };
