import express from "express";
import next from "next";
import { ApolloOptions, buildApolloServer } from "./apolloServer";
import { logger } from "./logger";
export { logger } from "./logger";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

process.on("unhandledRejection", error => {
  logger.error("fatal error", { error });
});

export interface ServerOptions extends ApolloOptions {
  port: number;
  trustProxy?: boolean;
  loadBeforeApollo?: (server: express.Express) => void;
  loadAfterApollo?: (server: express.Express) => void;
}

export const makeServer = ({
  port,
  loadBeforeApollo,
  loadAfterApollo,
  trustProxy = true,
  ...apolloOptions
}: ServerOptions): void => {
  app.prepare().then(async () => {
    const server = express();

    // for use if you are behind cloudflare
    if (trustProxy) {
      server.set("trust proxy", 1);
    }

    if (loadBeforeApollo) {
      loadBeforeApollo(server);
    }

    const apolloServer = await buildApolloServer(apolloOptions);
    apolloServer.applyMiddleware({ app: server, path: "/graphql" });

    if (loadAfterApollo) {
      loadAfterApollo(server);
    }

    server.all("*", (req, res) => {
      return handle(req as any, res);
    });

    server.listen(port, async (err: any) => {
      if (err) throw err;
      logger.info(`> Ready on http://localhost:${port}`);
    });
  });
};
