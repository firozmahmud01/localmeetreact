import { Button, Grid, TextField } from "@mui/material";
import { useState } from "react";
import Meet from './Meet.js'
    const host="http://localhost"

async function sublogin(user,pass,setView){
    const data=fetch(host+'/sublogin',{method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)})
        let res=data.text
        if(res=='failed'){
            alert('Failed to login.')
        }else{
            setView(<Meet token={res}/>)
        }

}

export default function MainView({setView}){
    const [user,setUser]=useState('')
    const [pass,setPass]=useState('')


    return (
        <Grid container spacing={1}>
            <Grid item xs={12}></Grid>
            <Grid item xs={12}></Grid>
            <Grid item xs={3}></Grid>
            <Grid item xs={6}>
                <TextField fullWidth variant="outlined" label="Username" error={user==undefined}
                value={user} onChange={(e)=>{
                    let val=e.target.value
                    setUser(val)
                }}/>
            </Grid>
            <Grid item xs={3}></Grid>
            <Grid item xs={3}></Grid>
            <Grid item xs={6}>
                <TextField fullWidth variant="outlined" label="Password" error={pass==undefined}
                value={pass} onChange={(e)=>{
                    let val=e.target.value
                    setPass(val)
                }}/>
            </Grid>
            <Grid item xs={3}></Grid>
            <Grid item xs={4}></Grid>
            <Grid item xs={4}>
                <Button fullWidth variant="contained" onClick={
                    (e)=>{
                        if(!user){
                            setUser(undefined)
                            return ;
                        }
                        if(!pass){
                            setPass(undefined)
                            return ;
                        }
                        sublogin(user,pass,setView)

                    }
                }>Login</Button>
            </Grid>
            <Grid item xs={4}></Grid>
        </Grid>
    )
}