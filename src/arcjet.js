import arcjet from "@arcjet/node";
import { detectBot, shield, slidingWindow } from "@arcjet/node";


const arcjetKey = process.env.ARCJET_KEY;
const arcjetMode = process.env.ARCJET_KEY === 'DRY_RUN' ? 'DRY_RUN' : 'LIVE'

if(!arcjetKey) throw new Error('ARCJET Key environment variable is missing.');

export const httpArcjet = arcjetKey ? 
      arcjet({
          key: arcjetKey,
          rules: [
             shield({ mode: arcjetMode }),
             //detectBot({ mode: arcjetMode, allow: ['CATEGORY:SEARCH_ENGINE', "CATEGORY:PREVIEW"]}),
             slidingWindow({ mode: arcjetMode, interval: '10s', max: 50 })
          ]
      }) : null


export const wsArcjet = arcjetKey ?
     arcjet({
        key: arcjetKey,
          rules: [
             shield({ mode: arcjetMode }),
             detectBot({ mode: arcjetMode, allow: ['CATEGORY:SEARCH_ENGINE', "CATEGORY:PREVIEW"]}),
             slidingWindow({ mode: arcjetMode, interval: '2s', max: 5 })
          ]
     }) : null



export function securityMiddleware(){
    return async (req,res,next) => {
        if(!httpArcjet) return next();

        try {
            const desicison = await httpArcjet.protect(req);

            if(desicison.isDenied()){
                if(desicison.reason.isRateLimit()){
                    return res.status(429).json({ error : "To many requests."})
                }

                return res.status(403).json({ error: 'Forbidden. '})
            }
        } catch (error) {
            console.error('Arcjet middleware error', error);
            return res.status(503).json({ error: 'Service Unavailable'})
        }

        next();
    }
}