import { Route, Routes } from 'react-router'
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './App.css';


function App() {
  return (
    <div className="App">
    <Routes>
      <Route path='/' element={ <Login/>}/>
      <Route path='/dashboard' element={ <Dashboard/>}/>
    </Routes>
  </div>
  );
}

export default App;
