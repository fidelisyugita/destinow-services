import {
  auth,
  firestore,
  cm,
  sa,
  usersCollection,
  serverTimestamp,
  placesCollection,
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
    updatedAt: serverTimestamp(),
    isDeleted: true,
  };

  return usersCollection.doc(user.uid).set(data, { merge: true });
});

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
