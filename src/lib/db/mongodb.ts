import { MongoClient } from "mongodb";

const url = process.env.MONGODB_URL;
const options = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  retryWrites: true,
  retryReads: true,
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!url) {
    throw new Error("Please provide a MongoDB URL in the environment variables");
}

if (process.env.NODE_ENV === "development") {
  if (!(global as any)._mongoClientPromise) {
    client = new MongoClient(url, options);
    (global as any)._mongoClientPromise = client.connect();
  }
  clientPromise = (global as any)._mongoClientPromise;
} else {
  client = new MongoClient(url, options);
  clientPromise = client.connect();
}

export default clientPromise;

export async function connectToDatabase() {
    try {
      const connection = await clientPromise;
      return connection.db(process.env.MONGODB_DB_NAME);
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw error;
    }
}