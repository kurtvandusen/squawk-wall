import express, { Request, Response } from 'express';
const amqp = require("amqplib");
import QueryModel from '../models/query';

const router = express.Router();

router.get('/api/query', (req: Request, res: Response) => {
  
    QueryModel.find({}, (err: any, data: any) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(data);
        }
    });
});

export { router };