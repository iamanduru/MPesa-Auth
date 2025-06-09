const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.accessLink.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.user.deleteMany();

  const phone     = process.env.SEED_PHONE     || '254712345678';
  const receipt   = process.env.SEED_RECEIPT   || 'SEED-RECEIPT-001';
  const amount    = process.env.SEED_AMOUNT    || '100.00';
  const deviceIP  = process.env.SEED_DEVICE_IP || '127.0.0.1';

  const user = await prisma.user.create({
    data: { phoneNumber: phone }
  });

  const payment = await prisma.payment.create({
    data: {
      mpesaReceipt: receipt,
      amount: new Prisma.Decimal(amount),
      phoneNumber: phone,
      status: 'SUCCESS',
      userId: user.id
    }
  });

  const link = await prisma.accessLink.create({
    data: {
      urlToken: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24h
      deviceIP,
      userId: user.id,
      paymentId: payment.id
    }
  });

  console.log({ user, payment, link });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
