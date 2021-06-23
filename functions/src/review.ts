import { https, reviewsCollection, serverTimestamp } from "./utils";
import { DATA_PER_PAGE, ERROR_401 } from "./consts";

exports.get = https.onCall(async (input = {}, context) => {
  console.log("input: ", input);
  console.log("context auth: ", context.auth);

  const limit = input?.limit || DATA_PER_PAGE;
  const offset = input?.page ? limit * input.page : 0;

  const placeId = input.placeId || "-";
  const restaurantId = input.restaurantId || "-";
  const souvenirId = input.souvenirId || "-";
  const transportId = input.transportId || "-";

  try {
    const querySnapshot = await reviewsCollection
      .where("placeId", "==", placeId)
      .where("restaurantId", "==", restaurantId)
      .where("souvenirId", "==", souvenirId)
      .where("transportId", "==", transportId)
      .where("isActive", "==", true)
      .orderBy("updatedAt", "desc")
      .limit(limit)
      .offset(offset)
      .get();
    const response = querySnapshot.docs.map((doc) => {
      const data = {
        ...doc.data(),
        id: doc.id,
      };
      return data;
    });

    console.log("response: ", response);

    return {
      ok: true,
      payload: response,
    };
  } catch (error) {
    console.error(error);
    return {
      ok: false,
      error: error,
    };
  }
});

exports.save = https.onCall(async (input = {}, context) => {
  console.log("input: ");
  console.log(input);
  console.log("context auth: ");
  console.log(context.auth);

  if (!context.auth) {
    return {
      ok: false,
      error: ERROR_401,
    };
  }

  // const placeId = input.placeId;
  // if (!placeId || placeId.length < 1) {
  //   return {
  //     ok: false,
  //     error: ERROR_NO_INPUT,
  //   };
  // }

  const { token } = context.auth;
  const currentUser = {
    photoURL: token.picture,
    displayName: token.name,
    email: token.email,
    uid: context.auth.uid,
  };

  if (
    currentUser.email &&
    currentUser.email.endsWith("cloudtestlabaccounts.com")
  ) {
    return {
      ok: false,
      error: ERROR_401,
    };
  }

  const data = {
    ...input,
    placeId: input.placeId || "-",
    restaurantId: input.restaurantId || "-",
    souvenirId: input.souvenirId || "-",
    transportId: input.transportId || "-",
    isActive: true,
    updatedBy: input.updatedBy || currentUser,
    updatedAt: serverTimestamp(),
  };

  try {
    let response;
    if (input.id) {
      // update
      await reviewsCollection.doc(input.id).set(data, { merge: true });
      response = { ...data, id: input.id };
    } else {
      const docRef = await reviewsCollection.add({
        ...data,
        createdBy: input.createdBy || currentUser,
        createdAt: serverTimestamp(),
      });
      response = { ...data, id: docRef.id };
    }

    console.log("response: ");
    console.log(response);

    return {
      ok: true,
      payload: response,
    };
  } catch (error) {
    console.error(error);
    return {
      ok: false,
      error: error,
    };
  }
});
