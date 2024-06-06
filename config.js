import 'dotenv/config'
import SettingsManager from './modules/settingsManager.js'

const host = "127.0.0.1"  // ip of the infoscreen interface, use external address if not develoment
const port = 8000;        // port for infoscreen


let hostUrl = "http://" + (process.env.HOST || host) + ":" + (process.env.PORT || port);
if (process.env.FRONT_PROXY == "true") hostUrl = "https://" + (process.env.HOST || host);

// By default add 4:3 guardrails to have a backward compatible behavior
// Allow any kind of other line to be configured in a json representation
// of this array in the .env file
let defaultGuardRails = [{
    line: [240, 0, 240, 1080],
    stroke: "#ccc",
    strokeWidth: 4,
    opacity: 0.5
},
{
    line: [1680, 0, 1680, 1080],
    stroke: "#ccc",
    strokeWidth: 4,
    opacity: 0.5
}]

let settingsData = new SettingsManager().loadSettings();
if (process.env.OVERRIDE_SETTINGS) {
    settingsData.streamKey = process.env.STREAMKEY;
    settingsData.streamName = process.env.STREAMNAME;
    settingsData.streamKey = process.env.STREAMKEY;
    settingsData.streamProtocol = process.env.STREAMPROTOCOL;
    settingsData.accesskey = process.env.ACCESSKEY;
    settingsData.guardRails = JSON.parse(process.env.GUARDRAILS);
}

export default {
    "serverListenPort": process.env.PORT || port,
    "serverHost": process.env.HOST || host,
    "serverUrl": hostUrl,
    "sessionKey": process.env.SESSIONKEY || "generateSecret", // used for encrypting cookies
    "streamKey": settingsData.streamKey || 'INFOSCREEN3',  // stream key for rtmp end point
    "streamName": settingsData.streamName || 'live',
    "streamProtocol": settingsData.streamProtocol || 'http',
    "useLocalAssets": settingsData.useLocalAssets || false,    // used to load javascript libraries locally from /public/assets
    "mediaServer": true,//(process.env.MEDIASERVER == "true") ? true : false,       // local streaming server for rtmp, see docs how to use
    "defaultLocale": process.env.LOCALE || "en",      // currently supported values are: "en","fi"
    "accesskey": settingsData.accesskey || false,
    "maxFileSize": settingsData.maxFileSize || 2050,
    "colors": settingsData.colors || [],
    "guardRails": settingsData.guardRails || defaultGuardRails,
    /*
     * Plugins
     */
    "plugins": [
        // "profiler", // display memory statistics at console.
    ],

    /*
     * Administrators
     */
    "admins": [
        {
            "id": 1,
            "displayName": "Administrator",
            "username": process.env.ADMIN_USER || "admin",
            "password": process.env.ADMIN_PASS || "admin",
            "permissions": {
                "isAdmin": true,
                "dashboard": {
                    "addBundle": true,
                    "addSlides": true,
                    "addWebPage": true,
                }
            }
        },
        {
            "id": 2,
            "displayName": "Display Viewer",
            "username": process.env.USER || "view",
            "password": process.env.PASS || "view",
            "permissions": {
                "isAdmin": false,
            }
        }
    ],
    "displays": settingsData.displays
};
