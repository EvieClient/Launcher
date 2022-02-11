import React from "react";

function Loading(props: { text: JSX.Element }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blurple drop-shadow-2xl" />
      <br />
      <span>{props.text}</span>
    </div>
  );
}

export default Loading;
