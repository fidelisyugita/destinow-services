import { https, bannersCollection } from "./utils";

exports.get = https.onCall(async (input = {}, context) => {
  try {
    const querySnapshot = await bannersCollection
      .where("isActive", "==", true)
      .orderBy("updatedAt", "desc")
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
