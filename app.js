//GET ROUTES
//- Customer Info
//- Created Invoice
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
      "INSERT INTO invoiceDb.invoices (username) VALUES (?)",
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
    const name =
      req.body.name === "" || undefined ? oldData.name : req.body.name;
    const companyName =
      req.body.companyName === "" || undefined
        ? oldData.companyName
        : req.body.companyName;
    const companyAddress =
      req.body.companyAddress === "" || undefined
        ? oldData.companyAddress
        : req.body.companyAddress;
    console.log(name);
    console.log(companyName);
    console.log(companyAddress);
    console.log(oldData);
    const response = await conn.execute(
      "UPDATE invoiceDb.users SET name=?, companyName=?, companyAddress=? WHERE username=?",
      [name, companyName, companyAddress, username]
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
    const username = req.decodedToken["cognito:username"];
    //we want the unique username because the user has their own customers.
    //we do not want other people to be able to login and simply have access to every customer in the DB
    //I think
    const conn = await pool.getConnection();
    const customerName = req.body.customerName;

    const response = await conn.execute(
      //Do I need to include the username in the customer table?
      "INSERT INTO invoiceDb.customers (customerName) VALUES (?)",
      [customerName]
    );

    conn.release();
    resp.status(200).send(response);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

// - Update Customer Info
app.post("/update-customer", authorizeUser, async (req, resp) => {
  console.log("update customer hit");
  try {
    const username = req.decodedToken["cognito:username"];
    const conn = await pool.getConnection();
    const customerName = req.body.customerName;

    const foo = await conn.execute(
      "SELECT * FROM invoiceDb.customers WHERE username=?",
      [username]
    );
    const oldData = foo[0][0];
    //if entered data is empty store old data and if not store new data
    const customerName =
      req.body.customerName === "" || undefined
        ? oldData.customerName
        : req.body.customerName;
    const customerAddress =
      req.body.customerAddress === "" || undefined
        ? oldData.customerAddress
        : req.body.customerAddress;
    const email =
      req.body.email === "" || undefined ? oldData.email : req.body.email;
    console.log(customerName);
    console.log(customerAddress);
    console.log(email);
    console.log(oldData);
    const response = await conn.execute(
      "UPDATE invoiceDb.customers SET customerName=?, customerAddress=?, email=? WHERE username=?",
      [customerName, customerAddress, email, username]
    );
    conn.release();
    resp.status(201).send(response);
  } catch (error) {
    console.log(error);
    resp.status(500).send({ message: error });
  }
});

// - Create a new invoice
app.post("/create-invoice", authorizeUser, async (req, resp) => {
  console.log("create invoice hit");
  try {
    const invoiceUuid = req.body.invoiceUuid;
    const date = Date.now();
    const billTo = req.body.customerName;
    const itemDescription = req.body.itemDescription;
    const quantity = req.body.quantity;
    const pricePerItem = req.body.pricePerItem;
    const itemSumAmt = req.body.itemSumAmt; //total for that item
    const totalAmount = req.body.totalAmount; //total for all items

    const conn = await pool.getConnection();
    const response = await conn.execute(
      "INSERT INTO invoiceDb.invoices (invoiceUuid, date, billTo, itemDescription, quantity, pricePerItem, itemSumAmt, TotalAmount) VALUES (?,?,?,?,?,?,?,?)",
      [
        invoiceUuid,
        date,
        billTo,
        itemDescription,
        quantity,
        pricePerItem,
        itemSumAmt,
        totalAmount,
      ]
    );

    conn.release();
    resp.status(201).send(response);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

// - Update Invoice
app.post("/update-invoice", authorizeUser, async (req, resp) => {
  console.log("update invoice hit");
  try {
    const invoiceUuid = req.body.invoiceUuid;
    const date = Date.now();
    const billTo = req.body.customerName;
    const itemDescription = req.body.itemDescription;
    const quantity = req.body.quantity;
    const pricePerItem = req.body.pricePerItem;
    const itemSumAmt = req.body.itemSumAmt; //total for that item
    const totalAmount = req.body.totalAmount; //total for all items

    const conn = await pool.getConnection();
    const response = await conn.execute(
      "UPDATE invoiceDb.invoices SET invoiceUuid=?, date=?, billTo=?, itemDescription=?, quantity=?, pricePerItem=?, itemSumAmt=?, TotalAmount=?) VALUES (?,?,?,?,?,?,?,?)",
      [
        invoiceUuid,
        date,
        billTo,
        itemDescription,
        quantity,
        pricePerItem,
        itemSumAmt,
        totalAmount,
      ]
    );

    conn.release();
    resp.status(201).send(response);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

// - Delete Invoice
app.post("/delete-invoice", authorizeUser, async (req, resp) => {
  console.log("delete invoice hit");
  try {
    const invoiceId = req.body.invoiceId;
    const conn = await pool.getConnection();

    const response = await conn.execute(
      "DELETE FROM invoiceDb.invoices WHERE invoiceId=?",
      [invoiceId]
    );

    conn.release();
    resp.status(200).send({ message: "successfully deleted" });
  } catch (error) {
    resp.status(500).send(error);
    console.log(error);
  }
});

// - get all user invoices
app.post("/get-user-invoices", authorizeUser, async (req, resp) => {
  console.log("get user invoices hit");
  try {
    const username = req.decodedToken["cognito:username"];
    const conn = await pool.getConnection();
    const response = await conn.execute(
      "SELECT * FROM invoiceDb.invoices WHERE username=?",
      [username]
    );

    conn.release();
    resp.status(200).send(response[0]);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

// - search customers - to be able to fill in invoice with customer info
app.post("/search", authorizeUser, async (req, resp) => {
  console.log("get search customer hit");
  try {
    const search = req.body.search;
    const conn = await pool.getConnection();
    const response = await conn.execute(
      "SELECT * FROM invoiceDb.customers WHERE name LIKE ?",
      ["%" + search + "%"]
    );
    conn.release();
    resp.status(200).send(response[0]);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});
// - S3 route for PDF's and .txt files
