import fs from 'fs';
import cli from './cli.js'
import config from '../config.js';

export default class SettingsManager {

    loadSettings() {
        let settingsData = JSON.parse(fs.readFileSync("./data/settings.json").toString());
        return settingsData
    }

    saveSettings() {
        try {
            fs.writeFileSync(process.cwd() + "/data/settings.json", JSON.stringify(
                {
                    "displays": config.displays,
                    "guardRails": config.guardRails,
                    "streamKey": config.streamKey,
                    "streamName": config.streamName,
                    "streamProtocol": config.streamProtocol,
                    "accesskey": config.accesskey
                }, null, "\t"));
        } catch (e) {
            cli.error("error while saving file:", e);
        }
    }

}