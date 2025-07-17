import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const TTL_HOURS = parseInt(process.env.ACCESS_LINK_EXPIRY_HOURS ?? '24', 10);

/**
 * Creates a one-time access link for a successful payment and film.
 * @param {string} userId
 * @param {string} paymentId
 * @param {string} filmId
 * @param {string} deviceIP
 * @returns {Promise<import('@prisma/client').AccessLink>}
 */
export async function createAccessLink(userId, paymentId, filmId, deviceIP) {
  const urlToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + TTL_HOURS * 60 * 60 * 1000);

  return prisma.accessLink.create({
    data: { urlToken, expiresAt, deviceIP, userId, paymentId, filmId }
  });
}

/**
 * Retrieves an active, unused access link by its URL token.
 * @param {string} urlToken
 * @returns {Promise<import('@prisma/client').AccessLink|null>}
 */
export async function getAccessLink(urlToken) {
  return prisma.accessLink.findFirst({
    where: {
      urlToken,
      isUsed: false,
      expiresAt: { gt: new Date() }
    }
  });
}

/**
 * Validates that the link exists, is unused, not expired, and matches the requesting IP.
 * Marks the link as used on success.
 * @param {string} urlToken
 * @param {string} requestIP
 * @throws {Error} if the link is invalid, expired, used, or IP mismatch
 * @returns {Promise<import('@prisma/client').AccessLink>}
 */
export async function validateAccessLink(urlToken, requestIP) {
  const link = await prisma.accessLink.findUnique({ where: { urlToken } });
  if (!link) {
    throw new Error('Access link not found');
  }
  if (link.isUsed || link.expiresAt < new Date()) {
    throw new Error('Access link expired or already used');
  }
  if (link.deviceIP !== requestIP) {
    throw new Error('IP address mismatch');
  }

  // Mark as used
  await prisma.accessLink.update({
    where: { urlToken },
    data: { isUsed: true }
  });
  return link;
}

/**
 * Immediately revokes a link so it can no longer be used.
 * @param {string} urlToken
 * @returns {Promise<import('@prisma/client').AccessLink>}
 */
export async function revokeAccessLink(urlToken) {
  return prisma.accessLink.update({
    where: { urlToken },
    data: { isUsed: true, expiresAt: new Date() }
  });
}

/**
 * Marks all non-used links that have expired as used, cleaning up stale tokens.
 * @returns {Promise<import('@prisma/client').Prisma.BatchPayload>}
 */
export async function cleanupExpiredLinks() {
  const now = new Date();
  return prisma.accessLink.updateMany({
    where: { expiresAt: { lt: now }, isUsed: false },
    data: { isUsed: true }
  });
}
