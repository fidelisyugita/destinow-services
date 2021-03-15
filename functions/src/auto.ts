import {
  auth,
  firestore,
  cm,
  sa,
  usersCollection,
  serverTimestamp,
  placesCollection,
  restaurantsCollection,
  souvenirsCollection,
  transportsCollection,
} from "./utils";

exports.createUser = auth.user().onCreate(async (user) => {
  console.log("user: ", user);

  const data = {
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    phoneNumber: user.phoneNumber,
    photoURL: user.photoURL,
    displayName: user.displayName,
    email: user.email,
    emailVerified: user.emailVerified,
    id: user.uid,
  };

  return usersCollection.doc(user.uid).set(data, { merge: true });
});

exports.deleteUser = auth.user().onDelete(async (user) => {
  console.log("user: ", user);

  const data = {
    deletedAt: serverTimestamp(),
    isDeleted: true,
  };

  return usersCollection.doc(user.uid).set(data, { merge: true });
});

exports.sendNotif = firestore
  .document("inboxes/{docId}")
  .onCreate(async (snapshot, context) => {
    console.log("context: ", context);

    const data = snapshot.data();
    console.log("data: ", data);

    const querySnapshot = await usersCollection.get();
    const users = querySnapshot.docs.map((doc) => doc.data());

    console.log("users: ", users);

    const notification = {
      title: (data && data.title) || "Title",
      body: (data && data.description) || "Body",
    };

    let promises: any[] = [];
    users.forEach((user) => {
      if (user.fcmToken && user.fcmToken.length > 0) {
        promises.push(
          cm.send({
            notification: notification,
            token: user.fcmToken,
          })
        );
      }
    });

    return Promise.all(promises);

    // await cm.send({
    //   notification: notification,
    //   token:
    //     "euPNym7SA8M:APA91bEtGh9HW0tgwKNGYBKjVrA_sXc8emrUgKYbhYRm2rJrq5jMcXgix02vs2yN5urplfTQ5PU6htjz1mAovhVsNFMgHewTZyrsGetDXUNjKVVQDdAlaajI-KyaTsWb-oBm1f2uImaR",
    // });
  });

function cleanImagesArray(array = []) {
  const cleanArray = array.map(({ src = "", title = "" }) => {
    var imageSrc = src;
    var lastForwardSlash = imageSrc.lastIndexOf("/");
    var firstQueryString = imageSrc.indexOf("?");
    var imagePath = imageSrc.substring(lastForwardSlash + 1, firstQueryString);
    var decodedImagePath = decodeURIComponent(imagePath);

    return {
      src: decodedImagePath,
      title: title,
    };
  });

  return cleanArray;
}

/**
 * PLACE
 */
exports.updatePlaceName = firestore
  .document("places/{docId}")
  .onWrite(async (snapshot, context) => {
    const { docId } = context.params;

    const placeBefore = snapshot.before.data() || {};
    const placeAfter = snapshot.after.data() || {};
    // console.log("place: ", place);

    if (placeBefore.nameLowercase && placeBefore.name === placeAfter.name)
      return;

    const data = {
      updatedAt: serverTimestamp(),
      nameLowercase: placeAfter.name.toLowerCase(),
    };

    return placesCollection.doc(docId).set(data, { merge: true });
  });

exports.deletePlaceImages = firestore
  .document("places/{docId}")
  .onDelete(async (snapshot, context) => {
    const { docId } = context.params;

    return sa.bucket().deleteFiles({
      prefix: `places/${docId}`,
    });
  });

exports.updatePlaceImages = firestore
  .document("places/{docId}")
  .onUpdate(async (snapshot, context) => {
    const oldImages = cleanImagesArray(snapshot.before.data().images);
    const newImages = cleanImagesArray(snapshot.after.data().images);

    const deletedImages = oldImages.filter((oldImage) =>
      newImages.every((newImage) => newImage.src !== oldImage.src)
    );

    const imagesDeletedPromise = deletedImages.map((image) => {
      const file = sa.bucket().file(image.src);

      file
        .exists()
        .then(() => {
          return file.delete();
        })
        .catch(() => {
          return console.log(`${image.src} does not exist`);
        });
    });

    return Promise.all(imagesDeletedPromise);
  });

/**
 * RESTAURANT
 */
exports.updateRestaurantName = firestore
  .document("restaurants/{docId}")
  .onWrite(async (snapshot, context) => {
    const { docId } = context.params;

    const restaurantBefore = snapshot.before.data() || {};
    const restaurantAfter = snapshot.after.data() || {};
    // console.log("restaurant: ", restaurant);

    if (
      restaurantBefore.nameLowercase &&
      restaurantBefore.name === restaurantAfter.name
    )
      return;

    const data = {
      updatedAt: serverTimestamp(),
      nameLowercase: restaurantAfter.name.toLowerCase(),
    };

    return restaurantsCollection.doc(docId).set(data, { merge: true });
  });

exports.deleteRestaurantImages = firestore
  .document("restaurants/{docId}")
  .onDelete(async (snapshot, context) => {
    const { docId } = context.params;

    return sa.bucket().deleteFiles({
      prefix: `restaurants/${docId}`,
    });
  });

exports.updateRestaurantImages = firestore
  .document("restaurants/{docId}")
  .onUpdate(async (snapshot, context) => {
    const oldImages = cleanImagesArray(snapshot.before.data().images);
    const newImages = cleanImagesArray(snapshot.after.data().images);

    const deletedImages = oldImages.filter((oldImage) =>
      newImages.every((newImage) => newImage.src !== oldImage.src)
    );

    const imagesDeletedPromise = deletedImages.map((image) => {
      const file = sa.bucket().file(image.src);

      file
        .exists()
        .then(() => {
          return file.delete();
        })
        .catch(() => {
          return console.log(`${image.src} does not exist`);
        });
    });

    return Promise.all(imagesDeletedPromise);
  });

/**
 * SOUVENIR
 */
exports.updateSouvenirName = firestore
  .document("souvenirs/{docId}")
  .onWrite(async (snapshot, context) => {
    const { docId } = context.params;

    const souvenirBefore = snapshot.before.data() || {};
    const souvenirAfter = snapshot.after.data() || {};
    // console.log("souvenir: ", souvenir);

    if (
      souvenirBefore.nameLowercase &&
      souvenirBefore.name === souvenirAfter.name
    )
      return;

    const data = {
      updatedAt: serverTimestamp(),
      nameLowercase: souvenirAfter.name.toLowerCase(),
    };

    return souvenirsCollection.doc(docId).set(data, { merge: true });
  });

exports.deleteSouvenirImages = firestore
  .document("souvenirs/{docId}")
  .onDelete(async (snapshot, context) => {
    const { docId } = context.params;

    return sa.bucket().deleteFiles({
      prefix: `souvenirs/${docId}`,
    });
  });

exports.updateSouvenirImages = firestore
  .document("souvenirs/{docId}")
  .onUpdate(async (snapshot, context) => {
    const oldImages = cleanImagesArray(snapshot.before.data().images);
    const newImages = cleanImagesArray(snapshot.after.data().images);

    const deletedImages = oldImages.filter((oldImage) =>
      newImages.every((newImage) => newImage.src !== oldImage.src)
    );

    const imagesDeletedPromise = deletedImages.map((image) => {
      const file = sa.bucket().file(image.src);

      file
        .exists()
        .then(() => {
          return file.delete();
        })
        .catch(() => {
          return console.log(`${image.src} does not exist`);
        });
    });

    return Promise.all(imagesDeletedPromise);
  });

/**
 * TRANSPORT
 */
exports.updateTransportName = firestore
  .document("transports/{docId}")
  .onWrite(async (snapshot, context) => {
    const { docId } = context.params;

    const transportBefore = snapshot.before.data() || {};
    const transportAfter = snapshot.after.data() || {};
    // console.log("transport: ", transport);

    if (
      transportBefore.nameLowercase &&
      transportBefore.name === transportAfter.name
    )
      return;

    const data = {
      updatedAt: serverTimestamp(),
      nameLowercase: transportAfter.name.toLowerCase(),
    };

    return transportsCollection.doc(docId).set(data, { merge: true });
  });

exports.deleteTransportImages = firestore
  .document("transports/{docId}")
  .onDelete(async (snapshot, context) => {
    const { docId } = context.params;

    return sa.bucket().deleteFiles({
      prefix: `transports/${docId}`,
    });
  });

exports.updateTransportImages = firestore
  .document("transports/{docId}")
  .onUpdate(async (snapshot, context) => {
    const oldImages = cleanImagesArray(snapshot.before.data().images);
    const newImages = cleanImagesArray(snapshot.after.data().images);

    const deletedImages = oldImages.filter((oldImage) =>
      newImages.every((newImage) => newImage.src !== oldImage.src)
    );

    const imagesDeletedPromise = deletedImages.map((image) => {
      const file = sa.bucket().file(image.src);

      file
        .exists()
        .then(() => {
          return file.delete();
        })
        .catch(() => {
          return console.log(`${image.src} does not exist`);
        });
    });

    return Promise.all(imagesDeletedPromise);
  });
