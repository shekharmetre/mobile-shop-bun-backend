// src/controllers/payment.controller.ts
import crypto from "crypto";
import { db } from "../config/database";
import { ApiResponse } from "../utils/apiResponse";
import { safeQuery } from "../utils/safequery";
import { createShortSignature, generatePaymentToken, getShort7Stateless, validateOrderPayload, verifyPaymentToken, verifyShortSignature } from "../utils/helper"; // keep if you already have it
import type { AuthUser } from "..";
import { paymentService } from "@/services";
import { PaymentStatus } from "../../types/user.type";


const MERCHANT_KEY = process.env.PAY_U_PUBLIC_MERCHANT_KEY || process.env.PAYU_MERCHANT_KEY || "";
const PAYU_SALT = process.env.NEXT_PUBLIC_SALT || process.env.PAYU_SALT || "";

export class PaymentController {
  // ...existing code...
  public async initPayment(body: any, set: any, store: { user?: AuthUser }) {
    const { items, amountToPay, balanceAmount, location, category, delivery, device, orderDate = new Date().toISOString() } = body;
    const email = store?.user?.email;

    console.log(items, amountToPay, balanceAmount, location, category, delivery, device, orderDate, "fetch from frontend data");

    if (!email) {
      return ApiResponse.error("You're not verified please refersh and try again", 400);
    }

    const result = validateOrderPayload({
      items,
      device,
      amountToPay,
      balanceAmount,
      location,
      email,
    });

    if (!result.ok) {
      set.status = 400;
      return ApiResponse.error(result.message, 400);
    }

    // Lookup user + active orders (not filtering by txnStatus here so we can check later)
    const user = await safeQuery(() =>
      db.user.findUnique({
        where: { email },
        select: {
          id: true,
          firstName: true,
          email: true,
          phone: true,
          orders: {
            where: {
              orderFlow: { not: "completed" },
            },
            orderBy: { createdAt: "desc" },
            select: {
              signature: true,
              txnId: true,
            },
          },
        }
      })
    );
    console.log(user, "why snkdf");

    if (!user?.email) {
      set.status = 404;
      return ApiResponse.error("User not found", 404);
    }

    const payload = { data: device ?? items };

    type ActiveOrder = { signature: string | null; txnId: string | null };
    const activeOrders: ActiveOrder[] = Array.isArray(user.orders) ? user.orders : [];

    function findDuplicateOrder(
      orders: ActiveOrder[],
      email: string,
      payload: any,
      length = 10
    ): { signature: string; txnId: string } | null {
      for (const o of orders) {
        const sig = o?.signature || '';
        if (typeof sig !== 'string' || sig.length === 0) continue;
        if (verifyShortSignature(email, payload, sig, length)) {
          const txnId = o?.txnId || '';
          return { signature: sig, txnId };
        }
      }
      return null;
    }

    const duplicateFound = findDuplicateOrder(activeOrders, email, payload);

    // Reusable vars for downstream payment
    let order: { id: string; txnId: string } | any;
    let signature: string | any;
    let txnids: string | any;

    if (duplicateFound) {
      console.log("yes duplicate found", duplicateFound);

      if (category === "repair") {
        set.status = 200;
        return ApiResponse.success({
          message: "Repair order already booked. Please review it on Orders.",
        }, 200);
      }

      // Accessory: fetch the order by its txnId and check txnStatus
      const foundOrder = await db.order.findUnique({
        where: { txnId: duplicateFound.txnId },
        select: { id: true, txnId: true, signature: true, txnStatus: true },
      });

      if (!foundOrder) {
        set.status = 404;
        return ApiResponse.error("Order not found", 404);
      }

      console.log("Found order:", foundOrder);

      if (foundOrder.txnStatus === "success") {
        set.status = 200;
        console.log("Order already processed", foundOrder);
        return ApiResponse.error("Order already processed. Please check order status.", 404);
      }

      // Reuse existing txnId/signature for payment
      txnids = foundOrder.txnId;
      signature = foundOrder.signature || duplicateFound.signature;

      // Use this order for response IDs (no new order creation)
      order = { id: foundOrder.id, txnId: foundOrder.txnId };
    } else {
      // Fresh: create signature + txnId, then create order
      const newSignature = createShortSignature(email, { data: device ? device : items });
      const newTxnId = `${user.email}-${amountToPay}-${getShort7Stateless()}`;

      function parseAmount(v: string | null | undefined): number | null {
        if (v == null) return null;
        const n = Number(String(v).trim());
        return Number.isFinite(n) ? Math.max(0, Math.round(n * 100) / 100) : null;
      }


      function paymentSelection(amountToPay: string, balanceAmount: string): PaymentStatus {
        const pay = parseAmount(amountToPay);
        const bal = parseAmount(balanceAmount);

        // If parsing failed or missing balance, be conservative
        if (pay == null || bal == null) return "cash_on_delivery";

        // No payment now
        if (pay <= 0) return "cash_on_delivery";

        // Compare with a tiny epsilon to avoid float issues
        const epsilon = 0.01;
        if (pay + epsilon >= bal) return "full_payment";

        return "advanced";
      }


      const created = await db.order.create({
        data: {
          userId: user.id,
          category,
          txnId: newTxnId,
          txnStatus: "processing",
          orderFlow: "in_progress",
          device: device ?? undefined,
          items: items ?? undefined,
          totalPrice: JSON.stringify(balanceAmount),
          payment: paymentSelection(amountToPay, balanceAmount),
          location,
          delivery,
          orderDate,
          signature: newSignature
        },
        select: { id: true, txnId: true }
      });

      if (!created) {
        return ApiResponse.error("something wrong to creating Order please try again", 200);
      }

      console.log("New order created:", created);

      order = created;
      signature = newSignature;
      txnids = newTxnId;
    }

    if (category === "repair") {
      set.status = 200;
      return ApiResponse.success({
        message: "Repair order booked successfully.",
        orderId: order!.id,
        txnId: order!.txnId
      }, 200);
    }

    // Accessory: Return payment payload to proceed
    try {
      if (!MERCHANT_KEY || !PAYU_SALT) {
        set.status = 200;
        return ApiResponse.success({
          orderId: order!.id,
          txnId: order!.txnId,
          gateway: "none",
          message: "Payment gateway not configured; order created (e.g., COD)."
        }, 200);
      }

      const txnid = txnids!;
      const amount = amountToPay; // demo amount; replace with totalPrice if needed
      const productinfo = signature!;
      const firstname = user.firstName || "GUEST";
      const emailStr = user.email || "guest@example.com";
      const phone = user.phone || "9999999999";
      const token = generatePaymentToken(order!.txnId);

      const resultPay = paymentService.buildPayUPayment({
        txnid,
        amount,
        productinfo,
        firstname,
        email: emailStr,
        phone,
        surl: `${process.env.NEXT_PUBLIC_BASE_URL}/user/payment/success?token=${token}`,
        furl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/fail`,
      });

      if (!resultPay.ok) {
        set.status = 400;
        return ApiResponse.error(`Payment param error: ${resultPay.message}`);
      }

      set.status = 200;
      return ApiResponse.success({
        orderId: order!.id,
        txnId: txnid,
        paymentParams: resultPay.paymentParams,
      });
    } catch (err) {
      console.error("Accessory payment build failed:", err);
      set.status = 500;
      return ApiResponse.error("Failed to prepare payment. Please try again.");
    }
  }

  // ...existing code...
  async paymentSuccess(body: any, set: any, token: string) {
    try {
      if (!token) {
        set.status = 400;
        return ApiResponse.error("Token is missing. Something went wrong.");
      }

      const verifiedToken = verifyPaymentToken(token);
      if (!verifiedToken) {
        set.status = 401;
        return ApiResponse.error(
          "Token verification failed. If your account was debited, we'll verify and contact you via email or SMS shortly."
        );
      }
      if (!verifiedToken.txnid) {
        set.status = 400;
        return ApiResponse.error("Invalid transaction data from PayU.");
      }

      const updatedOrder = await db.order.update({
        where: { txnId: verifiedToken.txnid },
        data: { txnStatus: "success", orderFlow: "shipping_soon" },
      });

      if (!updatedOrder) {
        set.status = 400;
        return ApiResponse.error("Failed to update order status.", 404);
      }

      return new Response(null, {
        status: 302,
        headers: {
          Location: `${process.env.FRONTEND_URL}/payment/success?token=${token}`,
        },
      });
    } catch (error: any) {
      console.error("❌ Payment Success Error:", error);
      set.status = 500;
      return ApiResponse.error("Something went wrong while confirming your payment. We're working on it.");
    }
  }

  /**
   * Dummy generator for testing PayU form submit in FE
   */
  public async dummyOne(set: any) {
    const txnid = `dummy_txn_${Date.now()}`;
    const amount = 1; // number is fine; service normalizes to "1.00"
    const productinfo = JSON.stringify([{ name: "Test Product", qty: 1 }]);
    const firstname = "DummyUser";
    const email = "dummy@example.com";
    const phone = "9999999999";

    const result = paymentService.buildPayUPayment({
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone,
      surl: `${process.env.NEXT_PUBLIC_BASE_URL}/user/payment/success`,
      furl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/fail`,
    });

    if (!result.ok) {
      set.status = 400;
      return ApiResponse.error(`Payment param error: ${result.message}`);
    }

    set.status = 200;
    return ApiResponse.success({
      orderId: "dummy",
      txnId: txnid,
      paymentParams: result.paymentParams,
    });
  }

}
