const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  id: String,
  primaryEmail: String,
  isAdmin: Boolean,
  isDelegatedAdmin: Boolean,
  suspended: Boolean,
  name: String,
  isMailboxSetup: Boolean,
  customerId: String,
  creationTime: String,
  deletionTime: String,
},
{
  timestamps: true
});

module.exports = mongoose.model("User", userSchema);
