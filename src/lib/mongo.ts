import { MongoClient } from 'mongodb';

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<any> | undefined;
}

let client: any | undefined;
let clientPromise: Promise<any> | undefined;

// Simple in-memory fallback for development when MONGODB_URI is not set.
function makeInMemoryClient() {
  const collections = new Map<string, any[]>();

  function ensureCollection(name: string) {
    if (!collections.has(name)) collections.set(name, []);
    return collections.get(name) as any[];
  }

  function makeId() {
    // 24 hex chars like Mongo ObjectId
    const id = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    return { toString: () => id };
  }

  const client = {
    db() {
      return {
        collection(name: string) {
          const store = ensureCollection(name);

          return {
            async findOne(filter: any) {
              if (!filter) return null;
              // support matching by email, resetToken, or _id
              if (filter.email) {
                const e = String(filter.email).toLowerCase();
                return store.find((d: any) => d.email && String(d.email).toLowerCase() === e) || null;
              }
              if (filter.resetToken) {
                return store.find((d: any) => d.resetToken === filter.resetToken) || null;
              }
              if (filter._id) {
                const idToMatch = (filter._id && typeof filter._id.toString === 'function') ? filter._id.toString() : String(filter._id);
                return store.find((d: any) => d._id && d._id.toString() === idToMatch) || null;
              }
              // try to do a shallow match on other keys
              return store.find((d: any) => {
                return Object.entries(filter).every(([k, v]) => {
                  if (d[k] === undefined) return false;
                  if (d[k] && typeof d[k].toString === 'function') return d[k].toString() === String(v);
                  return d[k] === v;
                });
              }) || null;
            },

            async insertOne(doc: any) {
              const toInsert = { ...doc };
              if (!toInsert._id) toInsert._id = makeId();
              store.push(toInsert);
              return { acknowledged: true, insertedId: toInsert._id };
            },

            async updateOne(filter: any, update: any) {
              const existing = await this.findOne(filter);
              if (!existing) return { acknowledged: true, modifiedCount: 0 };
              if (update.$set) {
                Object.assign(existing, update.$set);
              }
              if (update.$unset) {
                Object.keys(update.$unset).forEach((k) => delete existing[k]);
              }
              return { acknowledged: true, modifiedCount: 1 };
            },
          };
        },
      };
    },
  };

  return client;
}

/**
 * Return a connected MongoClient-like instance.
 * If MONGODB_URI is not configured, return an in-memory mock client (dev convenience)
 */
export async function getClient(): Promise<any> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    // Do not throw — provide an in-memory fallback so local development can proceed
    if (process.env.NODE_ENV === 'development') {
      if (!global._mongoClientPromise) {
        // emulate async connect
        global._mongoClientPromise = Promise.resolve(makeInMemoryClient());
      }
      clientPromise = global._mongoClientPromise as Promise<any>;
      return clientPromise;
    }
    // In production/staging we still prefer to throw so missing config surfaces immediately
    throw new Error('Please define the MONGODB_URI environment variable inside .env');
  }

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: attach to global for dev caching
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise as Promise<any>;
  } else {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }

  return clientPromise as Promise<any>;
}

export default getClient;
