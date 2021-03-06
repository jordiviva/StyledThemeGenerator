const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname + "/.env") });
import { merge } from "lodash";
import { DateType } from "./api/ScalarTypes/Date";
import { gql } from "apollo-server";
import * as models from "./api/models";

const { ApolloServer } = require("apollo-server-express");
const jwksClient = require("jwks-rsa");
const jwt = require("jsonwebtoken");

const express = require("express");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const serverNext = next({ dev });
const handle = serverNext.getRequestHandler();

const rootQuery = gql`
  scalar Date

  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`;

const resolvers = merge(DateType);

const client = jwksClient({
  jwksUri: "https://learn-japanese.eu.auth0.com/.well-known/jwks.json"
});

function getKey(header, cb) {
  client.getSigningKey(header.kid, function(err, key) {
    var signingKey = key.publicKey || key.rsaPublicKey;
    cb(null, signingKey);
  });
}

//TODO Mirar de conseguir que funcioni amb el audience tambe
const options = {
  issuer: "https://learn-japanese.eu.auth0.com/",
  algorithms: ["RS256"]
};

//introspection:  true y playground: true permite k graphiql se vea en produccion
const apolloServer = new ApolloServer({
  typeDefs: [rootQuery],
  resolvers,
  introspection: true,
  playground: true,
  context: async ({ req }) => {
    let authToken = null;
    let user = null;
    try {
      authToken = req.headers["authorization"];
      console.log("context auth token = ", authToken);

      user = new Promise((resolve, reject) => {
        jwt.verify(authToken, getKey, options, (err, decoded) => {
          console.log("decoded = ", decoded);
          if (err) {
            console.log("Error verifying token ", err);
            return reject(err);
          }
          resolve(decoded.email);
        });
      });
    } catch (e) {
      console.warn(`Unable to authenticate using auth token: ${authToken}`);
    }

    return {
      user
    };
  }
});

let port = process.env.PORT;
if (port == null || port === "") {
  port = 3000;
}
serverNext
  .prepare()
  .then(() => {
    const app = express();

    //limitar * per a que no inclogui /api
    app.get(/^(?!(?:\/api)$).*$/, (req, res) => {
      return handle(req, res);
    });

    apolloServer.applyMiddleware({ app, path: "/api" });

    models.sequelize
      .sync(/*{ force: true }*/)
      .then(function() {
        app.listen(port, err => {
          if (err) throw err;
          console.log("> Ready on http://localhost:3000");
        });
      })
      .catch(e => {
        console.log("Error al construir sequelize: ", e);
      });
  })
  .catch(ex => {
    console.error(ex.stack);
    process.exit(1);
  });
