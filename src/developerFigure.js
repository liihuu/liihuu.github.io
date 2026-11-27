// Sculpt the seated developer in room units. Head details share a local frame
// so the hair and headphones all follow the gaze toward the chart.
export function buildDeveloper({tri,oval,tube,part=()=>{}}) {
  const px=-.68
  const tau=Math.PI*2
  const skin='#d69a77', cloth='#bc7356', denim='#465566'
  const unit=v=>{const length=Math.hypot(...v)||1;return v.map(n=>n/length)}
  const diff=(a,b)=>a.map((v,i)=>v-b[i])
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]

  function skinSurface(rows,color,motion=()=>0,materialUV=null) {
    const count=rows[0].length
    const normals=rows.map((row,j)=>row.map((_,i)=>{
      const around=diff(row[(i+1)%count],row[(i+count-1)%count])
      const along=diff(rows[Math.min(j+1,rows.length-1)][i],rows[Math.max(0,j-1)][i])
      return unit(cross(along,around))
    }))
    for(let j=1;j<rows.length;j++)for(let i=0;i<count;i++){
      const k=(i+1)%count
      for(const corners of [[[j-1,i],[j,k],[j-1,k]],[[j-1,i],[j,i],[j,k]]]){
        tri(corners.map(([r,c])=>rows[r][c]),color,corners.map(([r,c])=>normals[r][c]),materialUV && corners.map(()=>materialUV),corners.map(([r])=>motion(r)))
      }
    }
  }
  // Cross sections specify height, width radius, depth radius, and centre depth.
  function torso(sections,color,fold=0) {
    skinSurface(sections.map(([y,rx,rz,z],j)=>Array.from({length:40},(_,i)=>{
      const a=i*tau/40
      const wrinkle=fold*Math.sin(a*7+j*.36)*Math.cos(2*a+j*.18)
      return [px+(rx+wrinkle)*Math.cos(a),y,z+(rz+wrinkle)*Math.sin(a)]
    })),color)
  }
  // Continuous sections follow the bend at the elbow, knee and finger joints.
  function limb(stations,color) {
    const rows=stations.map(([x,y,z,width,depth],j)=>{
      const tangent=unit(diff(stations[Math.min(j+1,stations.length-1)].slice(0,3),stations[Math.max(0,j-1)].slice(0,3)))
      const up=unit(cross(tangent,[1,0,0])), across=cross(up,tangent)
      return Array.from({length:16},(_,i)=>{
        const a=-i*tau/16
        return [x,y,z].map((v,k)=>v+width*Math.cos(a)*across[k]+depth*Math.sin(a)*up[k])
      })
    })
    skinSurface(rows,color,j=>stations[j][5]||0)
  }

  for(const side of [-1,1]){
    const x=px+side*.208, knee=.10+side*.055, ankle=knee+.09
    limb([[x,.91,.74,.17,.16],[x,.88,.51,.17,.15],[x,.84,.28,.148,.138],
      [x,.80,knee,.143,.128],[x,.73,knee-.036,.137,.12],[x,.63,knee,.119,.103],
      [x,.52,ankle-.02,.126,.11],[x,.32,ankle,.101,.087],[x,.241,ankle,.096,.083],
      [x,.22,ankle,.104,.088],[x,.20,ankle,.098,.085]],denim)
    // Build the sole from a footprint with a broader ball and a narrow heel.
    // Toe spring and outward foot rotation are shared by every shoe panel.
    function shoePoint(lateral,height,forward) {
      const angle=side*.12
      return [x+lateral*Math.cos(angle)+forward*Math.sin(angle),height,
        ankle+lateral*Math.sin(angle)-forward*Math.cos(angle)]
    }
    function sole(a,h,scale){
      const f=Math.cos(a)
      const forward=.09+.249*f
      const ball=.5+.5*Math.sin(f*2.4)
      const lateral=scale*.139*(.83+.17*ball)*Math.sign(Math.sin(a))*Math.abs(Math.sin(a))**.78
      return shoePoint(lateral,h+.022*Math.max(f,0)**3,forward*scale)
    }
    function welt(levels,color){
      skinSurface(levels.map(([h,scale])=>Array.from({length:48},(_,i)=>sole(i*tau/48,h,scale))),color)
    }
    welt([[.033,.97],[.038,1.013],[.052,1.015]],'#796856')
    welt([[.052,1.015],[.061,1.025],[.082,1.018],[.091,.986]],'#d8c9ab')
    welt([[.065,1.026],[.069,1.026]],'#aa9779')
    // Heel counter, textile quarter, and suede toe are sections of the same last.
    const last=[[-.154,.012,.149],[-.143,.071,.194],[-.113,.103,.220],
      [-.048,.116,.223],[.018,.112,.215],[.074,.113,.228],
      [.13,.122,.207],[.19,.132,.172],[.242,.122,.147],[.298,.095,.135],[.329,.055,.123],[.338,.004,.115]]
    const seamPoint=([forward,width,top],a)=>shoePoint(width*Math.cos(a),
      .091+.018*Math.max(forward/.338,0)**3+(top-.091)*Math.max(0,Math.sin(a))**.69,forward)
    function panel(sections,color){
      skinSurface(sections.map(row=>Array.from({length:26},(_,i)=>seamPoint(row,i*tau/26))),color)
    }
    panel(last.slice(0,4),'#788679')
    panel(last.slice(3,9),'#ede0c7')
    panel(last.slice(8),'#bfaa8c')
    for(const sign of [-1,1]){
      const stitch=last.slice(1,9).map(row=>seamPoint(row,sign===1?.43:Math.PI-.43))
      for(let j=1;j<stitch.length;j++)tube(stitch[j-1],stitch[j],.003,.003,'#e9d6b6')
    }
    const tongue=shoePoint(0,.211,.079)
    oval(...tongue,.058,.018,.104,'#c2ae90',0,.22)
    for(let j=0;j<4;j++){
      const f=.070+j*.031, h=.236-j*.012
      for(const sign of [-1,1]){
        tube(shoePoint(sign*.055,h-.011,f),shoePoint(-sign*.051,h-.015,f+.025),.0048,.0048,'#f4e7ca')
      }
    }
    const heelTag=shoePoint(0,.192,-.136)
    oval(...heelTag,.032,.040,.012,'#6c7e72')

  }

  torso([[.829,.23,.18,.76],[.85,.293,.208,.75],[.89,.306,.221,.75],[.92,.31,.222,.75]],'#9a5b46')
  torso([[.895,.304,.221,.75],[.925,.323,.236,.743],[.969,.335,.244,.736],[1.01,.321,.224,.735],
    [1.09,.313,.224,.715],[1.18,.315,.239,.68],[1.28,.341,.252,.653],
    [1.38,.366,.26,.621],[1.45,.385,.246,.594],[1.495,.362,.215,.572],
    [1.53,.295,.177,.564],[1.55,.166,.134,.546]],cloth,.009)
  // A folded hood drapes down the back, with two lips and a central seam.
  torso([[1.255,.033,.021,.899],[1.282,.116,.044,.901],[1.33,.189,.07,.886],
    [1.39,.23,.096,.85],[1.45,.246,.117,.795],[1.51,.251,.14,.729],[1.55,.216,.136,.68],
    [1.564,.166,.091,.655]],'#ad674f',.005)
  tube([px,1.276,.935],[px,1.36,.959],.005,.006,'#d28a68')
  tube([px,1.36,.959],[px,1.427,.929],.006,.005,'#d28a68')
  torso([[1.53,.167,.114,.543],[1.565,.169,.121,.537],[1.585,.135,.103,.533]],'#995a44')
  torso([[1.55,.113,.101,.54],[1.63,.114,.099,.521],[1.734,.121,.111,.493]],skin)

  // Elliptical facial sections narrow at the jaw and flatten across the cheeks.
  const yaw=.47, nod=.10
  function head([x,y,z]){
    const tiltedY=y*Math.cos(nod)-z*Math.sin(nod), tiltedZ=y*Math.sin(nod)+z*Math.cos(nod)
    return [px+.029+x*Math.cos(yaw)-tiltedZ*Math.sin(yaw),1.874+tiltedY,.456+x*Math.sin(yaw)+tiltedZ*Math.cos(yaw)]
  }
  const faceSections=[[-.261,.031,.044,-.085],[-.247,.097,.102,-.067],[-.211,.145,.145,-.042],
    [-.154,.181,.178,-.015],[-.096,.206,.203,-.004],[-.035,.222,.22,.004],
    [.027,.234,.228,.009],[.097,.233,.222,.014],[.173,.212,.20,.022],[.23,.155,.159,.022],[.264,.028,.041,.022]]
  skinSurface(faceSections.map(([y,rx,rz,z])=>Array.from({length:40},(_,i)=>{
    const a=i*tau/40
    return head([rx*Math.cos(a),y,z+rz*Math.sin(a)])
  })),skin)

  // Sweep broad locks from an offset crown. Each tapered end returns into
  // the head at the neckline, closing the silhouette even from below.
  const hairRows=26, hairColumns=144
  const hairPoints=Array.from({length:hairRows+1},(_,j)=>{
    const t=j/hairRows
    return Array.from({length:hairColumns},(_,i)=>{
      const a=tau*i/hairColumns
      const flow=12*a+.8*Math.sin(3*a)+.38*Math.sin(5*a)+1.6*t
      const lock=(1+Math.cos(flow))*.5
      const edge=.01-.103*Math.sin(a)+.013*Math.sin(2*a+.5)-.026*lock
      const start=Math.asin((edge-.04)/.265)
      const latitude=start+(Math.PI/2-start)*t
      const ring=Math.cos(latitude)
      const sweep=a+.72*t+.15*Math.sin(a)*Math.sin(Math.PI*t)
      const relief=.014*lock*lock+.005*Math.sin(3*a+.6)
      const y=.04+.265*Math.sin(latitude)
      const rx=.249+relief, rz=.248+relief
      if(j===0){
        const k=faceSections.findIndex(section=>section[0]>=edge)
        const lo=faceSections[k-1], hi=faceSections[k]
        const f=(edge-lo[0])/(hi[0]-lo[0])
        return head([(.997*(lo[1]+f*(hi[1]-lo[1])))*Math.cos(a),edge,
          lo[3]+f*(hi[3]-lo[3])+.997*(lo[2]+f*(hi[2]-lo[2]))*Math.sin(a)])
      }
      return head([rx*ring*Math.cos(sweep)-.025*t*t,y,
        .014+rz*ring*Math.sin(sweep)+.01*t])
    })
  })
  skinSurface(hairPoints,'#463c38',undefined,[-2,-1])
  function line(points,r,color){
    for(let j=1;j<points.length;j++)tube(head(points[j-1]),head(points[j]),r,r,color)
  }
  const nose=head([0,-.029,-.225])
  oval(...nose,.036,.053,.045,skin)
  line([[-.047,-.12,-.187],[0,-.125,-.196],[.044,-.117,-.187]],.005,'#a76d58')
  part('developerArms')
  for(const side of [-1,1]){
    const ear=head([side*.216,-.028,.012])
    oval(...ear,.039,.071,.047,'#bf8469')
    const eye=head([side*.097,.014,-.196])
    oval(...eye,.021,.009,.011,'#403836')
    line([[side*.046,.058,-.213],[side*.10,.068,-.202],[side*.157,.055,-.169]],.009,'#53413b')
  }

  // The padded band follows the scalp, with shells and adjustable metal yokes.
  const band=Array.from({length:29},(_,i)=>{
    const a=i*Math.PI/28
    return [.257*Math.cos(a)-.021*Math.sin(a),.012+.304*Math.sin(a),.042-.013*Math.sin(a)]
  })
  line(band,.026,'#344342')
  for(const side of [-1,1]){
    part('developerArms')
    const earpad=head([side*.245,.002,.028])
    oval(...earpad,.067,.113,.085,'#303e40')
    for(const [inner,outer,r1,r2,color] of [[.268,.293,.094,.095,'#71857c'],[.293,.308,.083,.078,'#48605c'],[.308,.312,.051,.049,'#617971']]){
      tube(head([side*inner,0,.028]),head([side*outer,0,.028]),r1,r2,color)
    }
    line([[side*.278,.114,.030],[side*.293,.066,.096],[side*.293,.006,.105]],.013,'#a4a99b')

    part('typingHand',{side})
    const wristX=px+.13+side*.26, wristZ=-.29+side*.025
    const shoulder=px+side*.284, elbow=px+side*.388
    limb([[shoulder-side*.052,1.457,.623,.063,.072],[shoulder,1.454,.596,.127,.144],[shoulder+side*.053,1.424,.533,.144,.145],
      [elbow,1.332,.411,.120,.127],[elbow+side*.019,1.263,.307,.112,.114],
      [elbow+side*.025,1.233,.247,.116,.111],[elbow+side*.014,1.232,.184,.109,.107],
      [elbow,1.249,.127,.098,.097],[elbow-side*.013,1.264,.078,.104,.103],
      [(elbow+wristX)/2,1.377,-.049,.094,.083,side*.12],
      [wristX,1.465,wristZ+.079,.074,.061,side*.30]],cloth)
    // Use the same rings for the cuff rim and the wrist. Even at the bottom
    // of a keystroke, the underside of the wrist clears the highest keycap.
    const handPoint=(lateral,y,z)=>{
      const lift=.063*Math.max(0,Math.min(1,(z+.225)/.24))
      return [wristX+side*lateral,y+lift-.065*lateral,wristZ+z]
    }
    function handRing(z,w,h,y,shift=0){
      return Array.from({length:28},(_,j)=>{
        const a=side*tau*j/28
        return handPoint(shift+w*Math.cos(a),y+h*Math.sin(a),z)
      })
    }
    const cuff=[
      handRing(.112,.074,.057,1.399),handRing(.078,.079,.060,1.402),
      handRing(.038,.077,.058,1.405),handRing(.014,.073,.053,1.405),
      handRing(.014,.055,.037,1.405)
    ]
    skinSurface(cuff,'#a46047',j=>side*[.28,.30,.36,.40,.40][j])
    const palm=[[.014,.055,.037,1.405,0,.40],[-.009,.069,.036,1.414,-.003,.51],
      [-.031,.086,.039,1.422,-.006,.59],[-.071,.091,.036,1.428,-.003,.63],
      [-.102,.084,.029,1.43,.001,.66],[-.121,.072,.021,1.426,.004,.68],
      [-.128,.063,.016,1.425,.004,.68],[-.131,.002,.002,1.425,.004,.68]]
    const palmRows=palm.map(([z,w,h,y,shift])=>handRing(z,w,h,y,shift))
    palmRows[0]=cuff[cuff.length-1]
    skinSurface(palmRows,skin,j=>side*palm[j][5])
    function digit(lateral,z,length,width,splay,finger){
      const stations=[[0,.023,1.425],[.18,.022,1.436],[.38,.020,1.445],
        [.51,.018,1.443],[.69,.017,1.432],[.79,.016,1.426],
        [.91,.015,1.417],[.98,.011,1.414],[1,.002,1.415]]
      const point=(t,y)=>handPoint(lateral+splay*t,y,z-length*t)
      part('typingFinger',{side,finger,tip:point(1,1.415)})
      limb(stations.map(([t,r,y])=>[...point(t,y),r*width,r*width*.85,
        t]),skin)
      // A low arched nail sits flush with the distal phalanx.
      const nail=point(.87,1.434)
      oval(...nail,.0105*width,.0035,.014,'#dfac91',.87,-.54)
    }
    digit(-.060,-.099,.123,.98,-.010,0)
    digit(-.019,-.109,.134,1.02,-.003,1)
    digit(.024,-.105,.119,.95,.006,2)
    digit(.063,-.088,.097,.80,.015,3)
    const thumb=[[-.044,1.409,-.023,.035,.032,.55],[-.073,1.412,-.043,.035,.031,.57],
      [-.094,1.411,-.065,.030,.026,.60],[-.108,1.405,-.091,.024,.021,.63],
      [-.113,1.401,-.117,.021,.018,.64],[-.110,1.402,-.134,.014,.013,.65],
      [-.109,1.403,-.14,.004,.004,.65]]
    part('typingFinger',{side,finger:4,tip:handPoint(-.109,1.403,-.14)})
    limb(thumb.map(([x,y,z,w,h],i)=>[...handPoint(x,y,z),w,h,i/(thumb.length-1)]),skin)
    oval(...handPoint(-.113,1.418,-.119),.012,.003,.014,'#dfac91',.85)

  }
}
