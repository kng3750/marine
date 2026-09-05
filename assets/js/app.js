import {fields, careers as seedCareers, glossary} from './data.js';

const $ = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>[...root.querySelectorAll(s)];
const esc = v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const store = {
  get(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}},
  set(k,v){localStorage.setItem(k,JSON.stringify(v))}
};
let careers=store.get('mp-careers',seedCareers);
let saved=store.get('mp-saved',[]);
let compare=store.get('mp-compare',[]);
let profile=store.get('mp-profile',{});
let persistentReady=false;
const main=$('#main');

async function loadPersistentCareers(){
  try{
    const response=await fetch('/api/careers',{cache:'no-store'});
    if(!response.ok)return;
    const data=await response.json();
    persistentReady=Boolean(data.persistent);
    if(Array.isArray(data.careers)&&data.careers.length){careers=data.careers;store.set('mp-careers',careers)}
  }catch(error){console.warn('[careers] 서버 데이터를 불러오지 못해 로컬 데이터를 사용합니다.',error)}
}

async function persistCareers(){
  if(!persistentReady)throw new Error('영구 저장 환경변수가 아직 설정되지 않았습니다.');
  let password=sessionStorage.getItem('mp-admin-password');
  if(!password){password=prompt('영구 저장을 위한 관리자 비밀번호를 입력하세요.');if(!password)throw new Error('저장이 취소되었습니다.');sessionStorage.setItem('mp-admin-password',password)}
  const response=await fetch('/api/careers',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${password}`},body:JSON.stringify({careers})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok){if(response.status===401)sessionStorage.removeItem('mp-admin-password');throw new Error(data.error||'영구 저장에 실패했습니다.')}
  return data;
}

function field(id){return fields.find(f=>f.id===id)||fields[0]}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200)}
function sync(){store.set('mp-saved',saved);store.set('mp-compare',compare);$('#savedCount').textContent=saved.length}
function route(){return location.hash.slice(1)||'home'}
function go(hash){location.hash=hash}
function header(title,desc,eyebrow='CAREER NAVIGATION'){
  return `<section class="page-hero"><div class="inner"><span class="eyebrow">${esc(eyebrow)}</span><h1 class="page-title">${esc(title)}</h1><p>${esc(desc)}</p></div></section>`
}
function careerCard(c){const f=field(c.field);return `<article class="career-card" data-field="${c.field}">
  <button class="save-button ${saved.includes(c.id)?'active':''}" data-save="${c.id}" aria-label="${esc(c.name)} 관심 저장">${saved.includes(c.id)?'♥':'♡'}</button>
  <span class="tag">${esc(f.name)}</span><h3><a href="#career/${c.id}">${esc(c.name)}</a></h3><small>${esc(c.english)}</small>
  <p>${esc(c.summary)}</p><div class="career-meta"><span>${esc(c.workType)}</span><span>PDF ${esc(c.page)}쪽</span></div>
  <div class="tag-row"><span class="tag">${esc(c.license)}</span><span class="tag warn">${esc(c.experience)}</span></div>
  <div class="actions"><a class="button small" href="#career/${c.id}">상세 보기</a><button class="button small secondary" data-compare="${c.id}">${compare.includes(c.id)?'비교에서 제외':'비교 담기'}</button></div>
  </article>`}

function home(){
  const recommended=careers.filter(c=>['선박운항관리자','한국선급 검사원','해양안전심판관·조사관','선박금융 전문가'].includes(c.name));
  main.innerHTML=`<section class="hero"><div class="hero-inner"><span class="eyebrow">FROM SEA TO POSSIBILITY</span><h1>당신의 승선경력,<br><em>다음 항로</em>를 찾다.</h1><p>면허와 경력을 바탕으로 해운·공직·공공기관·교육·검사·법률금융까지 73개의 진로를 탐색하고 나만의 로드맵을 설계하세요.</p><div class="hero-actions"><a class="button" href="#roadmap">내 진로 추천받기</a><a class="button light" href="#explore">전체 직업 탐색</a></div></div></section>
  <div class="stats"><div class="stat"><strong>${careers.length}</strong><span>수록 진로</span></div><div class="stat"><strong>7</strong><span>전문 분야</span></div><div class="stat"><strong>165</strong><span>분석 페이지</span></div><div class="stat"><strong>1</strong><span>나만의 로드맵</span></div></div>
  <section class="section"><div class="section-head"><div><span class="eyebrow">7 CAREER SECTORS</span><h2>바다에서 이어지는<br>일곱 개의 항로</h2></div><p>승선경력은 한 가지 직업에 머물지 않습니다. 현장 경험과 면허를 기반으로 다양한 해양산업 분야로 확장할 수 있습니다.</p></div><div class="field-grid">${fields.map(f=>`<a class="field-card" href="#explore?field=${f.id}" style="border-top:4px solid ${f.color}"><div><span class="field-number">CHAPTER ${f.chapter} · ${f.icon}</span><h3>${f.name}</h3><p>${f.summary}</p></div><strong>${careers.filter(c=>c.field===f.id).length}개 진로 →</strong></a>`).join('')}</div></section>
  <section class="section alt"><div class="inner"><div class="section-head"><div><span class="eyebrow">CURATED PATHS</span><h2>경험을 가치로 바꾸는 진로</h2></div><a href="#explore">전체 보기 →</a></div><div class="career-grid">${recommended.map(careerCard).join('')}</div></div></section>
  <section class="section"><div class="panel"><span class="eyebrow">START YOUR ROUTE</span><h2>현재 위치를 알려주면<br>도달 가능한 진로를 제안합니다.</h2><p>면허, 승선경력, 선호 근무형태를 조합해 지금 지원 가능한 직업과 준비가 필요한 직업을 구분합니다.</p><a class="button" href="#roadmap">맞춤 진로 설계 시작</a></div></section>`;
}

function explore(){
  const query=route().split('?')[1]||'';const initial=new URLSearchParams(query).get('field')||'';
  main.innerHTML=header('진로 탐색','면허·경력·근무형태를 기준으로 제3장부터 제9장까지의 해기사 연계 진로를 찾아보세요.')+`<section class="section"><div class="search-shell"><aside class="filters panel"><div class="filter-group"><label for="search">통합검색</label><input class="input" id="search" placeholder="직업·기관·면허 검색"></div><div class="filter-group"><label for="fieldFilter">분야</label><select class="input" id="fieldFilter"><option value="">전체 분야</option>${fields.map(f=>`<option value="${f.id}" ${initial===f.id?'selected':''}>${f.name}</option>`).join('')}</select></div><div class="filter-group"><label for="workFilter">근무형태</label><select class="input" id="workFilter"><option value="">전체</option>${[...new Set(careers.map(c=>c.workType))].map(v=>`<option>${v}</option>`).join('')}</select></div><button class="text-button" id="resetFilters">필터 초기화</button><hr><p><strong id="resultCount">${careers.length}</strong>개의 진로</p></aside><div><div class="career-grid" id="careerResults"></div></div></div></section>`;
  const render=()=>{const q=$('#search').value.toLowerCase(),f=$('#fieldFilter').value,w=$('#workFilter').value;const rows=careers.filter(c=>(!q||JSON.stringify(c).toLowerCase().includes(q))&&(!f||c.field===f)&&(!w||c.workType===w));$('#resultCount').textContent=rows.length;$('#careerResults').innerHTML=rows.length?rows.map(careerCard).join(''):'<div class="empty">조건에 맞는 진로가 없습니다.</div>'};
  ['search','fieldFilter','workFilter'].forEach(id=>$('#'+id).addEventListener('input',render));$('#resetFilters').onclick=()=>{$('#search').value='';$('#fieldFilter').value='';$('#workFilter').value='';render()};render();
}

function detail(id){const c=careers.find(x=>x.id===id);if(!c){notFound();return}const f=field(c.field);main.innerHTML=header(c.name,c.summary,`${f.name} · PDF ${c.page}쪽`)+`<section class="section"><div class="detail-layout"><div class="detail-main"><div class="notice">이 페이지는 PDF 원문을 구조화한 진로 안내입니다. 실제 지원 전 최신 법령과 공식 채용공고를 확인하세요.</div><section><h2>직업 개요</h2><p>${esc(c.summary)}. 해기사의 현장 이해와 전문성을 활용할 수 있는 ${esc(c.workType)} 중심 진로입니다.</p></section><section><h2>주요 업무</h2><ul>${c.duties.map(v=>`<li>${esc(v)}</li>`).join('')}</ul></section><section><h2>진입 및 성장경로</h2><div class="steps">${c.path.map(v=>`<div class="step">${esc(v)}</div>`).join('')}</div></section><section><h2>준비 포인트</h2><p><strong>교육:</strong> ${esc(c.education)}</p><p><strong>영어:</strong> ${esc(c.englishLevel)}</p></section><section><h2>출처와 최신성</h2><p>${esc(c.source)} · 최종 데이터 검토 ${esc(c.updatedAt)}</p><p>${esc(c.status)}</p>${c.officialUrl?`<a class="button small" href="${esc(c.officialUrl)}" target="_blank" rel="noopener">공식 사이트 확인</a>`:''}</section></div><aside class="side-panel panel"><h2>한눈에 보기</h2><div class="fact"><small>분야</small><strong>${esc(f.name)}</strong></div><div class="fact"><small>근무형태</small><strong>${esc(c.workType)}</strong></div><div class="fact"><small>관련 면허</small><strong>${esc(c.license)}</strong></div><div class="fact"><small>경력</small><strong>${esc(c.experience)}</strong></div><div class="fact"><small>영어</small><strong>${esc(c.englishLevel)}</strong></div><div class="actions"><button class="button" data-save="${c.id}">${saved.includes(c.id)?'관심 진로 해제':'관심 진로 저장'}</button><button class="button secondary" data-compare="${c.id}">비교 담기</button></div></aside></div></section>`}

function roadmap(){
  main.innerHTML=header('맞춤 진로설계','현재 면허와 경력, 선호하는 일의 방식을 입력하면 적합도가 높은 진로를 안내합니다.')+`<section class="section"><div class="panel"><form id="profileForm"><div class="form-grid"><div><label for="license">보유 면허</label><select class="input" id="license" name="license"><option value="">선택</option><option>항해사</option><option>기관사</option><option>운항사</option><option>통신사</option><option>면허 없음</option></select></div><div><label for="grade">면허 등급</label><select class="input" id="grade" name="grade"><option value="">선택</option>${[1,2,3,4,5,6].map(v=>`<option value="${v}">${v}급</option>`).join('')}</select></div><div><label for="years">승선경력</label><select class="input" id="years" name="years"><option value="0">없음</option><option value="1">1~2년</option><option value="3">3~5년</option><option value="6">6년 이상</option></select></div><div><label for="preference">희망 근무형태</label><select class="input" id="preference" name="preference"><option value="">상관없음</option>${[...new Set(careers.map(c=>c.workType))].map(v=>`<option>${v}</option>`).join('')}</select></div><div><label for="interest">관심 분야</label><select class="input" id="interest" name="interest"><option value="">상관없음</option>${fields.map(f=>`<option value="${f.id}">${f.name}</option>`).join('')}</select></div><div><label for="english">영어 활용</label><select class="input" id="english" name="english"><option>보통</option><option>높음</option><option>낮음</option></select></div></div><div class="actions"><button class="button" type="submit">추천 항로 분석</button></div></form></div><div id="recommendations"></div></section>`;
  Object.entries(profile).forEach(([k,v])=>{const e=$(`[name="${k}"]`);if(e)e.value=v});$('#profileForm').onsubmit=e=>{e.preventDefault();profile=Object.fromEntries(new FormData(e.target));store.set('mp-profile',profile);renderRecommendations()};if(Object.keys(profile).length)renderRecommendations();
}
function scoreCareer(c){let s=45,why=[];if(profile.interest===c.field){s+=25;why.push('관심 분야 일치')}if(profile.preference===c.workType){s+=15;why.push('희망 근무형태 일치')}if(profile.license&&c.license.includes(profile.license)){s+=20;why.push(`${profile.license} 면허 연계`)}if(+profile.years>=3&&/경력|승선|해기사/.test(c.experience)){s+=10;why.push('승선경력 활용')}if(profile.english==='높음'&&c.englishLevel==='높음'){s+=5;why.push('영어 역량 활용')}return {c,s:Math.min(s,98),why}}
function renderRecommendations(){const rows=careers.map(scoreCareer).sort((a,b)=>b.s-a.s).slice(0,6);$('#recommendations').innerHTML=`<div class="section-head" style="margin-top:55px"><div><span class="eyebrow">PERSONAL RESULT</span><h2>추천 진로 6선</h2></div><p>적합도는 입력 조건과 원문 데이터를 비교한 탐색용 지표이며 지원자격 충족을 의미하지 않습니다.</p></div><div class="career-grid">${rows.map(({c,s,why})=>`<article class="career-card result-card"><span class="score">${s}%</span><h3><a href="#career/${c.id}">${esc(c.name)}</a></h3><p>${why.join(' · ')||'해양산업 연계 진로'}</p><div class="tag-row"><span class="tag">${field(c.field).name}</span><span class="tag warn">${c.experience}</span></div></article>`).join('')}</div>`}

function comparePage(){const selected=compare.map(id=>careers.find(c=>c.id===id)).filter(Boolean);main.innerHTML=header('직업 비교','최대 3개의 진로를 같은 기준으로 비교해 보세요.')+`<section class="section"><div class="panel"><label for="compareSelect">비교할 직업 추가</label><div class="actions"><select class="input" id="compareSelect" style="max-width:420px"><option value="">직업 선택</option>${careers.filter(c=>!compare.includes(c.id)).map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select><button class="button" id="addCompare">추가</button></div></div><div id="compareContent"></div></section>`;$('#addCompare').onclick=()=>{const id=$('#compareSelect').value;if(!id)return;if(compare.length>=3)return toast('최대 3개까지 비교할 수 있습니다.');compare.push(id);sync();comparePage()};if(!selected.length){$('#compareContent').innerHTML='<div class="empty">비교할 직업을 추가하세요.</div>';return}const rows=[['분야',c=>field(c.field).name],['근무형태',c=>c.workType],['관련 면허',c=>c.license],['경력',c=>c.experience],['영어',c=>c.englishLevel],['출처',c=>c.source]];$('#compareContent').innerHTML=`<div class="compare-wrap" style="margin-top:25px"><table class="compare-table"><thead><tr><th>비교 기준</th>${selected.map(c=>`<th>${c.name}<br><button class="text-button" data-compare="${c.id}">제외</button></th>`).join('')}</tr></thead><tbody>${rows.map(([n,get])=>`<tr><th>${n}</th>${selected.map(c=>`<td>${esc(get(c))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}

function organizations(){const rows=careers.filter(c=>['associations','government','public','education'].includes(c.field));main.innerHTML=header('기관·기업 찾기','해기사의 전문성을 필요로 하는 협회·공직·공공·교육연구 기관을 살펴보세요.')+`<section class="section"><div class="career-grid">${rows.map(careerCard).join('')}</div></section>`}
function glossaryPage(){main.innerHTML=header('해양직업 용어사전','진로 탐색 중 만나는 해운·검사·보험 분야의 핵심 용어입니다.')+`<section class="section"><div class="glossary-grid">${glossary.map(([t,d])=>`<div class="glossary-item"><strong>${t}</strong><p>${d}</p></div>`).join('')}</div></section>`}
function savedPage(){const rows=saved.map(id=>careers.find(c=>c.id===id)).filter(Boolean);main.innerHTML=header('관심 진로','저장한 직업을 모아 보고 비교 목록에 추가하세요.')+`<section class="section">${rows.length?`<div class="career-grid">${rows.map(careerCard).join('')}</div>`:'<div class="empty">저장한 관심 진로가 없습니다.<br><a class="button" href="#explore">진로 탐색하기</a></div>'}</section>`}

function admin(){main.innerHTML=header('콘텐츠 관리자','진로 데이터를 수정하고 JSON으로 백업·복원합니다. 변경사항은 현재 브라우저에 저장됩니다.','LOCAL CONTENT STUDIO')+`<section class="section"><div class="notice">정적 사이트용 로컬 관리자입니다. 공용 서버 인증이나 팀 동기화 기능은 제공하지 않습니다. 운영 반영은 JSON을 내보내 저장소 데이터에 반영하세요.</div><div class="admin-toolbar" style="margin-top:25px"><button class="button" id="newCareer">새 진로 추가</button><button class="button secondary" id="exportData">JSON 내보내기</button><label class="button secondary">JSON 가져오기<input id="importData" type="file" accept="application/json" hidden></label><button class="button danger" id="resetData">기본 데이터 복원</button></div><div class="panel"><div class="filter-group"><label for="adminSearch">검색</label><input class="input" id="adminSearch" placeholder="직업명 검색"></div><div class="admin-list" id="adminList"></div></div></section><dialog class="modal" id="editor"><form method="dialog" class="modal-inner" id="editorForm"><h2>진로 편집</h2><input type="hidden" name="id"><div class="form-grid"><div><label>직업명</label><input class="input" name="name" required></div><div><label>영문명</label><input class="input" name="english"></div><div><label>분야</label><select class="input" name="field">${fields.map(f=>`<option value="${f.id}">${f.name}</option>`).join('')}</select></div><div><label>PDF 페이지</label><input class="input" name="page" type="number"></div><div><label>근무형태</label><input class="input" name="workType"></div><div><label>관련 면허</label><input class="input" name="license"></div><div><label>경력요건</label><input class="input" name="experience"></div><div><label>공식 URL</label><input class="input" name="officialUrl" type="url"></div></div><label>요약</label><textarea class="input" name="summary" rows="3" required></textarea><div class="modal-actions"><button class="button secondary" value="cancel">취소</button><button class="button" id="saveCareer" value="default">저장</button></div></form></dialog>`;renderAdmin();$('#adminSearch').oninput=renderAdmin;$('#newCareer').onclick=()=>openEditor();$('#exportData').onclick=exportData;$('#importData').onchange=importData;$('#resetData').onclick=()=>{if(confirm('관리자 수정 내용을 모두 지우고 기본 데이터로 복원할까요?')){careers=structuredClone(seedCareers);store.set('mp-careers',careers);renderAdmin();toast('기본 데이터로 복원했습니다.')}};$('#editorForm').onsubmit=e=>{if(e.submitter?.value==='cancel')return; e.preventDefault();saveEditor()}}
function renderAdmin(){const list=$('#adminList');if(!list)return;const q=$('#adminSearch').value.toLowerCase();list.innerHTML=careers.filter(c=>c.name.toLowerCase().includes(q)).map(c=>`<div class="admin-row"><div><strong>${esc(c.name)}</strong><small> · ${field(c.field).name} · PDF ${c.page}쪽</small></div><div><button class="button small secondary" data-edit="${c.id}">편집</button> <button class="text-button" data-delete="${c.id}">삭제</button></div></div>`).join('')}
function openEditor(id){const c=careers.find(x=>x.id===id)||{id:'',name:'',english:'',field:'shipping',page:40,workType:'육상',license:'직무별 상이',experience:'요건 확인',officialUrl:'',summary:''};const form=$('#editorForm');Object.entries(c).forEach(([k,v])=>{const el=form.elements[k];if(el&&!Array.isArray(v))el.value=v});$('#editor').showModal()}
async function saveEditor(){
  const data=Object.fromEntries(new FormData($('#editorForm')));
  const previous=structuredClone(careers);
  let c=careers.find(x=>x.id===data.id);
  if(c)Object.assign(c,data,{page:+data.page,updatedAt:new Date().toISOString().slice(0,10)});
  else{c={...seedCareers[0],...data,id:`custom-${Date.now()}`,page:+data.page,duties:['주요 업무를 관리자에서 보완하세요.'],path:['요건 확인','준비','지원','성장'],updatedAt:new Date().toISOString().slice(0,10),source:`관리자 추가 · PDF ${data.page}쪽`};careers.push(c)}
  try{
    await persistCareers();
    store.set('mp-careers',careers);
    $('#editor').close();renderAdmin();toast('GitHub에 영구 저장했습니다.');
  }catch(error){careers=previous;alert(error.message)}
}
function exportData(){const blob=new Blob([JSON.stringify(careers,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`mariner-path-careers-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href)}
async function importData(e){try{const data=JSON.parse(await e.target.files[0].text());if(!Array.isArray(data)||!data.every(x=>x.id&&x.name&&x.field))throw Error();careers=data;store.set('mp-careers',careers);renderAdmin();toast(`${data.length}개 항목을 가져왔습니다.`)}catch{alert('올바른 진로 JSON 파일이 아닙니다.')}}
function notFound(){main.innerHTML=header('페이지를 찾을 수 없습니다','요청한 항로가 존재하지 않습니다.')+'<section class="section empty"><a class="button" href="#home">홈으로 이동</a></section>'}

document.addEventListener('click',e=>{const saveBtn=e.target.closest('[data-save]');if(saveBtn){const id=saveBtn.dataset.save;saved=saved.includes(id)?saved.filter(x=>x!==id):[...saved,id];sync();toast(saved.includes(id)?'관심 진로에 저장했습니다.':'관심 진로에서 해제했습니다.');render()}const comp=e.target.closest('[data-compare]');if(comp){const id=comp.dataset.compare;if(compare.includes(id))compare=compare.filter(x=>x!==id);else if(compare.length<3)compare.push(id);else return toast('비교는 최대 3개까지 가능합니다.');sync();toast('비교 목록을 변경했습니다.');render()}const edit=e.target.closest('[data-edit]');if(edit)openEditor(edit.dataset.edit);const del=e.target.closest('[data-delete]');if(del&&confirm('이 진로를 삭제할까요?')){careers=careers.filter(c=>c.id!==del.dataset.delete);store.set('mp-careers',careers);renderAdmin()}const dr=e.target.closest('[data-route]');if(dr)go(dr.dataset.route)});
$('#menuButton').onclick=()=>{const nav=$('#mainNav');nav.classList.toggle('open');$('#menuButton').setAttribute('aria-expanded',nav.classList.contains('open'))};
function render(){
  const [r,id]=route().split('?')[0].split('/');
  ({home,explore,roadmap,compare:comparePage,organizations,glossary:glossaryPage,saved:savedPage,admin}[r]||((r==='career')?()=>detail(id):notFound))();
  if(r==='admin'){
    const notice=$('.notice');
    notice.innerHTML=persistentReady
      ? '<strong>영구 저장 활성화</strong> · 변경사항은 관리자 인증 후 GitHub 데이터 파일에 저장되며 모든 방문자에게 동일하게 적용됩니다.'
      : '<strong>설정 필요</strong> · Vercel 환경변수 <code>GITHUB_TOKEN</code>과 <code>ADMIN_PASSWORD</code>를 설정해야 영구 저장할 수 있습니다.';
  }
  window.scrollTo(0,0);$('#mainNav').classList.remove('open');
}
window.addEventListener('hashchange',render);
sync();
await loadPersistentCareers();
render();
