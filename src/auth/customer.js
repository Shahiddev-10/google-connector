const { google } = require("googleapis");
const Customer = require("../models/customer_model.js");

async function getCustomers(auth) {
  const service = google.admin({ version: "directory_v1", auth });
  const res = await service.customers.get({
    customerKey: "my_customer",
  });

  if (res.data) {
    await Customer.updateOne(
      { orgId: res.data.id },
      {
        orgId: res.data.id,
        domainName: res.data.customerDomain,
        alternateEmail: res.data.alternateEmail,
        creationDate: res.data.customerCreationTime,
        status: res.data.customerStatus,
      },
      { upsert: true }
    )
      .then()
      .catch(console.error);
  }
  return res.data;
}

module.exports = { getCustomers };
