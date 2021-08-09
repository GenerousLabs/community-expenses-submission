#!/usr/bin/env node

import { JSONFile, Low } from "lowdb";
// const { JSONFile } = require("lowdb/lib/adapters/JSONFile.js");
// const { Low } = require("lowdb/lib/Low");
import { GraphQLServer } from "graphql-yoga";

const typeDefs = `
  type Query {
    hello(name: String): String!
  }
`;

const resolvers = {
  Query: {
    hello: (_, { name }) => `Hello ${name || "World"}`,
  },
};

const server = new GraphQLServer({ typeDefs, resolvers });
server.start();
