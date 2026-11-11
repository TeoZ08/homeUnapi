/* Capivara UnAPI — interação por sprites V05, isolada da navegação do portal. */
(() => {
  'use strict';
  const targets = [...document.querySelectorAll('.home-options .home-option')];
  const logosPlatform = document.querySelector('.home-page .institutional-footer');
  const platforms = logosPlatform ? [...targets, logosPlatform] : targets;
  if (!document.body.classList.contains('home-page') || targets.length === 0) return;

  const sequences = {
    andar:  [0,1,2,3,4,5,6,7],
    parado: [0,1,2,3],
    acenar: [0,1,2,1,0,1],
    sentar: [0,1,2,3],
    dormir: [0,1,2,3,2,1]
  };
  const fps = {andar:12, parado:3, acenar:7, sentar:5, dormir:3};
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const imageCache = new Map();
  const path = (state, direction, index) =>
    `img/capivara/${direction}/${state}/${state}_${String(index + 1).padStart(2,'0')}.png`;

  const pet = document.createElement('div');
  pet.className = 'unapi-pet';
  pet.setAttribute('role', 'button');
  pet.setAttribute('tabindex', '0');
  pet.setAttribute('aria-label', 'Capivara da UnAPI: arraste para Atividades práticas, Vídeos ou a borda superior da caixa de logos; pressione Enter para acenar');
  pet.setAttribute('title', 'Arraste-me até Atividades práticas, Vídeos ou a caixa das logos!');
  const sprite = document.createElement('img');
  sprite.className = 'unapi-pet__sprite';
  sprite.alt = '';
  sprite.draggable = false;
  sprite.src = path('parado', 'right', 0);
  const shadow = document.createElement('span');
  shadow.className = 'unapi-pet__shadow';
  shadow.setAttribute('aria-hidden', 'true');
  pet.append(sprite, shadow);
  document.body.appendChild(pet);

  const toolbar = document.createElement('div');
  toolbar.className = 'unapi-pet-controls';
  toolbar.setAttribute('role','group');
  toolbar.setAttribute('aria-label','Comportamento da mascote');
  toolbar.innerHTML = `<button class="unapi-pet-controls__follow" type="button" aria-pressed="false" title="A capivara segue o cursor">Seguir cursor</button>
    <button class="unapi-pet-controls__pause" type="button" aria-pressed="false" title="Pausar animação da capivara">Pausar</button>`;
  document.body.appendChild(toolbar);
  const followButton = toolbar.querySelector('.unapi-pet-controls__follow');
  const pauseButton = toolbar.querySelector('.unapi-pet-controls__pause');

  let x = window.innerWidth * .78;
  let foot = window.innerHeight - 24;
  let vy = 0;
  let dir = 'left';
  let animation = 'parado', frame = 0, frameTimer = 0;
  let action = null, actionEnd = 0;
  let mode = 'explore', paused = false, dragging = false;
  let dragPointer = null, dragDeltaX = 0, dragDeltaY = 0, downX = 0, downY = 0;
  let lastPointerX = null, nextWalkTarget = window.innerWidth * .18;
  let restUntil = 0, restStarted = 0, nextDecision = performance.now() + 4200, platformStayUntil = 0;
  let support = null, hop = null, hoverTarget = null;
  let prev = performance.now();
  let lastPaint = '';

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const width = () => pet.offsetWidth || 104;
  const height = () => pet.offsetHeight || 129;
  const ground = () => window.innerHeight - 20;
  const between = (a,b) => a + Math.random()*(b-a);
  const available = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 45 && r.height > 30 && r.bottom > 0 && r.top < innerHeight;
  };
  // Na caixa das logos, os pés ficam inteiramente acima da borda (não sobre os logotipos).
  const surface = (el) => el.getBoundingClientRect().top + (el === logosPlatform ? -2 : 5);
  const canStand = (el, centerX) => {
    const r=el.getBoundingClientRect();
    return available(el) && centerX >= r.left + 16 && centerX <= r.right - 16;
  };
  const adjustedX = (centerX) => clamp(centerX, width()/2 + 6, innerWidth - width()/2 - 6);
  const setAnim = (next) => {
    if (animation === next) return;
    animation = next; frame = 0; frameTimer = 0;
  };
  const warm = (src) => {
    if (imageCache.has(src)) return;
    const img = new Image(); img.decoding = 'async'; img.src = src;
    imageCache.set(src,img);
  };
  // Pré-carregamento leve: a sequência atual primeiro; as demais são carregadas sob demanda.
  sequences.parado.forEach(i => warm(path('parado','right',i)));
  function draw() {
    const frameIndex = sequences[animation][Math.min(frame, sequences[animation].length-1)];
    const src = path(animation,dir,frameIndex);
    // Mantém o último quadro visível até a próxima imagem chegar da rede.
    warm(src);
    const ready = imageCache.get(src);
    if (src !== lastPaint && ready.complete && ready.naturalWidth > 0) {
      sprite.src = src;
      lastPaint = src;
    }
    pet.style.transform = `translate3d(${Math.round(x - width()/2)}px, ${Math.round(foot - height())}px, 0)`;
    pet.classList.toggle('unapi-pet--dragging', dragging);
    pet.classList.toggle('unapi-pet--on-card', support !== null);
    pet.classList.toggle('unapi-pet--airborne', !support && foot < ground() - 6);
  }
  function wave(now) {
    action = 'acenar'; actionEnd = now + 1000;
    setAnim('acenar');
  }
  function releaseHover() {
    if (hoverTarget) hoverTarget.classList.remove('unapi-pet-platform--target');
    hoverTarget = null;
  }
  function cardUnderPet() {
    const left = x - width()*.25, right = x + width()*.25;
    const top = foot - height()*.90, bottom = foot + 8;
    return platforms.find(el => {
      if(!available(el))return false;
      const r = el.getBoundingClientRect();
      const horizontal = right > r.left+12 && left < r.right-12;
      return horizontal && bottom >= r.top-54 && top <= r.bottom;
    }) || null;
  }
  function animateHopToCard(el, now) {
    const r = el.getBoundingClientRect();
    const centerX = clamp(x, r.left+width()*.40, r.right-width()*.40);
    x = adjustedX(centerX);
    hop = {el, from:foot, to:r.top+5, start:now, length:380};
    support = null; vy=0;
    platformStayUntil = now + 4200;
    action = null;
  }
  pet.addEventListener('pointerdown', e => {
    if(e.button !== 0) return;
    e.preventDefault();e.stopPropagation();
    dragging=true;dragPointer=e.pointerId;
    downX=e.clientX;downY=e.clientY;
    dragDeltaX = x-e.clientX; dragDeltaY=foot-e.clientY;
    hop=null;support=null;vy=0;
    pet.setPointerCapture(e.pointerId);
  });
  // Eventos globais mantêm o arraste mesmo quando a física reposiciona a
  // mascote e o ponteiro sai de seus limites (por exemplo, ao tocar o rodapé).
  window.addEventListener('pointermove', e => {
    if(!dragging || e.pointerId !== dragPointer)return;
    e.preventDefault();
    x=adjustedX(e.clientX+dragDeltaX);
    foot=clamp(e.clientY+dragDeltaY, 68, ground());
    dir=e.clientX >= downX ? 'right' : 'left';
    const candidate=cardUnderPet();
    // A caixa institucional é sólida: o pet nunca atravessa a área das marcas no arraste.
    if(candidate === logosPlatform) foot = Math.min(foot, surface(logosPlatform));
    if(candidate !== hoverTarget){releaseHover();hoverTarget=candidate;if(candidate)candidate.classList.add('unapi-pet-platform--target');}
    setAnim('parado'); draw();
  });
  const endDrag = e => {
    if(!dragging || e.pointerId !== dragPointer) return;
    e.preventDefault();
    dragging=false;dragPointer=null;
    const candidate = cardUnderPet();
    releaseHover();
    const now=performance.now();
    if(candidate) animateHopToCard(candidate,now);
    else if(Math.abs(e.clientX-downX)+Math.abs(e.clientY-downY)<8)wave(now);
    else vy=0;
    nextWalkTarget=x;
    nextDecision=now+3200;
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', e => {
    if(dragging && dragPointer === e.pointerId){ dragging=false;dragPointer=null;releaseHover(); vy=0; }
  });
  pet.addEventListener('keydown', e => {
    if(e.key==='Enter' || e.key===' '){e.preventDefault();wave(performance.now());}
  });
  window.addEventListener('pointermove',e=>{
    if(e.pointerType==='mouse')lastPointerX=e.clientX;
  },{passive:true});
  followButton.addEventListener('click',() => {
    mode = mode==='follow'?'explore':'follow';
    followButton.setAttribute('aria-pressed',String(mode==='follow'));
    followButton.textContent=mode==='follow'?'Explorar sozinha':'Seguir cursor';
    nextDecision=performance.now()+3500;
    action=null;
  });
  pauseButton.addEventListener('click',() => {
    paused=!paused;
    pauseButton.setAttribute('aria-pressed',String(paused));
    pauseButton.textContent=paused?'Continuar':'Pausar';
  });
  window.addEventListener('resize',() => {
    x=adjustedX(x);
    if(support && canStand(support,x))foot=surface(support);
    else {
      support=null;foot=Math.min(foot,ground());
      if(logosPlatform && canStand(logosPlatform,x) && foot>surface(logosPlatform)){
        foot=surface(logosPlatform);support=logosPlatform;vy=0;
      }
    }
    draw();
  },{passive:true});

  // A área da caixa das logos já existe na primeira pintura: comece sobre ela,
  // evitando que a mascote surja sobre os logotipos na carga inicial.
  if (logosPlatform && canStand(logosPlatform, x) && foot > surface(logosPlatform)) {
    foot = surface(logosPlatform);
    support = logosPlatform;
  }

  function walk(dt,now) {
    if (reducedMotion.matches) return false;
    let destination = x;
    if(mode==='follow') {
      destination=lastPointerX == null ? x : adjustedX(lastPointerX);
    } else if(support === logosPlatform) {
      // Caminha de ponta a ponta sobre a caixa, sem descer para a área das marcas.
      const r=logosPlatform.getBoundingClientRect();
      const edge=width()/2+12;
      const left=r.left+edge, right=r.right-edge;
      if(now < platformStayUntil) {
        destination=clamp((r.left+r.right)/2,left,right);
      } else {
        if(now >= nextDecision) {
          nextWalkTarget=between(left,right);
          if(Math.random()<.23){restStarted=now;restUntil=now+between(1200,3000);}
          nextDecision=now+between(2300,4300);
        }
        destination=now<restUntil?x:clamp(nextWalkTarget,left,right);
      }
    } else if(support && now < platformStayUntil) {
      const r=support.getBoundingClientRect();destination=clamp((r.left+r.right)/2,r.left+26,r.right-26);
    } else {
      if(now >= nextDecision) {
        if(Math.random()<.33){restStarted=now;restUntil=now+between(1800,4600);nextWalkTarget=x;}
        else nextWalkTarget=adjustedX(between(width(),innerWidth-width()));
        nextDecision=now+between(3500,6800);
      }
      destination=now<restUntil?x:nextWalkTarget;
    }
    const d=destination-x;
    const threshold = mode==='follow'?14:5;
    const moving=Math.abs(d)>threshold;
    if(moving){
      const speed=(mode==='follow'?175:104);
      const step=clamp(d,-speed*dt,speed*dt);
      x=adjustedX(x+step);dir=step<0?'left':'right';
    }
    return moving;
  }
  function update(now) {
    const dt = clamp((now-prev)/1000,0,.045);prev=now;
    if(!paused && !dragging) {
      if(hop){
        const t=clamp((now-hop.start)/hop.length,0,1);
        const ease=1-Math.pow(1-t,3);
        foot=hop.from+(surface(hop.el)-hop.from)*ease-17*Math.sin(Math.PI*t);
        if(t===1){support=hop.el;hop=null;foot=surface(support);vy=0;}
      }
      if(support && !hop) {
        if(canStand(support,x)) foot=surface(support);
        else {support=null;vy=0;}
      }
      const moving=walk(dt,now);
      if(support && !canStand(support,x)) {support=null;vy=15;}
      if(!support && !hop){
        const previous=foot;
        vy += 1550*dt;
        foot += vy*dt;
        if(vy>0){
          const landing=platforms.filter(el=>canStand(el,x)).sort((a,b)=>surface(a)-surface(b))
            .find(el=>previous<=surface(el)+3 && foot>=surface(el));
          if(landing){support=landing;foot=surface(landing);vy=0;platformStayUntil=now+3200;}
        }
        if(foot>=ground()){foot=ground();vy=0;}
      }
      if(action && now>=actionEnd)action=null;
      if(action){setAnim(action);}
      else if(hop){setAnim('andar');}
      else if(moving){setAnim('andar');}
      else if(mode==='explore' && now<restUntil){setAnim(now-restStarted<800?'sentar':'dormir');}
      else setAnim('parado');
      frameTimer+=dt;
      const delay=1/fps[animation];
      while(frameTimer>=delay){frameTimer-=delay;frame=animation==='sentar'?Math.min(frame+1,sequences[animation].length-1):(frame+1)%sequences[animation].length;}
    }
    if(reducedMotion.matches && !dragging && !hop && !action){setAnim('parado');frame=0;}
    draw();
    requestAnimationFrame(update);
  }
  draw();requestAnimationFrame(update);
})();
