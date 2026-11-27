// Sample the same keystrokes that reveal the code. The forearm carries most of
// the reach while the striking finger closes the last gap to the moving cap.
const ease=value=>{
  const t=Math.max(0,Math.min(1,value))
  return t*t*(3-2*t)
}

export function createTypingMotion(mesh,parts,update,moveKey){
  const keys=new Map(parts.filter(p=>p.kind==='key').map(p=>[p.label,p]))
  const hands=[-1,1].map(side=>{
    const sections=parts.filter(p=>p.side===side).map(part=>{
      const base=mesh.slice(part.start,part.end)
      const weights=new Float32Array(base.length/12)
      for(let i=0;i<base.length;i+=12)weights[i/12]=ease((.32-base[i+2])/.57)
      return {part,base,weights}
    })
    return {side,sections,fingers:sections.filter(s=>s.part.tip),moving:false}
  })
  let lastKeys=new Set()
  return (frame,active)=>{
    const keyPressure=new Map()
    for(const hand of hands){
      const poses=[]
      for(const stroke of frame?.nearby??[]){
        if(stroke.side!==hand.side)continue
        const age=frame.phase-stroke.time
        const reach=ease(age<0?1+age/155:1-age/165)
        const key=keys.get(stroke.label)
        if(!key || !reach)continue
        const {tip}=hand.fingers[stroke.finger].part
        const flex=ease(1+age/64)*ease(1-(age-15)/82)
        const press=ease(1+age/20)*ease(1-(age-15)/58)
        // The thumb strikes the near half of the space bar, below its hand.
        const x=stroke.finger===4?Math.max(key.x-.24,Math.min(key.x+.24,tip[0])):key.x
        poses.push({finger:stroke.finger,dx:x-tip[0],dz:key.z-tip[2],reach,flex,press,
          drop:tip[1]-.009-1.3805})
        if(press)keyPressure.set(key,Math.max(keyPressure.get(key)??0,press))
      }
      if(!poses.length && !hand.moving)continue
      hand.moving=poses.length>0
      let dx=0,dz=0,total=0,strongest=0,bend=0
      for(const pose of poses){
        total+=pose.reach
        strongest=Math.max(strongest,pose.reach)
        dx+=pose.reach*pose.dx;dz+=pose.reach*pose.dz
        bend=Math.max(bend,pose.flex)
      }
      const carry=total ? .78*strongest/total : 0
      for(const {part,base,weights} of hand.sections){
        const pose=poses.find(p=>p.finger===part.finger)
        const fingerX=pose?pose.dx*.22*pose.reach:0
        const fingerZ=pose?pose.dz*.22*pose.reach:0
        const fingerY=pose ? .014*(pose.reach-pose.flex)-(pose.drop-.005)*pose.flex-.026*pose.press : 0
        for(let i=0;i<base.length;i+=12){
          const k=part.start+i,w=weights[i/12],joint=base[i+11]
          mesh[k]=base[i]+w*dx*carry+joint*fingerX
          mesh[k+1]=base[i+1]-.005*w*bend+joint*fingerY
          mesh[k+2]=base[i+2]+w*dz*carry+joint*fingerZ
        }
        update(part)
      }
    }
    for(const key of new Set([...lastKeys,...keyPressure.keys()])){
      key.base??=mesh.slice(key.start,key.end)
      moveKey(mesh,key,key.base,Math.max(keyPressure.get(key)??0,active.get(key)?.value??0))
      update(key)
    }
    lastKeys=new Set(keyPressure.keys())
  }
}
