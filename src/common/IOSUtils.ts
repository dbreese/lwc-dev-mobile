/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
import { Logger } from '@salesforce/core';
import childProcess from 'child_process';
import cli from 'cli-ux';
import util from 'util';
import iOSConfig from '../config/iosconfig.json';
import { PreviewUtils } from './Common';
import { IOSSimulatorDevice } from './IOSTypes';

const exec = util.promisify(childProcess.exec);

const XCRUN_CMD = '/usr/bin/xcrun';
const DEVICE_TYPE_PREFIX = 'com.apple.CoreSimulator.SimDeviceType';
const RUNTIME_TYPE_PREFIX = 'com.apple.CoreSimulator.SimRuntime';

export class XcodeUtils {
    public static async bootDevice(udid: string): Promise<boolean> {
        const command = `${XCRUN_CMD} simctl boot ${udid}`;
        try {
            const { stdout } = await XcodeUtils.executeCommand(command);
        } catch (error) {
            if (!XcodeUtils.isDeviceAlreadyBootedError(error)) {
                return new Promise<boolean>((resolve, reject) => {
                    reject(
                        `The command '${command}' failed to execute ${error}`
                    );
                });
            }
        }
        return new Promise<boolean>((resolve, reject) => {
            resolve(true);
        });
    }

    public static async createNewDevice(
        simulatorName: string,
        deviceType: string,
        runtime: string
    ): Promise<string> {
        const command = `${XCRUN_CMD} simctl create ${simulatorName} ${DEVICE_TYPE_PREFIX}.${deviceType} ${RUNTIME_TYPE_PREFIX}.${runtime}`;
        try {
            const { stdout } = await XcodeUtils.executeCommand(command);
            return new Promise<string>((resolve, reject) => {
                resolve(stdout.trim());
            });
        } catch (error) {
            return new Promise<string>((resolve, reject) => {
                reject(`The command '${command}' failed to execute ${error}`);
            });
        }
    }

    public static async getSimulator(
        simulatorName: string
    ): Promise<IOSSimulatorDevice | null> {
        return new Promise(async (resolve, reject) => {
            try {
                const devices = await XcodeUtils.getSupportedSimulators();
                for (const device of devices) {
                    if (simulatorName.match(device.name)) {
                        return resolve(device);
                    }
                }
            } catch (exception) {
                XcodeUtils.logger.warn(exception);
            }

            XcodeUtils.logger.info(
                `Unable to find simulator: ${simulatorName}`
            );
            return resolve(null);
        });
    }

    public static async getSupportedSimulators(): Promise<
        IOSSimulatorDevice[]
    > {
        return new Promise(async (resolve, reject) => {
            let devices: IOSSimulatorDevice[] = [];
            try {
                const devicesCmd = `${XCRUN_CMD} simctl list --json devices available`;
                const supportedRuntimes = await XcodeUtils.getSupportedRuntimes();
                const { stdout } = await XcodeUtils.executeCommand(devicesCmd);
                devices = IOSSimulatorDevice.parseJSONString(
                    stdout,
                    supportedRuntimes
                );
            } catch (runtimesError) {
                XcodeUtils.logger.warn(runtimesError);
            }
            return resolve(devices);
        });
    }

    public static async executeCommand(
        command: string
    ): Promise<{ stdout: string; stderr: string }> {
        return exec(command);
    }

    public static async getSupportedDevices(): Promise<string[]> {
        const runtimesCmd = `${XCRUN_CMD} simctl list  --json devicetypes`;
        const identifier = 'identifier';
        const deviceTypesKey = 'devicetypes';
        const deviceMatchRegex = /SimDeviceType.iPhone-[8,1,X]/;
        let error = new Error(
            'xcrun simctl list devicestypes returned an empty list'
        );
        try {
            const { stdout } = await XcodeUtils.executeCommand(runtimesCmd);
            const devicesObj: any = JSON.parse(stdout);
            const devices: any[] = devicesObj[deviceTypesKey] || [];
            const matchedDevices: any[] = devices.filter((entry) => {
                return (
                    entry[identifier] &&
                    entry[identifier].match(deviceMatchRegex)
                );
            });

            if (matchedDevices) {
                return new Promise<string[]>((resolve, reject) =>
                    resolve(
                        matchedDevices.map(
                            (entry) => entry.identifier.split('.')[4]
                        )
                    )
                );
            }
        } catch (runtimesError) {
            error = runtimesError;
        }
        return new Promise<string[]>((resolve, reject) =>
            reject(`Could not find any available devices. ${error.message}`)
        );
    }

    public static async getSupportedRuntimes(): Promise<string[]> {
        const configuredRuntimes = await XcodeUtils.getSimulatorRuntimes();
        const supportedRuntimes: string[] = iOSConfig.supportedRuntimes;
        const rtIntersection = configuredRuntimes.filter(
            (configuredRuntime) => {
                const responsiveRuntime = supportedRuntimes.find(
                    (supportedRuntime) =>
                        configuredRuntime.startsWith(supportedRuntime)
                );
                return responsiveRuntime !== undefined;
            }
        );

        if (rtIntersection.length > 0) {
            return new Promise<string[]>((resolve, reject) =>
                resolve(rtIntersection)
            );
        } else {
            return new Promise<string[]>((resolve, reject) => reject());
        }
    }

    public static async getSimulatorRuntimes(): Promise<string[]> {
        const runtimesCmd = `${XCRUN_CMD} simctl list --json runtimes available`;
        const runtimeMatchRegex = /.*SimRuntime\.((iOS|watchOS|tvOS)-[\d\-]+)$/;
        const RUNTIMES_KEY = 'runtimes';
        const ID_KEY = 'identifier';

        try {
            const { stdout } = await XcodeUtils.executeCommand(runtimesCmd);
            const runtimesObj: any = JSON.parse(stdout);
            const runtimes: any[] = runtimesObj[RUNTIMES_KEY] || [];
            let filteredRuntimes = runtimes.filter((entry) => {
                return entry[ID_KEY] && entry[ID_KEY].match(runtimeMatchRegex);
            });
            filteredRuntimes = filteredRuntimes.sort().reverse();
            filteredRuntimes = filteredRuntimes.map((entry) => {
                return (entry[ID_KEY] as string).replace(
                    runtimeMatchRegex,
                    '$1'
                );
            });
            if (filteredRuntimes && filteredRuntimes.length > 0) {
                return new Promise<string[]>((resolve, reject) =>
                    resolve(filteredRuntimes)
                );
            }
        } catch (runtimesError) {
            return new Promise<string[]>((resolve, reject) =>
                reject(
                    `The command '${runtimesCmd}' failed: ${runtimesError}, error code: ${runtimesError.code}`
                )
            );
        }
        return new Promise<string[]>((resolve, reject) =>
            reject(
                `The command '${runtimesCmd}'  could not find available runtimes`
            )
        );
    }
    public static async waitUntilDeviceIsReady(udid: string): Promise<boolean> {
        const command = `${XCRUN_CMD} simctl bootstatus "${udid}"`;
        try {
            const { stdout } = await XcodeUtils.executeCommand(command);
            return new Promise<boolean>((resolve, reject) => {
                resolve(true);
            });
        } catch (error) {
            return new Promise<boolean>((resolve, reject) => {
                reject(`The command '${command}' failed to execute ${error}`);
            });
        }
    }

    public static async launchSimulatorApp(): Promise<boolean> {
        const command = `open -a Simulator`;
        return new Promise(async (resolve, reject) => {
            try {
                const { stdout } = await XcodeUtils.executeCommand(command);
                resolve(true);
            } catch (error) {
                reject(`The command '${command}' failed to execute ${error}`);
            }
        });
    }

    public static async launchURLInBootedSimulator(
        udid: string,
        url: string
    ): Promise<boolean> {
        const command = `${XCRUN_CMD} simctl openurl "${udid}" ${url}`;
        try {
            const { stdout } = await XcodeUtils.executeCommand(command);
            return new Promise<boolean>((resolve, reject) => {
                resolve(true);
            });
        } catch (error) {
            return new Promise<boolean>((resolve, reject) => {
                reject(`The command '${command}' failed to execute: ${error}`);
            });
        }
    }

    public static async openUrlInNativeBrowser(
        url: string,
        udid: string,
        spinner: typeof cli.action
    ): Promise<boolean> {
        return XcodeUtils.launchSimulatorApp()
            .then(() => {
                spinner.start(`Launching`, `Starting device ${udid}`, {
                    stdout: true
                });
                return XcodeUtils.bootDevice(udid);
            })
            .then(() => {
                spinner.start(
                    `Launching`,
                    `Waiting for device ${udid} to boot`,
                    {
                        stdout: true
                    }
                );
                return this.waitUntilDeviceIsReady(udid);
            })
            .then(() => {
                spinner.stop(`Opening Browser with url ${url}`);
                return this.launchURLInBootedSimulator(udid, url);
            });
    }

    public static async launchAppInBootedSimulator(
        udid: string,
        compName: string,
        projectDir: string,
        targetApp: string,
        targetAppArguments: string
    ): Promise<boolean> {
        let launchArgs =
            `${PreviewUtils.COMPONENT_NAME_ARG_PREFIX}=${compName}` +
            ` ${PreviewUtils.PROJECT_DIR_ARG_PREFIX}=${projectDir}`;
        if (targetAppArguments.length > 0) {
            launchArgs += ` ${PreviewUtils.CUSTOM_ARGS_PREFIX}=${targetAppArguments}`;
        }

        const terminateCommand = `${XCRUN_CMD} simctl terminate "${udid}" ${targetApp}`;
        const launchCommand = `${XCRUN_CMD} simctl launch "${udid}" ${targetApp} ${launchArgs}`;

        // attempt at terminating the app first (in case it is already running) and then try to launch it again with new arguments.
        // if we hit issues with terminating, just ignore and continue.
        try {
            await XcodeUtils.executeCommand(terminateCommand);
        } catch {
            // ignore and continue
        }

        try {
            const { stdout } = await XcodeUtils.executeCommand(launchCommand);
            return new Promise<boolean>((resolve, reject) => {
                resolve(true);
            });
        } catch (error) {
            return new Promise<boolean>((resolve, reject) => {
                reject(
                    `The command '${launchCommand}' failed to execute: ${error}`
                );
            });
        }
    }

    public static async launchNativeApp(
        compName: string,
        compPath: string,
        targetApp: string,
        targetAppArguments: string,
        udid: string,
        spinner: typeof cli.action
    ): Promise<boolean> {
        return XcodeUtils.launchSimulatorApp()
            .then(() => {
                spinner.start(`Launching`, `Starting device ${udid}`, {
                    stdout: true
                });
                return XcodeUtils.bootDevice(udid);
            })
            .then(() => {
                spinner.start(
                    `Launching`,
                    `Waiting for device ${udid} to boot`,
                    {
                        stdout: true
                    }
                );
                return this.waitUntilDeviceIsReady(udid);
            })
            .then(() => {
                spinner.stop(`Launching App ${targetApp}`);
                return this.launchAppInBootedSimulator(
                    udid,
                    compName,
                    compPath,
                    targetApp,
                    targetAppArguments
                );
            });
    }

    private static logger: Logger = new Logger('force:lightning:mobile:ios');

    private static isDeviceAlreadyBootedError(error: Error): boolean {
        return error.message
            ? error.message.toLowerCase().match('state: booted') !== null
            : false;
    }
}

// XcodeUtils.getSupportedDevices()
//     .then((runtimeDevices) => {
//         console.log(`runtimeDevices: ${runtimeDevices}`);
//     })
//     .catch((error) => {
//         console.log(error);
//     });
