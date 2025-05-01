import { trafficAndSaturationMetric } from "./trafficAndSaturation.metric";
import { latencyMetric } from "./latency.metric";
import client from "prom-client";
import { Express } from "express";
import { Request, Response } from "express";
import logger from "../logger/logger";
import { isDevEnv } from "../lib/helpers/auth.helper";

const handleMetrics = async (req: Request, res: Response) => {
    try {
        const metrics = await client.register.metrics();
        res.setHeader("Content-Type", client.register.contentType);
        return res.send(metrics);
    } catch (error) {
        return res.status(500).json({
            data: null,
            code: 500,
            message: error.message ?? "Internal server error",
        });
    }
};

export const setupMetrics = async (app?: Express) => {
    try {
        // Uncomment below later
        if (isDevEnv()) return;

        // Register default metrics
        const collectDefaultMetrics = client.collectDefaultMetrics;
        collectDefaultMetrics({ register: client.register });

        app.get("/metrics", handleMetrics);

        app.use((req, res, next) => {
            if (req.url === "/health" || req.url === "/metrics") {
                return next();
            }

            const end = latencyMetric.startTimer({
                method: req.method,
                endpoint: req.path || req.url.split("?")[0],
            });

            trafficAndSaturationMetric.labels(req.method, req.path || req.url.split("?")[0], res.statusCode.toString()).inc();

            res.on("finish", () => {
                end({ status_code: res.statusCode });
            });

            next();
        });
    } catch (error) {
        logger.error("Error setting up metrics", error);
    }
};
