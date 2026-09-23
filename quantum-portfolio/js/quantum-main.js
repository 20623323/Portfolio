gsap.registerPlugin(ScrollTrigger);

/* ============ CUSTOM CURSOR + TRAIL ============ */
(function(){
  const dot=document.querySelector('.cursor'),ring=document.querySelector('.cursor-ring');
  let mx=innerWidth/2,my=innerHeight/2,rx=mx,ry=my;
  const trail=[];const trailCount=12;
  for(let i=0;i<trailCount;i++){
    const d=document.createElement('div');
    d.style.cssText='position:fixed;width:6px;height:6px;border-radius:50%;pointer-events:none;z-index:9997;opacity:0;transition:opacity .3s;background:var(--cyan);mix-blend-mode:screen;';
    document.body.appendChild(d);trail.push({el:d,x:mx,y:my});
  }
  addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;dot.style.left=mx+'px';dot.style.top=my+'px';});
  (function loop(){
    rx+=(mx-rx)*.14;ry+=(my-ry)*.14;
    ring.style.left=rx+'px';ring.style.top=ry+'px';
    trail.forEach((t,i)=>{
      const prev=i===0?{x:mx,y:my}:trail[i-1];
      t.x+=(prev.x-t.x)*.28;t.y+=(prev.y-t.y)*.28;
      t.el.style.left=t.x+'px';t.el.style.top=t.y+'px';
      t.el.style.opacity=1-(i/trailCount)*.8;
      t.el.style.width=t.el.style.height=(6-i*.35)+'px';
      t.el.style.background=i%2===0?'var(--cyan)':'var(--violet)';
    });
    requestAnimationFrame(loop);
  })();
  document.querySelectorAll('a,.skill-card,.proj-card,.achieve-card,.measure-btn,.btn').forEach(el=>{
    el.addEventListener('mouseenter',()=>document.body.classList.add('hovering'));
    el.addEventListener('mouseleave',()=>document.body.classList.remove('hovering'));
  });
})();

/* ============ CLICK PARTICLES ============ */
(function(){
  const canvas=document.getElementById('click-canvas');
  const ctx=canvas.getContext('2d');
  canvas.width=innerWidth;canvas.height=innerHeight;
  addEventListener('resize',()=>{canvas.width=innerWidth;canvas.height=innerHeight;});
  const particles=[];
  const colors=['#4ef3e0','#a06bff','#ff5edb','#ffc46b'];
  addEventListener('click',e=>{
    for(let i=0;i<20;i++){
      const angle=Math.random()*Math.PI*2;
      const speed=2+Math.random()*4;
      particles.push({x:e.clientX,y:e.clientY,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1,color:colors[Math.floor(Math.random()*colors.length)],size:2+Math.random()*3});
    }
  });
  (function draw(){
    requestAnimationFrame(draw);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];
      p.x+=p.vx;p.y+=p.vy;p.vy+=.08;p.life-=.018;
      if(p.life<=0){particles.splice(i,1);continue;}
      ctx.globalAlpha=p.life;
      ctx.fillStyle=p.color;
      ctx.shadowBlur=10;ctx.shadowColor=p.color;
      ctx.beginPath();ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;ctx.shadowBlur=0;
  })();
})();

/* ============ HERO: QUANTUM SCENE ============ */
let heroScene,heroCam,heroRenderer,qubitGroups=[],particleSystem,waveLines=[],mouseX=0,mouseY=0;

function initHero(){
  const canvas=document.getElementById('quantum-canvas');
  heroRenderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
  heroRenderer.setPixelRatio(Math.min(devicePixelRatio,2));
  heroRenderer.setSize(innerWidth,innerHeight);
  heroScene=new THREE.Scene();
  heroScene.fog=new THREE.FogExp2(0x05060f,0.055);
  heroCam=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,100);
  heroCam.position.set(0,0,14);

  const N=2200,pos=new Float32Array(N*3),col=new Float32Array(N*3);
  const palette=[new THREE.Color(0x4ef3e0),new THREE.Color(0xa06bff),new THREE.Color(0xff5edb),new THREE.Color(0xffffff)];
  for(let i=0;i<N;i++){
    const r=6+Math.random()*26,th=Math.random()*Math.PI*2,ph=Math.acos(2*Math.random()-1);
    pos[i*3]=r*Math.sin(ph)*Math.cos(th);pos[i*3+1]=r*Math.sin(ph)*Math.sin(th)*.6;pos[i*3+2]=r*Math.cos(ph);
    const c=palette[Math.floor(Math.random()*palette.length)];
    col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  geo.setAttribute('color',new THREE.BufferAttribute(col,3));
  particleSystem=new THREE.Points(geo,new THREE.PointsMaterial({size:.07,vertexColors:true,transparent:true,opacity:.85,depthWrite:false,blending:THREE.AdditiveBlending}));
  heroScene.add(particleSystem);

  const bloch=new THREE.Group();
  const sphereWire=new THREE.Mesh(new THREE.SphereGeometry(3.4,24,24),new THREE.MeshBasicMaterial({color:0xa06bff,wireframe:true,transparent:true,opacity:.12}));
  bloch.add(sphereWire);
  [0x4ef3e0,0xff5edb,0xa06bff].forEach((c,i)=>{
    const ring=new THREE.Mesh(new THREE.TorusGeometry(3.4,.008,8,120),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.35}));
    ring.rotation.x=i===0?Math.PI/2:i===1?Math.PI/4:-Math.PI/4;
    bloch.add(ring);
  });
  bloch.position.set(0,0.4,-2);
  heroScene.add(bloch);window._bloch=bloch;

  function makeQubit(x,y,z,scale,hue){
    const g=new THREE.Group();
    const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.5,1),new THREE.MeshBasicMaterial({color:hue,wireframe:true,transparent:true,opacity:.9}));
    g.add(core);
    const orbits=[];
    for(let i=0;i<3;i++){
      const o=new THREE.Group();
      const ring=new THREE.Mesh(new THREE.TorusGeometry(1.1+i*.35,.006,8,90),new THREE.MeshBasicMaterial({color:hue,transparent:true,opacity:.45}));
      o.add(ring);
      const e=new THREE.Mesh(new THREE.SphereGeometry(.07,10,10),new THREE.MeshBasicMaterial({color:0xffffff}));
      e.position.x=1.1+i*.35;
      const pivot=new THREE.Group();pivot.add(e);o.add(pivot);
      o.rotation.x=Math.random()*Math.PI;o.rotation.y=Math.random()*Math.PI;
      o.userData={pivot,speed:.8+Math.random()*1.4};
      orbits.push(o);g.add(o);
    }
    g.position.set(x,y,z);g.scale.setScalar(scale);
    g.userData={orbits,core,baseY:y,phase:Math.random()*Math.PI*2};
    heroScene.add(g);qubitGroups.push(g);
  }
  makeQubit(-5.6,1.6,-1,1.0,0x4ef3e0);
  makeQubit(5.8,2.2,-2,.85,0xff5edb);
  makeQubit(-4.2,-2.6,0,.7,0xa06bff);
  makeQubit(4.6,-2.4,-1,.75,0x4ef3e0);
  makeQubit(0,3.6,-4,.9,0xa06bff);
  makeQubit(-2,4,-3,.6,0xff5edb);
  makeQubit(3,-3.5,-2,.65,0xa06bff);

  const beamMat=new THREE.LineBasicMaterial({color:0xa06bff,transparent:true,opacity:.28});
  const pairs=[[0,1],[2,3],[0,2],[1,3],[4,5],[5,6]];
  window._beams=pairs.map(p=>{
    const g=new THREE.BufferGeometry().setFromPoints([qubitGroups[p[0]].position,qubitGroups[p[1]].position]);
    const l=new THREE.Line(g,beamMat.clone());
    heroScene.add(l);return l;
  });

  for(let i=0;i<7;i++){
    const pts=[],w=22;
    for(let x=0;x<=w*4;x++)pts.push(new THREE.Vector3(x/4-w/2,-4.6,0));
    const wg=new THREE.BufferGeometry().setFromPoints(pts);
    const wl=new THREE.Line(wg,new THREE.LineBasicMaterial({color:[0x4ef3e0,0xa06bff,0xff5edb][i%3],transparent:true,opacity:.18}));
    wl.position.z=-4+i*1.3;wl.userData={phase:i*1.3};
    heroScene.add(wl);waveLines.push(wl);
  }

  addEventListener('mousemove',e=>{mouseX=(e.clientX/innerWidth-.5)*2;mouseY=(e.clientY/innerHeight-.5)*2;});
  addEventListener('resize',()=>{heroCam.aspect=innerWidth/innerHeight;heroCam.updateProjectionMatrix();heroRenderer.setSize(innerWidth,innerHeight);});
}

let t=0;
function animateHero(){
  requestAnimationFrame(animateHero);
  t+=.008;
  particleSystem.rotation.y+=.0006;
  particleSystem.rotation.x=Math.sin(t*.4)*.04;
  qubitGroups.forEach(g=>{
    g.position.y=g.userData.baseY+Math.sin(t*1.4+g.userData.phase)*.35;
    g.userData.core.rotation.x+=.006;g.userData.core.rotation.y+=.009;
    g.userData.orbits.forEach(o=>{o.userData.pivot.rotation.z+=.02*o.userData.speed;});
  });
  if(window._bloch){window._bloch.rotation.y+=.0025;window._bloch.rotation.x=Math.sin(t*.5)*.1;}
  waveLines.forEach(w=>{
    const p=w.geometry.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i);p.setY(i,Math.sin(x*1.1+t*3+w.userData.phase)*.28*Math.exp(-Math.abs(x)*.12));}
    p.needsUpdate=true;
  });
  if(window._beams)window._beams.forEach((b,i)=>{b.material.opacity=.18+Math.sin(t*2+i)*.12;});
  heroCam.position.x+=(mouseX*1.6-heroCam.position.x)*.04;
  heroCam.position.y+=(-mouseY*1.1-heroCam.position.y)*.04;
  heroCam.lookAt(0,0,-1);
  heroRenderer.render(heroScene,heroCam);
}

/* ============ BG PARTICLES ============ */
function initBg(){
  const canvas=document.getElementById('bg-canvas');
  const r=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
  r.setPixelRatio(Math.min(devicePixelRatio,2));r.setSize(innerWidth,innerHeight);
  const s=new THREE.Scene();const c=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,100);c.position.z=10;
  const n=500,p=new Float32Array(n*3);
  for(let i=0;i<n;i++){p[i*3]=(Math.random()-.5)*24;p[i*3+1]=(Math.random()-.5)*24;p[i*3+2]=(Math.random()-.5)*10;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
  const pts=new THREE.Points(g,new THREE.PointsMaterial({size:.05,color:0x4ef3e0,transparent:true,opacity:.35,depthWrite:false}));
  s.add(pts);
  addEventListener('resize',()=>{c.aspect=innerWidth/innerHeight;c.updateProjectionMatrix();r.setSize(innerWidth,innerHeight);});
  (function anim(){requestAnimationFrame(anim);pts.rotation.y+=.0004;pts.rotation.x+=.0002;r.render(s,c);})();
}

/* ============ GSAP ANIMATIONS ============ */
function initGsap(){
  const track=document.getElementById('marquee-track');
  track.innerHTML+=track.innerHTML;
  gsap.to(track,{x:'-50%',duration:26,ease:'none',repeat:-1});

  const tl=gsap.timeline({delay:.15});
  tl.to('.hero-eyebrow',{opacity:1,duration:1,ease:'power2.out'})
    .to('.hero-title .line span',{y:0,duration:1.15,stagger:.14,ease:'power4.out'},'-=.6')
    .to('.hero-sub',{opacity:1,y:0,duration:1,ease:'power2.out'},'-=.6')
    .to('.hero-cta',{opacity:1,duration:1,ease:'power2.out'},'-=.6')
    .to('.scroll-hint',{opacity:1,duration:1},'-=.4');

  gsap.to('.hero-content',{opacity:0,y:-120,ease:'none',scrollTrigger:{trigger:'#hero',start:'top top',end:'85% top',scrub:true}});

  document.querySelectorAll('.reveal').forEach(el=>{
    gsap.to(el,{opacity:1,y:0,duration:1.1,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 86%'}});
  });

  document.querySelectorAll('section[id], header[id]').forEach(sec=>{
    ScrollTrigger.create({trigger:sec,start:'top 45%',onToggle:self=>{
      if(self.isActive){document.querySelectorAll('.nav-links a').forEach(a=>{a.style.color=a.getAttribute('href')==='#'+sec.id?'var(--cyan)':'';});}
    }});
  });

  document.querySelectorAll('.skill-card').forEach(card=>{
    card.addEventListener('mousemove',e=>{const r=card.getBoundingClientRect();card.style.setProperty('--mx',(e.clientX-r.left)+'px');card.style.setProperty('--my',(e.clientY-r.top)+'px');});
  });
}

/* ============ 3D TILT CARDS ============ */
(function(){
  document.querySelectorAll('.tilt-card').forEach(card=>{
    card.addEventListener('mousemove',e=>{
      const r=card.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width-.5;
      const y=(e.clientY-r.top)/r.height-.5;
      card.style.transform=`perspective(800px) rotateY(${x*12}deg) rotateX(${-y*12}deg) translateY(-8px)`;
    });
    card.addEventListener('mouseleave',()=>{card.style.transform='perspective(800px) rotateY(0) rotateX(0) translateY(0)';});
  });
})();

/* ============ WAVEFUNCTION COLLAPSE ============ */
(function(){
  const btn=document.getElementById('measure-btn');
  const eq=document.querySelector('.state-eq');
  if(!btn||!eq)return;
  const states=['|developer⟩','|researcher⟩','|dreamer⟩'];
  const colors=['var(--cyan)','var(--violet)','var(--pink)'];
  let collapsed=false;
  btn.addEventListener('click',()=>{
    if(collapsed){eq.innerHTML='|ψ⟩ = <span class="amp">α</span>|<span class="basis">developer</span>⟩ + <span class="amp">β</span>|<span class="basis">researcher</span>⟩ + <span class="amp">γ</span>|<span class="basis">dreamer</span>⟩';eq.classList.remove('collapsed');btn.textContent='⚡ Collapse Wavefunction';collapsed=false;return;}
    let flicker=0;const iv=setInterval(()=>{
      eq.textContent='|ψ⟩ → '+states[Math.floor(Math.random()*states.length)];
      eq.style.color=colors[Math.floor(Math.random()*colors.length)];
      flicker++;
      if(flicker>12){clearInterval(iv);const pick=Math.floor(Math.random()*states.length);eq.textContent='|ψ⟩ = '+states[pick]+' ✦ MEASURED';eq.style.color=colors[pick];eq.classList.add('collapsed');btn.textContent='↺ Reset Superposition';collapsed=true;}
    },80);
  });
})();

/* ============ ANIMATED COUNTERS ============ */
(function(){
  document.querySelectorAll('.counter').forEach(el=>{
    const target=parseInt(el.dataset.target);
    ScrollTrigger.create({trigger:el,start:'top 90%',once:true,onEnter:()=>{
      gsap.to({v:0},{v:target,duration:2,ease:'power2.out',onUpdate:function(){el.textContent=Math.round(this.targets()[0].v)+'%';}});
    }});
  });
})();

/* ============ TYPEWRITER ============ */
(function(){
  const el=document.getElementById('typewriter');
  if(!el)return;
  const texts=['// Quantum Computing Engineer','// Superposition Specialist','// Qubit Whisperer','// Wavefunction Architect'];
  let ti=0,ci=0,deleting=false;
  function type(){
    const current=texts[ti];
    if(!deleting){
      el.textContent=current.slice(0,ci+1);ci++;
      if(ci>=current.length){setTimeout(()=>{deleting=true;type();},2000);return;}
    }else{
      el.textContent=current.slice(0,ci);ci--;
      if(ci<=0){deleting=false;ti=(ti+1)%texts.length;setTimeout(type,400);return;}
    }
    setTimeout(type,deleting?40:80);
  }
  setTimeout(type,2000);
})();

/* ============ PRELOADER ============ */
(function(){
  const status=document.getElementById('load-status'),bar=document.querySelector('#load-bar span');
  const steps=['Initializing qubits…','Preparing superposition…','Entangling particles…','Building Hilbert space…','Collapsing wavefunction…','Portfolio ready ✦'];
  let i=0;
  const iv=setInterval(()=>{
    bar.style.width=((i+1)/steps.length*100)+'%';status.textContent=steps[i];i++;
    if(i>=steps.length){clearInterval(iv);setTimeout(()=>{gsap.to('#preloader',{opacity:0,duration:.8,ease:'power2.inOut',onComplete:()=>{document.getElementById('preloader').style.display='none';}});},400);}
  },420);
})();

initHero();animateHero();initBg();initGsap();

/* ============ HAMBURGER ============ */
(function(){
  const btn=document.getElementById('hamburger'),menu=document.getElementById('mobile-menu');
  if(!btn||!menu)return;
  btn.addEventListener('click',()=>{btn.classList.toggle('active');menu.classList.toggle('open');document.body.style.overflow=menu.classList.contains('open')?'hidden':'';});
  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{btn.classList.remove('active');menu.classList.remove('open');document.body.style.overflow='';}));
})();

/* ============ BACK TO TOP ============ */
(function(){
  const btn=document.getElementById('back-to-top');
  if(!btn)return;
  addEventListener('scroll',()=>{btn.classList.toggle('visible',scrollY>600);});
  btn.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));
})();

/* ============ NAV SCROLL ============ */
(function(){
  const nav=document.getElementById('main-nav');
  if(!nav)return;
  addEventListener('scroll',()=>{nav.classList.toggle('scrolled',scrollY>80);});
})();
