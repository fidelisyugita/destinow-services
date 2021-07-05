import { https, usersCollection, serverTimestamp } from "./utils";
import { DATA_PER_PAGE, ERROR_401, ERROR_NO_DATA } from "./consts";

exports.get = https.onCall(async (input = {}, context) => {
  console.log("input: ", input);
  console.log("context auth: ", context.auth);

  let searchText = input?.searchText || "";
  searchText = searchText.toLowerCase();

  console.log("searchText: ", searchText);

  const limit = input?.limit || DATA_PER_PAGE;
  const offset = input?.page ? limit * input.page : 0;

  try {
    const querySnapshot = await usersCollection
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

exports.getById = https.onCall(async (input = {}, context) => {
  console.log("input: ", input);
  console.log("context auth: ", context.auth);

  const userId = context.auth?.uid;

  if (!userId) {
    return {
      ok: false,
      error: ERROR_401,
    };
  }

  try {
    const documentSnapshot = await usersCollection.doc(userId).get();
    const userData = documentSnapshot.data();

    if (userData) {
      const response = { ...userData, id: userId };
      console.log("response: ");
      console.log(response);

      return {
        ok: true,
        payload: response,
      };
    }

    return {
      ok: false,
      error: ERROR_NO_DATA,
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

  const userId = context.auth?.uid;

  if (!userId) {
    return {
      ok: false,
      error: ERROR_401,
    };
  }

  try {
    await usersCollection
      .doc(userId)
      .set({ ...input, updatedAt: serverTimestamp() }, { merge: true });

    const documentSnapshot = await usersCollection.doc(userId).get();
    const userData = documentSnapshot.data();

    let response;

    if (userData)
      response = {
        ...userData,
        id: userId,
      };
    else
      response = {
        ...input,
        id: userId,
      };

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
