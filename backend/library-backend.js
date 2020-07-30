const { ApolloServer, gql, PubSub } = require("apollo-server");
const mongoose = require("mongoose");
const Author = require("./models/author");
const Book = require("./models/book");
const User = require("./models/user");
const config = require("./utils/config");

mongoose.set("useFindAndModify", false);

const MONGODB_URI = config.MONGODB_URI;
const JWT_SECRET = config.JWT_SECRET;

console.log("connecting to", MONGODB_URI);

mongoose
   .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
   .then(() => {
      console.log("connected to MongoDB");
   })
   .catch((error) => {
      console.log("error connection to MongoDB:", error.message);
   });

const pubSub = new PubSub();

let authors = [
   {
      name: "Robert Martin",
      id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
      born: 1952,
   },
   {
      name: "Martin Fowler",
      id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
      born: 1963,
   },
   {
      name: "Fyodor Dostoevsky",
      id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
      born: 1821,
   },
   {
      name: "Joshua Kerievsky", // birthyear not known
      id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
   },
   {
      name: "Sandi Metz", // birthyear not known
      id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
   },
];

/*
 * It would be more sensible to assosiate book and the author by saving
 * the author id instead of the name to the book.
 * For simplicity we however save the author name.
 */

let books = [
   {
      title: "Clean Code",
      published: 2008,
      author: "Robert Martin",
      id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
      genres: ["refactoring"],
   },
   {
      title: "Agile software development",
      published: 2002,
      author: "Robert Martin",
      id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
      genres: ["agile", "patterns", "design"],
   },
   {
      title: "Refactoring, edition 2",
      published: 2018,
      author: "Martin Fowler",
      id: "afa5de00-344d-11e9-a414-719c6709cf3e",
      genres: ["refactoring"],
   },
   {
      title: "Refactoring to patterns",
      published: 2008,
      author: "Joshua Kerievsky",
      id: "afa5de01-344d-11e9-a414-719c6709cf3e",
      genres: ["refactoring", "patterns"],
   },
   {
      title: "Practical Object-Oriented Design, An Agile Primer Using Ruby",
      published: 2012,
      author: "Sandi Metz",
      id: "afa5de02-344d-11e9-a414-719c6709cf3e",
      genres: ["refactoring", "design"],
   },
   {
      title: "Crime and punishment",
      published: 1866,
      author: "Fyodor Dostoevsky",
      id: "afa5de03-344d-11e9-a414-719c6709cf3e",
      genres: ["classic", "crime"],
   },
   {
      title: "The Demon",
      published: 1872,
      author: "Fyodor Dostoevsky",
      id: "afa5de04-344d-11e9-a414-719c6709cf3e",
      genres: ["classic", "revolution"],
   },
];

const typeDefs = gql`
   type Author {
      name: String!
      born: Int
      bookCount: Int!
   }
   type Book {
      title: String!
      author: Author!
      published: Int!
      genres: [String!]!
      id: ID!
   }
   type User {
      username: String!
      favoriteGenre: String!
      id: ID!
   }
   type Token {
      value: String!
   }
   type Query {
      bookCount: Int!
      authorCount: Int!
      allBooks(author: String, genre: String): [Book!]!
      allAuthors: [Author!]!
      me: User
   }
   type Mutation {
      addBook(
         title: String!
         author: String!
         published: Int
         genres: [String!]!
      ): Book
      editAuthor(name: String!, setBornTo: Int): Author
      createUser(username: String!, favoriteGenre: String!): User
      login(username: String!, password: String!): Token
   }
   type Subscription {
      bookAdded: Book!
      authorAdded: Author!
   }
`;

const getAuthorId = async (name) => {
   const authorByName = await Author.findOne({ name: name });
   if (authorByName === null) {
      return null;
   } else {
      return authorByName._id;
   }
};

const authorDetails = (booklist) => {
   return booklist.map((book) => {
      const { title, published, genres, author } = book;
      return {
         title,
         published,
         genres,
         author: Author.findById(author),
      };
   });
};

const resolvers = {
   Query: {
      bookCount: () => Book.collection.countDocuments(),
      authorCount: () => Author.collection.countDocuments(),
      allBooks: async (root, args) => {
         if (!args.author && !args.genre) {
            const allBooks = await Book.find({});
            return authorDetails(allBooks);
         } else if (!args.author && args.genre) {
            const allBooks = await Book.find({ genres: { $in: args.genre } });
            return authorDetails(allBooks);
         } else if (args.author && !args.genre) {
            const authorId = await getAuthorId(args.author);
            const allBooks = await Book.find({ author: { $in: [authorId] } });
            return authorDetails(allBooks);
         } else if (args.author && args.genre) {
            const authorId = await getAuthorId(args.author);
            const allBooks = await Book.find({
               author: { $in: [authorId] },
               genres: { $in: args.genre },
            });
            return authorDetails(allBooks);
         }
         return [];
      },
      allAuthors: (root, args) => {
         return Author.find({}).populate("books");
      },
      me: (root, args, context) => {
         return context.currentUser;
      },
   },
   Author: {
      bookCount: async (root) => root.books.length,
   },
   Mutation: {
      addBook: async (root, args, { currentUser }) => {
         let bookAuthor = null;
         let authorId = null;

         if (!currentUser) {
            throw new AuthenticationError("Not Authenticated, please sign in");
         }

         const existingAuthor = await Author.findOne({ name: args.author });
         if (existingAuthor !== null && existingAuthor._id !== null) {
            authorId = existingAuthor._id;
         }
         if (authorId === null) {
            try {
               bookAuthor = new Author({ name: args.author });
               await bookAuthor.save();

               pubSub.publish("AUTHOR_ADDED", { authorAdded: bookAuthor });
            } catch (error) {
               throw new UserInputError(error.message, {
                  invalid: args,
               });
            }
         } else {
            bookAuthor = await Author.findById(authorId);
         }

         const book = new Book({
            ...args,
            author: bookAuthor,
         });

         try {
            await book.save();
            await bookAuthor.updateOne({ $push: { books: book } });
         } catch (error) {
            throw new UserInputError(error.message, {
               invalid: args,
            });
         }
         pubSub.publish("BOOK_ADDED", { bookAdded: book });
         return book;
      },
      editAuthor: async (root, args, { currentUser }) => {
         if (!currentUser) {
            throw new AuthenticationError("Not Authenticated, please sign in");
         }

         const author = await Author.findOne({ name: args.name });
         author.born = args.setBornTo;
         return author.save();
      },
      createUser: (root, args) => {
         const user = new User({
            username: args.username,
            favoriteGenre: args.favoriteGenre,
         });

         return user.save().catch((error) => {
            throw new UserInputError(error.message, {
               invalidArgs: args,
            });
         });
      },
      login: async (root, args) => {
         const user = await User.findOne({ username: args.username });

         if (!user || args.password !== "secret") {
            throw new UserInputError("Incorrect credentials");
         }
         const userForToken = {
            username: user.username,
            id: user._id,
         };
         return { value: jwt.sign(userForToken, JWT_SECRET) };
      },
   },
   Subscription: {
      bookAdded: {
         subscribe: () => pubSub.asyncIterator(["BOOK_ADDED"]),
      },
      authorAdded: {
         subscribe: () => pubSub.asyncIterator(["AUTHOR_ADDED"]),
      },
   },
};

const server = new ApolloServer({
   typeDefs,
   resolvers,
   context: async ({ req }) => {
      const auth = req ? req.headers.authorization : null;
      if (auth && auth.toLowerCase().startsWith("bearer")) {
         const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET);
         const currentUser = await User.findById(decodedToken.id);
         return { currentUser };
      }
   },
});

server.listen().then(({ url, subscriptionsUrl }) => {
   console.log(`Server ready at ${url}`);
   console.log(`Subscriptions ready at ${subscriptionsUrl}`);
});
