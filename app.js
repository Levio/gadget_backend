const Koa = require("koa");
const app = new Koa();

const websocketify = require("koa-websocket");
const wsapp = websocketify(new Koa());
const route = require("koa-route");

const views = require("koa-views");
const json = require("koa-json");
const onerror = require("koa-onerror");
const bodyparser = require("koa-bodyparser");
const logger = require("koa-logger");

const index = require("./routes/index");
const users = require("./routes/users");

// error handler
onerror(app);

// middlewares
app.use(
  bodyparser({
    enableTypes: ["json", "form", "text"],
  })
);
app.use(json());
app.use(logger());
app.use(require("koa-static")(__dirname + "/public"));

app.use(
  views(__dirname + "/views", {
    extension: "pug",
  })
);

// logger
app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

// routes
app.use(index.routes(), index.allowedMethods());
app.use(users.routes(), users.allowedMethods());

// error-handling
app.on("error", (err, ctx) => {
  console.error("server error", err, ctx);
});

const wsclients = [];

wsapp.ws.use(function (ctx, next) {
  wsclients.push(ctx);
  ctx.websocket.send(JSON.stringify({ type: "link", message: "链接成功" }));
  return next(ctx);
});
wsapp.ws.use(
  route.all("/", function (ctx) {
    /**接收消息*/
    ctx.websocket.on("message", function (message) {
      const msg = JSON.parse(message);
      console.log(msg);
      // 返回给前端的数据
      if (msg.type === "sc") {
        const data = JSON.stringify({
          type: "sc",
          message: msg.message,
        });
        wsclients.forEach((client) => {
          client.websocket.send(data);
        });
      }
    });
  })
);

module.exports = { app, wsapp };
