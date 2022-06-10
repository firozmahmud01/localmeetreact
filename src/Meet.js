import Peer from "simple-peer";
let hostname=''
let peer=undefined;
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
    return <video style={{position:'fixed'
    ,height:'100%',
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
}}/>
}

export default function MainView(){
    hostname=prompt('Input the ip:')
    return (
        <div>
        
        <VideoView/>
    </div>
)
}

let screen=false;
let audio=false;
async function initpeerwithstream(initiator,sign){
    return new Promise(async(reso,err)=>{
    let vid=await navigator.mediaDevices.getUserMedia({video: true,audio:true})
    peer=new Peer({
        'initiator':initiator,
        trickle:false,
        stream:vid
    })
    peer.on('signal',(data)=>{
        reso(data)
    })
    peer.on('stream',stre=>{
        alert('stream found')
        let vobj=document.getElementById('videoview')
        vobj.srcObject=stre
        vobj.play()
    })
    peer.on('connect',()=>{
        alert('You are connected.')
    })
    if(!initiator){
        peer.signal(sign)
    }

})
}