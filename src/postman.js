import axios from 'axios';
import fs from 'fs';
import path from 'path';

const URL = 'https://api.getpostman.com/collections';

export class Postman {
    constructor(postmanApiKey) {
        this.client = axios.create({
            timeout: 30000,
            maxRedirects: 0,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': postmanApiKey,
            },
        });
    }

    async createCollection(postmanFiles, workspaceId) {
        for (const {collection} of this.loadCollections(postmanFiles)) {
            await this.client.post(URL, {collection}, {params: {workspace: workspaceId}});
        }
    }

    async updateCollection(postmanFiles, collectionId) {
        for (const {collection} of this.loadCollections(postmanFiles)) {
            await this.client.put(`${URL}/${encodeURIComponent(collectionId)}`, {collection});
        }
    }

    async createOrUpdateCollection(postmanFiles, workspaceId) {
        for (const {collection} of this.loadCollections(postmanFiles)) {
            const response = await this.client.get(URL, {params: {workspace: workspaceId}});
            const existing = response.data.collections?.find(item => item.name === collection.info.name);

            if (existing) {
                await this.client.put(`${URL}/${encodeURIComponent(existing.uid)}`, {collection});
            } else {
                await this.client.post(URL, {collection}, {params: {workspace: workspaceId}});
            }
        }
    }

    loadCollections(postmanFiles) {
        return postmanFiles.split(/\s+/).filter(Boolean)
            .filter(file => file.toLowerCase().endsWith('.json'))
            .map(file => ({collection: this.loadJson(file)}));
    }

    loadJson(file) {
        const workspace = fs.realpathSync(process.cwd());
        const resolvedFile = fs.realpathSync(path.resolve(workspace, file));
        const relativeFile = path.relative(workspace, resolvedFile);

        if (relativeFile === '..' || relativeFile.startsWith(`..${path.sep}`) || path.isAbsolute(relativeFile)) {
            throw new Error('Postman files must be inside the workspace');
        }

        const collection = JSON.parse(fs.readFileSync(resolvedFile, 'utf8'));
        if (!collection || typeof collection !== 'object' || !collection.info || typeof collection.info.name !== 'string') {
            throw new Error('Postman collection JSON must include info.name');
        }

        return collection;
    }
}

