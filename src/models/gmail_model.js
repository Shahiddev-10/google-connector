const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const headerSchema = new Schema({
  name: String,
  value: String,
});

const messagePartBodySchema = new Schema({
  attachmentId: String,
  size: Number,
  data: String,
});

const messagePartSchema = new Schema({
  partId: String,
  mimeType: String,
  filename: String,
  headers: [headerSchema],
  body: messagePartBodySchema,
  parts: [this]
});

const messageSchema = new Schema({
  id: String,
  threadId: String,
  labelIds: [String],
  snippet: String,
  historyId: String,
  internalDate: String,
  payload: messagePartSchema,
  sizeEstimate: Number,
});

const threadSchema = new Schema({
  id: String,
  userId: String,
  snippet: String,
  historyId: String,
  messages: [messageSchema],
},
{
  timestamps: true,
});

module.exports = mongoose.model("Thread", threadSchema);
