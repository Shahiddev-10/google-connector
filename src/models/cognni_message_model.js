const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const headerSchema = new Schema({
  serviceScope: String,
  orgId: String,
  service: String,
  eventTime: String,
  eventType: String,
  application: String,
  externalApplication: String,
  externalEventId: String,
  externalEventType: String,
});

const personSchema = new Schema({
  objectName: String,
  email: String,
  customerID: String,
});

const fileSchema = new Schema({
  objectName: String,
  externalObjectId: String,
  externalIdentifier: String,
  fileExtension: String,
  rawBlobKey: String,
});

const cognniMessageSchema = new Schema(
  {
    id: String,
    threadId: String,
    header: headerSchema,
    subject: String,
    exposed_by: personSchema,
    exposed_to: [personSchema],
    attachments: [fileSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CognniMessage", cognniMessageSchema);
