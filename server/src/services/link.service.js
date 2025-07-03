import { PrismaClient } from "@prisma/client";
import { generateUUID } from '../utils/uuid.js';

const prisma = new PrismaClient();
const LINK_TTL_HOURS = parseInt(process.env.ACCESS_LINK_EXPIRY_HOURS || '24', 10);

export async function createAccessLink(userId, paymentId, deviceIP) {
    const urlToken = generateUUID();
    const expiresAt = new Date(Date.now() + LINK_TTL_HOURS * 3600 * 1000);

    return prisma.accessLink.create({
        data: { urlToken, expiresAt, deviceIP, userId, paymentId }
    });
}

export async function expireAccessLink(linkId) {
    return prisma.accessLink.update({
        where: { id: linkId },
        data: { isUsed: true, expiresAt: new Date() }
    });
}


export async function cleanupExpiredLinks() {
    const now = new Date();
    return prisma.accessLink.updateMany({
        where: { expiresAt: { lt: now }, isUsed: false },
        data: { isUsed: true }
    });
}