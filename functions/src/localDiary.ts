import { https, localDiariesCollection, serverTimestamp } from "./utils";
import { DATA_PER_PAGE, ERROR_401 } from "./consts";

exports.get = https.onCall(async (input = {}, context) => {
  console.log("input: ", input);
  console.log("context auth: ", context.auth);

  let searchText = input?.searchText || "";
  searchText = searchText.toLowerCase();

  console.log("searchText: ", searchText);

  const limit = input?.limit || DATA_PER_PAGE;
  const offset = input?.page ? limit * input.page : 0;

  try {
    const querySnapshot = await localDiariesCollection
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

exports.favorite = https.onCall(async (input = {}, context) => {
  console.log("input: ", input);
  console.log("context auth: ", context.auth);

  const limit = input?.limit || DATA_PER_PAGE;
  const offset = input?.page ? limit * input.page : 0;

  try {
    const querySnapshot = await localDiariesCollection
      .where("isActive", "==", true)
      .where("isFavorite", "==", true)
      .orderBy("favoriteAt", "desc")
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

exports.recommended = https.onCall(async (input = {}, context) => {
  console.log("input: ", input);
  console.log("context auth: ", context.auth);

  const limit = input?.limit || DATA_PER_PAGE;
  const offset = input?.page ? limit * input.page : 0;

  try {
    const querySnapshot = await localDiariesCollection
      .where("isActive", "==", true)
      .where("isRecommended", "==", true)
      .orderBy("recommendedAt", "desc")
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

  let title = input.title || "";
  title = title.charAt(0).toUpperCase() + title.slice(1);
  const titleLowercase = title.toLowerCase();

  const data = {
    ...input,
    title: title,
    titleLowercase: titleLowercase,
    // isActive: true,
    updatedBy: input.updatedBy || currentUser,
    updatedAt: serverTimestamp(),
  };

  try {
    let response;
    if (input.id) {
      // update
      await localDiariesCollection.doc(input.id).set(data, { merge: true });
      response = { ...data, id: input.id };
    } else {
      const docRef = await localDiariesCollection.add({
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
