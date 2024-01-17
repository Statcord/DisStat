import { defineEventHandler, createError, getRouterParams, sendError } from 'h3'
import { flux, fluxDuration } from '@influxdata/influxdb-client'

export default defineEventHandler(async event => {
	const path = getRouterParams(event)

	if (!path.botID) return sendError(event, createError({statusCode: 400, statusMessage: 'Bad Request'}))
	const bot = await event.context.pgPool`SELECT * FROM bots WHERE botid = ${path.botID}`.catch(() => {})
	if (!bot[0]) return sendError(event, createError({statusCode: 404, statusMessage: 'Bot not found'}))

	const isOwner = !!event.context.session.accessToken && bot[0].ownerid === event.context.session.userInfo.id
	if ((!bot[0].public && !isOwner)) return sendError(event, createError({statusCode: 401, statusMessage: 'Unauthorized'}))

	const start = 0
	const stop = new Date().toISOString()

	const mainStats = await fetchFromInflux({
		measurement: "botStats",
		start,
		stop,
		influxClient: event.context.influx.influxClient,
		botID: path.botID
	})

	const commands = await fetchFromInflux({
		measurement: "customCharts",
		start,
		stop,
		influxClient: event.context.influx.influxClient,
		botID: path.botID
	})

	const custom = await fetchFromInflux({
		measurement: "topCommands",
		start,
		stop,
		influxClient: event.context.influx.influxClient,
		botID: path.botID
	})

	const ownerInfo = await event.context.pgPool`SELECT * FROM owners WHERE ownerid = ${bot[0].ownerid}`.catch(() => {})
	const chartSettings = await event.context.pgPool`SELECT * FROM chartsettings WHERE botid = ${path.botID}`.catch(() => {})

	const outOBj = {
		botInfo: bot[0],
		ownerInfo: ownerInfo[0],
		chartSettings: chartSettings,
		// botSettings,
		botStats:{
			mainStats,
			commands,
			custom
		}
	}

	return Buffer.from(JSON.stringify(outOBj)).toString('base64')
})
export const schema = {
	// querystring: {
	// },
	"hidden": true,
	"tags": [
		"Internal"
	],
	responses: {
		404: {
			description: "Bot not found"
		},
		401: {
			description: "Not authorised"
		},
		200: {
			// type: 'object',
			// properties: {
			// 	mainStats: {
			// 		type: "array",
			// 		items: {
			// 			type: 'object',
			// 			properties: {
			// 				time: { type: 'string' },
			// 				type: { type: 'number' },
			// 				cpuUsage: { type: 'number' },
			// 				guildCount: { type: 'number' },
			// 				members: { type: 'number' },
			// 				ramUsage: { type: 'number' },
			// 				shardCount: { type: 'number' },
			// 				totalRam: { type: 'number' },
			// 				userCount: { type: 'number' },
			// 			}
			// 		}
			// 	},
			// 	commands: {
			// 		type: "array",
			// 		contains: { type: "object" }
			// 	},
			// 	custom: {
			// 		type: "array",
			// 		contains: { type: "object" }
			// 	}
			// }
		}
	}
}

const fetchFromInflux = async (options) => {
	const queryApi = options.influxClient.getQueryApi("disstat")

	const fluxQuery = flux`import "math"
	from(bucket:"defaultBucket")
	|> range(start: time(v: ${options.start}), stop: time(v: ${options.stop}))
	|> filter(fn: (r) => r._measurement == ${options.measurement})
	|> filter(fn: (r) => r["botid"] == ${options.botID})
	|> aggregateWindow(every: ${fluxDuration("1m")}, fn: mean, createEmpty: false)
    |> map(fn: (r) => ({r with _value: math.round(x: r._value)}))
	|> yield(name: "mean")`
	// this slows down requests by 9.92%
	// |> group(columns: ["_time", "_field"])

	let outData = [];
	for await (const { values, tableMeta } of queryApi.iterateRows(fluxQuery)) {
		const tableObject = tableMeta.toObject(values)

		const timeIndex = outData.findIndex(element => element.time === tableObject._time)
		if (timeIndex === -1) outData.push({
			time: tableObject._time,
			[tableObject._field]: tableObject._value
		})
		else outData[timeIndex][tableObject._field] = tableObject._value
	}

	return outData;
}