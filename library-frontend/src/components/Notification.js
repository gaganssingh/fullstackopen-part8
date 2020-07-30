import React from "react";

const Notification = (props) => {
   return (
      props.errorMessage && (
         <div style={{ color: "red" }}>{props.errorMessage}</div>
      )
   );
};

export default Notification;
