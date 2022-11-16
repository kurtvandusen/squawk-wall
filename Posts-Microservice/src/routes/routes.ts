import express, { Request, Response } from 'express';
const amqp = require("amqplib");
import PostsModel from '../models/posts';
// import event js file

const { randomBytes } = require("crypto");

const router = express.Router();

router.get('/api/posts/', (req: Request, res: Response) => {
    PostsModel.find({}, (err: any, posts: any) => {
        if (err) {
            res.send(err);
        }
        res.status(200).json(posts);
    });
});

router.post('/api/posts/', async (req: Request, res: Response) => {
    const { post } = req.body;
    const postId = randomBytes(4).toString("hex");
    const postData = { post, postId };
    try {
        const newPost = new PostsModel(postData);
        await newPost.save();
        console.log("Saved post", + postId,  "to DB");

        const amqpConnection = await amqp.connect("amqp://rabbitmq-service:5672");
        console.log("Posts connected to RabbitMQ");
        const channel = await amqpConnection.createChannel();
        await channel.assertExchange("posts-exchange", "topic", { durable: false });
        console.log("Exchange created");
        await channel.publish("posts-exchange", "post", Buffer.from(JSON.stringify(postData)));
        console.log("Published to RabbitMQ");
        res.status(201).send(postData);

    } catch (err) {
        res.status(500).send("error " + err);
    }
});

export { router };