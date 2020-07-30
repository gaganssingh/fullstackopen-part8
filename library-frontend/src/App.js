import React, { useState } from "react";
import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import { useQuery, useMutation } from "@apollo/client";
import { ALL_AUTHORS, ALL_BOOKS, EDIT_AUTHOR } from "./queries";
import UpdateBirthYear from "./components/UpdateBirthYear";
const App = () => {
   const [page, setPage] = useState("authors");
   const authors = useQuery(ALL_AUTHORS);
   const books = useQuery(ALL_BOOKS);

   const [editAuthor] = useMutation(EDIT_AUTHOR, {
      refetchQueries: [{ query: ALL_AUTHORS }],
   });

   return (
      <div>
         <div>
            <button onClick={() => setPage("authors")}>authors</button>
            <button onClick={() => setPage("books")}>books</button>
            <button onClick={() => setPage("add")}>add book</button>
         </div>

         <Authors show={page === "authors"} authors={authors} />
         <UpdateBirthYear
            show={page === "authors"}
            authors={authors}
            editAuthor={editAuthor}
         />

         <Books show={page === "books"} books={books} />

         <NewBook show={page === "add"} />
      </div>
   );
};

export default App;
