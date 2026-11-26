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
  function oval (x,y,z,rx,ry,rz,color,motion=0,tilt=0) {
    const rotate = ([a,b,c]) => [a,b*Math.cos(tilt)-c*Math.sin(tilt),b*Math.sin(tilt)+c*Math.cos(tilt)]
    function point(i,j) {
      const phi = TAU*i/18, lat = Math.PI*(j/12-.5)
      const n = [Math.cos(phi)*Math.cos(lat),Math.sin(lat),Math.sin(phi)*Math.cos(lat)]
      const off = rotate([rx*n[0],ry*n[1],rz*n[2]])
      return [[x+off[0],y+off[1],z+off[2]],unit(rotate([n[0]/rx,n[1]/ry,n[2]/rz]))]
    }
    for(let j=0;j<12;j++) for(let i=0;i<18;i++) {
      const a=point(i,j),b=point(i+1,j),c=point(i+1,j+1),d=point(i,j+1)
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
  box(-2.82,1.09,-.08,.34,.11,2.86,wood)

  // Shelves, a print, books and a trailing houseplant furnish the back wall.
  box(1.71,2.60,-1.99,1.95,.09,.45,wood)
  for(const x of [1.06,2.37]) box(x,2.49,-2.1,.08,.22,.13,edge)
  const spines=['#b85b42','#e5b871','#425e62','#f0d5a9','#658e84']
  spines.forEach((color,i)=>{
    const h=.34+.11*Math.sin(i*1.8)
    box(1.02+i*.14,2.65+h/2,-2.0,.115,h,.23,color)
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
      oval(tip[0],tip[1],tip[2],.10*s,.20*s,.065*s,i%2?'#719163':'#426b53',0,Math.cos(a)*.7)
    }
  }
  plant(2.17,2.65,-1.98,.69)
  box(-2.32,2.35,-2.16,.99,1.14,.09,edge)
  quad([-2.76,1.84,-2.10],[-1.88,1.84,-2.10],[-1.88,2.86,-2.10],[-2.76,2.86,-2.10],'#ffffff',uv(1100,700,500,550))

  // A broad wooden desk, trestles, drawer cabinet, keyboard and mug.
  box(.12,1.22,-.98,4.75,.15,1.74,wood)
  box(.12,1.14,-.98,4.65,.06,1.65,edge)
  for(const z of [-1.66,-.32]) box(-1.97,.58,z,.15,1.15,.15,charcoal)
  box(1.82,.59,-.98,.85,1.14,1.34,'#57776d')
  for(let i=0;i<3;i++){
    box(1.82,.28+i*.34,-.285,.79,.31,.05,'#759589')
    box(1.82,.34+i*.34,-.25,.25,.035,.035,charcoal)
  }
  box(.05,1.32,-1.27,.82,.055,.43,charcoal)
  box(.05,1.56,-1.46,.13,.51,.12,charcoal)
  box(.05,2.10,-1.42,3.24,1.42,.14,'#252f38')
  surface('project',[0,0,1024,440])
  box(-.34,1.31,-.48,1.68,.055,.53,charcoal)
  for(let row=0;row<4;row++)for(let col=0;col<13;col++){
    if(row===3 && col>3 && col<9) continue
    const space=row===3 && col===3
    box(-1.08+col*.123+(space?.3075:0),1.355,-.67+row*.123,space?.71:.105,.035,.094,col===12?'#d39068':'#b7c4b9')
  }
  oval(.91,1.35,-.49,.115,.065,.17,'#d7d4bd')
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
  // Task lamp with a warm diffuser.
  tube([-1.91,1.30,-1.39],[-1.91,1.36,-1.39],.24,.22,teal)
  tube([-1.91,1.36,-1.39],[-2.04,2.02,-1.43],.04,.04,teal)
  tube([-2.04,2.02,-1.43],[-1.79,2.28,-1.43],.04,.04,teal)
  tube([-1.78,2.29,-1.43],[-1.69,2.10,-1.43],.09,.23,teal)
  tube([-1.69,2.10,-1.43],[-1.686,2.09,-1.43],.214,.214,'#ffe9ad')

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
  oval(px,1.23,pz+.43,.41,.31,.09,teal,0,.12)
  for(const side of [-1,1]){
    const x=px+side*.235
    tube([x,.86,pz],[x,.78,.14],.18,.148,denim)
    oval(x,.78,.14,.15,.15,.16,denim)
    tube([x,.78,.14],[x,.22,.16],.145,.104,denim)
    oval(x,.15,.055,.145,.111,.25,'#e6ccab')
  }
  oval(px,1.22,.72,.36,.46,.26,hoodie,0,-.16)
  oval(px,1.53,.82,.31,.16,.23,'#ae6147')
  tube([px,1.50,.66],[px,1.75,.59],.12,.12,skin)
  oval(px,1.91,.56,.30,.35,.28,skin)
  oval(px,2.07,.59,.319,.23,.29,hair)
  oval(px,1.95,.69,.312,.24,.219,hair)
  oval(px,1.94,.294,.069,.073,.075,skin)
  for(let i=0;i<7;i++){
    const a=i*.53
    oval(px+.235*Math.cos(a),2.18+.035*Math.sin(i),.55+.165*Math.sin(a),.12,.098,.12,hair)
  }
  for(const side of [-1,1]){
    oval(px+side*.287,1.92,.56,.058,.083,.055,skin)
    oval(px+side*.15,1.97,.328,.024,.025,.018,hair)
    // Headphone cups and padded band.
    oval(px+side*.303,1.99,.59,.072,.133,.111,'#314b4b')
    oval(px+side*.354,1.99,.59,.032,.092,.078,'#79938a')
    const shoulder=[px+side*.29,1.47,.64], elbow=[px+side*.42,1.21,.30], wrist=[px+.12+side*.28,1.405,-.25]
    tube(shoulder,elbow,.148,.126,hoodie)
    oval(...elbow,.13,.13,.13,hoodie)
    tube(elbow,wrist,.127,.096,hoodie,0,side*.55)
    oval(wrist[0],1.414,-.32,.108,.075,.135,skin,side)
    for(let i=0;i<4;i++) oval(wrist[0]+(i-1.5)*.042,1.398,-.426+.014*Math.abs(i-1.5),.024,.034,.075,skin,side)
  }
  for(let i=0;i<16;i++){
    const p=t=>[px+.31*Math.cos(t),2.01+.29*Math.sin(t),.61]
    tube(p(i*Math.PI/16),p((i+1)*Math.PI/16),.034,.034,'#384a4e')
  }
  plant(2.38,.035,1.35,1.13)
  return new Float32Array(vertices)
}
