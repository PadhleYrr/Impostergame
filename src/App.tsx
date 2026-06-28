import { Routes, Route } from "react-router-dom";
import Landing from "./routes/Landing";
import RoomPage from "./routes/RoomPage";
import { Toaster } from "./components/Toaster";

export default function App() {
  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/room/:code" element={<RoomPage />} />
      </Routes>
    </>
  );
}
