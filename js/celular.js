/* Simulador educativo: nenhum controle altera o dispositivo real. */
(() => {
  "use strict";
  const get = (id) => document.getElementById(id);
  // Ícones Lucide SVG selecionados via Supericons; todos com viewBox coerente.
  const icons = {
    settings:"<path d=\"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915\" /> <circle cx=\"12\" cy=\"12\" r=\"3\" />",
    display:"<rect width=\"20\" height=\"14\" x=\"2\" y=\"3\" rx=\"2\" /> <line x1=\"8\" x2=\"16\" y1=\"21\" y2=\"21\" /> <line x1=\"12\" x2=\"12\" y1=\"17\" y2=\"21\" />",
    wifi:"<path d=\"M12 20h.01\" /> <path d=\"M2 8.82a15 15 0 0 1 20 0\" /> <path d=\"M5 12.859a10 10 0 0 1 14 0\" /> <path d=\"M8.5 16.429a5 5 0 0 1 7 0\" />",
    bluetooth:"<path d=\"m7 7 10 10-5 5V2l5 5L7 17\" />",
    sound:"<path d=\"M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z\" /> <path d=\"M16 9a5 5 0 0 1 0 6\" /> <path d=\"M19.364 18.364a9 9 0 0 0 0-12.728\" />",
    messages:"<path d=\"M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z\" />",
    clock:"<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"M12 6v6l4 2\" />",
    gallery:"<path d=\"m22 11-1.296-1.296a2.4 2.4 0 0 0-3.408 0L11 16\" /> <path d=\"M4 8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2\" /> <circle cx=\"13\" cy=\"7\" r=\"1\" fill=\"currentColor\" /> <rect x=\"8\" y=\"2\" width=\"14\" height=\"14\" rx=\"2\" />",
    workshops:"<path d=\"M12 21V7\" /> <path d=\"m16 12 2 2 4-4\" /> <path d=\"M22 6V4a1 1 0 0 0-1-1h-5a4 4 0 0 0-4 4 4 4 0 0 0-4-4H3a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h6a3 3 0 0 1 3 3 3 3 0 0 1 3-3h6a1 1 0 0 0 1-1v-1.3\" />",
    apps:"<path d=\"M12 3v18\" /> <path d=\"M3 12h18\" /> <rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\" />",
    info:"<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"M12 16v-4\" /> <path d=\"M12 8h.01\" />",
    camera:"<path d=\"M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z\" /> <circle cx=\"12\" cy=\"13\" r=\"3\" />",
    folder:"<path d=\"M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z\" />",
    calendar:"<path d=\"M8 2v4\" /> <path d=\"M16 2v4\" /> <rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\" /> <path d=\"M3 10h18\" /> <path d=\"M8 14h.01\" /> <path d=\"M12 14h.01\" /> <path d=\"M16 14h.01\" /> <path d=\"M8 18h.01\" /> <path d=\"M12 18h.01\" /> <path d=\"M16 18h.01\" />",
    qr:"<rect width=\"5\" height=\"5\" x=\"3\" y=\"3\" rx=\"1\" /> <rect width=\"5\" height=\"5\" x=\"16\" y=\"3\" rx=\"1\" /> <rect width=\"5\" height=\"5\" x=\"3\" y=\"16\" rx=\"1\" /> <path d=\"M21 16h-3a2 2 0 0 0-2 2v3\" /> <path d=\"M21 21v.01\" /> <path d=\"M12 7v3a2 2 0 0 1-2 2H7\" /> <path d=\"M3 12h.01\" /> <path d=\"M12 3h.01\" /> <path d=\"M12 16v.01\" /> <path d=\"M16 12h1\" /> <path d=\"M21 12v.01\" /> <path d=\"M12 21v-1\" />",
    share:"<circle cx=\"18\" cy=\"5\" r=\"3\" /> <circle cx=\"6\" cy=\"12\" r=\"3\" /> <circle cx=\"18\" cy=\"19\" r=\"3\" /> <line x1=\"8.59\" x2=\"15.42\" y1=\"13.51\" y2=\"17.49\" /> <line x1=\"15.41\" x2=\"8.59\" y1=\"6.51\" y2=\"10.49\" />",
    battery:"<path d=\"M10 10v4\" /> <path d=\"M14 10v4\" /> <path d=\"M22 14v-4\" /> <path d=\"M6 10v4\" /> <rect x=\"2\" y=\"6\" width=\"16\" height=\"12\" rx=\"2\" />",
    smartphone:"<rect width=\"14\" height=\"20\" x=\"5\" y=\"2\" rx=\"2\" ry=\"2\" /> <path d=\"M12 18h.01\" />",
    plane:"<path d=\"M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z\" />",
    accessibility:"<circle cx=\"16\" cy=\"4\" r=\"1\" /> <path d=\"m18 19 1-7-6 1\" /> <path d=\"m5 8 3-3 5.5 3-2.36 3.5\" /> <path d=\"M4.24 14.5a5 5 0 0 0 6.88 6\" /> <path d=\"M13.76 17.5a5 5 0 0 0-6.88-6\" />",
    bell:"<path d=\"M10.268 21a2 2 0 0 0 3.464 0\" /> <path d=\"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326\" />",
    contact:"<path d=\"M16 2v2\" /> <path d=\"M7 22v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2\" /> <path d=\"M8 2v2\" /> <circle cx=\"12\" cy=\"11\" r=\"3\" /> <rect x=\"3\" y=\"4\" width=\"18\" height=\"18\" rx=\"2\" />",
    store:"<path d=\"M16 10a4 4 0 0 1-8 0\" /> <path d=\"M3.103 6.034h17.794\" /> <path d=\"M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z\" />",
    shield:"<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\" /> <path d=\"m9 12 2 2 4-4\" />",
    moon:"<path d=\"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401\" />",
    flashlight:"<path d=\"M12 13v1\" /> <path d=\"M17 2a1 1 0 0 1 1 1v4a3 3 0 0 1-.6 1.8l-.6.8A4 4 0 0 0 16 12v8a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-8a4 4 0 0 0-.8-2.4l-.6-.8A3 3 0 0 1 6 7V3a1 1 0 0 1 1-1z\" /> <path d=\"M6 6h12\" />",
    phone:"<path d=\"M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384\" />",
    lock:"<circle cx=\"12\" cy=\"16\" r=\"1\" /> <rect x=\"3\" y=\"10\" width=\"18\" height=\"12\" rx=\"2\" /> <path d=\"M7 10V7a5 5 0 0 1 10 0v3\" />",
    search:"<path d=\"m21 21-4.34-4.34\" /> <circle cx=\"11\" cy=\"11\" r=\"8\" />"
  };
  const icon = (name) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (icons[name] || icons.info) + '</svg>';
  const lessons = [
    {title:"Encontre as Configurações",context:"",description:"Abra as Configurações do celular.",hints:["Procure uma engrenagem.","Ela aparece na tela inicial ou em Aplicativos.","Toque em Configurações."],route:"Início → Configurações."},
    {title:"Aumente as letras",context:"Maria quer ler melhor",description:"Encontre o tamanho do texto e aumente as letras.",hints:["Comece pelas Configurações.","Procure a categoria Tela.","Em Tamanho do texto, toque no +."],route:"Configurações → Tela → Tamanho do texto → +."}
  ];
  const initialSettings = () => ({textSize:1,brightness:65,volume:60,wifi:true,bluetooth:false});
  const state = {mode:window.matchMedia("(max-width:900px), (max-height:520px) and (pointer:coarse)").matches?"free":"guided",mission:0,completed:[false,false],hints:0,showRoute:false,screen:"home",history:[],settings:initialSettings()};
  let feedback = "";
  const phone = get("phone-screen");
  const announce = (message) => {get("celular-announcement").textContent = message;};
  const extras=window.createUnapiCelularModules({state,icon,section,row,app,openScreen,render,announce});
  function openScreen(screen) {
    if(state.screen !== screen){state.history.push(state.screen);state.screen=screen;}
    if(state.mode==="guided" && state.mission===0 && screen==="settings") finishMission();
    render();
    const heading=phone.querySelector(".celular-subhead h2");
    if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
  }
  function goBack(){state.screen=state.history.pop() || "home";render();}
  function goHome(){state.screen="home";state.history=[];render();}
  function finishMission(){
    if(state.completed[state.mission])return;
    state.completed[state.mission]=true;
    feedback=state.mission===0?"Configurações encontradas!":"Pronto! As letras ficaram maiores.";
    announce(feedback);
  }
  function startMission(index){
    state.mission=index;state.hints=0;state.showRoute=false;state.screen="home";state.history=[];
    state.settings=initialSettings();feedback="";render();
    announce("Atividade "+(index+1)+": "+lessons[index].title);
  }
  function resetAll(){extras.reset();state.mode="guided";state.completed=[false,false];startMission(0);}
  const clock = () => new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
  const day = () => new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"});
  function statusBar() {
    const device=extras.deviceStatus();
    const statusIcon=device.airplane?'<span class="cx-status-tag" aria-label="Modo avião ligado">'+icon("plane")+'</span>':(device.dnd?'<span class="cx-status-tag" aria-label="Não perturbe ligado">'+icon("moon")+'</span>':"");
    return '<div class="celular-status"><button type="button" data-open="quick" aria-label="Abrir ajustes rápidos"><span class="celular-status-time">'+clock()+'</span><span class="celular-status-caret" aria-hidden="true">⌄</span></button>'+
      '<span class="celular-camera-cutout" aria-hidden="true"></span><div class="celular-status-icons">'+statusIcon+
      '<span class="'+(state.settings.wifi?"":"is-off")+'" title="Wi-Fi">'+icon("wifi")+'</span>'+
      '<span class="'+(state.settings.bluetooth?"":"is-off")+'" title="Bluetooth">'+icon("bluetooth")+'</span>'+
      '<span class="celular-signal" aria-label="Sinal móvel"></span>'+
      '<span class="celular-status-battery" aria-label="Bateria '+device.battery+'%"><i style="width:'+device.battery+'%"></i></span></div></div>';
  }

  function app(name,title,screen){
    return '<button type="button" class="celular-app celular-app--'+name+'" data-open="'+screen+'"><span class="celular-app-symbol">'+icon(name)+'</span><span>'+title+'</span></button>';
  }
  function row(name,title,subtitle,screen){
    return '<button type="button" class="celular-setting-row" data-open="'+screen+'" data-searchable="'+(title+" "+subtitle).toLowerCase()+'"><span class="celular-setting-icon">'+icon(name)+'</span><span class="celular-setting-text"><strong>'+title+'</strong><small>'+subtitle+'</small></span><span class="celular-row-chevron" aria-hidden="true">›</span></button>';
  }
  function section(title,content){
    return '<div class="celular-section"><header class="celular-subhead"><button type="button" class="celular-back" data-back aria-label="Voltar">‹</button><h2>'+title+'</h2></header>'+content+'</div>';
  }
  function phoneHome(drawer){
    const apps = app("settings","Configurações","settings")+app("messages","Mensagens","messages")+app("clock","Relógio","clock")+app("gallery","Fotos","gallery");
    if(drawer)return section("Aplicativos",'<div class="celular-app-drawer"><div class="celular-app-grid">'+apps+extras.appIcons()+app("workshops","Oficinas","library")+'</div></div>');
    return '<div class="celular-home-view"><div class="celular-home-heading"><span class="celular-home-date">'+day()+'</span><strong class="celular-home-clock">'+clock()+'</strong></div><div class="celular-home-bottom"><div class="celular-app-grid">'+apps+app("contact","Contatos","contacts")+app("store","Loja","store")+app("apps","Aplicativos","apps")+app("workshops","Oficinas","library")+'</div><button type="button" class="celular-search-widget" data-open="settings" aria-label="Pesquisar configurações">'+icon("settings")+' <span>Pesquisar no celular</span><span aria-hidden="true">⌕</span></button></div></div>';
  }
  function phoneLibrary(){
    const actions='<div class="celular-mobile-library-actions">'+
      '<button type="button" data-mobile-guided>Prática guiada</button>'+
      '<a href="../ferramentas/">Voltar ao portal UnAPI</a>'+
      '</div>';
    return section("Oficinas",'<p class="celular-library-intro">Escolha o que deseja praticar.</p>'+
      '<div class="celular-library-picker">'+extras.picker()+'</div>'+actions);
  }
  function phoneMission(){
    const lesson=lessons[state.mission];
    const done=state.completed[state.mission];
    const hint=state.showRoute?'Caminho: '+lesson.route:state.hints?lesson.hints[state.hints-1]:"";
    return section("Prática guiada",'<div class="celular-mobile-mission">'+
      '<span>Missão '+(state.mission+1)+' de '+lessons.length+'</span>'+
      '<h3>'+lesson.title+'</h3>'+
      '<p>'+lesson.description+'</p>'+
      (done?'<p class="celular-mobile-success">✓ Atividade concluída!</p>':
          (hint?'<p class="celular-mobile-hint">'+hint+'</p>':''))+
      '<div class="celular-mobile-mission-actions">'+
      (done?'<button type="button" data-mobile-next>'+(state.mission===lessons.length-1?'Explorar funções':'Próxima missão')+'</button>':
          '<button type="button" data-mobile-hint>Pedir dica</button>')+
      '<button type="button" data-open="home">Ir à tela inicial</button>'+
      '</div></div>');
  }
  const toggle = (name,title,explanation) => '<div class="celular-control-row"><div><strong>'+title+'</strong><small>'+explanation+'</small></div><button class="celular-switch" type="button" data-toggle="'+name+'" aria-label="'+title+': '+(state.settings[name]?"ligado":"desligado")+'" aria-pressed="'+state.settings[name]+'">'+(state.settings[name]?"Ligado":"Desligado")+'</button></div>';
  function quickTile(name,label) {
    return '<button class="celular-quick-tile" data-toggle="'+name+'" type="button" aria-pressed="'+state.settings[name]+'"><span class="celular-quick-icon">'+icon(name)+'</span><span>'+label+'</span><small>'+(state.settings[name]?"Ligado":"Desligado")+'</small></button>';
  }
  function settingsHome(){
    return section("Configurações",'<label class="celular-sr-only" for="celular-settings-search">Pesquisar configurações</label><input id="celular-settings-search" class="celular-settings-search" type="search" placeholder="Pesquisar configurações" autocomplete="off"/><p class="celular-settings-label">Ajustes do celular</p><div class="celular-settings-list">'+row("wifi","Conexões","Wi-Fi e Bluetooth","connections")+row("display","Tela","Brilho e tamanho das letras","display")+row("sound","Som e volume","Ajustar o volume","sound")+row("bell","Notificações","Alertas e avisos","notifications")+row("shield","Privacidade","Permissões de acesso","privacy")+row("battery","Bateria","Economia de energia","battery")+row("folder","Armazenamento","Arquivos e espaço","storage")+row("lock","Segurança","Bloqueio de tela","security")+row("info","Sobre o dispositivo","Informações gerais","about")+'</div><p class="celular-empty" id="celular-search-empty" hidden>Nenhuma opção encontrada. Experimente outra palavra.</p>');
  }
  function displayPage(){
    const size=state.settings.textSize;
    const sizes=["","Padrão","Grande","Muito grande"];
    return section("Tela",
      '<div class="celular-setting-card"><h3>Brilho da tela</h3><p>Escolha a intensidade da tela.</p><label class="celular-setting-line" for="brightness"><strong>Brilho</strong><span>'+state.settings.brightness+'%</span></label><input class="celular-phone-slider" id="brightness" type="range" min="30" max="100" value="'+state.settings.brightness+'" data-range="brightness"/></div>'+
      '<div class="celular-setting-card"><h3>Tamanho do texto</h3><p>Veja as letras mudarem ao tocar em + ou −.</p><div class="celular-font-tools"><button type="button" data-font="-1" aria-label="Diminuir tamanho do texto" '+(size===1?"disabled":"")+'>−</button><output aria-live="polite">'+sizes[size]+'</output><button type="button" data-font="1" aria-label="Aumentar tamanho do texto" '+(size===3?"disabled":"")+'>+</button></div><div class="celular-font-preview"><small>Exemplo de leitura</small>Agora as letras ficam mais fáceis de ler.</div></div>');
  }
  function renderScreen(){
    const moduleScreen=extras.renderScreen(state.screen);
    if(moduleScreen!==null)return moduleScreen;
    switch(state.screen){
      case "library": return phoneLibrary();
      case "mobile-guide": return phoneMission();
      case "settings": return settingsHome();
      case "display": return displayPage();
      case "connections": return section("Conexões",toggle("wifi","Wi-Fi","Redes disponíveis")+toggle("bluetooth","Bluetooth","Acessórios sem fio"));
      case "quick": return section("Ajustes rápidos",'<div class="celular-quick-date">'+day()+'</div><div class="celular-quick-grid">'+quickTile("wifi","Wi-Fi")+quickTile("bluetooth","Bluetooth")+'</div><div class="celular-setting-card celular-quick-brightness"><label class="celular-setting-line" for="brightness"><strong>Brilho</strong><span>'+state.settings.brightness+'%</span></label><input class="celular-phone-slider" id="brightness" type="range" min="30" max="100" value="'+state.settings.brightness+'" data-range="brightness" /></div>'+row("settings","Todas as configurações","","settings"));
      case "sound": return section("Som e volume",'<div class="celular-setting-card"><h3>Volume do celular</h3><p>Controle o volume simulado.</p><label class="celular-setting-line" for="volume"><strong>Volume</strong><span>'+state.settings.volume+'%</span></label><input class="celular-phone-slider" type="range" id="volume" min="0" max="100" value="'+state.settings.volume+'" data-range="volume"/></div>');
      case "about": return section("Sobre o dispositivo",'<div class="celular-simple-app"><strong>Informações do dispositivo</strong><p>Versão do sistema: Android</p><p>Armazenamento: 64 GB</p></div>');
      case "messages": return section("Mensagens",'<div class="celular-simple-app"><strong>Maria · 09:12</strong>Bom dia! Vamos nos encontrar mais tarde?</div>');
      case "clock": return section("Relógio",'<div class="celular-simple-app"><strong>'+clock()+'</strong><p>Horário local</p></div>');
      case "gallery": return section("Fotos",'<div class="celular-simple-app"><strong>Fotos</strong><p>Sem imagens recentes.</p></div>');
      case "apps": return phoneHome(true);
      default: return phoneHome(false);
    }
  }
  function renderGuide(){
    const guided=state.mode==="guided";
    get("guide-content").hidden=!guided;
    get("free-content").hidden=guided;
    get("module-picker").innerHTML=extras.picker();
    get("guided-mode").classList.toggle("is-current",guided);
    get("free-mode").classList.toggle("is-current",!guided);
    get("guided-mode").setAttribute("aria-pressed",String(guided));
    get("free-mode").setAttribute("aria-pressed",String(!guided));
    const lesson=lessons[state.mission];
    const count=state.completed.filter(Boolean).length;
    get("mission-count").textContent="Missão "+String(state.mission+1).padStart(2,"0");
    get("mission-progress-text").textContent=count+"/"+lessons.length+" concluídas";
    get("mission-progress").setAttribute("aria-valuenow",String(count));
    get("mission-progress-bar").style.width=(count/lessons.length*100)+"%";
    get("mission-context").textContent=lesson.context;
    get("mission-context").hidden=!lesson.context;
    get("mission-title").textContent=lesson.title;
    get("mission-description").textContent=lesson.description;
    const done=state.completed[state.mission];
    const feedbackEl=get("mission-feedback");
    feedbackEl.classList.toggle("is-success",done);
    feedbackEl.textContent=done?(feedback || (state.mission===0?"Configurações encontradas!":"Letras aumentadas!")):feedback;
    const hint=get("hint-box");
    hint.hidden=state.hints===0&&!state.showRoute;
    hint.textContent=state.showRoute?"Caminho sugerido: "+lesson.route:state.hints?("Dica "+state.hints+": "+lesson.hints[state.hints-1]):"";
    get("hint-button").disabled=state.hints>=lesson.hints.length || done;
    get("hint-button").textContent=state.hints>=lesson.hints.length?"Todas as dicas exibidas":"Quero uma dica";
    get("route-button").textContent=state.showRoute?"Ocultar o caminho":"Mostrar o caminho";
    const next=get("next-mission");
    next.disabled=!done;
    next.textContent=state.mission===lessons.length-1?"Explorar →":"Continuar →";
  }
  function render(){
    const oldScroll=phone.scrollTop;
    phone.style.setProperty("--ui-font",([16,19,22][state.settings.textSize-1])+"px");
    phone.innerHTML=statusBar()+'<div class="celular-phone-body" id="celular-phone-body">'+renderScreen()+'</div>';
    phone.scrollTop=oldScroll;
    const body=get("celular-phone-body");
    body.style.filter="brightness("+(0.80+(state.settings.brightness-30)/70*0.40)+")"+(extras.highContrast()?" contrast(1.4)":"");
    phone.classList.toggle("large-icons",extras.bigIcons());
    renderGuide();
  }
  function setMode(mode){
    state.mode=mode;feedback="";render();announce(mode==="free"?"Exploração livre ativada.":"Prática guiada ativada.");
  }
  phone.addEventListener("click",(event)=>{
    const button=event.target.closest("button");
    if(!button)return;
    if(extras.handleClick(button))return;
    if(button.dataset.group){
      extras.setGroup(button.dataset.group);
      render();phone.scrollTop=0;return;
    }
    if(button.dataset.pick){
      state.mode="free";feedback="";
      openScreen(button.dataset.pick);phone.scrollTop=0;return;
    }
    if(button.hasAttribute("data-mobile-guided")){
      state.mode="guided";feedback="";
      state.mission=0;state.hints=0;state.showRoute=false;state.completed=[false,false];
      openScreen("mobile-guide");phone.scrollTop=0;return;
    }
    if(button.hasAttribute("data-mobile-hint")){
      state.hints=Math.min(lessons[state.mission].hints.length,state.hints+1);
      render();return;
    }
    if(button.hasAttribute("data-mobile-next")){
      if(!state.completed[state.mission])return;
      if(state.mission<lessons.length-1){
        startMission(state.mission+1);
        openScreen("mobile-guide");
      }else{
        state.mode="free";openScreen("library");
      }
      phone.scrollTop=0;return;
    }
    if(button.hasAttribute("data-back")){goBack();return;}
    if(button.dataset.open){openScreen(button.dataset.open);phone.scrollTop=0;return;}
    if(button.dataset.toggle){
      const key=button.dataset.toggle;state.settings[key]=!state.settings[key];
      render();announce((key==="wifi"?"Wi-Fi":"Bluetooth")+(state.settings[key]?" ligado.":" desligado."));
      return;
    }
    if(button.dataset.font){
      const next=state.settings.textSize+Number(button.dataset.font);
      state.settings.textSize=Math.min(3,Math.max(1,next));
      if(state.mode==="guided"&&state.mission===1&&state.settings.textSize>1)finishMission();
      render();
      const control=phone.querySelector('[data-font="'+button.dataset.font+'"]');
      if(control&&!control.disabled)control.focus({preventScroll:true});
      announce("Tamanho do texto: "+(["","padrão","grande","muito grande"][state.settings.textSize])+".");
    }
  });
  phone.addEventListener("input",(event)=>{
    const target=event.target;
    if(target.id==="celular-settings-search"){
      const normalize=(value)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
      const needle=normalize(target.value.trim());
      let visible=0;
      phone.querySelectorAll("[data-searchable]").forEach((row)=>{
        const match=normalize(row.dataset.searchable).includes(needle);
        row.hidden=!match;if(match)visible++;
      });
      get("celular-search-empty").hidden=visible>0;
    }
    if(target.dataset.range){
      const label=target.parentElement.querySelector(".celular-setting-line span");
      if(label)label.textContent=target.value+"%";
      if(target.dataset.range==="brightness"){
        get("celular-phone-body").style.filter="brightness("+(0.80+(Number(target.value)-30)/70*.40)+")";
      }
    }
  });
  phone.addEventListener("change",(event)=>{
    const key=event.target.dataset.range;
    if(!["brightness","volume"].includes(key))return;
    state.settings[key]=Number(event.target.value);
    render();announce((key==="brightness"?"Brilho":"Volume")+" alterado na simulação.");
  });
  phone.addEventListener("submit",e=>extras.handleSubmit(e));
  phone.addEventListener("change",e=>extras.handleChange(e));
  get("module-picker").addEventListener("click",e=>{
    const group=e.target.closest("[data-group]");
    if(group){extras.setGroup(group.dataset.group);renderGuide();return;}
    const button=e.target.closest("[data-pick]");
    if(!button)return;
    state.mode="free";feedback="";
    openScreen(button.dataset.pick);
  });
  get("phone-back").addEventListener("click",goBack);
  get("phone-home").addEventListener("click",goHome);
  get("phone-apps").addEventListener("click",()=>openScreen("apps"));
  get("guided-mode").addEventListener("click",()=>setMode("guided"));
  get("free-mode").addEventListener("click",()=>setMode("free"));
  get("hint-button").addEventListener("click",()=>{
    state.hints=Math.min(lessons[state.mission].hints.length,state.hints+1);renderGuide();
    announce(lessons[state.mission].hints[state.hints-1]);
  });
  get("route-button").addEventListener("click",()=>{
    state.showRoute=!state.showRoute;renderGuide();
  });
  get("reset-mission").addEventListener("click",()=>{
    state.completed[state.mission]=false;startMission(state.mission);
  });
  get("next-mission").addEventListener("click",()=>{
    if(!state.completed[state.mission])return;
    if(state.mission<lessons.length-1){startMission(state.mission+1);}
    else{setMode("free");goHome();}
  });
  get("reset-all").addEventListener("click",resetAll);
  render();
})();
