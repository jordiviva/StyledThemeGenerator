const { makeExecutableSchema } = require("graphql-tools");
const resolvers = require("../resolvers");
const VocabList = require("./VocabList");
const VocabItem = require("./VocabItem");

const rootQuery = `

  type Query {
    vocabLists: [VocabList]
    vocabList(id: Int): VocabList
    vocabListByListName(listName: String): VocabList
    vocabItem(id: Int): VocabItem
  }
  
  type Mutation {
    vocabListAdd(vocabList: NewVocabList): VocabList
  }
`;

const index = makeExecutableSchema({
  typeDefs: [rootQuery, VocabList, VocabItem],
  resolvers
});

module.exports = index;