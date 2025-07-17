import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Checks if an access link is invalid due to:
 *  - non-existence
 *  - already used
 *  - expired
 *  - IP mismatch
 * @param {string} urlToken  the one-time link token
 * @param {string} requestIP the incoming request IP
 * @returns {Promise<boolean>} true if invalid (should be rejected)
 */
export async function isLinkInvalid(urlToken, requestIP) {
  try {
    const link = await prisma.accessLink.findUnique({ where: { urlToken } });
    if (!link) return true;                      // no such link
    if (link.isUsed) return true;                // already consumed
    if (link.expiresAt <= new Date()) return true;// expired
    return link.deviceIP !== requestIP;          // IP mismatch
  } catch (err) {
    console.error('fraud.service.isLinkInvalid error:', err);
    // on DB error, treat as invalid
    return true;
  }
}

/**
 * Revokes an access link by marking it used and expiring it immediately.
 * @param {string} urlToken  the one-time link token
 * @returns {Promise<import('@prisma/client').AccessLink>}
 */
export async function revokeLink(urlToken) {
  return prisma.accessLink.update({
    where: { urlToken },
    data: { isUsed: true, expiresAt: new Date() }
  });
}
