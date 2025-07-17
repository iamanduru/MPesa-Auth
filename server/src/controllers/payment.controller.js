import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import {  stkPush, queryStkStatus } from '../services/mpesa.service.js';
import { error } from 'console';

const prisma = new PrismaClient();
const WP_API_BASE = process.env.WP_API_BASE;

const phoneSchema = Joi.object({
  phoneNumber: Joi.string().pattern(/^2547\d{8}$/).required()
});

//Initiate an STK Push using price fetched from wordPress
export async function initiatePayment(req, res, next) {
  try {
    const { phoneNumber } = await phoneSchema.validateAsync(req.body, { stripUnknown: true });

    //Extract slug from path
    const { slug } = req.params;
    if(!slug) return res.status(400).json({error: 'slug parameter is required!'});
    if(!WP_API_BASE) return res.status(500).json({ error: 'WP_API_BASE not configured!!'});

    //Fetch film data by slug from WordPress
    const wpUrl = `${WP_API_BASE}/posts?slug=${encodeURIComponent(slug)}`;
    const wpRes = await axios.get(wpUrl);
    const posts = wpRes.data;
    if(!Array.isArray(posts) || posts.length === 0) {
      return res.status(404).json({ error: 'Film not found in wordPress'});
    }
    const film = posts[0];

    //Extract price (Assuming price in ACF field)
    const amount = parseFloat(film.acf?.price);
    if(isNaN(amount)) {
      return res.status(500).json({ error: 'Invalid or missing price in WordPress data'});
    }
    const description = `Purchase: ${film.title?.rendered || slug}`;

    const user = await prisma.user.upsert({
      where: { phoneNumber },
      create: { phoneNumber },
      update: {}
    });

    //Trigger STK Push
    const { MerchantRequestID, CheckoutRequestID } = await stkPush(
      phoneNumber,
      amount,
      slug,
      description
    );

    await prisma.payment.create({
      data: {
        mpesaReceipt: CheckoutRequestID,
        amount,
        phoneNumber,
        status: 'PENDING',
        userId: user.id,
        filmId: slug
      }
    });

    res.status(202).json({
      message: 'STK Push initiated',
      merchantRequestID: MerchantRequestID,
      checkoutRequestID: CheckoutRequestID
    });
  } catch (error) {
    if (error.isJoi) return res.status(400).json({ error: error.message });
    next(error);
  }
}

//Query the status of an STK Push and return the access link if ready
export async function getPaymentStatus(req, res, next) {
  try {
    const { checkoutRequestID } =req.params;
    if(!checkoutRequestID) {
      return res.status(400).json({ error: 'checkoutRequestID is required'});
    }

    let payment = await prisma.payment.findUnique({ where: { mpesaReceipt: checkoutRequestID }});
    if (!payment ) {
      return res.status(404).json({ error: 'Payment not found'});
    }

    //If still pending, poll daraja and update
    if (payment.status === 'PENDING') {
      const statusResp = await queryStkStatus(checkoutRequestID);
      if (statusResp.ResultCode === 0) {
        payment = await prisma.payment.update({
          where: { mpesaReceipt: checkoutRequestID },
          data: { status: 'SUCCESS', paidAt: new Date() }
        });
      } else if (statusResp.ResultCode !== 1) {
        payment = await prisma.payment.update({
          where: { mpesaReceipt: checkoutRequestID },
          data: { status: 'FAILED' }
        });
      }
    }

    //Fetch associated one - time access link
    const accessLink = await prisma.accessLink.findUnique({
      where: { paymentId: payment.id }
    });

    return res.json({
      checkoutRequestID,
      status: payment.status,
      paidAt: payment.paidAt,
      accessLink: accessLink ? accessLink.urlToken : null
    });
  } catch (error) {
    next(error);
  }
}