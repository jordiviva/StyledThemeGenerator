module.exports = `
  type VocabItem {
    id: ID!
    word: String!
    translation: String!
    pronunciation: String
    association: String
    toReviewDate: Date
    toReviewDelay: Int
  }
  
  input NewVocabItem {
    word: String
    translation: String
    pronunciation: String
    association: String
  }
  
  extend type Query {
    vocabItem(id: Int): VocabItem
    vocabItemsReview: VocabList
  }
  
  extend type Mutation {
    vocabItemLearned(id: Int): VocabItem
    vocabItemsReviewed(ids: [ID]): [VocabItem]
  }
`;