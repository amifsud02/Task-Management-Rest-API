import 'dotenv/config'; // Handling environment variables

import { Request, Response } from "express";
import { BaseController } from "./baseController";
import { MongoClient, ServerApiVersion, SortDirection, Collection, ObjectId } from 'mongodb';
import { Task } from '../models/Task';

export class TaskController extends BaseController {
    
    private static instance: TaskController;
    private static client: MongoClient;

    private uri: string;
    private dbName: string;

    readonly LIMIT: 10; // 10 per Page
    readonly PAGE: 1; // No Skips

    constructor() {
        super();
        
        this.uri = process.env.MONGODB_URI as string;
        this.dbName = process.env.MONGODB_DB_TASKS as string;

        if(!this.uri || !this.dbName) {
            throw new Error("Environmental variables for Database Connection not set!");
        }

        TaskController.client = new MongoClient(this.uri, { 
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
            minPoolSize: 1,
            maxPoolSize: 10
        })
    }

    public static getInstance(): TaskController {
        if(!TaskController.instance) {
            TaskController.instance = new TaskController()
        }

        return TaskController.instance;
    }

    async connectDB(): Promise<void> {
        try {
            await TaskController.client.connect();
            console.log('MongoDB connected');
        } catch (err) {
            console.log('Failed to connect to MongoDB', err);
        }
    }


    async index(req: Request, res: Response): Promise<any> {
        let connection; // For Pooling
    
        try {
            connection = await this.connectDB();
            const db = TaskController.client.db(this.dbName);
            const collection: Collection = db.collection('tasks');
    
            let { status, sortBy, sortOrder, page, limit } = req.query;
    
            const query: { [key: string]: any } = {}; // In case no filters are passed, we retrieve all 

            if(status) {
                let parsedStatus = 'true' === status;

                // Setting the Status 
                if(parsedStatus !== undefined) {
                    query["completed"] = Boolean(parsedStatus);
                }
            }
            
            const sort: { [key: string]: SortDirection } = {}; // 1 or -1
    
            // If only 'sortBy' is provided, apply default sortOrder of 1
            if (this.isSortByValid(sortBy) && !sortOrder) {
                sortOrder = '1';
            }
    
            // Validate and set sort params
            if (this.isSortByValid(sortBy) && sortOrder) {
                if (![1, -1].includes(Number(sortOrder))) {
                    return res
                        .status(400)
                        .json({ 
                            success: false, 
                            message: "Invalid Sort Order" 
                        });
                }
                sort[sortBy as string] = Number(sortOrder) as SortDirection;
            }
    
            
            // Validating Page and Limit
            let currentPage = page ? Number(page) : null;
            let currentLimit = limit ? Number(limit) : null;

            if(currentPage || currentLimit) {
                currentPage = currentPage || 1;
                currentLimit = currentLimit || this.LIMIT; // Default limit to 10 if only page is provided
                
                if (isNaN(currentPage) || currentPage < 1 || isNaN(currentLimit) || currentLimit < 1) {
                    return res
                        .status(400)
                        .json({ 
                            success: false,
                            message: "Invalid Page or Limit"
                        });
                }
    
                const numberOfRecordsToSkip = (currentPage - 1) * currentLimit;
                const tasks = await collection.find(query)
                    .skip(numberOfRecordsToSkip)
                    .limit(currentLimit)
                    .sort(sort)
                    .toArray()
    
                return res.send({data: tasks, "body": req.query});
            }
    
            console.log(query)
            // No pagination, fetch all records
            const tasks = await collection.find(query)
                .sort(sort)
                .toArray();

            res.send({data: tasks, "body": req.query});
    
        } catch (err) {
            console.log(err);
            res.status(500).send(err);
        } finally {
            if(connection) {
                connection.release();
            }
        }
    }
    
    /**
     * Filter By: 
     *      Date
     *      Status - TODO | DOING | REVIEW | COMPLETED
     *      User 
     *      TAGS - BUG | FEATURE | LOW-PRIORITY | HIGH PRIORITY | R&D | ON-HOLD | SECURITY
    */

    async create(req: Request, res: Response): Promise<any> {
        let connection; // For Pooling

        try {
            const { title, description, dueDate, completed } = req.body;

            if(!title || !dueDate) {
                res.status(400).send('Missing required fields');
                return;
            }

            if (isNaN(new Date(dueDate).getTime())) {
                res.status(400).send('Invalid date format for dueDate');
                return;
            }

            connection = await this.connectDB();
            const db = TaskController.client.db(this.dbName);
            const collection: Collection= db.collection('tasks');

            const result = await collection.insertOne({
                title,
                description,
                dueDate: new Date(dueDate),
                completed: completed || false,
            })

            res.status(201)
                .json({ 
                    success: true,
                    message: result
                });
        } catch (err) {
            console.log(err);
            res.status(500).send(err);
        } finally {
            if(connection) {
                connection.release();
            }        
        }
    }

    async show(req: Request, res: Response): Promise<any> {
        let connection;
        
        try {
            const _id  = req.params.id;

            if(!ObjectId.isValid(_id)) {
                res.status(400).send('Invalid _id');
                return;
            }

            connection = await this.connectDB();
            const db = TaskController.client.db(this.dbName);
            const collection: Collection= db.collection('tasks');

            const task = await collection.findOne({_id: new ObjectId(_id)});

            if(task) {
                res.status(200).send({
                    success: true,
                    data: task,
                    timestamp: new Date().toISOString(),
                })
            } else {
                res.status(500).send({
                    success: false,
                    data: {},
                    timestamp: new Date().toISOString(),
                })
            }

        } catch (err) {
            console.log(err);
            res.status(500).send(err);
        } finally {
            if(connection) {
                connection.release();
            } 
        }
    }

    async update(req: Request, res: Response): Promise<any> {
        let connection;
        
        try {
            const _id  = req.params.id;

            if(!ObjectId.isValid(_id)) {
                res.status(400).send({
                    success: false,
                    message: 'Invalid ID',
                    timestamp: new Date().toISOString(),
                })

                return;
            }

            const { title, description, dueDate, completed } = req.body;

            if(!title && !description && !dueDate && !completed === undefined) {
                res.status(400).send({
                    success: false,
                    message: 'No Fields to update',
                    timestamp: new Date().toISOString(),
                })

                return;
            }
                   
            const updateFields: Partial<Task> = {};
            if (title) {
                updateFields.title = title;
            }

            if(description) {
                updateFields.description = description;
            }

            if(dueDate) {
                updateFields.dueDate = new Date(dueDate);
            }

            if(completed !== undefined) {
                updateFields.completed = completed;
            }

            connection = await this.connectDB();
            const db = TaskController.client.db(this.dbName);
            const collection: Collection= db.collection('tasks');

            const result = await collection.updateOne(
                { _id: new ObjectId(_id) }, 
                { $set: updateFields }
            )

            if(0 === result.matchedCount) {
                res.status(404).send({
                    success: false,
                    message: 'Task not found',
                    timestamp: new Date().toISOString(),
                })
            } else {
                res.status(200).send({
                    success: true,
                    data: result,
                    timestamp: new Date().toISOString(),
                })
            }
        } catch (err) {
            console.log(err);
            res.status(500).send(err);
        } finally {
            if(connection) {
                connection.release();
            } 
        }
    }

    async delete(req: Request, res: Response): Promise<any> {
            
        try {
            const _id  = req.params.id;

            if(!ObjectId.isValid(_id)) {
                res.status(400).send('Invalid _id');
                return;
            }

            await this.connectDB();
            const db = TaskController.client.db(this.dbName);
            const collection: Collection = db.collection('tasks');

            const task = await collection.deleteOne({_id: new ObjectId(_id)});

            if(task) {
                res.status(204).send({
                    success: true,
                    message: `${_id} was successfully deleted.`,
                    timestamp: new Date().toISOString(),
                })
            } else {
                res.status(500).send({
                    success: false,
                    message: 'Error occurred',
                    timestamp: new Date().toISOString(),
                })
            }

        } catch (err) {
            console.log(err);
            res.status(500).send(err);
        } finally {
            TaskController.client.close();
        }
    }

    // Helper Functions 
    private isSortByValid(sortBy): boolean {
        const fields = ["dueDate", "status"]; 
        return fields.includes(sortBy);
    }
}
