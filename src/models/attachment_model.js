const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const attachmentSchema = new Schema({
  user: String,
  thread: String,
  name: String,
  url: String
},
{
  timestamps: true
});

module.exports = mongoose.model("Attachment", attachmentSchema);
