import express from 'express';
import dotenv from 'dotenv';
import {connectDB} from './utils/features.js';
import { errorMiddler } from './middlewares/error.js';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/user.routes.js';
import chatRoutes from './routes/chat.routes.js'
import { createUser } from './seeders/user.seed.js';

dotenv.config({
  path:'./.env',
});

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

connectDB(MONGO_URI);
// createUser(10);



app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended: true}));

app.use('/user', userRoutes);
app.use('/chat', chatRoutes)
app.use(errorMiddler);

app.get('/', (req, res) => {
  res.send('Hello World!');
});


app.listen(PORT, () => {
  console.log(`Server is running http://localhost:${PORT}`);
})

