import React, { useEffect, useRef, useState } from 'react'
import { studioModel } from './studioModel'
import { drawScreen, makeAtlas } from './studioTextures'

import ThemeSwitcher from './ThemeSwitcher'
import { objects, profile } from './studioObjects'
import qrcode from './assets/qrcode.png'

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
  varying vec2 texcoord;
  void main() {
    vec3 p = position;
    p.y += abs(motion)*.038*sin(time*8.+motion*1.85);
    world = p;
    vec3 v = camera * (p-vec3(${centre.join(',')}));
    gl_Position = vec4(v.xy*scale, -v.z/12., 1.);
    float light = .76 + .28*max(dot(normal,normalize(vec3(-.56,.83,.68))),0.);
    tint = color*light;
    texcoord = uv;
  }`
const fragmentSource = `
  precision mediump float;
  uniform sampler2D atlas;
  varying vec3 world;
  varying vec3 tint;
  varying vec2 texcoord;
  void main() {
    vec3 color = texcoord.x < 0. ? tint : texture2D(atlas,texcoord).rgb;
    // Window light on the plaster and contact shading behind the desk.
    float wall = 1. - smoothstep(.05,.25,abs(world.z+2.21));
    vec2 shadow = (world.xy-vec2(.14,1.92))/vec2(1.65,.82);
    color *= 1. - .24 * wall * exp(-dot(shadow,shadow));
    float pool = exp(-dot((world-vec3(-2.65,2.2,-.1))*.47,(world-vec3(-2.65,2.2,-.1))*.47));
    color += vec3(.07,.045,.012) * pool;
    gl_FragColor = vec4(color,1.);
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
  gl.enable(gl.DEPTH_TEST)
  const uniforms=Object.fromEntries(['camera','scale','time'].map(k=>[k,gl.getUniformLocation(program,k)]))
  return {
    draw (matrix,sx,sy,time) {
      gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT)
      gl.uniformMatrix3fv(uniforms.camera,false,matrix)
      gl.uniform2f(uniforms.scale,sx,sy);gl.uniform1f(uniforms.time,time)
      gl.drawArrays(gl.TRIANGLES,0,vertices.length/12)
    },
    dispose () { gl.deleteBuffer(buffer);gl.deleteTexture(texture);gl.deleteProgram(program) }
  }
}

// A static software rendering of the same mesh keeps the room available on
// devices without WebGL. Its depth buffer also preserves the screen texture.
function softwareRenderer (canvas, vertices, atlas) {
  const ctx=canvas.getContext('2d')
  const pixels=atlas.getContext('2d').getImageData(0,0,atlas.width,atlas.height).data
  return function draw(matrix,sx,sy) {
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
          const tx=Math.floor(atlas.width*(t*vertices[i+9]+u*vertices[i+21]+v*vertices[i+33]))
          const ty=Math.floor(atlas.height*(t*vertices[i+10]+u*vertices[i+22]+v*vertices[i+34]))
          source=pixels;offset=4*(ty*atlas.width+tx)
        }
        for(let j=0;j<3;j++)image.data[k*4+j]=source[offset+j]
        image.data[k*4+3]=255
      }
    }
    ctx.putImageData(image,0,0)
  }
}

export default function Studio () {
  const ref=useRef(null), fallback=useRef(null), dialog=useRef(null), detail=useRef(null)
  const hitAreas=useRef({}), resetView=useRef(null)
  const [panel,setPanel]=useState(null)
  function openPanel(key) {
    setPanel(key)
    if(!dialog.current.open) dialog.current.showModal()
  }
  useEffect(()=>{
    const canvas=ref.current,model=studioModel(),atlas=makeAtlas()
    const gpu=gpuRenderer(canvas,model,atlas)
    const target=gpu?canvas:fallback.current
    const render=gpu?gpu.draw:softwareRenderer(target,model,atlas)

    let {yaw,pitch}=HOME
    let drag,frame=0,visible=true,lastDraw=-100,dirty=true
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)')
    function draw(now) {
      frame=0
      if(!visible || document.hidden)return
      if(dirty || now-lastDraw>=40){
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
          for(const [key,obj] of Object.entries(objects)){
            const node=hitAreas.current[key]
            const x=obj.x-obj.width/2-centre[0], y=obj.y+obj.height/2-centre[1], z=obj.z-centre[2]
            const left=w/(2*ratio)+unit*(a*x-b*z)
            const top=h/(2*ratio)-unit*(-b*d*x+c*y-a*d*z)
            node.style.width=obj.width*unit+'px'
            node.style.height=obj.height*unit+'px'
            node.style.transform='matrix('+[a,b*d,0,c,left,top].join(',')+')'
          }
        }
        render(matrix,2*size/w,2*size/h,motion.matches?0:now/1000)
        lastDraw=now;dirty=false
      }
      if(gpu&&!motion.matches)frame=requestAnimationFrame(draw)
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
      cancelAnimationFrame(frame);gpu?.dispose();resize.disconnect();observer.disconnect()
      surface.removeEventListener('pointerdown',down);surface.removeEventListener('pointermove',move)
      window.removeEventListener('pointerup',release);window.removeEventListener('pointercancel',release)
      surface.removeEventListener('click',preventDragClick,true)
      canvas.removeEventListener('lostpointercapture',release);canvas.removeEventListener('keydown',key)
      motion.removeEventListener('change',refresh);document.removeEventListener('visibilitychange',refresh)
    }
  },[])
  useEffect(()=>{
    if(panel==='project')drawScreen(detail.current.getContext('2d'))
  },[panel])
  return <main className="studio-room" aria-label="liihuu 的三维工作室">
    <h1 className="sr-only">liihuu · 前端开发工程师 · KLineChart 作者</h1>
    <canvas className="room-canvas outline" ref={fallback} aria-hidden="true" />
    <canvas className="room-canvas" ref={ref} tabIndex="0" aria-label="程序员正在房间里敲代码。拖动或用方向键转动视角，Home 键复位。" />
    {Object.entries(objects).map(([key,obj])=>
      <button key={key} className="object-hit" aria-label={obj.label} aria-haspopup="dialog"
        ref={el=>{hitAreas.current[key]=el}} onClick={()=>openPanel(key)} />
    )}
    <ThemeSwitcher />
    <div className="view-controls">
      <span>拖动环顾 · 点击物件探索</span>
      <button type="button" onClick={()=>resetView.current?.()} aria-label="复位视角" title="复位视角">⟲</button>
    </div>
    <dialog ref={dialog} className={'detail '+(panel||'')} aria-labelledby="panel-title"
      onClose={()=>setPanel(null)} onClick={e=>{if(e.target===dialog.current)dialog.current.close()}}>
      <article>
        <button className="close" autoFocus aria-label="关闭详情" onClick={()=>dialog.current.close()}>×</button>
        {panel==='project' && <>
          <h2 id="panel-title">KLineChart</h2><p>轻量级金融 K 线图表库</p>
          <canvas ref={detail} width="1024" height="440" role="img" aria-label="初始化 KLineChart 的示例代码及带成交量的 K 线图" />
          <a href={profile.project} target="_blank" rel="noreferrer">查看开源项目 ↗</a>
        </>}
        {panel==='contact' && <>
          <img className="avatar" src="/avatar.jpg" alt="liihuu 头像" />
          <h2 id="panel-title">{profile.name}.</h2>
          <p className="role">{profile.role}</p><p>{profile.bio}<br />开源项目 <a href={profile.project} target="_blank" rel="noreferrer">KLineChart</a> 的作者。</p>
          <a href={'mailto:'+profile.email}>{profile.email}</a>
          <a href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a>
          <figure><img src={qrcode} width="145" height="145" alt="微信二维码" /><figcaption>微信扫一扫</figcaption></figure>
        </>}
      </article>
    </dialog>
  </main>
}
