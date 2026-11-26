import { buildTaskLamp } from './taskLamp'
import { objects } from './studioObjects'

// Coordinates are in room units. Y is up and the two open walls face +X and +Z.
const TAU = 2 * Math.PI
const sub = (a,b) => a.map((v,i) => v-b[i])
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]
const unit = v => v.map(n => n/(Math.hypot(...v)||1))
const rgb = hex => [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255)

export function studioModel () {
  const vertices = []
  const colors = new Map()
  function tri (points, color, normals, uvs, movement = [0,0,0]) {
    if (!colors.has(color)) colors.set(color,rgb(color))
    const flat = normals ? null : unit(cross(sub(points[1],points[0]),sub(points[2],points[0])))
    points.forEach((p,i) => vertices.push(...p,...(normals?.[i] || flat),...colors.get(color),...(uvs?.[i] || [-1,-1]),movement[i]))
  }
  function quad (a,b,c,d,color,uv) {
    tri([a,b,c],color,null,uv && [uv[0],uv[1],uv[2]])
    tri([a,c,d],color,null,uv && [uv[0],uv[2],uv[3]])
  }
  function box (x,y,z,w,h,d,color) {
    const points = Array.from({length:8},(_,i) => [x+(i&1?w:-w)/2,y+(i&2?h:-h)/2,z+(i&4?d:-d)/2])
    for (const face of [[4,5,7,6],[1,0,2,3],[5,1,3,7],[0,4,6,2],[6,7,3,2],[0,1,5,4]]) {
      quad(...face.map(i=>points[i]),color)
    }
  }
  // Horizontal rounded sections can taper independently: useful for moulded
  // shells, keycaps and garments with a distinct waist and shoulders.
  function shell(x,z,sections,color) {
    let previous
    for(const [y,w,d,r,shift=0] of sections){
      const ring=[]
      for(let corner=0;corner<4;corner++){
        const cx=(corner===0 || corner===3 ? 1 : -1)*(w/2-r)
        const cz=(corner<2 ? 1 : -1)*(d/2-r)
        for(let k=0;k<=4;k++){
          const angle=(corner+k/4)*Math.PI/2
          ring.push([x+cx+r*Math.cos(angle),y,z+shift+cz+r*Math.sin(angle)])
        }
      }
      if(previous)ring.forEach((point,i)=>{
        const j=(i+1)%ring.length
        quad(previous[i],point,ring[j],previous[j],color)
      })
      previous=ring
    }
    for(let i=1;i<previous.length-1;i++)tri([previous[0],previous[i+1],previous[i]],color)
  }
  function oval (x,y,z,rx,ry,rz,color,motion=0,tilt=0) {
    const rotate = ([a,b,c]) => [a,b*Math.cos(tilt)-c*Math.sin(tilt),b*Math.sin(tilt)+c*Math.cos(tilt)]
    function point(i,j) {
      const phi = TAU*i/18, lat = Math.PI*(j/12-.5)
      const n = [Math.cos(phi)*Math.cos(lat),Math.sin(lat),Math.sin(phi)*Math.cos(lat)]
      const off = rotate([rx*n[0],ry*n[1],rz*n[2]])
      return [[x+off[0],y+off[1],z+off[2]],unit(rotate([n[0]/rx,n[1]/ry,n[2]/rz]))]
    }
    const rings=Array.from({length:13},(_,j)=>Array.from({length:19},(_,i)=>point(i,j)))
    for(let j=0;j<12;j++) for(let i=0;i<18;i++) {
      const a=rings[j][i],b=rings[j][i+1],c=rings[j+1][i+1],d=rings[j+1][i]
      for(const face of [[a,b,c],[a,c,d]]) tri(face.map(v=>v[0]),color,face.map(v=>v[1]),null,[motion,motion,motion])
    }
  }
  function tube (a,b,r1,r2,color,moveA=0,moveB=0) {
    const axis=unit(sub(b,a)), u=unit(cross(axis,Math.abs(axis[1])>.9?[1,0,0]:[0,1,0])), v=cross(axis,u)
    function rim(p,r,i) {
      const theta=i*TAU/18
      const n=u.map((val,k)=>val*Math.cos(theta)+v[k]*Math.sin(theta))
      return [p.map((val,k)=>val+r*n[k]),n]
    }
    for(let i=0;i<18;i++){
      const lo=rim(a,r1,i), hi=rim(b,r2,i), nextLo=rim(a,r1,i+1), nextHi=rim(b,r2,i+1)
      tri([lo[0],nextLo[0],hi[0]],color,[lo[1],nextLo[1],hi[1]],null,[moveA,moveA,moveB])
      tri([hi[0],nextLo[0],nextHi[0]],color,[hi[1],nextLo[1],nextHi[1]],null,[moveB,moveA,moveB])
      tri([b,hi[0],nextHi[0]],color,[axis,axis,axis],null,[moveB,moveB,moveB])
      const neg=axis.map(n=>-n)
      tri([a,nextLo[0],lo[0]],color,[neg,neg,neg],null,[moveA,moveA,moveA])
    }
  }
  const uv = (x,y,w,h) => [[x,y+h],[x+w,y+h],[x+w,y],[x,y]].map(p=>p.map(n=>n/2048))
  const wood='#bb8157', edge='#98613f', teal='#48766b', charcoal='#313d43', cream='#f0dbc1'
  // Continue the floor and walls past the camera so the viewport is inside the room.
  for (let ix=0; ix<4; ix++) for (let iz=0; iz<4; iz++) {
    const x=-3+6*ix, z=-2.25+4.5*iz
    quad([x,.03,z+4.5],[x+6,.03,z+4.5],[x+6,.03,z],[x,.03,z],'#ffffff',uv(0,700,1000,760))
  }
  box(8.9,6,-2.28,24,12,.13,'#a7b9a5')
  box(-3.04,6,9,.13,12,23,'#dfcaac')
  box(8.9,.15,-2.18,24,.22,.10,teal)
  box(-2.94,.15,9,.10,.22,23,teal)

  function surface(key, texture) {
    const {x,y,z,width,height}=objects[key]
    const l=x-width/2, r=x+width/2, top=y+height/2, bottom=y-height/2
    quad([l,bottom,z],[r,bottom,z],[r,top,z],[l,top,z],'#ffffff',uv(...texture))
  }
  // A timber sash window looks out over the roofs at dusk.
  box(-2.94,2.05,-.08,.12,1.91,2.69,edge)
  quad([-2.865,1.18,1.18],[-2.865,1.18,-1.34],[-2.865,2.92,-1.34],[-2.865,2.92,1.18],'#ffffff',uv(1080,0,940,640))
  for(const z of [-1.35,-.08,1.19]) box(-2.84,2.05,z,.07,1.82,.055,cream)
  for(const y of [1.16,2.24,2.94]) box(-2.84,y,-.08,.07,.055,2.58,cream)
  for(const z of [-1.39,1.23])box(-2.89,2.05,z,.14,1.96,.085,wood)
  box(-2.88,1.01,-.08,.22,.06,2.76,edge)
  box(-2.82,1.09,-.08,.34,.11,2.86,wood)

  // Shelves, a print, books and a trailing houseplant furnish the back wall.
  box(1.71,2.60,-1.99,1.95,.09,.45,wood)
  for(const x of [1.06,2.37]) box(x,2.49,-2.1,.08,.22,.13,edge)
  const spines=['#b85b42','#e5b871','#425e62','#f0d5a9','#658e84']
  spines.forEach((color,i)=>{
    const h=.34+.11*Math.sin(i*1.8)
    const x=1.02+i*.14
    box(x,2.65+h/2,-2.0,.099,h-.018,.218,'#dfcfaf')
    for(const offset of [-.053,.053])box(x+offset,2.65+h/2,-2,.012,h,.24,color)
    box(x,2.65+h/2,-1.885,.116,h,.018,color)
    box(1.02+i*.14,2.71,-1.877,.08,.014,.012,cream)
  })
  function plant(x,y,z,s) {
    tube([x,y,z],[x,y+.37*s,z],.18*s,.23*s,'#cd815d')
    tube([x,y+.34*s,z],[x,y+.39*s,z],.24*s,.24*s,'#dfa17c')
    tube([x,y+.39*s,z],[x,y+.397*s,z],.205*s,.205*s,'#59483b')
    for(let i=0;i<9;i++){
      const a=i*2.4
      const tip=[x+Math.cos(a)*s*.35,y+(.62+.32*(.5+.5*Math.sin(i*1.9)))*s,z+Math.sin(a)*s*.33]
      tube([x,y+.39*s,z],tip,.012*s,.008*s,'#476446')
      // A folded, tapered blade with a raised midrib and drooping tip.
      let last
      for(let j=0;j<=8;j++){
        const t=j/8, spread=.107*s*Math.sin(t*Math.PI)**.85
        const mid=[tip[0]+s*.27*t*Math.cos(a),tip[1]+s*(.18*Math.sin(t*Math.PI)-.10*t),tip[2]+s*.27*t*Math.sin(a)]
        const left=[mid[0]-Math.sin(a)*spread,mid[1]-.36*spread,mid[2]+Math.cos(a)*spread]
        const right=[mid[0]+Math.sin(a)*spread,mid[1]-.36*spread,mid[2]-Math.cos(a)*spread]
        if(last){
          quad(last[0],left,mid,last[1],i%2?'#749666':'#507758')
          quad(last[1],mid,right,last[2],i%2?'#90ae77':'#658c63')
        }
        last=[left,mid,right]
      }
    }
  }
  plant(2.17,2.65,-1.98,.69)
  box(-2.32,2.35,-2.16,.99,1.14,.09,edge)
  quad([-2.76,1.84,-2.10],[-1.88,1.84,-2.10],[-1.88,2.86,-2.10],[-2.76,2.86,-2.10],'#ffffff',uv(1100,700,500,550))

  // A broad wooden desk, trestles, drawer cabinet, keyboard and mug.
  shell(.12,-.98,[[1.145,4.70,1.69,.075],[1.17,4.75,1.74,.08],[1.28,4.75,1.74,.08],[1.295,4.72,1.71,.07]],wood)
  quad([-2.20,1.296,-.16],[2.44,1.296,-.16],[2.44,1.296,-1.80],[-2.20,1.296,-1.80],'#ffffff',uv(0,1480,1000,480))
  shell(-.02,-.57,[[1.298,2.57,.83,.08],[1.306,2.56,.82,.08]],'#42514c')
  box(.12,1.14,-.98,4.65,.06,1.65,edge)
  for(const z of [-1.66,-.32]) box(-1.97,.58,z,.15,1.15,.15,charcoal)
  box(1.82,.59,-.98,.85,1.14,1.34,'#57776d')
  for(let i=0;i<3;i++){
    box(1.82,.28+i*.34,-.285,.79,.31,.05,'#759589')
    box(1.82,.34+i*.34,-.25,.25,.035,.035,charcoal)
  }
  box(.05,1.32,-1.27,.82,.055,.43,charcoal)
  box(.05,1.56,-1.46,.13,.51,.12,charcoal)
  shell(.05,-1.47,[[1.39,3.13,.085,.034],[1.425,3.235,.17,.055],[2.77,3.235,.17,.055],[2.81,3.17,.12,.045]],'#505b60')
  shell(.05,-1.39,[[1.392,3.17,.077,.026],[1.418,3.24,.083,.028],[2.781,3.24,.083,.028],[2.81,3.175,.077,.026]],'#263039')
  box(1.50,1.423,-1.346,.035,.008,.006,'#b1d5b1')
  for(let i=0;i<26;i++)box(-1.30+i*.101,2.799,-1.47,.059,.012,.043,'#2d393c')
  surface('project',[0,0,1024,440])
  box(-.34,1.31,-.48,1.68,.055,.53,charcoal)
  for(let row=0;row<4;row++)for(let col=0;col<13;col++){
    if(row===3 && col>3 && col<9) continue
    const space=row===3 && col===3
    const x=-1.08+col*.123+(space?.3075:0), z=-.67+row*.123
    const width=space?.71:.105
    shell(x,z,[[1.337,width,.103,.012],[1.35,width,.103,.012],[1.38,width-.017,.082,.011]],col===12?'#cf8960':'#d9d6c6')
    if(!space)quad([x-.036,1.381,z+.032],[x+.036,1.381,z+.032],[x+.036,1.381,z-.032],[x-.036,1.381,z-.032],'#ffffff',uv(1090+col*48,1300+row*40,48,40))
  }
  oval(.91,1.35,-.49,.115,.065,.17,'#d7d4bd')
  oval(.91,1.411,-.536,.024,.018,.037,'#536360')
  tube([1.78,1.30,-.91],[1.78,1.57,-.91],.13,.145,'#e0ba83')
  tube([1.78,1.571,-.91],[1.78,1.576,-.91],.116,.116,'#58402e')
  for(let i=0;i<12;i++){
    const pos=t=>[1.91+.12*Math.sin(t),1.44+.09*Math.cos(t),-.91]
    tube(pos(i*Math.PI/12),pos((i+1)*Math.PI/12),.027,.027,'#e0ba83')
  }
  const card=objects.contact
  box(card.x,1.326,card.z-.025,card.width+.06,.062,.16,edge)
  box(card.x,card.y,card.z-.032,card.width+.035,card.height+.035,.06,cream)
  surface('contact',[1060,1490,900,395])
  buildTaskLamp({tri,tube})

  // The seated figure faces -Z, with elbows bent toward the keyboard.
  const px=-.68, pz=.77, skin='#d99d79', hair='#393238', hoodie='#cd7853', denim='#405363'
  tube([px,.18,pz],[px,.77,pz],.066,.075,charcoal)
  for(let i=0;i<5;i++){
    const a=i*TAU/5, end=[px+.46*Math.cos(a),.13,pz+.46*Math.sin(a)]
    tube([px,.22,pz],end,.055,.052,charcoal)
    oval(end[0],.09,end[2],.085,.08,.079,'#344143')
  }
  oval(px,.74,pz,.47,.105,.42,teal)
  tube([px,.72,pz+.22],[px,1.30,pz+.43],.055,.055,charcoal)
  shell(px,pz+.43,[[.98,.53,.10,.038],[1.05,.77,.14,.054],[1.28,.81,.16,.065,.035],[1.44,.72,.14,.055,.04],[1.48,.60,.10,.045,.035]],'#385e59')
  shell(px,pz+.45,[[1.016,.51,.10,.043],[1.08,.72,.16,.061],[1.32,.75,.17,.064,.027],[1.43,.65,.12,.048,.035]],'#63867a')
  for(const side of [-1,1]){
    tube([px+side*.36,.75,pz],[px+side*.41,1.03,pz+.02],.034,.032,charcoal)
    shell(px+side*.41,pz-.045,[[1.025,.091,.33,.039],[1.058,.109,.35,.042],[1.07,.091,.33,.039]],'#334846')
  }
  for(const side of [-1,1]){
    const x=px+side*.235
    tube([x,.86,pz],[x,.78,.14],.18,.148,denim)
    oval(x,.78,.14,.15,.15,.16,denim)
    tube([x,.78,.14],[x,.22,.16],.145,.104,denim)
    shell(x,.055,[[.047,.25,.45,.105],[.073,.285,.49,.12],[.108,.276,.47,.115]],'#c8bfa9')
    oval(x,.15,.055,.14,.094,.234,'#ead7b8')
    for(let i=0;i<3;i++)tube([x-.074,.228-i*.009,.035-i*.041],[x+.068,.228-i*.009,.02-i*.041],.009,.009,'#b09a78')
  }
  shell(px,.72,[[.84,.51,.39,.16],[.89,.63,.44,.17],[.99,.68,.46,.18],[1.20,.63,.44,.17,-.012],[1.43,.76,.46,.19,-.045],[1.51,.63,.39,.16,-.065],[1.58,.36,.28,.12,-.085]],hoodie)
  shell(px,.72,[[.844,.54,.395,.16],[.89,.634,.447,.17],[.924,.642,.45,.17]],'#b5684c')
  shell(px,.85,[[1.26,.12,.09,.04,.11],[1.32,.32,.13,.061,.10],[1.43,.52,.225,.104,.045],[1.53,.54,.27,.125],[1.58,.43,.23,.105]],'#b96b4c')
  tube([px,1.30,1.011],[px,1.442,1.031],.007,.009,'#d38a65')
  tube([px,1.442,1.031],[px,1.535,.985],.009,.008,'#d38a65')
  tube([px,1.50,.66],[px,1.75,.59],.12,.12,skin)
  oval(px,1.91,.56,.30,.35,.28,skin)
  // Continuous swept hair surface. The fringe sits above the eyes and the
  // hairline drops toward the nape, with overlapping grooves around the crown.
  function scalp(a,t){
    const low=-.45-.68*Math.sin(a)+.035*Math.sin(a*7+.6)
    const lat=low+(Math.PI/2-low)*t
    const angle=a+.62*t
    const ridge=Math.pow(.5+.5*Math.cos(17*a+2*t),1.8)
    const radius=1+.028*ridge*(1-t)
    const n=[Math.cos(angle)*Math.cos(lat),Math.sin(lat),Math.sin(angle)*Math.cos(lat)]
    const point=[px-.043*t+radius*.322*n[0],1.997+.317*n[1],.568+.304*radius*n[2]]
    return [point,unit([n[0],n[1]*.98,n[2]*1.05])]
  }
  for(let i=0;i<85;i++)for(let j=0;j<10;j++){
    const a=i*TAU/85,b=(i+1)*TAU/85
    const corners=[scalp(a,j/10),scalp(b,j/10),scalp(b,(j+1)/10),scalp(a,(j+1)/10)]
    const shade=['#494044','#4a4043','#463d42','#413a3e','#453c41'][i%5]
    for(const indices of [[0,1,2],[0,2,3]])tri(indices.map(k=>corners[k][0]),shade,indices.map(k=>corners[k][1]))
  }
  oval(px,1.94,.294,.069,.073,.075,skin)
  for(const side of [-1,1]){
    oval(px+side*.287,1.92,.56,.058,.083,.055,skin)
    oval(px+side*.15,1.97,.328,.024,.025,.018,hair)
    // Headphone cups and padded band.
    oval(px+side*.303,1.99,.59,.072,.133,.111,'#314b4b')
    tube([px+side*.343,1.99,.59],[px+side*.366,1.99,.59],.106,.101,'#9bafa1')
    tube([px+side*.367,1.99,.59],[px+side*.377,1.99,.59],.087,.081,'#526c67')
    for(let i=-2;i<=2;i++)box(px+side*.378,1.99+i*.019,.59,.004,.006,.081-.008*Math.abs(i),'#324e4b')
    tube([px+side*.33,2.032,.667],[px+side*.303,2.146,.61],.018,.016,'#b4b5a5')
    const shoulder=[px+side*.29,1.47,.64], elbow=[px+side*.42,1.21,.30], wrist=[px+.12+side*.28,1.405,-.25]
    tube(shoulder,elbow,.148,.126,hoodie)
    oval(...elbow,.13,.13,.13,hoodie)
    tube(elbow,wrist,.127,.096,hoodie,0,side*.55)
    const cuff=[wrist[0]-.015,1.388,-.188]
    tube(cuff,wrist,.103,.096,'#a85f47',side*.48,side*.55)
    oval(wrist[0],1.414,-.32,.102,.061,.124,skin,side*.70)
    oval(wrist[0]-side*.084,1.407,-.352,.043,.039,.064,skin,side*.76)
    for(let i=0;i<4;i++){
      const x=wrist[0]+(i-1.5)*.044, length=[.110,.121,.113,.092][i]
      const knuckle=[x,1.428,-.374], joint=[x,1.431,-.374-length*.55], tip=[x,1.394,-.374-length]
      const movement=side*(.67+i*.15)
      tube(knuckle,joint,.023,.021,skin,side*.70,movement)
      tube(joint,tip,.022,.018,skin,movement,movement)
    }
  }
  for(let i=0;i<16;i++){
    const p=t=>[px+.31*Math.cos(t),2.01+.29*Math.sin(t),.61]
    tube(p(i*Math.PI/16),p((i+1)*Math.PI/16),.034,.034,'#384a4e')
  }
  plant(2.38,.035,1.35,1.13)
  return new Float32Array(vertices)
}
