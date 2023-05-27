require("dotenv").config();

const keys = require("../key.json");
const mongoose = require("mongoose");
const process = require("process");

const { JWT } = require("google-auth-library");

const { getCustomers } = require("./auth/customer.js");
const { getUsers } = require("./user/user.js");
const { getThreads } = require("./gmail/thread.js");

// Scope List
const scopes = [
  "https://www.googleapis.com/auth/admin.directory.customer.readonly",
  "https://www.googleapis.com/auth/admin.directory.user.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
];

// Connect to MongoDB
mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

async function display() {
  const customer_count = await db.collection("customers").countDocuments();
  const user_count = await db.collection("users").countDocuments();
  const thread_count = await db.collection("threads").countDocuments();
  const attachment_count = await db.collection("attachments").countDocuments();

  console.log(`\tCustomer Count: ${customer_count}`);
  console.log(`\tUser Count: ${user_count}`);
  console.log(`\tThread Count: ${thread_count}`);
  console.log(`\tAttachment Count: ${attachment_count}`);
}

async function interval(auth, customer) {
  console.log("Details before fetching data:");
  await display();

  console.log(
    "\nBear in mind, that this process depends on number of users and threads in your domain."
  );
  console.log("Depending on the data this process my take hours to complete.");
  console.log("Fetching data...");

  // This will get all the users of the organisation.
  const users = await getUsers(auth, customer.id);

  // This will run through all the users and get the threads along with messages and attachments.
  // The if there will be an attachment it will be stored to container and url will be updated in the database.
  for (const user of users) {
    auth = new JWT({
      email: keys.client_email,
      key: keys.private_key,
      subject: user.primaryEmail,
      scopes: scopes,
    });
    await getThreads(auth, user, customer);
  }

  console.log("Completed fetching all the data.");
  console.log("\nDetails after fetching data:");
  await display();

  console.log(
    `\nYOU CAN EITHER WAIT FOR ${process.env.INTERVAL} MINUTES OR PRESS CTRL+C TO EXIT.`
  );
}

// Authorize first then execute all the functions
async function main() {
  // This will get the auth key from the credentials provided.
  auth = new JWT({
    email: keys.client_email,
    key: keys.private_key,
    subject: process.argv[2],
    scopes: scopes,
  });

  // This will get the customer informaiton, basically the organisaiton information itself.
  const customer = await getCustomers(auth);

  // Let's get details and information about the users in the organisation and store it in the database every hour.
  await interval(auth, customer);
  setInterval(async () => {
    let i = 1;
    console.log(
      "\n##########################################################################################"
    );
    i++;
    console.log("Starting the process for the " + i + " time.");

    await interval(auth, customer);
    console.log(
      "##########################################################################################\n"
    );
  }, 1000 * 60 * process.env.INTERVAL);
}

main();
