import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import * as auto from "./auto";
import * as place from "./place";
import * as banner from "./banner";

if (!admin.apps.length) admin.initializeApp(functions.config().firebase);

exports.auto = auto;
exports.place = place;
exports.banner = banner;
