require("dotenv").config();
const { BlobServiceClient } = require("@azure/storage-blob");

async function uploadAttachments(attachment, user, thread, attachmentName) {
  try {
    const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!AZURE_STORAGE_CONNECTION_STRING) {
      throw Error('Azure Storage Connection string not found');
    }

    // Create the BlobServiceClient object with connection string
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

    const containerName = 'attachments';
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const createContainerResponse = await containerClient.createIfNotExists();

    // Create a unique name for the blob
    const blobName = `${user}/${thread}/${attachmentName}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const data = Buffer.from(attachment, 'base64');
    const uploadBlobResponse = await blockBlobClient.upload(data, data.length);
    return blockBlobClient.url;
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
}

module.exports = { uploadAttachments };
