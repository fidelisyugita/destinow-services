import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import { REGION } from "./consts";

if (!admin.apps.length) admin.initializeApp(functions.config().firebase);

const runtimeOpts = {
  timeoutSeconds: 10,
  // memory: '1GB'
};
const myFunctions = functions.region(REGION);

export const { https } = myFunctions.runWith(runtimeOpts);
export const { auth, firestore, database } = myFunctions;

export const db = admin.firestore();
export const cm = admin.messaging();
export const sa = admin.storage();
export const aa = admin.auth();

export const constantsCollection = db.collection("constants");
export const inboxesCollection = db.collection("inboxes");
export const bannersCollection = db.collection("banners");

export const usersCollection = db.collection("users");

export const placesCollection = db.collection("places");
export const restaurantsCollection = db.collection("restaurants");
export const souvenirsCollection = db.collection("souvenirs");
export const transportsCollection = db.collection("transports");

export const reviewsCollection = db.collection("reviews");

export const {
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} = admin.firestore.FieldValue;
