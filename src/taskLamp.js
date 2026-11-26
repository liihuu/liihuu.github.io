// All lamp dimensions and the light source are expressed in room coordinates.
export const lampBase = [-1.99, 1.296, -.86]
const crown = [-1.8172, 2.34841964, -.9548]
const tiltFromVertical = 32 * Math.PI / 180
const heading = Math.atan2(2,3)
export const lampAxis = [Math.sin(tiltFromVertical)*Math.cos(heading), -Math.cos(tiltFromVertical), Math.sin(tiltFromVertical)*Math.sin(heading)]
export const lampLight = crown.map((n,i)=>n+.27*lampAxis[i])
export const diffuserRadius = .145

export function buildTaskLamp({tri,tube}) {
  const enamel='#40685e', rim='#759487', brass='#b48e60', metal='#455653'
  const along=(p,d,t)=>p.map((n,k)=>n+d[k]*t)
  // Revolve a cross-section around the fixture axis. The profile folds back
  // inside the rim to form a hollow reflector with a recessed diffuser.
  function turn(origin,axis,profile) {
    const uLength=Math.hypot(axis[0],axis[1])
    const u=[-axis[1]/uLength,axis[0]/uLength,0]
    const v=[-axis[2]*u[1],axis[2]*u[0],uLength]
    const sides=40
    for(let j=1;j<profile.length;j++){
      const [bottom,r0]=profile[j-1], [top,r1,color]=profile[j]
      const dz=top-bottom, dr=r1-r0, length=Math.hypot(dz,dr)
      function vertex(i,z,r){
        const a=i*2*Math.PI/sides
        const radial=u.map((n,k)=>n*Math.cos(a)+v[k]*Math.sin(a))
        return [along(along(origin,axis,z),radial,r),radial.map((n,k)=>(n*dz-axis[k]*dr)/length)]
      }
      let a=vertex(0,bottom,r0), b=vertex(0,top,r1)
      for(let i=1;i<=sides;i++){
        const c=vertex(i,bottom,r0),d=vertex(i,top,r1)
        for(const face of [[a,c,b],[b,c,d]]){
          tri(face.map(p=>p[0]),color,face.map(p=>p[1]))
        }
        a=c;b=d
      }
    }
  }
  turn(lampBase,[0,1,0],[[0,.186],[.012,.203,'#303c39'],[.025,.205,metal],
    [.050,.198,enamel],[.068,.171,rim],[.076,.104,enamel],[.078,0,enamel]])
  const first=[-1.99,1.465,-.86], elbow=[-2.13,1.89,-1.01]
  tube(along(lampBase,[0,1,0],.078),first,.060,.049,metal)
  // Paired arms straddle each pivot, with a small brass retaining cap.
  for(const side of [-1,1]){
    const offset=[0,0,.045*side]
    const shift=p=>along(p,offset,1)
    tube(shift(first),shift(elbow),.022,.022,enamel)
    tube(shift(elbow),shift(crown),.019,.019,enamel)
  }
  for(const joint of [first,elbow,crown]){
    const pin=t=>along(joint,[0,0,1],t)
    tube(pin(-.071),pin(.071),.048,.048,metal)
    tube(pin(.071),pin(.079),.034,.031,brass)
    tube(pin(.079),pin(.081),.014,.014,'#665748')
  }
  turn(lampLight,lampAxis,[[-.28,0],[-.28,.053,metal],[-.225,.061,metal],
    [-.212,.082,brass],[-.198,.086,enamel],[-.176,.094,rim],[-.139,.117,enamel],
    [-.091,.148,enamel],[-.036,.170,enamel],[.012,.178,enamel],[.021,.177,rim],
    [.025,.169,brass],[.019,.162,'#ede1c4'],[0,diffuserRadius,'#e5d7b9'],
    [0,0,'#fff0c8']])
}
