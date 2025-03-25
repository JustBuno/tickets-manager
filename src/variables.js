import { navigateToLogin } from "./functions";

let dbPool = sessionStorage.getItem('dbPool') || 'mainPool';

export const getDbPool = () => dbPool;

export const setDbPool = (newDbPool) => {
    dbPool = newDbPool;
    sessionStorage.setItem('dbPool', newDbPool);
};

export const toggleDbPool = () => {
    if (dbPool !== 'demoPool' && dbPool !== 'mainPool') {
      throw new Error("Invalid dbPool value. Cannot toggle. Must be 'demoPool' or 'mainPool'.");
    }
    dbPool = dbPool === 'demoPool' ? 'mainPool' : 'demoPool';
    sessionStorage.setItem('dbPool', dbPool);
    navigateToLogin();
  };