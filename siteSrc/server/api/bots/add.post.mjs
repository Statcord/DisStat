import { defineEventHandler, readBody, sendNoContent, sendError, createError } from "h3"

const defaultChartSettings = [
	{
		id: "guildCount",
		name: "Guild Growth",
		type: "line",
		label: "This Week",
		category: "default"
	},
	{
		id: "shardCount",
		name: "Shards",
		type: "line",
		label: "This Week",
		category: "default"
	},
	{
		id: "members",
		name: "Members",
		type: "line",
		label: "This Week",
		category: "default"
	},
	{
		id: "userCount",
		name: "User Count",
		type: "line",
		label: "This Week",
		category: "default"
	},
	{
		id: "cpuUsage",
		name: "CPU Usage",
		type: "line",
		label: "This Week",
		category: "default"
	},
	{
		id: "ramUsage",
		name: "Ram Usage",
		type: "line",
		label: "This Week",
		category: "default"
	},
	{
		id: "totalRam",
		name: "Total Ram",
		type: "line",
		label: "This Week",
		category: "default"
	},	
	{
		id: "topCmds",
		name: "Popular Commands",
		type: 'pie',
		label: 'Fully Rounded',
		category: "commands"
	},
	{
		id: "cmdTotalUse",
		name: "Command usage over time",
		type: "line",
		label: "This week",
		category: "commands"
	}
]

export default defineEventHandler(async event => {
	if (!event.context.session.accessToken) return sendError(event, createError({statusCode: 401, statusMessage: 'Unauthorized'}))

	const body = await readBody(event)

	const botExisits = await event.context.pgPool`SELECT ownerid from bots WHERE botid = ${body.botid}`.catch(() => {})
	if (botExisits[0]) return sendError(event, createError({statusCode: 409, statusMessage: 'Bot already exists'}))

	const OAuthHelper = event.context.oauth.rest.oauth.getHelper(`Bearer ${event.context.session.accessToken}`)
    const ownsBot = await OAuthHelper.ownsApplication(body.botid);
	if (!ownsBot) return sendError(event, createError({statusCode: 401, statusMessage: 'Unauthorized'}))

	const bot = await event.context.oauth.rest.users.get(body.botid).catch(e=>{})
	if (!bot) return sendError(event, createError({statusCode: 404, statusMessage: 'Bot not found'}))

	event.context.pgPool`INSERT INTO bots(botid, username, avatar, token, ownerid, addedon, public, nsfw, invite, shortdesc, longdesc) VALUES (${body.botid}, ${bot.username}, ${bot.avatar}, ${event.context.genKey()}, ${event.context.session.userInfo.id}, now(), ${body.public}, ${body.nsfw}, ${body.invite}, ${body.shortDesc}, ${body.longDesc})`.catch(() => {})

	defaultChartSettings.forEach(chart => {
		event.context.pgPool`INSERT INTO chartsettings(botid, chartid, name, label, type, category) VALUES (${body.botid}, ${chart.id}, ${chart.name}, ${chart.label}, ${chart.type}, ${chart.category})`.catch(() => {})
	})

	const botLinks = [
		{
			name: "github",
			url: body.github,
			icon: "link"
		},
		{
			name: "website",
			url: body.website,
			icon: "link"
		},
		{
			name: "supportserver",
			url: body.supportserver,
			icon: "link"
		},
		{
			name: "donations",
			url: body.donations,
			icon: "link"
		}
	].map(async link => {
		event.context.pgPool`INSERT INTO botlinks(botid, name, url, icon) VALUES (${body.botid}, ${link.name}, ${link.url}, ${link.icon})`.catch(() => {})
	})

	sendNoContent(event, 200)
})

export const schema = {
	"hidden": true,
	"tags": [
		"Internal"
	],
	"requestBody": {
		"description": "Add a bot to Statcord",
		"content": {
			"application/json": {
				"schema": {
					"type": "object",
					"properties": {
						"botid": {
							"type": "string"
						},
						"invite": {
							"type": "string",
						},
						"public": {
							"type": "boolean"
						},
						"nsfw": {
							"type": "boolean"
						},
						"customurl": {
							"type": "string"
						},
						"shortDesc": {
							"type": "string"
						},
						"longDesc": {
							"type": "string"
						},
						"github": {
							"type": "string",
						},
						"website": {
							"type": "string"
						},
						"supportserver": {
							"type": "string"
						},
						"donations": {
							"type": "string",
						}
					}
				}
			}
		}
	},
	"responses": {
		401: {
			"description": "You do not have permission to access this bot.",
			"content": {
				"application/json": {
					"schema": {
						"type": "object",
						"properties": {
							"statusCode": {
								"type": "number"
							},
							"statusMessage": {
								"type": "string"
							}
						}
					},
					"examples": [
						{
							"statusCode": 401,
							"statusMessage": "Unauthorized"
						}
					]
				}
			}
		},
		400: {
			"description": "Bad request. One or more Key-value pairs are either missing or have unsupported data",
			"content": {
				"application/json": {
					"schema": {
						"type": "object",
						"properties": {
							"statusCode": {
								"type": "number"
							},
							"statusMessage": {
								"type": "string"
							}
						}
					},
					"examples": [
						{
							"statusCode": 400,
							"statusMessage": "Bad Request"
						}
					]
				}
			}
        },
		409:{
			"description": "Bot already exists",
			"content": {
				"application/json": {
					"schema": {
						"type": "object",
						"properties": {
							"statusCode": {
								"type": "number"
							},
							"statusMessage": {
								"type": "string"
							}
						}
					},
					"examples": [
						{
							"statusCode": 409,
							"statusMessage": "Bot already exists"
						}
					]
				}
			}
		},
		404:{
			"description": "Bot not found",
			"content": {
				"application/json": {
					"schema": {
						"type": "object",
						"properties": {
							"statusCode": {
								"type": "number"
							},
							"statusMessage": {
								"type": "string"
							}
						}
					},
					"examples": [
						{
							"statusCode": 409,
							"statusMessage": "Bot does not exist"
						}
					]
				}
			}
		},
		200: {
			"description": "Bot added successfully",
		}
	}
}
