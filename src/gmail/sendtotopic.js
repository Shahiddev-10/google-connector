require("dotenv").config();
const { ServiceBusClient } = require("@azure/service-bus");

const connectionString = process.env.AZURE_SERVICE_BUS_CONNECTION_STRING;
const topicName = "gmail-object-input";

async function send_message(messages) {
  const sbClient = new ServiceBusClient(connectionString);
  const sender = sbClient.createSender(topicName);

  try {
    let batch = await sender.createMessageBatch();
    for (let i = 0; i < messages.length; i++) {
      const messageBody = JSON.stringify(messages[i]);
      if (!batch.tryAddMessage({ body: messageBody })) {
        await sender.sendMessages(batch);

        batch = await sender.createMessageBatch();

        if (!batch.tryAddMessage(messages[i])) {
          throw new Error("Message too big to fit in a batch");
        }
      }
    }

    await sender.sendMessages(batch);
    await sender.close();
  } finally {
    await sbClient.close();
  }
}

module.exports = { send_message };
