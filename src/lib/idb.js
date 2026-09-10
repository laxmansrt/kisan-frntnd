/**
 * IndexedDB helper for the app (client-side, not SW)
 * Stores: farmerStatus, pendingRegistrations, notifications
 */
import { openDB } from 'idb';

const DB_NAME = 'govprocure';
const DB_VERSION = 1;

let dbPromise = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('farmerStatus')) {
          db.createObjectStore('farmerStatus', { keyPath: 'farmer_id' });
        }
        if (!db.objectStoreNames.contains('pendingRegistrations')) {
          db.createObjectStore('pendingRegistrations', { keyPath: 'tempId' });
        }
        if (!db.objectStoreNames.contains('notifications')) {
          db.createObjectStore('notifications', { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveFarmerStatus(farmerId, data) {
  const db = await getDb();
  await db.put('farmerStatus', { ...data, farmer_id: farmerId, synced_at: new Date().toISOString() });
}

export async function getFarmerStatus(farmerId) {
  const db = await getDb();
  return db.get('farmerStatus', farmerId);
}

export async function savePendingRegistration(tempId, payload, token) {
  const db = await getDb();
  await db.put('pendingRegistrations', { tempId, payload, token, created_at: new Date().toISOString() });
}

export async function getPendingRegistrations() {
  const db = await getDb();
  return db.getAll('pendingRegistrations');
}

export async function deletePendingRegistration(tempId) {
  const db = await getDb();
  return db.delete('pendingRegistrations', tempId);
}

export async function saveNotification(notif) {
  const db = await getDb();
  await db.add('notifications', { ...notif, saved_at: new Date().toISOString() });
}

export async function getNotifications() {
  const db = await getDb();
  return db.getAll('notifications');
}
