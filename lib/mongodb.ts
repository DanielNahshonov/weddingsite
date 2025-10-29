import { MongoClient, MongoClientOptions, ServerApiVersion } from "mongodb";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable");
}

const options: MongoClientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = MongoClient.connect(uri, options);
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = MongoClient.connect(uri, options);
}

export async function getMongoClient() {
  return clientPromise;
}

export async function getDatabase() {
  const client = await getMongoClient();
  return client.db();
}
