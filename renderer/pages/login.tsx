import React from "react";
import LoginForm from "../components/LoginForm";

function Login() {
  return (
    <React.Fragment>
      <div
        className="min-h-screen bg-no-repeat bg-cover bg-center"
        style={{
          backgroundImage: 'url("/images/puryan.png")',
        }}
      >
        <span className="absolute bottom-0 left-0 m-4 text-white">
          Evie Client
        </span>
        <div className="flex justify-end">
          <div className="min-h-screen w-1/2 flex justify-center items-center">
            <div>
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

export default Login;
