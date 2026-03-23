import axios from "axios";
import User from "../models/User.model.js";
import { createNotification } from "../services/notification.service.js";
const KHALTI_INITIATE_URL = "https://dev.khalti.com/api/v2/epayment/initiate/";
const KHALTI_LOOKUP_URL = "https://dev.khalti.com/api/v2/epayment/lookup/";
const normalizeKhaltiSecretKey = (raw) => {
    const value = String(raw ?? "").trim();
    if (!value)
        return "";
    if (value.startsWith("test_secret_key_"))
        return value.replace("test_secret_key_", "");
    if (value.startsWith("live_secret_key_"))
        return value.replace("live_secret_key_", "");
    return value;
};
const formatKhaltiError = (payload) => {
    if (!payload)
        return "Khalti verification failed";
    if (typeof payload === "string")
        return payload;
    if (typeof payload !== "object")
        return "Khalti verification failed";
    const data = payload;
    if (typeof data.detail === "string" && data.detail.trim())
        return data.detail;
    if (typeof data.error_key === "string" && data.error_key.trim())
        return data.error_key;
    const entries = Object.entries(data)
        .map(([key, value]) => {
        if (typeof value === "string")
            return `${key}: ${value}`;
        if (Array.isArray(value)) {
            const joined = value.map((item) => String(item ?? "")).filter(Boolean).join(", ");
            return joined ? `${key}: ${joined}` : "";
        }
        return "";
    })
        .filter(Boolean);
    return entries[0] || "Khalti verification failed";
};
export async function verifyKhaltiPayment(req, res) {
    const authedReq = req;
    const userId = authedReq.user?.id;
    const pidx = String(req.body?.pidx ?? "").trim();
    const khaltiTestSecretKey = normalizeKhaltiSecretKey(process.env.KHALTI_TEST_SECRET_KEY ?? "");
    if (!userId) {
        return res.status(401).json({
            success: false,
            error: "Unauthorized",
        });
    }
    if (!pidx) {
        return res.status(400).json({
            success: false,
            error: "pidx is required",
        });
    }
    if (!khaltiTestSecretKey) {
        return res.status(500).json({
            success: false,
            error: "Khalti test secret key is missing",
        });
    }
    try {
        const lookup = await axios.post(KHALTI_LOOKUP_URL, { pidx }, {
            headers: {
                Authorization: `Key ${khaltiTestSecretKey}`,
                "Content-Type": "application/json",
            },
            timeout: 15000,
        });
        const status = String(lookup.data?.status ?? "");
        if (status !== "Completed") {
            return res.status(400).json({
                success: false,
                error: status ? `Payment status: ${status}` : "Payment is not completed",
            });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
            });
        }
        const now = new Date();
        const existingExpiry = user.planExpiresAt ? new Date(user.planExpiresAt) : null;
        const baseDate = existingExpiry && !Number.isNaN(existingExpiry.getTime()) && existingExpiry.getTime() > now.getTime()
            ? existingExpiry
            : now;
        const nextExpiry = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        user.plan = "Pro";
        user.planActivatedAt = now;
        user.planExpiresAt = nextExpiry;
        await user.save();
        await createNotification({
            userId: String(user._id),
            type: "system",
            title: "Payment successful",
            message: `Your Pro plan is active until ${nextExpiry.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            })}.`,
            link: "/pricing",
            metadata: {
                pidx,
                plan: "Pro",
                planExpiresAt: nextExpiry.toISOString(),
            },
        });
        return res.json({
            success: true,
            message: "Payment verified successfully",
            paymentInfo: lookup.data,
        });
    }
    catch (error) {
        if (axios.isAxiosError(error)) {
            return res.status(502).json({
                success: false,
                error: formatKhaltiError(error.response?.data) || error.message || "Failed to verify Khalti payment",
            });
        }
        return res.status(500).json({
            success: false,
            error: "Failed to verify Khalti payment",
        });
    }
}
const isValidHttpUrl = (value) => {
    try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    }
    catch {
        return false;
    }
};
export async function initiateKhaltiPayment(req, res) {
    const authedReq = req;
    const userId = authedReq.user?.id;
    const amount = Number(req.body?.amount);
    const returnUrl = String(req.body?.returnUrl ?? "").trim();
    const websiteUrl = String(req.body?.websiteUrl ?? "").trim();
    const purchaseOrderId = String(req.body?.purchaseOrderId ?? "").trim();
    const purchaseOrderName = String(req.body?.purchaseOrderName ?? "").trim();
    const customerInfoRaw = req.body?.customerInfo;
    const khaltiTestSecretKey = normalizeKhaltiSecretKey(process.env.KHALTI_TEST_SECRET_KEY ?? "");
    if (!userId) {
        return res.status(401).json({
            success: false,
            error: "Unauthorized",
        });
    }
    if (!Number.isInteger(amount) || amount <= 0) {
        return res.status(400).json({
            success: false,
            error: "Amount must be a positive integer in paisa",
        });
    }
    if (!returnUrl || !isValidHttpUrl(returnUrl)) {
        return res.status(400).json({
            success: false,
            error: "Valid returnUrl is required",
        });
    }
    if (!websiteUrl || !isValidHttpUrl(websiteUrl)) {
        return res.status(400).json({
            success: false,
            error: "Valid websiteUrl is required",
        });
    }
    if (!purchaseOrderId) {
        return res.status(400).json({
            success: false,
            error: "purchaseOrderId is required",
        });
    }
    if (!purchaseOrderName) {
        return res.status(400).json({
            success: false,
            error: "purchaseOrderName is required",
        });
    }
    if (!khaltiTestSecretKey) {
        return res.status(500).json({
            success: false,
            error: "Khalti test secret key is missing",
        });
    }
    const rawCustomerInfo = customerInfoRaw && typeof customerInfoRaw === "object"
        ? {
            name: String(customerInfoRaw.name ?? "").trim(),
            email: String(customerInfoRaw.email ?? "").trim(),
            phone: String(customerInfoRaw.phone ?? "").trim(),
        }
        : null;
    const customerInfo = rawCustomerInfo && (rawCustomerInfo.name || rawCustomerInfo.email || rawCustomerInfo.phone)
        ? {
            ...(rawCustomerInfo.name ? { name: rawCustomerInfo.name } : {}),
            ...(rawCustomerInfo.email ? { email: rawCustomerInfo.email } : {}),
            ...(rawCustomerInfo.phone ? { phone: rawCustomerInfo.phone } : {}),
        }
        : undefined;
    try {
        const initiate = await axios.post(KHALTI_INITIATE_URL, {
            return_url: returnUrl,
            website_url: websiteUrl,
            amount,
            purchase_order_id: purchaseOrderId,
            purchase_order_name: purchaseOrderName,
            ...(customerInfo ? { customer_info: customerInfo } : {}),
        }, {
            headers: {
                Authorization: `Key ${khaltiTestSecretKey}`,
                "Content-Type": "application/json",
            },
            timeout: 15000,
        });
        const payload = initiate.data;
        const paymentUrl = String(payload.payment_url ?? "");
        if (!paymentUrl) {
            return res.status(502).json({
                success: false,
                error: "Khalti did not return a payment_url",
            });
        }
        return res.json({
            success: true,
            message: "Payment initiated successfully",
            paymentInfo: {
                pidx: payload.pidx,
                paymentUrl,
                expiresAt: payload.expires_at,
                expiresIn: payload.expires_in,
            },
        });
    }
    catch (error) {
        if (axios.isAxiosError(error)) {
            return res.status(502).json({
                success: false,
                error: formatKhaltiError(error.response?.data) || error.message || "Failed to initiate Khalti payment",
            });
        }
        return res.status(500).json({
            success: false,
            error: "Failed to initiate Khalti payment",
        });
    }
}
