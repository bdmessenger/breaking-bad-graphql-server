const express = require('express');
const { graphqlHTTP } = require('express-graphql');

const schema = require('./schema');

const app = express();

app.use('/', graphqlHTTP({
    schema,
    graphiql: true
}));

app.listen(5000, () => console.log('Server is listening to port: 5000'));