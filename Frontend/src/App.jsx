import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import Customize from './pages/Customize'
import { useContext } from 'react'
import { userDataContext } from './context/userContext'
import Home from './pages/Home'
import Customize2 from './pages/Customize2'

function App() {
  const {userData, setUserData} = useContext(userDataContext);
  return (
    <Routes>
      <Route path='/' element={(userData?.assistantImage && userData?.assistantName) ? <Home/> : <Navigate to={'/customize'}/>}/>
      <Route path='/signup' element={!userData ? <SignUp/> : <Navigate to={'/'}/>}/>
      <Route path='/login' element={!userData ? <Login/> : <Navigate to={'/'}/>}/>
      <Route path='/customize' element={userData ? <Customize/> : <Navigate to={'/signup'}/>}/>
      <Route path='/customize2' element={userData ? <Customize2/> : <Navigate to={'/signup'}/>}/>

    </Routes>
  )
}

//6:29:31
export default App