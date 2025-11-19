import mongoose from "mongoose";

const urlSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    redirectUrl: {
      type: String,
      required: true,
    },
    qrCodeBuffer: {
      type: Buffer,
      required: true,
    },
    timesUsed: {
      type: Number,
      default: 0,
    },
    ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      sparse: true,
    },
  },
  {
    timestamps: true,
  },
);

const Url = mongoose.model("Url", urlSchema);
export default Url;
