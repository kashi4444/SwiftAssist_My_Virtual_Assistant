import React, { useContext, useEffect, useRef, useState } from 'react'
import { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom';
import aiImg from '../assets/ai.gif'
import userImg from '../assets/user.gif'
import axios from 'axios';
import { CgMenuRight } from "react-icons/cg";
import { RxCross1 } from "react-icons/rx";


function Home() {

  const {userData, serverUrl, setUserData, getGeminiResponse} = useContext(userDataContext);
  const navigate = useNavigate();
  const[listening, setListening] = useState(false);
  const[userText, setUserText] = useState("");
  const[aiText, setAiText] = useState("");
  const[started, setStarted] = useState(false);
  const[ham, setHam] = useState(false);
  const isSpeakingRef = useRef(false);
  const recognitionRef = useRef(null);
  const isRecognizingRef = useRef(false);

  const synth = window.speechSynthesis;

  const handleLogout = async()=>{
    try{
      const result = await axios.get(`${serverUrl}/api/auth/logout`, {withCredentials: true})
      setUserData(null);
      navigate('/login')
    }catch(err){
      setUserData(null)
      console.log("Logout Error");
    }
  }

  const startRecognition = ()=>{
    if(!isSpeakingRef.current && !isRecognizingRef.current){
      try{
        recognitionRef.current?.start();
        console.log("Recognition requested to start")
      }catch(err){
        if(err.name !== "InvalidStateError"){
          console.log("Start error: ", err);
        }
      }
    }
    
  }

  const speak = (text)=>{
    if(!window._allowedToSpeak){
      handleAllow();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN'
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang === 'hi-IN');
    if(hindiVoice){
      utterance.voice = hindiVoice;
    }

    isSpeakingRef.current = true;
    utterance.onend = ()=>{
      setAiText("")
      isSpeakingRef.current = false
      setTimeout(()=>{
        startRecognition();
      }, 800)
      
    }
    synth.cancel();
    synth.speak(utterance);
  }

  const handleCommand = (data)=>{
    const {type, userInput, response} = data;
    speak(response);

    if (type === 'google_search') {
      const query = encodeURIComponent(userInput);
      window.open(`https://www.google.com/search?q=${query}`, '_blank');
    }

    if (type === 'calculator_open') {

      window.open('https://www.google.com/search?q=calculator', '_blank');
    }

    if (type === "instagram_open") {
      window.open('https://www.instagram.com/', '_blank');
    }

    if (type === "facebook_open") {
      window.open('https://www.facebook.com/', '_blank');
    }
    if (type === "weather_show") {
      window.open(`https://www.google.com/search?q=weather
      '_blank`);
    }
    
    if (type === 'youtube_search' || type === 'youtube_play'){
      const query = encodeURIComponent(userInput);
      window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
    }
  }

  const handleAllow = ()=>{
    window._allowedToSpeak = true;
    const greeting = new SpeechSynthesisUtterance(`Hello ${userData.name}, what can I help you with?`)
    greeting.lang = 'hi-IN';
    
    synth.speak(greeting);
  }
  useEffect(()=>{
    document.getElementById("start-btn").addEventListener("click", handleAllow);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    const recognition = new SpeechRecognition()
    recognition.continuous = true;
    recognition.lang = 'en-US'
    recognition.interimResults = false

    recognitionRef.current = recognition

    let isMounted = true;

    const startTimeout = setTimeout(()=>{
      if(isMounted && !isSpeakingRef.current && !isRecognizingRef.current){
        try{
          recognition.start();
          console.log("Recognition requested to start")
        }catch(err){
          if(err.name !== "InvalidStateError"){
            console.log(err);
          }
        }
      }
    }, 1000)

    recognition.onstart = ()=>{
      isRecognizingRef.current = true;
      setListening(true);
    }

    recognition.onend = ()=>{
      isRecognizingRef.current = false;
      setListening(false);

      if(isMounted && !isSpeakingRef.current){
        setTimeout(()=>{
          if(isMounted){
            try{
              recognition.start();
              console.log("Recognition restarted")
            }catch(err){
              if(err.name !== "InvalidStateError"){
                console.log(err);
              }
            }
          }
        }, 1000)
      }
    }

    recognition.onerror = (event)=>{
      console.warn("Recognition error: ", event.error);
      isRecognizingRef.current = false;
      setListening(false);
      if(event.error !== "aborted" && isMounted && !isSpeakingRef.current){
        setTimeout(()=>{
          if(isMounted){
            try{
              recognition.start();
              console.log("Recognition restarted after error")
            }catch(err){

            }
          }
        }, 1000);
      }
    }
    
    recognition.onresult = async(e)=>{
      const transcript = e.results[e.results.length - 1][0].transcript.trim();

      if(transcript.toLowerCase().includes(userData.assistantName.toLowerCase())){
        setAiText("");
        setUserText(transcript);
        recognition.stop();
        isRecognizingRef.current = false;
        setListening(false);

        const data = await getGeminiResponse(transcript)
        handleCommand(data);
        setAiText(data.response);
        setUserText("");
      }
    }
    

    return()=>{
      isMounted = false;
      clearTimeout(startTimeout);
      recognition.stop();
      setListening(false);
      isRecognizingRef.current = false;
    }
  },[])

  return (
    <div className='w-full h-[100vh] bg-gradient-to-t from-[black] to-[#02023d] flex justify-center items-center flex-col gap-[15px] relative overflow-hidden'>
      <CgMenuRight className='lg:hidden text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={()=> setHam(true)}/>

      <div className={`absolute lg:hidden top-0 w-full h-full bg-[#00000053] backdrop-blur-lg p-[20px] flex flex-col gap-[20px] items-start ${ham ? "translate-x-0" : "translate-x-full"} transition-transform`}>
        <RxCross1 className='text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={()=> setHam(false)}/>

        <button className='min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full text-[19px] cursor-pointer' onClick={handleLogout}>Log Out</button>
      <button className='min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full text-[19px] px-[20px] py-[10px] cursor-pointer' onClick={()=> navigate('/customize')}>Customize Your Assistant</button>

      <div className='w-full h-[2px] bg-gray-400'></div>
      <div className='text-white font-semibold text-[19px]'>History</div>

      <div className='w-full h-[400px] overflow-y-auto flex flex-col'>
        {userData.history?.map((his)=>(
          <span className='text-gray-200 text-[18px] truncate leading-[26px] mb-[12px]'>{his}</span>
        ))}
      </div>
      </div>
      
      <button className='min-w-[150px] h-[60px] hidden lg:block mt-[30px] text-black font-semibold bg-white rounded-full text-[19px] absolute top-[20px] right-[20px] cursor-pointer' onClick={handleLogout}>Log Out</button>
      <button className='min-w-[150px] h-[60px] hidden lg:block mt-[30px] text-black font-semibold bg-white rounded-full text-[19px] absolute top-[100px] right-[20px] px-[20px] py-[10px] cursor-pointer' onClick={()=> navigate('/customize')}>Customize Your Assistant</button>
      <div className='w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-4xl shadow-lg'>
        <img src={userData?.assistantImage} className='h-full w-full object-cover '></img>
      </div>
      <h1 className='text-white text-[18px] font-semibold'>I'm {userData?.assistantName}</h1>
      {
        !aiText && <img src={userImg} className='w-[200px]'></img>
      }
      {
        aiText && <img src={aiImg} className='w-[200px]'></img>
      }

      <h1 className='text-white text-[18px] font-semibold text-wrap'>{userText ? userText : aiText ? aiText : null}</h1>

      {!started && <button id='start-btn' className='text-white min-w-[150px] h-[60px] mt-[30px] text-black font-semibold rounded-full text-[19px] bg-blue-400 cursor-pointer px-[20px] py-[10px]' onClick={()=> setStarted(true)}>Let's get started</button>}

      
    </div>
  )
}

export default Home