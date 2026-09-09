import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToasterProvider } from "./components/Toaster.jsx";
import HomePage from "./pages/Home.jsx";
import LoginPage from "./pages/Login.jsx";
import RegisterPage from "./pages/Register.jsx";
import DashboardPage from "./pages/Dashboard.jsx";
import SubjectsPage from "./pages/Subjects.jsx";
import SubjectDetailPage from "./pages/SubjectDetail.jsx";
import NotesPage from "./pages/Notes.jsx";
import NoteEditorPage from "./pages/NoteEditor.jsx";
import ChatPage from "./pages/Chat.jsx";
import QuizzesPage from "./pages/Quizzes.jsx";
import QuizPlayerPage from "./pages/QuizPlayer.jsx";

function App() {
  return (
    <ToasterProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/subjects" element={<SubjectsPage />} />
          <Route path="/subjects/:id" element={<SubjectDetailPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/notes/:id" element={<NoteEditorPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/quizzes" element={<QuizzesPage />} />
          <Route path="/quizzes/:id" element={<QuizPlayerPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </ToasterProvider>
  );
}

createRoot(document.getElementById("root")).render(<App />);
