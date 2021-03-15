const express = require("express");
const { v4: uuidV4 } = require("uuid");
const app = express();
app.use(express.json());

function checkAccountMiddleware(request, response, next) {
    const id = request.params.id;
    const customer = customers.find(customer => customer.id === id);
    if (!customer) {
        return response.status(404).json({ message: "Customer not found." });
    }
    request.customer = customer;
    return next();
}

function checkBalance(statement) {
    const balance = statement.reduce((accumulator, operation) => {
        if (operation.type === "income") {
            return accumulator + operation.amount;
        }
        return accumulator - operation.amount;
    }, 0);
    return balance;
}

function checkSSNMiddleware(request, response, next) {
    const { ssn, name } = request.body;
    const foundSsn = customers.some(customer => customer.ssn === ssn);
    if (foundSsn) {
        return response.status(400).json({ message: "Customer already exists." });

    }
    request.ssn = ssn;
    request.name = name;
    return next();
}

const customers = [];
app.post("/account", checkSSNMiddleware, (request, response) => {
    const { ssn, name } = request;
    const newCustomer = {
        ssn,
        name,
        id: uuidV4(),
        statement: []
    }
    customers.push(newCustomer);
    return response.status(201).json(newCustomer);

});
app.get("/statement/:id", checkAccountMiddleware, (request, response) => {
    const { customer } = request;
    const balance = checkBalance(customer.statement);
    return response.status(200).json({
        balance,
        statement: customer.statement
    });
});

app.post("/deposit/:id", checkAccountMiddleware, (request, response) => {
    const { description, amount } = request.body;
    const { customer } = request;
    const depositOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "income",
    }
    customer.statement.push(depositOperation);
    return response.status(201).json(depositOperation);
})
app.post("/withdraw/:id", checkAccountMiddleware, (request, response) => {
    const { amount, description } = request.body;
    const { customer } = request;
    const balance = checkBalance(customer.statement);
    if (balance < amount) {
        return response.status(400).json();
    }
    const withdrawOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "outcome",
    }
    customer.statement.push(withdrawOperation)

    return response.status(201).json(withdrawOperation);
})
app.listen(3333, () => {
    console.log("Running on localhost:3333");
})