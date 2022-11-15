import express from 'express';
import mongoose from 'mongoose';
const amqp = require("amqplib");
import CommentsModel from './models/comments';

import { router } from './routes/routes';

const app = express();
app.use(express.json());
app.use(router);

async function processPostsMessage(msg: { content: { toString: () => any; }; }) {
  const content = JSON.parse(msg.content.toString());
  const { postId } = content;
  console.log(content);
  console.log(postId);

  const commentData = {
    postId: postId,
    comments: [],
  };

  try {
    const newComment = new CommentsModel(commentData);
    await newComment.save();
    console.log("Saved posts event to DB");
  } catch (err) {
    console.log(err);
  } 
};

const Startup = async () => {
  try {
    await mongoose.connect('mongodb://comment-mongo-service:27017/comments');
    console.log('Connected to MongoDB');

    const amqpConnection = await amqp.connect("amqp://rabbitmq-service:5672", "heartbeat=30");
    console.log("Comments connected to RabbitMQ");
    const channel = await amqpConnection.createChannel();
    await channel.assertExchange("posts-exchange", "topic", { durable: false });
    console.log("Exchange created");

    await channel.assertQueue("comments-posts-queue", { durable: false });
    await channel.bindQueue("comments-posts-queue", "posts-exchange", "posts.#");
    await channel.consume("comments-posts-queue", async (msg: { content: { toString: () => any; }; }) => {
      console.log("Processing message");
      await processPostsMessage(msg);
      await channel.ack(msg);
    }, { noAck: false });

  } catch (e) {
    console.log(e);
  }

  app.listen(5100, () => {
    console.log('Comments-Service listening on port 5100');
  });
};

Startup();