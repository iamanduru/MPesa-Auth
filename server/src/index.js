import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import authRouter from './routes/auth.routes.js';
import paymentRouter from './routes/payment.route.js';
import webhookRouter from './routes/webhook.routes.js'
import { authenticateJWT, verifyAccessLink } from './middleware/auth.middleware.js.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());                
app.use(cors());                  
app.use(morgan('combined'));    
app.use(express.json());         

app.use('/auth', authRouter);
app.use('/payment', authenticateJWT, paymentRouter);
app.use('/webhook', webhookRouter);



app.get('/', (_req, res) => {
  res.send('Film-Streaming M-Pesa Auth API is up and running');
});


app.get('/stream', verifyAccessLink, (req, res) => {
  const { filmId } = req.query;
  if (!filmId) {
    return res.status(400).json({ error: 'filmId query parameter is required' });
  }

  const filePath = `/path/to/films/${filmId}.mp4`;
  res.sendFile(filePath, err => {
    if (err) {
      console.error('Streaming error:', err);
      res.status(500).end();
    } else {
      // Optionally mark the access link as used here:
      // prisma.accessLink.update({
      //   where: { id: req.accessLink.id },
      //   data: { isUsed: true }
      // }).catch(console.error);
    }
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(` Server listening on http://localhost:${PORT}`);
});
