/* Biblioteca de funções: estado local, dados de exemplo e navegação sem serviços externos. */
window.createUnapiCelularModules = function (ctx) {
  "use strict";
  const { state, icon, section, row, app, openScreen, render, announce } = ctx;
  const escape = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const seed = () => ({
    notifications: [{id:1,title:"Mensagem de Maria",body:"Nos vemos amanhã!",read:false},{id:2,title:"Lembrete",body:"Oficina de informática às 9h",read:false}],
    contacts:[{id:1,name:"Maria",number:"(67) 99999-1234"},{id:2,name:"João",number:"(67) 98888-2345"}],
    messages:[{id:1,contactId:1,text:"Bom dia! Nos vemos amanhã?",mine:false}],
    nextId:3, alarm:[{id:1,time:"08:00",active:true}], installed:{notes:false,calculator:false},
    notes:[], calculator:"", photoView:0, favorite:[], hiddenSeedPhotos:[], favoritesOnly:false, selectedContact:1,
    photoAccess:true, location:true, notificationPermission:true, highContrast:false, bigIcons:false, savedSearch:""
  });
  let m=seed();
  const catalog=[
    {id:"display",title:"Tela e letras",icon:"display",caption:"Brilho e leitura"},
    {id:"accessibility",title:"Acessibilidade",icon:"accessibility",caption:"Enxergar melhor"},
    {id:"connections",title:"Conexões",icon:"wifi",caption:"Wi-Fi e Bluetooth"},
    {id:"notifications",title:"Notificações",icon:"bell",caption:"Alertas e avisos"},
    {id:"contacts",title:"Contatos",icon:"contact",caption:"Pessoas e números"},
    {id:"messages",title:"Mensagens",icon:"messages",caption:"Conversas"},
    {id:"clock",title:"Alarmes",icon:"clock",caption:"Horários e lembretes"},
    {id:"store",title:"Aplicativos",icon:"store",caption:"Instalar e remover"},
    {id:"privacy",title:"Privacidade",icon:"shield",caption:"Permissões"},
    {id:"gallery",title:"Fotos",icon:"gallery",caption:"Galeria e favoritos"}
  ];
  const expansion=window.createUnapiCelularExpansion({
    getData:()=>m,state,icon,section,row,app,openScreen,render,announce,escape,
    contacts:()=>m.contacts,notesCount:()=>m.notes.length,
    notify:(title,body)=>{m.notifications.unshift({id:m.nextId++,title,body,read:false});},
    sendMessage:(id,text)=>{m.selectedContact=id;m.messages.push({id:m.nextId++,contactId:id,text,mine:true});},
    photoLabel:i=>(photoData.concat(expansion.photos()))[i]?.label || "Foto da oficina",
    selectedPhoto:()=>{
      const all=photoData.concat(expansion.photos());
      const available=all.map((p,i)=>i).filter(i=>(i>=photoData.length||!m.hiddenSeedPhotos.includes(i))&&(!m.favoritesOnly||m.favorite.includes(i)));
      return available.includes(m.photoView)?m.photoView:available[0];
    }
  });
  let menuGroup="adjust";
  const groups=[
    {id:"adjust",label:"Ajustes"},
    {id:"daily",label:"Dia a dia"},
    {id:"tools",label:"Ferramentas"}
  ];
  const photoData=[
    {src:"../img/videos/atividades-da-oficina.webp",label:"Atividades da oficina"},
    {src:"../img/videos/pratica-com-acompanhamento.webp",label:"Prática com acompanhamento"}
  ];
  const shell = (title,body)=>section(title,body);
  const control=(name,label,sub,active)=>'<div class="mod-setting"><span><strong>'+label+'</strong><small>'+sub+'</small></span><button type="button" data-x="toggle-'+name+'" class="mod-switch" aria-pressed="'+active+'">'+(active?"Ativado":"Desativado")+'</button></div>';
  const action=(key,label,cls="")=>'<button type="button" data-x="'+key+'" class="mod-action '+cls+'">'+label+'</button>';
  const contactName=id=>m.contacts.find(c=>c.id===id)?.name || "Contato";
  const card=(title,body)=>'<div class="mod-card"><strong>'+title+'</strong>'+body+'</div>';
  function picker(){
    const base=[
      ...catalog.map(item=>({...item,group:
        ["display","accessibility","connections","notifications","privacy"].includes(item.id)?"adjust":"daily"})),
      {id:"sound",title:"Som e volume",icon:"sound",group:"adjust"},
      ...expansion.catalog
    ];
    const grouped=base.map(item=>({
      ...item,group:item.group==="media"?(["camera","calendar"].includes(item.id)?"daily":"tools"):
        item.group==="system"?"tools":item.group
    }));
    const tabs='<div class="mod-library-tabs" role="group" aria-label="Categorias">'+groups.map(g=>
      '<button type="button" data-group="'+g.id+'" class="'+(menuGroup===g.id?"active":"")+'" aria-pressed="'+(menuGroup===g.id)+'">'+g.label+'</button>').join("")+'</div>';
    return tabs+'<div class="mod-library-items">'+grouped.filter(item=>item.group===menuGroup).map(item=>
      '<button type="button" class="mod-choice'+(state.screen===item.id?" is-active":"")+'" data-pick="'+item.id+'" aria-label="Abrir '+item.title+'">'+
      '<span class="mod-choice-icon">'+icon(item.icon)+'</span><span>'+item.title+'</span></button>').join("")+'</div>';
  }
  function setGroup(group){if(groups.some(g=>g.id===group))menuGroup=group;}
  function appIcons(){
    return app("contact","Contatos","contacts")+app("bell","Avisos","notifications")+app("store","Loja","store")+
      (m.installed.notes?app("notes","Notas","notes"):"")+(m.installed.calculator?app("calculator","Calculadora","calculator"):"")+expansion.apps();
  }
  function accessibilityScreen(){
    return shell("Acessibilidade",'<p class="mod-caption">Ajuste a leitura do seu jeito.</p>'+
      control("contrast","Contraste reforçado","Destaca os textos",m.highContrast)+
      control("bigIcons","Ícones maiores","Amplia os aplicativos",m.bigIcons)+
      row("display","Tamanho das letras","Abrir opções de tela","display"));
  }
  function notificationScreen(){
    const items=m.notifications.filter(n=>!n.read && m.notificationPermission);
    return shell("Notificações",'<p class="mod-caption">Deslize ou toque para dispensar um aviso.</p>'+
      control("notifications","Receber notificações","Alertas dos aplicativos",m.notificationPermission)+
      (items.length?items.map(n=>'<div class="mod-notice"><span class="mod-circle">'+icon("bell")+'</span><span><strong>'+escape(n.title)+'</strong><small>'+escape(n.body)+'</small></span><button type="button" aria-label="Dispensar '+escape(n.title)+'" data-x="notice-'+n.id+'">×</button></div>').join(""):card("Tudo em dia","<p>Nenhum aviso pendente.</p>"))+
      (items.length?action("clear-notices","Limpar todos"):""));
  }
  function contactsScreen(){
    return shell("Contatos",'<p class="mod-caption">Encontre uma pessoa ou cadastre um contato.</p>'+
      m.contacts.map(c=>'<button type="button" class="mod-contact" data-x="contact-'+c.id+'"><span class="mod-avatar">'+escape(c.name[0].toUpperCase())+'</span><span><strong>'+escape(c.name)+'</strong><small>'+escape(c.number)+'</small></span><span aria-hidden="true">›</span></button>').join("")+
      '<form data-mod-form="contact" class="mod-card mod-form"><strong>Novo contato</strong><label>Nome<input name="name" required minlength="2" maxlength="32" placeholder="Nome" autocomplete="off"></label><label>Telefone<input name="number" required maxlength="19" minlength="8" inputmode="tel" placeholder="(67) 99999-9999"></label><button type="submit" class="mod-primary">Salvar contato</button></form>');
  }
  function messagesScreen(){
    const c=m.contacts.find(x=>x.id===m.selectedContact)||m.contacts[0];
    return shell("Mensagens",'<div class="mod-conversation-head"><span class="mod-avatar">'+escape(c.name[0])+'</span><strong>'+escape(c.name)+'</strong></div>'+
      '<div class="mod-messages">'+m.messages.filter(x=>x.contactId===c.id).map(x=>'<div class="mod-bubble '+(x.mine?"mine":"theirs")+'">'+escape(x.text)+'</div>').join("")+'</div>'+
      '<form data-mod-form="message" class="mod-message-compose"><label class="celular-sr-only" for="mod-message-text">Mensagem</label><input id="mod-message-text" name="text" maxlength="160" placeholder="Escreva uma mensagem" required autocomplete="off"><button type="submit" aria-label="Enviar mensagem">➤</button></form>');
  }
  function alarmsScreen(){
    return shell("Relógio e alarmes",'<div class="mod-bigtime">'+new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})+'</div>'+
      '<h3 class="mod-subtitle">Meus alarmes</h3>'+
      m.alarm.map(a=>'<div class="mod-alarm"><strong>'+escape(a.time)+'</strong><button type="button" class="mod-switch" aria-pressed="'+a.active+'" data-x="alarm-'+a.id+'">'+(a.active?"Ligado":"Desligado")+'</button><button type="button" class="mod-icon-btn" aria-label="Excluir alarme das '+escape(a.time)+'" data-x="delete-alarm-'+a.id+'">×</button></div>').join("")+
      '<form data-mod-form="alarm" class="mod-card mod-inline-form"><label>Novo horário<input type="time" name="time" value="09:00" required></label><button type="submit" class="mod-primary">Adicionar</button></form>');
  }
  function storeScreen(){
    const storeApps=[{id:"notes",title:"Bloco de notas",description:"Escreva e guarde anotações."},{id:"calculator",title:"Calculadora",description:"Faça contas do dia a dia."}];
    return shell("Loja de aplicativos",'<p class="mod-caption">Escolha um aplicativo para adicionar ao celular.</p>'+
      storeApps.map(a=>'<div class="mod-store-row"><span class="mod-store-symbol">'+icon(a.id==="notes"?"messages":"apps")+'</span><span><strong>'+a.title+'</strong><small>'+a.description+'</small></span>'+
      '<button type="button" data-x="install-'+a.id+'" class="mod-store-button">'+(m.installed[a.id]?"Desinstalar":"Instalar")+'</button></div>').join("")+
      card("Meus aplicativos",'<p>'+Object.values(m.installed).filter(Boolean).length+' aplicativo(s) instalado(s).</p>'));
  }
  function notesScreen(){
    if(!m.installed.notes)return shell("Notas",card("Aplicativo não instalado","<p>Abra a Loja para instalar.</p>")+action("go-store","Abrir Loja"));
    return shell("Bloco de notas",'<form data-mod-form="note" class="mod-card mod-form"><label>Escreva uma nota<textarea name="text" maxlength="160" rows="3" required placeholder="Ex.: comprar pão"></textarea></label><button type="submit" class="mod-primary">Salvar nota</button></form>'+
      m.notes.map(n=>'<div class="mod-note"><span>'+escape(n.text)+'</span><button type="button" aria-label="Excluir nota" data-x="delete-note-'+n.id+'">×</button></div>').join(""));
  }
  function calculatorScreen(){
    if(!m.installed.calculator)return shell("Calculadora",card("Aplicativo não instalado","<p>Abra a Loja para instalar.</p>")+action("go-store","Abrir Loja"));
    const keys=["7","8","9","÷","4","5","6","×","1","2","3","−","C","0","=","+"];
    return shell("Calculadora",'<div class="mod-calculator"><output class="mod-calc-display" aria-label="Resultado">'+escape(m.calculator||"0")+'</output><div class="mod-calc-grid">'+
      keys.map(x=>'<button type="button" data-x="calc-'+escape(x)+'" class="'+("÷×−+=".includes(x)?"operator":"")+'">'+escape(x)+'</button>').join("")+'</div></div>');
  }
  function privacyScreen(){
    return shell("Privacidade",'<p class="mod-caption">Decida quais recursos os aplicativos podem usar.</p>'+
      control("location","Localização","Acesso à posição",m.location)+
      control("photoAccess","Acesso às fotos","Visualizar a galeria",m.photoAccess)+
      control("notifications","Notificações","Permitir avisos",m.notificationPermission)+
      card("Permissões",'<p>Você pode mudar essas opções a qualquer momento.</p>'));
  }
  function galleryScreen(){
    if(!m.photoAccess)return shell("Fotos",card("Acesso às fotos bloqueado","<p>Altere a permissão em Privacidade.</p>")+action("go-privacy","Abrir Privacidade"));
    const allPhotos=photoData.concat(expansion.photos());
    const available=allPhotos.map((data,i)=>({...data,i})).filter(p=>(p.i>=photoData.length||!m.hiddenSeedPhotos.includes(p.i))&&(!m.favoritesOnly||m.favorite.includes(p.i)));
    const selectedIndex=available.some(p=>p.i===m.photoView)?m.photoView:available[0]?.i;
    const selection=selectedIndex===undefined?null:allPhotos[selectedIndex];
    return shell("Fotos",'<div class="mod-photo-actions">'+action("toggle-favorites",m.favoritesOnly?"Todas as fotos":"Ver favoritas")+'</div>'+
      '<div class="mod-photo-grid">'+available.map(p=>'<button type="button" data-x="photo-'+p.i+'" aria-label="Abrir '+escape(p.label)+'"><img src="'+p.src+'" alt="'+escape(p.label)+'"></button>').join("")+'</div>'+
      (available.length===0?card("Sem favoritas","<p>Abra uma foto e marque como favorita.</p>"):"")+
      (selection?'<div class="mod-photo-view"><img src="'+selection.src+'" alt="'+escape(selection.label)+'"><div><small>'+escape(selection.label)+'</small>'+action("favorite-photo",m.favorite.includes(selectedIndex)?"♥ Favorita":"♡ Favoritar")+
        '<button class="mod-action" type="button" data-x="delete-selected-photo">Excluir</button><button class="mod-action" type="button" data-cx="share-selected-photo">Compartilhar</button>'+'</div></div>':''));
  }
  function renderScreen(screen){
    const newView=expansion.renderScreen(screen);
    if(newView!==null)return newView;
    switch(screen){
      case "accessibility":return accessibilityScreen();
      case "notifications": return notificationScreen();
      case "contacts":return contactsScreen();
      case "messages":return messagesScreen();
      case "clock":return alarmsScreen();
      case "store":return storeScreen();
      case "notes":return notesScreen();
      case "calculator":return calculatorScreen();
      case "privacy":return privacyScreen();
      case "gallery":return galleryScreen();
      default:return null;
    }
  }
  function handleClick(button){
    if(expansion.handleClick(button))return true;
    const cmd=button.dataset.x;
    if(!cmd)return false;
    const n=Number(cmd.split("-").at(-1));
    if(cmd.startsWith("notice-"))m.notifications=m.notifications.filter(x=>x.id!==n);
    else if(cmd==="clear-notices")m.notifications=[];
    else if(cmd.startsWith("contact-")){m.selectedContact=n;openScreen("messages");return true;}
    else if(cmd.startsWith("alarm-")){const a=m.alarm.find(x=>x.id===n);if(a)a.active=!a.active;}
    else if(cmd.startsWith("delete-alarm-"))m.alarm=m.alarm.filter(x=>x.id!==n);
    else if(cmd.startsWith("install-")){
      const id=cmd.slice(8); if(id in m.installed){m.installed[id]=!m.installed[id];announce(m.installed[id]?"Aplicativo instalado.":"Aplicativo desinstalado.");}
    }
    else if(cmd.startsWith("delete-note-"))m.notes=m.notes.filter(x=>x.id!==n);
    else if(cmd.startsWith("toggle-")){
      const key=cmd.slice(7);
      if(key==="notifications")m.notificationPermission=!m.notificationPermission;
      if(key==="photoAccess")m.photoAccess=!m.photoAccess;
      if(key==="location")m.location=!m.location;
      if(key==="contrast")m.highContrast=!m.highContrast;
      if(key==="bigIcons")m.bigIcons=!m.bigIcons;
      if(key==="favorites")m.favoritesOnly=!m.favoritesOnly;
    }
    else if(cmd==="go-store"){openScreen("store");return true;}
    else if(cmd==="go-privacy"){openScreen("privacy");return true;}
    else if(cmd.startsWith("photo-"))m.photoView=n;
    else if(cmd==="favorite-photo"){
      const all=photoData.concat(expansion.photos());
      const avail=all.map((data,i)=>({...data,i})).filter(p=>(p.i>=photoData.length||!m.hiddenSeedPhotos.includes(p.i))&&(!m.favoritesOnly||m.favorite.includes(p.i)));
      const chosen=avail.some(p=>p.i===m.photoView)?m.photoView:avail[0]?.i;
      if(chosen!==undefined){m.photoView=chosen;m.favorite=m.favorite.includes(chosen)?m.favorite.filter(x=>x!==chosen):[...m.favorite,chosen];}
    }
    else if(cmd==="delete-selected-photo"){
      const all=photoData.concat(expansion.photos());
      const avail=all.map((data,i)=>({...data,i})).filter(p=>(p.i>=photoData.length||!m.hiddenSeedPhotos.includes(p.i))&&(!m.favoritesOnly||m.favorite.includes(p.i)));
      const chosen=avail.some(p=>p.i===m.photoView)?m.photoView:avail[0]?.i;
      if(chosen!==undefined){
        if(chosen<photoData.length)m.hiddenSeedPhotos.push(chosen);
        else expansion.deletePhoto(chosen-photoData.length);
        m.favorite=m.favorite.filter(i=>i!==chosen);
        m.photoView=0;
        announce("Foto excluída.");
      }
    }
    else if(cmd.startsWith("calc-")){
      const key=cmd.slice(5);
      if(key==="C")m.calculator="";
      else if(key==="="){
        const parts=m.calculator.match(/^(-?\d+)([+×÷−])(\d+)$/);
        if(parts){
          const a=Number(parts[1]),b=Number(parts[3]);
          const value=parts[2]==="+"?a+b:parts[2]==="−"?a-b:parts[2]==="×"?a*b:b?Math.round(a/b*100)/100:"Erro";
          m.calculator=String(value);
        }
      } else if(m.calculator.length<18 && (/^\d$/.test(key)||/[+×÷−]/.test(key)))m.calculator+=key;
    }else return false;
    render();
    return true;
  }
  function handleSubmit(event){
    if(expansion.handleSubmit(event))return true;
    const form=event.target;
    const type=form.dataset.modForm;
    if(!type)return false;
    event.preventDefault();
    const data=new FormData(form);
    if(type==="contact"){
      const name=String(data.get("name")||"").trim();
      const number=String(data.get("number")||"").trim();
      if(name.length>=2 && /^[+()\d\s-]{8,19}$/.test(number)){
        m.contacts.push({id:m.nextId++,name,number});
        announce("Contato salvo."); render();
      }else announce("Informe um nome e um telefone válidos.");
    }
    if(type==="message"){
      const value=String(data.get("text")||"").trim();
      if(value){m.messages.push({id:m.nextId++,contactId:m.selectedContact,text:value.slice(0,160),mine:true});announce("Mensagem adicionada à conversa.");render();}
    }
    if(type==="alarm"){
      const time=String(data.get("time")||"");
      if(/^([01]\d|2[0-3]):[0-5]\d$/.test(time)){m.alarm.push({id:m.nextId++,time,active:true});announce("Alarme adicionado.");render();}
    }
    if(type==="note"){
      const text=String(data.get("text")||"").trim();
      if(text){m.notes.unshift({id:m.nextId++,text:text.slice(0,160)});announce("Nota salva.");render();}
    }
    return true;
  }
  function reset(){m=seed();expansion.reset();menuGroup="adjust";}
  return {picker,setGroup,appIcons,renderScreen,handleClick,handleSubmit,handleChange:expansion.handleChange,reset,catalog,highContrast:()=>m.highContrast,bigIcons:()=>m.bigIcons,deviceStatus:expansion.status};
};
