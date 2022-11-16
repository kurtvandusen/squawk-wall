import express, { Request, Response } from 'express';
import { Mongoose } from 'mongoose';
const amqp = require("amqplib");
import CommentsModel from '../models/comments';

const { randomBytes } = require("crypto");

const router = express.Router();

router.get('/api/posts/:postId/comments/', (req: Request, res: Response) => {
    const postId = req.params.postId;
    CommentsModel.find({ postId: postId }, (err: any, comments: any) => {
        if (err) {
            res.status(500).send(err);
        } else {

            res.status(200).send(comments);
        }
    });
});
 
    router.post('/api/posts/:postId/comments/', async (req: Request, res: Response) => {
        const { comment } = req.body;
        const commentId = randomBytes(4).toString("hex");
        const postId = req.params.postId;
        const commentData = { comment: comment, commentId: commentId};
        const msg = { comment: comment, commentId: commentId, postId: postId };
        
        try {
            await CommentsModel.updateOne({ postId: postId }, { $push: { comments: commentData } });
            console.log(`Comment ${commentId} saved to post ${postId}`);

            const amqpConnection = await amqp.connect("amqp://rabbitmq-service:5672");
            console.log("Comments API connected to RabbitMQ");
            const channel = await amqpConnection.createChannel();
            await channel.assertExchange("posts-exchange", "topic", { durable: false });
            console.log("Exchange created");
            await channel.publish("posts-exchange", "comment", Buffer.from(JSON.stringify(msg)));
            console.log("Comment published to RabbitMQ");
            res.status(201).send(commentData);

        } catch (err) {
            res.status(500).send("error " + err);
        }
    });

    export { router };