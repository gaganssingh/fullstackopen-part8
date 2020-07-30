import { gql } from "@apollo/client";

export const ALL_AUTHORS = gql`
   {
      allAuthors {
         name
         born
         bookCount
      }
   }
`;

export const ALL_BOOKS = gql`
   {
      allBooks {
         title
         author
         published
         genres
      }
   }
`;

export const ADD_BOOK = gql`
   mutation addBook(
      $title: String!
      $author: String!
      $published: Int
      $genres: [String!]!
   ) {
      addBook(
         title: $title
         author: $author
         published: $published
         genres: $genres
      ) {
         title
         author
         published
         genres
      }
   }
`;

export const EDIT_AUTHOR = gql`
   mutation editAuthor($name: String!, $born: Int) {
      editAuthor(name: $name, setBornTo: $born) {
         name
         born
         bookCount
      }
   }
`;

export const LOGIN = gql`
   mutation login($username: String!, $password: String!) {
      login(username: $username, password: $password) {
         value
      }
   }
`;

export const BOOK_DETAILS = gql`
   fragment BookDetails on Book {
      id
      title
      author {
         name
         born
         bookCount
      }
      published
      genres
   }
`;

export const BOOK_ADDED = gql`
   subscription {
      bookAdded {
         ...BookDetails
      }
   }

   ${BOOK_DETAILS}
`;

export const FILTERED_BOOKS = gql`
   query allBooks($genre: [String!]) {
      allBooks(genre: $genre) {
         title
         author {
            name
            born
            bookCount
         }
         published
         genres
      }
   }
`;
