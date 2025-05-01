import { createLogger, format, transports } from "winston";
import { getAppMetaData } from "../lib/helpers/app.helper";
import sourceMapSupport from "source-map-support";
import path from "path";
import LokiTransport from "winston-loki";
import { APP_NAME, LOKI_AUTH_CREDENTIAL, LOKI_URL, NODE_ENV } from "../config";
import { isDevEnv } from "../lib/helpers/auth.helper";
import { connectToMongoDB } from "../db/connection";

// Enable source map support
sourceMapSupport.install();

// Define the project root directory using process.cwd()
const projectRoot = process.cwd();

// Get the app meta data
const appMeta = getAppMetaData();

// Helper function to extract file name and line number from the stack trace
const extractFileNameAndLineNumber = (stack: string) => {
    const stackLines = stack.split("\n");
    const relevantLine = stackLines.find(line => line.includes("/"));
    if (!relevantLine) return { fileName: "N/A", lineNumber: "N/A" };

    const matches = relevantLine.match(/\(([^:]+):(\d+):\d+\)/);
    if (!matches) return { fileName: "N/A", lineNumber: "N/A" };

    const [, fullPath, lineNumber] = matches;
    let fileName = path.relative(projectRoot, fullPath); // Get relative path

    // Ensure the path starts from 'src'
    const srcIndex = fileName.indexOf("src");
    if (srcIndex !== -1) {
        fileName = fileName.substring(srcIndex);
    }

    return { fileName, lineNumber };
};

// Helper function to format the timestamp
const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toISOString().replace("T", " ").replace("Z", "");
};

// Error format with colorization
const errorFormat = format.printf(info => {
    const { timestamp, level, message, stack, name } = info;
    const colorizer = format.colorize();
    const coloredMessage = colorizer.colorize(level, message as string);
    const { fileName, lineNumber } = stack ? extractFileNameAndLineNumber(stack as string) : { fileName: "N/A", lineNumber: "N/A" };

    const errorDetails = {
        timestamp: formatTimestamp(timestamp as string), // Convert timestamp to readable format
        level,
        message,
        stack,
        name,
        fileName,
        lineNumber,
    };
    return `${coloredMessage}\n${JSON.stringify(errorDetails, null, 2)}`; // Indent JSON
});

// Info format with colorization
const infoFormat = format.printf(info => {
    const { timestamp, level, message, service, ...infoObject } = info;
    const extraInfo = info[Symbol.for("splat")] as Array<any>;
    const isExtraInfoPrimitive = extraInfo?.length === 1 && !Array.isArray(extraInfo[0]) && typeof extraInfo[0] !== "object";
    const formattedMessage = {
        timestamp: formatTimestamp(timestamp as string),
        level,
        message: isExtraInfoPrimitive ? `${message} - ${JSON.stringify(extraInfo[0])}` : message,
        service,
        data: isExtraInfoPrimitive ? {} : infoObject,
    };
    const colorizer = format.colorize();
    const coloredMessage = colorizer.colorize(level, formattedMessage?.message as string);
    return `${coloredMessage}\n${JSON.stringify(formattedMessage, null, 2)}`;
});

const conditionalFormat = format(info => {
    const transformed =
        ((info.level === "info" || info.level === "warn") && infoFormat.transform(info)) || (info.level === "error" && errorFormat.transform(info));
    return transformed;
});

// Create the logger
const logger = createLogger({
    level: "info",
    format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }), // Capture error stack trace
        format.splat(),
    ),
    defaultMeta: { service: appMeta.description }, // Default metadata
    transports: [
        new transports.Console({
            format: format.combine(
                format.timestamp(),
                format.errors({ stack: true }), // Capture error stack trace
                conditionalFormat(), // Colorized output
                format.colorize(),
            ),
        }),
        ...(isDevEnv()
            ? [] // Do not include Loki transport in dev environment
            : [
                  new LokiTransport({
                      host: LOKI_URL, // Change this to your Loki URL
                      basicAuth: LOKI_AUTH_CREDENTIAL,
                      onConnectionError: error => logger.error("Loki connection error", error),
                      labels: { service: `${NODE_ENV}-${APP_NAME}-${appMeta.name}` },
                      json: true,
                      format: format.combine(
                          format.timestamp(),
                          format.errors({ stack: true }),
                          conditionalFormat(), // Colorized output
                          format.colorize(),
                      ),
                  }),
              ]),
    ],
});

// Custom MongoDB logging
logger.on("data", async log => {
    if (log.level === "error") {
        try {
            if (isDevEnv()) return;

            const db = await connectToMongoDB(`${APP_NAME}_error_logs`);
            const collection = db.collection(`${NODE_ENV}_${APP_NAME}_${appMeta.name}_logs`);
            const { timestamp, level, message, stack, name } = log;
            const { fileName, lineNumber } = stack ? extractFileNameAndLineNumber(stack) : { fileName: "N/A", lineNumber: "N/A" };
            const errorDetails = {
                timestamp: formatTimestamp(timestamp), // Convert timestamp to readable format
                level,
                message,
                stack,
                name,
                fileName,
                lineNumber,
            };
            await collection.insertOne(errorDetails);
        } catch (err) {
            console.error("Failed to log to MongoDB", err);
        }
    }
});


export default logger;
