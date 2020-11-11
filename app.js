require("dotenv").config();
const express = require("express");
const sql = require("mysql2/promise");
const cors = require("cors");
const PORT = 4000;
const authorizeUser = require("./authorization/middleware");
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
// app.post("/update-user", authorizeUser, async (req, resp) => {
//   console.log("update user hit");
//   try {
//     const username = req.decodedToken["cognito:username"];
//     const conn = await pool.getConnection();
//     //getting original user data
//     const foo = await conn.execute(
//       "SELECT * FROM invoiceDb.users WHERE username=?",
//       [username]
//     );
//     const oldData = foo[0][0];
//     //if entered data is empty store old data and if not store new data
//     const name =
//       req.body.name === "" || undefined ? oldData.name : req.body.name;
//     const companyName =
//       req.body.companyName === "" || undefined
//         ? oldData.companyName
//         : req.body.companyName;
//     const companyAddress =
//       req.body.companyAddress === "" || undefined
//         ? oldData.companyAddress
//         : req.body.companyAddress;
//     console.log(name);
//     console.log(companyName);
//     console.log(companyAddress);
//     console.log(oldData);
//     const response = await conn.execute(
//       "UPDATE invoiceDb.users SET name=?, companyName=?, companyAddress=? WHERE username=?",
//       [name, companyName, companyAddress, username]
//     );
//     conn.release();
//     resp.status(201).send(response);
//   } catch (error) {
//     console.log(error);
//     resp.status(500).send(error);
//   }
// });

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
// - S3 route for PDF's and .txt files

app.listen(PORT, () => console.log("app is listing on", PORT));
