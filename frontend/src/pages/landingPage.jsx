import React from "react";
import { Link, useNavigate } from "react-router-dom";
import background from "../assets/background.png";
export default function landingPage() {

  const routeTo = useNavigate();

  const handleLogin = ()=>{
    routeTo("/auth")
  }
  const joinedAsGuest =()=>{
    routeTo("/asas");
  }
  return (
    <div className="landingpagecontainer"   style={{ backgroundImage: `url("/background.png")` }}>
      <nav>
        <div className="navHeader">
          <h2>APNA VIDEO CALL</h2>
        </div>
        <div className="navlist">
          <p onClick={joinedAsGuest}>Joind as Guest</p>
          <p onClick={handleLogin}>Register</p>
          <div role="button" onClick={handleLogin}>Login</div>
        </div>
      </nav>

      <div className="landingmaincontainer">
        <div className="point">
          <h2>
            <span>Connect</span> with your <br />
            Loved once
          </h2>
          <p>cover a distance by apna video call</p>
          <div className="button">
            <Link role="button" style={{textDecoration:"none", color:"white"}} to={"/auth"}>GET START</Link>
          </div>
        </div>
        <div className="img">
          <img src="mobile.png" alt="" />
        </div>
      </div>
    </div>
  );
}
