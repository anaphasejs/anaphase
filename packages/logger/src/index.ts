import winston from "winston";

export const makeLogger = ({
  serviceName
}: {
  serviceName: string;
}): winston.Logger => {
  const logger = winston.createLogger({
    level: "info",
    format: winston.format.json(),
    defaultMeta: { service: serviceName },
    transports: [
      //
      // - Write to all logs with level `info` and below to `combined.log`
      // - Write all logs error (and below) to `error.log`.
      //
      new winston.transports.File({ filename: "error.log", level: "error" }),
      new winston.transports.File({ filename: "combined.log" })
    ]
  });

  if (process.env.NODE_ENV !== "production") {
    logger.add(
      new winston.transports.Console({
        format: winston.format.simple()
      })
    );
  } else {
    logger.add(
      new winston.transports.Console({
        format: winston.format.json()
      })
    );
  }

  return logger;
};
