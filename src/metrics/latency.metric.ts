import client from "prom-client";

export const latencyMetric = new client.Histogram({
    name: "http_req_res_time",
    help: "This is how much time it takes to process a request",
    labelNames: ["method", "endpoint", "status_code"],
    buckets: [1, 50, 100, 200, 300, 400, 500, 1000, 2000],
});
