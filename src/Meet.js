import { Camera, MicOff, ScreenShare, Share, StopScreenShare, Videocam, VideocamOff } from "@mui/icons-material";
import  Mic from "@mui/icons-material/Mic";
import { IconButton } from "@mui/material";
import { useState } from "react";
import Peer from "simple-peer";
let hostname=''
let svideo=undefined
let isshare=false
let peer=undefined;
let myvid=undefined;
let myaudio=undefined;
async function checkdata(init){
    let data=await fetch('http://'+hostname+(init?'/checkinit':'/checksome'))
    let res=await data.text()
    if(res=='none'){
        return undefined
    }else{
        return JSON.parse(res)

    }
}


async function sendpeerdata(data,type){
    let res=await fetch('http://'+hostname+'/iamasking',{headers:
    {
        'Content-Type': 'application/json'
    },
    method:'POST',
    body:JSON.stringify({'data':data,'type':type})
})
let da=res.text();
if(da=='thankyou'){
    return 'ok'
}
}




let ispeerset=false;
async function checkreturnsignal(){
    let tin=setInterval(async()=>{
        let res=await checkdata(false)
        if(res!=undefined){
            if('somethingelse' in res){
                if(!ispeerset){
                    ispeerset=true;
                    clearInterval(tin)
                    peer.signal(res.somethingelse)
                }
            }
        }
    },1000)
    
}
function VideoView(){
    return (<div>
        <video id="audio" hidden/>
        <video style={{position:'fixed'
    ,height:'100%',
    margin: 'auto',
    position:'fixed',
    top:'0',
    bottom:'0',
    left:'0',
    right:'0',
    width:'100%'
}} id="videoview" ref={async(e)=>{
    
    if(peer==undefined){
        let data=await checkdata(true)
        if(data==undefined){
            let pdata=await initpeerwithstream(true)
            await sendpeerdata(pdata,'init')
            checkreturnsignal()
        }else{
            let pdata=await initpeerwithstream(false,data.init)
            await sendpeerdata(pdata,'somethingelse')
        }
    }
}}/></div>)
}


let screen=false;
let one=false,two=false;
async function initpeerwithstream(initiator,sign){
    return new Promise(async(reso,err)=>{
        myaudio=await navigator.mediaDevices.getUserMedia({audio: true})
        myvid=await navigator.mediaDevices.getUserMedia({video: true})
        myvid.getVideoTracks()[0].enabled=false;
        myaudio.getAudioTracks()[0].enabled=false;
        let sts=[myvid,myaudio]
        let convalue=window.confirm('Do you want to share screen?')
        if(convalue){
            let scre=await navigator.mediaDevices.getDisplayMedia({video: true,audio:true})
            isshare=true
            let ele=document.getElementById('videoview')
            ele.muted=true;
            setVidS(scre)
            sts.push(scre)
        }
        peer=new Peer({
            'initiator':initiator,
            trickle:false,
            streams:sts
        })
        peer.on('signal',(data)=>{
            reso(data)
        })
        
        peer.on('stream',stre=>{
            
            let vid=stre.getVideoTracks()
            let audioele=document.getElementById('audio')
            
            if(vid.length<=0){
                
                one=true
                audioele.srcObject=stre;
                audioele.play()
            }else{
                two=true
                if(!isshare){
                setVidS(stre)
                }
            }
            
        })
        
        if(!initiator){
            peer.signal(sign)
        }
        
        
    })
}
export default function MainView(){
    hostname=prompt('Input the ip:')
    return (
        <div>
        <VideoView/>
        <BottomPanal/>
    </div>
)
}
function BottomPanal(){
    const [mic,setMic]=useState(false)
    const [video,setVideo]=useState(false)
    const [sshare,setShare]=useState(false)
    return (
    <div style={{
            margin:'auto',
            width:'145px'
        }}>


        <IconButton size="large" color="primary" 
        onClick={()=>{
            if(mic){
                stopAudio()
            }else{
                startAudio()
            }
            setMic(!mic)
    
        }}>
        {mic?(<Mic></Mic>):(<MicOff/>)}
        </IconButton>
        <IconButton size="large" color="primary"
        onClick={()=>{
            if(video){
                stopVideo()
            }else{
                startVideo()
            }
            setVideo(!video)
        }}>
        {video?(<Videocam/>):(<VideocamOff/>)}
        </IconButton>
    </div>
    )
}
function shareScreen(setShare){
    navigator.mediaDevices.getDisplayMedia({video:true
    ,audio:true}).then((md)=>{
        
        svideo=md
        md.getVideoTracks()[0].onended=()=>{
            stopShare(setShare,md)
        }
        peer.on('data',dataa=>{
            let data=JSON.parse(dataa)
            if('init' in data){
                let p=new Peer({initiator:false,trickle:false})
                p.on('signal',sign=>{
                    peer.send(JSON.stringify({'another':sign}))
                })
                p.on('stream',stre=>{
                    setVidS(stre)
                })
                p.signal(data.init)
            }else{
                sharepeer.signal(data.another)
            }
        })
        makeShare(md)
        
        setVidS(md)
    })
}
let sharepeer=undefined
function makeShare(stream){
    sharepeer=new Peer({initiator:true,trickle:false,'stream':stream})
    sharepeer.on('signal',(data)=>{
        peer.send(JSON.stringify({init:data}))
    })
    
}


function setVidS(stream){
    let vobj=document.getElementById('videoview')
    vobj.srcObject=stream
    vobj.play()
}
function stopShare(setShare,stream){
    sharepeer.close()
    let alls=stream.getTracks()
    for(let i=0;i<alls.length;i++){
        alls[i].stop()
    }
    setShare(false)
}
function startVideo()
{
    myvid.getVideoTracks()[0].enabled=true;
    
}
function stopVideo(){
    myvid.getVideoTracks()[0].enabled=false;
    
}
function startAudio(){
    myaudio.getAudioTracks()[0].enabled=true;
}
function stopAudio(){
    myaudio.getAudioTracks()[0].enabled=false;
}