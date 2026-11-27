import { keyboardKeys } from './keyboardLayout'
import { buildDeveloper } from './developerFigure'
import { buildTaskLamp } from './taskLamp'
import { objects } from './studioObjects'

// Coordinates are in room units. Y is up and the two open walls face +X and +Z.
const TAU = 2 * Math.PI
const sub = (a,b) => a.map((v,i) => v-b[i])
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]
const unit = v => v.map(n => n/(Math.hypot(...v)||1))
const rgb = hex => [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255)

export const clockCenter=[-.34,3.18,-2.17]
export const drinkSurface=[1.78,1.554,-.91]

export function studioModel (parts=[]) {
  const vertices = []
  function part(kind){
    if(parts.length)parts[parts.length-1].end=vertices.length
    parts.push({kind,start:vertices.length,end:vertices.length})
  }
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
  const wood='#bb8157', edge='#98613f', baseboard='#b3a997', charcoal='#313d43', cream='#f0dbc1'
  // Continue the floor and walls past the camera so the viewport is inside the room.
  for (let ix=0; ix<4; ix++) for (let iz=0; iz<4; iz++) {
    const x=-3+6*ix, z=-2.25+4.5*iz
    quad([x,.03,z+4.5],[x+6,.03,z+4.5],[x+6,.03,z],[x,.03,z],'#ffffff',uv(0,700,1000,760))
  }
  box(8.9,6,-2.28,24,12,.13,'#c9c5b9')
  box(-3.04,6,9,.13,12,23,'#dfcaac')
  box(8.9,.15,-2.18,24,.22,.10,baseboard)
  box(-2.94,.15,9,.10,.22,23,baseboard)

  function surface(key, texture) {
    const {x,y,z,width,height}=objects[key]
    const l=x-width/2, r=x+width/2, top=y+height/2, bottom=y-height/2
    quad([l,bottom,z],[r,bottom,z],[r,top,z],[l,top,z],'#ffffff',uv(...texture))
  }
  part('window')
  // A recessed pair of timber casements. The outer lining, sash, putty bead
  // and glass occupy different planes, so the reveals stay visible on orbit.
  box(-2.955,2.05,-.08,.105,1.99,2.76,'#685044')
  quad([-2.895,1.15,1.22],[-2.895,1.15,-1.38],[-2.895,2.95,-1.38],[-2.895,2.95,1.22],'#ffffff',uv(1080,0,940,640))
  function frame(x,depth,bottom,top,left,right,width,color){
    for(const z of [left+width/2,right-width/2])box(x,(bottom+top)/2,z,depth,top-bottom,width,color)
    for(const y of [bottom+width/2,top-width/2])box(x,y,(left+right)/2,depth,width,right-left-2*width,color)
  }
  frame(-2.91,.13,1.09,3.01,-1.44,1.28,.065,'#9b7253')
  frame(-2.865,.112,1.13,2.972,-1.397,1.237,.034,'#dab58b')
  for(const [left,right] of [[-1.367,-.082],[-.078,1.207]]){
    frame(-2.856,.078,1.158,2.945,left,right,.047,'#dfc39e')
    frame(-2.863,.045,1.205,2.898,left+.047,right-.047,.016,'#947a60')
    frame(-2.843,.028,1.216,2.887,left+.058,right-.058,.010,'#edddc1')
    box(-2.859,2.24,(left+right)/2,.057,.036,right-left-.092,'#d7b996')
    box(-2.829,2.25,(left+right)/2,.010,.011,right-left-.09,'#f0dbb9')
  }
  // The latch has a backplate, spindle and a lever that clears the meeting rail.
  box(-2.803,1.98,-.106,.027,.126,.046,'#937859')
  for(const y of [1.93,2.029])tube([-2.79,y,-.106],[-2.784,y,-.106],.007,.007,'#c9ad82')
  tube([-2.80,1.993,-.106],[-2.737,1.993,-.106],.018,.015,'#b59263')
  tube([-2.737,1.993,-.106],[-2.725,1.917,-.112],.015,.012,'#c6a775')
  for(const z of [-1.348,1.189])for(const y of [1.51,2.59]){
    tube([-2.817,y,z],[-2.817,y+.096,z],.012,.012,'#a38968')
    tube([-2.817,y+.043,z],[-2.817,y+.052,z],.013,.013,'#705e4d')
  }
  box(-2.89,1.064,-.08,.23,.09,2.76,'#a77e5a')
  shell(-2.83,-.08,[[1.08,.29,2.82,.024],[1.095,.35,2.88,.035],
    [1.131,.35,2.88,.035],[1.146,.329,2.864,.031]],'#c8986e')

  part('clock')
  const [clockX,clockY,clockZ]=clockCenter
  oval(clockX,clockY,clockZ,.30,.30,.035,'#76533f')
  oval(clockX,clockY,clockZ+.018,.258,.258,.024,'#ead9b7')
  for(let i=0;i<12;i++){
    const angle=i*TAU/12
    const inner=.205, outer=.228
    tube([clockX+inner*Math.sin(angle),clockY+inner*Math.cos(angle),clockZ+.048],
      [clockX+outer*Math.sin(angle),clockY+outer*Math.cos(angle),clockZ+.048],.006,.006,'#756652')
  }

  part('shelf')
  // Shelves, books and a trailing houseplant furnish the back wall.
  box(1.71,2.60,-1.99,1.95,.09,.45,wood)
  for(const x of [1.06,2.37]) box(x,2.49,-2.1,.08,.22,.13,edge)
  const spines=['#b85b42','#e5b871','#425e62','#f0d5a9','#658e84']
  spines.forEach((color,i)=>{
    part('book')
    const h=.34+.11*Math.sin(i*1.8)
    const x=1.02+i*.14
    box(x,2.65+h/2,-2.0,.099,h-.018,.218,'#dfcfaf')
    for(const offset of [-.053,.053])box(x+offset,2.65+h/2,-2,.012,h,.24,color)
    box(x,2.65+h/2,-1.885,.116,h,.018,color)
    box(1.02+i*.14,2.71,-1.877,.08,.014,.012,cream)
  })
  function planter(x,y,z,r,h,color){
    tube([x,y,z],[x,y+.94*h,z],r*.76,r,color)
    const soilY=y+h*.94+.001
    tube([x,soilY,z],[x,soilY+.002,z],r*.91,r*.91,'#504336')
    for(let i=0;i<32;i++){
      const at=(k,radius,height)=>[x+radius*Math.cos(k*TAU/32),height,z+radius*Math.sin(k*TAU/32)]
      const lip=[[r,y+.94*h],[r*1.015,y+h],[r*.90,y+h],[r*.90,soilY]]
      for(let j=1;j<lip.length;j++){
        quad(at(i,...lip[j-1]),at(i,...lip[j]),at(i+1,...lip[j]),at(i+1,...lip[j-1]),color)
      }
    }
    return soilY+.003
  }
  // Shape each blade around a curved midrib, with cupped sides and a turned tip.
  function leaf(base,angle,length,width,rise,droop,tilt,color){
    const dx=Math.cos(angle),dz=Math.sin(angle)
    let previous
    for(let j=0;j<=10;j++){
      const t=j/10
      const half=width*Math.sin(Math.PI*t)**.78*(1.18-.45*t)
      const bend=.13*length*t*t
      const mid=[base[0]+dx*length*t-dz*bend,base[1]+rise*t-droop*t*t,
        base[2]+dz*length*t+dx*bend]
      const row=[-1,-.45,0,.45,1].map(u=>[mid[0]-dz*half*u,
        mid[1]+half*(u*tilt-.26*u*u),mid[2]+dx*half*u])
      if(previous)for(let k=0;k<4;k++)quad(previous[k],previous[k+1],row[k+1],row[k],color)
      previous=row
    }
  }

  // Pothos vines rest on the front lip before hanging down past the shelf.
  part('pot')
  const shelfSoil=planter(2.17,2.65,-1.98,.155,.22,'#b9bba4')
  const vineGreens=['#708b53','#527447','#80935c','#5e804e']
  part('leaves')
  for(let i=0;i<8;i++){
    const a=i*2.4, height=.07+.045*Math.sin(i*1.8)
    const root=[2.17+.035*Math.cos(a),shelfSoil,-1.98+.035*Math.sin(a)]
    const petiole=[root[0]+.042*Math.cos(a),root[1]+height,root[2]+.042*Math.sin(a)]
    tube(root,petiole,.005,.003,'#66804e')
    leaf(petiole,a,.117,.054,.052,.079,.35*Math.cos(a),vineGreens[i%4])
  }
  for(let v=0;v<4;v++){
    const direction=[.7,2.15,1.38,-.35][v]
    const count=[9,7,5,4][v]
    let node=[2.17,shelfSoil,-1.98]
    for(let j=1;j<=count;j++){
      const reach=.092*Math.min(j,3)+.017*Math.max(0,j-3)
      const next=[2.17+Math.cos(direction)*reach+.019*Math.sin(j*.81+v),
        shelfSoil+.068*Math.sin(Math.min(j,3)*Math.PI/3)-.063*Math.max(0,j-3),
        -1.98+Math.sin(direction)*reach]
      tube(node,next,.006,.005,'#66804e')
      const angle=direction+(j%2?1:-1)*(.76+.14*Math.sin(j+v))
      const size=1-.042*j
      leaf(next,angle,.128*size,.059*size,.055,.115*size,.38*Math.sin(j+v),vineGreens[(j+v)%4])
      node=next
    }
  }

  part('desk')
  // A broad wooden desk, trestles, drawer cabinet, keyboard and mug.
  shell(.12,-.98,[[1.145,4.70,1.69,.075],[1.17,4.75,1.74,.08],[1.28,4.75,1.74,.08],[1.295,4.72,1.71,.07]],wood)
  quad([-2.20,1.296,-.16],[2.44,1.296,-.16],[2.44,1.296,-1.80],[-2.20,1.296,-1.80],'#ffffff',uv(0,1480,1000,480))
  shell(-.02,-.57,[[1.298,2.57,.83,.08],[1.306,2.56,.82,.08]],'#4d5e63')
  box(.12,1.14,-.98,4.65,.06,1.65,edge)
  for(const z of [-1.66,-.32]) box(-1.97,.58,z,.15,1.15,.15,charcoal)
  for(const x of [1.415,2.225])box(x,.59,-.98,.04,1.14,1.34,'#ad9f8c')
  box(1.82,.59,-1.63,.78,1.14,.04,'#816f5f')
  box(1.82,.073,-.98,.81,.106,1.34,'#ad9f8c')
  // Fixed dividers back the reveals between drawer fronts right up to their rear face.
  for(let i=0;i<2;i++)box(1.82,.45+i*.34,-.98,.78,.046,1.34,'#816f5f')
  for(let i=0;i<3;i++){
    part('drawer')
    const trayY=.26+i*.34
    const floor=trayY-.025
    box(1.82,floor-.015,-.82,.72,.03,1.04,'#987e64')
    for(const side of [-1,1])box(1.82+side*.35,floor+.034,-.82,.023,.068,1.04,'#93775d')
    box(1.82,floor+.034,-1.33,.68,.068,.02,'#93775d')
    if(i===2){
      // Clothbound notebook, page edges, elastic closure and a sharpened pencil.
      box(1.68,floor+.04,-.89,.31,.08,.42,'#476e67')
      box(1.686,floor+.04,-.886,.302,.054,.416,'#e4d8bd')
      box(1.78,floor+.081,-.89,.024,.006,.42,'#283e3d')
      tube([1.91,floor+.018,-.69],[1.99,floor+.018,-1.04],.018,.018,'#ce9745')
      tube([1.99,floor+.018,-1.04],[2.0,floor+.018,-1.08],.018,.003,'#d5b48a')
    }else if(i===1){
      // Coiled charging cable with a plug and a separate USB stick.
      const cablePoint=t=>[1.70+.132*Math.cos(t),floor+.015+.003*t, -.91+.116*Math.sin(t)]
      for(let j=0;j<24;j++)tube(cablePoint(j*TAU/16),cablePoint((j+1)*TAU/16),.012,.012,'#e2ddce')
      const end=cablePoint(1.5*TAU)
      tube(end,[1.58,end[1],-.72],.012,.012,'#e2ddce')
      box(1.58,end[1],-.70,.052,.033,.063,'#c4c7bd')
      box(1.97,floor+.029,-.90,.099,.058,.20,'#ad6349')
      box(1.97,floor+.029,-1.025,.077,.026,.05,'#b1b7b3')
    }else{
      // A small driver and three spare batteries with exposed positive terminals.
      tube([1.58,floor+.04,-.71],[1.64,floor+.04,-.91],.04,.032,'#b96d42')
      tube([1.64,floor+.04,-.91],[1.70,floor+.04,-1.11],.013,.01,'#b5bdba')
      for(const x of [1.84,1.92,2.0]){
        tube([x,floor+.032,-.78],[x,floor+.032,-.94],.032,.032,'#475b61')
        tube([x,floor+.032,-.94],[x,floor+.032,-.985],.032,.032,'#c79862')
        tube([x,floor+.032,-.985],[x,floor+.032,-.996],.016,.016,'#c6cbc3')
      }
    }
    box(1.82,.28+i*.34,-.285,.79,.31,.05,'#d9d1bf')
    box(1.82,.34+i*.34,-.25,.25,.035,.035,charcoal)
  }
  part('project')
  box(.05,1.32,-1.27,.72,.055,.34,charcoal)
  box(.05,1.55,-1.46,.105,.43,.10,charcoal)
  box(.05,1.76,-1.45,.34,.055,.10,'#3e4a4f')
  // One continuous slim enclosure keeps the panel seated in a believable body.
  shell(.05,-1.43,[[1.39,3.13,.085,.028],[1.425,3.235,.110,.040],[2.775,3.235,.110,.040],[2.80,3.13,.085,.028]],charcoal)
  box(1.50,1.423,-1.346,.035,.008,.006,'#b1d5b1')
  surface('project',[0,0,1024,440])
  part('keyboard')
  const pitch=.099,keyboardLeft=-1.23
  shell(keyboardLeft+9.2*pitch,-.542,[[1.306,1.88,.652,.026],[1.337,1.88,.652,.026]],charcoal)
  for(const {row,column,width,color,atlasX,atlasY} of keyboardKeys){
    part('key')
    const x=keyboardLeft+(column+width/2)*pitch
    const z=-.799+row*pitch+(row>0?.026:0)
    const base=width*pitch-.008,top=base-.012
    shell(x,z,[[1.337,base,.091,.008],[1.348,base,.091,.008],[1.38,top,.079,.007]],color)
    const half=top/2-.005
    quad([x-half,1.3805,z+.032],[x+half,1.3805,z+.032],[x+half,1.3805,z-.032],[x-half,1.3805,z-.032],
      '#ffffff',uv(atlasX+1,atlasY+1,width*48-2,32))
  }
  part('mouse')
  // Longitudinal sections widen at the buttons, narrow at the grip and
  // rise into the palm rest. The lower lip sits flat on the desk mat.
  function mouseSurface(t,a){
    const z=-.49-.179*Math.cos(t)
    const envelope=Math.max(0,Math.sin(t))**.66
    const waist=1-.11*Math.exp(-((t-1.38)**2)/.10)
    const x=.91+.116*envelope*waist*Math.sin(a)
    const rise=.067+.032*Math.exp(-((t-1.95)**2)/.43)
    return [x,1.326+rise*envelope*Math.max(0,Math.cos(a))**.78,z]
  }
  const mouseRows=32,mouseCols=24
  const mouseMesh=Array.from({length:mouseRows+1},(_,i)=>
    Array.from({length:mouseCols+1},(_,j)=>{
      const t=Math.PI*i/mouseRows,a=Math.PI*(j/mouseCols-.5)
      const across=sub(mouseSurface(t,a+.001),mouseSurface(t,a-.001))
      const along=sub(mouseSurface(Math.min(Math.PI,t+.001),a),mouseSurface(Math.max(0,t-.001),a))
      return {point:mouseSurface(t,a),normal:i===0?[0,0,-1]:i===mouseRows?[0,0,1]:unit(cross(along,across))}
    }))
  for(let i=0;i<mouseRows;i++){
    for(let j=0;j<mouseCols;j++){
      const a=mouseMesh[i][j],b=mouseMesh[i+1][j],c=mouseMesh[i+1][j+1],d=mouseMesh[i][j+1]
      const color=i<15?'#dddccf':'#cbcbbd'
      for(const face of [[a,b,c],[a,c,d]])tri(face.map(v=>v.point),color,face.map(v=>v.normal))
    }
    for(const j of [0,mouseCols]){
      const a=mouseMesh[i][j].point,b=mouseMesh[i+1][j].point
      quad(a,b,[b[0],1.307,b[2]],[a[0],1.307,a[2]],'#4d5552')
    }
  }
  // Button gaps track the curved shell right up to its edges.
  for(let i=0;i<15;i++)tube(mouseMesh[i][12].point,mouseMesh[i+1][12].point,.002,.002,charcoal)
  for(let j=0;j<mouseCols;j++)tube(mouseMesh[15][j].point,mouseMesh[15][j+1].point,.0018,.0018,'#787c72')
  const [wheelX,wheelY,wheelZ]=mouseSurface(1.09,0)
  oval(wheelX,wheelY,wheelZ,.022,.009,.039,'#555c56')
  oval(wheelX,wheelY+.006,wheelZ,.014,.021,.032,'#353d39')
  for(let i=-2;i<=2;i++){
    const z=i*.009
    const y=wheelY+.006+.021*Math.sqrt(1-(z/.032)**2)
    tube([wheelX-.005,y-.001,wheelZ+z],[wheelX+.005,y-.001,wheelZ+z],.0015,.0015,'#747a71')
  }
  part('cup')
  const [cupX,liquidY,cupZ]=drinkSurface
  const cupProfile=[[.112,1.30],[.130,1.315],[.145,1.561],[.143,1.57],
    [.136,1.573],[.130,1.568],[.128,liquidY]]
  for(let i=0;i<48;i++){
    const ringPoint=(r,y,k)=>[cupX+r*Math.cos(k*TAU/48),y,cupZ+r*Math.sin(k*TAU/48)]
    for(let j=1;j<cupProfile.length;j++){
      const [r0,y0]=cupProfile[j-1],[r1,y1]=cupProfile[j]
      quad(ringPoint(r0,y0,i),ringPoint(r1,y1,i),ringPoint(r1,y1,i+1),ringPoint(r0,y0,i+1),
        j<3?'#e0ba83':'#f1d6ac')
    }
    tri([[cupX,liquidY,cupZ],ringPoint(.128,liquidY,i+1),ringPoint(.128,liquidY,i)],'#794932')
  }
  oval(cupX-.045,liquidY+.001,cupZ-.032,.035,.0008,.007,'#be8962')
  for(let i=0;i<12;i++){
    const pos=t=>[1.91+.12*Math.sin(t),1.44+.09*Math.cos(t),-.91]
    tube(pos(i*Math.PI/12),pos((i+1)*Math.PI/12),.027,.027,'#e0ba83')
  }
  part('contact')
  const card=objects.contact
  // A single folded sheet rests on two edges. The open ends reveal its thickness.
  const foot=card.y-card.height/2,front=card.z+card.height*card.rake/2
  const crest=front-card.height*card.rake
  const fold=[[foot,front],[foot+card.height,crest],[foot+card.height+.006,crest-.006],
    [foot+card.height+.006,crest-.013],[foot,crest-.106],[foot,crest-.096],
    [foot+card.height-.005,crest-.010],[foot,front-.009]]
  const left=card.x-card.width/2,right=card.x+card.width/2
  for(let i=0;i<fold.length;i++){
    const a=fold[i],b=fold[(i+1)%fold.length]
    quad([left,...a],[right,...a],[right,...b],[left,...b],
      i===0?'#e7dcc9':i===3?'#625e59':'#a39889',i===0?uv(1060,1490,900,395):null)
  }
  for(const x of [left,right]){
    for(const corners of [[0,1,6,7],[1,2,3,6],[3,4,5,6]]){
      quad(...corners.map(i=>[x,...fold[i]]),'#b1a28d')
    }
  }
  part('lamp')
  buildTaskLamp({tri,tube,part})

  part('chairBase')
  // The seated figure faces -Z, with elbows bent toward the keyboard.
  const px=-.68, pz=.77
  tube([px,.18,pz],[px,.77,pz],.066,.075,charcoal)
  for(let i=0;i<5;i++){
    const a=i*TAU/5, end=[px+.46*Math.cos(a),.13,pz+.46*Math.sin(a)]
    tube([px,.22,pz],end,.055,.052,charcoal)
    oval(end[0],.09,end[2],.085,.08,.079,'#344143')
  }
  part('chair')
  oval(px,.74,pz,.47,.105,.42,'#58647a')
  tube([px,.72,pz+.22],[px,1.30,pz+.43],.055,.055,charcoal)
  shell(px,pz+.43,[[.98,.53,.10,.038],[1.05,.77,.14,.054],[1.28,.81,.16,.065,.035],[1.44,.72,.14,.055,.04],[1.48,.60,.10,.045,.035]],'#465166')
  shell(px,pz+.45,[[1.016,.51,.10,.043],[1.08,.72,.16,.061],[1.32,.75,.17,.064,.027],[1.43,.65,.12,.048,.035]],'#748095')
  for(const side of [-1,1]){
    tube([px+side*.36,.75,pz],[px+side*.41,1.03,pz+.02],.034,.032,charcoal)
    shell(px+side*.41,pz-.045,[[1.025,.091,.33,.039],[1.058,.109,.35,.042],[1.07,.091,.33,.039]],'#434650')
  }
  buildDeveloper({tri,oval,tube,shell,part})
  parts[parts.length-1].end=vertices.length
  return new Float32Array(vertices)
}
