"""Build an editable PowerPoint and matching offline HTML from one layout definition.
Run: uv run --no-project --with python-pptx --with pillow python presentations/HumanoidTH-4min/build_deck.py
"""
from pathlib import Path
import html, json, base64
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR
from PIL import Image

OUT=Path(__file__).resolve().parent
W,H=1600,900
INK='173E32'; DARK='102D25'; CREAM='F5F3EB'; MUTED='677C70'; GREEN='C5EF83'; WHITE='FFFFFF'; PALE='E7ECDC'; LINE='D6DDCF'; GOLD='EAC36B'
slides=[]
def new(title,seconds,notes,dark=False):
    s={'title':title,'seconds':seconds,'notes':notes,'bg':DARK if dark else CREAM,'els':[]};slides.append(s)
    text(s,72,38,800,34,'HUMANOIDTH  /  ROBOTICS FOR BETTER LIVING',19,GREEN if dark else INK,True)
    rect(s,72,833,1456,2,'365148' if dark else LINE)
    text(s,72,851,1100,25,'CONNECT PEOPLE. CREATE CHALLENGES. KEEP IMPROVING.',16,'B5C9BB' if dark else MUTED)
    text(s,1430,845,100,35,f'{len(slides):02d} / 06',20,GREEN if dark else INK,True,align='right')
    return s
def rect(s,x,y,w,h,c,r=0,line=None):s['els'].append(dict(kind='rect',x=x,y=y,w=w,h=h,c=c,r=r,line=line))
def circle(s,x,y,d,c,line=None):s['els'].append(dict(kind='circle',x=x,y=y,w=d,h=d,c=c,line=line))
def text(s,x,y,w,h,t,size=28,c=INK,bold=False,align='left'):
    s['els'].append(dict(kind='text',x=x,y=y,w=w,h=h,t=t,size=size,c=c,bold=bold,align=align))
def picture(s,x,y,w,h,name):s['els'].append(dict(kind='image',x=x,y=y,w=w,h=h,name=name))
def heading(s,kicker,title,sub=None):
    text(s,72,110,1450,32,kicker,21,MUTED,True)
    text(s,72,160,1450,156,title,64,INK,True)
    if sub:text(s,76,319,1420,60,sub,28,MUTED)
def tag(s,x,y,w,t,bg=GREEN,fg=INK):
    rect(s,x,y,w,42,bg,12);text(s,x+16,y+9,w-32,29,t,19,fg,True)
def arrow(s,x,y,direction='right',c=MUTED):
    s['els'].append(dict(kind='arrow',x=x,y=y,w=50,h=30,direction=direction,c=c))

s=new('Competition moves Thai robotics forward',20,
'''My goal is to bring Thailand’s robotics companies and learners together. HumanoidTH connects real challenges with people who want to learn and build. Competition gives them a reason to improve, and wellness gives that progress a human purpose.''',True)
tag(s,72,118,238,'THE VISION',GREEN)
text(s,72,201,925,310,'Competition moves\nThai robotics\nforward.',81,WHITE,True)
text(s,77,560,850,110,'Connect companies. Grow learners.\nBuild for better living.',34,'D7E4D9')
rect(s,1060,176,460,534,'1B4033',28)
for y,n,title,body in [(215,'01','COMPANIES','Bring real challenges'),(375,'02','LEARNERS','Build and improve'),(535,'03','PEOPLE','Benefit from better solutions')]:
    circle(s,1090,y,62,GREEN);text(s,1090,y+14,62,40,n,26,INK,True,'center')
    text(s,1180,y+1,316,42,title,27,WHITE,True)
    text(s,1180,y+48,290,73,body,24,'C4D5C7')
text(s,76,748,1200,44,'A shared home for Thailand’s robotics community.',29,GREEN)

s=new('Connect companies and learners',35,
'''We are designing the platform around two groups. Companies can bring robots, practical problems, and mentors. In return, they can discover ideas and people with useful skills. Learners bring curiosity and teamwork, but they need a clear starting point and a way to show what they can do. HumanoidTH connects these groups through shared challenges. Universities, labs, and service providers can support the journey. These are the needs and partnerships we want to validate in our first pilot.''')
heading(s,'01 / CONNECT THE COMMUNITY','Two groups.\nOne shared opportunity.')
for x,title,accent,rows in [(72,'Companies',INK,[('BRING','Challenges, technology, mentors'),('GAIN','New ideas and visible talent')]),(832,'Learners',INK,[('BRING','Curiosity, skills, teamwork'),('GAIN','Practice, feedback, recognition')])]:
    rect(s,x,366,696,335,WHITE,20)
    text(s,x+32,394,625,61,title,42,INK,True)
    for i,(k,v) in enumerate(rows):
        text(s,x+32,480+i*91,600,29,k,18,MUTED,True)
        text(s,x+32,515+i*91,620,46,v,28,INK)
circle(s,743,497,114,GREEN);text(s,743,526,114,62,'↔',49,INK,True,'center')
text(s,76,744,1460,57,'Universities + labs + service providers support the shared journey.',29,MUTED)

s=new('Competition creates continuous progress',45,
'''The central idea is that competition makes progress visible. A company or service provider proposes a challenge. Learners study the skills they need, build a solution, and enter the competition. Evaluation gives them evidence and feedback. They then improve their solution and return for another round. A shared task and clear rules help teams compare their work fairly. We want to reward improvement, clear communication, and useful solutions, so the value of the competition continues after the event ends.''')
heading(s,'02 / COMPETITION DRIVES PROGRESS','Every round should\nproduce a better solution.')
steps=[(72,365,'01','Challenge','A useful problem'),(584,365,'02','Learn','A clear starting point'),(1096,365,'03','Build','A working solution'),(1096,570,'04','Compete','Shared rules and tasks'),(584,570,'05','Feedback','Evidence and review'),(72,570,'06','Improve','Try the next version')]
for x,y,n,title,body in steps:
    rect(s,x,y,432,157,GREEN if n=='06' else WHITE,18)
    text(s,x+24,y+21,48,35,n,24,MUTED,True)
    text(s,x+88,y+20,318,51,title,35,INK,True)
    text(s,x+88,y+88,323,48,body,25,INK)
arrow(s,521,425);arrow(s,1033,425);arrow(s,1280,531,'down')
arrow(s,1033,634,'left');arrow(s,521,634,'left');arrow(s,258,531,'up',INK)
text(s,76,760,1450,45,'The next round turns feedback into progress.',31,INK,True)

s=new('Wellness gives the challenge a human purpose',60,
'''Our first proposed wellness challenge is a better welcome at a wellness centre. Imagine a visitor who needs to find an activity room. The robot explains the options: guide me, call a staff member, or cancel. The visitor stays in control. Teams can compete to make this interaction clearer and more useful. We would evaluate task completion, whether people understand the next step, and whether cancellation or staff handoff works. We also want participants to tell us how comfortable they feel. Our current HRI demo records interaction events and outcomes in simulation. It does not prove a health benefit. The next step is testing with real users and a partner venue.''')
heading(s,'03 / COMPETITION FOR BETTER LIVING','A better welcome.\nA visitor who stays in control.')
rect(s,72,355,872,330,WHITE,22)
tag(s,102,380,360,'FIRST PROPOSED CHALLENGE',PALE)
text(s,103,444,803,65,'Find an activity room at a wellness centre.',32,INK,True)
text(s,104,521,795,44,'“How would you like me to help?”',29,MUTED)
for x,w,t,c in [(103,239,'Guide me',GREEN),(361,270,'Call a staff member',PALE),(650,263,'Cancel',PALE)]:
    rect(s,x,592,w,58,c,10);text(s,x+13,608,w-26,35,t,24,INK,True,'center')
text(s,1008,366,498,49,'Evaluate the experience',33,INK,True)
for i,t in enumerate(['Task completed','Next step understood','Staff help / cancel works','Comfort reported by users']):
    circle(s,1010,449+i*57,13,INK)
    text(s,1040,438+i*57,489,48,t,27,INK)
rect(s,72,724,1456,66,'EDE5CE',12)
text(s,95,740,1409,42,'Simulation today. Real-user trials are needed to establish wellbeing outcomes.',26,INK)

s=new('The software pilot connects the journey',50,
'''We have built a software pilot to support this journey. Learners can explore robot information, follow lessons, and practise in a saved-program simulator. The HRI demonstration lets a visitor choose guidance, staff help, or cancellation and then inspect the recorded run. The platform also supports competition registration, judging, appeals, and results. Companies have review and versioning workflows, with controls over what becomes public. This screenshot is from the actual HRI application. It demonstrates a working software interaction. Physical robot testing and the wellness outcomes remain the next stage of validation.''')
heading(s,'04 / A WORKING SOFTWARE PILOT','One platform supports\nthe journey from learning to results.')
rect(s,72,355,984,411,WHITE,18)
picture(s,90,370,948,362,'hri.png')
text(s,96,738,930,30,'Actual HRI interface • recorded simulation, not physical robot evidence',18,MUTED)
for y,n,title,body in [(370,'01','Learn','Robot discovery + lessons'),(501,'02','Practise','Saved programs + HRI runs'),(632,'03','Compete','Entries + judging + results')]:
    circle(s,1110,y+4,58,GREEN);text(s,1110,y+17,58,39,n,23,INK,True,'center')
    text(s,1190,y,338,51,title,36,INK,True)
    text(s,1190,y+59,328,67,body,25,MUTED)

s=new('Start with one challenge and grow together',30,
'''Our next step is a focused pilot: one company partner, one learning community, and one wellness challenge. We would measure completed solutions, improvement between rounds, and feedback from participants and the venue. We are looking for partners to shape and test that first challenge with us. Companies bring challenges, learners bring ideas, and competition turns those ideas into progress for Thai robotics and better everyday living.''',True)
text(s,72,124,1460,178,'One challenge.\nA community that keeps improving.',67,WHITE,True)
for x,n,t in [(72,'1','Company partner'),(568,'1','Learning community'),(1064,'1','Wellness challenge')]:
    rect(s,x,365,464,215,'1B4033',20)
    text(s,x+28,392,400,100,n,76,GREEN,True)
    text(s,x+28,510,416,46,t,30,WHITE,True)
text(s,77,622,1450,54,'Measure: completed solutions • improvement • participant feedback',28,'CEE0D1')
text(s,76,722,1455,74,'Help us shape the first pilot challenge.',45,GREEN,True)

assert len(slides)==6 and sum(s['seconds'] for s in slides)==240
prs=Presentation();prs.slide_width=Inches(16);prs.slide_height=Inches(9)
def rgb(c):return RGBColor.from_string(c)
def emu(px):return Inches(px/100)
for spec in slides:
    slide=prs.slides.add_slide(prs.slide_layouts[6]);slide.background.fill.solid();slide.background.fill.fore_color.rgb=rgb(spec['bg'])
    for e in spec['els']:
        x,y,w,h=[emu(e[k]) for k in ['x','y','w','h']]
        if e['kind']=='text':
            shape=slide.shapes.add_textbox(x,y,w,h);tf=shape.text_frame;tf.clear();tf.word_wrap=True
            tf.margin_left=tf.margin_right=tf.margin_top=tf.margin_bottom=0
            tf.vertical_anchor=MSO_ANCHOR.TOP
            from pptx.enum.text import PP_ALIGN
            for i,line in enumerate(e['t'].split('\n')):
                p=tf.paragraphs[0] if i==0 else tf.add_paragraph();p.text=line
                p.font.name='Segoe UI';p.font.size=Pt(e['size']*.72);p.font.bold=e['bold'];p.font.color.rgb=rgb(e['c'])
                p.line_spacing=1.06;p.space_before=Pt(0);p.space_after=Pt(0)
                p.alignment={'left':PP_ALIGN.LEFT,'right':PP_ALIGN.RIGHT,'center':PP_ALIGN.CENTER}[e['align']]
        elif e['kind']=='image':
            path=OUT/'assets'/e['name'];iw,ih=Image.open(path).size;scale=min(e['w']/iw,e['h']/ih)
            slide.shapes.add_picture(str(path),emu(e['x']+(e['w']-iw*scale)/2),emu(e['y']+(e['h']-ih*scale)/2),width=emu(iw*scale),height=emu(ih*scale))
        else:
            typ=MSO_SHAPE.OVAL if e['kind']=='circle' else {'right':MSO_SHAPE.RIGHT_ARROW,'left':MSO_SHAPE.LEFT_ARROW,'up':MSO_SHAPE.UP_ARROW,'down':MSO_SHAPE.DOWN_ARROW}[e['direction']] if e['kind']=='arrow' else MSO_SHAPE.ROUNDED_RECTANGLE if e.get('r') else MSO_SHAPE.RECTANGLE
            shape=slide.shapes.add_shape(typ,x,y,w,h);shape.fill.solid();shape.fill.fore_color.rgb=rgb(e['c']);shape.line.fill.background()
            if typ==MSO_SHAPE.ROUNDED_RECTANGLE:shape.adjustments[0]=.08
    slide.notes_slide.notes_text_frame.text=f"SLIDE {len(prs.slides)} — {spec['seconds']} seconds\n\n{spec['notes']}"
prs.core_properties.title='HumanoidTH — Competition for Better Living'
prs.core_properties.subject='Four-minute presentation: Thai robotics, companies, learners, competition and wellness'
prs.core_properties.author='HumanoidTH'
prs.save(OUT/'HumanoidTH-Competition-for-Better-Living.pptx')

def render(e):
    st=f"left:{e['x']}px;top:{e['y']}px;width:{e['w']}px;height:{e['h']}px;"
    if e['kind']=='text':return f'<div class="el text" style="{st}font-size:{e["size"]}px;color:#{e["c"]};font-weight:{700 if e["bold"] else 400};text-align:{e["align"]}">{html.escape(e["t"])}</div>'
    if e['kind']=='image':
        data=base64.b64encode((OUT/'assets'/e['name']).read_bytes()).decode()
        return f'<img class="el" style="{st}object-fit:contain" src="data:image/png;base64,{data}" alt="Actual HumanoidTH HRI interface">'
    if e['kind']=='arrow':
        path={'right':'0,8 32,8 32,0 50,15 32,30 32,22 0,22','left':'50,8 18,8 18,0 0,15 18,30 18,22 50,22','down':'18,0 32,0 32,13 45,13 25,30 5,13 18,13','up':'18,30 32,30 32,17 45,17 25,0 5,17 18,17'}[e['direction']]
        return f'<svg class="el" style="{st}" viewBox="0 0 50 30"><polygon points="{path}" fill="#{e["c"]}"/></svg>'
    return f'<div class="el" style="{st}background:#{e["c"]};border-radius:{"50%" if e["kind"]=="circle" else str(e.get("r",0))+"px"}"></div>'
pages=''.join(f'<section class="slide" aria-label="Slide {i+1}: {html.escape(s["title"])}" style="background:#{s["bg"]}">'+''.join(render(e) for e in s['els'])+'</section>' for i,s in enumerate(slides))
style='''*{box-sizing:border-box}body{margin:0;background:#071a14;font-family:"Segoe UI",Arial,sans-serif}.slide{position:relative;width:1600px;height:900px;overflow:hidden;break-after:page}.el{position:absolute}.text{white-space:pre-wrap;line-height:1.06}#controls{position:fixed;bottom:12px;right:18px;z-index:20;display:flex;gap:8px}button{background:#173E32;color:white;border:1px solid #6f9d80;padding:10px 16px;border-radius:8px;cursor:pointer;font:15px "Segoe UI"}@media screen{body{overflow:hidden}.slide{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(var(--scale));display:none}.slide.active{display:block}}@media print{@page{size:1600px 900px;margin:0}body{background:white}#controls{display:none}.slide:last-child{break-after:auto}}'''
script='''let index=0;const slides=[...document.querySelectorAll('.slide')];function show(i){index=Math.max(0,Math.min(5,i));slides.forEach((s,n)=>s.classList.toggle('active',n===index));document.title=`HumanoidTH — ${index+1}/6`}function fit(){document.documentElement.style.setProperty('--scale',Math.min(innerWidth/1600,innerHeight/900))}function fullscreen(){document.documentElement.requestFullscreen?.()}document.addEventListener('keydown',e=>{if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();show(index+1)}if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();show(index-1)}if(e.key==='Home')show(0);if(e.key==='End')show(5);if(e.key.toLowerCase()==='f')fullscreen()});window.addEventListener('resize',fit);fit();show(0);'''
(OUT/'HumanoidTH-presentation.html').write_text(f'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HumanoidTH</title><style>{style}</style><body>{pages}<nav id="controls"><button onclick="show(index-1)">← Previous</button><button onclick="show(index+1)">Next →</button><button onclick="fullscreen()">Fullscreen</button></nav><script>{script}</script></body></html>',encoding='utf-8')
notes=['# HumanoidTH — four-minute speaker notes','English deck · 6 slides · 4:00 total','Open the PowerPoint for editable slides and presenter notes. The HTML version works offline; use arrow keys and F for fullscreen.','']
elapsed=0
for i,s in enumerate(slides):
    end=elapsed+s['seconds'];notes += [f'## {i+1}. {s["title"]}',f'**{elapsed//60}:{elapsed%60:02d}–{end//60}:{end%60:02d} ({s["seconds"]} seconds)**','',s['notes'],''];elapsed=end
notes += ['## Evidence and boundaries','The HRI screenshot was captured from the local working application. The first wellness competition and partners are proposals, not existing partnerships. Current HRI timings describe simulated interactions, not real robot speed or health improvements.','Project references: Thai_Robotics_Demo_First_Roadmap.md (M01); docs/platform-pilot.md; docs/project-verification.md.','Rehearse once at a comfortable pace; preserve the total 4-minute timing by shortening examples before cutting the wellness explanation.']
(OUT/'Speaker-notes.md').write_text('\n'.join(notes),encoding='utf-8')
(OUT/'layout.json').write_text(json.dumps(slides,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Created {len(slides)} slides, {sum(s["seconds"] for s in slides)} seconds; {sum(len(s["notes"].split()) for s in slides)} spoken words.')
