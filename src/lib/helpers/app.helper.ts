import packageInfo from "../../../package.json";
import { MONGODB_URI, NODE_ENV } from "../../config";
import logger from "../../logger/logger";

export function getAppMetaData() {
    try {
        const hash = packageInfo?.gitSHA ?? "";
        const sanitizedVersion = packageInfo?.version?.replace(/\./g, "-").trim();
        const xVersionHeaderValue = `${sanitizedVersion}-${hash}`;
        return { hash, xVersionHeaderValue, ...packageInfo };
    } catch (error) {
        logger.error("Error reading version-info.txt", error);
        return { hash: "Unknown", xVersionHeaderValue: "Unknown", ...packageInfo };
    }
};

export const appInitializationLogs = (port: string | number) => {
    const appMeta = getAppMetaData();
    const databaseHost = new URL(MONGODB_URI).host;
    logger.info("DATABASE_HOST", databaseHost);
    logger.info("NODE_ENV: ", NODE_ENV);
    logger.info(`${appMeta.name?.toUpperCase()} app running at : http://localhost:${port}`);
    logger.info("GIT_SHA", appMeta.hash);
    logger.info("VERSION", appMeta.version);
};

export const getHomePageHTML = () => {
    const { name, description, version, hash } = getAppMetaData();
    return `
        <!DOCTYPE html>
        <html>
            <head>
                <style>
                    *{
                        box-sizing: border-box;
                    }
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        background-color: #f0f0f0;
                    }
                    h1,h2,h3,h4,h5,h6 {
                        margin: 0;
                        margin-bottom: 0.5rem;
                        text-align: center;
                    }
                    .centered {
                        display: flex;
                        justify-content: center;
                        flex-direction: column;
                        align-items: center;
                        height: 100vh;
                        font-weight: bold;
                    }
                    .bottom-right {
                        position: absolute;
                        bottom: 8px;
                        right: 16px;
                    }
                </style>
            </head>
            <body>
                <div class="centered">
                    <h1>Welcome to ${name}</h1>
                    <h4>${description}</h4>
                </div>
                <div class="bottom-right">
                    <small>v${version} (${hash})</small>
                </div>
            </body>
        </html>
    `;
};
