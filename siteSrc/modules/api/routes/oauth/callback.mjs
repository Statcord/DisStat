import { eventHandler, sendNoContent, getCookie, setCookie, sendRedirect, getQuery } from 'h3'

if (import.meta.env) {
    var {oauth2} = await import('~/config.mjs')
    var {default: sessionIdGen} = await import('~/utils/sessionIdGen.mjs')
    var {tokenRequest, getDiscordUser} = await import('~/utils/oauth.mjs')
    var {default: redis} = await import('~/utils/redis.mjs')
}

export default eventHandler(
    async (a)=>{
        const { code } = getQuery(a);
        if (!code) return sendNoContent(400)

        const tokens = await tokenRequest({
            code,
            redirectUri: oauth2.apihost + "/discordOauth/callback"
        });

		const sessionID = getCookie(a, "sessionId")?.split(".")[0] ?? sessionIdGen()

        redis.set(`sess:${sessionID}`, JSON.stringify({
            discordAccessToken: tokens.access_token,
            discordUserInfo: await getDiscordUser(tokens.access_token)
        }), "EX", 604800)

        const expires = new Date()
        expires.setSeconds(expires.getSeconds()+604800)
        setCookie(a, "sessionId", sessionID, {
            "expires": expires
        })
   
        sendRedirect(a, oauth2.redirectUri, 302)
    }
)
export const file = "oauth/callback.mjs"
export const schema = {
    method: 'GET',
    url: '/siteApi/discordOauth/callback',
	schema: {
        hide: true,
        querystring: {
            code: { type: 'string' }
        },
        response: {
            302: {}
        }
    }
}