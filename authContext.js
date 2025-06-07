import { createContext, useContext, useState, useEffect } from "react";
import {useNavigate} from "react-router-dom"
import api from "../api/axios"

const AuthContext = createContext()

export const AuthContextProvider = ({children})=>{
    const [user, setUser] = useState({})
    const [authTkn,setAuthTkn] = useState('init')
    const navigate = useNavigate()

const getUser = async()=>{
    try {
        const response = await api.get("/user")
        if(response.status === 200){
            setUser(response.data.user)
        }else {
            if(response.data.message == "unauthorized"){
                setAuthTkn(response.data.message)
            }
        }
    } catch (error) {
        console.log(error)
    }
}

useEffect(()=>{
    const token = localStorage.getItem("token")
    if(token){
        getUser()
        return
    }
},[])

useEffect(()=>{
   if(authTkn === "unauthorized"){
    localStorage.clear()
    setUser({})
    navigate("/login")
   }
},[authTkn])

    return(
        <AuthContext.Provider value={{user,authTkn}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuthContext = ()=>{
    return useContext(AuthContext)
}
