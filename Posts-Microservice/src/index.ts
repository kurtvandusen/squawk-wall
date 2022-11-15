import express from 'express';
import mongoose from 'mongoose';

import { router } from './routes/routes';

const app = express();
app.use(express.json());
app.use(router);

const Startup = async () => {
  try {
    await mongoose.connect('mongodb://posts-mongodb-service:27017/post');
    console.log('Connected to MongoDB');
  } catch (e) {
    console.log(e);
  }

  app.listen(5000, () => {
    console.log('Posts-Microservice listening on port 5000');
  });
};

Startup();