// https://nuxt.com/docs/api/configuration/nuxt-config
import {oauth2} from './config.mjs'
export default defineNuxtConfig({

  devtools: {
    enabled: true,
    // "port":443
  },

  css: ['@materializecss/materialize/dist/css/materialize.min.css'],
  plugins: [{ src: '~/plugins/materialize.js', mode: 'client' },
  { src: '~/plugins/auth.js', mode: 'client' }

  ],
  routeRules:{
    '/login': {
      redirect: {
        to:`https://discord.com/api/oauth2/authorize?client_id=${oauth2.clientID}&response_type=code&redirect_uri=${encodeURIComponent(oauth2.apihost + "/discordOauth/callback")}&scope=identify&prompt=none`,
        statusCode: 308
      }
    }
  },
  "dev": true,
  devServer: {
    "https": false,
    "host": "0.0.0.0",
    // port: 80,
    // "url": "https://local.numselli.xyz",
  },
  vite: {
    "server": {
      "hmr": {
        // host: "local.numselli.xyz",
        // "port": 443,
        // protocol: "wss"
      }
    }
  }
})