// Three painted exposures share one landscape, so lit windows and rooflines
// register throughout the sunset. Only the moving birds and meteor are redrawn.
const W=940,H=640
function layer(){
  const canvas=document.createElement('canvas')
  canvas.width=W; canvas.height=H
  return canvas
}
function landscape(time){
  const canvas=layer(), g=canvas.getContext('2d')
  let seed=1573
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
  const pick=(day,dusk,night)=>[day,dusk,night][time]
  function poly(points,color){
    g.fillStyle=color; g.beginPath()
    points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y))
    g.closePath(); g.fill()
  }
  function oval(x,y,w,h,color){
    g.beginPath(); g.ellipse(x,y,w,h,0,0,2*Math.PI); g.fillStyle=color; g.fill()
  }
  function rect(x,y,w,h,color){g.fillStyle=color;g.fillRect(x,y,w,h)}
  function line(x,y,xx,yy,color,width=1){
    g.beginPath();g.moveTo(x,y);g.lineTo(xx,yy);g.strokeStyle=color;g.lineWidth=width;g.stroke()
  }
  function wash(y1,y2,stops){
    const grad=g.createLinearGradient(0,y1,0,y2)
    stops.forEach((color,i)=>grad.addColorStop(i/(stops.length-1),color))
    return grad
  }
  rect(0,0,W,H,wash(0,390,[pick('#70abc7','#777baf','#182841'),pick('#bbdce3','#e5aba2','#384b70'),pick('#fae6c6','#ffdeb0','#8c8290')]))
  for(let i=0;i<95;i++){
    const x=random()*W,y=random()*310,r=.4+random()*1.6
    if(time===2)oval(x,y,r,r,'#e8e4d1')
  }
  const cloudTop=pick('#fff4dc','#ffd9b4','#70798c'),cloudBase=pick('#c2d4d7','#c29298','#495874')
  for(const [cx,cy,span] of [[-20,114,180],[155,120,155],[435,201,90],[787,117,224],[962,178,100]]){
    const cloud=wash(cy-span*.38,cy+15,[cloudTop,cloudTop,cloudBase])
    for(let i=0;i<31;i++){
      const t=i/30,x=cx+(t-.5)*span*1.65
      const height=(.08+.22*Math.sin(Math.PI*t)**2)*span*(.63+random()*.37)
      oval(x,cy-height*.43,span*(.06+random()*.07),height*.66,cloud)
    }
    for(let i=0;i<5;i++)oval(cx+(random()-.5)*span,cy+8+random()*7,span*(.08+.16*random()),2.5,cloudBase)
  }
  const skyBottom=pick('#d5dcd5','#dfb7ac','#6e7689')
  for(let row=0;row<3;row++){
    const path=[[0,H]]
    for(let x=0;x<=W;x+=4){
      const t=x+row*143
      path.push([x,278+row*33+28*Math.sin(t/103)+9*Math.sin(t/36)+4*Math.cos(t/15)+1.4*Math.sin(t/4)])
    }
    path.push([W,H])
    poly(path,[skyBottom,pick('#aebfc0','#bd9da4','#596a80'),pick('#849fa0','#9c8e99','#465c70')][row])
  }
  // Distant facades break the tree line. Their low contrast sets the scale.
  for(let x=-15;x<W;x+=13+random()*8){
    const y=328+Math.sin(x/108)*13+random()*22,w=10+random()*25,h=365-y
    rect(x,y,w,h+17,pick('#a6b8b5','#b7a095','#5a687b'))
    rect(x+w*.7,y,w*.3,h+17,pick('#8faaaa','#9d9091','#4e6074'))
    for(let k=3;k<w*.7-1;k+=6)for(let j=4;j<h;j+=8)rect(x+k,y+j,2,3,pick('#d5d5be','#d1b49f','#8b8683'))
  }
  const farBank=pick('#748d7e','#948c78','#3b5361')
  for(let x=-5;x<W+10;x+=5){
    const r=4+random()*7
    oval(x,366+Math.sin(x/55)*3,r,r*.9,farBank)
  }
  rect(0,370,W,175,wash(370,530,[pick('#b3cbc6','#d6afa1','#697587'),pick('#87aeae','#b29195','#415e72'),pick('#729d9f','#ac8d8f','#344e61')]))
  for(let i=0;i<590;i++){
    const x=random()*W,y=372+random()*150
    rect(x,y,2+random()*(y-360)*.24,.6+random()*1.3,pick('#c5d4c7','#e5c3a9','#748397'))
  }
  // Stone viaduct with open arches; the water remains visible beneath the vaults.
  const stone=pick('#91a09a','#ab948b','#586677')
  g.fillStyle=stone;g.beginPath();g.moveTo(-10,369);g.lineTo(452,354);g.lineTo(452,383)
  for(let i=6;i>=0;i--){
    const x=-10+i*66,y=399-i*2.15
    g.lineTo(x+61,y);g.bezierCurveTo(x+57,y-39,x+12,y-38,x+7,y);g.lineTo(x,y)
  }
  g.closePath();g.fill()
  line(0,367,452,352,pick('#cecab5','#dbc4aa','#808997'),3)
  for(let i=0;i<31;i++)line(i*15,363-i*.5,i*15,367-i*.5,stone,1.4)
  line(0,362,450,347,stone,1.6)

  // The near embankment descends toward an open bend on the right.
  const bank=x=>430+.102*x+7*Math.sin(x/116)
  poly([[0,bank(0)],[220,bank(220)],[440,bank(440)],[700,bank(700)],[W,bank(W)],[W,H],[0,H]],pick('#97a08c','#a38c7b','#475664'))
  function house(x,y,w,h,variant){
    const side=w*.31, rise=w*(.24+.09*variant), eave=y-h
    const plaster=pick(['#e4d7b9','#e3c4a3','#cfcec0'][variant],['#d7b999','#d3a78f','#c4b0a5'][variant],['#676c76','#716a71','#5e6b78'][variant])
    const tiles=pick(['#8a7771','#738893','#ad7560'][variant],['#8c7074','#797c8a','#a36b5e'][variant],['#384555','#364b5b','#4b4754'][variant])
    const shade=pick('#877f77','#8d7474','#3d4957')
    poly([[x,eave],[x+w,eave+4],[x+w,y+5],[x,y]],plaster)
    poly([[x+w,eave+4],[x+w+side,eave-9],[x+w+side,y-10],[x+w,y+5]],shade)
    poly([[x+w,eave+4],[x+w+side*.5,eave-rise-3],[x+w+side,eave-9]],plaster)
    const chimney=x+w*.24
    rect(chimney,eave-rise-13,w*.095,rise+12,plaster)
    rect(chimney-2,eave-rise-15,w*.095+4,4,shade)
    poly([[x-5,eave+1],[x+side*.5,eave-rise-7],[x+w+side*.5,eave-rise-3],[x+w+4,eave+6]],tiles)
    for(let j=1;j<=4;j++){
      const t=j/5
      line(x-4+(side*.5+4)*t,eave+1-(rise+8)*t,x+w+4+(side*.5-4)*t,eave+6-(rise+9)*t,'rgba(37,43,50,.22)',1.4)
    }
    line(x+side*.5,eave-rise-7,x+w+side*.5,eave-rise-3,pick('#c3b2a0','#c09c90','#667184'),2)
    line(x-5,eave+2,x+w+4,eave+7,shade,3)
    for(let row=0;row<2;row++)for(let col=0;col<3;col++){
      const wx=x+w*(.11+col*.295),wy=eave+12+row*(h*.41)+col
      const lit=random()>.44
      const glass=time===2 && lit?'#f3cc8e':pick('#7e9b9e','#999097','#354757')
      rect(wx-1.6,wy-1.6,w*.15+3,h*.19+3,shade)
      rect(wx,wy,w*.15,h*.19,glass)
      rect(wx+w*.071,wy,1.5,h*.19,plaster)
      rect(wx-3,wy+h*.19+1,w*.15+6,2,plaster)
    }
  }
  for(let x=-70;x<W;){
    const w=34+random()*29
    house(x,bank(x)+26,w,28+random()*21,Math.floor(random()*3))
    x+=w*1.3+8+random()*23
  }
  // Foreground crowns overlap the roofline with distinct sun- and shade-facing clusters.
  function tree(x,y,r){
    const shadow=pick('#52766c','#777b68','#2b4352'),mid=pick('#729178','#91876d','#3c5260')
    rect(x-2,y-r*.9,5,r*1.2,pick('#857660','#886d62','#3b404c'))
    for(let k=0;k<42;k++){
      const a=random()*Math.PI*2,d=Math.sqrt(random())*r
      const xx=Math.cos(a)*d, yy=Math.sin(a)*d
      const size=r*(.12+random()*.22)
      oval(x+xx,y-r+yy,size,size*.79,yy-xx*.4>0?shadow:mid)
    }
  }
  for(let i=0;i<18;i++){
    const x=random()*W
    tree(x,bank(x)+53+random()*28,12+random()*19)
  }
  for(let x=-95;x<W;){
    const w=69+random()*49
    house(x,620+Math.sin(x/97)*24,w,69+random()*35,Math.floor(random()*3))
    x+=w*.98
  }
  tree(873,638,57);tree(25,650,55)
  return canvas
}

export function createWindowSky(){
  const canvas=layer(),g=canvas.getContext('2d')
  const exposures=[]
  let previousPhase=-1,previousTick=-2
  return {canvas,paint(phase,progress=-1){
    const tick=progress<0?-1:Math.floor(progress*72)
    if(phase===previousPhase && tick===previousTick)return false
    previousPhase=phase;previousTick=tick
    const position=phase*2,index=Math.min(2,Math.floor(position)),mix=position-index
    const exposure=i=>exposures[i]??=landscape(i)
    g.globalAlpha=1;g.drawImage(exposure(index),0,0)
    if(mix){g.globalAlpha=mix;g.drawImage(exposure(index+1),0,0);g.globalAlpha=1}
    // Keep the sun and moon moving along the existing day/night transition.
    const night=phase>.52
    const travel=night?(phase-.52)/.48:phase/.52
    const cx=night?565+100*travel:597+115*travel,cy=night?314-197*travel:143+171*travel
    const alpha=night?travel:1-travel
    g.globalAlpha=alpha
    const glow=g.createRadialGradient(cx,cy,9,cx,cy,76)
    glow.addColorStop(0,'rgba(255,230,177,.32)');glow.addColorStop(1,'rgba(255,230,177,0)')
    g.fillStyle=glow;g.fillRect(cx-76,cy-76,152,152)
    g.beginPath();g.arc(cx,cy,night?13:19,0,2*Math.PI);g.fillStyle=night?'#fff2d4':'#fff0bd';g.fill()
    g.globalAlpha=1
    if(progress>=0){
      g.globalAlpha=Math.min(1,progress*12,(1-progress)*9)
      if(!night){
        g.strokeStyle='#526371';g.lineWidth=2
        for(let i=0;i<5;i++){
          const x=75+progress*770-i*23,y=211-55*progress+Math.abs(2-i)*10,wing=5*Math.sin(progress*44+i)
          g.beginPath();g.moveTo(x-8,y-wing);g.quadraticCurveTo(x-4,y-3,x,y+2);g.quadraticCurveTo(x+4,y-3,x+8,y-wing);g.stroke()
        }
      }else{
        const x=750-480*progress,y=58+150*progress,line=g.createLinearGradient(x,y,x+87,y-28)
        line.addColorStop(0,'#fff2cd');line.addColorStop(1,'rgba(191,215,250,0)')
        g.strokeStyle=line;g.lineWidth=2.5;g.beginPath();g.moveTo(x,y);g.lineTo(x+87,y-28);g.stroke()
      }
      g.globalAlpha=1
    }
    const glass=g.createLinearGradient(0,370,940,80)
    glass.addColorStop(0,'rgba(229,242,240,.06)');glass.addColorStop(.31,'rgba(243,248,239,.025)')
    glass.addColorStop(.34,'rgba(243,248,239,.085)');glass.addColorStop(.45,'rgba(243,248,239,.02)')
    glass.addColorStop(1,'rgba(237,247,251,.045)')
    g.fillStyle=glass;g.fillRect(0,0,W,H)
    return true
  }}
}
