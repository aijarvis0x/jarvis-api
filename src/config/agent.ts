// {
// 	"agents": [
// 			{
// 					"id": "95654c56-888a-0d17-bc32-57df8d1dedc3",
// 					"name": "MonAnime",
// 					"clients": []
// 			},
// 			{
// 					"id": "e1fc0723-cc1c-0b66-9b71-15a5303c33a3",
// 					"name": "MonDoctor",
// 					"clients": []
// 			},
// 			{
// 					"id": "261a5a1d-75b0-0a2c-9fd9-da7e1ad06932",
// 					"name": "MonTrader",
// 					"clients": []
// 			}
// 	]
// }

export type AgentTypeConfig = {
	name: string,
	parentAgentId: string
}

export const agentTypeConfig: Record<number, AgentTypeConfig> = {
	0: {
		name: "MonCryptoMan",
		parentAgentId: "261a5a1d-75b0-0a2c-9fd9-da7e1ad06932"
	},
	1: {
		name: "MonNurse",
		parentAgentId: "e1fc0723-cc1c-0b66-9b71-15a5303c33a3"
	},
	2: {
		name: "MonAnime",
		parentAgentId: "95654c56-888a-0d17-bc32-57df8d1dedc3"
	}
}