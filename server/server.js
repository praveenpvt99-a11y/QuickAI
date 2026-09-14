import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express';
import aiRouter from './routes/aiRoutes.js';
import connectCloudinary from './configs/cloudinary.js';
import userRouter from './routes/userRoutes.js';

const app = express();

// Initialize Cloudinary connection once
connectCloudinary();

// Configure CORS to accept requests properly
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());
app.use(clerkMiddleware());

// Health Check Route
app.get('/', (req, res) => {
  res.send('Server is Live!');
});

// Routes
app.use('/api/ai', aiRouter);
app.use('/api/user', userRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;