import { PaymentService } from "./user.service";
export const paymentService = new PaymentService({
  merchantKey: process.env.PAY_U_PUBLIC_MERCHANT_KEY || process.env.PAYU_MERCHANT_KEY || "",
  salt: process.env.NEXT_PUBLIC_SALT || process.env.PAYU_SALT || "",
  backendUrl: process.env.NEXT_PUBLIC_BASE_URL,
  frontendUrl: process.env.FRONTEND_URL,
});
