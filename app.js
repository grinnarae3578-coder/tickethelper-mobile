(()=>{'use strict';
const KEY='tickethelper-mobile-v1', $=id=>document.getElementById(id);
let entries=[];
try{const parsed=JSON.parse(localStorage.getItem(KEY)||'[]');entries=Array.isArray(parsed)?parsed:[]}catch{}
const defaults={'NOL 티켓':'https://tickets.interpark.com/','예술의전당':'https://www.sac.or.kr/','YES24 티켓':'https://ticket.yes24.com/','티켓링크':'https://www.ticketlink.co.kr/'};
function save(){localStorage.setItem(KEY,JSON.stringify(entries));render()}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function validUrl(s){try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)?u.href:null}catch{return null}}
function displayTime(s){return s?s.replace('T',' ').replace(/-/g,'.'):''}
function calendar(e){
 const local=new Date(e.datetime+':00');
 if(Number.isNaN(local.getTime())){alert('날짜를 확인하세요.');return}
 const pad=n=>String(n).padStart(2,'0'),fmt=d=>d.getUTCFullYear()+pad(d.getUTCMonth()+1)+pad(d.getUTCDate())+'T'+pad(d.getUTCHours())+pad(d.getUTCMinutes())+pad(d.getUTCSeconds())+'Z';
 const start=new Date(local.getTime()),end=new Date(local.getTime()+15*60000);
 const clean=s=>String(s||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
 const description=[e.venue,'예매 인원: '+e.qty,'좌석: '+e.seats,'메모: '+e.notes,'예매 링크: '+(validUrl(e.url)||defaults[e.venue]||'')].join('\n');
 const alarms=[30,10,1].map(m=>'BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:예매 시작 '+m+'분 전\r\nTRIGGER:-PT'+m+'M\r\nEND:VALARM').join('\r\n');
 const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//TicketHelper Mobile//KO','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:'+e.id+'@tickethelper.local','DTSTAMP:'+fmt(new Date()),'DTSTART:'+fmt(start),'DTEND:'+fmt(end),'SUMMARY:'+clean('티켓 예매: '+e.title),'DESCRIPTION:'+clean(description),alarms,'END:VEVENT','END:VCALENDAR'].join('\r\n');
 download(new Blob([ics],{type:'text/calendar;charset=utf-8'}),'ticket-'+e.id+'.ics');
}
function download(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function render(){
 entries.sort((a,b)=>a.datetime.localeCompare(b.datetime));$('total').textContent='('+entries.length+'건)';
 $('list').innerHTML=entries.length?'':'<div class="empty">등록된 일정이 없습니다. 위에서 첫 일정을 등록해 보세요.</div>';
 entries.forEach(e=>{
 const node=document.createElement('div');node.className='item';
 const url=validUrl(e.url)||defaults[e.venue]||null;
 node.innerHTML='<span class="pill">'+esc(e.venue)+'</span><div><strong>'+esc(e.title)+'</strong></div><div class="meta">⏰ '+esc(displayTime(e.datetime))+' · '+esc(e.qty)+'명</div><div class="meta">좌석: '+esc(e.seats||'미설정')+'</div><div class="meta">메모: '+esc(e.notes||'없음')+'</div><div class="actions"></div>';
 const actions=node.querySelector('.actions');
 function btn(label,handler,cls){const b=document.createElement('button');b.textContent=label;b.className=cls||'secondary';b.onclick=handler;actions.append(b)}
 if(url){const a=document.createElement('a');a.className='link';a.textContent='예매 페이지 열기 ↗';a.href=url;a.target='_blank';a.rel='noopener noreferrer';actions.append(a)}
 btn('캘린더 알림 추가',()=>calendar(e));
 btn('수정',()=>{['title','venue','datetime','url','qty','seats','notes'].forEach(k=>$(k).value=e[k]||'');$('editId').value=e.id;window.scrollTo({top:0,behavior:'smooth'})});
 btn('삭제',()=>{if(confirm('이 일정을 삭제할까요?')){entries=entries.filter(x=>x.id!==e.id);save()}},'danger');
 $('list').append(node);
 });
}
$('ticketForm').addEventListener('submit',ev=>{
 ev.preventDefault();const e={id:$('editId').value||('t'+Date.now()+Math.random().toString(36).slice(2,7))};
 ['title','venue','datetime','url','qty','seats','notes'].forEach(k=>e[k]=$(k).value.trim());
 if(e.url&&!validUrl(e.url)){alert('http 또는 https 예매 링크를 입력하세요.');return}
 const idx=entries.findIndex(x=>x.id===e.id);if(idx>=0)entries[idx]=e;else entries.push(e);
 save();ev.target.reset();$('editId').value='';alert('일정을 저장했습니다. 캘린더 알림도 추가해 주세요.');
});
$('reset').onclick=()=>{$('ticketForm').reset();$('editId').value=''};
$('export').onclick=()=>download(new Blob([JSON.stringify(entries,null,2)],{type:'application/json'}),'tickethelper-backup.json');
$('importBtn').onclick=()=>$('importFile').click();
$('importFile').onchange=async ev=>{const file=ev.target.files[0];if(!file)return;try{
 const arr=JSON.parse(await file.text());if(!Array.isArray(arr)||!arr.every(e=>e&&typeof e.title==='string'&&typeof e.datetime==='string'))throw Error('형식 오류');
 if(confirm('기존 일정에 백업 일정을 추가할까요?')){const ids=new Set(entries.map(e=>e.id));for(const e of arr){if(!ids.has(e.id)){entries.push(e);ids.add(e.id)}}save()}
 }catch{alert('유효한 백업 파일이 아닙니다.')}ev.target.value=''};
if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
function countdown(){const t=new Date('2026-10-15T14:00:00+09:00').getTime()-Date.now();if(t<=0){$('countdown').textContent='예매 예정 시각이 지났습니다';return}const sec=Math.floor(t/1000),days=Math.floor(sec/86400),hrs=Math.floor(sec%86400/3600),mins=Math.floor(sec%3600/60);$('countdown').textContent=`D-${days} · ${hrs}시간 ${mins}분 ${sec%60}초`}
setInterval(countdown,1000);countdown();
$('presetGwangju').onclick=()=>{const entry={id:'gwangju-20261015',title:'광주 KBO 포스트시즌 경기',venue:'NOL 티켓',datetime:'2026-10-15T14:00',url:'',qty:'2',seats:'1순위 3루 KIA 홈 응원석 통로 연석 / 2순위 3루 내야 / 3순위 기타 내야 / 4순위 외야 포함 어디든. 분리 좌석 허용',notes:'광주 경기만 최대 2매. 예매 시작 시각 및 경기별 상세 URL 최종 확인'};const i=entries.findIndex(x=>x.id===entry.id);if(i<0)entries.push(entry);else entries[i]=entry;save();alert('광주 경기 일정이 등록되었습니다. 실제 예매 URL을 수정 입력하세요.');};
let demo=[];function generate(){demo=Array.from({length:32},(_,i)=>({n:i+1,free:Math.random()>.45,selected:false}));draw();$('seatResult').textContent='회색은 매진, 흰색은 선택 가능 (가상 좌석)'}
function draw(){const g=$('seatGrid');g.innerHTML='';demo.forEach((s,i)=>{const b=document.createElement('button');b.textContent=String(s.n);b.disabled=!s.free;b.style.padding='10px 0';b.style.background=s.selected?'#197450':s.free?'#e8edf5':'#aab1bd';b.style.color=s.selected?'white':'#18243a';b.style.border=i%8===0||i%8===7?'2px solid #6980a4':'0';b.style.fontSize='12px';b.onclick=()=>{s.selected=!s.selected;draw()};g.append(b)})}
$('generateSeats').onclick=generate;
$('findSeats').onclick=()=>{demo.forEach(s=>s.selected=false);let picks=[];for(let row=0;row<4&&!picks.length;row++){for(const col of [0,6]){const i=row*8+col;if(demo[i].free&&demo[i+1].free){picks=[i,i+1];break}}}if(!picks.length){for(let i=0;i<demo.length-1;i++){if(demo[i].free&&demo[i+1].free&&Math.floor(i/8)===Math.floor((i+1)/8)){picks=[i,i+1];break}}}if(!picks.length)picks=demo.map((s,i)=>s.free?i:-1).filter(i=>i>=0).slice(0,2);picks.forEach(i=>demo[i].selected=true);draw();$('seatResult').textContent=picks.length===2?'모의 선택: '+picks.map(i=>demo[i].n+'번').join(', ')+' (실제 예매와 무관)':'모의 환경에 2매가 없습니다.'};
generate();
render();
})();