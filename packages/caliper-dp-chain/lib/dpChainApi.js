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

const CaliperUtils = require('@hyperledger/caliper-core').CaliperUtils;
const fs = require('fs');
const path = require('path');
const ora = require('ora');
const isArray = require('isarray');
const web3Sync = require('./web3lib/web3sync');
const channelPromise = require('./channelPromise');
const requestPromise = require('request-promise');
const assert = require('assert');
const events = require('events');
const commLogger = CaliperUtils.getLogger('dpChainApi.js');
const solc = require('solc');

/**
 * Select a node from node list randomly
 * @param {Array} nodes Node list
 * @return {Object} Node
 */
function selectNode(nodes) {
    return nodes[Math.floor(Math.random() * nodes.length)];
}

module.exports.getBlockNumber = async function (networkConfig) {
    let node = selectNode(networkConfig.nodes);
    // Use RPC
    let requestData = {
        method: 'GET',
        uri: `http://${node.ip}:${node.rpcPort}/block/blockNumber`,
        json: true,
        body: {}
    };
    return requestPromise(requestData);
};

let currentBlockNumber = -1;
let initializeBlockNumberEventEmitter = new events.EventEmitter();
let initializationPromise = null;

/**
 * Update current block number periodically
 * @param {Object} networkConfig Config of network
 */
async function updateCurrentBlockNumber(networkConfig) {
    module.exports.getBlockNumber(networkConfig).then((result) => {
        if (!result.error && result.result) {
            let blockNumber = parseInt(result.data);
            if (blockNumber > currentBlockNumber) {
                if (currentBlockNumber === -1) {
                    initializeBlockNumberEventEmitter.emit('initialized');
                }
                currentBlockNumber = blockNumber;
            }

            setTimeout(updateCurrentBlockNumber, 2000, networkConfig);
            return Promise.resolve(true);
        } else {
            commLogger.warn(`Update current block number failed, result=${JSON.stringify(result)}`);
            return Promise.reject();
        }
    }).catch(async (reason) => {
        await CaliperUtils.sleep(2000);
        updateCurrentBlockNumber(networkConfig);
    });
}

/**
 * Get current block number
 * @param {Object} networkConfig Config of network
 * @return {Number} Current block number
 */
async function getCurrentBlockNumber(networkConfig) {
    // Lazy initialization for currentBlockNumber
    if (initializationPromise === null) {
        initializationPromise = new Promise((resolve) => {
            initializeBlockNumberEventEmitter.on('initialized', () => {
                resolve();
            });
        });
        updateCurrentBlockNumber(networkConfig);
    }
    await initializationPromise;

    assert(currentBlockNumber !== -1, 'Block number is not illegal');
    return currentBlockNumber;
}

module.exports.call = async function (networkConfig, contractName, functionName, args) {

    let node = selectNode(networkConfig.nodes);    

    let requestData = {
        method: 'POST',
        uri: `http://${node.ip}:${node.rpcPort}/dper/softCall`,
        json: false,
        body: {
                'contractName':contractName,
                'functionName':functionName,
                'args':args
        }
    };

    return requestPromise(requestData);
    

};

module.exports.generateRawTransaction = async function (networkConfig, account, privateKey, to, func, params) {
    if (!isArray(params)) {
        params = [params];
    }

    let blockNumber = await getCurrentBlockNumber(networkConfig);
    let groupID = networkConfig.groupID;
    let signTx = web3Sync.getSignTx(groupID, account, privateKey, to, func, params, blockNumber + 500);
    return signTx;
};

module.exports.sendRawTransaction = async function (networkConfig, tx) {
    let requestData = {
        'jsonrpc': '2.0',
        'method': 'sendRawTransaction',
        'params': [networkConfig.groupID, tx],
        'id': 1
    };

    let node = selectNode(networkConfig.nodes);
    return channelPromise(node, networkConfig.authentication, requestData, networkConfig.timeout);
};

module.exports.sendTransaction = async function (networkConfig, contractName, functionName, args) {
    let node = selectNode(networkConfig.nodes);  
    let requestData = {
        method: 'POST',
        uri: `http://${node.ip}:${node.rpcPort}/dper/softInvoke`,
        form: {
                'contractName':contractName,
                'functionName':functionName,
                'args':args
        },
        headers:{}
    };

    return requestPromise(requestData);
};

module.exports.getTxReceipt = async function (networkConfig, txHash) {
    let node = selectNode(networkConfig.nodes);
    // Use RPC
    let requestData = {
        method: 'POST',
        uri: `http://${node.ip}:${node.rpcPort}`,
        json: true,
        body: {
            'jsonrpc': '2.0',
            'method': 'getTransactionReceipt',
            'params': [networkConfig.groupID, txHash],
            'id': 1
        }
    };

    return requestPromise(requestData);
};

module.exports.getCode = async function (networkConfig, address) {
    let node = selectNode(networkConfig.nodes);
    // Use RPC
    let requestData = {
        method: 'POST',
        uri: `http://${node.ip}:${node.rpcPort}`,
        json: true,
        body: {
            'jsonrpc': '2.0',
            'method': 'getCode',
            'params': [
                networkConfig.groupID,
                address
            ],
            'id': 1
        }
    };

    return requestPromise(requestData);
};
