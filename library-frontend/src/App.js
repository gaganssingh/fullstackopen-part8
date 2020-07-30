import React, { useState } from "react";
import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import { useQuery, useMutation } from "@apollo/client";
import {
   ALL_AUTHORS,
   ALL_BOOKS,
   EDIT_AUTHOR,
   BOOK_ADDED,
   FILTERED_BOOKS,
} from "./queries";
import AuthorForm from "./components/AuthorForm";

const App = () => {
   const [page, setPage] = useState("authors");
   const [token, setToken] = useState(null);
   const [errorMessage, setErrorMessage] = useState(null);
   const [filteredGenre, setFilteredGenre] = useState("");
   const [filteredBooks, setFilteredBooks] = useState(null);

   const [recommendedGenre, setRecommendedGenre] = useState("");
   const [recommendedBooks, setRecommendedBooks] = useState(null);

   const [genresList, setGenresList] = useState([]);

   const client = useApolloClient();

   const handleError = (error) => {
      setErrorMessage(error.graphQLErrors[0].message);
      setTimeout(() => {
         setErrorMessage(null);
      }, 10000);
   };

   const updateCacheWith = (addedBook) => {
      // console.log('added book', addedBook)
      const includedIn = (set, object) => {
         return set.map((book) => book.id).includes(object.id);
      };

      const dataInStore = client.readQuery({ query: ALL_BOOKS });
      if (!includedIn(dataInStore.allBooks, addedBook)) {
         dataInStore.allBooks.push(addedBook);
         client.writeQuery({
            query: ALL_BOOKS,
            data: dataInStore,
         });
      }
   };

   const allAuthors = useQuery(ALL_AUTHORS, {
      fetchPolicy: "network-only",
      // pollInterval: 1000
   });
   const allBooks = useQuery(ALL_BOOKS, {
      fetchPolicy: "network-only",
   });

   const myInfo = useQuery(MY_INFO, {
      pollInterval: 1000,
   });

   const [addBook] = useMutation(ADD_BOOK, {
      onError: handleError,
      update: (store, response) => {
         updateCacheWith(response.data.addBook);
      },
      // refetchQueries: [{ query: ALL_BOOKS }, { query: ALL_AUTHORS }]
      refetchQueries: [{ query: ALL_AUTHORS }],
   });

   const [editAuthor] = useMutation(EDIT_AUTHOR, {
      refetchQueries: [{ query: ALL_AUTHORS }],
   });

   const [login] = useMutation(LOGIN, {
      onError: handleError,
   });

   /* For book list */
   useEffect(() => {
      /* If there's no filter, just show allBooks */
      if (filteredGenre === "") {
         // console.log('no genre to filter all')
         setFilteredBooks(allBooks);
      } else {
         const getFiltered = async (genre, client) => {
            // console.log('querying client', genre)
            const result = await client.query({
               query: FILTERED_BOOKS,
               variables: { genre },
               // fetchPolicy: "no-cache"
               fetchPolicy: "network-only",
            });
            setFilteredBooks(result);
         };
         getFiltered(filteredGenre, client);
      }
   }, [token, filteredGenre, client, allBooks, page]);

   /* For recommended books */
   useEffect(() => {
      /* If there's no filter, just show allBooks */
      if (recommendedGenre === "") {
         // console.log('no recommended genre to filter')
         setRecommendedBooks(allBooks);
      } else {
         const getFiltered = async (genre, client) => {
            // console.log('querying client')
            const result = await client.query({
               query: FILTERED_BOOKS,
               variables: { genre },
               // fetchPolicy: "no-cache"
               fetchPolicy: "network-only",
            });
            setRecommendedBooks(result);
         };
         getFiltered(recommendedGenre, client);
      }
   }, [token, recommendedGenre, client, allBooks, page]);

   useEffect(() => {
      if (myInfo && myInfo.data && myInfo.data.me) {
         if (myInfo.data.me.favoriteGenre !== "") {
            setRecommendedGenre(myInfo.data.me.favoriteGenre);
         }
         // else {
         //   setRecommendedGenre('')
         // }
      }
   }, [myInfo]);

   /* get genres list */
   useEffect(() => {
      // console.log('allbooks', allBooks)
      let allGenres = [];
      if (allBooks && allBooks.data && allBooks.data.allBooks) {
         const books = allBooks.data.allBooks;
         // console.log(books)
         for (let i = 0, numBooks = books.length; i < numBooks; i++) {
            const book = books[i];
            for (
               let j = 0, numGenres = book.genres.length;
               j < numGenres;
               j++
            ) {
               const genre = book.genres[j];
               /* add their genres to the list if it's unique */
               if (!allGenres.includes(genre)) {
                  allGenres.push(genre);
               }
            }
         }
      }
      // console.log('genres', allGenres)
      setGenresList(allGenres);
   }, [allBooks]);

   /* Subscription */
   useSubscription(BOOK_ADDED, {
      onSubscriptionData: ({ subscriptionData }) => {
         const bookTitle = subscriptionData.data.bookAdded.title;
         const message = `Added ${bookTitle} to booklist`;
         setErrorMessage(message);
         setTimeout(() => {
            setErrorMessage("");
         }, 5000);

         const addedBook = subscriptionData.data.bookAdded;
         updateCacheWith(addedBook);
         // console.log(subscriptionData)
      },
   });

   const logout = () => {
      setToken(null);
      setPage("authors");
      setFilteredGenre("");
      localStorage.clear();
      client.resetStore();
   };

   if (!token) {
      return (
         <div>
            <Notification errorMessage={errorMessage} />
            <LoginForm login={login} setToken={(token) => setToken(token)} />
         </div>
      );
   }

   if (token && myInfo.data.me === null) {
      return <div>loading...</div>;
   }

   return (
      <div>
         <div>Hello {myInfo.data.me && myInfo.data.me.username}</div>

         <div>
            <button onClick={() => setPage("authors")}>authors</button>
            <button onClick={() => setPage("books")}>books</button>
            <button onClick={() => setPage("recommended")}>recommended</button>
            <button onClick={() => setPage("add")}>add book</button>
            <button onClick={logout}>logout</button>
         </div>
         <Notification errorMessage={errorMessage} />
         <Authors show={page === "authors"} authors={allAuthors} />
         <AuthorForm
            show={page === "authors"}
            authors={allAuthors}
            editAuthor={editAuthor}
         />
         <Books
            show={page === "books"}
            page={"booklist"}
            books={filteredBooks}
            setGenreFilter={setFilteredGenre}
            genresList={genresList}
         />
         <Books
            show={page === "recommended"}
            page={"recommended"}
            myInfo={myInfo}
            books={recommendedBooks}
            setGenreFilter={setRecommendedGenre}
            genresList={genresList}
         />
         <NewBook show={page === "add"} addBook={addBook} />
      </div>
   );
};

export default App;
