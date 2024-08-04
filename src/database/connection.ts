import mongoose from 'mongoose';

class MongoDBConnection {
    private uri: string;

    constructor(uri: string) {
        this.uri = uri;
    }

    async connect() {
        try {
            await mongoose.connect(this.uri);
            console.log('MongoDB connected successfully');
        } catch (error) {
            console.error('Error connecting to MongoDB:', error);
            throw new Error('Database connection failed');
        }
    }

    async disconnect() {
        try {
        await mongoose.disconnect();
        console.log('MongoDB disconnected successfully');
        } catch (error) {
        console.error('Error disconnecting from MongoDB:', error);
        }
    }
}

export default MongoDBConnection;
