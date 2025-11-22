import React, { useContext, useEffect, useRef, useState } from 'react'
import { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Home() {
  const {userData, serverUrl, setUserData, getGeminiResponse} = useContext(userDataContext);
  const navigate = useNavigate();
  const[listening, setListening] = useState(false);
  const isSpeakingRef = useRef(false);
  const recognitionRef = useRef(null);
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
    try{
      recognitionRef.current?.start();
      setListening(true);
    }catch(err){
      if(!err.message.includes("start")){
        console.log("Recognition error: ", err);
      }
    }
  }

  const speak = (text)=>{
    const utterance = new SpeechSynthesisUtterance(text);
    console.log("utterance-: ", utterance);
    utterance.lang = 'hi-IN'
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang === 'hi-IN');
    if(hindiVoice){
      utterance.voice = hindiVoice;
    }

    isSpeakingRef.current = true;
    utterance.onend = ()=>{
      isSpeakingRef.current = false
      startRecognition();
    }
    synth.speak(utterance);
  }

  const handleCommand = (data)=>{
    const {type, userInput, response} = data;
    console.log("response-: ", response);
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
  useEffect(()=>{
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    const recognition = new SpeechRecognition()
    recognition.continuous = true;
    recognition.lang = 'en-US'

    recognitionRef.current = recognition

    const isRecognizingRef = {current:false};

    const safeRecognition = ()=>{
      if(!isSpeakingRef.current && !isRecognizingRef.current){
        try{
          recognition.start();
          console.log("Recognition requested to start");
        }catch(err){
          if(err.name !== "InvalidStateError"){
            console.log("Start error:", err);
          }
        }
      }
    }

    recognition.onstart = ()=>{
      console.log("Recognition started")
      isRecognizingRef.current = true;
      setListening(true);
    }

    recognition.onend = ()=>{
      console.log("Recognition Ended")
      isRecognizingRef.current = false;
      setListening(false);

      if(!isSpeakingRef.current){
        setTimeout(()=>{
          safeRecognition();
        },1000);
      }
    }

    recognition.onerror = (event)=>{
      console.warn("Recognition error: ", event.error);
      isRecognizingRef.current = false;
      setListening(false);
      if(event.error !== "aborted" && !isSpeakingRef.current){
        setTimeout(()=>{
          safeRecognition();
        }, 1000);
      }
    }
    
    recognition.onresult = async(e)=>{
      const transcript = e.results[e.results.length - 1][0].transcript.trim();
      console.log("Heard-: ",transcript);

      if(transcript.toLowerCase().includes(userData.assistantName.toLowerCase())){

        recognition.stop();
        isRecognizingRef.current = false;
        setListening(false);

        const data = await getGeminiResponse(transcript)
        console.log(data);
        handleCommand(data);
      }
    }

    const fallback = setInterval(()=>{
      if(!isSpeakingRef.current && !isRecognizingRef.current){
        safeRecognition();
      }
    }, 10000)

    safeRecognition();
    return()=>{
      recognition.stop()
      setListening(false)
      isRecognizingRef.current = false
      clearInterval(fallback);
    }
  },[])

  return (
    <div className='w-full h-[100vh] bg-gradient-to-t from-[black] to-[#02023d] flex justify-center items-center flex-col gap-[15px] relative'>
      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold bg-white rounded-full text-[19px] absolute top-[20px] right-[20px] cursor-pointer' onClick={handleLogout}>Log Out</button>
      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold bg-white rounded-full text-[19px] absolute top-[100px] right-[20px] px-[20px] py-[10px] cursor-pointer' onClick={()=> navigate('/customize')}>Customize Your Assistant</button>
      <div className='w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-4xl shadow-lg'>
        <img src={userData?.assistantImage} className='h-full w-full object-cover '></img>
      </div>
      <h1 className='text-white text-[18px] font-semibold'>I'm {userData?.assistantName}</h1>
    </div>
  )
}

export default Home