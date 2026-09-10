/**
 * Strict live-only Socially.ng API adapter.
 * The token is read from the server environment and is never sent to the mobile client.
 */

export interface SociallyService {
  service: number | string;
  name: string;
  type: string;
  category: string;
  rate: number;
  min: number;
  max: number;
  refill: boolean;
  cancel: boolean;
  average_time?: string;
}

export interface CreateOrderParams {
  service: number | string;
  link: string;
  quantity: number;
}

export const TOKFUEL_MARKUP_PERCENT = 80;
export const TOKFUEL_MARKUP_MULTIPLIER = 1 + TOKFUEL_MARKUP_PERCENT / 100;

export function applyTokFuelMarkup(wholesaleTotal: number): number {
  return Number((wholesaleTotal * TOKFUEL_MARKUP_MULTIPLIER).toFixed(2));
}

export interface SociallyOrderResult {
  order_id: string;
  charge?: number;
  start_count?: number;
  status: string;
  remains?: number;
  currency?: string;
  link: string;
  quantity: number | string;
  service?: {
    name?: string;
    category?: string;
    refill?: boolean;
  };
  pricing?: {
    wholesaleTotal: number;
    markupPercent: number;
    customerTotal: number;
    currency: "NGN";
  };
  message?: string;
  createdAt: string;
}

function parseBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function parseNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export class SociallyApiClient {
  private readonly baseUrl = "https://socially.ng/api/v1";
  private readonly token: string | null;

  constructor(token?: string) {
    this.token = token || process.env.SOCIALLY_API_TOKEN || null;
  }

  public hasToken(): boolean {
    return Boolean(this.token && this.token.trim().length > 5);
  }

  public getTokenStatus() {
    return {
      configured: this.hasToken(),
      // Do not return the token, a prefix, or a masked token to the client.
      baseUrl: this.baseUrl,
      mode: this.hasToken() ? "live" : "not_configured",
    } as const;
  }

  private requireToken(): string {
    if (!this.hasToken()) {
      throw new Error("SOCIALLY_API_TOKEN is not configured");
    }
    return this.token as string;
  }

  private async postForm(action: string, fields: Record<string, string | number> = {}): Promise<unknown> {
    const form = new FormData();
    form.append("key", this.requireToken());
    form.append("action", action);
    Object.entries(fields).forEach(([key, value]) => form.append(key, String(value)));

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: form,
      signal: AbortSignal.timeout(15000),
    });

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(`Socially API returned HTTP ${response.status}`);
    }
    return body;
  }

  async getServices(): Promise<SociallyService[]> {
    const body = await this.postForm("services");
    if (!Array.isArray(body)) {
      throw new Error("Socially API returned an invalid services response");
    }

    return body
      .filter((item: any) => `${item?.category ?? ""} ${item?.name ?? ""}`.toLowerCase().includes("tiktok"))
      .map((item: any) => ({
        service: item.service,
        name: String(item.name ?? "TikTok service"),
        type: String(item.type ?? "default"),
        category: String(item.category ?? "TikTok services"),
        rate: parseNumber(item.rate),
        min: parseNumber(item.min),
        max: parseNumber(item.max),
        refill: parseBoolean(item.refill),
        cancel: parseBoolean(item.cancel),
        average_time: item.average_time ? String(item.average_time) : undefined,
      }));
  }

  async createOrder(params: CreateOrderParams): Promise<SociallyOrderResult> {
    const body = await this.postForm("add", {
      service: params.service,
      link: params.link,
      quantity: params.quantity,
    }) as any;

    const orderId = body?.order ?? body?.order_id;
    if (!orderId) {
      throw new Error("Socially API did not return an order ID");
    }

    return {
      order_id: String(orderId),
      charge: parseNumber(body?.charge),
      status: String(body?.status ?? "processing"),
      link: String(body?.link ?? params.link),
      quantity: body?.quantity ?? params.quantity,
      currency: "NGN",
      service: {
        name: body?.service_name ? String(body.service_name) : undefined,
        category: body?.category_name ? String(body.category_name) : undefined,
      },
      message: body?.message ? String(body.message) : undefined,
      createdAt: new Date().toISOString(),
    };
  }

  async getOrderStatus(orderId: string): Promise<SociallyOrderResult | null> {
    const body = await this.postForm("status", { order: orderId }) as any;
    if (!body || !body.status) return null;

    return {
      order_id: String(body.order_id ?? orderId),
      charge: parseNumber(body.charge),
      start_count: parseNumber(body.start_count),
      status: String(body.status),
      remains: parseNumber(body.remains),
      currency: String(body.currency ?? "NGN"),
      link: String(body.link ?? ""),
      quantity: body.quantity ?? 0,
      service: body.service,
      createdAt: new Date().toISOString(),
    };
  }

  async getRefillStatus(orderId: string): Promise<{ order: string; refill_status: string }> {
    const body = await this.postForm("refill_status", { order: orderId }) as any;
    return {
      order: String(body?.order ?? orderId),
      refill_status: String(body?.refill_status ?? "unknown"),
    };
  }

  async requestRefill(orderId: string): Promise<{ order: string; refill_status: string; message?: string }> {
    const body = await this.postForm("refill", { order: orderId }) as any;
    return {
      order: String(body?.order ?? orderId),
      refill_status: String(body?.refill_status ?? "processing"),
      message: body?.message ? String(body.message) : undefined,
    };
  }

  async getAccountBalance(): Promise<{ balance: number; currency: string; status: "connected" }> {
    const body = await this.postForm("balance") as any;
    return {
      balance: parseNumber(body?.balance),
      currency: String(body?.currency ?? "NGN"),
      status: "connected",
    };
  }
}

export const sociallyClient = new SociallyApiClient();
