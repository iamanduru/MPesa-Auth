import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';                // ← import Node’s path module
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import paymentRouter from './routes/payment.route.js';
import webhookRouter from './routes/webhook.routes.js';
import { verifyAccessLink } from './middleware/auth.middleware.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(cookieParser());

// Serve your frontend from /public
app.use(express.static(path.join(process.cwd(), 'public')));

// Swagger/OpenAPI setup
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FilmStream M-Pesa Auth API',
      version: '1.0.0',
      description: 'Authentication, payment and streaming endpoints',
    },
    servers: [
      { url: `http://localhost:${PORT}` }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
});

// Serve Swagger UI at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Application routes
app.use('/payment', paymentRouter);
app.use('/webhook', webhookRouter);

// Health check
app.get('/', (_req, res) => {
  res.send('Film-Streaming M-Pesa Auth API is up and running');
});

/**
 * @swagger
 * /stream:
 *   get:
 *     summary: Stream a film (authenticated + valid access link)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filmId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: MP4 chunk stream
 *       '400':
 *         description: Missing filmId
 *       '401':
 *         description: Unauthorized or invalid access link
 */
app.get('/stream', verifyAccessLink, (req, res) => {
  const { filmId } = req.query;
  if (!filmId) return res.status(400).json({ error: 'filmId query parameter is required' });

  const filePath = `/path/to/films/${filmId}.mp4`;
  res.sendFile(filePath, err => {
    if (err) {
      console.error('Streaming error:', err);
      res.status(500).end();
    }
  });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
