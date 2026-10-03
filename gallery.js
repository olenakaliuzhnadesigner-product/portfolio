/* Photo gallery with a shared-element zoom: the thumbnail flies to the centre,
   the page blurs behind it; click, Esc or drag up/down to close. */
(function(){
  var items=[].slice.call(document.querySelectorAll('.gal-item[data-full]'));
  if(!items.length)return;
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE='cubic-bezier(.22,1.2,.36,1)',DUR=reduce?0:480;
  var layer=null,img=null,src=null,closeBtn=null,startY=0,dy=0,dragging=false,lastY=0,lastT=0,vel=0;

  function fit(nw,nh){
    var mw=innerWidth*.92,mh=innerHeight*.88,s=Math.min(mw/nw,mh/nh,1.6);
    var w=nw*s,h=nh*s;return {w:w,h:h,x:(innerWidth-w)/2,y:(innerHeight-h)/2};
  }
  function open(btn){
    if(layer)return;
    src=btn;var thumb=btn.querySelector('img');var r=thumb.getBoundingClientRect();
    var nw=thumb.naturalWidth||r.width,nh=thumb.naturalHeight||r.height,f=fit(nw,nh);
    layer=document.createElement('div');layer.className='gal-layer';
    layer.innerHTML='<div class="gal-backdrop"></div><button class="gal-close" type="button" aria-label="Close photo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>';
    layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');layer.setAttribute('aria-label',thumb.alt||'Photo');
    img=new Image();img.src=btn.dataset.full;img.alt=thumb.alt||'';img.className='gal-big';img.draggable=false;
    img.style.cssText='left:'+f.x+'px;top:'+f.y+'px;width:'+f.w+'px;height:'+f.h+'px;';
    var sx=r.width/f.w,sy=r.height/f.h,tx=r.left-f.x,ty=r.top-f.y;
    img.style.transformOrigin='0 0';img.style.transform='translate('+tx+'px,'+ty+'px) scale('+sx+','+sy+')';
    img.style.borderRadius=(14/sx)+'px';
    layer.appendChild(img);document.body.appendChild(layer);
    closeBtn=layer.querySelector('.gal-close');
    btn.style.visibility='hidden';document.body.style.overflow='hidden';
    void img.offsetWidth;
    layer.classList.add('open');
    img.style.transition='transform '+DUR+'ms '+EASE+',border-radius '+DUR+'ms ease';
    img.style.transform='none';img.style.borderRadius='14px';
    layer.addEventListener('click',function(e){if(!dragMoved)close();});
    closeBtn.addEventListener('click',function(e){e.stopPropagation();close();});
    img.addEventListener('pointerdown',down);
    setTimeout(function(){closeBtn.focus({preventScroll:true});},DUR);
  }
  function close(){
    if(!layer)return;
    var l=layer,b=src,i=img;layer=null;
    var r=b.getBoundingClientRect(),fx=parseFloat(i.style.left),fy=parseFloat(i.style.top),fw=parseFloat(i.style.width),fh=parseFloat(i.style.height);
    var sx=r.width/fw,sy=r.height/fh;
    i.style.transition='transform '+(DUR*.8)+'ms cubic-bezier(.3,1.1,.4,1),border-radius '+(DUR*.8)+'ms ease';
    i.style.transform='translate('+(r.left-fx)+'px,'+(r.top-fy)+'px) scale('+sx+','+sy+')';
    i.style.borderRadius=(14/sx)+'px';
    l.classList.remove('open');l.classList.add('closing');
    setTimeout(function(){b.style.visibility='';l.remove();document.body.style.overflow='';b.focus({preventScroll:true});},reduce?0:DUR*.8);
  }
  /* drag to dismiss */
  var dragMoved=false;
  function down(e){
    e.preventDefault();e.stopPropagation();dragging=true;dragMoved=false;startY=lastY=e.clientY;lastT=performance.now();dy=0;vel=0;
    img.style.transition='none';img.setPointerCapture(e.pointerId);
    img.addEventListener('pointermove',move);img.addEventListener('pointerup',up);img.addEventListener('pointercancel',up);
  }
  function move(e){
    if(!dragging)return;
    dy=e.clientY-startY;if(Math.abs(dy)>4)dragMoved=true;
    var now=performance.now();vel=(e.clientY-lastY)/Math.max(1,now-lastT)*1000;lastY=e.clientY;lastT=now;
    var k=Math.min(1,Math.abs(dy)/400);
    img.style.transform='translate(0px,'+(dy*.8)+'px) scale('+(1-k*.12)+')';
    layer.querySelector('.gal-backdrop').style.opacity=1-k*.7;
  }
  function up(){
    if(!dragging)return;dragging=false;
    img.removeEventListener('pointermove',move);img.removeEventListener('pointerup',up);img.removeEventListener('pointercancel',up);
    if(Math.abs(dy)>100||Math.abs(vel)>600){close();}
    else{
      img.style.transition='transform 420ms '+EASE;img.style.transform='none';
      layer.querySelector('.gal-backdrop').style.opacity='';
      if(!dragMoved)close();
    }
    setTimeout(function(){dragMoved=false;},0);
  }
  items.forEach(function(b){b.addEventListener('click',function(){open(b);});});
  addEventListener('keydown',function(e){if(e.key==='Escape'&&layer)close();});
})();
