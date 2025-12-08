import { createContext, useContext, useState } from "react";

import axios, { HttpStatusCode } from "axios";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext({});

const clinet = axios.create({
  baseURL: "http://localhost:8000/api/v1/users",
});

export const AuthProvider = ({ children }) => {
  const authcontext = useContext(AuthContext);

  const [userData, setUserData] = useState(authcontext);
  const handleRegister = async (name, username, password) => {
    try {
      let request = await clinet.post("/register", {
        name: name,
        username: username,
        password: password,
      });
      if (request.status === HttpStatusCode.Created) {
        return request.data.message;
      }
    } catch (err) {
      throw err;
    }
  };
  const handleLogin = async (username, password) => {
    try {
      let request = await clinet.post("/login", {
        username: username,
        password: password,
      });
      if (request.status == HttpStatusCode.Ok) {
        localStorage.setItem("token", request.data.token);
        router("/home");
      }
    } catch (err) {
      throw err;
    }
  };

  const router = useNavigate();

  const getUserHistory = async () => {
    try {
      let request = await clinet.get("/get_all_activity", {
        params: {
          token: localStorage.getItem("token"),
        },
      });
      console.log("SUCCESS:", request.data);
      return request.data;
    } catch (err) {
      console.log("ERROR:", err.response ? err.response.data : err.message);
      return null;
    }
  };
  const addToUserHistory = async (meetingCode) => {
    try {
      let request = await clinet.post("/add_to_activity", {
        token: localStorage.getItem("token"),
        meeting_code: meetingCode,
      });
      return request;
    } catch (e) {
      throw e;
    }
  };
  const data = {
    userData,
    setUserData,
    handleRegister,
    handleLogin,
    getUserHistory,
    addToUserHistory,
  };
  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};
