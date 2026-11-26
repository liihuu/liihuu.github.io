import React, { useEffect, useRef, useState } from 'react'
import { diffuserRadius, lampAxis, lampLight, lampSwitch } from './taskLamp'
import { drinkSurface, studioModel } from './studioModel'
import { createWindowSky, chartStage, drawChartPreview, drawEditorCode, makeAtlas, typedCharacters } from './studioTextures'

import { pickPart, playContact, movePart } from './studioFeedback'
import ThemeSwitcher from './ThemeSwitcher'
import { applyTheme, getStoredTheme } from './themes'
import { objects, profile } from './studioObjects'
import qrcode from './assets/qrcode.png'

const interactiveFaces=[['contact',objects.contact],['lampSwitch',{...lampSwitch,label:'台灯电源开关'}]]
const HOME = { yaw: .48, pitch: .28 }
const centre = [.05,1.85,-.46]
const clamp = (v,min,max) => Math.min(max,Math.max(min,v))
const vertexSource = `
  attribute vec3 position, normal, color;
  attribute vec2 uv;
  attribute float motion;
  uniform mat3 camera;
  uniform vec2 scale;
  uniform float time;
  varying vec3 world;
  varying vec3 tint;
  varying vec3 surfaceNormal;
  varying vec2 texcoord;
  void main() {
    vec3 p = position;
    p.y += abs(motion)*.038*sin(time*8.+motion*1.85);
    world = p;
    vec3 v = camera * (p-vec3(${centre.join(',')}));
    gl_Position = vec4(v.xy*scale, -v.z/12., 1.);
    float light = .76 + .28*max(dot(normal,normalize(vec3(-.56,.83,.68))),0.);
    surfaceNormal=normal;
    tint = color*light;
    texcoord = uv;
  }`
const fragmentSource = `
  precision mediump float;
  uniform sampler2D atlas;
  uniform sampler2D sky;
  uniform sampler2D editor;
  uniform float night;
  uniform float lampPower;
  varying vec3 world;
  varying vec3 tint;
  varying vec3 surfaceNormal;
  varying vec2 texcoord;
  void main() {
    bool outside = texcoord.x > .52 && texcoord.y >= 0. && texcoord.y < .32;
    bool screen = texcoord.x >= 0. && texcoord.x < .51 && texcoord.y < .22;
    vec3 base = texcoord.x < 0. ? tint : texture2D(atlas,texcoord).rgb;
    if(outside) {
      vec2 uv=(texcoord*2048.-vec2(1080.,0.))/vec2(940.,640.);
      gl_FragColor=texture2D(sky,uv);
      return;
    }
    if(screen) {
      base=texture2D(editor,texcoord*vec2(2.,4.)).rgb;
      gl_FragColor=vec4(base*(1.+.16*night),1.);
      return;
    }
    // Trace sunlight back to the opening and its two wooden crossbars.
    float travel = world.x+2.84;
    vec2 sash = vec2(world.z+.32*travel, world.y+.48*travel);
    vec2 aperture = smoothstep(vec2(-1.34,1.18),vec2(-1.20,1.30),sash) *
      (1.-smoothstep(vec2(1.05,2.80),vec2(1.18,2.92),sash));
    float sun = aperture.x*aperture.y*smoothstep(.015,.09,abs(sash.x+.08))*
      smoothstep(.015,.09,abs(sash.y-2.24))*smoothstep(.0,.12,travel);
    vec3 daylight = base*(vec3(.96,.98,1.)+sun*vec3(.31,.21,.085));
    float wall = 1.-smoothstep(.05,.25,abs(world.z+2.21));
    vec2 shadow=(world.xy-vec2(.14,1.92))/vec2(1.65,.82);
    daylight *= 1.-.24*wall*exp(-dot(shadow,shadow));

    // Warm task light falls onto the desk; the monitor casts a wide, cool fill.
    vec3 lamp = world-vec3(${lampLight.join(',')});
    vec3 direction=vec3(${lampAxis.join(',')});
    float axial=dot(lamp,direction);
    vec3 radial=lamp-axial*direction;
    float spread=.19+.78*max(axial,0.);
    float beam=exp(-dot(radial,radial)/(spread*spread))*
      smoothstep(-.13,.0,axial)/(1.+.48*axial*axial);
    float bounce=1./(1.+2.7*dot(lamp,lamp));
    vec3 monitor=(world-vec3(.05,2.12,-1.25))*vec3(.69,.94,.72);
    float glow=1./(1.+1.4*dot(monitor,monitor));
    vec3 moon=(world-vec3(-2.84,2.12,-.08))*vec3(.64,.66,.54);
    float moonlight=.65/(1.+dot(moon,moon));
    vec3 lamplight=base*(vec3(.19,.25,.38)+moonlight*vec3(.19,.29,.48)+
      lampPower*(beam+.60*bounce)*vec3(1.25,.80,.34)+glow*vec3(.31,.57,.63));
    bool bulb=length(radial)<${diffuserRadius} && abs(axial)<.002;
    if(bulb) lamplight=mix(base*.42,vec3(1.,.91,.63),lampPower);
    if(bulb) daylight=mix(base*.65,vec3(1.,.94,.76),lampPower);
    vec3 shaded=mix(daylight,lamplight,night);
    // A broad window reflection gives rounded, dark hardware a satin finish.
    vec3 n=surfaceNormal/max(length(surfaceNormal),.001);
    vec3 halfVector=normalize(vec3(-.65,.78,.48)+vec3(.42,.30,.86));
    float gloss=pow(max(dot(n,halfVector),0.),22.);
    float hardware=(1.-smoothstep(.20,.43,max(base.r,max(base.g,base.b))))*
      smoothstep(1.28,1.41,world.y);
    // Hair scatters the window light more broadly than the headphone shells.
    if(texcoord.x < -1.5) {
      shaded+=vec3(.040,.032,.028)*pow(max(dot(n,halfVector),0.),4.)*mix(1.,.4,night);
    } else {
      shaded+=vec3(.14,.16,.16)*gloss*hardware*mix(1.,.42,night);
    }
    gl_FragColor=vec4(shaded,1.);
  }`

function gpuRenderer (canvas, vertices, atlas) {
  const gl = canvas.getContext('webgl',{alpha:true, antialias:true})
  if (!gl) return null
  const program=gl.createProgram()
  for (const [type,source] of [[gl.VERTEX_SHADER,vertexSource],[gl.FRAGMENT_SHADER,fragmentSource]]) {
    const shader=gl.createShader(type)
    gl.shaderSource(shader,source);gl.compileShader(shader)
    gl.attachShader(program,shader);gl.deleteShader(shader)
  }
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program,gl.LINK_STATUS)) { gl.deleteProgram(program);return null }
  gl.useProgram(program)
  const buffer=gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer)
  gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW)
  for(const [name,size,offset] of [['position',3,0],['normal',3,3],['color',3,6],['uv',2,9],['motion',1,11]]) {
    const i=gl.getAttribLocation(program,name)
    gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,size,gl.FLOAT,false,48,offset*4)
  }
  const texture=gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D,texture)
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas)
  gl.generateMipmap(gl.TEXTURE_2D)
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR)
  const windowSky=createWindowSky()
  const skyTexture=gl.createTexture()
  gl.activeTexture(gl.TEXTURE1)
  gl.bindTexture(gl.TEXTURE_2D,skyTexture)
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,windowSky.canvas.width,windowSky.canvas.height,0,gl.RGBA,gl.UNSIGNED_BYTE,null)
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)
  gl.uniform1i(gl.getUniformLocation(program,'sky'),1)
  const editorTexture=gl.createTexture()
  gl.activeTexture(gl.TEXTURE2)
  gl.bindTexture(gl.TEXTURE_2D,editorTexture)
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1024,512,0,gl.RGBA,gl.UNSIGNED_BYTE,null)
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR)
  gl.uniform1i(gl.getUniformLocation(program,'editor'),2)
  gl.activeTexture(gl.TEXTURE1)
  gl.enable(gl.DEPTH_TEST)
  const uniforms=Object.fromEntries(['camera','scale','time','night','lampPower'].map(k=>[k,gl.getUniformLocation(program,k)]))
  return {
    update(start,data){gl.bufferSubData(gl.ARRAY_BUFFER,start*4,data)},
    draw (matrix,sx,sy,time,night,editor,lampPower) {
      if(editor){
        gl.activeTexture(gl.TEXTURE2)
        gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,editor)
        gl.activeTexture(gl.TEXTURE1)
      }
      if(windowSky.paint(night))gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,windowSky.canvas)
      gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT)
      gl.uniformMatrix3fv(uniforms.camera,false,matrix)
      gl.uniform2f(uniforms.scale,sx,sy);gl.uniform1f(uniforms.time,time);gl.uniform1f(uniforms.night,night)
      gl.uniform1f(uniforms.lampPower,lampPower)
      gl.drawArrays(gl.TRIANGLES,0,vertices.length/12)
    },
    dispose () { gl.deleteBuffer(buffer);gl.deleteTexture(texture);gl.deleteTexture(skyTexture);gl.deleteTexture(editorTexture);gl.deleteProgram(program) }
  }
}

// A static software rendering of the same mesh keeps the room available on
// devices without WebGL. Its depth buffer also preserves the screen texture.
function softwareRenderer (canvas, vertices, atlas) {
  const ctx=canvas.getContext('2d')
  const pixels=atlas.getContext('2d').getImageData(0,0,atlas.width,atlas.height).data
  const sky=createWindowSky()
  let editorPixels,skyPixels
  return function draw(matrix,sx,sy,time,night,editor,lampPower) {
    if(editor)editorPixels=editor.getContext('2d').getImageData(0,0,1024,440).data
    if(sky.paint(night))skyPixels=sky.canvas.getContext('2d').getImageData(0,0,sky.canvas.width,sky.canvas.height).data
    const w=canvas.width,h=canvas.height
    const image=ctx.createImageData(w,h), depth=new Float32Array(w*h).fill(-Infinity)
    function project(i) {
      const x=vertices[i]-centre[0],y=vertices[i+1]-centre[1],z=vertices[i+2]-centre[2]
      return [(1+sx*(matrix[0]*x+matrix[3]*y+matrix[6]*z))*w/2,
        (1-sy*(matrix[1]*x+matrix[4]*y+matrix[7]*z))*h/2,matrix[2]*x+matrix[5]*y+matrix[8]*z]
    }
    for(let i=0;i<vertices.length;i+=36) {
      const a=project(i),b=project(i+12),c=project(i+24)
      const bx=b[0]-a[0],by=b[1]-a[1],cx=c[0]-a[0],cy=c[1]-a[1], det=bx*cy-by*cx
      if(Math.abs(det)<.001)continue
      const light=.76+.28*Math.max(0,(-.56*vertices[i+3]+.83*vertices[i+4]+.68*vertices[i+5])/1.21)
      const fill=[6,7,8].map(k=>vertices[i+k]*light*255)
      const minX=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),maxX=Math.min(w-1,Math.ceil(Math.max(a[0],b[0],c[0])))
      const minY=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),maxY=Math.min(h-1,Math.ceil(Math.max(a[1],b[1],c[1])))
      for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
        const dx=x+.5-a[0],dy=y+.5-a[1],u=(dx*cy-dy*cx)/det,v=(bx*dy-by*dx)/det,t=1-u-v
        if(Math.min(u,v,t)<0)continue
        const k=y*w+x,z=t*a[2]+u*b[2]+v*c[2]
        if(z<=depth[k])continue
        depth[k]=z
        let source=fill,offset=0
        if(vertices[i+9]>=0){
          let tx=Math.floor(atlas.width*(t*vertices[i+9]+u*vertices[i+21]+v*vertices[i+33]))
          let ty=Math.floor(atlas.height*(t*vertices[i+10]+u*vertices[i+22]+v*vertices[i+34]))
          if(tx>=1080 && ty<640) {
            tx=clamp(Math.floor((tx-1080)/940*sky.canvas.width),0,sky.canvas.width-1)
            ty=clamp(Math.floor(ty/640*sky.canvas.height),0,sky.canvas.height-1)
            source=skyPixels;offset=4*(ty*sky.canvas.width+tx)
          }else if(tx<1024 && ty<440){
            source=editorPixels;offset=4*(ty*1024+tx)
          }else{
            source=pixels;offset=4*(ty*atlas.width+tx)
          }
        }
        // Reconstruct world position from the orthographic depth, even on broad wall triangles.
        const vx=(2*(x+.5)/w-1)/sx, vy=(1-2*(y+.5)/h)/sy
        const wx=centre[0]+matrix[0]*vx+matrix[1]*vy+matrix[2]*z
        const wy=centre[1]+matrix[3]*vx+matrix[4]*vy+matrix[5]*z
        const wz=centre[2]+matrix[6]*vx+matrix[7]*vy+matrix[8]*z
        let r=1,g=1,b=1
        const litSurface=vertices[i+9]<0 || vertices[i+10]>.32
        if(litSurface){
          const travel=wx+2.84, sz=wz+.32*travel, hy=wy+.48*travel
          if(travel>0 && sz>-1.34 && sz<1.18 && hy>1.18 && hy<2.92 && Math.abs(sz+.08)>.05 && Math.abs(hy-2.24)>.05){
            r=1.27;g=1.19;b=1.085
          }
        }
        if(litSurface && night){
          const lx=wx-lampLight[0],ly=wy-lampLight[1],lz=wz-lampLight[2]
          const axial=lx*lampAxis[0]+ly*lampAxis[1]+lz*lampAxis[2]
          const radialSq=Math.max(0,lx*lx+ly*ly+lz*lz-axial*axial)
          const spread=.19+.78*Math.max(axial,0)
          const beam=Math.exp(-radialSq/(spread*spread))*clamp(1+axial/.13,0,1)/(1+.48*axial*axial)
          const warm=lampPower*(beam+.6/(1+2.7*(lx*lx+ly*ly+lz*lz)))
          const cool=1/(1+1.4*((.69*(wx-.05))**2+(.94*(wy-2.12))**2+(.72*(wz+1.25))**2))
          const moon=.65/(1+(.64*(wx+2.84))**2+(.66*(wy-2.12))**2+(.54*(wz+.08))**2)
          r+=(.19+.19*moon+1.25*warm+.31*cool-r)*night
          g+=(.25+.29*moon+.80*warm+.57*cool-g)*night
          b+=(.38+.48*moon+.34*warm+.63*cool-b)*night
        }
        // The diffuser itself changes brightness even in a sunlit room.
        if(litSurface){
          const lx=wx-lampLight[0],ly=wy-lampLight[1],lz=wz-lampLight[2]
          const axial=lx*lampAxis[0]+ly*lampAxis[1]+lz*lampAxis[2]
          if(Math.abs(axial)<.002 && lx*lx+ly*ly+lz*lz<diffuserRadius**2){
            const level=lampPower?1:.40
            image.data.set([255*level,237*level,194*level,255],k*4)
            continue
          }
        }
        image.data[k*4]=source[offset]*r
        image.data[k*4+1]=source[offset+1]*g
        image.data[k*4+2]=source[offset+2]*b
        image.data[k*4+3]=255
      }
    }
    ctx.putImageData(image,0,0)
  }
}

// Transport vapour from a patch of warm liquid. Small moving eddies stretch
// the density left by earlier frames; the upper edge fades as the air mixes.
function createSteamPainter(canvas){
  const ctx=canvas.getContext('2d')
  const {width,height}=canvas
  const image=ctx.createImageData(width,height)
  let density=new Float32Array(width*height),next=density.slice()
  const surface=Math.round(height*.9)
  const hash=n=>{
    const v=Math.sin(n*127.1+71.9)*43758.5453
    return v-Math.floor(v)
  }
  let tick=0,previous=null,remainder=0
  function step(){
    const seconds=++tick/24
    const vortices=[]
    const birth=Math.floor(seconds/.86)
    for(let n=birth-4;n<=birth;n++){
      const age=seconds-n*.86
      vortices.push({
        x:width*.5+(hash(n)-.5)*19+age*2,
        y:surface-4-age*(14+5*hash(n+9)),
        spin:(n%2===0?1:-1)*1.15, radius:8+age*2
      })
    }
    const sourceX=width*.5+4*Math.sin(seconds*1.1)+2*Math.sin(seconds*2.3)
    for(let y=1;y<surface;y++){
      const h=(surface-y)/surface
      for(let x=1;x<width-1;x++){
        let vx=1.1+3*h,vy=-16-7*h
        for(const eddy of vortices){
          const dx=x-eddy.x,dy=y-eddy.y
          const r2=(dx*dx+dy*dy)/(eddy.radius*eddy.radius)
          if(r2>=4)continue
          const swirl=eddy.spin*(1-r2/4)**3
          vx-=dy*swirl
          vy+=dx*swirl
        }
        const px=clamp(x-vx/24,0,width-1.001),py=clamp(y-vy/24,0,height-1.001)
        const ix=Math.floor(px),iy=Math.floor(py),u=px-ix,v=py-iy
        const k=iy*width+ix
        const above=density[k]*(1-u)+density[k+1]*u
        const below=density[k+width]*(1-u)+density[k+width+1]*u
        let amount=(above*(1-v)+below*v)*(.988-.025*h)
        if(y>=surface-4){
          const d=(x-sourceX)/7
          amount+=.17*Math.exp(-d*d)*(.72+.28*Math.sin(seconds*2.4+x*.19))
        }
        next[y*width+x]=amount
      }
    }
    const old=density;density=next;next=old
  }
  for(let i=0;i<64;i++)step()
  return time=>{
    if(previous!==null && time===previous)return
    remainder+=previous===null?0:clamp(time-previous,0,.25)
    previous=time
    while(remainder>=1/24){step();remainder-=1/24}
    for(let y=0;y<height;y++){
      const edge=clamp((surface-y)/6,0,1)*clamp(y/14,0,1)
      for(let x=0;x<width;x++){
        const i=y*width+x
        const opacity=1-Math.exp(-density[i]*1.9)
        image.data[4*i]=240
        image.data[4*i+1]=238
        image.data[4*i+2]=231
        image.data[4*i+3]=125*opacity*edge
      }
    }
    ctx.putImageData(image,0,0)
  }
}

export default function Studio () {
  const ref=useRef(null), fallback=useRef(null), dialog=useRef(null)
  const steam=useRef(null)
  const hitAreas=useRef({}), resetView=useRef(null)
  const activateObject=useRef(null)
  const [theme,setTheme]=useState(getStoredTheme)
  const changeLighting=useRef(null)
  function switchScene(next){
    applyTheme(next)
    setTheme(next)
    changeLighting.current?.(next==='dark'?1:0)
  }
  useEffect(()=>{
    const parts=[]
    const canvas=ref.current,model=studioModel(parts),atlas=makeAtlas()
    const gpu=gpuRenderer(canvas,model,atlas)
    const target=gpu?canvas:fallback.current
    const render=gpu?gpu.draw:softwareRenderer(target,model,atlas)

    const editor=document.createElement('canvas')
    editor.width=1024;editor.height=512
    const editorContext=editor.getContext('2d',{willReadFrequently:!gpu})
    editorContext.drawImage(atlas,0,0,1024,440,0,0,1024,440)
    const paintSteam=createSteamPainter(steam.current)
    const typingStart=performance.now()
    let previousCount=-1,previousStage=-1
    let night=getStoredTheme()==='dark'?1:0
    let startNight=night,targetNight=night,started=0
    changeLighting.current=next=>{
      startNight=night;targetNight=next;started=performance.now();refresh()
    }
    let {yaw,pitch}=HOME
    let drag,frame=0,visible=true,lastDraw=-100,dirty=true
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)')
    let view,audio,lampPower=1
    const active=new Map(),drawers=new Map()
    function activate(part){
      if(!part || part.kind==='project' || part.kind==='lamp')return
      if(part.kind==='chairBase')part=parts.find(p=>p.kind==='chair')
      const kind=part.kind
      const Audio=window.AudioContext || window.webkitAudioContext
      if(Audio){
        audio??=new Audio()
        if(audio.state==='suspended')audio.resume().catch(()=>{})
        playContact(audio,kind)
      }
      if(kind==='contact'){dialog.current.showModal();return}
      if(kind==='lampSwitch'){
        lampPower=1-lampPower
        hitAreas.current.lampSwitch.setAttribute('aria-pressed',String(Boolean(lampPower)))
      }
      if(kind==='pot')part=parts.find(p=>p.kind==='leaves')
      if(['key','mouse','lampSwitch','drawer','leaves','cup','chair','book'].includes(part.kind)){
        const prior=active.get(part)
        part.base??=model.slice(part.start,part.end)
        const from=prior?.value ?? drawers.get(part) ?? 0
        const to=part.kind==='drawer'?1-(drawers.get(part) || 0):0
        if(part.kind==='drawer')drawers.set(part,to)
        active.set(part,{start:performance.now(),from,to,value:from})
      }
      refresh()
    }
    activateObject.current=key=>activate(parts.find(part=>part.kind===key))
    function draw(now) {
      frame=0
      if(!visible || document.hidden)return
      if(dirty || now-lastDraw>=(gpu || active.size?40:220)){
        const ratio=gpu?Math.min(devicePixelRatio,1.75):Math.min(1,1080/canvas.clientWidth)
        const w=Math.round(canvas.clientWidth*ratio),h=Math.round(canvas.clientHeight*ratio)
        if(!w||!h)return
        if(target.width!==w||target.height!==h){target.width=w;target.height=h}
        const a=Math.cos(yaw),b=Math.sin(yaw),c=Math.cos(pitch),d=Math.sin(pitch)
        const matrix=[a,-b*d,b*c,0,c,d,-b,-a*d,a*c]
        const aspect=w/h
        const span=aspect<1.2 ? 5.55 : 6.7
        const size=Math.min(w/span,h/5.12)
        if(dirty){
          // Map each object face into CSS pixels using the same orthographic camera.
          const unit=size/ratio
          const [mx,my,mz]=drinkSurface.map((v,i)=>v-centre[i])
          const puffScale=unit*.00345
          const plume=steam.current.style
          plume.width=96*puffScale+'px'
          plume.height=160*puffScale*c+'px'
          plume.left=w/(2*ratio)+unit*(a*mx-b*mz)-48*puffScale+'px'
          plume.top=h/(2*ratio)-unit*(-b*d*mx+c*my-a*d*mz)-144*puffScale*c+'px'
          for(const [key,obj] of interactiveFaces){
            const rake=obj.rake || 0
            const node=hitAreas.current[key]
            const x=obj.x-obj.width/2-centre[0], y=obj.y+obj.height/2-centre[1], z=obj.z-obj.height*rake/2-centre[2]
            const left=w/(2*ratio)+unit*(a*x-b*z)
            const top=h/(2*ratio)-unit*(-b*d*x+c*y-a*d*z)
            node.style.width=obj.width*unit+'px'
            node.style.height=obj.height*unit+'px'
            node.style.transform='matrix('+[a,b*d,-b*rake,c+a*d*rake,left,top].join(',')+')'
          }
        }
        // A reversal traverses only the remaining part of the same sky path.
        const duration=1600*Math.abs(targetNight-startNight)
        const t=duration && !motion.matches ? clamp((now-started)/duration,0,1) : 1
        night=t===1 ? targetNight : startNight+(targetNight-startNight)*t
        const count=motion.matches?Infinity:typedCharacters(now-typingStart)
        const stage=chartStage(count)
        const chartChanged=stage!==previousStage || stage<3
        const codeChanged=count!==previousCount
        if(chartChanged)drawChartPreview(editorContext,stage,now-typingStart)
        if(codeChanged)drawEditorCode(editorContext,count)
        const changed=chartChanged || codeChanged
        previousStage=stage
        previousCount=count
        for(const [part,state] of active){
          const t=Math.max(0,(now-state.start)/1000)
          const mechanical=['key','mouse','lampSwitch'].includes(part.kind)
          const duration=mechanical?.22:part.kind==='drawer'?.36:1.1
          const progress=motion.matches?1:Math.min(t/duration,1)
          if(part.kind==='drawer'){
            state.value=state.from+(state.to-state.from)*progress*progress*(3-2*progress)
          }else if(progress===1){state.value=0}
          else if(part.kind==='cup'){
            state.value=state.from*Math.exp(-16*t)+.072*Math.abs(Math.sin(16*t))*Math.exp(-5*t)
          }
          else if(mechanical){state.value=Math.sin(Math.PI*progress)**.7}
          else{state.value=Math.sin(12*t)*Math.exp(-3.9*t)}
          if(part.kind==='cup')steam.current.style.transform='translateY('+(-state.value*c*size/ratio)+'px)'
          movePart(model,part,part.base,state.value)
          gpu?.update(part.start,model.subarray(part.start,part.end))
          if(progress===1)active.delete(part)
        }
        const time=motion.matches?0:now/1000
        view={matrix,centre,unit:size/ratio,width:w/ratio,height:h/ratio,time:gpu?time:0}
        render(matrix,2*size/w,2*size/h,time,night,changed?editor:null,lampPower)
        paintSteam(motion.matches?0:now/1000)
        lastDraw=now;dirty=false
      }
      if(!motion.matches)frame=requestAnimationFrame(draw)
    }
    function refresh(){dirty=true;if(!frame)frame=requestAnimationFrame(draw)}
    resetView.current=()=>{yaw=HOME.yaw;pitch=HOME.pitch;refresh()}
    const surface=canvas.parentElement
    let dragged=false
    function down(e){
      if(!e.isPrimary || e.button!==0 || !(e.target===canvas || e.target.closest('.object-hit')))return
      dragged=false
      drag=[e.clientX,e.clientY,yaw,pitch]
    }
    function move(e){
      if(!drag||!e.isPrimary)return
      if(!dragged && Math.hypot(e.clientX-drag[0],e.clientY-drag[1])<5)return
      dragged=true
      if(!surface.hasPointerCapture(e.pointerId))surface.setPointerCapture(e.pointerId)
      yaw=clamp(drag[2]+(e.clientX-drag[0])*.0035,.13,.76)
      pitch=clamp(drag[3]+(e.clientY-drag[1])*.003,.14,.43)
      refresh()
    }
    function release(){drag=null}
    function preventDragClick(e){
      if(dragged && e.detail){e.preventDefault();e.stopPropagation()}
      else if(e.detail && view && (e.target===canvas || e.target.closest('.object-hit'))){
        const bounds=canvas.getBoundingClientRect()
        const part=pickPart(model,parts,view,e.clientX-bounds.left,e.clientY-bounds.top)
        e.stopPropagation()
        activate(part)
      }
      dragged=false
    }
    function key(e){
      if(!['ArrowLeft','ArrowRight','Home'].includes(e.key))return
      e.preventDefault()
      if(e.key==='Home')({yaw,pitch}=HOME)
      else yaw=clamp(yaw+(e.key==='ArrowRight'?.1:-.1),.13,.76)
      refresh()
    }
    const resize=new ResizeObserver(refresh)
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;refresh()})
    resize.observe(canvas);observer.observe(canvas)
    surface.addEventListener('pointerdown',down);surface.addEventListener('pointermove',move)
    window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release)
    surface.addEventListener('click',preventDragClick,true)
    canvas.addEventListener('lostpointercapture',release);canvas.addEventListener('keydown',key)
    motion.addEventListener('change',refresh);document.addEventListener('visibilitychange',refresh)
    refresh()
    return ()=>{
      audio?.close().catch(()=>{})
      activateObject.current=null
      changeLighting.current=null
      cancelAnimationFrame(frame);gpu?.dispose();resize.disconnect();observer.disconnect()
      surface.removeEventListener('pointerdown',down);surface.removeEventListener('pointermove',move)
      window.removeEventListener('pointerup',release);window.removeEventListener('pointercancel',release)
      surface.removeEventListener('click',preventDragClick,true)
      canvas.removeEventListener('lostpointercapture',release);canvas.removeEventListener('keydown',key)
      motion.removeEventListener('change',refresh);document.removeEventListener('visibilitychange',refresh)
    }
  },[])
  return <main className="studio-room" aria-label="liihuu 的三维工作室">
    <h1 className="sr-only">liihuu · 前端开发工程师 · KLineChart 作者</h1>
    <canvas className="room-canvas outline" ref={fallback} aria-hidden="true" />
    <canvas className="room-canvas" ref={ref} tabIndex="0" aria-label="程序员正在房间里敲代码。拖动或用方向键转动视角，Home 键复位。" />
    <canvas ref={steam} width="64" height="96" aria-hidden="true"
      style={{position:'absolute',pointerEvents:'none'}} />
    {interactiveFaces.map(([key,obj])=>
      <button key={key} className="object-hit" aria-label={obj.label} aria-pressed={key==='lampSwitch'?true:undefined} aria-haspopup={key==='contact'?'dialog':undefined}
        ref={el=>{hitAreas.current[key]=el}} onClick={()=>activateObject.current?.(key)} />
    )}
    <ThemeSwitcher theme={theme} onChange={switchScene} />
    <div className="view-controls">
      <span>拖动环顾 · 点击物件探索</span>
      <button type="button" onClick={()=>resetView.current?.()} aria-label="复位视角" title="复位视角">⟲</button>
    </div>
    <dialog ref={dialog} className="detail contact" aria-labelledby="panel-title"
      onClick={e=>{if(e.target===dialog.current)dialog.current.close()}}>
      <article>
        <button className="close" autoFocus aria-label="关闭详情" onClick={()=>dialog.current.close()}>×</button>
        <div className="detail__main">
          <div className="detail__identity">
            <img className="avatar" src="/avatar.jpg" alt="liihuu 头像" />
            <div><h2 id="panel-title">{profile.name}</h2><p className="role">{profile.role}</p></div>
          </div>
          <p className="bio">{profile.bio}<br />开源项目 <a href={profile.project} target="_blank" rel="noreferrer">KLineChart</a> 的作者。</p>
        </div>
        <div className="detail__contact">
          <a className="contact-link" href={'mailto:'+profile.email}><span>邮箱</span>{profile.email}<b>›</b></a>
          <a className="contact-link" href={profile.github} target="_blank" rel="noreferrer"><span>GitHub</span>@liihuu<b>›</b></a>
          <figure><img src={qrcode} width="145" height="145" alt="微信二维码" /><figcaption>微信扫一扫，加我聊聊</figcaption></figure>
        </div>
      </article>
    </dialog>
  </main>
}
