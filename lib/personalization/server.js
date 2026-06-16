import mongoose from "mongoose";
import { cookies } from "next/headers";
import { createAiClient, getAiModel } from "@/lib/ai/client";
import connectDB from "@/lib/database/db";
import { verifyToken } from "@/lib/jwt";
import Product from "@/models/Product";
import RecommendationLog from "@/models/RecommendationLog";
import UserEvent from "@/models/UserEvent";
import UserPreference from "@/models/UserPreference";

export const EVENT_SCORES = {
    search: 1,
    product_click: 2,
    product_view: 2,
    add_to_cart: 5,
    purchase: 10,
    ai_chat_request: 1,
};

const EVENT_COUNT_KEYS = {
    search: "search",
    product_click: "productClick",
    product_view: "productView",
    add_to_cart: "addToCart",
    purchase: "purchase",
    ai_chat_request: "aiChatRequest",
};

const MAX_INTERESTS = 20;
const MAX_PRODUCT_INTERESTS = 30;
const MAX_RECENT_QUERIES = 20;

function normalizeText(value, maxLength = 180) {
    return String(value ?? "").trim().slice(0, maxLength);
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getComparableName(value) {
    return normalizeText(value).toLowerCase();
}

function toPlainObject(document) {
    return typeof document?.toObject === "function" ? document.toObject() : document;
}

export function normalizeEventType(value) {
    const normalized = String(value ?? "")
        .trim()
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/[\s-]+/g, "_")
        .toLowerCase();

    if (normalized === "click" || normalized === "product_click") {
        return "product_click";
    }

    if (normalized === "view" || normalized === "product_view") {
        return "product_view";
    }

    if (
        normalized === "cart" ||
        normalized === "add_cart" ||
        normalized === "add_to_cart"
    ) {
        return "add_to_cart";
    }

    if (normalized === "order" || normalized === "purchase") {
        return "purchase";
    }

    if (
        normalized === "chat" ||
        normalized === "ai_chat" ||
        normalized === "ai_chat_request"
    ) {
        return "ai_chat_request";
    }

    if (normalized === "search") {
        return "search";
    }

    return "";
}

export function getEventScore(eventType) {
    return EVENT_SCORES[eventType] || 0;
}

export function hasEnoughSignal(preference) {
    const pref = toPlainObject(preference);
    const signalCounts = pref?.signalCounts || {};

    return Boolean(
        signalCounts.search >= 3 ||
            signalCounts.productClick >= 2 ||
            signalCounts.addToCart >= 1 ||
            signalCounts.purchase >= 1 ||
            signalCounts.aiChatRequest >= 1
    );
}

export function serializePreference(preference) {
    const pref = toPlainObject(preference);

    if (!pref) {
        return null;
    }

    return {
        id: pref._id?.toString?.() || pref._id,
        type: pref.type,
        sessionId: pref.sessionId || null,
        userId: pref.userId || null,
        interestedCategories: (pref.interestedCategories || []).map((interest) => ({
            name: interest.name,
            score: interest.score,
        })),
        interestedProducts: (pref.interestedProducts || []).map((product) => ({
            productId: product.productId,
            name: product.name,
            category: product.category,
            score: product.score,
        })),
        recentQueries: (pref.recentQueries || []).map((item) => item.query),
        signalCounts: {
            search: pref.signalCounts?.search || 0,
            productClick: pref.signalCounts?.productClick || 0,
            productView: pref.signalCounts?.productView || 0,
            addToCart: pref.signalCounts?.addToCart || 0,
            purchase: pref.signalCounts?.purchase || 0,
            aiChatRequest: pref.signalCounts?.aiChatRequest || 0,
        },
        eventCount: pref.eventCount || 0,
        totalScore: pref.totalScore || 0,
        lastEventAt: pref.lastEventAt || null,
    };
}

export function normalizeProduct(product) {
    return {
        _id: product._id?.toString?.() || product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        category: product.category,
        stock: product.stock,
    };
}

export async function getAuthenticatedUserId() {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get("accessToken")?.value;

        if (!accessToken) {
            return null;
        }

        const { valid, decoded } = verifyToken(accessToken);

        return valid && decoded?.id ? String(decoded.id) : null;
    } catch {
        return null;
    }
}

async function getProductDetails(productId) {
    const normalizedProductId = normalizeText(productId, 120);

    if (
        !normalizedProductId ||
        !mongoose.Types.ObjectId.isValid(normalizedProductId)
    ) {
        return null;
    }

    return Product.findById(normalizedProductId)
        .select("name category")
        .lean();
}

async function findOrCreatePreference({ sessionId, userId }) {
    const type = userId ? "user" : "guest";
    const filter = userId ? { type, userId } : { type, sessionId };
    let preference = await UserPreference.findOne(filter);

    if (!preference) {
        preference = new UserPreference({
            ...filter,
            sessionId: sessionId || null,
            signalCounts: {},
        });
    } else if (userId && sessionId && !preference.sessionId) {
        preference.sessionId = sessionId;
    }

    return preference;
}

function upsertInterest(interests, name, score, now) {
    const normalizedName = normalizeText(name, 120);

    if (!normalizedName || score <= 0) {
        return;
    }

    const comparableName = getComparableName(normalizedName);
    const existingInterest = interests.find(
        (interest) => getComparableName(interest.name) === comparableName
    );

    if (existingInterest) {
        existingInterest.score += score;
        existingInterest.lastEventAt = now;
    } else {
        interests.push({
            name: normalizedName,
            score,
            lastEventAt: now,
        });
    }

    interests.sort((first, second) => second.score - first.score);
    interests.splice(MAX_INTERESTS);
}

function upsertProductInterest(products, event, score, now) {
    if (!event.productId || score <= 0) {
        return;
    }

    const comparableProductId = getComparableName(event.productId);
    const existingProduct = products.find(
        (product) => getComparableName(product.productId) === comparableProductId
    );

    if (existingProduct) {
        existingProduct.score += score;
        existingProduct.name = event.productName || existingProduct.name;
        existingProduct.category = event.category || existingProduct.category;
        existingProduct.lastEventAt = now;
    } else {
        products.push({
            productId: event.productId,
            name: event.productName,
            category: event.category,
            score,
            lastEventAt: now,
        });
    }

    products.sort((first, second) => second.score - first.score);
    products.splice(MAX_PRODUCT_INTERESTS);
}

function addRecentQuery(preference, query, now) {
    const normalizedQuery = normalizeText(query, 120);

    if (!normalizedQuery) {
        return;
    }

    const comparableQuery = getComparableName(normalizedQuery);
    preference.recentQueries = [
        {
            query: normalizedQuery,
            createdAt: now,
        },
        ...(preference.recentQueries || []).filter(
            (item) => getComparableName(item.query) !== comparableQuery
        ),
    ].slice(0, MAX_RECENT_QUERIES);
}

function getPrimaryInterestName(event) {
    if (event.eventType === "search" || event.eventType === "ai_chat_request") {
        return event.query;
    }

    return event.category || event.productName || event.query;
}

async function updatePreferenceFromEvent(event) {
    const preference = await findOrCreatePreference({
        sessionId: event.sessionId,
        userId: event.userId,
    });
    const score = getEventScore(event.eventType);
    const now = new Date();
    const interestName = getPrimaryInterestName(event);
    const countKey = EVENT_COUNT_KEYS[event.eventType];

    upsertInterest(preference.interestedCategories, interestName, score, now);
    upsertProductInterest(preference.interestedProducts, event, score, now);

    if (event.eventType === "search" || event.eventType === "ai_chat_request") {
        addRecentQuery(preference, event.query, now);
    }

    if (countKey) {
        preference.signalCounts[countKey] =
            (preference.signalCounts[countKey] || 0) + 1;
        preference.markModified("signalCounts");
    }

    preference.eventCount = (preference.eventCount || 0) + 1;
    preference.totalScore = (preference.totalScore || 0) + score;
    preference.lastEventAt = now;
    preference.markModified("interestedCategories");
    preference.markModified("interestedProducts");
    preference.markModified("recentQueries");

    await preference.save();

    return preference;
}

export async function storeUserEvent({
    sessionId,
    userId,
    eventType,
    query,
    productId,
    productName,
    category,
    quantity,
    metadata,
    request,
}) {
    await connectDB();

    const normalizedEventType = normalizeEventType(eventType);
    const normalizedSessionId = normalizeText(sessionId, 120);
    const normalizedUserId = normalizeText(userId, 120);

    if (!normalizedEventType) {
        const error = new Error("Unsupported eventType");
        error.status = 400;
        throw error;
    }

    if (!normalizedUserId && !normalizedSessionId) {
        const error = new Error("sessionId is required for guest events");
        error.status = 400;
        throw error;
    }

    const productDetails = await getProductDetails(productId);
    const normalizedProductId = normalizeText(productId, 120);
    const normalizedQuery = normalizeText(query, 180);
    const normalizedProductName =
        normalizeText(productName, 180) || productDetails?.name || "";
    const normalizedCategory =
        normalizeText(category, 120) || productDetails?.category || "";
    const normalizedQuantity = Number(quantity) > 0 ? Number(quantity) : undefined;
    const normalizedMetadata =
        metadata && typeof metadata === "object" && !Array.isArray(metadata)
            ? metadata
            : undefined;
    const score = getEventScore(normalizedEventType);
    const type = normalizedUserId ? "user" : "guest";

    const event = await UserEvent.create({
        type,
        sessionId: normalizedSessionId || null,
        userId: normalizedUserId || null,
        eventType: normalizedEventType,
        score,
        query: normalizedQuery || undefined,
        productId: normalizedProductId || undefined,
        productName: normalizedProductName || undefined,
        category: normalizedCategory || undefined,
        quantity: normalizedQuantity,
        metadata: normalizedMetadata,
        userAgent: request?.headers?.get("user-agent") || undefined,
        ipAddress:
            request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            undefined,
    });

    const preference = await updatePreferenceFromEvent({
        type,
        sessionId: normalizedSessionId || null,
        userId: normalizedUserId || null,
        eventType: normalizedEventType,
        query: normalizedQuery,
        productId: normalizedProductId,
        productName: normalizedProductName,
        category: normalizedCategory,
    });

    return {
        event,
        preference,
    };
}

function mergeInterestLists(targetList, sourceList) {
    for (const sourceInterest of sourceList || []) {
        upsertInterest(
            targetList,
            sourceInterest.name,
            sourceInterest.score || 0,
            sourceInterest.lastEventAt || new Date()
        );
    }
}

function mergeProductInterestLists(targetList, sourceList) {
    for (const sourceProduct of sourceList || []) {
        upsertProductInterest(
            targetList,
            {
                productId: sourceProduct.productId,
                productName: sourceProduct.name,
                category: sourceProduct.category,
            },
            sourceProduct.score || 0,
            sourceProduct.lastEventAt || new Date()
        );
    }
}

function mergeRecentQueries(targetPreference, sourceQueries) {
    const sortedQueries = [...(sourceQueries || [])].sort(
        (first, second) =>
            new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
    );

    for (const item of sortedQueries.reverse()) {
        addRecentQuery(
            targetPreference,
            item.query,
            item.createdAt ? new Date(item.createdAt) : new Date()
        );
    }
}

export async function mergeGuestPreferenceIntoUser(sessionId, userId) {
    const normalizedSessionId = normalizeText(sessionId, 120);
    const normalizedUserId = normalizeText(userId, 120);

    if (!normalizedSessionId || !normalizedUserId) {
        return null;
    }

    await connectDB();

    const guestPreference = await UserPreference.findOne({
        type: "guest",
        sessionId: normalizedSessionId,
    });

    await UserEvent.updateMany(
        {
            sessionId: normalizedSessionId,
            $or: [{ userId: null }, { userId: "" }],
        },
        {
            $set: {
                type: "user",
                userId: normalizedUserId,
            },
        }
    );

    if (!guestPreference) {
        return null;
    }

    let userPreference = await UserPreference.findOne({
        type: "user",
        userId: normalizedUserId,
    });

    if (!userPreference) {
        userPreference = new UserPreference({
            type: "user",
            userId: normalizedUserId,
            sessionId: normalizedSessionId,
            signalCounts: {},
        });
    }

    mergeInterestLists(
        userPreference.interestedCategories,
        guestPreference.interestedCategories
    );
    mergeProductInterestLists(
        userPreference.interestedProducts,
        guestPreference.interestedProducts
    );
    mergeRecentQueries(userPreference, guestPreference.recentQueries);

    for (const [key, value] of Object.entries(
        guestPreference.signalCounts?.toObject?.() ||
            guestPreference.signalCounts ||
            {}
    )) {
        userPreference.signalCounts[key] =
            (userPreference.signalCounts[key] || 0) + (value || 0);
    }

    userPreference.eventCount =
        (userPreference.eventCount || 0) + (guestPreference.eventCount || 0);
    userPreference.totalScore =
        (userPreference.totalScore || 0) + (guestPreference.totalScore || 0);
    userPreference.lastEventAt =
        [userPreference.lastEventAt, guestPreference.lastEventAt]
            .filter(Boolean)
            .sort((first, second) => second.getTime() - first.getTime())[0] ||
        new Date();
    userPreference.markModified("interestedCategories");
    userPreference.markModified("interestedProducts");
    userPreference.markModified("recentQueries");
    userPreference.markModified("signalCounts");

    await userPreference.save();
    await UserPreference.deleteOne({ _id: guestPreference._id });

    return userPreference;
}

export async function getPreferenceForOwner({ sessionId, userId }) {
    await connectDB();

    const normalizedUserId = normalizeText(userId, 120);
    const normalizedSessionId = normalizeText(sessionId, 120);

    if (normalizedUserId) {
        return UserPreference.findOne({
            type: "user",
            userId: normalizedUserId,
        });
    }

    if (normalizedSessionId) {
        return UserPreference.findOne({
            type: "guest",
            sessionId: normalizedSessionId,
        });
    }

    return null;
}

function getTopInterestTerms(preference) {
    const pref = toPlainObject(preference);

    return (pref?.interestedCategories || [])
        .slice()
        .sort((first, second) => second.score - first.score)
        .map((interest) => interest.name)
        .filter(Boolean)
        .slice(0, 6);
}

function productMatchesTerm(product, term) {
    const haystack = [product.name, product.description, product.category]
        .join(" ")
        .toLowerCase();

    return haystack.includes(String(term).toLowerCase());
}

async function getCandidateProducts(preference) {
    const pref = toPlainObject(preference);
    const topTerms = getTopInterestTerms(pref);
    const productIds = (pref?.interestedProducts || [])
        .map((product) => product.productId)
        .filter((productId) => mongoose.Types.ObjectId.isValid(productId))
        .slice(0, 8);
    const productsById = productIds.length
        ? await Product.find({ _id: { $in: productIds } }).limit(8).lean()
        : [];

    let matchedProducts = [];

    if (topTerms.length > 0) {
        matchedProducts = await Product.find({
            $or: topTerms.flatMap((term) => {
                const regex = new RegExp(escapeRegExp(term), "i");

                return [
                    { name: regex },
                    { description: regex },
                    { category: regex },
                ];
            }),
        })
            .limit(18)
            .lean();
    }

    const combinedProducts = [...productsById, ...matchedProducts];
    const seenProductIds = new Set();

    return combinedProducts
        .filter((product) => {
            const productId = product._id.toString();

            if (seenProductIds.has(productId)) {
                return false;
            }

            seenProductIds.add(productId);
            return true;
        })
        .slice(0, 18);
}

function findProductsForBundle(products, bundle) {
    const terms = [bundle.query, bundle.category, bundle.title]
        .filter(Boolean)
        .flatMap((value) =>
            String(value)
                .split(/[^a-z0-9]+/i)
                .filter((item) => item.length > 1)
        );

    const matchedProducts = products.filter((product) =>
        terms.some((term) => productMatchesTerm(product, term))
    );

    return (matchedProducts.length ? matchedProducts : products)
        .slice(0, 4)
        .map((product) => product._id.toString());
}

function buildLocalBundles(preference, products) {
    const terms = getTopInterestTerms(preference).slice(0, 3);
    const fallbackTerms = terms.length ? terms : ["Recommended"];

    return fallbackTerms.map((term) => ({
        title: `${term} picks`,
        query: term,
        category:
            products.find((product) => productMatchesTerm(product, term))?.category ||
            "",
        reason: "Based on recent shopping activity",
        productIds: findProductsForBundle(products, {
            title: term,
            query: term,
        }),
    }));
}

function normalizeAiBundles(rawBundles, products, localBundles) {
    if (!Array.isArray(rawBundles)) {
        return localBundles;
    }

    const validProductIds = new Set(products.map((product) => product._id.toString()));

    return rawBundles.slice(0, 3).map((bundle, index) => {
        const fallbackBundle = localBundles[index] || localBundles[0] || {};
        const title = normalizeText(bundle?.title, 80) || fallbackBundle.title;
        const query = normalizeText(bundle?.query, 80) || fallbackBundle.query || title;
        const category =
            normalizeText(bundle?.category, 80) || fallbackBundle.category || "";
        const productIds = Array.isArray(bundle?.productIds)
            ? bundle.productIds
                  .map((productId) => String(productId))
                  .filter((productId) => validProductIds.has(productId))
                  .slice(0, 4)
            : [];

        return {
            title,
            query,
            category,
            reason:
                normalizeText(bundle?.reason, 140) ||
                fallbackBundle.reason ||
                "Based on recent shopping activity",
            productIds:
                productIds.length > 0
                    ? productIds
                    : findProductsForBundle(products, { title, query, category }),
        };
    });
}

export async function getPersonalizedRecommendations({
    sessionId,
    userId,
    forceAi = false,
    trigger = "manual",
}) {
    await connectDB();

    const normalizedSessionId = normalizeText(sessionId, 120);
    const normalizedUserId = normalizeText(userId, 120);
    const preference = await getPreferenceForOwner({
        sessionId: normalizedSessionId,
        userId: normalizedUserId,
    });

    if (!preference) {
        return {
            personalized: false,
            signalReady: false,
            aiUsed: false,
            preference: null,
            bundles: [],
            products: [],
        };
    }

    const candidateProducts = await getCandidateProducts(preference);
    const normalizedProducts = candidateProducts.map(normalizeProduct);
    const localBundles = buildLocalBundles(preference, candidateProducts);
    const signalReady = hasEnoughSignal(preference);
    const client = createAiClient();
    const shouldUseAi = Boolean(client && candidateProducts.length > 0 && (forceAi || signalReady));
    let bundles = localBundles;
    let aiUsed = false;
    let model = "";

    if (shouldUseAi) {
        model = process.env.AI_RECOMMENDATION_MODEL || getAiModel();

        try {
            const aiResponse = await client.chat.completions.create({
                model,
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: "system",
                        content: `
You create ecommerce recommendation bundles from stored user preferences and matching catalog products.
Use only the product IDs provided. Return JSON only:
{
  "bundles": [
    {
      "title": "short bundle title",
      "query": "search phrase",
      "category": "category",
      "reason": "short reason",
      "productIds": ["product id"]
    }
  ]
}
                        `,
                    },
                    {
                        role: "user",
                        content: JSON.stringify({
                            preference: serializePreference(preference),
                            products: normalizedProducts.map((product) => ({
                                id: product._id,
                                name: product.name,
                                category: product.category,
                                price: product.price,
                            })),
                        }),
                    },
                ],
                temperature: 0.35,
                max_tokens: 500,
            });
            const parsedResponse = JSON.parse(
                aiResponse.choices[0]?.message?.content || "{}"
            );

            bundles = normalizeAiBundles(
                parsedResponse.bundles,
                candidateProducts,
                localBundles
            );
            aiUsed = true;
        } catch (error) {
            console.warn("AI recommendations failed. Falling back to local bundles.", {
                status: error?.status,
                message: error?.message,
            });
        }
    }

    await RecommendationLog.create({
        type: normalizedUserId ? "user" : "guest",
        sessionId: normalizedSessionId || null,
        userId: normalizedUserId || null,
        trigger,
        aiUsed,
        model: aiUsed ? model : undefined,
        preferenceSnapshot: serializePreference(preference),
        bundles,
        productIds: normalizedProducts.map((product) => product._id),
    }).catch((error) => {
        console.warn("Unable to store recommendation log.", error.message);
    });

    return {
        personalized: normalizedProducts.length > 0 || bundles.length > 0,
        signalReady,
        aiUsed,
        preference: serializePreference(preference),
        bundles,
        products: normalizedProducts,
    };
}
