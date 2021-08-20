import fs from "fs-extra";
import path from "path";
import Koa from "koa";
import body from "koa-body";
import jwt from "koa-jwt";
import cors from "@koa/cors";
import { koaJwtSecret } from "jwks-rsa";
import uuid from "uuid/v4";
import send from "koa-send";

const DEBUG = false;

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;

// NOTE: This must be relative or `koa-send` will fail
const MEDIA_PATH =
  typeof process.env.MEDIA_PATH === "string" &&
  process.env.MEDIA_PATH.length > 0
    ? process.env.MEDIA_PATH
    : "./data/";

if (
  typeof AUTH0_DOMAIN !== "string" ||
  AUTH0_DOMAIN.length === 0 ||
  typeof AUTH0_CLIENT_ID !== "string" ||
  AUTH0_CLIENT_ID.length === 0
) {
  console.error("AUTH0_DOMAIN and AUTH0_CLIENT_ID env var must be set #uMFaST");
  process.exit();
}

const ALLOW_ROLES = ["admin", "editor"];

const isUserAdminOrEditor = (roles: string[]) => {
  return !!ALLOW_ROLES.find((role) => {
    if (roles.indexOf(role) !== -1) {
      return true;
    }
    return false;
  });
};

const app = new Koa();

app.use(cors());

app.use(
  jwt({
    secret: koaJwtSecret({
      jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 24 * 60 * 60 * 1e3,
    }),
    audience: AUTH0_CLIENT_ID,
    issuer: `https://${AUTH0_DOMAIN}/`,
  })
);

app.use(body({ multipart: true }));

app.use(async (ctx, next) => {
  ctx.state.userId = ctx.state.user.sub;
  ctx.state.roles =
    ctx.state.user["https://hasura.io/jwt/claims"]["x-hasura-allowed-roles"];
  return await next();
});

app.use(async (ctx, next) => {
  // Ignore any requests which are not POST
  if (ctx.method !== "POST") {
    return await next();
  }

  const { userId } = ctx.state;

  // If we do not have exactly 1 file, return 500
  if (!ctx.request.files || !ctx.request.files.file) {
    if (DEBUG) console.log("No files #mgCb2N", ctx.request.files, ctx.request);
    ctx.throw(500, "Failed to upload a file #WkdnEy");
  }

  const fileId = uuid();
  const newFileName = `${userId}__${fileId}`;
  const file = ctx.request.files.file;
  const destinationPath = path.join(MEDIA_PATH, newFileName);
  await fs.move(file.path, destinationPath);

  ctx.body = JSON.stringify({ fileUrl: `/${userId}/${fileId}` });
});

app.use(async (ctx, next) => {
  const { userId, roles } = ctx.state;

  const [, fileUserId, fileName] = ctx.path.split("/");

  if (!fileUserId || !fileName) {
    if (DEBUG) console.log("Not found #j2o4dm", ctx.path);
    ctx.throw(404, "Not found #E56ubM");
  }

  if (userId !== fileUserId && !isUserAdminOrEditor(roles)) {
    ctx.throw(404, "Not found #NgDJgR");
  }

  // Build the filename
  const filePath = path.join(MEDIA_PATH, `${fileUserId}__${fileName}`);
  if (DEBUG) console.log("Sending filePath #RGm8Me", filePath);
  await send(ctx, filePath);
  if (DEBUG) console.log("File sent #RDz9XD");

  // ctx.body = "Hello";
});

app.listen(4000);

console.log(`Started koa on 4000 #GjsIbU`, {
  AUTH0_DOMAIN,
  AUTH0_CLIENT_ID,
  MEDIA_PATH,
});
