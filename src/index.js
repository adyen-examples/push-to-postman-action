import * as core from '@actions/core';

import {Postman} from './postman.js'

init()

async function init () {

    try {

        const goal = core.getInput('goal');
        if(!goal) {
            throw new Error("Missing input goal");
        }
        if (goal !== "create" && goal !== "update" && goal !== "createOrUpdate") {
            throw new Error("Unsupported goal: " + goal);
        }

        const postmanApiKey = core.getInput('postman-key');
        if(!postmanApiKey) {
            throw new Error("Missing input postman-key");
        }
        core.setSecret(postmanApiKey);

        const postmanFile = core.getInput('postman-file');
        if(!postmanFile) {
            core.info('No Postman file(s) provided');
            core.setOutput('message', 'No Postman file(s) provided');
            core.setOutput('status', 'success');

            return;
        }

        const workspaceId = core.getInput('workspace-id');
        const collectionId = core.getInput('collection-id');

        if(goal == 'createOrUpdate' && !workspaceId) {
            throw new Error("Goal <createOrUpdate> requires workspace-id");
        }

        if(goal == 'create' && !workspaceId) {
            throw new Error("Goal <create> requires workspace-id");
        }

        if(goal == 'update' && !collectionId) {
            throw new Error("Goal <update> requires collection-id");
        }

        if(goal == 'create') {
            await createCollection(postmanApiKey, postmanFile, workspaceId);
        } else if (goal == 'update') {
            await updateCollection(postmanApiKey, postmanFile, collectionId);
        } else if (goal == 'createOrUpdate') {
            await createOrUpdateCollection(postmanApiKey, postmanFile, workspaceId);
        } else {
            throw new Error("Unrecognised goal " + goal);
        }

    } catch (error) {
        const status = error.response?.status;
        core.setFailed(status ? `Postman API request failed with status ${status}` : error.message);
    }
}

async function updateCollection(postmanApiKey, postmanFile, collectionId) {
    await new Postman(postmanApiKey).updateCollection(postmanFile, collectionId);
}

async function createCollection(postmanApiKey, postmanFile, workspaceId) {
    await new Postman(postmanApiKey).createCollection(postmanFile, workspaceId);
}

async function createOrUpdateCollection(postmanApiKey, postmanFile, workspaceId) {
    await new Postman(postmanApiKey).createOrUpdateCollection(postmanFile, workspaceId);
}
