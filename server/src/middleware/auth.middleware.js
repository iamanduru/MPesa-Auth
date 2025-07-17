
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export async function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error('JWT auth error:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}



export async function verifyAccessLink(req, res, next) {
  const token =
    req.query.token?.toString() ||
    req.headers['x-access-token']?.toString();

  if (!token) {
    return res.status(401).json({ error: 'Access token is required' });
  }

  try {
    const link = await prisma.accessLink.findUnique({
      where: { urlToken: token }
    });
    if (!link) {
      return res.status(401).json({ error: 'Invalid access token' });
    }
    if (link.expiresAt < new Date()) {
      return res.status(403).json({ error: 'Access link has expired' });
    }
    if (link.isUsed) {
      return res.status(403).json({ error: 'Access link already used' });
    }
    const requestIP = req.ip;
    if (link.deviceIP !== requestIP) {
      return res.status(403).json({ error: 'IP address mismatch' });
    }

    req.accessLink = link;
    req.user = await prisma.user.findUnique({ where: { id: link.userId } });

    next();
  } catch (err) {
    console.error('AccessLink auth error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
