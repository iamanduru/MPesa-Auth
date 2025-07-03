import { PrismaClient } from "@prisma/client";

const prismaFraud = new PrismaClient();

export async function isIpMismatch(linkId, requestIP) {
    const link = await prismaFraud.accessLink.findUnique({
        where: { id: linkId }
    });
    if(!link) return true;
    return link.deviceIP !== requestIP;
}

export async function revikeLink(linkId) {
    return prismaFraud.accessLink.update({
        where: { id: linkId },
        data: { isUsed: true }
    });
}