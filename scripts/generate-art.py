"""Rebuild the arcade's original vector illustrations. Standard library only."""
from pathlib import Path
from math import sin, cos, pi
import random

OUT = Path(__file__).resolve().parents[1] / 'assets' / 'art'
OUT.mkdir(parents=True, exist_ok=True)
rng = random.Random(913)

def wrap(body, start='#20324b', end='#14202f'):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
<defs><linearGradient id="bg" x2="0" y2="1"><stop stop-color="{start}"/><stop offset="1" stop-color="{end}"/></linearGradient>
<linearGradient id="road" x2="0" y2="1"><stop stop-color="#4a3148"/><stop offset="1" stop-color="#171827"/></linearGradient>
<linearGradient id="car" x2="0" y2="1"><stop stop-color="#ffb19f"/><stop offset=".5" stop-color="#ff5f74"/><stop offset="1" stop-color="#bb335d"/></linearGradient>
<linearGradient id="mint" x2="0" y2="1"><stop stop-color="#bdffdc"/><stop offset="1" stop-color="#46c5b2"/></linearGradient>
<radialGradient id="halo"><stop stop-color="#f5b7ff" stop-opacity=".28"/><stop offset="1" stop-color="#f5b7ff" stop-opacity="0"/></radialGradient>
<filter id="glow"><feGaussianBlur stdDeviation="5"/></filter></defs>
<path fill="url(#bg)" d="M0 0H600V380H0z"/>{body}</svg>'''

def save(name, body, a, b): (OUT / (name + '.svg')).write_text(wrap(body, a, b))
def stars(n=40):
    return ''.join(f'<circle cx="{rng.randrange(600)}" cy="{rng.randrange(340)}" r="{rng.choice([1,1,1.5,2])}" fill="#fff" opacity="{rng.uniform(.15,.5):.2f}"/>' for _ in range(n))
def palm(x,y,s=1,flip=1):
    return f'''<g transform="translate({x} {y}) scale({s*flip} {s})" fill="#20213b"><path d="M-6 0Q-2-68-22-126L-15-127Q9-71 7 0Z"/>
<path d="M-18-122Q-48-165-83-133Q-44-140-18-122M-18-122Q-70-130-80-96Q-48-119-18-122M-18-122Q-28-178 12-176Q-12-153-18-122M-18-122Q25-172 57-139Q13-143-18-122M-18-122Q30-138 53-104Q13-123-18-122"/></g>'''

body='''<circle cx="310" cy="143" r="75" fill="#ffd18b"/><path d="M230 147H390M230 160H390M230 176H390M230 194H390" stroke="#cf747b" stroke-width="5"/>
<path d="M0 196L57 153 94 176 139 133 195 186 228 166 278 205 345 170 389 196 461 145 512 175 549 153 600 190V240H0Z" fill="#805775"/>
<path d="M0 225L71 199 143 209 214 192 286 218 372 197 446 217 520 187 600 217V380H0Z" fill="#b2767e"/>
<path d="M271 213L-65 380H665L326 213Z" fill="url(#road)"/>
<path d="M270 214L-40 380M328 214L640 380" stroke="#ffd09a" stroke-width="6"/>
<path d="M288 221L244 380M307 221L357 380" stroke="#f4b8a7" stroke-width="4" stroke-dasharray="10 18"/>
<path d="M0 305H89M490 305H600M0 339H43M551 339H600" stroke="#e29888" stroke-width="3"/>
'''
body+=palm(94,274,1.35)+palm(512,273,1.2,-1)+palm(199,228,.5)+palm(402,231,.56,-1)
body+='''<ellipse cx="304" cy="332" rx="97" ry="16" fill="#0e1025" opacity=".45"/>
<g transform="translate(211 244)"><path d="M11 37L29 5Q33-3 48-3H137Q150-3 155 9L174 39L184 49V83H0V49Z" fill="url(#car)"/>
<path d="M34 9H147L160 39H20Z" fill="#32253f"/><path d="M40 12H139L148 29H32Z" fill="#68708a"/><path d="M7 45H177V58H7Z" fill="#ffcfac"/>
<path d="M12 46H57V54H12ZM127 46H172V54H127Z" fill="#fff4c4"/><path d="M63 46H121V55H63Z" fill="#7c294f"/>
<path d="M3 65H181V78H3Z" fill="#82294f"/><path d="M18 76V90H43V77M142 77V90H167V76" fill="#151526"/>
<path d="M25 41H158" stroke="#ffe2bc" stroke-width="3"/><path d="M72 64H112V72H72Z" fill="#efabb6"/>
</g><path d="M133 322L93 354M472 320L514 354" stroke="#ffc5a5" stroke-width="3" opacity=".5"/>'''
save('sunset-sprint',body,'#49315b','#f9ad87')

body=stars(30)+'''<circle cx="440" cy="100" r="60" fill="#d2c6f8" opacity=".75"/><circle cx="440" cy="100" r="90" fill="url(#halo)"/>'''
for i in range(16):
    x=i*40-15; y=rng.randint(120,230)
    body+=f'<rect x="{x}" y="{y}" width="31" height="{300-y}" fill="#171d3c"/>'
    for j in range(3): body+=f'<path d="M{x+7} {y+15+j*20}h5m7 0h5" stroke="#bd78aa" stroke-width="3" opacity=".45"/>'
body+='''<path d="M0 283L600 267V380H0Z" fill="#272440"/><path d="M0 285L600 269" stroke="#67eadb" stroke-width="5"/>
<path d="M0 344L600 319M120 280L70 380M272 276L250 380M423 272L445 380M562 270L600 380" stroke="#554165" stroke-width="2"/>
<g stroke-linecap="round" stroke-linejoin="round"><ellipse cx="208" cy="293" rx="70" ry="12" fill="#12182b" opacity=".5"/>
<path d="M204 226L177 257 166 288M213 223L238 252 267 287" fill="none" stroke="#137986" stroke-width="23"/>
<path d="M198 175L216 220" stroke="#63e7d4" stroke-width="37"/><circle cx="193" cy="149" r="20" fill="#f7bc9c"/>
<path d="M174 143Q183 121 208 139L213 151H174Z" fill="#182d45"/><path d="M175 148H211" stroke="#55d8cc" stroke-width="6"/>
<path d="M209 183L246 199 276 181M184 184L162 211 188 217" fill="none" stroke="#62dacb" stroke-width="17"/>
<path d="M277 181L287 176" stroke="#ffe0bb" stroke-width="20"/>
<ellipse cx="403" cy="284" rx="72" ry="12" fill="#11162b" opacity=".5"/>
<path d="M399 227L417 256 442 279M389 225L360 253 342 282" fill="none" stroke="#984966" stroke-width="23"/>
<path d="M405 178L392 223" stroke="#f581a7" stroke-width="37"/><circle cx="411" cy="151" r="20" fill="#e6ad9a"/>
<path d="M393 144Q403 120 429 138L434 154H391Z" fill="#332140"/>
<path d="M394 181L366 194 341 177M417 184L438 208 417 220" fill="none" stroke="#f581a7" stroke-width="17"/>
<path d="M341 177L331 172" stroke="#ffe0bb" stroke-width="20"/></g>
<path d="M304 161L298 181 310 183 301 205" fill="none" stroke="#ffdf9e" stroke-width="4"/>
<path d="M35 80H112V111H35Z" fill="#49284f"/><path d="M48 91H98M48 101H78" stroke="#fa88b6" stroke-width="4"/>'''
save('neon-dojo',body,'#282a50','#19192c')

body='''<path d="M0 0H600V380H0Z" fill="#273d3a"/><ellipse cx="300" cy="220" rx="355" ry="174" fill="#446c50"/>
<path d="M103 50H493L587 367H9Z" fill="#78b86a"/><path d="M103 50H493L508 103H87ZM71 156H524L540 209H56ZM40 262H555L571 315H24Z" fill="#6aab61"/>
<path d="M119 65H479L562 350H33ZM299 65V350" fill="none" stroke="#d9f3c0" stroke-width="3"/>
<ellipse cx="299" cy="199" rx="63" ry="47" fill="none" stroke="#d9f3c0" stroke-width="3"/>
<path d="M189 65L177 113H422L409 65M156 350L174 284H425L444 350" fill="none" stroke="#d9f3c0" stroke-width="3"/>
<path d="M242 49V72H358V49M214 344V375H384V344" fill="none" stroke="#f7f5db" stroke-width="7"/>
<path d="M218 345L230 374M240 345L250 374M266 345L270 374M295 345V374M322 345V374M347 345L339 374M373 345L360 374" stroke="#ffffff60"/>
<path d="M16 37H584M9 25H590" stroke="#a6d0ba" stroke-width="5" stroke-dasharray="4 12" opacity=".45"/>'''
for x,y,c,n in [(211,184,'#ffe391',7),(392,147,'#f58a85',4),(348,263,'#ffe391',9),(168,276,'#f58a85',3),(302,103,'#88dce3',1),(299,324,'#c2a7ea',1)]:
    body+=f'''<g transform="translate({x} {y})"><ellipse cy="20" rx="18" ry="8" fill="#244e3c" opacity=".4"/><path d="M-9 10L-13 24M7 10L14 21" stroke="#283b4b" stroke-width="7" stroke-linecap="round"/><path d="M-15-5L-22 7M14-5L22 6" stroke="{c}" stroke-width="8" stroke-linecap="round"/><rect x="-13" y="-12" width="26" height="27" rx="8" fill="{c}"/><circle cy="-19" r="10" fill="#eab793"/><text y="8" text-anchor="middle" font-size="14" font-family="Arial" font-weight="bold" fill="#30454d">{n}</text></g>'''
body+='''<ellipse cx="288" cy="248" rx="12" ry="7" fill="#244e3c" opacity=".4"/><circle cx="286" cy="239" r="12" fill="#fff9de"/><path d="M282 231L290 231 294 238 287 243 280 239Z" fill="#344655"/><path d="M267 233L243 216M262 244L241 235" stroke="#e4f8c1" stroke-width="3" opacity=".7"/>'''
save('pocket-striker',body,'#203c37','#598058')

body=stars(40)+'''<circle cx="483" cy="75" r="55" fill="#544789"/><circle cx="470" cy="65" r="50" fill="#7062a1"/>
<path d="M32 200L293 72 567 204 304 348Z" fill="#383456"/><path d="M32 200V235L303 375 567 239V204L304 348Z" fill="#25243f"/>
<path d="M55 208L163 153 266 204 371 154 500 218 397 271 295 222 183 279" fill="none" stroke="#68628a" stroke-width="36" stroke-linejoin="round"/>
<path d="M55 208L163 153 266 204 371 154 500 218 397 271 295 222 183 279" fill="none" stroke="#9d8aca" stroke-width="2" stroke-dasharray="7 10"/>
'''
for x,y,c in [(213,127,'#82e6e5'),(332,267,'#d3b5ff'),(433,209,'#f8c786')]:
    body+=f'''<g transform="translate({x} {y})"><ellipse cy="22" rx="35" ry="15" fill="#191e38" opacity=".6"/><path d="M-26 0L0-14 26 0V22L0 36-26 22Z" fill="#474563"/><path d="M-26 0L0-14 26 0 0 14Z" fill="#787093"/><path d="M-14-7L0-15 15-7V11L0 19-14 11Z" fill="{c}"/><ellipse cy="-8" rx="15" ry="8" fill="#e1e0fa"/><path d="M-1-10L22-23" stroke="{c}" stroke-width="12" stroke-linecap="round"/></g>'''
for x,y in [(115,178),(153,160),(236,190),(477,206)]:
    body+=f'<path d="M{x-11} {y-6}L{x} {y-13} {x+11} {y-6}V{y+6}L{x} {y+13} {x-11} {y+6}Z" fill="#fa8fac"/><path d="M{x-7} {y-3}H{x+7}" stroke="#7f355b" stroke-width="3"/>'
body+='''<path d="M233 103L263 181M447 186L476 197" stroke="#9ffff2" stroke-width="3" stroke-dasharray="6 6"/><circle cx="267" cy="190" r="22" fill="none" stroke="#98fae4" stroke-width="2" opacity=".6"/>'''
save('orbit-guard',body,'#252440','#141d31')

body='''<circle cx="496" cy="55" r="100" fill="#95d8b1" opacity=".3"/><path d="M-20 330L111 37 513 76 624 337Z" fill="#2a705b"/>
<path d="M21 318L126 59 491 94 580 320Z" fill="#c6d8a5"/>
<path d="M41 302L139 77 477 110 558 302Z" fill="#80bf79"/>
<path d="M85 299L169 81M158 299L214 85M231 301L260 90M303 301L305 94M376 302L351 99M449 302L397 103M522 302L444 108" stroke="#92ce87" stroke-width="26"/>
<path d="M187 179Q221 156 252 180T321 180Q347 157 370 183L389 237Q350 263 315 238T241 239Q204 263 177 237Z" fill="#57aeb0"/><path d="M202 192Q230 181 250 197M289 222Q320 208 350 221" stroke="#b3eee3" stroke-width="3" opacity=".7"/>
<path d="M101 241L146 126 175 129 131 243Z" fill="#e4cfa2"/><path d="M445 168L470 165 508 265 480 269Z" fill="#e4cfa2"/>
<ellipse cx="384" cy="142" rx="12" ry="7" fill="#245646"/><path d="M384 140V62" stroke="#eef4d6" stroke-width="4"/><path d="M386 61L437 76 386 89Z" fill="#f59583"/>
<ellipse cx="236" cy="282" rx="15" ry="8" fill="#4c8f61"/><circle cx="232" cy="271" r="12" fill="#fffbea"/><circle cx="229" cy="267" r="4" fill="#fff"/>
<path d="M245 256Q324 272 405 220Q430 198 400 163" fill="none" stroke="#fff8ce" stroke-width="3" stroke-dasharray="5 8"/>
<path d="M160 344L215 287" stroke="#374f4c" stroke-width="6" stroke-linecap="round"/><path d="M208 277L226 296" stroke="#ecf1d7" stroke-width="10" stroke-linecap="round"/>'''
for x,y,s in [(64,130,1),(540,121,1.2),(42,300,.8),(558,310,.9)]:
    body+=f'<g transform="translate({x} {y}) scale({s})"><path d="M0 0V-23" stroke="#47665a" stroke-width="6"/><circle cy="-42" r="27" fill="#438967"/><circle cx="-7" cy="-48" r="17" fill="#65a883"/></g>'
save('mini-golf-club',body,'#528f86','#bed4a6')

body='''<circle cx="443" cy="85" r="57" fill="#fff0be"/><path d="M0 220L55 189 100 208 170 165 230 205 305 154 387 205 453 167 520 196 600 156V380H0Z" fill="#6fa8c8"/>
<path d="M-50 74Q-8 35 39 69Q66 46 105 78ZM285 47Q322 17 355 43Q390 20 414 51Z" fill="#dbedf0" opacity=".7"/>
<path d="M0 267H143V380H0Z" fill="#426b8e"/><path d="M0 251H147V271H0Z" fill="#c3e6da"/><path d="M177 296H335V380H177Z" fill="#3f6b8a"/><path d="M174 279H339V299H174Z" fill="#e0ead4"/>
<path d="M406 238H600V380H406Z" fill="#467592"/><path d="M401 220H600V242H401Z" fill="#c7e6d5"/>
<path d="M23 293H42V311H23ZM65 293H84V311H65ZM107 293H126V311H107ZM202 320H223V343H202ZM252 320H273V343H252ZM443 266H465V287H443ZM502 266H524V287H502ZM563 266H585V287H563Z" fill="#8bb8be"/>
<path d="M203 210Q285 131 391 173" stroke="#d9f6e3" stroke-width="3" stroke-dasharray="5 10" fill="none"/>
<g stroke-linecap="round" stroke-linejoin="round"><path d="M278 181L255 199 231 186M282 186L307 209 331 204" stroke="#263c65" stroke-width="15" fill="none"/>
<path d="M283 153L277 178" stroke="#ff927c" stroke-width="28"/><circle cx="287" cy="131" r="16" fill="#f9ceab"/><path d="M271 124Q287 106 303 122L308 131H270Z" fill="#36556a"/>
<path d="M276 153L251 166 236 155M293 155L316 139 325 126" stroke="#ffd2af" stroke-width="11" fill="none"/><path d="M269 145L241 133 223 143" stroke="#ffcc71" stroke-width="9" fill="none"/>
</g>'''
for x,y in [(146,209),(345,122),(386,158),(451,180)]: body+=f'<path d="M{x} {y-10}L{x+8} {y} {x} {y+10} {x-8} {y}Z" fill="#ffe596"/><path d="M{x} {y-5}V{y+5}" stroke="#fff8d0" stroke-width="2"/>'
save('skybound',body,'#79bad2','#d4e2cc')

body=stars(70)+'''<ellipse cx="318" cy="169" rx="230" ry="147" fill="url(#halo)"/><circle cx="467" cy="99" r="66" fill="#775b9a"/><path d="M409 68Q461 74 515 126M410 96Q455 105 505 145" stroke="#aa80ae" stroke-width="11" opacity=".45"/><ellipse cx="465" cy="107" rx="106" ry="22" transform="rotate(-25 465 107)" stroke="#d2acd1" stroke-width="9" fill="none"/>
<path d="M290 265L271 345 292 324 312 345 303 265Z" fill="#ba91ff" opacity=".4"/><path d="M290 267L282 324 293 309 302 323 300 267Z" fill="#b5f4ff"/>
<path d="M293 191L246 279 274 266 293 276 312 266 339 279Z" fill="#dbe4fa"/>
<path d="M293 192L293 274 309 264Z" fill="#8d9fc7"/><path d="M293 214L283 249H303Z" fill="#739cdf"/><path d="M266 252L255 279M320 252L330 279" stroke="#c1a2ff" stroke-width="6"/>
<path d="M280 182V156M305 182V156M280 138V115M305 138V115" stroke="#9cf4df" stroke-width="4" stroke-linecap="round"/>
<g fill="#f7a4bd" stroke="#8b4b81" stroke-width="2"><path d="M154 104L120 70 142 72 154 58 168 72 189 70Z"/><path d="M340 90L309 59 330 61 341 49 353 61 372 59Z"/><path d="M433 201L403 171 423 174 435 161 447 174 468 172Z"/></g>
<path d="M153 128V154M433 224V248" stroke="#ff9db4" stroke-width="4" stroke-linecap="round"/><circle cx="181" cy="205" r="25" stroke="#c5a3ff" stroke-width="2" fill="none"/><path d="M171 205H191M181 195V215" stroke="#ded0ff" stroke-width="3"/>'''
save('starfall',body,'#282447','#151d35')

body='''<circle cx="490" cy="82" r="105" fill="#efc788" opacity=".13"/><circle cx="83" cy="318" r="130" fill="#f5bc87" opacity=".13"/><g transform="translate(300 197) rotate(-8) translate(-300 -197)"><rect x="144" y="34" width="312" height="312" rx="23" fill="#503f4c"/><rect x="151" y="41" width="298" height="298" rx="18" fill="#92786d"/>'''
tiles=[2,4,0,2,8,16,4,0,32,64,8,2,128,256,16,4]
palette={0:('#a99180','#a99180'),2:('#f7ebd3','#7a6254'),4:('#f8deb4','#7a6254'),8:('#f4bd87','#74554f'),16:('#ed9978','#fff5dd'),32:('#db7890','#fff3db'),64:('#b881b7','#fff3db'),128:('#9588bf','#fff3db'),256:('#83b7b1','#fff6de')}
for i,num in enumerate(tiles):
    x=161+(i%4)*71;y=51+(i//4)*71;c,ink=palette[num]
    body+=f'<rect x="{x}" y="{y+4}" width="65" height="65" rx="9" fill="#584952" opacity=".35"/><rect x="{x}" y="{y}" width="65" height="65" rx="9" fill="{c}"/>'
    if num: body+=f'<text x="{x+32.5}" y="{y+42}" font-size="{24 if num>99 else 28}" font-family="system-ui,sans-serif" font-weight="800" text-anchor="middle" fill="{ink}">{num}</text>'
body+='''</g><path d="M84 116L88 127 100 131 88 135 84 147 80 135 68 131 80 127Z" fill="#ffe0a6"/><path d="M501 274L505 285 517 289 505 293 501 305 497 293 485 289 497 285Z" fill="#dbd2b5"/><path d="M69 245H119M108 233L120 245 108 257" stroke="#f8d8aa" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'''
save('merge-lab',body,'#5c4c60','#896674')

body=stars(35)+'''<circle cx="300" cy="190" r="180" fill="url(#halo)"/><ellipse cx="302" cy="320" rx="100" ry="16" fill="#180f34" opacity=".5"/>
<path d="M213 248H389L373 312Q370 326 353 326H248Q232 326 228 312Z" fill="#9e7bda"/><rect x="201" y="240" width="199" height="23" rx="11" fill="#f0dbff"/><path d="M238 274L250 310M268 274L274 312M299 274V312M330 274L324 312M362 274L350 312" stroke="#bb96e7" stroke-width="7"/>
<circle cx="276" cy="283" r="5" fill="#49326e"/><circle cx="326" cy="283" r="5" fill="#49326e"/><path d="M289 297Q301 310 313 297" stroke="#49326e" stroke-width="4" fill="none" stroke-linecap="round"/>'''
for x,y,c,a in [(185,126,'#ff94b4',-23),(346,83,'#ffda8d',25),(408,173,'#82d8cf',-22),(269,176,'#bda5f5',18),(120,217,'#93c9f4',22)]:
    body+=f'''<g transform="translate({x} {y}) rotate({a})"><path d="M-20 0L-43-18V18ZM20 0L43-18V18Z" fill="{c}"/><ellipse rx="27" ry="24" fill="{c}"/><path d="M-12-16Q-19-9-18 1" stroke="#fff" opacity=".55" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M-8 21Q17 12 13-18" stroke="#fff" opacity=".3" stroke-width="6" fill="none"/></g>'''
body+='''<path d="M477 80L484 95 501 97 488 109 491 126 477 118 462 126 465 109 452 97 470 95Z" fill="#ffdf92"/><path d="M327 175V204M345 162V184M169 174V192" stroke="#b8a3e0" stroke-width="3" stroke-linecap="round" opacity=".6"/>'''
save('candy-drop',body,'#3d315e','#241e43')
print('Generated 9 original SVG game illustrations.')
