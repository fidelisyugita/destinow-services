import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import * as auto from "./auto";
import * as banner from "./banner";
import * as place from "./place";
import * as restaurant from "./restaurant";
import * as souvenir from "./souvenir";
import * as transport from "./transport";
import * as news from "./news";
import * as localDiary from "./localDiary";
import * as review from "./review";

if (!admin.apps.length) admin.initializeApp(functions.config().firebase);

exports.auto = auto;
exports.banner = banner;
exports.place = place;
exports.restaurant = restaurant;
exports.souvenir = souvenir;
exports.transport = transport;
exports.news = news;
exports.localDiary = localDiary;
exports.review = review;
