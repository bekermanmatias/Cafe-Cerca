import { testConnection } from './database.js';

const runTest = async () => {
  await testConnection();
};

runTest();
