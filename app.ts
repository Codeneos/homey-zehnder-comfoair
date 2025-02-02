import Homey from 'homey';
import { Logger, LogLevel } from 'lib-comfoair';

export = class ZehnderComfoControl extends Homey.App {
    /**
     * onInit is called when the app is initialized.
     */
    async onInit() {
        Logger.getRoot().setLogLevel(LogLevel.INFO);
    }
};
