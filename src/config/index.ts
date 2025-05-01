import dotenv from "dotenv";
dotenv.config();

export const {
    APP_NAME,
    APP_PORT,
    NODE_ENV,
    AZURE_BLOB_CONN_STR,
    AZURE_CONTAINER_NAME,
    MONGODB_URI,
    MONGODB_DB,
    LOKI_URL,
    LOKI_AUTH_CREDENTIAL,
} = process.env;
