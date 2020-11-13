require("dotenv").config();
const express = require("express");
const sql = require("mysql2/promise");
const cors = require("cors");
const PORT = 4000;
const authorizeUser = require("./authorization/middleware");
const d3 = require("d3");
const aws = require("aws-sdk");

// aws.confiq.setPromisesDependency();
// aws.config.update({
//   accessKeyId: process.env.Access_Key_ID,
//   secretAccessKey: process.env.Secret_Access_Key,
//   region: "us-east-1",
// });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const pool = sql.createPool({
  host: process.env.host,
  user: process.env.sqluser,
  password: process.env.password,
});

//- User info - This would be address and stuff for bottom of invoice
app.post("/user", authorizeUser, async (req, resp) => {
  console.log("get user hit");
  try {
    const conn = await pool.getConnection();
    const username = req.decodedToken["cognito:username"];

    const response = await conn.execute(
      `SELECT * FROM invoiceDb.users WHERE username=?`,
      [username]
    );
    conn.release();
    resp.status(200).send(response[0][0]);
  } catch (error) {
    resp.status(500).send(error);
    console.log(error);
  }
});

//- Invoice Data for STATS and GRAPHS
// -- such as Total amounts of invoices
// -- total amount of fulfilled invoices
// -- total amount of payments yet to be received
//

//POST ROUTES
// - Create a new user
app.post("/create-user", authorizeUser, async (req, resp) => {
  console.log("create user hit");
  try {
    const conn = await pool.getConnection();
    const username = req.decodedToken["cognito:username"];
    //figure out if I want name/company name and address
    const response = await conn.execute(
      "INSERT INTO invoiceDb.users (username) VALUES (?)",
      [username]
    );

    conn.release();
    resp.status(200).send(response);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

// - Update user - for updates in user info
app.post("/update-user", authorizeUser, async (req, resp) => {
  console.log("update user hit");
  try {
    const username = req.decodedToken["cognito:username"];
    const conn = await pool.getConnection();
    //getting original user data
    const foo = await conn.execute(
      "SELECT * FROM invoiceDb.users WHERE username=?",
      [username]
    );
    const oldData = foo[0][0];
    //if entered data is empty store old data and if not store new data
    const first_name =
      req.body.firstname === "" || undefined
        ? oldData.first_name
        : req.body.firstname;
    const last_name =
      req.body.lastname === "" || undefined
        ? oldData.last_name
        : req.body.lastname;
    const company_name =
      req.body.companyName === "" || undefined
        ? oldData.company_name
        : req.body.companyName;
    const address_street =
      req.body.addressStreet === "" || undefined
        ? oldData.address_street
        : req.body.addressStreet;
    const address_city =
      req.body.city === "" || undefined ? oldData.address_city : req.body.city;
    const address_state =
      req.body.state === "" || undefined
        ? oldData.address_state
        : req.body.state;
    const address_zip =
      req.body.zipcode === "" || undefined
        ? oldData.address_zip
        : req.body.zipcode;
    // console.log(first_name);
    // console.log(last_name);
    // console.log(company_name);
    // console.log(address_street);
    // console.log(address_city);
    // console.log(address_state);
    // console.log(address_zip);
    // console.log(oldData);
    const response = await conn.execute(
      "UPDATE invoiceDb.users SET first_name=?, last_name=?, company_name=?, address_street=?, address_city=?, address_state=?, address_zip=? WHERE username=?",
      [
        first_name,
        last_name,
        company_name,
        address_street,
        address_city,
        address_state,
        address_zip,
        username,
      ]
    );
    conn.release();
    resp.status(201).send(response);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

// - Create a new customer
app.post("/create-customer", authorizeUser, async (req, resp) => {
  console.log("create customer hit");
  try {
    const customer_name = req.body.customerName;
    const company = req.body.companyName;
    const client_of = req.decodedToken["cognito:username"];
    const address_street = req.body.addressStreet;
    const address_city = req.body.city;
    const address_state = req.body.state;
    const address_zip = req.body.zipcode;
    //we want the unique username because the user has their own customers.
    //we do not want other people to be able to login and simply have access to every customer in the DB
    //I think
    const conn = await pool.getConnection();

    const response = await conn.execute(
      //Do I need to include the username in the customer table?
      "INSERT INTO invoiceDb.customers (customer_name, company, client_of, address_street, address_city, address_state, address_zip) VALUES (?,?,?,?,?,?,?)",
      [
        customer_name,
        company,
        client_of,
        address_street,
        address_city,
        address_state,
        address_zip,
      ]
    );

    conn.release();
    resp.status(200).send(response);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

// - Update Customer Info
// app.post("/update-customer", authorizeUser, async (req, resp) => {
//   console.log("update customer hit");
//   try {
//     const username = req.decodedToken["cognito:username"];
//     const conn = await pool.getConnection();
//     // const customerName = req.body.customerName;

//     const foo = await conn.execute(
//       "SELECT * FROM invoiceDb.customers WHERE username=?",
//       [username]
//     );
//     const oldData = foo[0][0];
//     //if entered data is empty store old data and if not store new data
//     const customerName =
//       req.body.customerName === "" || undefined
//         ? oldData.customerName
//         : req.body.customerName;
//     const customerAddress =
//       req.body.customerAddress === "" || undefined
//         ? oldData.customerAddress
//         : req.body.customerAddress;
//     const email =
//       req.body.email === "" || undefined ? oldData.email : req.body.email;
//     console.log(customerName);
//     console.log(customerAddress);
//     console.log(email);
//     console.log(oldData);
//     const response = await conn.execute(
//       "UPDATE invoiceDb.customers SET customerName=?, customerAddress=?, email=? WHERE username=?",
//       [customerName, customerAddress, email, username]
//     );
//     conn.release();
//     resp.status(201).send(response);
//   } catch (error) {
//     console.log(error);
//     resp.status(500).send({ message: error });
//   }
// });

// - Create a new invoice
// - I need to reference customer_name, company
// - and address info when making a new invoice
// - I think I would just join 'billTo' from invoice
// - and 'address' from customers in the query
app.post("/create-invoice", authorizeUser, async (req, resp) => {
  console.log("create invoice hit");
  try {
    const invoice_uuid = req.body.invoiceUuid;
    const todays_date = Date.now();
    const bill_to = req.body.billTo;
    const user_id = req.decodedToken["cognito:username"];
    console.log(invoice_uuid);
    console.log(bill_to);
    console.log(user_id);

    const conn = await pool.getConnection();
    const response = await conn.execute(
      "INSERT INTO invoiceDb.invoices (invoice_uuid, todays_date, bill_to, user_id) VALUES (?,?,?,?)",
      [invoice_uuid, todays_date, bill_to, user_id]
    );

    conn.release();
    resp.status(201).send(response);
  } catch (error) {
    console.log("This is your error", error);
    resp.status(500).send({ message: error });
  }
});

//adding an order route
app.post("/add-order", authorizeUser, async (req, resp) => {
  console.log("add order hit");
  try {
    const quantity = req.body.quantity;
    const cost = req.body.cost;
    const order_description = req.body.itemDescription;
    const invoice_uuid = req.body.invoiceUuid;
    const user_id = req.decodedToken["cognito:username"];
    const conn = await pool.getConnection();
    const response = await conn.execute(
      "INSERT INTO invoiceDb.orders (quantity, cost, order_description, invoice_uuid, user_id) VALUES (?,?,?,?,?)",
      [quantity, cost, order_description, invoice_uuid, user_id]
    );

    conn.release();
    resp.status(201).send(response);
  } catch (error) {
    console.log("This is your error", error);
    resp.status(500).send({ message: error });
  }
});

// - Update Invoice
// app.post("/update-invoice", authorizeUser, async (req, resp) => {
//   console.log("update invoice hit");
//   try {
//     const invoiceUuid = req.body.invoiceUuid;
//     const date = Date.now();
//     const billTo = req.body.customerName;
//     const itemDescription = req.body.itemDescription;
//     const quantity = req.body.quantity;
//     const pricePerItem = req.body.pricePerItem;
//     const itemSumAmt = req.body.itemSumAmt; //total for that item
//     const totalAmount = req.body.totalAmount; //total for all items

//     const conn = await pool.getConnection();
//     const response = await conn.execute(
//       "UPDATE invoiceDb.invoices SET invoiceUuid=?, date=?, billTo=?, itemDescription=?, quantity=?, pricePerItem=?, itemSumAmt=?, TotalAmount=?) VALUES (?,?,?,?,?,?,?,?)",
//       [
//         invoiceUuid,
//         date,
//         billTo,
//         itemDescription,
//         quantity,
//         pricePerItem,
//         itemSumAmt,
//         totalAmount,
//       ]
//     );

//     conn.release();
//     resp.status(201).send(response);
//   } catch (error) {
//     console.log(error);
//     resp.status(500).send(error);
//   }
// });

// - Delete Invoice
// app.post("/delete-invoice", authorizeUser, async (req, resp) => {
//   console.log("delete invoice hit");
//   try {
//     const invoiceId = req.body.invoiceId;
//     const conn = await pool.getConnection();

//     const response = await conn.execute(
//       "DELETE FROM invoiceDb.invoices WHERE invoiceId=?",
//       [invoiceId]
//     );

//     conn.release();
//     resp.status(200).send({ message: "successfully deleted" });
//   } catch (error) {
//     resp.status(500).send(error);
//     console.log(error);
//   }
// });

// - get all user invoices
// - need another FOREIGN KEY of customer_id?
// app.post("/get-user-invoices", authorizeUser, async (req, resp) => {
//   console.log("get user invoices hit");
//   try {
//     const username = req.decodedToken["cognito:username"];
//     const conn = await pool.getConnection();
//     const response = await conn.execute(
//       "SELECT * FROM invoiceDb.invoices WHERE username=?",
//       [username]
//     );

//     conn.release();
//     resp.status(200).send(response[0]);
//   } catch (error) {
//     console.log(error);
//     resp.status(500).send(error);
//   }
// });

// - search customers - to be able to fill in invoice with customer info
app.post("/customer-search", authorizeUser, async (req, resp) => {
  console.log("get search customer hit");
  try {
    const client_of = req.decodedToken["cognito:username"];
    const conn = await pool.getConnection();
    const response = await conn.execute(
      "SELECT customer_name FROM invoiceDb.customers WHERE client_of = ?",
      [client_of]
    );
    conn.release();
    resp.status(200).send(response[0]);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

//Invoice Generating Routes
//Customer Info
app.post("/get-customer-info", authorizeUser, async (req, resp) => {
  console.log("get customer info hit");
  try {
    const client_of = req.decodedToken["cognito:username"];
    const customer_name = req.body.currentCustomer;
    console.log(customer_name);
    const conn = await pool.getConnection();
    const response = await conn.execute(
      "SELECT * FROM invoiceDb.customers WHERE customer_name = ?",
      [customer_name]
    );
    console.log(response[0][0]);
    conn.release();
    resp.status(200).send(response[0][0]);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

//Order Info
app.post("/get-order-info", authorizeUser, async (req, resp) => {
  console.log("get order info hit");
  try {
    const user_id = req.decodedToken["cognito:username"];
    const invoice_uuid = req.body.orderUuid;
    const conn = await pool.getConnection();
    const response = await conn.execute(
      "SELECT * FROM invoiceDb.orders WHERE invoice_uuid = ?",
      [invoice_uuid]
    );
    conn.release();
    resp.status(200).send(response[0]);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});
//Invoice Info
app.post("/get-invoice-info", authorizeUser, async (req, resp) => {
  console.log("get invoice info hit");
  try {
    const user_id = req.decodedToken["cognito:username"];
    const invoice_uuid = req.body.currentUuid;
    const conn = await pool.getConnection();
    const response = await conn.execute(
      "SELECT * FROM invoiceDb.invoices WHERE invoice_uuid = ?",
      [invoice_uuid]
    );
    conn.release();
    resp.status(200).send(response[0]);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

//Stats Display from Views in MySql

app.post("/customer-count", authorizeUser, async (req, resp) => {
  try {
    console.log("get customer count hit");
    const client_of = req.decodedToken["cognito:username"];
    const conn = await pool.getConnection();
    let response = await conn.execute(
      "SELECT COUNT(id) as TotalCustomers FROM invoiceDb.customers WHERE client_of = ?",
      [client_of]
    );
    console.log(response);
    conn.release();
    resp.status(200).send(response);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

app.post("/invoice-count", authorizeUser, async (req, resp) => {
  try {
    console.log("get invoice count hit");
    const user_id = req.decodedToken["cognito:username"];
    const conn = await pool.getConnection();
    let response = await conn.execute(
      "SELECT COUNT(id) as TotalInvoices FROM invoiceDb.invoices WHERE user_id = ?",
      [user_id]
    );
    console.log(response);
    conn.release();
    resp.status(200).send(response);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});
//SELECT SUM(totals) as ServicesProvided FROM invoiceDb.TotalServicesProvided WHERE user_id =

// function abbreviateNumber(number) {
//   var SI_POSTFIXES = ["", "k", "M", "G", "T", "P", "E"];
//   var tier = (Math.log10(Math.abs(number)) / 3) | 0;
//   if (tier == 0) return number;
//   var postfix = SI_POSTFIXES[tier];
//   var scale = Math.pow(10, tier * 3);
//   var scaled = number / scale;
//   var formatted = scaled.toFixed(1) + "";
//   if (/\.0$/.test(formatted))
//     formatted = formatted.substr(0, formatted.length - 2);
//   return formatted + postfix;
// }

app.post("/services-provided", authorizeUser, async (req, resp) => {
  // displays "2.5k"
  try {
    console.log("get services provided count hit");
    const user_id = req.decodedToken["cognito:username"];
    const conn = await pool.getConnection();
    let response = await conn.execute(
      "SELECT sum(totals) as ServicesProvided FROM invoiceDb.TotalServicesProvided WHERE user_id =?",
      [user_id]
    );
    let result = parseInt(response[0][0].ServicesProvided);
    // console.log(typeof result);
    let number = d3.format(".2s")(result);
    // console.log(d3.format(".3s")(result));
    // console.log(d3.format(".2s")(2500));
    console.log(number);
    // console.log(response[0][0].ServicesProvided);
    conn.release();
    resp.status(200).send(number);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

// - S3 route for PDF's and .txt files

app.listen(PORT, () => console.log("app is listing on", PORT));
