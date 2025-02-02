import Homey from 'homey';
import { ComfoControlClient, VentilationUnitProperties } from 'lib-comfoair';

import type { PairSession } from 'homey/lib/Driver';

export = class ComfoControlDriver extends Homey.Driver {
    /**
     * Stores pincodes collected during pairing process mapped by device ID. This is emptied
     * when the driver is reloaded and should only be used on device added from the device class.
     */
    public readonly pincodes: Record<string, number> = {};

    public async onPair(session: PairSession) {
        session.setHandler('list_devices', this.onPairListDevices.bind(this));
        session.setHandler('list_devices_selection', this.onDeviceSelection.bind(this, session));
        session.setHandler('pincode', this.onPinCode.bind(this, session));
    }

    /**
     * onPairListDevices is called when a user is adding a device and the 'list_devices' view is called.
     * This should return an array with the data of devices that are available for pairing.
     */
    public async onPairListDevices() {
        const results = await ComfoControlClient.discover({ timeout: 10000 });
        return Promise.all(
            results.map(async (discoveryResult) => {
                const client = new ComfoControlClient(discoveryResult);
                const serial = await client.readProperty(VentilationUnitProperties.NODE.SERIAL_NUMBER);
                const model = await client.readProperty(VentilationUnitProperties.NODE.MODEL_NUMBER);
                return {
                    name: model,
                    data: {
                        id: discoveryResult.uuid,
                    },
                    store: {
                        address: discoveryResult.address,
                        port: discoveryResult.port,
                        serial,
                    },
                };
            }),
        );
    }

    private async onDeviceSelection(session: any, selectedDevices: any[]) {
        session.selectedDevices = selectedDevices;
    }

    private async onPinCode(session: any, pincode: string[]) {
        this.pincodes[session.selectedDevices[0].data.id] = parseInt(pincode.join(''));
        return true;
    }
};
