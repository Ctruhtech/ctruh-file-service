import { CosmosClient } from "@azure/cosmos";
import dotenv from "dotenv";

dotenv.config();

const endpoint = process.env.COSMOS_ENDPOINT || "";

const key = process.env.COSMOS_KEY || "";

const client = new CosmosClient({ endpoint, key });

export default client;
