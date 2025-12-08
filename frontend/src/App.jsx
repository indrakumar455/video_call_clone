import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landingPage.jsx";
import Authentication from "./pages/authentication.jsx"
import { AuthProvider } from "./contexts/authContext.jsx";
import VideoMeetComponent from "./pages/videoMeet.jsx";
import HomeComponent from "./pages/home.jsx";
import History from "./pages/history.jsx";
function App() {
  return (
    <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<HomeComponent/>}/>
        <Route path="/auth" element={<Authentication/>}/>
        <Route path="history" element= {<History/>}/>
        <Route path="/:url" element={<VideoMeetComponent/>}/>
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

