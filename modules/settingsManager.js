import fs from 'fs';
import { create, extract } from 'tar';
import config from '../config.js';
import cli from './cli.js';

const usableParams = [
    'streamKey',
    'streamName',
    'streamProtocol',
    'accesskey',
    'guardRails',
    'displays',
    'maxFileSize',
    'exportDataCompression',
    'colors',
    'useLocalAssets'
];

export default class SettingsManager {

    getUsableConfig() {
        let usableConfig = {};
        for (let i in usableParams) {
            usableConfig[usableParams[i]] = config[usableParams[i]];
        }
        return  usableConfig;
    };


    loadSettings() {
        let settingsData = JSON.parse(fs.readFileSync("./data/settings.json").toString());
        return settingsData
    };

    saveSettings() {
        try {
            fs.writeFileSync(process.cwd() + "/data/settings.json", JSON.stringify(this.getUsableConfig(), null, "\t"));
        } catch (e) {
            cli.error("error while saving file:", e);
        }
    };

    importSettings(newConfig) {
        for (let i in usableParams) {
            if (newConfig[usableParams[i]] !== undefined) {
                config[usableParams[i]] = newConfig[usableParams[i]];
            }
        }
        this.saveSettings();
    };

    async exportData() {
        try{
            await create(
            {
              gzip: config["exportDataCompression"],
              file:"./data/data.tgz"
            },
            ["./data/backgrounds", "./data/bundles", "./data/video"]
          );
          let tarData = fs.readFileSync("./data/data.tgz");
          return tarData;
        } catch(e) {
            cli.error("Error during Data Export " + e);
        }
    }

    async importData(data) {
        const importFilePath = './data/import'
        try{
            //first save file to local importFolder, will be removed in anycase
            fs.writeFileSync(importFilePath, data)
            await extract(
            {
              file:importFilePath
            }
          );
        } catch(e) {
            cli.error("Error during Data Export " + e);
        }
        fs.rmSync(importFilePath)
    }

}