const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TokenSchema = new Schema({
  id: String,
  token: String
  
},
{
  timestamps: true 
});

module.exports = mongoose.model("Token", TokenSchema);
