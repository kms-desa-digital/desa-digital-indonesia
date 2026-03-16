import { MongoClient } from "mongodb";

const url = process.env.MONGODB_URL;
const options = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  directConnection: true,
};

// Gunakan fungsi untuk mendapatkan URL agar selalu fresh dari process.env
function getMongoURL() {
  const url = process.env.MONGODB_URL;
  if (!url) {
    throw new Error("Please provide a MongoDB URL in the environment variables");
  }
  return url;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!(global as any)._mongoClientPromise) {
    const url = getMongoURL();
    console.log("V3: Initializing MongoClient with URL:", url.replace(/\/\/.*@/, "//***:***@"));
    const client = new MongoClient(url, options);
    console.log("Creating new client promise (development)...");
    (global as any)._mongoClientPromise = client.connect()
      .then(c => {
        console.log("MongoDB successfully connected!");
        return c;
      })
      .catch(e => {
        console.error("MongoDB initial connection failed:", e);
        delete (global as any)._mongoClientPromise;
        throw e;
      });
  }
  clientPromise = (global as any)._mongoClientPromise;
} else {
  const url = getMongoURL();
  const client = new MongoClient(url, options);
  clientPromise = client.connect();
}

export default clientPromise;

export async function connectToDatabase() {
    try {
      const connection = await clientPromise;
      const dbName = process.env.MONGODB_DB || process.env.MONGODB_DB_NAME;
      console.log(`Connecting to database: ${dbName}`);
      return connection.db(dbName);
    } catch (error) {
      console.error("MongoDB connection error details:", error);
      throw error;
    }
}