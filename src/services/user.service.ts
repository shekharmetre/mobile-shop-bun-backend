// src/services/payment.service.ts
import crypto from "crypto";

export type PayUEnv = {
  merchantKey: string;
  salt: string;
  backendUrl?: string;  // optional, in case you want default URLs from env
  frontendUrl?: string; // optional
};

export type PayURequest = {
  // Required fields to compute hash and payload
  txnid: string;
  amount: number | string;    // will be normalized to "x.xx"
  productinfo: string;        // keep consistent across hash & payload
  firstname: string;
  email: string;
  phone?: string;             // default fallback applied if missing
  surl: string;               // success URL
  furl: string;               // failure URL
};

export type PayUPaymentParams = {
  key: string;
  txnid: string;
  amount: string;     // normalized "x.xx"
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  hash: string;
};

export type PayUResult =
  | { ok: true; paymentParams: PayUPaymentParams }
  | { ok: false; message: string; field?: string };

export class PaymentService {
  constructor(private env: PayUEnv) {}

  // Quick field validator with precise errors
  private validateProps(req: PayURequest): PayUResult | null {
    if (!this.env.merchantKey) return { ok: false, message: "Merchant key missing", field: "merchantKey" };
    if (!this.env.salt) return { ok: false, message: "PayU salt missing", field: "salt" };

    if (!req || typeof req !== "object") return { ok: false, message: "Invalid request payload" };

    if (!req.txnid || typeof req.txnid !== "string") {
      return { ok: false, message: "Invalid txnid", field: "txnid" };
    }

    if (req.amount === null || req.amount === undefined || req.amount === "" as any) {
      return { ok: false, message: "Amount is required", field: "amount" };
    }

    const amountNum = typeof req.amount === "string" ? Number(req.amount) : req.amount;
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      return { ok: false, message: "Amount must be a positive number", field: "amount" };
    }

    if (!req.productinfo || typeof req.productinfo !== "string") {
      return { ok: false, message: "Invalid productinfo", field: "productinfo" };
    }

    if (!req.firstname || typeof req.firstname !== "string") {
      return { ok: false, message: "Invalid firstname", field: "firstname" };
    }

    if (!req.email || typeof req.email !== "string") {
      return { ok: false, message: "Invalid email", field: "email" };
    }

    if (!req.surl || typeof req.surl !== "string") {
      return { ok: false, message: "Invalid surl", field: "surl" };
    }

    if (!req.furl || typeof req.furl !== "string") {
      return { ok: false, message: "Invalid furl", field: "furl" };
    }

    return null; // no validation errors
  }

  // Build PayU payment params + hash. Returns either error or ready-to-post params.
  buildPayUPayment(req: PayURequest): PayUResult {
    const validationError = this.validateProps(req);
    if (validationError) return validationError;

    // Normalize
    const amountStr = (typeof req.amount === "string" ? Number(req.amount) : req.amount).toFixed(2);
    const emailStr = req.email.trim().toLowerCase();
    const firstname = req.firstname.trim();
    const productinfo = req.productinfo; // keep as-is; caller controls format
    const phone = (req.phone && String(req.phone)) || "9999999999";
    const txnid = req.txnid.trim();
    const surl = req.surl.trim();
    const furl = req.furl.trim();

    // Compute hash: key|txnid|amount|productinfo|firstname|email|||||||||||salt
    const raw = `${this.env.merchantKey}|${txnid}|${amountStr}|${productinfo}|${firstname}|${emailStr}|||||||||||${this.env.salt}`;
    const hash = crypto.createHash("sha512").update(raw).digest("hex");

    const paymentParams: PayUPaymentParams = {
      key: this.env.merchantKey,
      txnid,
      amount: amountStr,
      productinfo,
      firstname,
      email: emailStr,
      phone,
      surl,
      furl,
      hash,
    };

    return { ok: true, paymentParams };
  }
}
