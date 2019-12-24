import { makeLogger } from "@anaphasejs/logger";

export const logger = makeLogger({
  serviceName: process.env.SERVICE_NAME || "anaphase-app"
});
