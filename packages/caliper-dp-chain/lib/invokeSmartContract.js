/*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

'use strict';

const {
    CaliperUtils,
    TxStatus
} = require('@hyperledger/caliper-core');
const dpChainApi = require('./dpChainApi');
const { TxErrorEnum, findContractAddress } = require('./common');
const commLogger = CaliperUtils.getLogger('invokeSmartContract.js');

module.exports.run = async function (dpChainSettings, request) {
    
    const networkConfig = dpChainSettings.network;
    const account = dpChainSettings.config.account;

    let invokeStatus = new TxStatus(account);
    invokeStatus.SetFlag(TxErrorEnum.NoError);
    let receipt = null;
    try {

        if (request.readOnly) {
            receipt = await dpChainApi.call(networkConfig, request.contractName, request.functionName, request.args);
        } else {
            receipt = await dpChainApi.sendTransaction(networkConfig, request.contractName, request.functionName, request.args);
        }
        receipt = JSON.parse(receipt)
        invokeStatus.SetID(1);
        invokeStatus.SetResult(receipt);
        invokeStatus.SetVerification(true);
        
        if (receipt.error === undefined && receipt.code === 200 ) {
            //commLogger.error('invoke contract: ' + JSON.stringify(receipt)+ JSON.stringify(request));
            invokeStatus.SetStatusSuccess();
        } else {
            commLogger.error('Failed to invoke contract: ' + JSON.stringify(receipt));
            invokeStatus.SetStatusFail();
        }

        return invokeStatus;
    } catch (error) {
        commLogger.error(`Failed to invoke smart contract ${request.functionName}: ${JSON.stringify(error)}`);
        throw error;
    }
};
