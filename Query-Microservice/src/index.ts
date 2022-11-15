import express from 'express';
import mongoose from 'mongoose';
const amqp = require("amqplib");
import QueryModel from './models/query';

import { router } from './routes/routes';

const app = express();
app.use(express.json());
app.use(router);

async function processCommentMessage(msg: { content: { toString: () => any; }; }) {
  const content = JSON.parse(msg.content.toString());
  const { comment, commentId, postId } = content;
  console.log(comment, commentId, postId);
  const commentData = { comment: comment, commentId: commentId};
  await mongoose.model('Query').updateOne({ postId: postId }, { $push: { comments: commentData } });
  console.log("Saved comment to DB");
};


async function processPostMessage(msg: { content: { toString: () => any; }; }) {
  const content = JSON.parse(msg.content.toString());
  const { post, postId } = content;
  console.log(post, postId);

  const queryData = {
    post: post,
    postId: postId,
    comments: []
  };
  
  try {
    const newQuery = new QueryModel(queryData);
    await newQuery.save();
    console.log("Saved post event to DB");
  } catch (err) {
    console.log(err);
  } 
};

const Startup = async () => {
  try {
    await mongoose.connect('mongodb://query-mongodb-service:27017/query');
    console.log('Connected to MongoDB');

    const amqpConnection = await amqp.connect("amqp://rabbitmq-service:5672", "heartbeat=30");
    console.log("Comments connected to RabbitMQ");
    const channel = await amqpConnection.createChannel();
    await channel.assertExchange("post-exchange", "topic", { durable: false });
    console.log("Exchange created");

    await channel.assertQueue("query-comment-queue", { durable: false });
    await channel.bindQueue("query-comment-queue", "post-exchange", "comment.#");
    await channel.consume("query-comment-queue", async (msg: { content: { toString: () => any; }; }) => {
      console.log("Processing message");
      await processCommentMessage(msg);
      await channel.ack(msg);
    }, { noAck: false });

    await channel.assertQueue("query-post-queue", { durable: false });
    await channel.bindQueue("query-post-queue", "post-exchange", "post.#");
    await channel.consume("query-post-queue", async (msg: { content: { toString: () => any; }; }) => {
      console.log("Processing message");
      await processPostMessage(msg);
      await channel.ack(msg);
    }, { noAck: false });


  } catch (e) {
    console.log(e);
  }

  app.listen(5200, () => {
    console.log('Query-Service listening on port 5200');
  });
};

Startup();