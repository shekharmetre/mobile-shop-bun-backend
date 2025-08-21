import jwt from 'jsonwebtoken';
import crypto from "crypto";

export function getRouteFromReferer(referer?: string): string {
  if (!referer) return '/';
  console.log(referer)
  try {
    const url = new URL(referer);
    return url.pathname || '/';
  } catch (err) {
    console.error('Invalid referer:', referer);
    return '/';
  }
}



const SUPABASE_JWT_SECRET = process.env.JWT_SECRET!;

export function verifySupabaseToken(token: string) {
  if (!token) {
    return { error: 'Invalid token' };
  }
  try {
    const decoded = jwt.verify(token, SUPABASE_JWT_SECRET);
    return { user: decoded }; // user.sub will be the user ID
  } catch (err) {
    return { error: 'Invalid token' };
  }
}


export const generatePaymentToken = (txnid: string) => {
  return jwt.sign({ txnid }, SUPABASE_JWT_SECRET, { expiresIn: '30m' }); // or '5s'
};

export const verifyPaymentToken = (token: string) => {
  return jwt.verify(token, SUPABASE_JWT_SECRET) as { txnid: string };
};

export function getNumericTransactionId(orderKey: string | number): string {
  const now = Date.now(); // gives a 13-digit timestamp
  const key = typeof orderKey === 'string'
    ? orderKey.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    : Number(orderKey);

  const id = `${key}${now}`.slice(-8); // take last 8 digits
  return `txn_${id}`;
}

// Generate a stable per-instance salt once (process lifetime)
const INSTANCE_SALT = (() => {
  // 8 bytes random salt; keep in memory, or read from env for deterministic instances
  return Buffer.from(crypto.getRandomValues(new Uint8Array(8))).toString('hex');
})();


// Fast non-crypto hash to 32-bit
function hash32(input: string): number {
  const hash = crypto.createHash('md5').update(input).digest(); // 16 bytes
  // Take first 4 bytes as unsigned 32-bit
  return hash.readUInt32BE(0);
}

// 7-digit ID generator, stateless
export function getShort7Stateless(): number {
  const now = Date.now();

  // Use second granularity for higher entropy under load
  const sec = Math.floor(now / 1000); // seconds since epoch

  // High-res jitter to reduce same-second collisions on hot paths
  const hr = process.hrtime.bigint() & 0xffffn; // 16 bits of variation per call

  // Optional: include request-specific entropy if available (e.g., userId, ip)
  // For pure function, omit external data
  const payload = `${sec}-${hr.toString(16)}-${INSTANCE_SALT}`;

  const h = hash32(payload);
  const id = h % 10_000_000; // 0..9,999,999
  return id;
}






type ValidateInput = {
  items?: Array<unknown>;
  device?: unknown;
  amountToPay?: number | null;
  balanceAmount?: number | null;
  location?: unknown;
  email?: string | null;
};

type ValidateResult =
  | { ok: true }
  | { ok: false; missing: string[]; message: string };

export function validateOrderPayload(input: ValidateInput): ValidateResult {
  const { items, device, amountToPay, balanceAmount, location, email } = input;

  const missing: string[] = [];

  // 1) Presence: either items OR device must exist
  const hasItems = Array.isArray(items) && items.length > 0;
  const hasDevice = !!device;

  if (!hasItems && !hasDevice) {
    missing.push("device_or_items");
  }

  // 2) Common required fields
  if (!location) missing.push("location");
  if (!email) missing.push("email");

  // 3) Pricing rules
  // totalPrice is required for both flows
  if (amountToPay === undefined || amountToPay === null) {
    missing.push("amountToPay");
  } else {
    // If items flow (accessories), balanceAmount is required
    if (hasItems && (balanceAmount === undefined || balanceAmount === null)) {
      missing.push("balanceAmount");
    }
    // If repair flow (device), balanceAmount can be optional.
    // If you want it required for repairs too, uncomment:
    // if (hasDevice && (balanceAmount === undefined || balanceAmount === null)) {
    //   missing.push("balanceAmount");
    // }
  }

  if (missing.length) {
    // Friendly message
    let message = `Missing required field(s): ${missing.join(", ")}`;
    if (missing.includes("device_or_items")) {
      message =
        "Please select a device (repair) or add at least one item (accessory).";
    }
    // If you want to clarify repairs balanceAmount optionality, you can append here:
    // if (missing.includes("balanceAmount") && hasDevice) {
    //   message += " (balanceAmount is optional for repairs)";
    // }

    return { ok: false, missing, message };
  }

  return { ok: true };
}


type Primitive = string | number | boolean | null | undefined;
type Signable = Primitive | Record<string, unknown> | unknown[];

// 1) Stable stringify (sorts keys so order doesn't affect the signature)
function stableStringify(value: Signable): string {
  const seen = new WeakSet();
  const sort = (v: any): any => {
    if (v === null || typeof v !== "object") return v;
    if (seen.has(v)) return v; // prevent cycles
    seen.add(v);
    if (Array.isArray(v)) return v.map(sort);
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v).sort()) out[k] = sort(v[k]);
    return out;
  };
  return JSON.stringify(sort(value));
}

// 2) HMAC secret (set in env; never expose to clients)
const SIGNING_SECRET = process.env.SIGNING_SECRET || "replace-with-strong-secret";

// 3) Build a stable base string from email + data
function makePayload(email: string, data: Signable): string {
  return `${email.toLowerCase()}|${stableStringify(data)}`;
}

// 4) Create a short 10-char signature
export function createShortSignature(email: string, data: Signable, length = 10): string {
  const payload = makePayload(email, data);
  return crypto.createHmac("sha256", SIGNING_SECRET).update(payload).digest("hex").slice(0, length);
}

// 5) Verify a provided signature matches email + data
export function verifyShortSignature(email: string, data: Signable, signature: string, length = 10): boolean {
  const expected = createShortSignature(email, data, length);
  // constant-time comparison
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function verifyDuplicate(
  secondFromEnd: string[],
  email: string,
  device: unknown | null | undefined,
  items: unknown | null | undefined,
  length = 10
): boolean {
  const payload = { data: device ?? items };
  for (const sig of secondFromEnd) {
    if (typeof sig !== "string") continue;
    if (verifyShortSignature(email, payload, sig, length)) {
      return true; // found a match, stop and return true
    }
  }
  return false; // no matches found
}
