
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET     = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

const OTP_TTL_MS       = (parseInt(process.env.OTP_TTL_MINUTES, 10) || 5) * 60 * 1000;
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5;


async function sendSms(phoneNumber, message) {
  // TODO: swap out console.log for your SMS‐gateway integration
  console.log(`Sending SMS to ${phoneNumber}: ${message}`);
}

async function generateAndSendOtp(phoneNumber) {
  const rawCode   = String(crypto.randomInt(100_000, 1_000_000));
  const codeHash  = await bcrypt.hash(rawCode, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.otp.create({
    data: { phoneNumber, codeHash, expiresAt }
  });

  await sendSms(phoneNumber, `Your verification code is ${rawCode}`);
}

async function validateOtpAndGetUser(phoneNumber, code) {
  const otp = await prisma.otp.findFirst({
    where: {
      phoneNumber,
      used: false,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!otp) {
    throw new Error('Invalid or expired code');
  }

  const isValid = await bcrypt.compare(code, otp.codeHash);
  if (!isValid) {
    const willExpire = otp.attempts + 1 >= OTP_MAX_ATTEMPTS;
    await prisma.otp.update({
      where: { id: otp.id },
      data: {
        attempts: { increment: 1 },
        used: willExpire
      }
    });
    throw new Error('Invalid code');
  }

  await prisma.otp.update({
    where: { id: otp.id },
    data: { used: true }
  });

  const user = await prisma.user.upsert({
    where: { phoneNumber },
    create: { phoneNumber },
    update: {}
  });

  return user;
}


export async function requestOtp(req, res, next) {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'phoneNumber is required' });
    }

    await generateAndSendOtp(phoneNumber);
    res.json({ message: 'If that number exists, an OTP has been sent.' });
  } catch (err) {
    next(err);
  }
}


export async function verifyOtpController(req, res, next) {
  try {
    const { phoneNumber, code } = req.body;
    if (!phoneNumber || !code) {
      return res
        .status(400)
        .json({ error: 'phoneNumber and code are required' });
    }

    const user = await validateOtpAndGetUser(phoneNumber, code);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    res.json({ token, user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
