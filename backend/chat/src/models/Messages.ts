// import mongoose, { Document, Schema, Types } from "mongoose";

// export interface IMessage extends Documents {
//   chatId: Types.ObjectId;
//   sender: string;
//   text?: string;
//   image?: {
//     url: string;
//     public_id: string;
//   } | null;
//   messageType: "text" | "image";
//   seen: boolean;
//   seenAt?: Date | null;
//   createdAt: Date;
//   updatedAt: Date;
// }

// const schema = new Schema<IMessage>({
//   chatId: {
//     type: Schema.Types.ObjectId,
//     ref: "Chat",
//     required: true,
//   },
//   sender: {
//     type: String,
//     required: true,
//   },
//   text: string,
//   image: {
//     url: string,
//     public_id: string,
//   },
//   messageType: {
//     type: String,
//     enum: ["text", "image"],
//     default: "text",
//   },
//   seen: {
//      type: Boolean,
//      default: false 
//  },
//  seenAt:{
//     type:Date,
//     default:null
//  }
//   },
//   {
//     timestamps: true,
//   }
// });
import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMessage extends Document {
  chatId: Types.ObjectId;
  sender: string;
  text?: string;
  image?: {
    url: string;
    public_id: string;
  } | null;
  messageType: "text" | "image";
  seen: boolean;
  seenAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      default: "",
    },
    image: {
      url: { type: String },
      public_id: { type: String },
    },
    messageType: {
      type: String,
      enum: ["text", "image"],
      default: "text",
    },
    seen: {
      type: Boolean,
      default: false,
    },
    seenAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const Messages = mongoose.model<IMessage>("Message", messageSchema);

