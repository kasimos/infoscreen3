import fs from 'fs';
import config from '../config.js';
import cli from './cli.js';

import display from './display.js';
import admin from './admin.js';
import SettingsManager from './settingsManager.js';

let settingsManager = new SettingsManager()

/**
 *
 */
export default class settings {

    /**
     * @param sharedIO
     * @param dispatcher
     * @param screenView
     * @param adminView
     * @param bundleManager
     */
    constructor(sharedIO, dispatcher, screenView, adminView, bundleManager) {
        /**
         * @typedef {string[]} previewInstance
         * @property {string} adminId is string from admin socket.Id
         * @property {object} preview, pure previews socket
         *
         * @type {object}
         */
        let io = sharedIO.of("/admin-settings");
        this.io = io;
        this.previewInstances = [];
        this.screenView = screenView;

        let self = this;

        io.on("connection", function (socket) {
            cli.success("WS " + socket.conn.remoteAddress + " connect with id:" + socket.id);


            socket.on('error', function (error) {
                cli.error(error, "WS error on socket id:" + socket.id);
                for (let i in self.previewInstances) {
                    if (self.previewInstances[i].adminId === socket.id || self.previewInstances[i].preview === socket) {
                        self.previewInstances.splice(i, 1);
                        break;
                    }
                }
            });

            socket.on('disconnect', function (reason) {
                for (let i in self.previewInstances) {
                    if (self.previewInstances[i].adminId === socket.id || self.previewInstances[i].preview === socket) {
                        self.previewInstances.splice(i, 1);
                        break;
                    }
                }
                cli.success("WS " + reason + " " + socket.conn.remoteAddress + " socket id:" + socket.id);
            });

            socket.on('settings.renameDisplay', function (data) {
                let display = config.displays.find((d) => d.id === parseInt(data.id))
                if (!display) {
                    cli.error('Renaming Display failed, not found with id:' + data.id)
                    socket.emit("callback.error", "Renaming Display failed");
                    return
                }
                display.name = data.name
                settingsManager.saveSettings()
            });

            socket.on('settings.createDisplay', function (data) {
                let newDisplay = {
                    name: 'New Display',
                    bundle: "default",
                    id: 0
                }
                if (config.displays.length > 0) {
                    newDisplay.id = config.displays.reduce((p, c) => (p && p.id > c.id) ? p : c).id+1
                }
                config.displays.push(newDisplay)

                let view = new display(sharedIO, dispatcher, newDisplay, newDisplay.id, bundleManager);
                view.changeBundle('default')
                screenView.push(view);
                adminView.push(new admin(sharedIO, dispatcher, view, newDisplay.id, bundleManager));
                socket.emit('callback.settingsReload')
                settingsManager.saveSettings()                
            });

            socket.on('settings.removeDisplay', function (data) {
                console.log(data)
                let displayIdx = config.displays.findIndex((d) => d.id === parseInt(data.id))
                if (!displayIdx) {
                    cli.error('Removing Display failed, not found with id:' + data.id)
                    socket.emit("callback.error", "Removing Display failed");
                    socket.emit('callback.settingsReload')
                    return
                }
                config.displays.splice(displayIdx, 1); 
                let removedScreenView = screenView.splice(displayIdx, 1)
                removedScreenView[0].destroy() 
                adminView.splice(displayIdx, 1)   
                socket.emit('callback.settingsReload')
                settingsManager.saveSettings()
            });

            socket.on('settings.changeSettingValue', function (data) {
                if (!Object.hasOwn(config, data.id)) {
                    cli.error('Editing setting failed, not found with id:' + data.id)
                    socket.emit("callback.error", "Changing Setting value failed");
                    return
                }
                if (data.id === 'accesskey' && data.value.toLowerCase() === "false") {
                    data.value = false
                }
                config[data.id] = data.value
                settingsManager.saveSettings()
            });

            socket.on('settings.editGuardrail', function (data) {
                if (!Object.hasOwn(config.guardRails, data.id)) {
                    cli.error('Editing guardrail failed, not found with id:' + data.id)
                    socket.emit("callback.error", "Editing guardrail failed");
                    return 
                }
                try {
                    config.guardRails[parseInt(data.id)] = JSON.parse(data.value)
                } catch (e) {
                    cli.error('Editing guardrail failed:' + e)
                    socket.emit("callback.error", "Error saving guardrail, Please make sure it is a proper JSON.");
                    return 'failed'
                }
                settingsManager.saveSettings()
            });
        }); // io
    }

}

// function saveSettings() {
//     try {
//         fs.writeFileSync(process.cwd() + "/data/settings.json", JSON.stringify({
//             displays: config.displays  
            
//         }, null, "\t"));
//     } catch (e) {
//         cli.error("error while saving file:", e);
//     }
// }