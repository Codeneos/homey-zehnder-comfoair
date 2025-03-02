import Homey from 'homey';
import ComfoControlDriver from './driver';
import { ComfoAirProperties, ComfoControlClient, VentilationUnitProperties } from 'lib-comfoair';
import driverCompose from './driver.compose.json';

interface ComfoControlDeviceSettings {
    pincode: string;
    address: string;
    port: string;
    serialNumber: string;
    model: string;
    modelNumber: string;
    firmwareVersion: string;
}

const capabiliesToProperty = {
    fan_mode: ComfoAirProperties.FAN_SPEED_SETTING,
    measure_power: ComfoAirProperties.CURRENT_VENTILATION_POWER_CONSUMPTION,
    meter_power: ComfoAirProperties.TOTAL_FROM_START_POWER_CONSUMPTION,
    measure_hepa_filter: ComfoAirProperties.DAYS_LEFT_BEFORE_FILTER_REPLACEMENT,
    measure_analog_input_1: ComfoAirProperties.ANALOG_VOLTAGE_1,
    measure_analog_input_2: ComfoAirProperties.ANALOG_VOLTAGE_2,
    measure_analog_input_3: ComfoAirProperties.ANALOG_VOLTAGE_3,
    measure_analog_input_4: ComfoAirProperties.ANALOG_VOLTAGE_4,
    measure_outdoor_temperature: ComfoAirProperties.OUTDOOR_AIR_TEMPERATURE,
    measure_outdoor_humidity: ComfoAirProperties.OUTDOOR_AIR_HUMIDITY,
    measure_indoor_temperature: ComfoAirProperties.EXTRACT_AIR_TEMPERATURE,
    measure_indoor_humidity: ComfoAirProperties.EXTRACT_AIR_HUMIDITY,
    measure_exhaust_fan_speed: ComfoAirProperties.EXHAUST_FAN_SPEED,
    measure_extract_fan_speed: ComfoAirProperties.SUPPLY_FAN_SPEED,
};

export = class ComfoControlDevice extends Homey.Device {
    private client!: ComfoControlClient;
    declare driver: ComfoControlDriver;

    private propertyHandlers: { [key: string]: (value: any, capability: string) => Promise<void> | void } = {
        measure_hepa_filter: this.onHepaFilterChange.bind(this),
        fan_mode: this.onFanModeChange.bind(this),
    };

    private capabilityHandlers: { [key: string]: (value: any, ops: any) => Promise<void> | void } = {
        fan_mode: this.onSetFanMode.bind(this),
        //'fan_operating_mode': this.onSetOperatingMode.bind(this),
    };

    public get uuid() {
        return this.getData().id;
    }

    public get settings(): ComfoControlDeviceSettings {
        return this.getSettings();
    }

    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        await this.setUnavailable('Initializing ComfoControl device');
        try {
            await this.syncCapabilities();
            await this.initClient();
            await this.initProperties();
            await this.setAvailable();
        } catch (error) {
            this.error(error);
            await this.setUnavailable(`${error}`);
        }
    }

    async initClient() {
        this.client = new ComfoControlClient({
            uuid: this.uuid,
            address: this.getStoreValue('address'),
            port: this.getStoreValue('port'),
            logger: {
                log:  this.log.bind(this),
            },
        });

        // Update the device settings with the actual values
        await this.setSettings({
            address: this.getStoreValue('address'),
            port: `${this.getStoreValue('port')}`,
            serialNumber: await this.client.readProperty(VentilationUnitProperties.NODE.SERIAL_NUMBER),
            model: await this.client.readProperty(VentilationUnitProperties.NODE.MODEL_NUMBER),
            firmwareVersion: `${await this.client.readProperty(VentilationUnitProperties.NODE.FIRMWARE_VERSION)}`,
            modelNumber: await this.client.readProperty(VentilationUnitProperties.NODE.ARTICLE_NUMBER),
        });
    }

    async initProperties() {
        // Add the properties to the device
        for (const [capability, property] of Object.entries(capabiliesToProperty)) {
            this.client.registerPropertyListener(property, (value) => this.onPropertyChange(capability, value.value));
        }

        for (const [capability, handler] of Object.entries(this.capabilityHandlers)) {
            this.registerCapabilityListener(capability, handler);
        }
    }

    /**
     * Sync the device capabilities with the driver capabilities and options.
     * Remove capabilities that are not in the driver capabilities and
     * add capabilities that are in the driver capabilities.
     *
     * Only call onInit to ensure that new capabilities are added when the driver is updated.
     */
    async syncCapabilities() {
        this.log(`Sync Capabilities...`);
        for (const capability of driverCompose.capabilities) {
            if (!this.hasCapability(capability)) {
                this.log(`Adding capability: ${capability}`);
                await this.addCapability(capability);
            }
        }

        for (const capability of this.getCapabilities()) {
            if (!driverCompose.capabilities.includes(capability)) {
                this.log(`Remove capability: ${capability}`);
                await this.removeCapability(capability);
            }
        }

        for (const [capability, options] of Object.entries(driverCompose.capabilitiesOptions)) {
            await this.setCapabilityOptions(capability, options);
        }
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded() {
        await this.setSettings({
            pincode: `${this.driver.pincodes[this.uuid] ?? 0}`
        });
    }

    private async onPropertyChange(capability: string, value: string | number | bigint | boolean) {
        try {
            if (capability in this.propertyHandlers) {
                await this.propertyHandlers[capability](value, capability);
            } else {
                if (typeof value === 'string') {
                    value = parseFloat(value);
                }
                await this.setCapabilityValue(capability, value);
            }
            this.log(`Update [${capability}] = ${value}`);
        } catch (error) {
            this.error(`Failed to set [${capability}] = ${value}`, error);
        }
    }

    private async onHepaFilterChange(value: number, capability: string) {
        const hepaMeasure = Math.max(Math.min((value / 180) * 100, 100), 0);
        this.log(`Hepa filter days remaining: ${value} (${hepaMeasure.toFixed(0)}%)`);
        await this.setCapabilityValue(capability, Math.ceil(hepaMeasure));
    }

    private async onFanModeChange(value: number, capability: string) {
        await this.setCapabilityValue(capability, value.toString());
    }

    private async onSetFanMode(value: string) {
        await this.client.setFanMode(parseInt(value));
    }

    private async onSetOperatingMode(value: boolean) {
        await this.client.setOperatingMode(value ? 1 : 0);
    }

    /**
     * onSettings is called when the user updates the device's settings.
     * @param {object} event the onSettings event data
     * @param {object} event.oldSettings The old settings object
     * @param {object} event.newSettings The new settings object
     * @param {string[]} event.changedKeys An array of keys changed since the previous version
     * @returns {Promise<string|void>} return a custom message that will be displayed
     */
    async onSettings({
        oldSettings,
        newSettings,
        changedKeys,
    }: {
        oldSettings: { [key: string]: boolean | string | number | undefined | null };
        newSettings: { [key: string]: boolean | string | number | undefined | null };
        changedKeys: string[];
    }): Promise<string | void> {
        this.log('MyDevice settings where changed');
    }

    /**
     * Update the device settings
     * @param settings The new settings to set
     */
    public async setSettings(settings: Partial<ComfoControlDeviceSettings>) {
        super.setSettings(settings);
    }

    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name: string) {
        this.log('MyDevice was renamed');
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted() {
        this.log('MyDevice has been deleted');
    }
};
