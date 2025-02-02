import { createEventDefinitionConfig } from '@e7/event-definition/db';

const url = process.env.DB_URL;
if (!url) throw new Error('DB_URL is required');

const dbConfig = createEventDefinitionConfig(url);

export default dbConfig;
