import { Router } from "express";
import { matchIdParamSchema } from "../validation/matches.js";
import { createCommentarySchema, listCommentaryQuerySchema } from "../validation/commentary.js";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import { desc, eq } from "drizzle-orm";

export const commentaryRouter = Router({ mergeParams: true });

// maximum number of records allowed by the API (also mirrored in the zod schema)
const MAX_LIMIT = 100;

commentaryRouter.get('/', async (req, res) => {
    // validate route params (match id coming from parent router)
    const paramsParsed = matchIdParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
        return res.status(400).json({ error: 'Invalid match id', details: paramsParsed.error.issues });
    }

    // validate query string (limit, etc.)
    const queryParsed = listCommentaryQuerySchema.safeParse(req.query);
    if (!queryParsed.success) {
        return res.status(400).json({ error: 'Invalid query parameters', details: queryParsed.error.issues });
    }

    // apply default/upper bound on limit
    const requested = queryParsed.data.limit ?? MAX_LIMIT;
    const limit = Math.min(requested, MAX_LIMIT);

    try {
        const entries = await db
            .select()
            .from(commentary)
            .where(eq(commentary.matchId,paramsParsed.data.id))
            .orderBy(desc(commentary.createdAt))
            .limit(limit);

        res.status(200).json({ data: entries, limit });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch commentary', details: error.message });
    }
});

// create a new commentary entry for a match
commentaryRouter.post('/', async (req, res) => {
    // validate route params

    
    const paramsParsed = matchIdParamSchema.safeParse(req.params);
    
    if (!paramsParsed.success) {
        return res.status(400).json({ error: 'Invalid match id', details: paramsParsed.error.issues });
    }

    // validate request body
    const bodyParsed = createCommentarySchema.safeParse(req.body);
    if (!bodyParsed.success) {
        return res.status(400).json({ error: 'Invalid payload', details: bodyParsed.error.issues });
    }

    try {
        const [entry] = await db
            .insert(commentary)
            .values({
                matchId: paramsParsed.data.id,
                minute: bodyParsed.data.minute,
                sequence: bodyParsed.data.sequence,
                period: bodyParsed.data.period,
                eventType: bodyParsed.data.eventType,
                actor: bodyParsed.data.actor,
                team: bodyParsed.data.team,
                message: bodyParsed.data.message,
                metadata: bodyParsed.data.metadata,
                tags: bodyParsed.data.tags,
            })
            .returning();

            if(res.app.locals.broadcastCommentary){
                res.app.locals.broadcastCommentary(entry.matchId, entry)
            }

        res.status(201).json({ data: entry, message: 'success' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create commentary'});
    }
});