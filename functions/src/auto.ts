import {
  auth,
  firestore,
  cm,
  sa,
  // aa,
  usersCollection,
  serverTimestamp,
  placesCollection,
  restaurantsCollection,
  souvenirsCollection,
  transportsCollection,
  newsCollection,
  localDiariesCollection,
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

// exports.updateUserClaims = firestore
//   .document("users/{docId}")
//   .onUpdate(async (snapshot, context) => {
//     const { docId } = context.params;

//     const { isAdmin } = snapshot.after.data();

//     return aa
//       .setCustomUserClaims(docId, {
//         isAdmin: isAdmin,
//       })
//       .then(() => {
//         // The new custom claims will propagate to the user's ID token the
//         // next time a new one is issued.
//       });
//   });

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
  const cleanArray = array.map(({ src = "", name = "" }) => {
    var imageSrc = src;
    var lastForwardSlash = imageSrc.lastIndexOf("/");
    var firstQueryString = imageSrc.indexOf("?");
    var imagePath = imageSrc.substring(lastForwardSlash + 1, firstQueryString);
    var decodedImagePath = decodeURIComponent(imagePath);

    return {
      src: decodedImagePath,
      name: name,
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

    let data = {};

    if (!placeBefore.nameLowercase || placeBefore.name !== placeAfter.name)
      data = {
        ...data,
        nameLowercase: placeAfter.name.toLowerCase(),
      };

    if (placeBefore.isFavorite !== placeAfter.isFavorite)
      data = { ...data, favoriteAt: serverTimestamp() };

    if (placeBefore.isRecommended !== placeAfter.isRecommended)
      data = { ...data, recommendedAt: serverTimestamp() };

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

    let data = {};

    if (
      !restaurantBefore.nameLowercase ||
      restaurantBefore.name !== restaurantAfter.name
    )
      data = {
        ...data,
        nameLowercase: restaurantAfter.name.toLowerCase(),
      };

    if (restaurantBefore.isRecommended !== restaurantAfter.isRecommended)
      data = { ...data, recommendedAt: serverTimestamp() };

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

    const oldMenus = cleanImagesArray(
      snapshot.before.data().menus.map((menu: { image: any }) => menu.image)
    );
    const newMenus = cleanImagesArray(
      snapshot.after.data().menus.map((menu: { image: any }) => menu.image)
    );

    const deletedMenus = oldMenus.filter((oldMenu) =>
      newMenus.every((newMenu) => newMenu.src !== oldMenu.src)
    );

    const menusDeletedPromise = deletedMenus.map((menu) => {
      const file = sa.bucket().file(menu.src);

      file
        .exists()
        .then(() => {
          return file.delete();
        })
        .catch(() => {
          return console.log(`${menu.src} does not exist`);
        });
    });

    return Promise.all([...imagesDeletedPromise, ...menusDeletedPromise]);
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

    let data = {};

    if (
      !souvenirBefore.nameLowercase ||
      souvenirBefore.name !== souvenirAfter.name
    )
      data = {
        ...data,
        nameLowercase: souvenirAfter.name.toLowerCase(),
      };

    if (souvenirBefore.isRecommended !== souvenirAfter.isRecommended)
      data = { ...data, recommendedAt: serverTimestamp() };

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

    const oldMenus = cleanImagesArray(
      snapshot.before.data().menus.map((menu: { image: any }) => menu.image)
    );
    const newMenus = cleanImagesArray(
      snapshot.after.data().menus.map((menu: { image: any }) => menu.image)
    );

    const deletedMenus = oldMenus.filter((oldMenu) =>
      newMenus.every((newMenu) => newMenu.src !== oldMenu.src)
    );

    const menusDeletedPromise = deletedMenus.map((menu) => {
      const file = sa.bucket().file(menu.src);

      file
        .exists()
        .then(() => {
          return file.delete();
        })
        .catch(() => {
          return console.log(`${menu.src} does not exist`);
        });
    });

    return Promise.all([...imagesDeletedPromise, ...menusDeletedPromise]);
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

    let data = {};

    if (
      !transportBefore.nameLowercase ||
      transportBefore.name !== transportAfter.name
    )
      data = {
        ...data,
        nameLowercase: transportAfter.name.toLowerCase(),
      };

    if (transportBefore.isRecommended !== transportAfter.isRecommended)
      data = { ...data, recommendedAt: serverTimestamp() };

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

    const oldMenus = cleanImagesArray(
      snapshot.before.data().menus.map((menu: { image: any }) => menu.image)
    );
    const newMenus = cleanImagesArray(
      snapshot.after.data().menus.map((menu: { image: any }) => menu.image)
    );

    const deletedMenus = oldMenus.filter((oldMenu) =>
      newMenus.every((newMenu) => newMenu.src !== oldMenu.src)
    );

    const menusDeletedPromise = deletedMenus.map((menu) => {
      const file = sa.bucket().file(menu.src);

      file
        .exists()
        .then(() => {
          return file.delete();
        })
        .catch(() => {
          return console.log(`${menu.src} does not exist`);
        });
    });

    return Promise.all([...imagesDeletedPromise, ...menusDeletedPromise]);
  });

/**
 * NEWS
 */
exports.updateNewsName = firestore
  .document("news/{docId}")
  .onWrite(async (snapshot, context) => {
    const { docId } = context.params;

    const newsBefore = snapshot.before.data() || {};
    const newsAfter = snapshot.after.data() || {};
    // console.log("news: ", news);

    let data = {};

    if (!newsBefore.nameLowercase || newsBefore.name !== newsAfter.name)
      data = {
        ...data,
        nameLowercase: newsAfter.name.toLowerCase(),
      };

    if (newsBefore.isRecommended !== newsAfter.isRecommended)
      data = { ...data, recommendedAt: serverTimestamp() };

    return newsCollection.doc(docId).set(data, { merge: true });
  });

exports.deleteNewsImages = firestore
  .document("news/{docId}")
  .onDelete(async (snapshot, context) => {
    const { docId } = context.params;

    return sa.bucket().deleteFiles({
      prefix: `news/${docId}`,
    });
  });

exports.updateNewsImages = firestore
  .document("news/{docId}")
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

    const oldParagraphs = cleanImagesArray(
      snapshot.before
        .data()
        .paragraphs.map((item: { image: any }) => item.image)
    );
    const newParagraphs = cleanImagesArray(
      snapshot.after.data().paragraphs.map((item: { image: any }) => item.image)
    );

    const deletedParagraphs = oldParagraphs.filter((oldP) =>
      newParagraphs.every((newP) => newP.src !== oldP.src)
    );

    const paragraphsDeletedPromise = deletedParagraphs.map((item) => {
      const file = sa.bucket().file(item.src);

      file
        .exists()
        .then(() => {
          return file.delete();
        })
        .catch(() => {
          return console.log(`${item.src} does not exist`);
        });
    });

    return Promise.all([...imagesDeletedPromise, ...paragraphsDeletedPromise]);
  });

/**
 * LOCAL DIARIES
 */
exports.updateLocalDiariesName = firestore
  .document("localDiaries/{docId}")
  .onWrite(async (snapshot, context) => {
    const { docId } = context.params;

    const localDiaryBefore = snapshot.before.data() || {};
    const localDiaryAfter = snapshot.after.data() || {};
    // console.log("localDiary: ", localDiary);

    let data = {};

    if (
      !localDiaryBefore.nameLowercase ||
      localDiaryBefore.name !== localDiaryAfter.name
    )
      data = {
        ...data,
        nameLowercase: localDiaryAfter.name.toLowerCase(),
      };

    if (localDiaryBefore.isRecommended !== localDiaryAfter.isRecommended)
      data = { ...data, recommendedAt: serverTimestamp() };

    return localDiariesCollection.doc(docId).set(data, { merge: true });
  });

exports.deleteLocalDiariesImages = firestore
  .document("localDiaries/{docId}")
  .onDelete(async (snapshot, context) => {
    const { docId } = context.params;

    return sa.bucket().deleteFiles({
      prefix: `localDiaries/${docId}`,
    });
  });

exports.updateLocalDiariesImages = firestore
  .document("localDiaries/{docId}")
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

    const oldParagraphs = cleanImagesArray(
      snapshot.before
        .data()
        .paragraphs.map((item: { image: any }) => item.image)
    );
    const newParagraphs = cleanImagesArray(
      snapshot.after.data().paragraphs.map((item: { image: any }) => item.image)
    );

    const deletedParagraphs = oldParagraphs.filter((oldP) =>
      newParagraphs.every((newP) => newP.src !== oldP.src)
    );

    const paragraphsDeletedPromise = deletedParagraphs.map((item) => {
      const file = sa.bucket().file(item.src);

      file
        .exists()
        .then(() => {
          return file.delete();
        })
        .catch(() => {
          return console.log(`${item.src} does not exist`);
        });
    });

    return Promise.all([...imagesDeletedPromise, ...paragraphsDeletedPromise]);
  });
