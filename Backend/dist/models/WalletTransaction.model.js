import { Schema, model, Types } from "mongoose";
const WalletTransactionSchema = new Schema({
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    type: {
        type: String,
        enum: [
            "wallet_topup",
            "wallet_checkout",
            "fast_response_escrow_debit",
            "fast_response_escrow_refund",
            "fast_response_reward_credit",
        ],
        required: true,
        index: true,
    },
    direction: { type: String, enum: ["credit", "debit"], required: true },
    amountPaisa: { type: Number, required: true, min: 1 },
    balanceAfterPaisa: { type: Number, required: true, min: 0 },
    status: {
        type: String,
        enum: ["completed", "pending", "failed"],
        default: "completed",
        index: true,
    },
    note: { type: String, trim: true, default: "" },
    referenceId: { type: String, trim: true, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });
WalletTransactionSchema.index({ userId: 1, createdAt: -1 });
export default model("WalletTransaction", WalletTransactionSchema);
