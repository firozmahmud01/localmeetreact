import { Camera, MicOff, ScreenShare, Share, StopScreenShare, Videocam, VideocamOff } from "@mui/icons-material";
import  Mic from "@mui/icons-material/Mic";
import { Alert, IconButton } from "@mui/material";
import { useEffect, useState } from "react";
import Peer from "simple-peer";
import {io} from 'socket.io-client'
let sock=undefined;
let hostname=''
let myvid=undefined
let myid=undefined;
let myaudio=undefined
let myshare=undefined
let allshare={}
let allpeer={}
async function getHostname(){
    hostname=prompt('Ip address:')
    let res=''
    try{
    let re=await fetch('http://'+hostname+':3000/nettest')
    res=await re.text()
    }catch(e){}
    if(res!='ok'){
        alert('Wrong ip address')
        await getHostname()
    }
}
async function initeve(){
    myvid=await navigator.mediaDevices.getUserMedia({video:true})
    myaudio=await navigator.mediaDevices.getUserMedia({audio:true})
    stopAudio()
    stopVideo()
    await getHostname()

    sock=io("ws://"+hostname+':3100')
    sock.on('connect',()=>{
        
        sock.emit('newuserreq');
    })
    sock.on('setid',(id)=>{
        myid=id;
    })
    sock.on('stopvideo',stopremotevideo);
    sock.on('startvideo',startremotevideo);
    sock.on('deleteuser',deleteremoteuser);
    sock.on('cstopshare',stopremoteshare);
    sock.on('startshare',startremoteshare);
    sock.on('newuser',newuserreq)
    sock.on('chello',addUsers)
    sock.on('chelloback',signalfound)
    sock.on('cstartshare',cstartshare)
    sock.on('cwantshare',shareback)
    sock.on('cshareback',foundshare)
}
function signalfound(id,sign){
    allpeer[id].peer.signal(sign)
}

function VideoView(){
    return (<div>
        <div id='audio'></div>
        <video style={{position:'fixed'
    ,height:'100%',
    margin: 'auto',
    position:'fixed',
    top:'0',
    bottom:'0',
    left:'0',
    right:'0',
    width:'100%'
}} id="videoview"/></div>)
}


export default function MainView(){
    useEffect(()=>{
        initeve()
    })
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
        <IconButton size="large" color="primary"
        onClick={()=>{
            if(video){
                stopShare(setShare)
            }else{
                startShare(setShare)
            }
            
        }}>
        {sshare?(<ScreenShare/>):(<StopScreenShare/>)}
        </IconButton>
    </div>
    )
}

function stopShare(setShare){
    let keys=Object.keys(allshare)
    for(let ky in keys){
        try{
        allshare[ky].destroy();
        }catch(e){}
        delete allshare[ky]
    }
    allshare={}
    sock.emit('stopshare')
    setShare(false)

}

async function startShare(setShare){
    myshare=await navigator.mediaDevices.getDisplayMedia({video:true,audio:true})
    myshare.getVideoTracks()[0].onended=()=>{
        stopShare(setShare)
    }
    let ele=document.getElementById('videoview')
    ele.muted=true
    ele.srcObject=myshare;
    ele.play();
    sock.emit("startshare")
    setShare(true)
}
function newusermsg(){
    alert('Someone joined')
}
function addUsers(id,signal){
    if(id==myid)return ;
    let p=new Peer({initiator:false,trickle:false,streams:[myaudio,myvid]})
    allpeer[id]={'peer':p};
    p.on('signal',si=>{
        sock.emit('helloback',id,si)
    })
    p.on('stream',(st)=>{
        let coun=st.getVideoTracks()
        if(coun.length<=0){
            let vid=document.createElement('video')
            vid.srcObject=st;
            vid.hidden=true;
            vid.id=id
            document.getElementById('audio').appendChild(vid)
            vid.play()
        }else{
            allpeer[id].video=st;
        }
    })
    p.signal(signal)
    newusermsg()
}

function startVideo()
{
    try{
    myvid.getVideoTracks()[0].enabled=true;
    sock.emit('startvideo')
    }catch(e){

    }
}
function stopVideo(){
    try{
        myvid.getVideoTracks()[0].enabled=false;
        sock.emit('stopvideo')
    }catch(e){}
}
function startAudio(){
    try{
    myaudio.getAudioTracks()[0].enabled=true;
    }catch(e){}
}
function stopAudio(){
    try{
    myaudio.getAudioTracks()[0].enabled=false;
    }catch(e){}
}

function startremotevideo(id){
    if(id==myid)return ;
    if(!(id in allpeer))return ;
    let ele=document.getElementById('videoview');

    ele.srcObject=allpeer[id].video;
    ele.play();
}
function stopremotevideo(id){
    if(id==myid)return ;

}
function startremoteshare(id){
    if(id==myid)return ;

}
function stopremoteshare(id){
    if(id==myid)return ;
    let keys=Object.keys(allshare)
    for(let ky in keys){
        try{
        allshare[ky].destroy();
        }catch(e){}
        delete allshare[ky]
    }
    allshare={}
}
function deleteremoteuser(id){
    if(id==myid)return ;
    
    if(id in allpeer){
        delete allpeer[id]
        try{
            allshare[id].peer.destroy();
        }catch(e){}
        delete allshare[id]
        document.getElementById(id).remove();
        alert('Someone leaved')
    }
}
function newuserreq(id){
    if(id==myid)return ;
    let myp=new Peer({initiator:true,trickle:false,streams:[myaudio,myvid]})
    allpeer[id]={'peer':myp};
    myp.on('signal',sig=>{
        sock.emit('hello',id,sig)
    })
    myp.on('stream',st=>{
        let coun=st.getVideoTracks()
        if(coun.length<=0){
            let vid=document.createElement('video')
            vid.srcObject=st;
            vid.hidden=true;
            vid.id=id
            document.getElementById('audio').appendChild(vid)
            vid.play()
        }else{
            allpeer[id].video=st;
        }
    })
    
    newusermsg()
}

function cstartshare(id){
    if(id==myid)return ;
    console.log('someone want to share')
    let myp=new Peer({initiator:true,trickle:false})
    allshare[id]={'peer':myp};
    
    myp.on('signal',(sig)=>{
        
        sock.emit('wantshare',id,sig)
        
    })
    myp.on('stream',st=>{
        allshare[id].video=st;
        let ele=document.getElementById('videoview')
        ele.srcObject=st;
        ele.muted=false;
        ele.play()
    })

}
function foundshare(id,signal){
    allshare[id].peer.signal(signal);
}
function shareback(id,signal){
    if(id==myid)return ;
    if(id in allshare){
        allshare[id].peer.signal(signal);
    }else{
    let myp=new Peer({initiator:false,trickle:false,stream:myshare})
    allshare[id]={'peer':myp};
    myp.on('signal',sig=>{
        sock.emit('shareback',id,sig)
    })
    myp.on('stream',st=>{
        allshare[id].video=st;
        let ele=document.getElementById('videoview')
        ele.srcObject=st;
        ele.muted=false;
        ele.play()
    })
    myp.signal(signal)
    }
}