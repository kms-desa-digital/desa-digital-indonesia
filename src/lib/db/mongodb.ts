import { MongoClient } from "mongodb";

const options = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
};

// ambil URL MongoDB dari env
function getMongoURL() {
  const url = process.env.MONGODB_URL;

  if (!url) {
    throw new Error(
      "Please provide a MongoDB URL in the environment variables"
    );
  }

  return url;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // di development pakai global biar tidak reconnect terus
  if (!(global as any)._mongoClientPromise) {
    const url = getMongoURL();

    console.log(
      "Init MongoClient:",
      url.replace(/\/\/.*@/, "//***:***@")
    );

    const client = new MongoClient(url, options);

    // simpan promise di global
    (global as any)._mongoClientPromise = client
      .connect()
      .then((c) => {
        console.log("MongoDB connected");
        return c;
      })
      .catch((e) => {
        console.error("MongoDB connection failed:", e);
        delete (global as any)._mongoClientPromise;
        throw e;
      });
  }

  clientPromise = (global as any)._mongoClientPromise;
} else {
  // production langsung connect biasa
  const url = getMongoURL();
  const client = new MongoClient(url, options);
  clientPromise = client.connect();
}

export default clientPromise;

// helper untuk ambil database
export async function connectToDatabase() {
  try {
    const connection = await clientPromise;

    const dbName =
      process.env.MONGODB_DB ||
      process.env.MONGODB_DB_NAME;

    console.log(`Connecting to database: ${dbName}`);

    return connection.db(dbName);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}