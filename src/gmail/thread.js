const { google } = require("googleapis");
const md5 = require("md5");

const Thread = require("../models/gmail_model.js");
const Attachment = require("../models/attachment_model.js");
const CognniMessage = require("../models/cognni_message_model.js");
const { uploadAttachments } = require("./upload.js");
const { send_message } = require("./sendtotopic.js");
const cognni_message_model = require("../models/cognni_message_model.js");

async function getThreadsList(auth, user) {
  const service = google.gmail({ version: "v1", auth });
  const res = await service.users.threads.list({
    userId: await user.id,
    maxResults: 500,
  });

  return res.data;
}

async function getThreads(auth, user, customer) {
  const service = google.gmail({ version: "v1", auth });

  const threads = await getThreadsList(auth, user);
  if (!threads.threads) {
    return;
  }

  for (const thread of threads.threads) {
    const res = await service.users.threads.get({
      userId: await user.id,
      id: thread.id,
    });

    if (res.data) {
      // Check for attachments
      for (const message of res.data.messages) {
        if (message.payload.parts) {
          let attachments = [];
          for (const part of message.payload.parts) {
            if (part.filename) {
              const attachmentId = part.body.attachmentId;
              const attachment = await service.users.messages.attachments.get({
                userId: await user.id,
                messageId: message.id,
                id: attachmentId,
              });

              const attachmentData = attachment.data.data
                .replace(/-/g, "+")
                .replace(/_/g, "/");
              const buffer = Buffer.from(attachmentData, "base64");
              const attachmentName = part.filename;

              const url = await uploadAttachments(
                attachmentData,
                user.id,
                thread.id,
                attachmentName
              );

              await Attachment.updateOne(
                { user: user.id, thread: thread.id, name: attachmentName },
                {
                  user: user.id,
                  thread: res.data.id,
                  name: attachmentName,
                  url: url,
                },
                { upsert: true }
              );

              attachments.push({
                objectName: attachmentName,
                externalObjectId: attachmentName,
                externalIdentifier: attachmentName,
                fileExtension: attachmentName.split(".").pop(),
                rawBlobKey: url,
              });
            }
          }

          let byNamevVerify = message.payload.headers.find(
            (header) => header.name === "From"
          ).value;
          let byName;
          if (byNamevVerify.includes("<")) {
            byName = byNamevVerify.split("<")[0].trim();
          } else {
            byName = byNamevVerify;
          }

          let byEmailVerify = message.payload.headers.find(
            (header) => header.name === "From"
          ).value;
          let byEmail;
          if (byEmailVerify.includes("<")) {
            byEmail = byEmailVerify.split("<")[1].split(">")[0].trim();
          } else {
            byEmail = byEmailVerify;
          }

          let to = message.payload.headers.find(
            (header) => header.name === "To"
          ).value;

          let toArray = [];
          for (const mail of to.split(",")) {
            if (mail.includes("<")) {
              let toName = mail.split("<")[0].trim();
              let toEmail = mail.split("<")[1].split(">")[0].trim();

              toArray.push({
                objectName: toName,
                email: toEmail,
              });
            } else {
              toArray.push({
                objectName: mail.trim(),
                email: mail.trim(),
              });
            }
          }

          let orgId = await customer.id;
          let serviceScope = await customer.customerDomain;

          let messageArray = [];

          await CognniMessage.updateOne(
            {
              id: md5(thread.id + message.internalDate),
            },
            {
              id: md5(thread.id + message.internalDate),
              header: {
                serviceScope: serviceScope,
                orgId: orgId,
                eventType: "shared content",
                eventTime: new Date(),
                externalEventType: "Email",
              },
              threadId: thread.id,
              subject: await message.payload.headers.filter(
                (header) => header.name === "Subject"
              )[0].value,
              exposed_by: {
                objectName: byName,
                email: byEmail,
                customerId: orgId,
              },
              exposed_to: toArray,
              attachments: attachments,
            },
            { upsert: true, rawResult: true }
          ).then(async (err, result) => {
            if (err.upsertedCount === 1) {
              messageArray.push(await CognniMessage.findById(err.upsertedId));
            }
          });

          if (messageArray.length > 0) {
            await send_message(messageArray);
          }
          messageArray = [];
        }
      }

      await Thread.updateOne(
        { id: res.data.id },
        {
          id: res.data.id,
          userId: await user.id,
          snippet: res.data.snippet,
          historyId: res.data.historyId,
          messages: res.data.messages,
        },
        { upsert: true }
      )
        .then()
        .catch(console.error);
    }
  }
}

module.exports = { getThreads };
