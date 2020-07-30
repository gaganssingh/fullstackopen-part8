import React, { useState } from "react";
import Select from "react-select";

const UpdateBirthYear = (props) => {
   const [name, setName] = useState("");
   const [year, setYear] = useState("");
   const [selectedOption, setSelectedOption] = useState("");

   if (props.authors.loading) {
      return <div>loading...</div>;
   }
   const authors = props.authors.data.allAuthors;
   let options = [];
   options = authors.map((author) => {
      return { value: author.name, label: author.name };
   });

   const handleOptionSelection = (selectedOption) => {
      setSelectedOption(selectedOption);
      setName(selectedOption.value);
   };

   const submit = async (event) => {
      event.preventDefault();
      const born = parseInt(year);
      await props.editAuthor({ variables: { name, born } });
      setSelectedOption("");
      setName("");
      setYear("");
   };

   if (!props.show) {
      return null;
   }

   return (
      <div>
         <h2>Set birthyear</h2>
         <form onSubmit={submit}>
            <Select
               value={selectedOption}
               onChange={handleOptionSelection}
               options={options}
            />
            <div>
               born
               <input
                  value={year}
                  onChange={({ target }) => setYear(target.value)}
               />
            </div>
            <button type="submit">update author</button>
         </form>
      </div>
   );
};

export default UpdateBirthYear;
