import mongoose from "mongoose";
import User from "../models/User.model.js";
import MentorConnection from "../models/MentorConnection.model.js";
import MentorDiscoveryAction from "../models/MentorDiscoveryAction.model.js";
import PrivateChatRoom from "../models/PrivateChatRoom.model.js";
const normalizeText = (value) => String(value ?? "").trim().toLowerCase();
const sanitizeStringArray = (values) => {
    if (!Array.isArray(values))
        return [];
    const unique = new Map();
    values.forEach((value) => {
        const trimmed = String(value ?? "").trim();
        if (!trimmed)
            return;
        const key = normalizeText(trimmed);
        if (!unique.has(key))
            unique.set(key, trimmed);
    });
    return Array.from(unique.values());
};
const parseRequestedInterestTags = (value) => {
    if (Array.isArray(value)) {
        return sanitizeStringArray(value.flatMap((item) => String(item ?? "").split(",")));
    }
    const single = String(value ?? "").trim();
    if (!single)
        return [];
    return sanitizeStringArray(single.split(","));
};
const tagMatches = (candidateTag, requestedTag) => {
    const left = normalizeText(candidateTag);
    const right = normalizeText(requestedTag);
    if (!left || !right)
        return false;
    return left === right || left.includes(right) || right.includes(left);
};
const hasCurrentAcademicBackground = (academicBackgrounds) => Array.isArray(academicBackgrounds) &&
    academicBackgrounds.some((item) => Boolean(item?.isCurrent) && String(item?.institution ?? "").trim());
const getPairKey = (a, b) => [String(a), String(b)].sort().join(":");
const isEligibleMentorCandidate = (candidate) => {
    const role = String(candidate?.role ?? "");
    return role === "instructor" || role === "student";
};
const resolveInstitution = (candidate) => {
    const direct = String(candidate?.institution ?? "").trim();
    if (direct)
        return direct;
    if (!Array.isArray(candidate?.academicBackgrounds))
        return "";
    const firstAcademic = candidate.academicBackgrounds.find((item) => String(item?.institution ?? "").trim());
    return firstAcademic ? String(firstAcademic.institution).trim() : "";
};
const toMentorPayload = (candidate, scoreBreakdown, totalScore) => {
    const fullName = `${String(candidate?.firstName ?? "").trim()} ${String(candidate?.lastName ?? "").trim()}`.trim();
    return {
        id: String(candidate?._id),
        name: fullName || String(candidate?.email ?? "Mentor"),
        institution: resolveInstitution(candidate),
        expertise: String(candidate?.expertise ?? "").trim() || null,
        interests: sanitizeStringArray(candidate?.interests),
        bio: String(candidate?.bio ?? "").trim() || "No bio added yet.",
        avatarUrl: candidate?.avatarUrl ?? null,
        mentorType: candidate?.role === "instructor" ? "Verified Instructor" : "Top Ranked Student",
        matchScore: totalScore,
        matchBreakdown: scoreBreakdown,
    };
};
const getPeerIdFromConnection = (connection, currentUserId) => String(connection.senderId) === String(currentUserId)
    ? String(connection.receiverId)
    : String(connection.senderId);
const ensurePrivateChatRoom = async (userAId, userBId, connectionId) => {
    const [left, right] = [String(userAId), String(userBId)].sort();
    const pairKey = getPairKey(left, right);
    const memberIds = [
        new mongoose.Types.ObjectId(left),
        new mongoose.Types.ObjectId(right),
    ];
    const update = {
        $set: { memberIds, isActive: true },
    };
    if (connectionId && mongoose.Types.ObjectId.isValid(connectionId)) {
        update.$setOnInsert = {
            createdByConnectionId: new mongoose.Types.ObjectId(connectionId),
        };
    }
    return PrivateChatRoom.findOneAndUpdate({ pairKey }, update, {
        upsert: true,
        new: true,
    });
};
export async function getNextMentorMatch(req, res) {
    try {
        const currentUserId = String(req.user?.id || "").trim();
        if (!currentUserId)
            return res.status(401).json({ message: "Unauthorized" });
        const requestedInterestTags = parseRequestedInterestTags(req.query?.tags);
        if (!requestedInterestTags.length) {
            return res.status(400).json({ message: "Please enter at least one interest tag" });
        }
        const currentUser = await User.findById(currentUserId).select("role").lean();
        if (!currentUser)
            return res.status(404).json({ message: "User not found" });
        const [actions, activeConnections] = await Promise.all([
            MentorDiscoveryAction.find({
                userId: currentUserId,
                action: { $in: ["Skipped", "Blocked"] },
            })
                .select("mentorId action")
                .lean(),
            MentorConnection.find({
                status: { $in: ["Pending", "Accepted"] },
                $or: [{ senderId: currentUserId }, { receiverId: currentUserId }],
            })
                .select("senderId receiverId")
                .lean(),
        ]);
        const blockedIds = new Set();
        const skippedIds = new Set();
        const connectedIds = new Set();
        actions.forEach((item) => {
            const mentorId = String(item.mentorId);
            if (String(item.action) === "Blocked")
                blockedIds.add(mentorId);
            if (String(item.action) === "Skipped")
                skippedIds.add(mentorId);
        });
        activeConnections.forEach((item) => connectedIds.add(getPeerIdFromConnection(item, currentUserId)));
        const excludedIds = new Set([
            currentUserId,
            ...Array.from(blockedIds),
            ...Array.from(connectedIds),
            ...Array.from(skippedIds),
        ]);
        const buildRankedCandidates = async (excludedUserIds) => {
            const candidates = await User.find({
                _id: { $nin: Array.from(excludedUserIds) },
                role: { $in: ["student", "instructor"] },
            })
                .select("_id firstName lastName email role institution expertise interests bio avatarUrl academicBackgrounds isVerified verificationStatus points acceptedAnswers")
                .lean();
            const eligibleCandidates = candidates.filter((candidate) => isEligibleMentorCandidate(candidate));
            return eligibleCandidates.map((candidate) => {
                const candidateInterests = sanitizeStringArray(candidate.interests);
                const sharedInterestSet = new Set();
                const sharedInterests = candidateInterests.filter((item) => {
                    const normalized = normalizeText(item);
                    if (sharedInterestSet.has(normalized))
                        return false;
                    const matchesRequested = requestedInterestTags.some((requestedTag) => tagMatches(item, requestedTag));
                    if (!matchesRequested)
                        return false;
                    sharedInterestSet.add(normalized);
                    return true;
                });
                const matchingInterestCount = sharedInterests.length;
                const currentAcademic = hasCurrentAcademicBackground(candidate.academicBackgrounds);
                const points = Number(candidate?.points ?? 0);
                return {
                    candidate,
                    matchingInterestCount,
                    hasCurrentAcademic: currentAcademic,
                    points,
                    breakdown: {
                        sharedInterests,
                        hasCurrentAcademicBackground: currentAcademic,
                        points,
                    },
                };
            });
        };
        const ranked = await buildRankedCandidates(excludedIds);
        const matched = ranked.filter((item) => item.matchingInterestCount > 0);
        if (!ranked.length) {
            return res.json({
                mentor: null,
                message: "No relevant mentor available right now.",
            });
        }
        if (matched.length > 0) {
            matched.sort((left, right) => {
                if (right.matchingInterestCount !== left.matchingInterestCount) {
                    return right.matchingInterestCount - left.matchingInterestCount;
                }
                if (left.hasCurrentAcademic !== right.hasCurrentAcademic) {
                    return Number(right.hasCurrentAcademic) - Number(left.hasCurrentAcademic);
                }
                if (right.points !== left.points)
                    return right.points - left.points;
                return String(left.candidate._id).localeCompare(String(right.candidate._id));
            });
            const top = matched[0];
            const equallyTop = matched.filter((item) => item.matchingInterestCount === top.matchingInterestCount &&
                item.hasCurrentAcademic === top.hasCurrentAcademic &&
                item.points === top.points);
            const selected = equallyTop[Math.floor(Math.random() * equallyTop.length)];
            return res.json({
                mentor: toMentorPayload(selected.candidate, selected.breakdown, selected.matchingInterestCount),
            });
        }
        const randomFallbackPool = ranked.filter((item) => item.points > 0);
        if (!randomFallbackPool.length) {
            return res.json({
                mentor: null,
                message: "No relevant mentor available right now.",
            });
        }
        const selected = randomFallbackPool[Math.floor(Math.random() * randomFallbackPool.length)];
        return res.json({
            mentor: toMentorPayload(selected.candidate, selected.breakdown, selected.matchingInterestCount),
        });
    }
    catch {
        return res.status(500).json({ message: "Failed to find mentor match" });
    }
}
export async function skipMentor(req, res) {
    try {
        const currentUserId = String(req.user?.id || "").trim();
        if (!currentUserId)
            return res.status(401).json({ message: "Unauthorized" });
        const mentorId = String(req.body?.mentorId ?? "").trim();
        if (!mentorId || !mongoose.Types.ObjectId.isValid(mentorId)) {
            return res.status(400).json({ message: "Valid mentorId is required" });
        }
        if (mentorId === currentUserId) {
            return res.status(400).json({ message: "You cannot skip yourself" });
        }
        await MentorDiscoveryAction.updateOne({ userId: currentUserId, mentorId, action: "Skipped" }, {
            $setOnInsert: {
                userId: new mongoose.Types.ObjectId(currentUserId),
                mentorId: new mongoose.Types.ObjectId(mentorId),
                action: "Skipped",
            },
        }, { upsert: true });
        return res.json({ message: "Mentor skipped" });
    }
    catch {
        return res.status(500).json({ message: "Failed to skip mentor" });
    }
}
export async function blockMentor(req, res) {
    try {
        const currentUserId = String(req.user?.id || "").trim();
        if (!currentUserId)
            return res.status(401).json({ message: "Unauthorized" });
        const mentorId = String(req.body?.mentorId ?? "").trim();
        if (!mentorId || !mongoose.Types.ObjectId.isValid(mentorId)) {
            return res.status(400).json({ message: "Valid mentorId is required" });
        }
        if (mentorId === currentUserId) {
            return res.status(400).json({ message: "You cannot block yourself" });
        }
        await MentorDiscoveryAction.updateOne({ userId: currentUserId, mentorId, action: "Blocked" }, {
            $setOnInsert: {
                userId: new mongoose.Types.ObjectId(currentUserId),
                mentorId: new mongoose.Types.ObjectId(mentorId),
                action: "Blocked",
            },
        }, { upsert: true });
        const pairKey = getPairKey(currentUserId, mentorId);
        await MentorConnection.updateOne({ pairKey, status: { $in: ["Pending", "Accepted"] } }, {
            $set: {
                status: "Cancelled",
                respondedAt: new Date(),
                respondedById: new mongoose.Types.ObjectId(currentUserId),
            },
        });
        await PrivateChatRoom.updateOne({ pairKey }, { $set: { isActive: false } });
        return res.json({ message: "Mentor blocked" });
    }
    catch {
        return res.status(500).json({ message: "Failed to block mentor" });
    }
}
export async function connectWithMentor(req, res) {
    try {
        const currentUserId = String(req.user?.id || "").trim();
        if (!currentUserId)
            return res.status(401).json({ message: "Unauthorized" });
        const mentorId = String(req.body?.mentorId ?? "").trim();
        if (!mentorId || !mongoose.Types.ObjectId.isValid(mentorId)) {
            return res.status(400).json({ message: "Valid mentorId is required" });
        }
        if (mentorId === currentUserId) {
            return res.status(400).json({ message: "You cannot connect with yourself" });
        }
        const mentor = await User.findById(mentorId)
            .select("role isVerified verificationStatus points acceptedAnswers")
            .lean();
        if (!mentor || !isEligibleMentorCandidate(mentor)) {
            return res.status(404).json({ message: "Mentor not found" });
        }
        const blocked = await MentorDiscoveryAction.findOne({
            userId: currentUserId,
            mentorId,
            action: "Blocked",
        })
            .select("_id")
            .lean();
        if (blocked) {
            return res.status(400).json({ message: "You have blocked this mentor" });
        }
        await MentorDiscoveryAction.deleteOne({
            userId: currentUserId,
            mentorId,
            action: "Skipped",
        });
        const pairKey = getPairKey(currentUserId, mentorId);
        let connection = await MentorConnection.findOne({ pairKey });
        if (!connection) {
            connection = await MentorConnection.create({
                senderId: new mongoose.Types.ObjectId(currentUserId),
                receiverId: new mongoose.Types.ObjectId(mentorId),
                pairKey,
                status: "Pending",
                requestedAt: new Date(),
            });
            return res.status(201).json({
                connectionId: String(connection._id),
                status: connection.status,
                message: "Connection request sent",
            });
        }
        if (connection.status === "Accepted") {
            const room = await ensurePrivateChatRoom(currentUserId, mentorId, String(connection._id));
            return res.json({
                connectionId: String(connection._id),
                status: connection.status,
                chatRoomId: room ? String(room._id) : null,
                message: "You are already connected. Private chat is enabled.",
            });
        }
        if (connection.status === "Pending") {
            const currentUserIsSender = String(connection.senderId) === currentUserId;
            if (currentUserIsSender) {
                return res.json({
                    connectionId: String(connection._id),
                    status: connection.status,
                    message: "Connection request is already pending",
                });
            }
            connection.status = "Accepted";
            connection.acceptedAt = new Date();
            connection.respondedAt = new Date();
            connection.respondedById = new mongoose.Types.ObjectId(currentUserId);
            await connection.save();
            const room = await ensurePrivateChatRoom(currentUserId, mentorId, String(connection._id));
            return res.json({
                connectionId: String(connection._id),
                status: connection.status,
                chatRoomId: room ? String(room._id) : null,
                message: "Connection accepted. Private chat is now enabled.",
            });
        }
        connection.senderId = new mongoose.Types.ObjectId(currentUserId);
        connection.receiverId = new mongoose.Types.ObjectId(mentorId);
        connection.status = "Pending";
        connection.requestedAt = new Date();
        connection.respondedAt = null;
        connection.acceptedAt = null;
        connection.respondedById = null;
        await connection.save();
        return res.json({
            connectionId: String(connection._id),
            status: connection.status,
            message: "Connection request sent",
        });
    }
    catch {
        return res.status(500).json({ message: "Failed to create connection request" });
    }
}
export async function respondToConnectionRequest(req, res) {
    try {
        const currentUserId = String(req.user?.id || "").trim();
        if (!currentUserId)
            return res.status(401).json({ message: "Unauthorized" });
        const connectionId = String(req.params.connectionId || "").trim();
        if (!connectionId || !mongoose.Types.ObjectId.isValid(connectionId)) {
            return res.status(400).json({ message: "Valid connectionId is required" });
        }
        const action = String(req.body?.action ?? "")
            .trim()
            .toLowerCase();
        if (!["accept", "reject"].includes(action)) {
            return res.status(400).json({ message: "Action must be accept or reject" });
        }
        const connection = await MentorConnection.findById(connectionId);
        if (!connection)
            return res.status(404).json({ message: "Connection not found" });
        const isSender = String(connection.senderId) === currentUserId;
        const isReceiver = String(connection.receiverId) === currentUserId;
        if (!isSender && !isReceiver) {
            return res.status(403).json({ message: "Not allowed to respond to this connection" });
        }
        if (connection.status === "Accepted") {
            const room = await ensurePrivateChatRoom(String(connection.senderId), String(connection.receiverId), String(connection._id));
            return res.json({
                connectionId: String(connection._id),
                status: connection.status,
                chatRoomId: room ? String(room._id) : null,
                message: "Connection is already accepted",
            });
        }
        if (connection.status !== "Pending") {
            return res.status(400).json({ message: "This connection is no longer pending" });
        }
        if (!isReceiver) {
            return res.status(403).json({ message: "Only the recipient can respond to this request" });
        }
        if (action === "accept") {
            connection.status = "Accepted";
            connection.acceptedAt = new Date();
            connection.respondedAt = new Date();
            connection.respondedById = new mongoose.Types.ObjectId(currentUserId);
            await connection.save();
            const room = await ensurePrivateChatRoom(String(connection.senderId), String(connection.receiverId), String(connection._id));
            return res.json({
                connectionId: String(connection._id),
                status: connection.status,
                chatRoomId: room ? String(room._id) : null,
                message: "Connection accepted. Private chat is now enabled.",
            });
        }
        connection.status = "Rejected";
        connection.respondedAt = new Date();
        connection.respondedById = new mongoose.Types.ObjectId(currentUserId);
        await connection.save();
        return res.json({
            connectionId: String(connection._id),
            status: connection.status,
            message: "Connection request rejected",
        });
    }
    catch {
        return res.status(500).json({ message: "Failed to respond to connection request" });
    }
}
