import { keyboardKeys } from './keyboardLayout'
import { lampBase } from './taskLamp'
import { drinkSurface, profile } from './studioObjects'

const setup=`import { init } from 'klinecharts'
import candles from './candles.json'

const host = document.getElementById(
  'chart'
)
const ticker = host?.dataset.ticker
if (!ticker) throw Error('Missing ticker')

const chart = init('chart')
if (!chart) throw Error('Missing chart')`

const chartSteps=[
  `chart.setSymbol({
  ticker,
  pricePrecision: 2,
  volumePrecision: 3
})`,
  `chart.setPeriod({
  type: 'minute', span: 15
})`,
  `chart.setDataLoader({
  getBars: ({ callback }) => {
    callback(candles, false)
  }
})`,
  `chart.createIndicator({
  name: 'MA', calcParams: [5],
  paneId: 'candle_pane'
}, true)`,
  "chart.createIndicator('VOL')"
]
const editorSource=[setup,...chartSteps].join('\n\n')
const completedAt=chartSteps.map(step=>editorSource.indexOf(step)+step.length)
export function chartStage(count){
  return completedAt.filter(end=>count>=end).length
}
const firstTypedCharacter=editorSource.indexOf('chart.setSymbol')
const strokes=[]
let elapsed=200
const shifted={'_':'-','(':'9',')':'0','{':'[','}':']',':':';','>':'.','?':'/','!':'1','"':"'",' ':'','\n':'Enter'}
for(const character of editorSource.slice(firstTypedCharacter)){
  const label=shifted[character]??character.toUpperCase()
  const left='12345QWERTASDFGZXCVB'.includes(label) && label!==''
  const side=left?-1:1
  const columns=left?['45RTFGVB','3EDC','2WSX']:['67YUHJNM','8IK,','9OL.']
  const column=columns.findIndex(group=>label.length===1 && group.includes(label))
  const finger=character===' '?4:column<0?3:column
  const previous=strokes.at(-1)
  const variation=(strokes.length*73+character.charCodeAt(0)*11)%62
  elapsed+=105+variation+(previous?.side===side?54:0)+(previous?.finger===finger?25:0)
  if(previous?.label==='Enter')elapsed+=210
  if(character==='\n' && previous?.label==='Enter')elapsed+=370
  strokes.push({time:elapsed,label,side,finger})
}

export function typingFrame(time){
  const phase=time%(elapsed+2300)
  let next=strokes.findIndex(stroke=>stroke.time>phase)
  if(next===-1)next=strokes.length
  const nearby=[]
  for(let i=next-1;i>=0 && phase-strokes[i].time<320;i--)nearby.unshift(strokes[i])
  for(let i=next;i<strokes.length && strokes[i].time-phase<320;i++)nearby.push(strokes[i])
  return {count:firstTypedCharacter+next,phase,nearby}
}

function screenBrush(g){
  const rect=(x,y,w,h,color)=>{
    g.fillStyle=color
    g.fillRect(x,y,w,h)
  }
  const label=(value,x,y,size,color,mono=false)=>{
    g.font=size+'px '+(mono?'Menlo, Consolas, monospace':'-apple-system, BlinkMacSystemFont, sans-serif')
    g.fillStyle=color
    g.fillText(value,x,y)
  }
  return {rect,label}
}

export function drawEditorCode(g,count){
  const {rect,label}=screenBrush(g)
  const lines=editorSource.slice(0,count).split('\n')
  // Wrap at token boundaries so the larger type fits beside the live chart.
  const rows=[]
  g.font='17px Menlo, Consolas, monospace'
  for(const [index,line] of lines.entries()){
    let row={number:index+1,tokens:[],width:0}
    rows.push(row)
    for(const token of line.match(/'[^']*'?|\w+|[^\w']/g)||[]){
      const width=g.measureText(token).width
      if(row.width+width>296 && row.tokens.length){
        row={number:null,tokens:[],width:0}
        rows.push(row)
      }
      row.tokens.push({token,width})
      row.width+=width
    }
  }
  const visible=rows.slice(-12)
  rect(128,85,337,329,'#1e1e1e')
  rect(128,85+(visible.length-1)*27,337,26,'#282828')
  visible.forEach(({number,tokens},row)=>{
    const y=105+row*27
    if(number)label(String(number),131,y,13,'#a5abb0',true)
    let x=160
    for(const {token,width} of tokens){
      const color=token.startsWith("'")?'#e0aa8e':/^(import|from|const|if|throw|true|false)$/.test(token)?'#dfaad9':
        /^(init|Error|setSymbol|setPeriod|setDataLoader|callback|createIndicator)$/.test(token)?'#ece5ad':
        /^\d+$/.test(token)?'#c8deb8':'#b2dfff'
      label(token,x,y,17,color,true)
      x+=width
    }
    if(row===visible.length-1)rect(x+1,y-14,2,18,'#eeeeee')
  })

  rect(190,418,275,22,'#007acc')
  label('Ln '+lines.length+', Col '+(lines.at(-1).length+1)+'    UTF-8    TypeScript',208,433,11,'#ffffff',true)
}

export function drawScreen (g) {
  g.save()
  const {rect,label}=screenBrush(g)
  rect(0,0,1024,440,'#20252e')
  rect(0,0,1024,30,'#333943')
  for(const [i,color] of ['#f07872','#ecc16c','#89bd8c'].entries()){
    g.fillStyle=color
    g.beginPath();g.arc(15+15*i,15,4,0,2*Math.PI);g.fill()
  }
  g.textAlign='center'
  label('KLineChart',512,20,13,'#d7dce1')
  g.textAlign='left'
  // The left split uses the compact layout of VS Code's Dark+ theme.
  rect(0,31,465,387,'#1e1e1e')
  rect(0,31,29,387,'#333333')
  rect(29,31,98,387,'#252526')
  rect(0,33,2,29,'#ffffff')
  function activityIcon(y,path,color){
    g.save()
    g.translate(5,y)
    g.strokeStyle=color
    g.lineWidth=1.4
    g.lineJoin='round'
    g.stroke(new Path2D(path))
    g.restore()
  }
  activityIcon(39,'M3 1 H11 L15 5 V16 H3 Z M11 1 V5 H15 M6 18 H18 V7','#ffffff')
  activityIcon(76,'M14 7 A6 6 0 1 1 2 7 A6 6 0 1 1 14 7 M12 12 L18 18','#b0b0b0')
  activityIcon(114,'M5 5 V15 M5 12 Q14 12 14 6 M7 3 A2 2 0 1 1 3 3 A2 2 0 1 1 7 3 M7 17 A2 2 0 1 1 3 17 A2 2 0 1 1 7 17 M16 4 A2 2 0 1 1 12 4 A2 2 0 1 1 16 4','#b0b0b0')
  activityIcon(151,'M2 2 H8 V8 H2 Z M2 11 H8 V17 H2 Z M11 11 H17 V17 H11 Z M10 4 L14 0 L18 4 L14 8 Z','#b0b0b0')
  label('EXPLORER',36,50,10,'#c4c4c4')
  label('⌄  WORKSPACE',34,75,10,'#dedede')
  label('⌄  src',41,96,12,'#d0d0d0')
  rect(29,103,98,20,'#37373d')
  label('TS',44,117,10,'#55b6ed',true)
  label('chart.ts',63,117,12,'#eeeeee')
  label('{}',44,138,11,'#d5b968',true)
  label('candles.json',62,138,11,'#cccccc')
  label('◇',38,159,12,'#db975c')
  label('index.html',53,159,12,'#cccccc')
  rect(128,31,337,28,'#252526')
  rect(128,31,107,28,'#1e1e1e')
  rect(128,31,107,2,'#3794ff')
  label('TS',139,50,12,'#55b6ed',true)
  label('chart.ts',161,50,13,'#eeeeee')
  label('×',219,50,14,'#bbbbbb')
  label('src  ›  chart.ts',139,77,11,'#b2b2b2')
  drawChartPreview(g,chartSteps.length)
  rect(0,418,1024,22,'#303b48')
  rect(0,418,465,22,'#007acc')
  label('⑂ main',10,433,12,'#ffffff',true)
  drawEditorCode(g,editorSource.length)
  g.restore()
}

export function drawChartPreview(g,stage,time=0){
  const {rect,label}=screenBrush(g)
  const up='#168476',down='#be5558',ink='#283742',muted='#596a77'
  rect(465,31,559,387,'#eef2f3')
  rect(465,31,559,31,'#dbe3e6')
  label('图表预览',481,53,16,ink)
  if(stage>=2)label('15 分钟 K 线',481,86,17,ink)
  if(stage<3){
    const angle=time*Math.PI*2/1000
    g.save()
    g.lineWidth=3
    g.lineCap='round'
    g.strokeStyle='#cbd6d9'
    g.beginPath()
    g.arc(744.5,240,12,0,Math.PI*2)
    g.stroke()
    g.strokeStyle=up
    g.beginPath()
    g.arc(744.5,240,12,angle,angle+Math.PI*.75)
    g.stroke()
    g.restore()
    return
  }
  // A repeatable demo session, with OHLC, average and volume sharing the same bars.
  let seed=7919
  const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296)
  const bars=[]
  let price=186.34
  for(let i=0;i<60;i++){
    const open=price
    price=open+.12+.35*Math.sin(i*.22)+(random()-.49)*1.65
    bars.push({open,close:price,high:Math.max(open,price)+.14+.75*random(),
      low:Math.min(open,price)-.12-.68*random(),volume:10+random()*16+Math.abs(price-open)*19})
  }
  const left=481,right=961,top=112,bottom=stage===5?311:380,step=(right-left)/bars.length
  const low=Math.floor(Math.min(...bars.map(b=>b.low))/2)*2
  const high=Math.ceil(Math.max(...bars.map(b=>b.high))/2)*2
  const py=value=>bottom-(value-low)/(high-low)*(bottom-top)
  const px=i=>left+(i+.5)*step
  const last=bars.at(-1)
  label(['O','H','L','C'].map((key,i)=>key+' '+[last.open,last.high,last.low,last.close][i].toFixed(2)).join('   '),481,105,11,muted,true)
  for(let i=0;i<=4;i++){
    const value=low+(high-low)*i/4
    rect(left,py(value),right-left,1,'#d3dbdf')
    label(value.toFixed(2),964,py(value)+5,14,muted,true)
  }
  for(let i=0;i<bars.length;i+=12){
    rect(px(i),top,1,273,'#dae1e4')
    label(String(8+i/4).padStart(2,'0')+':00',Math.max(left,px(i)-15),405,14,muted,true)
  }
  const maxVolume=Math.max(...bars.map(b=>b.volume))
  bars.forEach((bar,i)=>{
    const color=bar.close>=bar.open?up:down
    rect(px(i)-1,py(bar.high),2,py(bar.low)-py(bar.high),color)
    rect(px(i)-2.6,py(Math.max(bar.open,bar.close)),5.2,Math.max(1.5,Math.abs(py(bar.open)-py(bar.close))),color)
    const height=bar.volume/maxVolume*40
    if(stage===5)rect(px(i)-2.6,385-height,5.2,height,color)
  })
  if(stage<4)return
  g.beginPath()
  for(let i=4;i<bars.length;i++){
    const average=bars.slice(i-4,i+1).reduce((sum,b)=>sum+b.close,0)/5
    if(i===4)g.moveTo(px(i),py(average))
    else g.lineTo(px(i),py(average))
  }
  g.strokeStyle='#bb8439';g.lineWidth=1.6;g.stroke()
  label('MA 5',right-37,86,11,'#986723',true)
  if(stage<5)return
  rect(468,322,556,1,'#ccd5d9')
  label('VOL',left,339,11,muted,true)
}

export { createWindowSky } from './windowView'

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
  })
  // The woven mat and its inset seam share the rounded top face.
  region(1080,710,896,287,()=>{
    g.fillStyle='#4d5d61';g.fillRect(0,0,896,287)
    g.strokeStyle='#d9d7c519';g.lineWidth=1
    g.beginPath()
    for(let x=-288;x<896;x+=5){g.moveTo(x,0);g.lineTo(x+287,287)}
    g.stroke()
    g.strokeStyle='#17262828'
    g.beginPath()
    for(let x=0;x<1184;x+=6){g.moveTo(x,0);g.lineTo(x-287,287)}
    g.stroke()
    g.strokeStyle='#a4aca1';g.lineWidth=1.6;g.setLineDash([4,4])
    g.beginPath();g.roundRect(6,6,884,275,23);g.stroke()
  })
  region(0,1480,1000,480,()=>{
    g.fillStyle='#bd895f';g.fillRect(0,0,1000,480)
    // Long, irregular grain and low contact shadows in tabletop coordinates.
    for(let i=0;i<185;i++){
      const y=i*2.65, x=(i*137)%1160-230
      g.strokeStyle=i%4?'rgba(105,67,44,.11)':'rgba(246,201,147,.22)'
      g.lineWidth=i%3===0?1.25:.65
      g.beginPath();g.moveTo(x,y)
      g.bezierCurveTo(x+115,y-9*Math.sin(i*.11),x+209,y+12*Math.cos(i*.12),x+325+i%190,y+2)
      g.stroke()
    }
    for(const [x,y,rx,ry] of [[485,130,150,67],[(lampBase[0]+2.20)/4.64*1000,(lampBase[2]+1.80)/1.64*480,55,58],[(drinkSurface[0]+2.20)/4.64*1000,(drinkSurface[2]+1.80)/1.64*480,47,42],[903,90,80,30],[492,360,307,87]]){
      g.save();g.translate(x,y);g.scale(rx,ry)
      const shadow=g.createRadialGradient(0,0,.06,0,0,1)
      shadow.addColorStop(0,'#46342577');shadow.addColorStop(1,'#46342500')
      g.fillStyle=shadow;g.fillRect(-1,-1,2,2);g.restore()
    }
  })
  for(const {label,width,color,atlasX,atlasY} of keyboardKeys){
    const w=width*48
    g.fillStyle=color
    g.fillRect(atlasX,atlasY,w,34)
    g.fillStyle='#39413e'
    g.font=(label.length>2?'bold 14px':'bold 20px')+' monospace'
    g.fillText(label,atlasX+5,atlasY+23,w-10)
  }
  region(1060,1490,900,240,()=>{
    const maple=g.createLinearGradient(0,0,0,240)
    maple.addColorStop(0,'#e2bd91');maple.addColorStop(1,'#cfa478')
    g.fillStyle=maple;g.fillRect(0,0,900,240)
    for(let i=0;i<50;i++){
      const y=i*5,x=(i*137)%1040-180
      g.strokeStyle=i%3?'#986a451c':'#fff3d42b'
      g.beginPath();g.moveTo(x,y)
      g.bezierCurveTo(x+110,y-6,x+245,y+7*Math.sin(i),x+410,y+2)
      g.stroke()
    }
    g.textAlign='center';g.font='600 118px "Helvetica Neue", sans-serif'
    g.fillStyle='#edcb9e';g.fillText(profile.name,450,115)
    g.fillStyle='#493423';g.fillText(profile.name,450,113)
    g.font='500 80px "Helvetica Neue", sans-serif'
    g.fillText(profile.email,450,205,844)
  })
  return atlas
}
