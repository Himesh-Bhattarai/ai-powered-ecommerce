import mongoose from "mongoose";

const globalMongoose = globalThis;
const CONNECTION_TIMEOUT_MS = 15000;

function waitForConnection() {
    return Promise.race([
        mongoose.connection.asPromise(),
        new Promise((_, reject) => {
            setTimeout(
                () => reject(new Error("MongoDB connection timed out")),
                CONNECTION_TIMEOUT_MS
            );
        }),
    ]);
}

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is not defined");
    }

    if (mongoose.connection.readyState === 2) {
        try {
            return await waitForConnection();
        } catch (error) {
            globalMongoose.mongooseConnectionPromise = null;
            await mongoose.disconnect().catch(() => {});
            console.error("MongoDB connection attempt failed:", error);
        }
    }

    if (!globalMongoose.mongooseConnectionPromise) {
        globalMongoose.mongooseConnectionPromise = mongoose
            .connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 15000,
            })
            .then((connection) => {
                console.log(`MongoDB Connected: ${connection.connection.host}`);
                return connection.connection;
            })
            .catch((error) => {
                globalMongoose.mongooseConnectionPromise = null;
                throw error;
            });
    }

    return globalMongoose.mongooseConnectionPromise;
};

export default connectDB;
