import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import * as auto from "./auto";

if (!admin.apps.length) admin.initializeApp(functions.config().firebase);

exports.auto = auto;
