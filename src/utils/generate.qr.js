import qrcode from "qrcode";

/**
 * @desc generates a QR code image buffer for a given URL string
 * @param {string} URL - The URL data to encode in the QR code
 * @return {Promise<Buffer>} - A promise that resolves to a binary Buffer representing the PNG image data
 */
const generateQrCodeBuffer = async (URL) => {
  try {
    // the second argument can be an options object (e.g., type: 'png')
    let qrCodeBuffer = await qrcode.toBuffer(URL, { type: "png" });
    return qrCodeBuffer;
  } catch (err) {
    console.error("Error generating QR code buffer:", err);
    throw new Error("QR code generation failed.");
  }
};

export default generateQrCodeBuffer;
