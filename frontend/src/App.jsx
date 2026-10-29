import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import AddTask from "./pages/AddTask";
import TaskDetails from "./pages/TaskDetails";
import EditTask from "./pages/EditTask";
import EmployeeProfile from "./pages/EmployeeProfile";
import WeeklyReport from "./pages/WeeklyReport";
import MonthlyReport from "./pages/MonthlyReport";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/tasks" element={<Tasks />} />

        <Route path="/add-task" element={<AddTask />} />

        <Route path="/tasks/:id" element={<TaskDetails />} />

        <Route path="/edit-task/:id" element={<EditTask />} />

        <Route path="/employees/:id"element={<EmployeeProfile />}/>

        <Route path="/weekly-report"element={<WeeklyReport />}/>

        <Route path="/monthly-report"element={<MonthlyReport />}/>
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;