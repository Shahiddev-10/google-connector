const { google } = require("googleapis");
const User = require("../models/user_model.js");

async function getUsers(auth, customer) {
  const service = google.admin({ version: "directory_v1", auth });
  const res = await service.users.list({
    customer: await customer,
  });

  if (res.data) {
    for (const user of res.data.users) {
      await User.updateOne(
        { id: user.id },
        {
          id: user.id,
          primaryEmail: user.primaryEmail,
          name: user.name.fullName,
          isAdmin: user.isAdmin,
          isDelegatedAdmin: user.isDelegatedAdmin,
          creationTime: user.creationTime,
          suspended: user.suspended,
          customerId: user.customerId,
          isMailboxSetup: user.isMailboxSetup,
        },
        { upsert: true }
      )
        .then()
        .catch(console.error);
    }
  }
  return res.data.users;
}

module.exports = { getUsers };
