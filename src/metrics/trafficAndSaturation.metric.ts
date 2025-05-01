import client from "prom-client";

export const trafficAndSaturationMetric = new client.Counter({
    name: "http_requests_total_and_saturation",
    help: "Total number of HTTP requests",
    labelNames: ["method", "endpoint", "status_code"],
});

// we will have to use this query to get the saturation
// sum by(endpoint) (increase(http_requests_total_&_saturation[$__rate_interval]))
