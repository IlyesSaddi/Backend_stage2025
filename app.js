require('dotenv').config();

const express = require("express");
const { graphqlHTTP } = require('express-graphql');  // graphqlHTTP est bien une fonction qu'on appelle avec un objet de config.
const mongoose = require('mongoose');
const graphqlschema = require('./graphql/schema/index')
const graphqlresolver = require('./graphql/resolvers/index')

const isAuth = require('./middleware/is_auth');
const cors = require('cors');



const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true, // if you use cookies or auth headers
}));




app.use(isAuth);

app.use('/graphql',
  graphqlHTTP((req) => ({
    schema: graphqlschema,
    rootValue: graphqlresolver,
    graphiql: true,
    context: req,  // ajoute le contexte : ici c’est l’objet req complet
  }))
);



app.get('/',(req,res,next) => {
    res.send("Hello World");
})






mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.suwxstp.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority&appName=Cluster0`)
  .then(() => {
    app.listen(8000, () => console.log("✅ Server running on http://localhost:8000"));
  })
  .catch(err => {
    console.log("❌ Erreur de connexion MongoDB : ", err);
  });


