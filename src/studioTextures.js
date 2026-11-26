import { profile } from './studioObjects'

export function drawScreen (g) {
  g.fillStyle = '#14252c'
  g.fillRect(0,0,1024,440)
  g.fillStyle = '#243943'
  g.fillRect(0,0,1024,48)
  for (const [i,color] of ['#ef9a83','#e3c584','#88c5ab'].entries()) {
    g.fillStyle=color
    g.beginPath(); g.arc(18+19*i,24,5,0,2*Math.PI); g.fill()
  }
  g.font='bold 20px monospace'
  g.fillStyle='#c0d5cd'
  g.fillText('chart.ts',88,32)
  g.fillText('KLineChart',550,32)
  g.fillText('↗',990,32)
  const lines=[
    ['import ', '{ init }', " from 'klinecharts'"],
    ['const ', 'chart', " = init('app')"],
    [], ['const ', 'data', ' = ['],
    ['  { ', 'open: ', '128,'],
    ['    ', 'high: ', '142,'],
    ['    ', 'low:  ', '122,'],
    ['    ', 'close:', ' 138 }'],
    [']'], ['chart.', 'applyNewData', '(data)']
  ]
  g.font='19px monospace'
  lines.forEach((parts,i)=>{
    const y=85+i*33
    g.fillStyle='#73918e';g.fillText(String(i+1).padStart(2,'0'),12,y)
    let x=53
    parts.forEach((part,k)=>{
      g.fillStyle=['#d8a2ab','#93d7c1','#dfc091'][k]
      g.fillText(part,x,y);x+=g.measureText(part).width
    })
  })
  g.fillStyle='#27414a';g.fillRect(524,48,2,392)
  for(let i=0;i<7;i++)g.fillRect(545,83+i*47,456,1)
  for(let i=0;i<10;i++)g.fillRect(551+i*48,66,1,340)
  let last=286
  for(let i=0;i<27;i++){
    const close=284-i*6+Math.sin(i*.64)*31+Math.cos(i*1.86)*17
    const x=552+i*16.8
    g.fillStyle=close<last?'#78d4b3':'#ec927e'
    g.fillRect(x+4,Math.min(last,close)-10,2,Math.abs(last-close)+21)
    g.fillRect(x,Math.min(last,close),10,Math.max(4,Math.abs(last-close)))
    const h=8+Math.abs(close-last)*.78
    g.globalAlpha=.65;g.fillRect(x,400-h,10,h);g.globalAlpha=1
    last=close
  }
}

function ease(from,to,value) {
  const t=Math.max(0,Math.min(1,(value-from)/(to-from)))
  return t*t*(3-2*t)
}

function blendColor(a,b,t) {
  const channels=a.map((v,i)=>Math.round(v+(b[i]-v)*t))
  return 'rgb('+channels.join(',')+')'
}

// The buildings are painted last, so they occlude both bodies at the horizon.
export function createWindowSky () {
  const canvas=document.createElement('canvas')
  canvas.width=470
  canvas.height=320
  const g=canvas.getContext('2d')
  g.scale(.5,.5)
  const day=[[113,183,217],[190,227,237],[250,229,189]]
  const dusk=[[112,128,177],[232,158,146],[255,204,143]]
  const night=[[16,25,54],[52,70,116],[114,94,131]]
  const buildingsDay=[[173,195,203],[134,159,169],[97,130,140]]
  const buildingsNight=[[64,82,117],[42,62,88],[24,45,64]]
  let previous=-1

  function disc(x,y,r,color) {
    g.fillStyle=color
    g.beginPath()
    g.arc(x,y,r,0,Math.PI*2)
    g.fill()
  }
  function paint(phase) {
    if(phase===previous)return false
    previous=phase
    const setting=ease(0,.56,phase)
    const rising=ease(.46,1,phase)
    const sky=g.createLinearGradient(0,0,0,640)
    for(const [i,stop] of [0,.65,1].entries()){
      const color=phase<.48 ? blendColor(day[i],dusk[i],ease(0,.48,phase))
        : blendColor(dusk[i],night[i],ease(.48,1,phase))
      sky.addColorStop(stop,color)
    }
    g.fillStyle=sky
    g.fillRect(0,0,940,640)
    g.globalAlpha=ease(.54,.92,phase)
    for(let i=0;i<80;i++){
      const x=(i*193+Math.sin(i)*73+940)%940, y=(i*117+Math.cos(i)*31+320)%320
      disc(x,y,i%5===0?2.3:1.3,i%3?'#b9cde2':'#f9e6bf')
    }
    g.globalAlpha=1
    const sunX=660+142*setting
    const sunY=165+330*setting-26*Math.sin(Math.PI*setting)
    const halo=g.createRadialGradient(sunX,sunY,38,sunX,sunY,155)
    halo.addColorStop(0,'rgba(255,203,130,.28)')
    halo.addColorStop(1,'rgba(255,196,119,0)')
    g.globalAlpha=1-ease(.37,.56,phase)
    disc(sunX,sunY,155,halo)
    disc(sunX,sunY,56,blendColor([255,242,186],[255,174,106],setting))
    const moonX=498+142*rising, moonY=487-341*rising-22*Math.sin(Math.PI*rising)
    g.globalAlpha=ease(.46,.74,phase)
    disc(moonX,moonY,48,'#fff2ca')
    for(const [x,y,r] of [[-13,-18,6],[13,12,8],[-18,14,4]])disc(moonX+x,moonY+y,r,'#e3d9b6')
    g.globalAlpha=1-ease(.18,.71,phase)
    g.fillStyle='#f4faf6dc'
    for(const [x,y] of [[115,140],[420,84],[797,248]]){
      g.beginPath();g.ellipse(x+20*phase,y,60,12,0,0,2*Math.PI)
      g.ellipse(x-12+20*phase,y-7,25,15,0,0,2*Math.PI);g.fill()
    }
    g.globalAlpha=1
    for(let layer=0;layer<3;layer++){
      const gap=50+22*layer
      const facade=blendColor(buildingsDay[layer],buildingsNight[layer],ease(.16,.93,phase))
      for(let i=0;i*gap-25<940;i++){
        const y=365+layer*70+Math.sin(i*2.07+layer)*44+Math.cos(i*1.6)*32
        g.fillStyle=facade;g.fillRect(i*gap-25,y,gap-3,640-y)
        const lights=ease(.45+(i%4)*.06,.96,phase)
        g.fillStyle=blendColor([196,214,211],i%3?[242,200,129]:[166,202,215],lights)
        for(let row=0;row<5;row++)for(let col=0;col<3;col++)if((row+col+i)%3===0)g.fillRect(i*gap-15+col*15,y+17+row*24,7,10)
      }
    }
    return true
  }
  return {canvas,paint}
}

export function makeAtlas () {
  const atlas=document.createElement('canvas')
  atlas.width=atlas.height=2048
  const g=atlas.getContext('2d')
  drawScreen(g)
  // Static surfaces stay resident while the window texture changes.
  function region (x,y,w,h,draw) {
    g.save();g.translate(x,y);g.beginPath();g.rect(0,0,w,h);g.clip();draw();g.restore()
  }
  region(0,700,1000,760,()=>{
    g.fillStyle='#b98a64';g.fillRect(0,0,1000,760)
    for(let i=0;i<12;i++){
      const y=i*64
      g.fillStyle=['#cfa67e','#d9b18a','#d3aa83','#deba94'][i%4];g.fillRect(0,y+2,1000,61)
      g.fillStyle='#b58d6b'
      for(let j=0;j<3;j++)g.fillRect((i%3)*110+j*370,y+2,2,61)
      g.strokeStyle='#bd946d66';g.lineWidth=1
      for(let k=0;k<4;k++){
        const x=(i*131+k*223)%850;g.beginPath();g.moveTo(x,y+9+k*13);g.bezierCurveTo(x+55,y+3+k*13,x+78,y+16+k*13,x+145,y+9+k*13);g.stroke()
      }
    }
    function shade(x,y,rx,ry,alpha) {
      g.save();g.translate(x,y);g.scale(rx,ry)
      const grad=g.createRadialGradient(0,0,.01,0,0,1)
      grad.addColorStop(0,'rgba(59,39,31,'+alpha+')');grad.addColorStop(1,'rgba(59,39,31,0)')
      g.fillStyle=grad;g.fillRect(-1,-1,2,2);g.restore()
    }
    shade(505,190,500,260,.34);shade(385,505,124,115,.38);shade(884,606,88,63,.42)
    for(const [x,y] of [[167,99],[167,326],[810,188]])shade(x,y,75,45,.34)
  })
  region(1100,700,500,550,()=>{
    g.fillStyle='#f7deb0';g.fillRect(0,0,500,550)
    g.fillStyle='#d88b57';g.beginPath();g.arc(351,162,67,0,2*Math.PI);g.fill()
    for(const [i,col] of ['#8dae98','#55877e','#375e60'].entries()){
      g.fillStyle=col;g.beginPath();g.moveTo(0,550)
      for(let x=0;x<=500;x+=6)g.lineTo(x,275+i*82+63*Math.sin(x*.010+i*1.3))
      g.lineTo(500,550);g.fill()
    }
  })
  region(1060,1490,900,395,()=>{
    g.fillStyle='#f6e9cd';g.fillRect(0,0,900,395)
    g.fillStyle='#34554a';g.fillRect(0,0,16,395)
    g.font='132px sans-serif';g.fillText(profile.name,58,148)
    g.font='50px sans-serif';g.fillText(profile.role,58,223)
    g.font='46px sans-serif';g.fillText('KLineChart 作者',58,286)
    g.font='36px monospace';g.fillText(profile.email,58,357)
    g.font='60px sans-serif';g.fillText('↗',793,88)
  })
  return atlas
}
