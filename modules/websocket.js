import config from '../config.js';
let availableDisplays = config.displays;
import display from './display.js';
import admin from './admin.js';
import adminLobby from './adminLobby.js';
import settings from './settings.js';
import cli from './cli.js';
import _bundleManager from './bundleManager.js';
import chalk from 'chalk';
import fs from 'fs';

/**
 * @param server
 * @param app
 * @param io
 * @param dispatcher
 * @return {{screenView: display[], adminView: admin[], bundleManager: bundleManager}}
 */
export default function (pluginManager, io, dispatcher) {
    /**
     * @type {display[]}
     */
    let screenView = [];

    /** @type {admin[]} */
    let adminView = [];

    console.log(chalk.green(">> ") + "InfoScreen3" + chalk.green("<<"));
    cli.log("Checking for write permissions...");

    try {
        fs.accessSync(process.cwd() + "/data", fs.W_OK);
        cli.success("data directory (./data) is writable");
    } catch (err) {
        cli.error("data directory (./data) is not writable", err);
        process.exit(1);
    }

    try {
        fs.accessSync(process.cwd() + "/trash", fs.W_OK);
        cli.success("trash directory (./trash) is writable");
    } catch (err) {
        cli.error("trash directory (./trash) is not writable", err);
        process.exit(1);
    }

    try {
        fs.accessSync(process.cwd() + "/tmp", fs.W_OK);
        cli.success("temp directory (./tmp) is writable ");
        let tempFiles = fs.readdirSync(process.cwd() + "/tmp/", {
            dotfiles: false
        });
        cli.info("removing temp-files...");
        for (let file of tempFiles) {
            if (file !== ".gitkeep") {
                fs.unlinkSync(process.cwd() + "/tmp/" + file);
            }
        }
        cli.info("done.");

    } catch (err) {
        cli.error("temp directory (./tmp) is not writable", err);
        process.exit(1);
    }

    cli.info("Starting bundle manager...");

    let bundleManager = new _bundleManager();

    cli.info("Starting websocket backend...");

    let screenId = 0;

    // create screens and admin socket interfaces
    for (let metadata of availableDisplays) {
        if (!metadata.id) {
            metadata.id = screenId;
        }
        let view = new display(io, dispatcher, metadata, /*metadata.id*/screenId, bundleManager);
        screenView.push(view);
        adminView.push(new admin(io, dispatcher, view, /*metadata.id*/screenId, bundleManager));
        screenId += 1;
    }

    let settingsHandler = new settings(io, dispatcher, screenView, adminView, bundleManager);
    let adminLobby1 = new adminLobby(io, dispatcher, screenView, adminView, bundleManager);
    // create lobby
    io.of("/lobby").on("connection", function (socket) {
       // cli.info("WS/" + socket.conn.remoteAddress + " connect");

        socket.on('error', function (error) {
            cli.error(error, "WS/ error");
        });

        socket.on('disconnect', function (reason) {
           // cli.info("WS/ " + reason + " " + socket.conn.remoteAddress);
        });

        socket.on('displays', function () {
            let previewImages = [];
            for (let display of screenView) {
                if (display.serverOptions.currentMeta.type === "slide") {
                    previewImages.push("/render/" + display.serverOptions.currentBundle + "/" + display.serverOptions.currentFile + ".png");
                } else {
                    previewImages.push("/img/nopreview.png");
                }
            }
            socket.emit("callback.displays", { displays: availableDisplays, previewImages: previewImages });
        });
    });

    return { screenView: screenView, adminView: adminView, bundleManager: bundleManager };
};

