import { Logger, LoggerLevel } from '@salesforce/core';

export interface CheckRequirementsFunc {
    (): Promise<string>;
}

export interface Requirement {
    title: string;
    checkFunction: CheckRequirementsFunc;
    fulfilledMessage: string;
    unfulfilledMessage: string;
    logger: Logger;
}

export interface SetupTestCase {
    testResult: string;
    message: string;
    hasPassed: boolean;
}

export interface SetupTestResult {
    hasMetAllRequirements: boolean;
    tests: Array<SetupTestCase>;
}

export interface RequirementList {
    requirements: Requirement[];
    executeSetup(): Promise<SetupTestResult>;
}

export interface Launcher {
    launchNativeBrowser(url: string): Promise<void>;
}

// This function wraps existing promises with the intention to allow the collection of promises 
// to settle when used in conjunction with Promise.all(). Promise.all() by default executes until the first
// rejection. We are looking for the equivalent of Promise.allSettled() which is scheduled for ES2020.
// Once the functionality is  available  in the near future this function can be removed.  
// See https://github.com/tc39/proposal-promise-allSettled

export function WrappedPromise(promise: Promise<any>) {
    return promise.then(
        function(v) {
            return { v: v, status: 'fulfilled' };
        },
        function(e) {
            return { e: e.message, status: 'rejected' };
        }
    );
}

export abstract class BaseSetup implements RequirementList {
    requirements: Requirement[];
    protected logger: Logger;

    constructor(logger: Logger) {
        this.requirements = [];
        this.logger = logger;
    }

    async executeSetup(): Promise<SetupTestResult> {
        let allPromises: Array<Promise<any>> = [];
        this.requirements.forEach(requirement =>
            allPromises.push(WrappedPromise(requirement.checkFunction()))
        );
        let logger = this.logger;
        return Promise.all(allPromises).then(function(results) {
            let testResult: SetupTestResult = {
                hasMetAllRequirements: true,
                tests: []
            };
            results.forEach(function(result) {
                if (result.status === 'fulfilled') {
                    testResult.tests.push({
                        testResult: '✅',
                        hasPassed: true,
                        message: result.v
                    });
                } else if (result.status === 'rejected') {
                    testResult.hasMetAllRequirements = false;
                    testResult.tests.push({
                        testResult: '❌',
                        hasPassed: false,
                        message: result.e
                    });
                }
            });
            if (logger.shouldLog(LoggerLevel.DEBUG)) {
                console.table(testResult.tests, ['testResult', 'message']);
            }
            return Promise.resolve(testResult);
        });
    }
}