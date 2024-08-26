import mongoose from "mongoose";
import { Request, Response } from "express";

export const deleteAllData = async (req: Request, res: Response) => {
    try {
        if (!mongoose.connection.db) {
            res.status(500).send({ message: 'Database connection error' });
            return;
        }
        // Get all collections in the current database
        const collections = await mongoose.connection.db.listCollections().toArray();

        // Iterate over each collection
        for (const collection of collections) {
            const collectionName = collection.name;

            if (collectionName === 'users') {
                // Delete all users except the one with username = process.env.ADMIN_USERNAME
                await mongoose.connection.db.collection('users').deleteMany({
                    username: { $ne: process.env.ADMIN_USERNAME }  // Keep the admin user
                });
            } else {
                // For other collections, delete all documents
                await mongoose.connection.db.collection(collectionName).deleteMany({});
            }
        }

        res.status(200).send({ message: 'All data deleted, except admin user.' });
    } catch (error : any) {
        console.error('Error deleting data:', error);
        res.status(error.statusCode || 500).send({ message: 'Error deleting data:', error });
    }
};