import React from "react";

const Books = (props) => {
   let username = "";
   let userFavGenre = "";

   if (!props.show) {
      return null;
   }

   if (props.show && props.myInfo && !props.myInfo.loading) {
      username = props.myInfo.data.me.username;
      userFavGenre = props.myInfo.data.me.favoriteGenre;
   }

   if (props.books.loading || (props.myInfo && props.myInfo.loading)) {
      return <div>loading...</div>;
   }

   const books = props.books.data.allBooks;
   // console.log(props.page, books)
   const genresList = props.genresList;

   const genreButtons = (genresList) => {
      if (props.myInfo) {
         return (
            <div>
               <p>
                  Filtering by {username}'s favorite genre: {userFavGenre}
               </p>
            </div>
         );
      }

      return (
         <div>
            <p>Filter by genres:</p>
            <div>
               {genresList &&
                  genresList.map((genre) => {
                     return (
                        <button
                           key={genre}
                           onClick={() => props.setGenreFilter(genre)}
                        >
                           {genre}
                        </button>
                     );
                  })}
               <button onClick={() => props.setGenreFilter("")}>
                  all genres
               </button>
            </div>
         </div>
      );
   };

   const pageTitle = () => {
      if (props.myInfo) {
         return <h2>recommended books </h2>;
      } else {
         return <h2>books</h2>;
      }
   };

   return (
      <div>
         {pageTitle()}
         {genreButtons(genresList)}
         <table>
            <tbody>
               <tr>
                  <th>title</th>
                  <th>author</th>
                  <th>published</th>
                  <th>genres</th>
               </tr>
               {books.map((book) => {
                  return (
                     <tr key={book.title}>
                        <td>{book.title}</td>
                        <td>{book.author.name}</td>
                        <td>{book.published}</td>
                        <td>
                           <ul>
                              {book.genres.map((genre) => (
                                 <li key={genre}>{genre}</li>
                              ))}
                           </ul>
                        </td>
                     </tr>
                  );
               })}
            </tbody>
         </table>
      </div>
   );
};

export default Books;
