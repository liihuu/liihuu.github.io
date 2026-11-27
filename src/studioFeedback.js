// Pick the foremost triangle under the pointer, including geometry that can
// hide an interactive part. The orthographic test uses the renderer's basis.
export function pickPart(vertices,parts,view,x,y){
  const {matrix:m,centre,unit,width,height,time}=view
  const px=(x-width/2)/unit,py=(height/2-y)/unit
  let nearest=-Infinity,hit=-1
  const u=[],v=[],depth=[]
  for(let i=0;i<vertices.length;i+=36){
    for(let j=0;j<3;j++){
      const k=i+j*12,weight=vertices[k+11]
      const dx=vertices[k]-centre[0],dz=vertices[k+2]-centre[2]
      const dy=vertices[k+1]-centre[1]+Math.abs(weight)*.038*Math.sin(time*8+weight*1.85)
      u[j]=m[0]*dx+m[6]*dz-px
      v[j]=m[1]*dx+m[4]*dy+m[7]*dz-py
      depth[j]=m[2]*dx+m[5]*dy+m[8]*dz
    }
    if(Math.min(...u)>0 || Math.max(...u)<0 || Math.min(...v)>0 || Math.max(...v)<0)continue
    const a=u[1]*v[2]-u[2]*v[1],b=u[2]*v[0]-u[0]*v[2],c=u[0]*v[1]-u[1]*v[0]
    if(Math.min(a,b,c)<0 && Math.max(a,b,c)>0)continue
    const z=(a*depth[0]+b*depth[1]+c*depth[2])/(a+b+c)
    if(z>nearest){nearest=z;hit=i}
  }
  return parts.find(p=>p.start<=hit && hit<p.end)
}

// Short material resonances, excited only by an intentional click.
const notes={
  window:[1180,1830,.22],cup:[1440,2165,.32],pot:[780,1280,.18],
  desk:[152,284,.075],shelf:[192,320,.075],book:[138,207,.055],
  drawer:[134,220,.10],lampSwitch:[730,1310,.035],key:[420,1280,.045],
  keyboard:[260,640,.05],mouse:[940,1750,.029],chair:[155,370,.085],
  leaves:[370,530,.035],contact:[330,640,.04],monitorSwitch:[520,980,.045]
}
export function playContact(ctx,kind){
  const [low,high,length]=notes[kind]
  for(const [frequency,level] of [[low,.065],[high,.026]]){
    const osc=ctx.createOscillator(),gain=ctx.createGain(),t=ctx.currentTime
    osc.type=kind==='window' || kind==='cup'?'sine':'triangle'
    osc.frequency.value=frequency
    gain.gain.setValueAtTime(.0001,t)
    gain.gain.exponentialRampToValueAtTime(level,t+.004)
    gain.gain.exponentialRampToValueAtTime(.0001,t+length)
    osc.connect(gain);gain.connect(ctx.destination)
    osc.start(t);osc.stop(t+length)
    osc.onended=()=>{osc.disconnect();gain.disconnect()}
  }
}

export function movePart(mesh,part,base,value){
  const angle=value*.042,cos=Math.cos(angle),sin=Math.sin(angle)
  for(let i=0;i<base.length;i+=12){
    const k=part.start+i,x=base[i],y=base[i+1],z=base[i+2]
    switch(part.kind){
      case 'lampSwitch': mesh[k+1]=y-.012*value;break
      case 'key': mesh[k+1]=y-.026*value;break
      case 'mouse': mesh[k+1]=y-.014*value*Math.max(0,Math.min(1,(-.46-z)/.16));break
      case 'drawer': mesh[k+2]=z+.91*value;break
      case 'book': mesh[k+2]=z+.09*value*Math.max(0,y-2.65)/.35;break
      case 'leaves': mesh[k]=x+.22*value*(z+1.98);mesh[k+2]=z-.09*value*(x-2.17);break
      case 'cup': mesh[k+1]=y+value;break
      case 'chair':
        mesh[k]=-.68+(x+.68)*cos+(z-.77)*sin
        mesh[k+2]=.77-(x+.68)*sin+(z-.77)*cos
        mesh[k+3]=base[i+3]*cos+base[i+5]*sin
        mesh[k+5]=-base[i+3]*sin+base[i+5]*cos
        break
      case 'developerArms': {
        const side=x<-.68?-1:1
        const pivotX=-.68+side*.284,pivotY=1.457,pivotZ=.623
        const armAngle=value*1.02,armCos=Math.cos(armAngle),armSin=Math.sin(armAngle)
        const dy=y-pivotY,dz=z-pivotZ
        mesh[k]=x
        mesh[k+1]=pivotY+dy*armCos-dz*armSin
        mesh[k+2]=pivotZ+dy*armSin+dz*armCos
        const ny=base[i+4],nz=base[i+5]
        mesh[k+3]=base[i+3]
        mesh[k+4]=ny*armCos-nz*armSin
        mesh[k+5]=ny*armSin+nz*armCos
        break
      }
    }
  }
}
