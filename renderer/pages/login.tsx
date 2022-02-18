import React from "react";
import LoginForm from "../components/LoginForm";

function Login() {
  return (
    <React.Fragment>
      <div>
        <div></div>
        <div className="flex flex-col items-center justify-center h-screen bg-[url('/images/signin.png')] bg-cover">
          <LoginForm />
        </div>
      </div>
    </React.Fragment>
  );
}

export default Login;
