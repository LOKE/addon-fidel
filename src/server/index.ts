/* eslint-disable @typescript-eslint/no-var-requires */

// NODE MODULES
import { createServer } from "http";
import next from "next";
import cors from "cors";
import express, { RequestHandler } from "express";
import cookieSession from "cookie-session";
import promClient from "prom-client";
import knex from "knex";
import * as httpKit from "@loke/http-kit";
import * as httpClient from "@loke/http-client";
import * as lokeLogger from "@loke/logger";
import * as dbKit from "@loke/db-kit";

// import { EventHandler as LokeEventHandler } from "../loke/webhooks";
import { LokeApiClientFactory } from "../loke/api/client-factory";
import { createMiddleware } from "../loke/auth/middleware";
import { ApiClient } from "../loke/types";

import { Repository } from "../repo/types";
// If you want you can use MockRepository for an in-process version
import { MockRepository } from "../mock/repository";
import { PostgresRepository } from "../postgres/repository";

// CONFIGURATION
import * as config from "../environment/config";
import { initApi } from "./api";

const dbConfig = require("../../knexfile");

const rootLogger = lokeLogger.create({ metricsRegistry: promClient.register });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function initPostgresRepo(
  logger: lokeLogger.LokeLogger
): Promise<Repository> {
  const dbClient = knex(dbConfig);
  logger.info(
    "Using database",
    dbKit.knex.formatConnection(dbConfig.connection)
  );
  // This will run any migrations required
  // Ideally dbClient should also be used to run queries, but it is not essential
  await dbKit.knex.setup(dbClient, logger.withPrefix("db"), {
    migrateUp: true,
  });
  const repo = new PostgresRepository(dbClient);
  return repo;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function initMockRepo(): Promise<Repository> {
  const repo = new MockRepository();
  return repo;
}

async function initLokeApi(
  logger: lokeLogger.LokeLogger
): Promise<LokeApiClientFactory> {
  return new LokeApiClientFactory(logger.withPrefix("loke-api"), config);
}

async function initNextApp(
  logger: lokeLogger.Logger,
  config: { isDev: boolean }
) {
  const nextApp = next({ dev: config.isDev });
  const nextHandler = nextApp.getRequestHandler();

  logger.info("Preparing...");
  await nextApp.prepare();
  logger.info("Next.js ready");

  return nextHandler;
}

async function initServer(
  repo: Repository,
  nextHandler: (req: any, res: any) => Promise<any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  lokeApiClient: ApiClient,
  apiHandler: RequestHandler,
  logger: lokeLogger.LokeLogger
) {
  const server = express();
  server.enable("trust proxy");

  server.use(cors());
  // This probably doesn't need to be so large, but unsure how big menus can get at present
  server.use(express.json({ limit: "1mb" }));

  server.get("/metrics", (req, res) => {
    promClient.register.metrics().then((metrics) => {
      res.setHeader("Content-Type", promClient.register.contentType);
      res.send(metrics);
    });
  });

  server.get("/status", (req, res) => res.send("OK"));

  // The endpoints declared ABOVE will not be logged or metered
  // Everything below will be

  server.use(httpKit.createMetricsMiddleware());
  server.use(httpKit.createLoggingMiddleware(logger.withPrefix("http")));

  const authMiddleware = await createMiddleware(
    repo,
    lokeApiClient,
    logger.withPrefix("loke-auth"),
    config
  );

  server.use(
    cookieSession({
      name: "session",
      sameSite: "strict",
      keys: config.cookieKeys,
      // domain: "",
      // path: "/",
      httpOnly: true,
      secure: !config.isDev,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      overwrite: true,
    })
  );

  server.get("/", (req, res) => {
    res.redirect("/auth");
  });
  server.use("/auth", authMiddleware);

  server.use("/api", apiHandler);
  // server.use("/webhook/loke", lokeEventHandler.getRouter());

  server.use(httpKit.createErrorMiddleware(logger.withPrefix("http-error")));

  server.all("*", (req, res) => {
    return nextHandler(req, res);
  });

  const httpServer = createServer(server);
  httpKit.instrumentConnections(httpServer);

  return httpServer;
}

export async function start() {
  promClient.collectDefaultMetrics();

  // Need to cast `register` to any as httpClient is using an old version for typings, but it is compatible
  // When httpClient is updated we can remove the as any
  httpKit.registerMetrics(promClient.register as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  httpClient.registerMetrics(promClient.register as any); // eslint-disable-line @typescript-eslint/no-explicit-any

  const gateway = new promClient.Pushgateway(
    "https://addon-metrics.loke.global"
  );
  let pushInterval: NodeJS.Timer | null;
  let archiveInterval: NodeJS.Timer | null;

  const logger = rootLogger.withPrefix("server");

  function pushMetrics() {
    gateway.pushAdd({
      jobName: config.name,
      groupings: { instance: config.metricsInstance },
    });
  }

  const [repo, nextHandler] = await Promise.all([
    config.usePostgres ? initPostgresRepo(logger) : initMockRepo(),
    initNextApp(logger, config),
  ]);
  const lokeApiClientFactory = await initLokeApi(logger);
  const lokeApiClient = await lokeApiClientFactory.asClient();
  // const streakTracker = new StreakTracker(
  //   repo,
  //   lokeApiClient,
  //   logger.withPrefix("streak-tracker")
  // );

  // const lokeEventHandler = new LokeEventHandler(
  //   // streakTracker,
  //   logger.withPrefix("loke-events")
  // );

  const apiHandler = initApi(repo, lokeApiClientFactory, config);

  function archive() {
    // streakTracker.archiveExpiredStreaks(new Date()).catch((err) => {
    //   console.error(err.stack);
    // });
  }

  const httpServer = await initServer(
    repo,
    nextHandler,
    lokeApiClient,
    apiHandler,
    logger
  );

  const { shutdown } = httpKit.graceful(httpServer);

  logger.info("Starting http server...");
  httpServer.listen(config.port, () => {
    logger.info(`Listening on: ${config.port}`);
  });

  pushInterval = setInterval(pushMetrics, 60000);
  archiveInterval = setInterval(archive, 60000);

  logger.info("Waiting for stop signal");

  // Await stop signal
  await stopSignal();

  logger.info("Stop signal received, shutting down.");

  // Stop
  await shutdown();
  clearInterval(pushInterval);
  clearInterval(archiveInterval);
  pushInterval = null;
  archiveInterval = null;

  logger.info("Closing database connection...");
  await repo.destroy();

  logger.info("Shutdown successful.");
}

const stopSignal = () =>
  new Promise((resolve) => {
    process.once("SIGINT", resolve);
    process.once("SIGTERM", resolve);
  });
