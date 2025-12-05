import { getFunctions, httpsCallable } from "firebase/functions";

export async function generateImage({ templateID, data, savePath }) {
  const functions = getFunctions();
  const convertFn = httpsCallable(functions, "convertSvgToJpg");

  const result = await convertFn({
    templateID,   // e.g. "sample"
    data,         // e.g. { heading:"x", paragraph:"y" }
    saveAt: savePath, // e.g. `savedimages/123/55/sample1.jpg`
  });

  return result.data; // returns {response, path}
}
