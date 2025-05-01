import { MongoClient } from "mongodb";
import { MONGODB_DB, MONGODB_URI } from "../config";
import logger from "../logger/logger";
// Initialize a MongoDB client
const uri = MONGODB_URI;
const client = new MongoClient(uri);

let db;

// Connect to the MongoDB server
export const connectToMongoDB = async (dbName?: string) => {
  try {
      await client.connect();
      const database = dbName || MONGODB_DB;
      logger.info("Connected to MongoDB!", database);
      const instance = client.db(database); // Assign the database instance
      if (!dbName) db = instance;
      return instance;
  } catch (err) {
      logger.error("Error connecting to MongoDB:", err);
  }
};

export const getCollection = async (collectionName: string) => {
  if (!db) {
    await connectToMongoDB();
  }

  return await db.collection(collectionName);
};

// Close the connection when the application terminates (optional, but recommended)
process.on("SIGINT", async () => {
  if (client) {
    await client.close();
    console.log("Closed connection to MongoDB");
  }
  process.exit(0);
});