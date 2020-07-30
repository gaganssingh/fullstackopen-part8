import React, { useState } from "react";
import Select from "react-select";

const AuthorForm = (props) => {
   const [name, setName] = useState("");
   const [bornStr, setBornStr] = useState("");
   const [selectedOption, setSelectedOption] = useState("");

   if (props.authors.loading) {
      return <div>loading...</div>;
   }
   const authors = props.authors.data.allAuthors;
   let options = [];
   options = authors.map((author) => {
      return { value: author.name, label: author.name };
   });

   const handleSelect = (selectedOption) => {
      setSelectedOption(selectedOption);
      setName(selectedOption.value);
   };

   const submit = async (event) => {
      event.preventDefault();

      const born = parseInt(bornStr);

      await props.editAuthor({ variables: { name, born } });
      setSelectedOption("");
      setName("");
      setBornStr("");
   };

   if (!props.show) {
      return null;
   }

   return (
      <div>
         <h2>Edit Author Birthyear</h2>
         <form onSubmit={submit}>
            <Select
               value={selectedOption}
               onChange={handleSelect}
               options={options}
            />
            <div>
               born
               <input
                  value={bornStr}
                  onChange={({ target }) => setBornStr(target.value)}
               />
            </div>
            <button type="submit">Edit Birthday</button>
         </form>
      </div>
   );
};

export default AuthorForm;
