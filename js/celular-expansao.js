/* Celular na Prática: ferramentas conectadas, sem rede e sem dados reais. */
window.createUnapiCelularExpansion = function (ctx) {
  "use strict";
  const {getData, state, icon, section, row, openScreen, render, announce, escape} = ctx;
  const data = () => getData();
  const seed = () => ({
    cameraScene: 0, flash: false, cameraCount: 0, captures: [],
    entries:[
      {id:100, name:"Orientações da oficina.pdf",type:"pdf",folder:"Downloads",deleted:false},
      {id:101, name:"Foto da turma.webp",type:"image",folder:"Imagens",deleted:false,src:"../img/videos/primeira-oficina.webp"}
    ],
    fileFolder:"Todos", fileSearch:"", showTrash:false, selectedFile:null, confirmTrash:false,
    events:[{id:1,title:"Oficina de informática",date:"2026-10-20",time:"09:00"}],
    sharing:null, qrResult:false, downloaded:false,
    airplane:false, flashlight:false, dnd:false, silent:false,
    battery:74, batterySaver:false, pin:null, locked:false, showSecurityPin:false
  });
  let x=seed();
  const scenes=[
    {src:"../img/videos/primeira-oficina.webp",title:"Oficina UnAPI"},
    {src:"../img/videos/pratica-com-acompanhamento.webp",title:"Acompanhamento"},
    {src:"../img/videos/participantes-em-atividade.webp",title:"Participantes"}
  ];
  const item=(id,title,iconName,group)=>({id,title,icon:iconName,group});
  const catalog=[
    item("camera","Câmera","camera","media"),
    item("files","Arquivos e downloads","folder","media"),
    item("calendar","Calendário","calendar","media"),
    item("qr","QR Code","qr","media"),
    item("screenshots","Captura de tela","smartphone","media"),
    item("share","Compartilhar","share","media"),
    item("battery","Bateria","battery","system"),
    item("storage","Armazenamento","folder","system"),
    item("security","Bloqueio de tela","lock","system"),
    item("quick","Ajustes rápidos","settings","system")
  ];
  const act=(cmd,label,style="")=>'<button type="button" class="cx-action '+style+'" data-cx="'+cmd+'">'+label+'</button>';
  const block=(title,inner)=>'<div class="cx-card"><strong>'+title+'</strong>'+inner+'</div>';
  const sw=(cmd,label,desc,on)=>'<div class="cx-switchrow"><span><strong>'+label+'</strong><small>'+desc+'</small></span><button data-cx="'+cmd+'" type="button" class="mod-switch" aria-pressed="'+on+'">'+(on?"Ligado":"Desligado")+'</button></div>';
  const fileList=()=>x.entries.filter(e=>!e.deleted);
  const imageEntries=()=>x.entries.filter(e=>e.type==="image"&&!e.deleted);
  const photoEntries=()=>x.captures.map((p,i)=>({...p,i}));
  function camera(){
    const s=scenes[x.cameraScene];
    return section("Câmera",'<div class="cx-camera"><img src="'+s.src+'" alt="'+s.title+'" /><div class="cx-camera-top">'+
      act("flash","Flash "+(x.flash?"ligado":"desligado"))+'</div>'+
      '<div class="cx-camera-bottom">'+act("scene-prev","‹")+'<button type="button" aria-label="Tirar foto" data-cx="shutter" class="cx-shutter"><span></span></button>'+act("scene-next","›")+'</div></div>'+
      '<p class="cx-hint">Escolha uma cena e toque no botão central para fotografar.</p>'+
      (x.cameraCount?block("Última foto",'<p>'+x.cameraCount+' foto(s) registrada(s). '+act("open-gallery","Abrir Fotos")+'</p>'):""));
  }
  function files(){
    const folders=["Todos","Downloads","Imagens","Documentos","Lixeira"];
    const visible=x.entries.filter(e=>x.fileFolder==="Lixeira"?e.deleted:!e.deleted&&(x.fileFolder==="Todos"||e.folder===x.fileFolder))
      .filter(e=>!x.fileSearch||e.name.toLowerCase().includes(x.fileSearch.toLowerCase()));
    return section("Arquivos",'<div class="cx-tabs cx-folders">'+folders.map(f=>'<button type="button" class="'+(x.fileFolder===f?"active":"")+'" data-cx="folder:'+f+'">'+f+'</button>').join("")+'</div>'+
      '<form class="cx-search-form" data-cx-form="file-search"><input name="search" aria-label="Buscar arquivos" placeholder="Buscar arquivo" value="'+escape(x.fileSearch)+'">'+act("file-clear","×")+'</form>'+
      '<div class="cx-file-list">'+(visible.length?visible.map(e=>'<div class="cx-file-row"><button class="cx-file-title" type="button" data-cx="file:'+e.id+'">'+icon(e.type==="image"?"gallery":e.type==="screenshot"?"smartphone":"folder")+
        '<span>'+escape(e.name)+'<small>'+escape(e.folder)+'</small></span></button>'+
        act((e.deleted?"restore:":"trash:")+e.id,e.deleted?"Restaurar":"Excluir")+'</div>').join(""):block("Nenhum arquivo","<p>Experimente outra pasta.</p>"))+'</div>'+
      (x.fileFolder!=="Lixeira"?act("download-sample","Baixar material de exemplo"):
        (x.entries.some(e=>e.deleted)?
          (x.confirmTrash?block("Esvaziar lixeira?",'<p>Os arquivos serão excluídos definitivamente.</p>'+act("empty-trash-confirm","Excluir definitivamente")+act("empty-trash-cancel","Cancelar")):
             act("empty-trash","Esvaziar lixeira")):"")));

  }
  function fileDetail(){
    const e=x.entries.find(z=>z.id===x.selectedFile);
    if(!e || e.deleted) return files();
    return section(e.name,block("Detalhes",'<p>Local: '+escape(e.folder)+'</p><p>Tipo: '+(e.type==="pdf"?"Documento PDF":e.type==="image"?"Imagem":"Captura")+'</p>'+
      (e.src?'<img class="cx-preview" src="'+e.src+'" alt="'+escape(e.name)+'"/>':""))+
      '<form data-cx-form="rename" class="cx-form"><label>Renomear<input name="name" maxlength="48" required value="'+escape(e.name)+'" /></label><button class="mod-primary">Salvar nome</button></form>'+
      '<div class="cx-control-grid">'+act("move:Downloads","Mover para Downloads")+act("move:Documentos","Mover para Documentos")+act("move:Imagens","Mover para Imagens")+act("share-file:"+e.id,"Compartilhar")+'</div>');
  }
  function calendar(){
    const ordered=[...x.events].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    return section("Calendário",'<form class="cx-form cx-event-form" data-cx-form="event"><label>Compromisso<input required maxlength="55" name="title" placeholder="Ex.: consulta" /></label>'+
      '<div class="cx-input-line"><label>Dia<input required name="date" type="date" value="'+new Date().toISOString().slice(0,10)+'"/></label>'+
      '<label>Horário<input required name="time" type="time" value="09:00"/></label></div><button class="mod-primary" type="submit">Adicionar compromisso</button></form>'+
      '<div class="cx-events">'+ordered.map(e=>'<div class="cx-event"><span class="cx-event-day">'+new Date(e.date+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})+'</span>'+
      '<span><strong>'+escape(e.title)+'</strong><small>'+escape(e.time)+'</small></span>'+act("del-event:"+e.id,"×")+'</div>').join("")+'</div>');
  }
  function qr(){
    return section("QR Code",'<div class="cx-qr-view"><img src="../img/celular/qr-portal-unapi.svg" alt="QR Code do Portal UnAPI" width="182" height="182"/>'+
      '<strong>Portal das Oficinas</strong><span>QR da oficina</span></div>'+
      act("scan-qr","Ler QR Code")+ (x.qrResult?block("Resultado",'<p>Portal UnAPI · Oficinas de informática</p>'+
      '<p class="cx-qr-url">pet-sistemas.github.io/unapi-oficinas/</p>'+act("open-portal","Abrir endereço")+
      act("close-qr","Fechar resultado")):""));
  }
  function screenshot(){
    return section("Captura de tela",'<div class="cx-screenshot-preview">'+icon("smartphone")+'<strong>Registrar a tela</strong><span>Guarde um registro do que está vendo no celular.</span></div>'+
      act("take-screenshot","Capturar tela inicial")+
      block("Últimas capturas",'<p>'+x.entries.filter(e=>e.type==="screenshot"&&!e.deleted).length+' captura(s) na pasta Imagens.</p>')+
      act("go-files","Ver em Arquivos"));
  }
  function share(){
    const photos=photoEntries();
    if(!x.sharing){
      return section("Compartilhar",'<p class="cx-hint">Escolha algo para enviar a um contato.</p>'+
        '<div class="cx-control-grid">'+act("share-content:0","Foto da oficina")+
        (photos.length?act("share-content:photo","Foto recente"):"")+
        act("share-content:file","Documento da oficina")+'</div>');
    }
    const c=ctx.contacts();
    return section("Compartilhar",block("Você vai compartilhar",'<p>'+escape(x.sharing)+'</p>')+
      '<p class="cx-hint">Escolha uma pessoa.</p>'+
      c.map(z=>'<button class="cx-contact-choice" type="button" data-cx="share-to:'+z.id+'"><span class="mod-avatar">'+escape(z.name[0])+'</span><span>'+escape(z.name)+'</span>›</button>').join("")+
      act("cancel-share","Cancelar"));
  }
  function battery(){
    return section("Bateria",'<div class="cx-battery-level">'+icon("battery")+'<strong>'+x.battery+'%</strong><span>de carga disponível</span></div>'+
      '<div class="cx-battery-track"><span style="width:'+x.battery+'%"></span></div>'+
      sw("battery-saver","Economia de bateria","Reduz atividades secundárias",x.batterySaver)+
      '<div class="cx-card"><label for="cx-battery">Nível de bateria</label><input id="cx-battery" type="range" min="5" max="100" data-cx-range="battery" value="'+x.battery+'"/></div>');
  }
  function storage(){
    const countFiles=fileList().length, photos=photoEntries().length;
    const notes=ctx.notesCount(), total=Math.min(100,18+countFiles*4+photos*5+notes*2);
    return section("Armazenamento",'<div class="cx-storage-info"><strong>'+total+'% utilizado</strong><div class="cx-battery-track"><span style="width:'+total+'%"></span></div><small>64 GB · uso ilustrativo do aparelho</small></div>'+
      '<div class="cx-control-grid">'+act("go-files","Arquivos: "+countFiles)+act("open-gallery","Fotos: "+photos)+act("go-trash","Lixeira")+act("go-store","Aplicativos")+'</div>'+
      block("Espaço disponível",'<p>Exclua itens e esvazie a lixeira para liberar espaço.</p>'));
  }
  function security(){
    if(x.locked) return lockscreen();
    return section("Bloqueio de tela",'<p class="cx-hint">Proteja a tela com um código de quatro números.</p>'+
      (x.pin ? block("Proteção ativada",'<p>O desbloqueio exige o PIN escolhido.</p>'+act("lock-now","Bloquear agora")+
         act("remove-pin","Remover PIN")):
        '<form data-cx-form="pin-create" class="cx-form"><label>Escolher PIN<input type="password" name="pin" inputmode="numeric" autocomplete="new-password" pattern="[0-9]{4}" minlength="4" maxlength="4" required placeholder="••••" /></label>'+
        '<button class="mod-primary" type="submit">Ativar bloqueio</button></form>'));
  }
  function lockscreen(){
    return '<div class="celular-section cx-lock-screen"><div class="cx-lock-clock">'+new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})+'</div>'+
      '<strong>Tela bloqueada</strong><div class="cx-lock-icon">'+icon("lock")+'</div>'+
      '<form data-cx-form="pin-unlock" class="cx-form"><label>PIN de quatro números<input name="pin" type="password" required inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4" autocomplete="off" placeholder="••••" /></label>'+
      '<button class="mod-primary" type="submit">Desbloquear</button></form>'+
      '<p class="cx-error" id="cx-unlock-error" aria-live="polite"></p></div>';
  }
  function quick(){
    return section("Ajustes rápidos",'<div class="cx-quick-grid">'+
      sw("airplane","Modo avião","Gerenciar conexões",x.airplane)+
      sw("flashlight","Lanterna","Acender ou apagar",x.flashlight)+
      sw("dnd","Não perturbe","Silenciar notificações",x.dnd)+
      sw("silent","Silencioso","Desligar toques",x.silent)+'</div>'+
      row("wifi","Wi-Fi e Bluetooth","Conexões do celular","connections")+
      row("display","Tela e brilho","Ajustar iluminação","display"));
  }
  function renderScreen(screen){
    if(x.locked)return lockscreen();
    switch(screen){
      case "camera":return camera();
      case "files":return files();
      case "file-detail":return fileDetail();
      case "calendar":return calendar();
      case "qr":return qr();
      case "screenshots":return screenshot();
      case "share":return share();
      case "battery":return battery();
      case "storage":return storage();
      case "security":return security();
      case "quick":return quick();
      default:return null;
    }
  }
  function apps(){
    return ["camera","files","calendar","qr","screenshots"].map(id=>catalog.find(a=>a.id===id)).map(a=>ctx.app(a.icon,a.title==="Arquivos e downloads"?"Arquivos":a.title,a.id)).join("");
  }
  function screenshotSvg(){
    const time=new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
    const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 360"><rect width="220" height="360" rx="18" fill="#e8dced"/>'+
      '<text x="22" y="32" font-family="sans-serif" font-size="13" fill="#332d40">UnAPI</text>'+
      '<text x="22" y="122" font-family="sans-serif" font-size="55" fill="#342b3d">'+time+'</text>'+
      '<rect x="20" y="204" width="43" height="43" rx="12" fill="#59616f"/>'+
      '<rect x="79" y="204" width="43" height="43" rx="12" fill="#389b76"/>'+
      '<rect x="138" y="204" width="43" height="43" rx="12" fill="#596fbe"/>'+
      '<text x="23" y="266" font-family="sans-serif" font-size="11" fill="#332d40">Config.</text>'+
      '<text x="83" y="266" font-family="sans-serif" font-size="11" fill="#332d40">Mens.</text>'+
      '<text x="144" y="266" font-family="sans-serif" font-size="11" fill="#332d40">Relógio</text>'+
      '<rect x="20" y="313" width="180" height="26" rx="13" fill="#f9f6fa"/></svg>';
    return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
  }
  function handleClick(button){
    const cmd=button.dataset.cx;
    if(!cmd)return false;
    if(cmd==="scene-next" || cmd==="scene-prev")x.cameraScene=(x.cameraScene+(cmd==="scene-next"?1:scenes.length-1))%scenes.length;
    else if(cmd==="flash")x.flash=!x.flash;
    else if(cmd==="shutter"){
      const s=scenes[x.cameraScene],id=200+ ++x.cameraCount;
      const name="Foto "+x.cameraCount+" · "+s.title;
      const capture={fileId:id,src:s.src,label:name};
      x.captures.push(capture);
      x.entries.push({id,name:name+".webp",type:"image",folder:"Imagens",deleted:false,src:s.src});
      announce("Foto adicionada à galeria.");
    }else if(cmd==="open-gallery"){openScreen("gallery");return true;}
    else if(cmd.startsWith("folder:")){x.fileFolder=cmd.slice(7);x.fileSearch="";x.confirmTrash=false;}
    else if(cmd==="file-clear"){x.fileSearch="";}
    else if(cmd==="empty-trash")x.confirmTrash=true;
    else if(cmd==="empty-trash-cancel")x.confirmTrash=false;
    else if(cmd==="empty-trash-confirm"){
      x.entries=x.entries.filter(e=>!e.deleted);
      x.captures=x.captures.filter(p=>x.entries.some(e=>e.id===p.fileId));
      x.confirmTrash=false;announce("Lixeira esvaziada.");
    }
    else if(cmd.startsWith("file:")){x.selectedFile=Number(cmd.slice(5));openScreen("file-detail");return true;}
    else if(cmd.startsWith("trash:")){const e=x.entries.find(z=>z.id===Number(cmd.slice(6)));if(e){e.deleted=true;announce("Arquivo enviado à lixeira.");}}
    else if(cmd.startsWith("restore:")){const e=x.entries.find(z=>z.id===Number(cmd.slice(8)));if(e){e.deleted=false;announce("Arquivo restaurado.");}}
    else if(cmd.startsWith("move:")){const e=x.entries.find(z=>z.id===x.selectedFile);if(e){e.folder=cmd.slice(5);announce("Arquivo movido.");}}
    else if(cmd==="download-sample"){
      const id=300+x.entries.filter(e=>e.name==="Lista de atividades.txt").length;
      if(!x.entries.some(e=>e.name==="Lista de atividades.txt"&&!e.deleted))x.entries.push({id,name:"Lista de atividades.txt",type:"text",folder:"Downloads",deleted:false});
      announce("Arquivo encontrado na pasta Downloads.");
    }
    else if(cmd.startsWith("del-event:"))x.events=x.events.filter(e=>e.id!==Number(cmd.slice(10)));
    else if(cmd==="scan-qr")x.qrResult=true;
    else if(cmd==="close-qr")x.qrResult=false;
    else if(cmd==="open-portal"){window.open("https://pet-sistemas.github.io/unapi-oficinas/","_blank","noopener,noreferrer");return true;}
    else if(cmd==="take-screenshot"){
      const id=400+x.entries.filter(e=>e.type==="screenshot").length+1,src=screenshotSvg();
      x.entries.push({id,name:"Captura da tela "+new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}).replace(":","h")+".svg",type:"screenshot",folder:"Imagens",src,deleted:false});
      x.captures.push({fileId:id,src,label:"Captura de tela"});
      announce("Captura adicionada em Arquivos e Fotos.");
    }
    else if(cmd==="go-files"){x.fileFolder="Todos";openScreen("files");return true;}
    else if(cmd==="go-trash"){x.fileFolder="Lixeira";openScreen("files");return true;}
    else if(cmd==="go-store"){openScreen("store");return true;}
    else if(cmd==="share-selected-photo"){
      x.sharing=ctx.photoLabel(ctx.selectedPhoto());
      openScreen("share");return true;
    }
    else if(cmd.startsWith("share-file:")){const e=x.entries.find(z=>z.id===Number(cmd.slice(11)));if(e){x.sharing=e.name;openScreen("share");return true;}}
    else if(cmd.startsWith("share-content:")){
      const choice=cmd.slice(14),captures=x.captures;
      x.sharing=choice==="file"?"Orientações da oficina.pdf":choice==="photo"&&captures.length?captures[captures.length-1].label:"Foto da oficina";
    }
    else if(cmd==="cancel-share")x.sharing=null;
    else if(cmd.startsWith("share-to:")){
      const recipient=Number(cmd.slice(9));
      if(ctx.contacts().some(c=>c.id===recipient) && x.sharing){
        ctx.sendMessage(recipient,"Compartilhou: "+x.sharing);
        announce("Enviado para a conversa.");
        x.sharing=null;
        openScreen("messages");return true;
      }
    }
    else if(cmd==="battery-saver")x.batterySaver=!x.batterySaver;
    else if(cmd==="airplane"){x.airplane=!x.airplane;if(x.airplane){state.settings.wifi=false;state.settings.bluetooth=false;}}
    else if(cmd==="flashlight")x.flashlight=!x.flashlight;
    else if(cmd==="dnd")x.dnd=!x.dnd;
    else if(cmd==="silent")x.silent=!x.silent;
    else if(cmd==="lock-now" && x.pin){x.locked=true;openScreen("security");return true;}
    else if(cmd==="remove-pin"){x.pin=null;x.locked=false;}
    else return false;
    render();return true;
  }
  function handleSubmit(event){
    const form=event.target,what=form.dataset.cxForm;
    if(!what)return false;
    event.preventDefault();
    const f=new FormData(form);
    if(what==="file-search")x.fileSearch=String(f.get("search")||"").trim().slice(0,40);
    if(what==="rename"){
      const name=String(f.get("name")||"").trim(),e=x.entries.find(v=>v.id===x.selectedFile);
      if(name&&e){e.name=name.slice(0,48);announce("Nome atualizado.");}
    }
    if(what==="event"){
      const title=String(f.get("title")||"").trim(),date=String(f.get("date")||""),time=String(f.get("time")||"");
      if(title&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&/^\d{2}:\d{2}$/.test(time)){
        const id=x.events.reduce((v,e)=>Math.max(v,e.id),0)+1;
        x.events.push({id,title:title.slice(0,55),date,time});
        ctx.notify("Compromisso adicionado","Você marcou "+title.slice(0,40));
        announce("Compromisso incluído na agenda.");
      }
    }
    if(what==="pin-create"){
      const pin=String(f.get("pin")||"");
      if(/^\d{4}$/.test(pin)){x.pin=pin;announce("Bloqueio configurado.");}
    }
    if(what==="pin-unlock"){
      const pin=String(f.get("pin")||"");
      if(pin===x.pin && x.pin){x.locked=false;announce("Celular desbloqueado.");openScreen("home");return true;}
      else {
        const error=document.getElementById("cx-unlock-error");
        if(error)error.textContent="PIN incorreto. Tente novamente.";
        announce("PIN incorreto.");return true;
      }
    }
    render();return true;
  }
  function handleChange(event){
    if(event.target.dataset.cxRange==="battery"){
      x.battery=Number(event.target.value);
      render();
      return true;
    }
    return false;
  }
  function reset(){x=seed();}
  function photos(){return x.captures.filter(p=>x.entries.some(e=>e.id===p.fileId&&!e.deleted));}
  function deletePhoto(index){
    const photo=photos()[index];
    if(!photo)return false;
    const e=x.entries.find(e=>e.id===photo.fileId);
    if(!e)return false;
    e.deleted=true;announce("Foto movida para a lixeira.");return true;
  }
  function status(){return {battery:x.battery,airplane:x.airplane,flashlight:x.flashlight,dnd:x.dnd,silent:x.silent,locked:x.locked};}
  return {catalog,renderScreen,handleClick,handleSubmit,handleChange,reset,apps,photos,status,locked:()=>x.locked,
    deletePhoto,pickPhoto:(src,label)=>{x.sharing=label;openScreen("share");}};
};
