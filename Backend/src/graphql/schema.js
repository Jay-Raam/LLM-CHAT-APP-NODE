const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type User {
    id: ID!
    name: String
    email: String
  }
  type Message {
    id: ID!
    sender: User
    text: String
    createdAt: String
  }
  type Chat {
    id: ID!
    participants: [User]
    messages: [Message]
  }
  type Query {
    me: User
    chats: [Chat]
  }
  type Mutation {
    dummy: String
  }
`;

module.exports = typeDefs;
