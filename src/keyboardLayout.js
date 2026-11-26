// ANSI tenkeyless layout. Widths and gaps are in standard key units.
const groups=[
  [[0,['Esc']],[2,['F1','F2','F3','F4']],[6.5,['F5','F6','F7','F8']],
    [11,['F9','F10','F11','F12']],[15.4,['PrtSc','ScrLk','Pause']]],
  [[0,['`',...'1234567890','-','=', ['Backspace',2]]],[15.4,['Ins','Home','PgUp']]],
  [[0,[['Tab',1.5],...'QWERTYUIOP','[',']',['\\',1.5]]],[15.4,['Del','End','PgDn']]],
  [[0,[['Caps',1.75],...'ASDFGHJKL',';',"'",
    ['Enter',2.25]]]],
  [[0,[['Shift',2.25],...'ZXCVBNM',',','.','/',['Shift',2.75]]],[16.4,['↑']]],
  [[0,[['Ctrl',1.25],['Win',1.25],['Alt',1.25],['',6.25],['Alt',1.25],
    ['Win',1.25],['Menu',1.25],['Ctrl',1.25]]],[15.4,['←','↓','→']]]
]

export const keyboardKeys=groups.flatMap((row,r)=>row.flatMap(([start,keys])=>{
  let column=start
  return keys.map(key=>{
    const [label,width]=Array.isArray(key)?key:[key,1]
    const atlasX=1090+Math.round(column*48), atlasY=1264+r*34
    const color=label==='Esc'?'#ca8869':(width!==1 || r===0 || column>=15)?'#b9bdad':'#dddacb'
    const cap={label,row:r,column,width,color,atlasX,atlasY}
    column+=width
    return cap
  })
}))
