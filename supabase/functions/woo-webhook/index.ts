// PTP WooCommerce Webhook Handler
// Supabase Edge Function
// Deploy: supabase functions deploy woo-webhook --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

// Types
interface WooLineItem {
  id: number;
  name: string;
  product_id: number;
  quantity: number;
  price: string;
  meta_data: Array<{ key: string; value: string }>;
}

interface WooOrder {
  id: number;
  status: string;
  total: string;
  currency: string;
  date_created: string;
  date_modified: string;
  billing: {
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
  line_items: WooLineItem[];
  meta_data: Array<{ key: string; value: string }>;
}

// Map WooCommerce status to our status
function mapOrderStatus(wooStatus: string): string {
  const statusMap: Record<string, string> = {
    pending: "pending",
    processing: "processing",
    "on-hold": "pending",
    completed: "completed",
    cancelled: "cancelled",
    refunded: "refunded",
    failed: "failed",
  };
  return statusMap[wooStatus] || "pending";
}

// Map order status to enrollment status
function mapEnrollmentStatus(orderStatus: string): string {
  const statusMap: Record<string, string> = {
    pending: "pending",
    processing: "active",
    completed: "active",
    cancelled: "cancelled",
    refunded: "refunded",
    failed: "cancelled",
  };
  return statusMap[orderStatus] || "pending";
}

// Verify WooCommerce webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = createHmac("sha256", secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest("base64");
  return signature === expectedSignature;
}

// Extract meta value from WooCommerce meta_data array
function getMetaValue(
  metaData: Array<{ key: string; value: string }>,
  key: string
): string | null {
  const item = metaData.find((m) => m.key === key);
  return item?.value || null;
}

// Parse child IDs from order meta (supports JSON array or comma-separated)
function parseChildIds(value: string | null): string[] {
  if (!value) return [];

  // Try JSON parse first
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
    return [parsed];
  } catch {
    // Fall back to comma-separated
    return value.split(",").map((id) => id.trim()).filter(Boolean);
  }
}

// Map WooCommerce product meta to program type
function mapProgramType(productMeta: Array<{ key: string; value: string }>): string {
  // Check product meta for program type indicators
  const campDate = getMetaValue(productMeta, "_camp_date");
  const title = getMetaValue(productMeta, "_title") || "";

  // Heuristic: Summer camps are multi-day, Winter clinics are single day
  // You can adjust this logic based on your actual product setup
  if (title.toLowerCase().includes("summer") || title.toLowerCase().includes("camp")) {
    return "summer_camp";
  }
  return "winter_clinic";
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-wc-webhook-signature, x-wc-webhook-topic",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const webhookSecret = Deno.env.get("WOO_WEBHOOK_SECRET");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    // Get the raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get("x-wc-webhook-signature") || "";
    const topic = req.headers.get("x-wc-webhook-topic") || "";

    // Verify webhook signature (skip in development if secret not set)
    if (webhookSecret) {
      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.error("Webhook signature verification failed");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.warn("WOO_WEBHOOK_SECRET not set - signature verification skipped");
    }

    // Parse the order data
    const order: WooOrder = JSON.parse(rawBody);

    // Log topic for debugging (never log sensitive data)
    console.log(`Processing webhook: topic=${topic}, order_id=${order.id}, status=${order.status}`);

    // Initialize Supabase client with service role (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract child IDs from order meta
    const childIdsRaw = getMetaValue(order.meta_data, "_ptp_child_ids");
    const childIds = parseChildIds(childIdsRaw);

    // Find parent by email
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", order.billing.email.toLowerCase())
      .limit(1);

    const parentId = profiles?.[0]?.id || null;

    // If no explicit child IDs and parent has exactly 1 child, auto-assign (Phase 1 MVP)
    let resolvedChildIds = childIds;
    if (resolvedChildIds.length === 0 && parentId) {
      const { data: children } = await supabase
        .from("children")
        .select("id")
        .eq("parent_id", parentId);

      if (children?.length === 1) {
        resolvedChildIds = [children[0].id];
        console.log(`Auto-assigned single child: ${resolvedChildIds[0]}`);
      }
    }

    // Upsert the order
    const orderData = {
      woo_order_id: order.id,
      parent_id: parentId,
      status: mapOrderStatus(order.status),
      total_cents: Math.round(parseFloat(order.total) * 100),
      currency: order.currency,
      billing_email: order.billing.email.toLowerCase(),
      billing_name: `${order.billing.first_name} ${order.billing.last_name}`.trim(),
      billing_phone: order.billing.phone,
      child_ids: resolvedChildIds,
      woo_created_at: order.date_created,
      woo_updated_at: order.date_modified,
      raw_webhook_data: order,
    };

    const { data: upsertedOrder, error: orderError } = await supabase
      .from("orders")
      .upsert(orderData, { onConflict: "woo_order_id" })
      .select()
      .single();

    if (orderError) {
      console.error("Order upsert error:", orderError.message);
      throw new Error(`Failed to upsert order: ${orderError.message}`);
    }

    console.log(`Order upserted: ${upsertedOrder.id}`);

    // Process each line item
    const enrollmentResults = [];

    for (const item of order.line_items) {
      // Upsert/ensure the event exists
      const eventData = {
        woo_product_id: item.product_id,
        title: item.name,
        program: "winter_clinic" as const, // Default, webhook can include meta to override
        market_slug: getMetaValue(item.meta_data, "_camp_location")?.toLowerCase().replace(/\s+/g, "-") || "unknown",
        state: getMetaValue(item.meta_data, "_camp_state") || "PA",
        start_date: getMetaValue(item.meta_data, "_camp_date") || new Date().toISOString().split("T")[0],
        start_time: getMetaValue(item.meta_data, "_camp_time") || "09:00",
        end_time: "12:00", // Default
        capacity: 48,
        is_bestseller: getMetaValue(item.meta_data, "_bestseller") === "yes",
        is_almost_full: getMetaValue(item.meta_data, "_almost_full") === "yes",
        woo_product_url: `https://ptpcamp.com/product/${item.product_id}`, // Adjust URL
      };

      // Check if event exists
      let { data: event } = await supabase
        .from("events")
        .select("*")
        .eq("woo_product_id", item.product_id)
        .single();

      if (!event) {
        // Create the event
        const { data: newEvent, error: eventError } = await supabase
          .from("events")
          .insert(eventData)
          .select()
          .single();

        if (eventError) {
          console.error("Event insert error:", eventError.message);
          // Continue processing - event might exist, just couldn't query
        } else {
          event = newEvent;
          console.log(`Event created: ${event?.id}`);
        }
      }

      if (!event) {
        console.error(`Could not find or create event for product ${item.product_id}`);
        continue;
      }

      // Determine enrollment status based on order status
      const enrollmentStatus = mapEnrollmentStatus(order.status);

      // Handle quantity > 1 or multiple children
      const childCount = Math.max(resolvedChildIds.length, item.quantity);

      for (let i = 0; i < childCount; i++) {
        const childId = resolvedChildIds[i];

        if (!childId || !parentId) {
          // No child mapped - log for manual resolution
          console.warn(`No child mapped for line item ${item.id}, position ${i}`);
          continue;
        }

        // Check if enrollment exists
        const { data: existingEnrollment } = await supabase
          .from("enrollments")
          .select("id")
          .eq("child_id", childId)
          .eq("event_id", event.id)
          .single();

        if (existingEnrollment) {
          // Update existing enrollment
          const { error: updateError } = await supabase
            .from("enrollments")
            .update({
              status: enrollmentStatus,
              order_id: upsertedOrder.id,
            })
            .eq("id", existingEnrollment.id);

          if (updateError) {
            console.error("Enrollment update error:", updateError.message);
          } else {
            enrollmentResults.push({ child_id: childId, event_id: event.id, action: "updated" });
            console.log(`Enrollment updated: child=${childId}, event=${event.id}`);
          }
        } else {
          // Create new enrollment
          const { error: enrollError } = await supabase
            .from("enrollments")
            .insert({
              child_id: childId,
              event_id: event.id,
              order_id: upsertedOrder.id,
              parent_id: parentId,
              status: enrollmentStatus,
            });

          if (enrollError) {
            console.error("Enrollment insert error:", enrollError.message);
          } else {
            enrollmentResults.push({ child_id: childId, event_id: event.id, action: "created" });
            console.log(`Enrollment created: child=${childId}, event=${event.id}`);
          }
        }
      }
    }

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        order_id: upsertedOrder.id,
        woo_order_id: order.id,
        enrollments_processed: enrollmentResults.length,
        enrollments: enrollmentResults,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Webhook processing error:", error.message);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
