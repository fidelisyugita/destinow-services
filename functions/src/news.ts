import { https, newsCollection } from "./utils";
import { DATA_PER_PAGE } from "./consts";

exports.get = https.onCall(async (input = {}, context) => {
  console.log("input: ", input);
  console.log("context auth: ", context.auth);

  let searchText = input?.searchText || "";
  searchText = searchText.toLowerCase();

  console.log("searchText: ", searchText);

  const limit = input?.limit || DATA_PER_PAGE;
  const offset = input?.page ? limit * input.page : 0;

  try {
    const querySnapshot = await newsCollection
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
    const querySnapshot = await newsCollection
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
    const querySnapshot = await newsCollection
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
