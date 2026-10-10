(() => {
  const root = document.getElementById('app');
  const S = { user:null, profile:null, route:'home', params:new URLSearchParams(), modal:'', toast:'', currentBrief:null, currentPortfolio:null, aiNotice:'', search:{}, resultCreators:[], resultBriefs:[], page:1, lastBriefs:[], lastProposals:[], lastEngagements:[], lastPortfolio:[] };
  const PRIVATE = new Set(['dashboard','portfolio','brief-editor','proposals','engagements','engagement-detail','verification','profile','shortlist','matches','documents','deliverables','activity','platform','hiring']);
  const $ = (sel, from=document) => from.querySelector(sel);
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const asArray = v => {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') { try { const x=JSON.parse(v); if(Array.isArray(x)) return x; } catch(e){} return v.split(',').map(s=>s.trim()).filter(Boolean); }
    return [];
  };
  const money = (v,c='USD') => Number(v||0)>0 ? new Intl.NumberFormat('en-US',{style:'currency',currency:(c||'USD').length===3?c:'USD',maximumFractionDigits:0}).format(Number(v)) : 'Open to discussion';
  const initials = n => String(n||'C').split(/\s+/).filter(Boolean).slice(0,2).map(s=>s[0]).join('').toUpperCase();
  const chips = arr => asArray(arr).slice(0,5).map(t=>'<span class="tag">'+esc(t)+'</span>').join('');
  const pill = s => '<span class="status '+esc(String(s||'draft').toLowerCase())+'">'+esc(String(s||'draft').replace(/_/g,' '))+'</span>';
  const formatFileSize = bytes => {
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
  };
  const validateUploadFile = file => {
    if (!file) return { ok: true };
    const MAX_BYTES = 10 * 1024 * 1024; // 10 MB platform limit
    if (file.size > MAX_BYTES) {
      return {
        ok: false,
        error: 'File size (' + formatFileSize(file.size) + ') exceeds the 10 MB limit. Please select or compress a video under 10 MB.'
      };
    }
    const name = file.name.toLowerCase();
    if (name.endsWith('.mov')) {
      return {
        ok: false,
        error: 'QuickTime MOV (.mov) is not supported by the storage engine. Please convert your video to MP4 or WebM.'
      };
    }
    const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
    const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm'];
    const extMatch = ALLOWED_EXT.some(ext => name.endsWith(ext));
    const mimeMatch = ALLOWED_MIME.includes(file.type);
    if (!extMatch && !mimeMatch) {
      return {
        ok: false,
        error: 'Unsupported file format (' + (file.type || name.split('.').pop()) + '). Allowed formats: MP4, WebM (video) or JPG, PNG, WebP, GIF (image).'
      };
    }
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm)$/i.test(name);
    return { ok: true, isVideo };
  };
  const formField = (label,name,value='',opts={}) => {
    const full=opts.full?' full':'';
    const required=opts.required?' required':'';
    const placeholder=opts.placeholder||'';
    if(opts.type==='textarea') return '<div class="field'+full+'"><label for="'+esc(name)+'">'+esc(label)+'</label><textarea id="'+esc(name)+'" name="'+esc(name)+'" placeholder="'+esc(placeholder)+'"'+required+'>'+esc(value)+'</textarea>'+(opts.hint?'<small class="field-hint">'+esc(opts.hint)+'</small>':'')+'</div>';
    if(opts.type==='select') return '<div class="field'+full+'"><label for="'+esc(name)+'">'+esc(label)+'</label><select id="'+esc(name)+'" name="'+esc(name)+'"'+required+'>'+opts.options.map(o=>'<option value="'+esc(o.value)+'" '+(String(value)===String(o.value)?'selected':'')+'>'+esc(o.label)+'</option>').join('')+'</select></div>';
    return '<div class="field'+full+'"><label for="'+esc(name)+'">'+esc(label)+'</label><input id="'+esc(name)+'" name="'+esc(name)+'" type="'+esc(opts.type||'text')+'" value="'+esc(value)+'" placeholder="'+esc(placeholder)+'"'+(opts.min!==undefined?' min="'+esc(opts.min)+'"':'')+(opts.max!==undefined?' max="'+esc(opts.max)+'"':'')+(opts.step?' step="'+esc(opts.step)+'"':'')+required+'>'+(opts.hint?'<small class="field-hint">'+esc(opts.hint)+'</small>':'')+'</div>';
  };
  async function api(url, options={}) {
    const opts={method:options.method||'GET',credentials:'same-origin',headers:{...(options.headers||{})}};
    if(options.body!==undefined){
      if(typeof FormData!=='undefined' && options.body instanceof FormData) opts.body=options.body;
      else {opts.headers['Content-Type']='application/json';opts.body=JSON.stringify(options.body);}
    }
    const r=await fetch(url,opts);
    let d={};try{d=await r.json();}catch(e){}
    if(!r.ok) throw new Error(d.error||('Request failed ('+r.status+').'));
    return d;
  }
  function go(route) {
    S.modal=''; S.aiNotice='';
    const clean = String(route||'').replace(/^[\/#]+/, '');
    location.hash = '/' + clean;
    if(location.hash === '#/' + clean) render();
  }
  function routeFromLocation() {
    let raw=location.hash.replace(/^#\/?/,'');
    if(!raw) return {name:(location.pathname==='/app'||location.pathname==='/app/')?'dashboard':'home',anchor:'',params:new URLSearchParams()};
    let anchor='';
    let pathAndQuery=raw;
    if(pathAndQuery.includes('#')){
      const hParts=pathAndQuery.split('#');
      pathAndQuery=hParts[0];
      anchor=hParts[1]||'';
    }
    const parts=pathAndQuery.split('?');
    let name=decodeURIComponent(parts[0]||'home');
    if(name==='how-it-works'){
      name='home';
      anchor='how-it-works';
    }
    const params=new URLSearchParams(parts.slice(1).join('?'));
    return {name:name||'home',anchor,params};
  }
  function toast(message) { S.toast=message; renderToast(); setTimeout(()=>{S.toast='';renderToast();},3200); }
  function renderToast(){const el=$('#toast');if(S.toast){if(el){el.textContent=S.toast;el.hidden=false;}else{root.insertAdjacentHTML('beforeend','<div id="toast" class="toast" role="status">'+esc(S.toast)+'</div>');}}else if(el)el.remove();}
  function publicHeader() {
    return '<header class="header"><div class="container nav">' +
      '<a class="wordmark" href="#/home" data-go="home"><span class="mark">C</span> CREOVA</a>' +
      '<nav class="nav-links">' +
        '<a href="#/discover" data-go="discover">Discover creators</a>' +
        '<a href="#/briefs-public" data-go="briefs-public">Creative briefs</a>' +
        '<a href="#/how-it-works" data-anchor="how-it-works">How it works</a>' +
      '</nav>' +
      '<div class="nav-actions">' +
        (S.user ? '<a class="btn btn-soft" href="#/dashboard" data-go="dashboard">Workspace ↗</a>' : '<a class="btn btn-soft" href="#/login?next=dashboard" data-go="login?next=dashboard">Sign in</a>') +
        '<a class="btn btn-primary" href="#/login?next=dashboard" data-go="login?next=dashboard">Get started <span>↗</span></a>' +
      '</div>' +
    '</div></header>';
  }
  function appHeader(){
    const role=S.profile&&S.profile.role;
    let navLinks=[];
    if(role==='creator'){
      navLinks=[
        '<a href="#/dashboard" data-go="dashboard">Dashboard</a>',
        '<a href="#/portfolio" data-go="portfolio">My Portfolio</a>',
        '<a href="#/documents" data-go="documents">Documents</a>',
        '<a href="#/briefs" data-go="briefs">Opportunities</a>',
        '<a href="#/proposals" data-go="proposals">Proposals</a>',
        '<a href="#/engagements" data-go="engagements">Projects</a>',
        '<a href="#/hiring" data-go="hiring">Hire requests</a>'
      ];
    } else if(role==='brand'){
      navLinks=[
        '<a href="#/dashboard" data-go="dashboard">Dashboard</a>',
        '<a href="#/discover" data-go="discover">Discover Creators</a>',
        '<a href="#/briefs" data-go="briefs">My Briefs</a>',
        '<a href="#/shortlist" data-go="shortlist">Shortlist</a>',
        '<a href="#/proposals" data-go="proposals">Proposals</a>',
        '<a href="#/deliverables" data-go="deliverables">Deliverables</a>',
        '<a href="#/documents" data-go="documents">Documents</a>',
        '<a href="#/hiring" data-go="hiring">Hiring requests</a>'
      ];
    } else { // admin
      navLinks=[
        '<a href="#/dashboard" data-go="dashboard">Dashboard</a>',
        '<a href="#/verification" data-go="verification">Verification Review</a>',
        '<a href="#/activity" data-go="activity">Platform Activity</a>',
        '<a href="#/profile" data-go="profile">Settings</a>'
      ];
    }
    const roleBadge=role==='creator'?'Creator Studio':(role==='admin'?'Platform Admin':'Brand / Agency');
    const primaryAction=role==='brand'
      ?'<button class="btn btn-primary btn-small" data-action="new-brief">+ New brief</button>'
      :(role==='creator'
        ?'<button class="btn btn-primary btn-small" data-action="new-portfolio">+ New project</button>'
        :'<button class="btn btn-primary btn-small" data-go="verification">Review claims ↗</button>');
    return '<header class="header"><div class="container nav">' +
      '<a class="wordmark" href="#/dashboard" data-go="dashboard"><span class="mark">C</span> CREOVA</a>' +
      '<nav class="nav-links">' + navLinks.join('') + '</nav>' +
      '<div class="nav-actions">' +
        primaryAction +
        '<span class="pill">' + esc(roleBadge) + '</span>' +
        '<button class="btn btn-soft btn-small" data-action="logout">Sign out</button>' +
      '</div>' +
    '</div></header>';
  }
  function appNav(active){
    const role=S.profile&&S.profile.role;
    let links=[];
    if(role==='creator'){
      links=[
        ['dashboard','◫','Dashboard'],
        ['portfolio','▧','My Portfolio'],
        ['documents','▤','Documents'],
        ['briefs','✦','Opportunities'],
        ['proposals','↗','Proposals'],
        ['engagements','◇','Projects'],
        ['hiring','✉','Hire requests'],
        ['verification','✓','Verification'],
        ['profile','⚙','Settings']
      ];
    } else if(role==='brand') {
      links=[
        ['dashboard','◫','Dashboard'],
        ['discover','⌕','Discover Creators'],
        ['briefs','▤','My Briefs'],
        ['shortlist','☆','Shortlist'],
        ['proposals','↗','Proposals'],
        ['engagements','◇','Hired Creators / Projects'],
        ['hiring','✉','Hiring requests'],
        ['deliverables','◈','Deliverables'],
        ['documents','▤','Documents'],
        ['profile','⚙','Settings']
      ];
    } else { // admin
      links=[
        ['dashboard','◫','Dashboard'],
        ['verification','✓','Verification Review'],
        ['activity','◎','Platform Activity'],
        ['profile','⚙','Settings']
      ];
    }
    const groupName=role==='creator'?'Creator Studio':(role==='admin'?'Platform Admin':'Brand Workspace');
    return '<aside class="sidebar"><div class="side-group">'+groupName+'</div>'+links.map(l=>'<a href="#/'+l[0]+'" data-go="'+l[0]+'" class="side-link '+(active===l[0]?'active':'')+'"><span>'+l[1]+'</span>'+esc(l[2])+'</a>').join('')+'</aside>';
  }
  function shell(content,active){
    return appHeader()+'<main class="container app-layout">'+appNav(active)+'<section class="app-main">'+content+'</section></main>'+footer()+modalHtml()+toastHtml();
  }
  function footer(){return '<footer class="footer"><div class="container footer-inner"><span>© '+new Date().getFullYear()+' CREOVA · Discover talent. Verify creativity.</span><span><a href="/project-notes.html">Project notes & demo guide</a> · Creator rights are declared, not presumed.</span></div></footer>';}
  function modalHtml(){return S.modal?'<div class="modal-backdrop" data-action="backdrop"><section class="modal" role="dialog" aria-modal="true">'+S.modal+'</section></div>':'';}
  function toastHtml(){return S.toast?'<div id="toast" class="toast" role="status">'+esc(S.toast)+'</div>':'';}
  function cardAvatar(c){return c.avatar_url?'<div class="avatar"><img alt="" src="'+esc(c.avatar_url)+'"></div>':'<div class="avatar">'+esc(initials(c.display_name))+'</div>';}
  function creatorCard(c,compact=false){
    const bio=esc(c.bio||c.headline||'Independent AI creator');
    const rightsBadge=c.commercial_use_declared===true?'<span class="pill pill-green" style="font-size:10px">✓ Commercial rights declared</span>':(c.commercial_use_declared===false?'<span class="pill" style="font-size:10px;background:#eee8df">Commercial rights: consult</span>':'');
    return '<article class="creator-card"><div class="creator-top">'+cardAvatar(c)+'<div><h3>'+esc(c.display_name||'Creator')+'</h3><div class="sub">'+esc(c.headline||'AI creative')+'</div><div class="sub">⌁ '+esc(c.location||'Remote')+'</div></div></div><p>'+bio.slice(0,compact?110:190)+(bio.length>(compact?110:190)?'…':'')+'</p>'+(rightsBadge?'<div style="margin:4px 0">'+rightsBadge+'</div>':'')+'<div class="tags">'+chips(c.skills)+' '+chips(c.tools)+'</div><div class="card-foot"><div><span class="muted">Typical range</span><br><span class="price">'+money(c.price_min,c.currency)+' – '+(Number(c.price_max)>0?money(c.price_max,c.currency):'Flexible')+'</span></div><button class="btn btn-soft btn-small" data-action="view-portfolio" data-creator-id="'+esc(c.user_id)+'">Quick look</button> <a class="btn btn-soft btn-small" href="#/creator?id='+encodeURIComponent(c.user_id)+'" data-go="creator?id='+encodeURIComponent(c.user_id)+'">Full profile ↗</a></div>'+(S.profile&&S.profile.role==='brand'?'<div style="margin-top:12px"><button class="btn btn-soft btn-small" data-action="shortlist" data-creator-id="'+esc(c.user_id)+'">☆ Save creator</button> <button class="btn btn-primary btn-small" data-action="hire-creator" data-creator-id="'+esc(c.user_id)+'">Hire creator ↗</button></div>':'')+'</article>';
  }
  const DEMO_FIXTURES = {
    1: { media_url: '/assets/demo/saffron-afterglow.jpg', media_type: 'image', badge: 'Demonstration fixture artwork' },
    2: { media_url: '/assets/demo/objects-in-bloom.jpg', media_type: 'image', badge: 'Demonstration fixture artwork' },
    3: { media_url: '/assets/demo/little-worlds.jpg', media_type: 'image', badge: 'Demonstration fixture artwork' },
    5: { media_url: '/assets/demo/kinfield-web.jpg', media_type: 'image', badge: 'Demonstration fixture artwork' },
    6: { media_url: '/assets/demo/saffron-brand.jpg', media_type: 'image', badge: 'Demonstration fixture artwork' },
    7: { media_url: '/assets/demo/dashboard-ux.jpg', media_type: 'image', badge: 'Demonstration fixture artwork' }
  };

  function caseStudyCard(p, claims=[], options={}){
    const itemClaims = (claims||[]).filter(v => Number(v.portfolio_item_id) === Number(p.id));
    const isVerified = itemClaims.some(v => v.status === 'verified') || p.rights_status === 'verified';
    const hasPendingReview = itemClaims.some(v => v.status === 'evidence_submitted');
    const formatsArr = asArray(p.formats);
    const toolsArr = asArray(p.tools);
    const skillsArr = asArray(p.skills);
    const workflowList = asArray(p.workflow);

    const fixture = (!p.media_url && DEMO_FIXTURES[Number(p.id)]) ? DEMO_FIXTURES[Number(p.id)] : null;
    const activeMediaUrl = p.media_url || (fixture ? fixture.media_url : '');
    const activeMediaType = p.media_type || (fixture ? fixture.media_type : 'image');
    const isFixture = Boolean(fixture) || p.rights_status === 'demo-sample';

    let mediaHtml = '';
    if (activeMediaUrl) {
      const isVideo = activeMediaType === 'video' || /\.(mp4|webm|mov)(\?.*)?$/i.test(activeMediaUrl);
      const mediaTitle = esc(p.title);
      const mediaToolsStr = toolsArr.join(', ');
      const mediaRightsStr = isVerified ? 'verified' : (p.rights_status || 'self-reported');

      const fixtureOverlayBadge = isFixture
        ? '<span class="media-overlay-badge" style="background:rgba(133,84,43,0.88);color:#fff;border-color:rgba(255,255,255,0.25)" title="Sample visual representation for demonstration; not independently verified creator work">✦ Demonstration artwork</span>'
        : '';

      const overlayBar = '<div class="media-stage-overlay">' +
        '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' +
          '<span class="media-overlay-badge">' + (isVideo ? '▶ VIDEO' : '✦ IMAGE') + '</span>' +
          (formatsArr[0] ? '<span class="media-overlay-badge">' + esc(formatsArr[0]) + '</span>' : '') +
          fixtureOverlayBadge +
        '</div>' +
        '<button type="button" class="media-inspect-btn" data-action="inspect-media" data-media-url="' + esc(activeMediaUrl) + '" data-media-title="' + esc(p.title) + '" data-media-type="' + (isVideo ? 'video' : 'image') + '" data-media-tools="' + esc(mediaToolsStr) + '" data-media-rights="' + esc(mediaRightsStr) + '" data-is-fixture="' + (isFixture ? 'true' : 'false') + '" aria-label="Expand ' + mediaTitle + '"><span>⤢</span> View Full Asset</button>' +
      '</div>';

      const mediaEl = isVideo
        ? '<video src="' + esc(activeMediaUrl) + '" controls preload="metadata" playsinline class="case-study-video" onerror="this.closest(\'.case-study-stage\').classList.add(\'media-failed\')"></video>'
        : '<img src="' + esc(activeMediaUrl) + '" alt="' + mediaTitle + '" loading="lazy" class="case-study-img" onerror="this.closest(\'.case-study-stage\').classList.add(\'media-failed\')">';

      const failNotice = '<div class="media-fail-fallback">' +
        '<div style="font-size:24px;margin-bottom:6px">⚠️</div>' +
        '<strong>Media asset currently unavailable</strong>' +
        '<p>The linked file could not be loaded from its storage location. Technical specifications, production pipeline, and permissions notes remain documented below.</p>' +
      '</div>';

      mediaHtml = '<div class="case-study-media-wrap' + (isVideo ? ' is-video-wrap' : '') + '"' + (!isVideo ? ' data-action="inspect-media" data-media-url="' + esc(activeMediaUrl) + '" data-media-title="' + esc(p.title) + '" data-media-type="image" data-media-tools="' + esc(mediaToolsStr) + '" data-media-rights="' + esc(mediaRightsStr) + '" data-is-fixture="' + (isFixture ? 'true' : 'false') + '"' : '') + '>' +
        overlayBar +
        mediaEl +
      '</div>' + failNotice;
    } else {
      mediaHtml = '<div class="case-study-concept-stage">' +
        '<div class="concept-topline">' +
          '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
            '<span class="concept-kicker">✦ AI Creative Case Study</span>' +
            '<span class="pill pill-accent">' + esc(p.content_type || 'Case Study') + '</span>' +
            (p.visual_style ? '<span class="pill">' + esc(p.visual_style) + '</span>' : '') +
          '</div>' +
          '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' +
            (formatsArr[0] ? '<span class="concept-tag">Ratio: ' + esc(formatsArr[0]) + '</span>' : '') +
            '<span class="concept-tag concept-tag-pending">Pending Media Upload</span>' +
          '</div>' +
        '</div>' +
        '<div class="concept-headline">' +
          '<span class="concept-project-num">STUDIO ARCHIVE #' + String(p.id).padStart(3, '0') + '</span>' +
          '<strong>' + esc(p.title) + '</strong>' +
          '<span>' + esc(p.visual_style ? 'Art Direction: ' + p.visual_style : 'Curated generative art direction & production workflow') + '</span>' +
        '</div>' +
        '<div class="concept-foot">' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
            toolsArr.slice(0, 3).map(t => '<span class="concept-tag">🛠 ' + esc(t) + '</span>').join('') +
            skillsArr.slice(0, 2).map(s => '<span class="concept-tag">✦ ' + esc(s) + '</span>').join('') +
          '</div>' +
          '<span class="concept-fixture-notice">📁 Studio Case Study · No binary media attached in record</span>' +
        '</div>' +
      '</div>';
    }

    const rightsBadge = isVerified
      ? '<span class="pill pill-green" title="Verified by authorized platform reviewer">✓ Evidence-Reviewed</span>'
      : (hasPendingReview
        ? '<span class="pill" style="background:#f4e6d6;color:#835629" title="Evidence submitted and awaiting reviewer decision">Evidence Under Review</span>'
        : '<span class="pill" style="background:#eee9df;color:#706659" title="Self-reported claim by creator; no independent clearance">Self-Reported Declaration</span>');

    const workflowHtml = workflowList.length
      ? '<div class="workflow-box">' +
          '<div class="workflow-head">' +
            '<div style="display:flex;align-items:center;gap:8px"><span style="color:var(--accent);font-weight:700">⚙</span><strong>Documented Production Pipeline</strong></div>' +
            '<span class="muted" style="font-size:11px">' + workflowList.length + ' documented stages</span>' +
          '</div>' +
          '<ol class="workflow-steps">' +
            workflowList.map((step, idx) => '<li class="workflow-step"><span class="workflow-num">0' + (idx + 1) + '</span><span>' + esc(step) + '</span></li>' + (idx < workflowList.length - 1 ? '<span class="workflow-step-arrow" aria-hidden="true">→</span>' : '')).join('') +
          '</ol>' +
        '</div>'
      : '';

    const licenseHtml = p.license_notes
      ? '<div class="license-note">' +
          '<div style="font-weight:750;color:#3f362c;text-transform:uppercase;letter-spacing:0.08em;font-size:10px;margin-bottom:4px">Licensing & Rights Governance</div>' +
          '<div>' + esc(p.license_notes) + '</div>' +
        '</div>'
      : '';

    const verifiedClaimsHtml = itemClaims.length
      ? '<div class="verified-claims-box">' +
          '<strong style="color:#2f5934;font-size:12px;text-transform:uppercase;letter-spacing:0.06em">Evidence-Reviewed Claims for this Project:</strong>' +
          itemClaims.map(v => '<div style="margin-top:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">' + pill(v.status) + '<span style="font-weight:600;font-size:12px">' + esc(v.claim) + '</span><span class="muted" style="font-size:11px">(' + esc(v.claim_type) + ')</span>' + (v.reviewed_at ? '<span class="muted" style="font-size:11px">Reviewed ' + esc(String(v.reviewed_at).slice(0, 10)) + '</span>' : '') + '</div>').join('') +
        '</div>'
      : '';

    return '<article class="case-study-card" style="' + (options.compact ? 'margin-bottom:20px;border-radius:18px' : '') + '">' +
      '<div class="case-study-stage">' + mediaHtml + '</div>' +
      '<div class="case-study-body" style="' + (options.compact ? 'padding:20px' : '') + '">' +
        '<div class="case-study-meta-bar">' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
            '<span class="pill pill-accent">' + esc(p.content_type || 'Creative Work') + '</span>' +
            (p.visual_style ? '<span class="pill">' + esc(p.visual_style) + '</span>' : '') +
            (isFixture ? '<span class="pill" style="background:#f5ede3;color:#85542b;border:1px solid #decab4;font-size:10px" title="Demonstration artwork; sample visual fixture for portfolio showcase">✦ Demo Artwork Sample</span>' : '') +
          '</div>' +
          rightsBadge +
        '</div>' +
        '<h3 class="case-study-title">' + esc(p.title) + '</h3>' +
        (p.description ? '<p class="case-study-desc">' + esc(p.description) + '</p>' : '') +
        '<div class="case-study-specs" style="' + (options.compact ? 'grid-template-columns:repeat(2,1fr);padding:12px' : '') + '">' +
          '<div class="spec-block"><span class="spec-label">Tools & Models</span><div class="spec-tags">' + (chips(toolsArr) || '<span class="muted" style="font-size:11px">Self-directed</span>') + '</div></div>' +
          '<div class="spec-block"><span class="spec-label">Craft & Skills</span><div class="spec-tags">' + (chips(skillsArr) || '<span class="muted" style="font-size:11px">Creative Direction</span>') + '</div></div>' +
          '<div class="spec-block"><span class="spec-label">Formats & Ratios</span><div class="spec-tags">' + (chips(formatsArr) || '<span class="muted" style="font-size:11px">Flexible</span>') + '</div></div>' +
          '<div class="spec-block"><span class="spec-label">Rights Status</span><div class="spec-tags"><span class="pill ' + (isVerified ? 'pill-green' : '') + '" style="font-size:10px">' + esc(p.rights_status || 'self-reported') + '</span></div></div>' +
        '</div>' +
        workflowHtml +
        verifiedClaimsHtml +
        licenseHtml +
      '</div>' +
    '</article>';
  }
  function briefCard(b,own=false){
    const desc=esc(b.objective||b.details||'A creative opportunity for independent AI creators.');
    const tag=b.content_type||'Creative project';
    return '<article class="brief-card" style="padding:20px"><div style="display:flex;justify-content:space-between;gap:10px;align-items:start"><span class="pill">'+esc(tag)+'</span>'+(own?pill(b.status):'')+'</div><h3 style="font:500 23px Georgia,serif;letter-spacing:-.03em;margin:14px 0 7px">'+esc(b.title)+'</h3><p class="muted" style="font-size:13px;min-height:52px">'+desc.slice(0,180)+(desc.length>180?'…':'')+'</p><div class="tags">'+chips(b.required_skills)+' '+chips(b.formats)+'</div><div class="card-foot"><div><span class="muted">Budget</span><br><strong>'+money(b.budget_min,b.currency)+' – '+money(b.budget_max,b.currency)+'</strong></div><span class="muted">'+(b.deadline?'Due '+esc(String(b.deadline).slice(0,10)):'Flexible date')+'</span></div><div class="form-actions" style="justify-content:flex-start"><button class="btn btn-soft btn-small" data-action="brief-detail" data-brief-id="'+esc(b.id)+'">View brief</button>'+(own&&S.profile&&S.profile.role==='brand'?'<button class="btn btn-soft btn-small" data-action="edit-brief" data-brief-id="'+esc(b.id)+'">Edit</button><button class="btn btn-primary btn-small" data-action="match-brief" data-brief-id="'+esc(b.id)+'">Find matches</button>':(S.profile&&S.profile.role==='creator'?'<button class="btn btn-primary btn-small" data-action="apply-brief" data-brief-id="'+esc(b.id)+'">Apply</button>':'<a class="btn btn-primary btn-small" href="#/login?next=briefs" data-go="login?next=briefs">Apply ↗</a>'))+'</div></article>';
  }
  function creatorMotionStage(creators) {
    const people=(creators||[]).slice(0,3);
    const fallback=[
      {display_name:'AI Filmmaker',headline:'Motion & storytelling',skills:['AI filmmaking','Story']},
      {display_name:'Visual Artist',headline:'Art direction & imagery',skills:['Art direction','Image generation']},
      {display_name:'Digital Designer',headline:'Design systems & web',skills:['UI/UX','Web design']}
    ];
    const cards=(people.length?people:fallback).map((c,i)=>{
      const portrait=c.avatar_url?'<img src="'+esc(c.avatar_url)+'" alt="" loading="lazy">':'<span>'+esc(initials(c.display_name))+'</span>';
      const labels=asArray(c.skills).slice(0,2);
      return '<article class="creator-float-card creator-float-'+(i+1)+'" style="--card-delay:'+(i*.7)+'s"><div class="motion-person">'+portrait+'<span class="motion-online" aria-label="Creator profile"></span></div><div class="motion-person-copy"><strong>'+esc(c.display_name||'Independent creator')+'</strong><span>'+esc(c.headline||labels[0]||'AI creative')+'</span><div class="motion-tags">'+(labels.length?labels.map(t=>'<i>'+esc(t)+'</i>').join(''):'<i>Creative craft</i>')+'</div></div><span class="motion-spark" aria-hidden="true">✳</span></article>';
    }).join('');
    return '<div class="creator-stage" aria-label="Animated showcase of creators"><div class="stage-topline"><span>CREATIVE PEOPLE / 001—003</span><span class="stage-live"><i></i> OPEN TO COLLABORATE</span></div><div class="stage-halo stage-halo-one"></div><div class="stage-halo stage-halo-two"></div><div class="stage-sun"></div><div class="stage-core"><span class="stage-core-mark">C</span><span class="stage-core-kicker">CREOVA CREATOR NETWORK</span><strong>Ideas in<br><em>good hands.</em></strong><span class="stage-core-foot">Talent · Tools · Imagination</span></div>'+cards+'<div class="stage-bottomline"><span>MADE TO MOVE IDEAS FORWARD</span><span class="stage-index">↗ 2026</span></div></div>';
  }
  function setupLandingReveals() {
    const targets=document.querySelectorAll('#public-main .creator-card, #public-main .brief-card, #public-main .step, #public-main .section-head, #public-main .cta');
    if(!('IntersectionObserver' in window)){targets.forEach(el=>el.classList.add('is-visible'));return;}
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.12});
    targets.forEach((el,i)=>{el.classList.add('reveal-on-scroll');el.style.setProperty('--reveal-delay',Math.min(i%3,2)*90+'ms');observer.observe(el);});
  }
  async function renderLanding(){
    const r=S.route;
    root.innerHTML=publicHeader()+'<main id="public-main"><div class="loading">Finding your next creative collaborator…</div></main>'+footer()+modalHtml()+toastHtml();
    try{
      if(r==='home'){
        const [cr,br]=await Promise.all([api('/api/creators?limit=3'),api('/api/briefs')]);
        S.resultCreators=cr.creators||[];S.resultBriefs=br.briefs||[];
        $('#public-main').innerHTML='<section class="hero"><div class="container hero-grid"><div><div class="eyebrow">A marketplace for the new creative era</div><h1 class="serif">Human imagination.<br><em>AI-native craft.</em></h1><p class="hero-copy">Find the people shaping what creative work can become. Compare real workflows, write sharper briefs, and move from first idea to final delivery in one thoughtful space.</p><div class="hero-actions"><a class="btn btn-primary" href="#/login?next=dashboard" data-go="login?next=dashboard">Join as a creator ↗</a><a class="btn btn-soft" href="#/discover" data-go="discover">Hire creative talent</a></div><div class="hero-meta"><span>✦ AI-specific portfolios</span><span>✦ Explainable matching</span><span>✦ Rights-aware briefs</span></div><div class="stats-row"><div class="stat"><strong>One space</strong><span>From discovery to delivery</span></div><div class="stat"><strong>Clear signals</strong><span>Declared vs. reviewed claims</span></div><div class="stat"><strong>Human-led</strong><span>You approve every decision</span></div></div></div>'+creatorMotionStage(S.resultCreators)+'</div></section><section class="section section-tint"><div class="container"><div class="section-head"><div><div class="eyebrow">Meet the makers</div><h2>Talent with a point of view.</h2></div><a class="btn btn-soft" href="#/discover" data-go="discover">Explore creators ↗</a></div><div class="creator-grid">'+(S.resultCreators.length?S.resultCreators.map(c=>creatorCard(c,true)).join(''):'<div class="empty">The creator directory is ready for new portfolios. Create a profile to be discovered.</div>')+'</div></div></section><section class="section"><div class="container"><div class="section-head"><div><div class="eyebrow">Open calls</div><h2>Good work starts with a clear brief.</h2></div><a class="btn btn-soft" href="#/briefs-public" data-go="briefs-public">Browse briefs ↗</a></div><div class="grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px">'+(S.resultBriefs.length?S.resultBriefs.slice(0,4).map(b=>briefCard(b,false)).join(''):'<div class="empty">No open briefs yet. Brands can publish the first creative call from their workspace.</div>')+'</div></div></section><section class="section section-tint" id="how-it-works"><div class="container"><div class="section-head"><div><div class="eyebrow">How it works · The CREOVA Workflow</div><h2>Six stages. Total clarity.</h2></div><p>A structured, rights-aware collaboration workflow built specifically for AI-native production, verified portfolios, and accountable commercial delivery.</p></div><div class="steps"><article class="step"><span class="step-num">01</span><h3>Discover AI-native creators</h3><p>Explore specialized creative talent by generative tool, production model, visual category, technical skill, and budget range.</p></article><article class="step"><span class="step-num">02</span><h3>Compare portfolios & rights</h3><p>Inspect case studies detailing exact production pipelines, model chains, aspect ratios, and declared commercial licensing terms.</p></article><article class="step"><span class="step-num">03</span><h3>Publish a structured brief</h3><p>Set clear campaign objectives, deliverables, visual style references, timeline, licensing requirements, and budget caps.</p></article><article class="step"><span class="step-num">04</span><h3>Shortlist & receive proposals</h3><p>Save standout creators, invite applications, and review tailored proposals with milestone schedules and transparent quotes.</p></article><article class="step"><span class="step-num">05</span><h3>Hire & manage engagements</h3><p>Accept the winning proposal to establish a private, dedicated engagement workspace with defined deliverables and deadlines.</p></article><article class="step"><span class="step-num">06</span><h3>Review, revise & approve work</h3><p>Inspect versioned media deliverables, request targeted revisions with feedback, and give final approval when work meets the brief.</p></article></div></div></section><section class="section"><div class="container"><div class="cta"><div><div class="eyebrow" style="color:#e7b6a4">Your next collaboration starts here</div><h2>Bring your ambition.<br>Find your people.</h2><p>Built for creators, brands, and the work they make together.</p></div><a class="btn" href="#/login?next=dashboard" data-go="login?next=dashboard">Enter CREOVA ↗</a></div></div></section></main>';
      } else if(r==='discover') {
        const q=S.search; const params=new URLSearchParams();Object.entries(q).forEach(([k,v])=>{if(v!==''&&v!=null)params.set(k,v);});
        const data=await api('/api/creators?'+params.toString());S.resultCreators=data.creators||[];
        $('#public-main').innerHTML='<section class="section"><div class="container"><div class="eyebrow">Creator directory</div><div class="section-head"><h2>Find your creative match.</h2><p>Combine filters to narrow the field. Rankings here are search results; brief-specific compatibility lives in the workspace.</p></div><form id="discover-form" data-form="discover"><div class="filters">'+formField('Search','q',q.q||'',{placeholder:'Name, style, location'})+formField('Tool or model','tool',q.tool||'',{placeholder:'Runway, Midjourney…'})+formField('Specialization','category',q.category||'',{placeholder:'AI filmmaking…'})+formField('Skill','skill',q.skill||'',{placeholder:'Art direction…'})+formField('Format','format',q.format||'',{placeholder:'9:16, MP4…'})+formField('Availability','availability',q.availability||'',{type:'select',options:[{value:'',label:'Any availability'},{value:'open',label:'Open to work'},{value:'limited',label:'Limited availability'},{value:'unavailable',label:'Unavailable'}]})+formField('Minimum price','minPrice',q.minPrice||'',{type:'number',min:0})+formField('Maximum price','maxPrice',q.maxPrice||'',{type:'number',min:0})+formField('Sort by','sort',q.sort||'relevance',{type:'select',options:[{value:'relevance',label:'Recently active'},{value:'price_low',label:'Price: low to high'},{value:'price_high',label:'Price: high to low'},{value:'name',label:'Name'}]})+'</div><div class="form-actions" style="justify-content:flex-start"><button class="btn btn-primary" type="submit">Apply filters</button><button class="btn btn-soft" type="button" data-action="clear-discover">Reset</button></div></form><p class="muted" style="font-size:12px">'+esc(data.total)+' creators matched your filters.</p><div class="creator-grid">'+(S.resultCreators.length?S.resultCreators.map(c=>creatorCard(c)).join(''):'<div class="empty">No creators match all of those filters. Try removing one or two filters.</div>')+'</div><div class="form-actions"><button class="btn btn-soft" data-action="discover-page" data-page="'+Math.max(1,(Number(q.page)||1)-1)+'" '+((Number(q.page)||1)<=1?'disabled':'')+'>← Previous</button><span class="muted">Page '+esc(data.page||1)+' of '+esc(data.pages||1)+'</span><button class="btn btn-soft" data-action="discover-page" data-page="'+((Number(q.page)||1)+1)+'" '+((Number(q.page)||1)>=(data.pages||1)?'disabled':'')+'>Next →</button></div></div></section>';
      } else {
        const br=await api('/api/briefs');S.resultBriefs=br.briefs||[];
        $('#public-main').innerHTML='<section class="section"><div class="container"><div class="eyebrow">Opportunities</div><div class="section-head"><h2>Creative briefs, ready to meet the right minds.</h2><p>Review scope, expected outputs, timing, budget, usage, and licensing questions before you propose.</p></div><div class="toolbar"><input class="search-input" id="brief-search" placeholder="Search briefs by title, objective, or content type" value="'+esc(S.search.briefQ||'')+'"><button class="btn btn-primary" data-action="search-briefs">Search briefs</button></div><div class="grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px">'+(S.resultBriefs.length?S.resultBriefs.map(b=>briefCard(b,false)).join(''):'<div class="empty">There are no published briefs yet.</div>')+'</div></div></section>';
      }
      setupLandingReveals();
      if(S.anchor==='how-it-works'){
        setTimeout(()=>{
          const el=document.getElementById('how-it-works');
          if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
        },80);
      }
    }catch(e){$('#public-main').innerHTML='<section class="section"><div class="container"><div class="empty">We could not load this section. '+esc(e.message)+' <button class="btn btn-soft" data-action="retry">Try again</button></div></div></section>';}
    root.insertAdjacentHTML('beforeend',modalHtml()+toastHtml());
  }
  function onboarding(){
    return publicHeader()+'<main class="container section"><div style="max-width:820px;margin:auto"><div class="eyebrow">One small setup</div><h1 class="serif" style="font-size:48px;margin:12px 0">Welcome to CREOVA.</h1><p class="muted">Choose how you’ll use the marketplace. You can edit your details later; verification is always a separate evidence-review process.</p><form data-form="onboarding" class="form-card" style="padding:26px;margin-top:24px"><div class="form-grid">'+formField('I am joining as','role','creator',{type:'select',options:[{value:'creator',label:'Creator'},{value:'brand',label:'Brand / Agency'}],required:true})+formField('Your name','display_name',S.user&&S.user.name||'',{required:true})+formField('Location','location','',{placeholder:'City, country'})+'<div id="onboarding-extra">'+formField('Headline','headline','',{placeholder:'AI filmmaker · art direction'})+'</div>'+formField('A little about you','bio','',{type:'textarea',full:true,placeholder:'What do you make, or what kind of work are you looking for?'})+formField('Skills (comma separated)','skills','',{placeholder:'AI filmmaking, animation, art direction'})+formField('Tools and models','tools','',{placeholder:'Runway, Midjourney, Blender'})+'</div><div class="form-actions"><button class="btn btn-primary" type="submit">Create my workspace ↗</button></div></form></div></main>'+footer()+toastHtml();
  }
  function calculateProfileCompleteness(profile, portfolioItems){
    let score = 0;
    const items = [];
    if(profile.display_name && profile.display_name.trim()) score += 10;
    else items.push('Add your full display name');

    if(profile.headline && profile.headline.trim()) score += 10;
    else items.push('Add a professional headline');

    if(profile.bio && profile.bio.trim()) score += 10;
    else items.push('Write a short bio');

    if(profile.location && profile.location.trim()) score += 10;
    else items.push('Specify your location');

    if(asArray(profile.skills).length > 0) score += 10;
    else items.push('List your core creative skills');

    if(asArray(profile.tools).length > 0) score += 10;
    else items.push('Specify your AI tools and models');

    if(asArray(profile.categories).length > 0) score += 10;
    else items.push('Add content specialties');

    if(asArray(profile.formats).length > 0) score += 10;
    else items.push('Add output formats & aspect ratios');

    if(profile.commercial_use_declared === true) score += 10;
    else items.push('Declare your commercial licensing availability');

    if(portfolioItems && portfolioItems.length > 0) score += 10;
    else items.push('Add at least one portfolio project');

    return { score, missing: items };
  }

  async function renderAdminDashboard(){
    if(!S.profile || S.profile.role !== 'admin'){
      return '<div class="panel"><div class="eyebrow" style="color:#9c3826">Access Denied</div><h1 class="serif" style="font-size:32px">Administrative Workspace Restricted</h1><p class="muted">This workspace is restricted to authorized platform administrators with verified database roles. Access is strictly enforced by the backend.</p><button class="btn btn-primary" data-go="dashboard">Return to workspace</button></div>';
    }
    const [reviewRes, allRes] = await Promise.all([
      api('/api/verification?review=true').catch(()=>({records:[]})),
      api('/api/verification').catch(()=>({records:[]}))
    ]);
    const pending = reviewRes.records || [];
    const all = allRes.records || [];
    const verified = all.filter(r => r.status === 'verified');

    return '<div class="dash-title">' +
      '<div>' +
        '<div class="eyebrow">Platform Administration</div>' +
        '<h1>Admin Workspace · Verification Review</h1>' +
        '<p>Inspect submitted creator verification evidence, record decisions, and monitor trust signals.</p>' +
      '</div>' +
      '<div class="nav-actions">' +
        '<button class="btn btn-primary" data-go="verification">Open review queue ↗</button>' +
        '<button class="btn btn-soft" data-go="activity">Platform activity</button>' +
      '</div>' +
    '</div>' +
    '<div class="dashboard-stats">' +
      '<div class="metric"><span>Pending evidence</span><strong>' + pending.length + '</strong><small>Awaiting review</small></div>' +
      '<div class="metric"><span>Verified claims</span><strong>' + verified.length + '</strong><small>Approved by admin</small></div>' +
      '<div class="metric"><span>Total on platform</span><strong>' + all.length + '</strong><small>All claims recorded</small></div>' +
      '<div class="metric"><span>Authorization</span><strong>Role-verified</strong><small>Backend session check</small></div>' +
    '</div>' +
    '<div class="panel">' +
      '<div class="panel-head">' +
        '<div>' +
          '<h2>Pending Verification Evidence Queue</h2>' +
          '<p>Creators who have submitted external evidence for tools, workflows, or past work.</p>' +
        '</div>' +
        '<button class="btn btn-soft btn-small" data-go="verification">Full queue</button>' +
      '</div>' +
      (pending.length ? pending.slice(0, 6).map(v =>
        '<div class="row-card" style="align-items:start">' +
          '<div style="flex:1">' +
            '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
              '<h3>' + esc(v.claim) + '</h3>' +
              pill(v.status) +
              '<span class="pill">' + esc(v.claim_type) + '</span>' +
            '</div>' +
            '<p style="margin:4px 0">Creator: <strong>' + esc(v.creator_name || 'Creator') + '</strong>' + (v.portfolio_title ? ' · Project: <em>' + esc(v.portfolio_title) + '</em>' : '') + ' · Submitted ' + esc(String(v.created_at||'').slice(0,10)) + '</p>' +
            (v.evidence_url ? '<p style="margin:4px 0"><a href="' + esc(v.evidence_url) + '" target="_blank" rel="noopener" style="color:var(--accent);font-weight:700">View submitted evidence ↗</a></p>' : '<p class="muted" style="margin:4px 0">No external link attached.</p>') +
            (v.evidence_notes ? '<p class="muted" style="font-size:12px;margin:4px 0">' + esc(v.evidence_notes) + '</p>' : '') +
          '</div>' +
          '<div style="display:flex;gap:6px">' +
            '<button class="btn btn-primary btn-small" data-action="verification-decision" data-id="' + esc(v.id) + '" data-decision="verify">Verify</button>' +
            '<button class="btn btn-soft btn-small" data-action="verification-decision" data-id="' + esc(v.id) + '" data-decision="reject">Reject</button>' +
          '</div>' +
        '</div>'
      ).join('') : '<div class="empty">✓ All submitted verification claims have been reviewed. No pending claims in queue.</div>') +
    '</div>' +
    '<div class="panel">' +
      '<div class="panel-head">' +
        '<div>' +
          '<h2>Platform Security & Administrative Scope</h2>' +
          '<p>Server-enforced session controls</p>' +
        '</div>' +
      '</div>' +
      '<div class="notice success" style="margin-bottom:12px">' +
        '<strong>Security Guardrail Active:</strong> Admin privileges are strictly authorized by the backend using your verified session and database role (<code>app_profiles.role = \'admin\'</code>). Client flags, URL parameters, and local-storage values cannot elevate access.' +
      '</div>' +
      '<p style="font-size:13px;color:#5a544c">Backend administrative operations supported: verification evidence queue review (<code>GET /api/verification?review=true</code>) and explicit approval/rejection recording (<code>PUT /api/verification</code>). In accordance with strict change control, no arbitrary database mutation or bypass tools exist.</p>' +
    '</div>';
  }

  async function renderDashboard(){
    const role=S.profile&&S.profile.role;
    if(role==='admin'){
      return renderAdminDashboard();
    }
    if(role==='creator'){
      const [proposalsRes,engagementsRes,portfolioRes,claimsRes]=await Promise.all([
        api('/api/proposals').catch(()=>({proposals:[]})),
        api('/api/engagements').catch(()=>({engagements:[]})),
        api('/api/portfolio').catch(()=>({items:[]})),
        api('/api/verification').catch(()=>({records:[]}))
      ]);
      const proposals=proposalsRes.proposals||[];
      const engagements=engagementsRes.engagements||[];
      const portfolio=portfolioRes.items||[];
      const claims=claimsRes.records||[];
      const activeEngagements=engagements.filter(e=>['active','in_review','revision_requested'].includes(e.status));
      const activeProposals=proposals.filter(p=>['submitted','accepted'].includes(p.status));
      const verifiedClaims=claims.filter(c=>c.status==='verified');
      const completeness=calculateProfileCompleteness(S.profile, portfolio);

      // Pending action alerts
      const pendingActions=[];
      const revisionEngagements=engagements.filter(e=>e.status==='revision_requested');
      const inReviewEngagements=engagements.filter(e=>e.status==='in_review');
      const submittedProposals=proposals.filter(p=>p.status==='submitted');

      if(revisionEngagements.length>0){
        pendingActions.push({
          badge:'Action Required',
          bg:'#fbf0ee',
          color:'#95452f',
          text:'Revision requested on '+revisionEngagements.length+' project(s) — please review client feedback and submit updated work.',
          go:'engagements'
        });
      }
      if(inReviewEngagements.length>0){
        pendingActions.push({
          badge:'Under Review',
          bg:'#f7f4ee',
          color:'#7a6438',
          text:'Deliverable submitted on '+inReviewEngagements.length+' project(s) — currently awaiting client review.',
          go:'engagements'
        });
      }
      if(submittedProposals.length>0){
        pendingActions.push({
          badge:'Applications Active',
          bg:'#f2f7ef',
          color:'#3d6245',
          text:submittedProposals.length+' proposal(s) currently awaiting brand hiring decisions.',
          go:'proposals'
        });
      }
      if(portfolio.length===0){
        pendingActions.push({
          badge:'Showcase Empty',
          bg:'#f8f4ee',
          color:'#8a5f36',
          text:'You have not added any projects yet. Create your first case study in Portfolio Studio to get discovered by brands.',
          go:'portfolio'
        });
      }

      const stats=[
        ['Portfolio items', portfolio.length, 'Documented case studies'],
        ['Active proposals', activeProposals.length, 'Applications in review'],
        ['Current projects', activeEngagements.length, 'Engagements in progress'],
        ['Verified claims', verifiedClaims.length, 'Evidence-reviewed badges']
      ];

      return '<div class="dash-title">' +
        '<div>' +
          '<div class="eyebrow">Creator Studio</div>' +
          '<h1>Good to see you, ' + esc(S.profile.display_name||S.user.name||'there') + '.</h1>' +
          '<p>Manage your AI portfolio showcases, brief applications, authorized documents, and active deliverables.</p>' +
        '</div>' +
        '<div class="nav-actions">' +
          '<button class="btn btn-primary" data-action="new-portfolio">+ Add portfolio project</button>' +
          '<button class="btn btn-soft" data-go="briefs">Browse open briefs ↗</button>' +
        '</div>' +
      '</div>' +
      '<div class="panel" style="background:#fffcf7;border:1px solid #ebd9c8;padding:20px 24px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">' +
          '<div>' +
            '<div class="eyebrow" style="color:var(--accent)">Profile Completeness</div>' +
            '<h3 style="font:500 21px Georgia,serif;margin:2px 0">Your Creator Showcase is ' + completeness.score + '% Complete</h3>' +
          '</div>' +
          '<button class="btn btn-soft btn-small" data-go="profile">Edit Profile & Settings ↗</button>' +
        '</div>' +
        '<div style="width:100%;height:10px;background:#eee6db;border-radius:99px;overflow:hidden;margin-bottom:10px">' +
          '<div style="width:' + completeness.score + '%;height:100%;background:linear-gradient(90deg,var(--accent),#e28a68);border-radius:99px;transition:width .4s ease"></div>' +
        '</div>' +
        (completeness.missing.length ? (
          '<div style="font-size:12px;color:var(--muted)">' +
            '<strong>Recommended next step:</strong> ' + esc(completeness.missing[0]) +
            (completeness.missing.length > 1 ? ' · <span class="muted">Also needed: ' + esc(completeness.missing.slice(1,3).join(', ')) + '</span>' : '') +
          '</div>'
        ) : '<div style="font-size:12px;color:#3d6245;font-weight:600">✓ Your creator profile is 100% complete and fully optimized for discovery!</div>') +
      '</div>' +
      (pendingActions.length ? (
        '<div class="panel" style="padding:16px 20px;border-color:#e4dcd0">' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">' +
            '<span class="eyebrow" style="color:var(--accent)">Pending Actions & Activity</span>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;gap:8px">' +
            pendingActions.map(a =>
              '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:'+a.bg+';border-radius:12px;gap:12px;flex-wrap:wrap">' +
                '<div style="display:flex;align-items:center;gap:10px">' +
                  '<span class="pill" style="font-size:10px;font-weight:700;color:'+a.color+'">'+a.badge+'</span>' +
                  '<span style="font-size:13px;color:#332e29">'+esc(a.text)+'</span>' +
                '</div>' +
                '<button class="btn btn-soft btn-small" data-go="'+a.go+'" style="background:#fff">Open ↗</button>' +
              '</div>'
            ).join('') +
          '</div>' +
        '</div>'
      ) : '') +
      '<div class="dashboard-stats">' + stats.map(s=>'<div class="metric"><span>'+esc(s[0])+'</span><strong>'+esc(s[1])+'</strong><small>'+esc(s[2])+'</small></div>').join('') + '</div>' +
      '<div class="panel">' +
        '<div class="panel-head">' +
          '<div>' +
            '<h2>Active engagements & deliverables</h2>' +
            '<p>Submit versioned work, review brand feedback, and track milestones to completion.</p>' +
          '</div>' +
          '<div style="display:flex;gap:8px">' +
            '<button class="btn btn-soft btn-small" data-go="documents">My Documents</button>' +
            '<button class="btn btn-soft btn-small" data-go="engagements">All engagements</button>' +
          '</div>' +
        '</div>' +
        (engagements.length ? engagements.slice(0, 5).map(e =>
          '<div class="row-card"><div>' +
            '<h3>' + esc(e.title || e.brief_title) + '</h3>' +
            '<p>Brand: <strong>' + esc(e.brand_name || 'Partner') + '</strong> · ' + pill(e.status) + ' · Due: ' + esc(e.due_date ? String(e.due_date).slice(0,10) : 'Flexible') + '</p>' +
          '</div>' +
          '<button class="btn btn-primary btn-small" data-action="open-engagement" data-id="' + esc(e.id) + '">Open project ↗</button>' +
          '</div>'
        ).join('') : '<div class="empty">No active engagements yet. Once a brand accepts one of your proposals, the private collaboration workspace and deliverable review pipeline will open here.</div>') +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-head">' +
          '<div>' +
            '<h2>Submitted proposals</h2>' +
            '<p>Track your applications, proposed milestones, and hiring status.</p>' +
          '</div>' +
          '<button class="btn btn-soft btn-small" data-go="proposals">All proposals</button>' +
        '</div>' +
        (proposals.length ? proposals.slice(0, 4).map(p =>
          '<div class="row-card" style="align-items:start">' +
            '<div style="flex:1">' +
              '<h3>' + esc(p.brief_title || 'Creative Brief') + '</h3>' +
              '<p>Brand: ' + esc(p.brand_name || 'Brand') + ' · <strong>' + money(p.proposed_price, p.currency) + '</strong> (' + esc(p.delivery_days) + ' days) · ' + pill(p.status) + '</p>' +
              '<p class="muted" style="font-size:12px;margin:4px 0">' + esc(p.cover_letter ? p.cover_letter.slice(0, 140) + (p.cover_letter.length > 140 ? '…' : '') : '') + '</p>' +
            '</div>' +
            (p.status === 'submitted' ? '<button class="btn btn-soft btn-small" data-action="proposal-decision" data-id="' + esc(p.id) + '" data-decision="withdraw">Withdraw</button>' : '') +
          '</div>'
        ).join('') : '<div class="empty">You have not submitted proposals yet. Find exciting client calls in <a href="#/briefs" data-go="briefs" style="color:var(--accent);font-weight:600">Open opportunities</a>.</div>') +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-head">' +
          '<div>' +
            '<h2>Creator profile snapshot</h2>' +
            '<p>Keep your skills, tools, availability, and rights declarations current to attract matching briefs.</p>' +
          '</div>' +
          '<div style="display:flex;gap:8px">' +
            '<button class="btn btn-soft btn-small" data-go="profile">Edit profile</button>' +
            '<button class="btn btn-soft btn-small" data-go="verification">Verification</button>' +
          '</div>' +
        '</div>' +
        '<div class="profile-hero">' +
          cardAvatar(S.profile) +
          '<div>' +
            '<h2>' + esc(S.profile.display_name || 'Your profile') + '</h2>' +
            '<p>' + esc(S.profile.headline || 'Add a headline to tell people what you do.') + ' · ⌁ ' + esc(S.profile.location || 'Remote') + '</p>' +
            '<div class="tags">' + chips(S.profile.skills) + ' ' + chips(S.profile.tools) + '</div>' +
            '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">' +
              (S.profile.commercial_use_declared ? '<span class="pill pill-green">✓ Commercial-use declared</span>' : '<span class="pill pill-terracotta">Commercial rights: consult</span>') +
              '<span class="pill ' + (S.profile.availability === 'open' ? 'pill-green' : '') + '">' + esc(S.profile.availability || 'open to work') + '</span>' +
              (S.profile.public_profile !== false ? '<span class="pill">Public directory visible</span>' : '<span class="pill">Profile hidden</span>') +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="notice">Verification is evidence-based. Portfolio and tool claims begin as self-reported until an authorized platform reviewer records an explicit approval decision.</div>' +
      '</div>';
    } else {
      // Brand / Agency role
      const [proposalsRes,engagementsRes,briefsRes,shortlistRes]=await Promise.all([
        api('/api/proposals').catch(()=>({proposals:[]})),
        api('/api/engagements').catch(()=>({engagements:[]})),
        api('/api/briefs?mine=true').catch(()=>({briefs:[]})),
        api('/api/shortlist').catch(()=>({creators:[]}))
      ]);
      const proposals=proposalsRes.proposals||[];
      const engagements=engagementsRes.engagements||[];
      const briefs=briefsRes.briefs||[];
      const shortlist=shortlistRes.creators||[];
      const pendingProposals=proposals.filter(p=>p.status==='submitted');
      const activeEngagements=engagements.filter(e=>['active','in_review','revision_requested'].includes(e.status));
      const inReviewDeliverables=engagements.filter(e=>e.status==='in_review');
      const publishedBriefs=briefs.filter(b=>b.status==='published');
      const draftBriefs=briefs.filter(b=>b.status==='draft');

      const brandActions=[];
      if(pendingProposals.length>0){
        brandActions.push({
          badge:'Review Needed',
          bg:'#fbf0ee',
          color:'#95452f',
          text:pendingProposals.length+' creator proposal(s) awaiting your hiring decision.',
          go:'proposals'
        });
      }
      if(inReviewDeliverables.length>0){
        brandActions.push({
          badge:'Deliverable Submitted',
          bg:'#f7f4ee',
          color:'#7a6438',
          text:inReviewDeliverables.length+' project deliverable(s) submitted for your review & approval.',
          go:'deliverables'
        });
      }
      if(draftBriefs.length>0){
        brandActions.push({
          badge:'Draft Briefs',
          bg:'#f2f7ef',
          color:'#3d6245',
          text:'You have '+draftBriefs.length+' draft brief(s) ready to be published.',
          go:'briefs'
        });
      }

      const stats=[
        ['Campaign briefs', publishedBriefs.length, 'Published and active calls'],
        ['Pending proposals', pendingProposals.length, 'Awaiting hiring decisions'],
        ['Active projects', activeEngagements.length, 'Projects in production'],
        ['Saved creators', shortlist.length, 'Shortlisted talent']
      ];

      return '<div class="dash-title">' +
        '<div>' +
          '<div class="eyebrow">Brand / Agency Workspace</div>' +
          '<h1>Good to see you, ' + esc(S.profile.display_name||S.user.name||'there') + '.</h1>' +
          '<p>Publish structured briefs, review incoming proposals, hire talent, and review deliverables.</p>' +
        '</div>' +
        '<div class="nav-actions">' +
          '<button class="btn btn-primary" data-action="new-brief">+ Create a brief ↗</button>' +
          '<button class="btn btn-soft" data-go="discover">Discover creators</button>' +
        '</div>' +
      '</div>' +
      '<div class="panel" style="background:#fffcf7;border:1px solid #ebd9c8;padding:16px 20px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">' +
          '<div>' +
            '<div class="eyebrow" style="color:var(--accent)">Campaign Quick Actions</div>' +
            '<div style="font-size:14px;color:var(--ink);font-weight:600;margin-top:2px">Manage your creative production pipeline</div>' +
          '</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            '<button class="btn btn-primary btn-small" data-action="new-brief">+ New brief</button>' +
            '<button class="btn btn-soft btn-small" data-go="discover">Discover talent</button>' +
            '<button class="btn btn-soft btn-small" data-go="deliverables">Review deliverables</button>' +
            '<button class="btn btn-soft btn-small" data-go="documents">Documents</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      (brandActions.length ? (
        '<div class="panel" style="padding:16px 20px;border-color:#e4dcd0">' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">' +
            '<span class="eyebrow" style="color:var(--accent)">Attention Queue</span>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;gap:8px">' +
            brandActions.map(a =>
              '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:'+a.bg+';border-radius:12px;gap:12px;flex-wrap:wrap">' +
                '<div style="display:flex;align-items:center;gap:10px">' +
                  '<span class="pill" style="font-size:10px;font-weight:700;color:'+a.color+'">'+a.badge+'</span>' +
                  '<span style="font-size:13px;color:#332e29">'+esc(a.text)+'</span>' +
                '</div>' +
                '<button class="btn btn-soft btn-small" data-go="'+a.go+'" style="background:#fff">Open ↗</button>' +
              '</div>'
            ).join('') +
          '</div>' +
        '</div>'
      ) : '') +
      '<div class="dashboard-stats">' + stats.map(s=>'<div class="metric"><span>'+esc(s[0])+'</span><strong>'+esc(s[1])+'</strong><small>'+esc(s[2])+'</small></div>').join('') + '</div>' +
      '<div class="panel">' +
        '<div class="panel-head">' +
          '<div>' +
            '<h2>Active projects & deliverables</h2>' +
            '<p>Review submitted files, request targeted revisions with feedback, and give final approval.</p>' +
          '</div>' +
          '<div style="display:flex;gap:8px">' +
            '<button class="btn btn-soft btn-small" data-go="deliverables">Deliverables review</button>' +
            '<button class="btn btn-soft btn-small" data-go="engagements">All projects</button>' +
          '</div>' +
        '</div>' +
        (engagements.length ? engagements.slice(0, 5).map(e =>
          '<div class="row-card"><div>' +
            '<h3>' + esc(e.title || e.brief_title) + '</h3>' +
            '<p>Creator: <strong>' + esc(e.creator_name || 'Partner') + '</strong> · ' + pill(e.status) + ' · Due: ' + esc(e.due_date ? String(e.due_date).slice(0,10) : 'Flexible') + '</p>' +
          '</div>' +
          '<button class="btn btn-primary btn-small" data-action="open-engagement" data-id="' + esc(e.id) + '">Open project ↗</button>' +
          '</div>'
        ).join('') : '<div class="empty">No active projects yet. When you accept a creator proposal, the engagement workspace opens automatically.</div>') +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-head">' +
          '<div>' +
            '<h2>Incoming proposals awaiting decision</h2>' +
            '<p>Review cover letters, milestone schedules, and quotes. Accept to start an engagement.</p>' +
          '</div>' +
          '<button class="btn btn-soft btn-small" data-go="proposals">All proposals</button>' +
        '</div>' +
        (pendingProposals.length ? pendingProposals.slice(0, 4).map(p =>
          '<div class="row-card" style="align-items:start">' +
            '<div style="flex:1">' +
              '<h3>' + esc(p.brief_title || 'Creative Brief') + '</h3>' +
              '<p>From: <strong>' + esc(p.creator_name || 'Creator') + '</strong> (' + esc(p.creator_headline || 'AI Creative') + ') · <strong>' + money(p.proposed_price, p.currency) + '</strong> (' + esc(p.delivery_days) + ' days)</p>' +
              '<p style="font-size:13px;color:#443f38;white-space:pre-wrap;margin:6px 0">' + esc(p.cover_letter) + '</p>' +
              (asArray(p.milestones).length ? '<div class="tags">' + asArray(p.milestones).map(m=>'<span class="tag">'+esc(typeof m==='string'?m:m.title)+'</span>').join('') + '</div>' : '') +
            '</div>' +
            '<div style="display:flex;gap:6px">' +
              '<button class="btn btn-primary btn-small" data-action="proposal-decision" data-id="' + esc(p.id) + '" data-decision="accept">Accept</button>' +
              '<button class="btn btn-soft btn-small" data-action="proposal-decision" data-id="' + esc(p.id) + '" data-decision="decline">Decline</button>' +
            '</div>' +
          '</div>'
        ).join('') : '<div class="empty">No proposals awaiting decision. Published briefs will receive applications from creators here.</div>') +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-head">' +
          '<div>' +
            '<h2>Your creative briefs</h2>' +
            '<p>Track draft and published briefs, or find matching creator recommendations.</p>' +
          '</div>' +
          '<button class="btn btn-soft btn-small" data-go="briefs">All briefs</button>' +
        '</div>' +
        (briefs.length ? briefs.slice(0, 4).map(b =>
          '<div class="row-card"><div>' +
            '<h3>' + esc(b.title) + '</h3>' +
            '<p>' + esc(b.content_type || 'Campaign') + ' · ' + pill(b.status) + ' · Budget: ' + money(b.budget_min, b.currency) + ' – ' + money(b.budget_max, b.currency) + '</p>' +
          '</div>' +
          '<div style="display:flex;gap:6px">' +
            '<button class="btn btn-soft btn-small" data-action="match-brief" data-brief-id="' + esc(b.id) + '">Find matches</button>' +
            '<button class="btn btn-soft btn-small" data-action="edit-brief" data-brief-id="' + esc(b.id) + '">Edit</button>' +
          '</div></div>'
        ).join('') : '<div class="empty">You have not published any briefs yet. <button class="btn btn-primary btn-small" data-action="new-brief" style="margin-left:8px">Create your first brief ↗</button></div>') +
      '</div>';
    }
  }

  async function renderDocuments(){
    const role=S.profile&&S.profile.role;
    const isBrand=role==='brand';
    const engagementsRes=await api('/api/engagements').catch(()=>({engagements:[]}));
    const engagements=engagementsRes.engagements||[];
    const docs=[];

    await Promise.all(engagements.map(async e => {
      try {
        const dRes=await api('/api/engagements?id='+e.id);
        const list=dRes.deliverables||[];
        list.forEach(d => {
          docs.push({
            ...d,
            engagement_id:e.id,
            engagement_title:e.title||e.brief_title,
            brand_name:e.brand_name||'Brand',
            creator_name:e.creator_name||'Creator',
            engagement_status:e.status
          });
        });
      } catch(err){}
    }));

    docs.sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
    const activeEngagements=engagements.filter(e=>['active','in_review','revision_requested'].includes(e.status));

    return '<div class="dash-title">' +
      '<div>' +
        '<div class="eyebrow">' + (isBrand ? 'Campaign assets & deliverables' : 'Authorized project files') + '</div>' +
        '<h1>' + (isBrand ? 'Campaign Documents' : 'My Documents') + '</h1>' +
        '<p>' + (isBrand
          ? 'Access verified creative deliverable files, media assets, and version histories submitted by creators for your campaigns.'
          : 'Access authorized deliverable documents and files across your active and completed client engagements.') +
        '</p>' +
      '</div>' +
      '<div class="nav-actions">' +
        '<button class="btn btn-soft" data-go="engagements">View all projects ↗</button>' +
      '</div>' +
    '</div>' +
    (!isBrand && activeEngagements.length ? (
      '<div class="panel">' +
        '<div class="panel-head">' +
          '<div>' +
            '<h2>Submit Deliverable Document</h2>' +
            '<p>Upload a new file or version to an active project. Maximum file size: 10 MB.</p>' +
          '</div>' +
        '</div>' +
        '<form class="form-grid" data-form="deliverable">' +
          '<div class="field full">' +
            '<label for="doc_engagement_id">Select active engagement *</label>' +
            '<select id="doc_engagement_id" name="engagement_id" required>' +
              activeEngagements.map(e => '<option value="'+esc(e.id)+'">'+esc(e.title||e.brief_title)+' ('+esc(e.brand_name||'Brand')+')</option>').join('') +
            '</select>' +
          '</div>' +
          formField('Document / Deliverable title','title','',{required:true,placeholder:'e.g. Hero Cut v2 — Final Color Grade'}) +
          formField('Version summary / Notes','notes','',{type:'textarea',placeholder:'Describe what was updated or added in this file…'}) +
          '<div class="field full">' +
            '<label>Upload file (MP4, WebM, PNG, JPG, WebP max 10 MB)</label>' +
            '<input type="file" name="media_file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" required>' +
          '</div>' +
          '<div class="field full">' +
            '<label>Or external deliverable URL</label>' +
            '<input type="url" name="file_url" placeholder="https://…">' +
          '</div>' +
          '<div class="form-actions field full">' +
            '<button class="btn btn-primary" type="submit">Upload and submit document ↗</button>' +
          '</div>' +
        '</form>' +
      '</div>'
    ) : '') +
    '<div class="panel">' +
      '<div class="panel-head">' +
        '<div>' +
          '<h2>' + (isBrand ? 'Campaign Deliverables & Assets' : 'Authorized Engagement Documents') + '</h2>' +
          '<p>' + docs.length + ' file(s) on record</p>' +
        '</div>' +
      '</div>' +
      (docs.length ? docs.map(d => {
        const isVid=/\.(mp4|webm|mov)(\?.*)?$/i.test(d.file_url||'');
        const formatBadge=isVid?'▶ Video File':(d.file_url?'✦ Image / Asset':'🔗 External Link');
        return '<article class="row-card" style="align-items:start">' +
          '<div style="flex:1">' +
            '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
              '<h3>v' + esc(d.version) + ' · ' + esc(d.title) + '</h3>' +
              pill(d.status) +
              '<span class="pill" style="font-size:10px">' + formatBadge + '</span>' +
            '</div>' +
            '<p style="margin:4px 0">' +
              'Project: <strong>' + esc(d.engagement_title) + '</strong> · ' +
              (isBrand ? 'Creator: <strong>' + esc(d.creator_name) + '</strong>' : 'Brand: <strong>' + esc(d.brand_name) + '</strong>') +
              ' · Submitted: ' + esc(String(d.created_at||'').slice(0,10)) +
            '</p>' +
            (d.notes ? '<p class="muted" style="font-size:12px;margin:4px 0">' + esc(d.notes) + '</p>' : '') +
            (d.brand_feedback ? '<div class="notice" style="margin-top:6px"><strong>Brand feedback:</strong> ' + esc(d.brand_feedback) + '</div>' : '') +
          '</div>' +
          '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
            (d.file_url ? '<a href="' + esc(d.file_url) + '" target="_blank" rel="noopener" class="btn btn-primary btn-small">Download / View ↗</a>' : '<span class="muted" style="font-size:12px">No file URL</span>') +
            '<button class="btn btn-soft btn-small" data-action="open-engagement" data-id="' + esc(d.engagement_id) + '">Open project</button>' +
          '</div>' +
        '</article>';
      }).join('') : (
        '<div class="empty">' +
          (isBrand
            ? 'No campaign documents received yet. When hired creators submit versioned deliverables for your active projects, authorized download files will appear here.'
            : 'No project documents on record yet. When a brand accepts your proposal and you submit files for the engagement, all versions and signed download links will be accessible here.') +
        '</div>'
      )) +
    '</div>';
  }

  async function renderDeliverables(){
    const engagementsRes=await api('/api/engagements').catch(()=>({engagements:[]}));
    const engagements=engagementsRes.engagements||[];
    const allDeliverables=[];

    await Promise.all(engagements.map(async e => {
      try {
        const dRes=await api('/api/engagements?id='+e.id);
        const list=dRes.deliverables||[];
        list.forEach(d => {
          allDeliverables.push({
            ...d,
            engagement_id:e.id,
            engagement_title:e.title||e.brief_title,
            creator_name:e.creator_name||'Creator'
          });
        });
      } catch(err){}
    }));

    allDeliverables.sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
    const pending=allDeliverables.filter(d=>['submitted','in_review','revision_requested'].includes(d.status));
    const approved=allDeliverables.filter(d=>d.status==='approved');

    return '<div class="dash-title">' +
      '<div>' +
        '<div class="eyebrow">Production & Quality Control</div>' +
        '<h1>Deliverables Review Pipeline</h1>' +
        '<p>Inspect submitted files, request targeted revisions with feedback, and record approvals.</p>' +
      '</div>' +
      '<button class="btn btn-soft" data-go="engagements">All projects ↗</button>' +
    '</div>' +
    '<div class="dashboard-stats">' +
      '<div class="metric"><span>In review / submitted</span><strong>' + pending.length + '</strong><small>Require review or revision</small></div>' +
      '<div class="metric"><span>Approved</span><strong>' + approved.length + '</strong><small>Successfully approved</small></div>' +
      '<div class="metric"><span>Total submissions</span><strong>' + allDeliverables.length + '</strong><small>Across all campaigns</small></div>' +
    '</div>' +
    '<div class="panel">' +
      '<div class="panel-head">' +
        '<div>' +
          '<h2>Deliverable Submissions</h2>' +
          '<p>Review creative work against campaign requirements.</p>' +
        '</div>' +
      '</div>' +
      (allDeliverables.length ? allDeliverables.map(d =>
        '<article class="row-card" style="align-items:start">' +
          '<div style="flex:1">' +
            '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
              '<h3>v' + esc(d.version) + ' · ' + esc(d.title) + '</h3>' +
              pill(d.status) +
            '</div>' +
            '<p style="margin:4px 0">Campaign: <strong>' + esc(d.engagement_title) + '</strong> · Creator: <strong>' + esc(d.creator_name) + '</strong> · Submitted ' + esc(String(d.created_at||'').slice(0,10)) + '</p>' +
            (d.notes ? '<p class="muted" style="font-size:12px;margin:4px 0">' + esc(d.notes) + '</p>' : '') +
            (d.file_url ? '<p style="margin:6px 0"><a href="' + esc(d.file_url) + '" target="_blank" rel="noopener" class="btn btn-soft btn-small">Open deliverable file ↗</a></p>' : '') +
            (d.brand_feedback ? '<div class="notice"><strong>Previous feedback:</strong> ' + esc(d.brand_feedback) + '</div>' : '') +
          '</div>' +
          (d.status !== 'approved' ? (
            '<form class="review-mini" data-form="deliverable-review" style="width:min(320px,100%)">' +
              '<input type="hidden" name="engagement_id" value="' + esc(d.engagement_id) + '">' +
              '<input type="hidden" name="id" value="' + esc(d.id) + '">' +
              formField('Decision','action','approve',{type:'select',options:[{value:'approve',label:'Approve'},{value:'request_revision',label:'Request revision'}]}) +
              formField('Feedback / revision notes','feedback','',{type:'textarea',placeholder:'Describe changes needed or sign-off note…'}) +
              '<button class="btn btn-primary btn-small" type="submit" style="margin-top:6px">Submit review</button>' +
            '</form>'
          ) : '<div style="padding:8px 12px"><span class="pill pill-green">✓ Approved</span></div>') +
        '</article>'
      ).join('') : '<div class="empty">No deliverables submitted yet. When hired creators upload project files for accepted engagements, they will appear here.</div>') +
    '</div>';
  }

  async function renderActivity(){
    if(!S.profile || S.profile.role !== 'admin'){
      return '<div class="panel"><div class="eyebrow" style="color:#9c3826">Access Denied</div><h1 class="serif" style="font-size:32px">Administrative Workspace Restricted</h1><p class="muted">This workspace is restricted to authorized platform administrators with verified database roles. Access is strictly enforced by the backend.</p><button class="btn btn-primary" data-go="dashboard">Return to workspace</button></div>';
    }
    const data=await api('/api/verification').catch(()=>({records:[]}));
    const allRecords=data.records||[];
    const verified=allRecords.filter(r=>r.status==='verified');
    const pending=allRecords.filter(r=>r.status==='evidence_submitted');

    return '<div class="dash-title">' +
      '<div>' +
        '<div class="eyebrow">Platform Administration</div>' +
        '<h1>Platform Activity & Governance</h1>' +
        '<p>Platform verification status, administrative capabilities, and server-side authorization audit.</p>' +
      '</div>' +
      '<button class="btn btn-soft" data-go="verification">Verification review queue ↗</button>' +
    '</div>' +
    '<div class="dashboard-stats">' +
      '<div class="metric"><span>Pending review</span><strong>' + pending.length + '</strong><small>Evidence awaiting decision</small></div>' +
      '<div class="metric"><span>Verified claims</span><strong>' + verified.length + '</strong><small>Approved by administrators</small></div>' +
      '<div class="metric"><span>Total records</span><strong>' + allRecords.length + '</strong><small>Platform claims on file</small></div>' +
    '</div>' +
    '<div class="panel">' +
      '<div class="panel-head">' +
        '<div>' +
          '<h2>Platform Security & Authorization Architecture</h2>' +
          '<p>Server-enforced session controls and administrative scope</p>' +
        '</div>' +
      '</div>' +
      '<div class="notice success" style="margin-bottom:16px">' +
        '<strong>Role-Based Access Control Active:</strong> Admin privileges are strictly authorized by the backend using your verified session and database role (<code>app_profiles.role = \'admin\'</code>). Client flags, URL parameters, and local-storage values cannot elevate access.' +
      '</div>' +
      '<div class="form-grid">' +
        '<div class="help-role-card">' +
          '<strong style="color:var(--ink);font-size:13px">Supported Backend Admin Capabilities</strong>' +
          '<ul style="margin:8px 0;padding-left:18px;font-size:12px;color:var(--muted)">' +
            '<li>Review creator evidence claims (<code>GET /api/verification?review=true</code>)</li>' +
            '<li>Record verification decisions: Verify or Reject (<code>PUT /api/verification</code>)</li>' +
            '<li>Attach immutable reviewer notes and timestamps</li>' +
            '<li>View complete verification audit log (<code>GET /api/verification</code>)</li>' +
          '</ul>' +
        '</div>' +
        '<div class="help-role-card">' +
          '<strong style="color:var(--ink);font-size:13px">Unsupported / Missing Backend APIs</strong>' +
          '<ul style="margin:8px 0;padding-left:18px;font-size:12px;color:var(--muted)">' +
            '<li>No arbitrary user suspension or ban API in backend</li>' +
            '<li>No public content removal or takedown API in backend</li>' +
            '<li>No schema alteration or role modification endpoint</li>' +
            '<li><em>Per strict change control:</em> Frontend only supports verified backend capabilities.</li>' +
          '</ul>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="panel">' +
      '<div class="panel-head">' +
        '<div>' +
          '<h2>Recent Verification Claims Activity</h2>' +
          '<p>' + allRecords.length + ' claim(s) recorded on platform</p>' +
        '</div>' +
      '</div>' +
      (allRecords.length ? allRecords.slice(0, 10).map(v =>
        '<div class="row-card"><div>' +
          '<h3>' + esc(v.claim) + '</h3>' +
          '<p>' + (v.creator_name ? 'Creator: <strong>' + esc(v.creator_name) + '</strong> · ' : '') + pill(v.status) + ' · Type: ' + esc(v.claim_type) + ' · Date: ' + esc(String(v.created_at||'').slice(0,10)) + '</p>' +
          (v.review_notes ? '<p class="muted" style="font-size:11px">Reviewer note: ' + esc(v.review_notes) + '</p>' : '') +
        '</div>' +
        (v.status === 'evidence_submitted' ? '<button class="btn btn-primary btn-small" data-go="verification">Review claim ↗</button>' : '') +
        '</div>'
      ).join('') : '<div class="empty">No verification records found on platform.</div>') +
    '</div>';
  }
  function profileForm(){
    const p=S.profile||{},brand=p.role==='brand';
    return '<div class="dash-title"><div><div class="eyebrow">Your details</div><h1>Profile & settings</h1><p>Share what partners need to know and control your public visibility.</p></div></div><form class="panel" data-form="profile"><div class="form-grid">'+formField('Display name','display_name',p.display_name||'',{required:true})+formField(brand?'Organization name':'Professional headline',brand?'organization':'headline',brand?p.organization||'':p.headline||'',{required:true})+formField('Location','location',p.location||'')+(brand?formField('Industry','industry',p.industry||''):formField('Headline','headline',p.headline||''))+formField('Website or portfolio link','website',p.website||'',{type:'url',placeholder:'https://…'})+formField('About','bio',p.bio||'',{type:'textarea',full:true})+(brand?formField('Industry focus','industry',p.industry||''):formField('Skills (comma separated)','skills',asArray(p.skills).join(', '),{placeholder:'AI filmmaking, animation, art direction'}))+(brand?formField('Organization type','categories',asArray(p.categories).join(', '),{placeholder:'Agency, studio, in-house team'}):formField('Tools & models (comma separated)','tools',asArray(p.tools).join(', '),{placeholder:'Runway, Midjourney, ComfyUI'}))+(brand?'':formField('Content specialties','categories',asArray(p.categories).join(', '),{placeholder:'AI filmmaking, advertising, motion'}))+(brand?'':formField('Formats / aspect ratios','formats',asArray(p.formats).join(', '),{placeholder:'16:9, 9:16, MP4, PNG'}))+(brand?'':formField('Languages','languages',asArray(p.languages).join(', '),{placeholder:'English, Hindi'}))+(brand?'':formField('Availability','availability',p.availability||'open',{type:'select',options:[{value:'open',label:'Open to work'},{value:'limited',label:'Limited availability'},{value:'unavailable',label:'Unavailable'}]}))+(brand?'':formField('Typical minimum price','price_min',p.price_min||0,{type:'number',min:0,step:'1'}))+(brand?'':formField('Typical maximum price','price_max',p.price_max||0,{type:'number',min:0,step:'1'}))+(brand?'':formField('Currency','currency',p.currency||'USD',{placeholder:'USD'}))+'</div>'+(brand?'':'<div class="field" style="margin-top:18px"><label><input style="width:auto" type="checkbox" name="commercial_use_declared" '+(p.commercial_use_declared?'checked':'')+'> I declare that I can discuss/licence commercial-use terms for my work. This is a creator declaration, not independent legal clearance.</label></div>')+'<div class="field" style="margin-top:12px"><label><input style="width:auto" type="checkbox" name="public_profile" '+(p.public_profile!==false?'checked':'')+'> Make my profile visible in public creator discovery</label></div><div class="form-actions"><button class="btn btn-primary" type="submit">Save profile</button></div></form><div class="panel"><div class="panel-head"><div><h2>Account security</h2><p>CREOVA uses passwordless email codes and supports passkeys on compatible devices.</p></div></div><button class="btn btn-soft" data-action="manage-passkeys">Manage passkeys</button><a class="btn btn-soft" href="/project-notes.html" style="margin-left:8px">Project documentation</a><div id="passkey-list"></div></div>';
  }
  async function renderPortfolio(){
    const result=await api('/api/portfolio');S.lastPortfolio=result.items||[];
    const p=S.currentPortfolio||{};
    const isCurrentVideo = p.media_type === 'video' || /\.(mp4|webm|mov)(\?.*)?$/i.test(p.media_url || '');
    const currentMediaHtml = p.media_url ? (
      '<div class="current-media-preview">' +
        '<div class="current-media-preview-title">' + (isCurrentVideo ? '▶ Current Attached Video' : '✦ Current Attached Image') + '</div>' +
        (isCurrentVideo
          ? '<video src="' + esc(p.media_url) + '" controls preload="metadata" playsinline></video>'
          : '<img src="' + esc(p.media_url) + '" alt="' + esc(p.title) + '">') +
        '<small class="field-hint" style="margin-top:6px;display:block">You can add more images and videos below; each upload will be saved as its own portfolio gallery item.</small>' +
      '</div>'
    ) : '';

    return '<div class="dash-title"><div><div class="eyebrow">Your body of work</div><h1>Portfolio studio</h1><p>Show the output and the workflow behind it. Rights details remain declared until reviewed.</p></div><button class="btn btn-primary" data-action="new-portfolio">+ Add a project</button></div>' +
      '<div class="panel"><div class="panel-head"><div><h2>'+ (S.currentPortfolio?'Edit portfolio item':'Create a portfolio item')+'</h2><p>Images and videos (MP4, WebM up to 10 MB) are uploaded to private object storage and secured to your creator account.</p></div></div>' +
      '<form data-form="portfolio" class="form-grid">' +
        '<input type="hidden" name="id" value="'+esc(p.id||'')+'">' +
        formField('Project title','title',p.title||'',{required:true}) +
        formField('Content type','content_type',p.content_type||'AI filmmaking',{type:'select',options:['AI filmmaking','animation','image generation','advertising','motion graphics','other'].map(v=>({value:v,label:v}))}) +
        formField('Visual style','visual_style',p.visual_style||'',{placeholder:'Cinematic, editorial, tactile…'}) +
        formField('Media type','media_type',p.media_type||'video',{type:'select',options:[{value:'video',label:'Video'},{value:'image',label:'Image'},{value:'animation',label:'Animation'},{value:'other',label:'Other'}]}) +
        formField('Tools / models used','tools',asArray(p.tools).join(', '),{placeholder:'Runway, Midjourney…'}) +
        formField('Skills demonstrated','skills',asArray(p.skills).join(', '),{placeholder:'Art direction, compositing…'}) +
        formField('Formats / aspect ratios','formats',asArray(p.formats).join(', '),{placeholder:'16:9, 9:16, MP4…'}) +
        formField('Production workflow','workflow',asArray(p.workflow).join(', '),{type:'textarea',placeholder:'Moodboard, prompt iteration, edit…'}) +
        formField('Description','description',p.description||'',{type:'textarea',full:true}) +
        formField('Licensing / permissions notes','license_notes',p.license_notes||'',{type:'textarea',full:true,placeholder:'Declared permissions, model terms, source asset restrictions…'}) +
        formField('Portfolio visibility','visibility',p.visibility||'public',{type:'select',options:[{value:'public',label:'Public'},{value:'private',label:'Private'}]}) +
        '<div class="field full">' +
          '<label for="portfolio_media_file">Upload photos and videos (up to 8 files)</label>' +
          '<input type="file" id="portfolio_media_file" name="media_file" accept="video/mp4,video/webm,image/jpeg,image/png,image/webp,image/gif" multiple>' +
          '<small class="field-hint">Select multiple files at once. Supported: MP4, WebM, JPG, PNG, WebP, GIF. Maximum 10 MB per file and 8 files per save. Each file becomes a separate portfolio gallery item with the shared project details.</small>' +
          '<div id="media-file-info" class="media-file-info" style="display:none"></div>' +
          '<div id="upload-progress-wrap" class="upload-progress-wrap" style="display:none">' +
            '<div class="upload-progress-bar"><div id="upload-progress-fill" class="upload-progress-fill"></div></div>' +
            '<div class="upload-progress-label"><span id="upload-progress-status">Uploading media…</span><span id="upload-progress-label">0%</span></div>' +
          '</div>' +
          '<div id="media-upload-error" class="notice" style="display:none;background:#fdf2f0;color:#9c3826;border-color:#f5c2bb;margin-top:8px"></div>' +
          '<div id="media-upload-success" class="notice success" style="display:none;margin-top:8px"></div>' +
          currentMediaHtml +
        '</div>' +
        (p.media_key?'<input type="hidden" name="media_key" value="'+esc(p.media_key)+'">':'') +
        (p.media_url?'<input type="hidden" name="media_url" value="'+esc(p.media_url)+'">':'') +
        '<div class="field full"><label>Rights declaration</label><p class="muted" style="font-size:12px">Items are labelled self-reported by default. Use Verification to submit evidence. Do not upload assets you do not have permission to share.</p></div>' +
        '<div class="form-actions field full"><button type="button" class="btn btn-soft" data-action="clear-portfolio">Cancel</button><button class="btn btn-primary" type="submit">Save portfolio item</button></div>' +
      '</form></div>' +
      '<div class="panel"><div class="panel-head"><div><h2>Portfolio gallery</h2><p>'+(S.lastPortfolio.length)+' saved item(s)</p></div></div>' +
      '<div class="portfolio-grid">' +
        (S.lastPortfolio.length?S.lastPortfolio.map(p=>{
          const isVid = p.media_type === 'video' || /\.(mp4|webm|mov)(\?.*)?$/i.test(p.media_url || '');
          const art = p.media_url
            ? (isVid
                ? '<video src="'+esc(p.media_url)+'" controls preload="metadata" playsinline onerror="this.style.display=\'none\';this.parentElement.innerHTML=\'<span class=\\\'media-failed-badge\\\'>Video unavailable</span>\'"></video>'
                : '<img src="'+esc(p.media_url)+'" alt="'+esc(p.title)+'" loading="lazy">')
            : '<span>'+esc(p.content_type||'CREATIVE')+'</span>';
          return '<article class="portfolio-item">' +
            '<div class="portfolio-art">'+art+'</div>' +
            '<h3>'+esc(p.title)+'</h3>' +
            '<p>'+esc(p.content_type)+' · '+pill(p.rights_status||'self-reported')+' '+pill(p.visibility)+'</p>' +
            '<div class="form-actions" style="justify-content:flex-start">' +
              '<button class="btn btn-soft btn-small" data-action="edit-portfolio" data-id="'+esc(p.id)+'">Edit</button>' +
              '<button class="btn btn-soft btn-small" data-action="delete-portfolio" data-id="'+esc(p.id)+'">Delete</button>' +
            '</div>' +
          '</article>';
        }).join(''):'<div class="empty">Your first project can show the result, the tools, the workflow, and the permissions details together.</div>') +
      '</div></div>';
  }
  async function renderBriefs(){
    const brand=S.profile.role==='brand';
    const result=brand?await api('/api/briefs?mine=true'):await api('/api/briefs');
    S.lastBriefs=result.briefs||[];
    return '<div class="dash-title"><div><div class="eyebrow">'+(brand?'Campaign management':'Open opportunities')+'</div><h1>'+(brand?'Your creative briefs':'Find a brief worth making')+'</h1><p>'+(brand?'Draft, publish, update, or match your briefs to eligible creators.':'Review the scope, budget, formats, timing, and licensing questions before applying.')+'</p></div>'+(brand?'<button class="btn btn-primary" data-action="new-brief">+ Create brief</button>':'')+'</div>'+(brand?'<div class="notice">Publish only after checking the objective, budget, deadline, commercial-use status, and usage/licensing requirements. AI-created fields are suggestions.</div>':'')+'<div class="grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px">'+(S.lastBriefs.length?S.lastBriefs.map(b=>briefCard(b,brand)).join(''):'<div class="empty">'+(brand?'No briefs yet. Start with a manual brief or use the AI assistant to draft editable fields.':'There are no published briefs at the moment. Check back soon.')+'</div>')+'</div>';
  }
  const BRIEF_TEMPLATES = {
    film: {
      title: 'Festive Season Cinematic Brand Film (30s Hero + Cutdowns)',
      content_type: 'AI filmmaking & generative video',
      objective: 'Create an emotional, cinematic 30-second brand film capturing modern festive celebrations with warm golden-hour lighting, photorealistic character consistency, and atmospheric visual storytelling.',
      details: 'Target audience is design-conscious 25-45 urban demographic. Mandatory elements include seamless camera transitions, realistic human expression, brand color accents (warm saffron & charcoal), and sound-design friendly pacing.',
      visual_style: 'Wong Kar-wai meets Denis Villeneuve: warm amber palettes, shallow depth of field, subtle film grain, naturalistic volumetric smoke and light.',
      reference_urls: ['https://creova-ai.hatchable.site/assets/saffron-afterglow.jpg'],
      required_skills: ['AI video generation', 'Prompt engineering', 'Color grading', 'Camera movement control', 'Sound design'],
      required_tools: ['Runway Gen-3', 'Midjourney v6', 'DaVinci Resolve', 'Topaz Video AI'],
      deliverables: ['1x 30s Master Hero Film (16:9 4K)', '2x 15s Cutdowns (9:16 vertical)', '5x High-res Keyframes (PNG)'],
      formats: ['MP4', 'ProRes', 'PNG'],
      aspect_ratios: ['16:9', '9:16'],
      duration: '30 seconds',
      resolution: '4K (3840x2160)',
      budget_min: 3500,
      budget_max: 6000,
      currency: 'USD',
      commercial_use: true,
      channels: ['YouTube', 'Instagram', 'Broadcast TV', 'Website'],
      territories: 'Global',
      usage_duration: '12 months',
      exclusivity: 'Category exclusive (Beverage / Lifestyle)',
      licensing_requirements: 'All source prompts and raw seed generations must be archived. Creator warrants no copyrighted artist names or living likenesses were used without consent.',
      extra_instructions: 'First draft cut within 7 calendar days of engagement kickoff.'
    },
    editorial: {
      title: 'Kinetic Botanical Luxury Fragrance Key Visuals',
      content_type: 'Generative art & commercial key visuals',
      objective: 'Produce 4 high-concept, ultra-detailed key visual stills for luxury botanical perfume packaging and digital billboard displays.',
      details: 'Organic matter transitioning into crystalline glass structures. Dynamic water droplets, macro botanical textures, hyper-sharp refraction.',
      visual_style: 'Nordic minimalism, macro photography, hyper-detailed glass caustics, soft morning sunlight.',
      reference_urls: ['https://creova-ai.hatchable.site/assets/kinfield-web.jpg'],
      required_skills: ['Generative image synthesis', '3D compositing', 'Photoshop retouching', 'High-res upscaling'],
      required_tools: ['Midjourney v6', 'Magnific AI', 'Adobe Photoshop Generative Fill'],
      deliverables: ['4x Ultra-res Master Stills (12000x8000px)', '4x Social Crops (4:5 & 1:1)'],
      formats: ['TIFF', 'PNG', 'PSD'],
      aspect_ratios: ['1:1', '4:5', '16:9'],
      duration: 'Static key visual',
      resolution: '300 DPI 12K print ready',
      budget_min: 1500,
      budget_max: 3000,
      currency: 'USD',
      commercial_use: true,
      channels: ['Print billboard', 'In-store POS', 'E-commerce', 'Vogue / Harper\'s Bazaar print'],
      territories: 'North America & Europe',
      usage_duration: 'Perpetual',
      exclusivity: 'Non-exclusive',
      licensing_requirements: 'Full commercial buyout and raw PSD layers required upon delivery.',
      extra_instructions: 'Deliver in 300 DPI CMYK alongside digital sRGB profiles.'
    },
    social: {
      title: 'Cyber-Surrealist Product Unboxing (9:16 Vertical Reel)',
      content_type: 'AI character animation & viral shortform video',
      objective: 'Generate a captivating 15-second TikTok / Instagram Reels video featuring an original stylized cybernetic character introducing a futuristic sneaker design.',
      details: 'Energetic fast-cut rhythm, expressive facial animation, dynamic physics, vibrant neon-pastel palette.',
      visual_style: 'Neo-Tokyo anime realism, sleek metallic shaders, cinematic hyper-pop lighting.',
      reference_urls: ['https://creova-ai.hatchable.site/assets/little-worlds.jpg'],
      required_skills: ['Character rigging & motion transfer', 'Generative video', 'Audio sync', 'Vertical video optimization'],
      required_tools: ['Kling AI', 'Luma Dream Machine', 'ElevenLabs', 'CapCut'],
      deliverables: ['1x 15s Vertical Video (9:16 1080x1920 60fps)', '1x Sound Track Stem'],
      formats: ['MP4', 'WAV'],
      aspect_ratios: ['9:16'],
      duration: '15 seconds',
      resolution: '1080x1920 (60fps)',
      budget_min: 2000,
      budget_max: 4000,
      currency: 'USD',
      commercial_use: true,
      channels: ['TikTok', 'Instagram Reels', 'YouTube Shorts'],
      territories: 'Global',
      usage_duration: '6 months',
      exclusivity: 'Category exclusive (Footwear)',
      licensing_requirements: 'Original voice generation license and generative video commercial rights.',
      extra_instructions: 'Include 3 alternative thumbnail frames.'
    }
  };
  function briefEditor(){
    const b=S.currentBrief||{};
    const arr=k=>asArray(b[k]).join(', ');
    return '<div class="dash-title"><div><div class="eyebrow">Brand / agency workspace</div><h1>'+(b.id?'Edit creative brief':'Shape the brief')+'</h1><p>Set the context and requirements. The rights and licensing section is deliberately explicit.</p></div><button class="btn btn-soft" data-go="briefs">← Back to briefs</button></div>' +
      '<div class="panel">' +
        '<div class="panel-head"><div><h2>AI brief assistant & guided templates <span class="pill pill-green">Ready</span></h2><p>Live AI generation via paid external models is paused for hackathon zero-cost reproducibility. Use our curated, production-ready AI campaign presets below to instantly pre-fill all deliverables, models, formats, and licensing rules.</p></div></div>' +
        (S.aiNotice ? '<div class="notice success" style="margin-bottom:16px">'+esc(S.aiNotice)+'</div>' : '') +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;margin-top:12px">' +
          '<div style="background:#f8f5ee;border:1px solid var(--line);border-radius:12px;padding:14px;display:flex;flex-direction:column;justify-content:space-between">' +
            '<div>' +
              '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px"><strong style="color:var(--ink);font-size:13px">🎬 Cinematic AI Brand Film</strong><span class="pill">Runway + Midjourney</span></div>' +
              '<p style="font-size:12px;color:#5a5349;margin:0 0 10px;line-height:1.4">30s 4K hero film + cutdowns, golden hour aesthetic, character consistency, commercial rights.</p>' +
            '</div>' +
            '<button type="button" class="btn btn-primary btn-small" data-action="load-brief-template" data-template="film">Load Film Template ⚡</button>' +
          '</div>' +
          '<div style="background:#f8f5ee;border:1px solid var(--line);border-radius:12px;padding:14px;display:flex;flex-direction:column;justify-content:space-between">' +
            '<div>' +
              '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px"><strong style="color:var(--ink);font-size:13px">🖼️ Luxury Editorial Stills</strong><span class="pill">Midjourney v6 + Magnific</span></div>' +
              '<p style="font-size:12px;color:#5a5349;margin:0 0 10px;line-height:1.4">12K master stills for billboard & print packaging, macro botanicals, 300 DPI CMYK deliverables.</p>' +
            '</div>' +
            '<button type="button" class="btn btn-primary btn-small" data-action="load-brief-template" data-template="editorial">Load Editorial Template ⚡</button>' +
          '</div>' +
          '<div style="background:#f8f5ee;border:1px solid var(--line);border-radius:12px;padding:14px;display:flex;flex-direction:column;justify-content:space-between">' +
            '<div>' +
              '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px"><strong style="color:var(--ink);font-size:13px">📱 Viral Character Reel</strong><span class="pill">Kling + ElevenLabs</span></div>' +
              '<p style="font-size:12px;color:#5a5349;margin:0 0 10px;line-height:1.4">15s 9:16 vertical social reel, cybernetic character animation, voice sync, footwear lifestyle.</p>' +
            '</div>' +
            '<button type="button" class="btn btn-primary btn-small" data-action="load-brief-template" data-template="social">Load Social Reel Template ⚡</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<form class="panel" data-form="brief"><input type="hidden" name="id" value="'+esc(b.id||'')+'"><div class="panel-head"><div><h2>Campaign fundamentals</h2><p>Fields marked required must be complete before publishing.</p></div>'+pill(b.status||'draft')+'</div><div class="form-grid">'+formField('Campaign title','title',b.title||'',{required:true})+formField('Content type','content_type',b.content_type||'',{required:true,placeholder:'AI filmmaking, image generation…'})+formField('Objective','objective',b.objective||'',{type:'textarea',full:true,required:true,placeholder:'What should this creative work achieve?'})+formField('Creative requirements','details',b.details||'',{type:'textarea',full:true,required:true,placeholder:'Audience, key message, mandatory elements…'})+formField('Visual style / references','visual_style',b.visual_style||'',{type:'textarea',full:true})+formField('Reference URLs','reference_urls',arr('reference_urls'),{placeholder:'https://… , https://…'})+formField('Required skills','required_skills',arr('required_skills'),{placeholder:'Art direction, compositing…'})+formField('Required tools / models','required_tools',arr('required_tools'),{placeholder:'Runway, Blender…'})+formField('Deliverables and quantities','deliverables',arr('deliverables'),{type:'textarea',full:true,placeholder:'1 hero film, 3 cutdowns, 5 stills'})+formField('Formats','formats',arr('formats'),{placeholder:'MP4, PNG, PSD…'})+formField('Aspect ratios','aspect_ratios',arr('aspect_ratios'),{placeholder:'16:9, 9:16, 1:1'})+formField('Duration','duration',b.duration||'',{placeholder:'15–30 seconds'})+formField('Resolution','resolution',b.resolution||'',{placeholder:'1080p, 4K…'})+formField('Minimum budget','budget_min',b.budget_min||0,{type:'number',min:0,step:'1',required:true})+formField('Maximum budget','budget_max',b.budget_max||0,{type:'number',min:0,step:'1',required:true})+formField('Currency','currency',b.currency||'USD',{required:true})+formField('Deadline','deadline',b.deadline?String(b.deadline).slice(0,10):'',{type:'date'})+formField('Commercial use required?','commercial_use',b.commercial_use===true?'true':(b.commercial_use===false?'false':''),{type:'select',required:true,options:[{value:'',label:'Choose one'},{value:'true',label:'Yes — commercial use'},{value:'false',label:'No / not required'}]})+formField('Intended channels','channels',arr('channels'),{placeholder:'Instagram, website, paid social…'})+formField('Territories','territories',b.territories||'',{placeholder:'India, Global…'})+formField('Usage duration','usage_duration',b.usage_duration||'',{placeholder:'6 months, perpetual…'})+formField('Exclusivity','exclusivity',b.exclusivity||'',{placeholder:'Non-exclusive, category exclusivity…'})+formField('Licensing requirements / questions','licensing_requirements',b.licensing_requirements||'',{type:'textarea',full:true,placeholder:'Tool/model terms, source assets, training data, likeness, music, trademarks…'})+formField('Additional instructions','extra_instructions',b.extra_instructions||'',{type:'textarea',full:true})+formField('Status','status',b.status||'draft',{type:'select',options:[{value:'draft',label:'Draft'},{value:'published',label:'Published'},{value:'closed',label:'Closed'},{value:'archived',label:'Archived'}]})+'</div><div class="form-actions"><button class="btn btn-soft" type="submit" name="saveMode" value="draft">Save draft</button><button class="btn btn-primary" type="submit" name="saveMode" value="published">Publish brief ↗</button></div></form>';
  }
  async function renderProposals(){
    const data=await api('/api/proposals');S.lastProposals=data.proposals||[];
    const brand=S.profile.role==='brand';
    return '<div class="dash-title"><div><div class="eyebrow">Applications & decisions</div><h1>Proposals</h1><p>'+(brand?'Review creator approaches and accept or decline submitted proposals.':'Track applications, proposed budgets, and delivery windows.')+'</p></div></div><div class="panel">'+(S.lastProposals.length?S.lastProposals.map(p=>'<div class="row-card" style="align-items:start"><div style="flex:1"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><h3>'+esc(p.brief_title||'Creative brief')+'</h3>'+pill(p.status)+'</div><p>'+(brand?'Creator: '+esc(p.creator_name||'Creator')+' · '+esc(p.creator_headline||''):'Brand: '+esc(p.brand_name||'Brand'))+'</p><p><strong>'+money(p.proposed_price,p.currency)+'</strong> · '+esc(p.delivery_days)+' days</p><p style="white-space:pre-wrap">'+esc(p.cover_letter)+'</p>'+(asArray(p.milestones).length?'<div class="tags">'+asArray(p.milestones).map(m=>'<span class="tag">'+esc(typeof m==='string'?m:m.title)+'</span>').join('')+'</div>':'')+'</div><div style="display:flex;gap:7px;flex-wrap:wrap">'+(brand&&p.status==='submitted'?'<button class="btn btn-primary btn-small" data-action="proposal-decision" data-id="'+esc(p.id)+'" data-decision="accept">Accept</button><button class="btn btn-soft btn-small" data-action="proposal-decision" data-id="'+esc(p.id)+'" data-decision="decline">Decline</button>':(!brand&&p.status==='submitted'?'<button class="btn btn-soft btn-small" data-action="proposal-decision" data-id="'+esc(p.id)+'" data-decision="withdraw">Withdraw</button>':''))+'</div></div>').join(''):'<div class="empty">No proposals yet. Published briefs and applications will appear here with their current status.</div>')+'</div>';
  }
  async function renderEngagements(){
    const data=await api('/api/engagements');S.lastEngagements=data.engagements||[];
    return '<div class="dash-title"><div><div class="eyebrow">From accepted proposal to delivery</div><h1>Engagements</h1><p>One project space for milestones, submissions, revisions, and final approval.</p></div></div><div class="panel">'+(S.lastEngagements.length?S.lastEngagements.map(e=>'<div class="row-card"><div><h3>'+esc(e.title||e.brief_title)+'</h3><p>'+(S.profile.role==='creator'?'Brand: '+esc(e.brand_name||'Partner'):'Creator: '+esc(e.creator_name||'Partner'))+' · '+pill(e.status)+'</p><p class="muted">Due: '+esc(e.due_date?String(e.due_date).slice(0,10):'not set')+'</p></div><button class="btn btn-primary btn-small" data-action="open-engagement" data-id="'+esc(e.id)+'">Open workspace ↗</button></div>').join(''):'<div class="empty">When a brand accepts a proposal, the engagement appears here automatically.</div>')+'</div>';
  }
  async function renderEngagementDetail(){
    const id=Number(S.params.get('id'));
    if(!id)return '<div class="empty">Choose an engagement from the list.</div>';
    const data=await api('/api/engagements?id='+id);const e=data.engagement;const ds=data.deliverables||[];
    const creator=S.profile.role==='creator'&&String(e.creator_user_id)===String(S.profile.user_id||S.user.id);
    const milestones=asArray(e.milestones);
    return '<div class="dash-title"><div><div class="eyebrow">Engagement #'+esc(e.id)+'</div><h1>'+esc(e.title)+'</h1><p>'+esc(e.objective||'')+'</p></div><div>'+pill(e.status)+' <button class="btn btn-soft btn-small" data-go="engagements">← All engagements</button></div></div><div class="panel"><div class="panel-head"><div><h2>Project details</h2><p>Creator: '+esc(e.creator_name||'')+' · Brand: '+esc(e.brand_name||'')+'</p></div></div><p>'+esc(e.details||'')+'</p><div class="tags">'+chips(e.formats)+'</div><div class="notice">'+(e.commercial_use?'Commercial use is requested. Confirm rights and restrictions before final publication.':'Commercial use is not marked as required in this brief.')+' '+esc(e.licensing_requirements||'')+'</div><h3>Milestones</h3>'+(milestones.length?'<div class="tags">'+milestones.map(m=>'<span class="tag">'+esc(m.title||m)+' · '+esc(m.status||'pending')+'</span>').join('')+'</div>':'<p class="muted">No milestones specified in the proposal.</p>')+(S.profile.role==='brand'&&['active','revision_requested'].includes(e.status)?'<button class="btn btn-soft btn-small" data-action="cancel-engagement" data-id="'+esc(e.id)+'">Cancel engagement</button>':'')+'</div><div class="panel"><div class="panel-head"><div><h2>Deliverables & revisions</h2><p>Each new submission increments the version number; earlier versions are retained.</p></div></div>'+(ds.length?ds.map(d=>'<article class="row-card" style="align-items:start"><div style="flex:1"><h3>v'+esc(d.version)+' · '+esc(d.title)+'</h3><p>'+pill(d.status)+' · '+esc(String(d.created_at||'').slice(0,10))+'</p><p>'+esc(d.notes||'')+'</p>'+(d.file_url?'<a href="'+esc(d.file_url)+'" target="_blank" rel="noopener" class="btn btn-soft btn-small">Open deliverable ↗</a>':'')+(d.brand_feedback?'<div class="notice">'+esc(d.brand_feedback)+'</div>':'')+'</div>'+(S.profile.role==='brand'&&d.status!=='approved'?'<form class="review-mini" data-form="deliverable-review" style="width:min(320px,100%)"><input type="hidden" name="engagement_id" value="'+esc(e.id)+'"><input type="hidden" name="id" value="'+esc(d.id)+'">'+formField('Decision','action','approve',{type:'select',options:[{value:'approve',label:'Approve'},{value:'request_revision',label:'Request revision'}]})+formField('Feedback','feedback','',{type:'textarea',placeholder:'What should change?'})+'<button class="btn btn-primary btn-small" type="submit">Submit review</button></form>':'')+'</article>').join(''):'<div class="empty">No deliverables submitted yet.</div>')+(S.profile.role==='creator'&&['active','revision_requested','in_review'].includes(e.status)?'<form class="form-grid" data-form="deliverable" style="margin-top:22px"><input type="hidden" name="engagement_id" value="'+esc(e.id)+'">'+formField('Submission title','title','',{required:true})+formField('Notes / version summary','notes','',{type:'textarea',placeholder:'What changed in this version?'})+'<div class="field full"><label>Deliverable file (max 10 MB)</label><input type="file" name="media_file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" required></div>'+'<div class="field full"><label>Or link to a deliverable URL</label><input name="file_url" type="url" placeholder="https://…"></div><div class="form-actions field full"><button class="btn btn-primary" type="submit">Submit new version ↗</button></div></form>':'')+'</div>';
  }
  async function renderVerification(){
    const admin=S.profile.role==='admin';
    let data;
    try {
      // Avoid stale cached GET responses on hosted deployments; this page must
      // always request the current user's verification records.
      const fresh = 'fresh=' + Date.now();
      if(admin) {
        try { data=await api('/api/verification?review=true&'+fresh); }
        catch(reviewError) { data=await api('/api/verification?'+fresh); }
      } else {
        data=await api('/api/verification?'+fresh);
      }
    } catch(loadError) {
      const message = loadError && loadError.message ? loadError.message : 'Unknown network error';
      return '<div class="panel"><div class="eyebrow">Verification temporarily unavailable</div><h1 class="serif" style="font-size:32px">We could not load your verification records.</h1><p class="muted">'+esc(message)+'</p><p class="muted">Your profile and existing records have not been changed. Please retry, or return to your dashboard while we investigate the connection.</p><div class="form-actions"><button class="btn btn-primary" data-action="retry">Try again</button><button class="btn btn-soft" data-go="dashboard">Back to dashboard</button></div></div>';
    }
    const records=data.records||[];
    return '<div class="dash-title"><div><div class="eyebrow">Trust, with evidence</div><h1>'+(admin?'Verification review':'Verification claims & creator trust')+'</h1><p>'+(admin?'Review the submitted evidence and record an explicit decision.':'Submit evidence for tool use, production workflows, or past work. Claims without evidence remain self-reported.')+'</p></div></div>'+(S.profile.role==='creator'?'<div class="panel"><div class="panel-head"><div><h2>Submit a claim for review</h2><p>Evidence could be a workflow capture, process notes, original files, or permission evidence. Never claim rights you cannot support.</p></div></div><form data-form="verification" class="form-grid">'+formField('Claim type','claim_type','tool',{type:'select',options:[{value:'tool',label:'Tool or model used'},{value:'workflow',label:'Production workflow'},{value:'past_work',label:'Past work / portfolio claim'}],required:true})+formField('Claim','claim','',{required:true,placeholder:'I used… / This work was produced by…'})+formField('Evidence URL','evidence_url','',{type:'url',placeholder:'https://…'})+formField('Portfolio item ID (optional)','portfolio_item_id','',{type:'number',min:1})+formField('Evidence notes','evidence_notes','',{type:'textarea',full:true,placeholder:'Explain what this evidence supports and what it does not prove.'})+'<div class="form-actions field full"><button class="btn btn-primary" type="submit">Submit for review</button></div></form></div>':'')+'<div class="panel"><div class="panel-head"><div><h2>'+ (admin?'Submitted claims':'Your claims')+'</h2><p>Self-reported is not the same as independently verified.</p></div></div>'+(records.length?records.map(v=>'<div class="row-card" style="align-items:start"><div style="flex:1"><div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center"><h3>'+esc(v.claim)+'</h3>'+pill(v.status)+'<span class="pill">'+esc(v.claim_type)+'</span></div><p>'+(v.creator_name?'Creator: '+esc(v.creator_name)+' · ':'')+'Submitted '+esc(String(v.created_at||'').slice(0,10))+'</p>'+(v.evidence_url?'<p><a href="'+esc(v.evidence_url)+'" target="_blank" rel="noopener">View submitted evidence ↗</a></p>':'<p class="muted">No evidence link attached.</p>')+'<p>'+esc(v.evidence_notes||'')+'</p>'+(v.review_notes?'<div class="notice">'+esc(v.review_notes)+'</div>':'')+'</div>'+(admin&&v.status==='evidence_submitted'?'<div style="display:flex;gap:8px"><button class="btn btn-primary btn-small" data-action="verification-decision" data-id="'+esc(v.id)+'" data-decision="verify">Verify</button><button class="btn btn-soft btn-small" data-action="verification-decision" data-id="'+esc(v.id)+'" data-decision="reject">Reject</button></div>':'')+'</div>').join(''):'<div class="empty">No verification records yet.</div>')+'</div>';
  }
  async function renderShortlist(){
    const data=await api('/api/shortlist');const creators=data.creators||[];
    return '<div class="dash-title"><div><div class="eyebrow">Your saved talent</div><h1>Saved shortlist & creator discovery</h1><p>Save public profiles while you compare tools, workflows, budgets, and availability.</p></div></div><div class="creator-grid">'+(creators.length?creators.map(c=>creatorCard(c)).join(''):'<div class="empty">Your shortlist is empty. Save a creator from discovery to compare them here.</div>')+'</div>';
  }
  async function renderMatches(){
    const briefId=S.params.get('briefId');
    if(!briefId)return '<div class="empty">Open My briefs and choose “Find matches” for a campaign.</div>';
    const data=await api('/api/matches?brief_id='+encodeURIComponent(briefId));
    return '<div class="dash-title"><div><div class="eyebrow">Explainable creator matching</div><h1>Eligible creators</h1><p>Mandatory eligibility checks run before the deterministic weighted score. This is not claimed to be an AI ranking.</p></div><button class="btn btn-soft" data-go="briefs">← Back to briefs</button></div><div class="notice">'+esc(data.scoring)+' Rights caution: creator declarations are not independent legal clearance.</div><div class="panel"><div class="panel-head"><div><h2>Best-fit creators · '+esc(data.total_eligible)+'</h2></div></div><div class="creator-grid">'+(data.matches.length?data.matches.map(c=>'<article class="creator-card"><div class="creator-top">'+cardAvatar(c)+'<div><h3>'+esc(c.display_name)+'</h3><div class="sub">'+esc(c.headline||'')+'</div></div></div><div class="metric" style="margin:15px 0"><span>Compatibility score</span><strong>'+esc(c.match_score)+' / 100</strong><small>'+esc((c.match_reasons||[]).join(' · ')||'Partial profile fit')+'</small></div><div class="tags">'+chips(c.skills)+' '+chips(c.tools)+'</div><p class="muted">'+esc(c.rights_note||'')+'</p><div class="card-foot"><span>'+money(c.price_min,c.currency)+' – '+money(c.price_max,c.currency)+'</span><button class="btn btn-soft btn-small" data-action="view-portfolio" data-creator-id="'+esc(c.user_id)+'">View work</button></div><button class="btn btn-soft btn-small" style="margin-top:12px" data-action="shortlist" data-creator-id="'+esc(c.user_id)+'">☆ Save</button></article>').join(''):'<div class="empty">No eligible creators matched. Consider widening budget or format requirements, while keeping rights needs explicit.</div>')+'</div></div>'+(data.excluded.length?'<details class="panel"><summary>Excluded from ranking · '+esc(data.total_excluded)+'</summary>'+data.excluded.map(c=>'<div class="row-card"><div><strong>'+esc(c.display_name)+'</strong><p class="muted">'+esc(c.exclusion_reasons.join(' · '))+'</p></div></div>').join('')+'</details>':'');
  }
  async function renderCreatorLanding(){
    root.innerHTML=publicHeader()+'<main id="public-main"><div class="loading">Loading creator portfolio & verified case studies…</div></main>'+footer();
    try{
      const id=S.params.get('id');
      if(!id) throw new Error('Creator id is missing.');
      const d=await api('/api/creator?user_id='+encodeURIComponent(id));
      const c=d.creator, items=d.portfolio||[], claims=d.verification||[];
      const verified=claims.filter(v=>v.status==='verified');
      $('#public-main').innerHTML='<section class="section"><div class="container">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px">' +
          '<a href="#/discover" data-go="discover" class="btn btn-soft btn-small">← Back to creator directory</a>' +
          (S.profile&&S.profile.role==='brand' ? '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-soft btn-small" data-action="shortlist" data-creator-id="'+esc(c.user_id)+'">☆ Save to shortlist</button><button class="btn btn-primary btn-small" data-action="hire-creator" data-creator-id="'+esc(c.user_id)+'">Hire this creator ↗</button></div>' : '') +
        '</div>' +
        '<div class="profile-hero" style="margin-bottom:34px">' + cardAvatar(c) + '<div style="flex:1">' +
          '<div style="display:flex;justify-content:space-between;align-items:start;gap:14px;flex-wrap:wrap">' +
            '<div>' +
              '<div class="eyebrow">Creator profile & case studies</div>' +
              '<h1 class="serif" style="font-size:clamp(30px,4vw,44px);margin:4px 0 6px">'+esc(c.display_name)+'</h1>' +
              '<p style="font-size:14px;color:#5a5349;margin:0 0 6px">'+esc(c.headline||'AI creative')+' · ⌁ '+esc(c.location||'Remote')+'</p>' +
            '</div>' +
            '<span class="pill '+(c.availability==='open'?'pill-green':(c.availability==='limited'?'':'pill-terracotta'))+'">' +
              (c.availability==='open'?'● Open to work':(c.availability==='limited'?'● Limited availability':'Unavailable')) +
            '</span>' +
          '</div>' +
          (c.bio ? '<p style="font-size:14px;line-height:1.6;margin:12px 0 16px;color:#3f3b35;max-width:850px">'+esc(c.bio)+'</p>' : '') +
          '<div class="tags" style="margin:10px 0 14px">'+chips(c.skills)+' '+chips(c.tools)+' '+chips(c.categories)+'</div>' +
          '<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;padding-top:14px;border-top:1px solid rgba(232,226,216,0.8);font-size:12px">' +
            '<span class="muted">Typical range: <strong>'+money(c.price_min,c.currency)+' – '+(Number(c.price_max)>0?money(c.price_max,c.currency):'Flexible')+'</strong></span>' +
            (c.commercial_use_declared ? '<span class="pill pill-green" title="Creator declares ability to discuss and license commercial-use terms">✓ Commercial-use terms declared</span>' : '<span class="pill pill-terracotta" title="Commercial rights require explicit consultation">Commercial-use terms not declared</span>') +
            (verified.length ? '<span class="pill pill-green">✓ '+verified.length+' evidence-reviewed claim(s)</span>' : '<span class="pill">Claims self-reported</span>') +
            (c.website ? '<a class="btn btn-soft btn-small" href="'+esc(c.website)+'" target="_blank" rel="noopener">Website / portfolio ↗</a>' : '') +
          '</div>' +
        '</div></div>' +
        '<div class="section-head"><div><div class="eyebrow">Documented work</div><h2>Creative case studies</h2></div><p>'+items.length+' public project(s). Inspect documented workflows, tools, and rights declarations.</p></div>' +
        '<div class="case-study-list">' +
          (items.length ? items.map(p => caseStudyCard(p, claims)).join('') : '<div class="empty">This creator has not published public case studies yet.</div>') +
        '</div>' +
        '<div class="panel" style="margin-top:38px"><div class="panel-head"><div><h2>Verification signals & claim audit</h2><p>Evidence-based claims reviewed by authorized platform reviewers. Self-reported claims remain distinct until verified.</p></div><span class="pill">'+claims.length+' total claim(s)</span></div>' +
          (claims.length ? claims.map(v => '<div class="row-card" style="align-items:start"><div style="flex:1"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><h3>'+esc(v.claim)+'</h3>'+pill(v.status)+'<span class="pill">'+esc(v.claim_type)+'</span></div>'+(v.evidence_url?'<p style="margin:6px 0"><a href="'+esc(v.evidence_url)+'" target="_blank" rel="noopener" style="color:var(--accent);font-weight:700">View submitted evidence ↗</a></p>':'<p class="muted" style="margin:4px 0">No external link attached.</p>')+(v.evidence_notes?'<p style="font-size:12px;color:var(--muted);margin:4px 0">'+esc(v.evidence_notes)+'</p>':'')+(v.review_notes?'<div class="notice" style="margin-top:8px"><strong>Reviewer note:</strong> '+esc(v.review_notes)+'</div>':'')+'</div><span class="muted" style="font-size:11px">'+(v.reviewed_at?'Reviewed '+esc(String(v.reviewed_at).slice(0,10)):'Submitted')+'</span></div>').join('') : '<div class="empty">No verification claims submitted for public display. Creator claims are currently self-reported.</div>') +
          '<div class="notice" style="margin-top:16px"><strong>Trust notice:</strong> Verification confirms that an authorized reviewer examined supporting evidence for the specific claim. It is not an independent warranty of intellectual property or blanket legal clearance.</div>' +
        '</div>' +
      '</div></section>';
    }catch(e){
      $('#public-main').innerHTML='<section class="section"><div class="container"><div class="empty">'+esc(e.message)+' <a href="#/discover" data-go="discover">Return to discovery</a></div></div></section>';
    }
    root.insertAdjacentHTML('beforeend',modalHtml()+toastHtml());
  }
  async function renderHireRequests(){
    const data=await api('/api/hire-requests');
    const rows=data.requests||[], creator=data.role==='creator';
    const title=creator?'Hire requests sent to you':'Your hiring requests';
    const intro=creator?'Review project scope, budget, timing, formats and licensing before accepting.':'Track requests you have sent to creators. Accepted requests should be followed by a confirmed scope and licensing agreement.';
    return '<div class="dash-title"><div><div class="eyebrow">Creator commissioning</div><h1>'+title+'</h1><p>'+intro+'</p></div>'+(creator?'':'<button class="btn btn-primary" data-go="discover">Discover creators ↗</button>')+'</div>'+
      '<div class="notice">Email notices are attempted for registered creator accounts. Hatchable Free plan restrictions may prevent delivery; requests remain visible in this workspace. Demo profiles are illustrative and do not have inboxes.</div>'+
      (rows.length?rows.map(r=>{
        const name=creator?(r.brand_organization||r.brand_name||'Brand / Agency'):(r.creator_name||'Creator');
        const status=String(r.status||'pending');
        const date=r.requested_date?String(r.requested_date).slice(0,10):'Flexible';
        const deliverables=asArray(r.deliverables).join(', ')||'To be agreed';
        const formats=asArray(r.formats).join(', ')||'To be agreed';
        const emailLabel=r.email_status==='sent'?'Email sent':(r.email_status==='no_email'?'No email inbox for this demo profile':(r.email_status==='blocked_or_failed'?'Email may be restricted by plan/allowlist':'Email notification not confirmed'));
        return '<article class="panel" style="margin-bottom:16px"><div class="panel-head"><div><div class="eyebrow">'+(creator?'Incoming request':'Request to creator')+'</div><h2>'+esc(r.project_title)+'</h2><p>'+esc(name)+' · '+esc(r.content_type||'Creative project')+'</p></div>'+pill(status)+'</div>'+
          '<p style="white-space:pre-wrap">'+esc(r.work_description)+'</p>'+
          '<div class="form-grid"><div class="field"><label>Proposed budget</label><div class="notice">'+money(r.proposed_budget,r.currency)+'</div></div><div class="field"><label>Preferred schedule</label><div class="notice">'+esc(date)+' · '+esc(r.requested_time||'Flexible')+' · '+esc(r.timezone||'Asia/Kolkata')+'</div></div><div class="field"><label>Duration</label><div class="notice">'+esc(r.duration||'To be agreed')+'</div></div><div class="field"><label>Deliverables</label><div class="notice">'+esc(deliverables)+'</div></div><div class="field"><label>Formats / aspect ratios</label><div class="notice">'+esc(formats)+'</div></div><div class="field"><label>Commercial use</label><div class="notice">'+(r.commercial_use?'Required — confirm rights before starting':'Not marked as required')+'</div></div></div>'+
          (r.licensing_requirements?'<p><strong>Licensing requirements:</strong> '+esc(r.licensing_requirements)+'</p>':'')+(r.extra_notes?'<p><strong>Additional notes:</strong> '+esc(r.extra_notes)+'</p>':'')+
          '<p class="muted" style="font-size:12px">'+esc(emailLabel)+' · Submitted '+esc(String(r.created_at||'').slice(0,10))+'</p>'+
          (creator&&status==='pending'?'<div class="form-actions"><button class="btn btn-soft" data-action="hire-response" data-id="'+esc(r.id)+'" data-decision="decline">Decline</button><button class="btn btn-primary" data-action="hire-response" data-id="'+esc(r.id)+'" data-decision="accept">Accept request</button></div>':'')+
          (!creator&&status==='pending'?'<div class="form-actions"><button class="btn btn-soft" data-action="cancel-hire-request" data-id="'+esc(r.id)+'">Cancel request</button></div>':'')+
          (status==='accepted'?'<div class="notice success">Accepted. Confirm the final scope, exact delivery schedule, payment, and commercial-use licence with the other party before work begins.</div>':'')+
          '</article>';
      }).join(''):'<div class="panel"><div class="empty">'+(creator?'No hire requests yet. Complete your portfolio and keep your availability current so brands can discover you.':'No requests yet. Open Discover Creators, review a profile and select Hire creator to send a structured project request.')+'</div></div>');
  }
  async function renderPage(){
    const route=S.route;
    if(route==='dashboard')return renderDashboard();
    if(route==='profile')return profileForm();
    if(route==='portfolio')return renderPortfolio();
    if(route==='briefs')return renderBriefs();
    if(route==='brief-editor')return briefEditor();
    if(route==='proposals')return renderProposals();
    if(route==='engagements')return renderEngagements();
    if(route==='engagement-detail')return renderEngagementDetail();
    if(route==='hiring')return renderHireRequests();
    if(route==='verification')return renderVerification();
    if(route==='shortlist')return renderShortlist();
    if(route==='matches')return renderMatches();
    if(route==='documents')return renderDocuments();
    if(route==='deliverables')return renderDeliverables();
    if(route==='activity'||route==='platform')return renderActivity();
    return renderDashboard();
  }
  function renderLoginHelpModal(){
    return '<button class="modal-close" data-action="close-modal" aria-label="Close help guide">×</button>' +
      '<div class="eyebrow">CREOVA Sign-In & Onboarding Guide</div>' +
      '<h2 class="serif" style="font-size:26px;margin:6px 0 16px">How Sign-In & Accounts Work</h2>' +
      '<div style="font-size:13px;line-height:1.6;color:#454038;max-height:70vh;overflow-y:auto;padding-right:6px">' +
        '<div style="margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--line)">' +
          '<h3 style="font-size:15px;color:var(--ink);margin:0 0 6px">1. Passwordless Email Sign-In</h3>' +
          '<p style="margin:0 0 6px">CREOVA uses passwordless email access codes. No passwords to remember or lose:</p>' +
          '<ol style="margin:0;padding-left:20px">' +
            '<li>Enter your email address in the field.</li>' +
            '<li>Click <strong>Send access code ↗</strong>. CREOVA will immediately issue a secure 6-digit code to your email.</li>' +
            '<li>Enter the 6-digit code to enter your workspace.</li>' +
            '<li><em>Optional passkeys:</em> You can register a passkey (Face ID, Touch ID, Windows Hello) for instant 1-click access.</li>' +
          '</ol>' +
        '</div>' +
        '<div style="margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--line)">' +
          '<h3 style="font-size:15px;color:var(--ink);margin:0 0 6px">2. New Account Registration & Role Selection</h3>' +
          '<p style="margin:0 0 6px">New users sign in with their email; upon first code verification, CREOVA prompts you to select your account type:</p>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px">' +
            '<div style="background:#f8f5ee;border:1px solid var(--line);border-radius:12px;padding:12px">' +
              '<strong style="display:block;font-size:12px;color:var(--ink);margin-bottom:4px">Creator Studio</strong>' +
              '<span style="font-size:11px;color:var(--muted)">For AI filmmakers, visual artists, and generative creators showcasing portfolios and applying to briefs.</span>' +
            '</div>' +
            '<div style="background:#f8f5ee;border:1px solid var(--line);border-radius:12px;padding:12px">' +
              '<strong style="display:block;font-size:12px;color:var(--ink);margin-bottom:4px">Brand / Agency</strong>' +
              '<span style="font-size:11px;color:var(--muted)">For creative directors, brands, and agencies publishing briefs, discovering talent, and commissioning work.</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--line)">' +
          '<h3 style="font-size:15px;color:var(--ink);margin:0 0 6px">3. Verification Code Troubleshooting</h3>' +
          '<p style="margin:0 0 6px">If your verification code does not arrive promptly:</p>' +
          '<ul style="margin:0;padding-left:20px">' +
            '<li>Check your Spam / Junk folder.</li>' +
            '<li>Ensure the email address is spelled correctly.</li>' +
            '<li>Codes expire for security; click <em>← Change email</em> to request a fresh code.</li>' +
          '</ul>' +
        '</div>' +
        '<div style="margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--line)">' +
          '<h3 style="font-size:15px;color:var(--ink);margin:0 0 6px">4. Automatic Role-Based Navigation</h3>' +
          '<p style="margin:0">After authentication, CREOVA loads your personalized workspace according to your role (Creator Studio, Brand / Agency Workspace, or Admin Review Workspace).</p>' +
        '</div>' +
        '<div style="margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--line);background:#f5efe6;border-radius:12px;padding:12px">' +
          '<h3 style="font-size:14px;color:var(--ink);margin:0 0 4px">5. Demonstration Profiles & Public Browsing</h3>' +
          '<p style="margin:0;font-size:12px">The platform database includes pre-seeded demonstration profiles for public browsing:</p>' +
          '<ul style="margin:6px 0;padding-left:20px;font-size:12px">' +
            '<li><strong>Creators:</strong> Mira Solanki (<code>demo-creator-01</code>), Theo Laurent (<code>demo-creator-02</code>), Anika Rao (<code>demo-creator-03</code>)</li>' +
            '<li><strong>Brands:</strong> Studio Saffron (<code>demo-brand-01</code>), Still Form Studio (<code>demo-brand-02</code>)</li>' +
          '</ul>' +
          '<p style="margin:0;font-size:11px;color:var(--muted)"><em>Note:</em> Demo profiles are public directory showcase fixtures and do not have email inboxes. To test interactive features, sign in with your own valid email address to receive live verification codes.</p>' +
        '</div>' +
        '<div>' +
          '<h3 style="font-size:15px;color:var(--ink);margin:0 0 6px">6. Administrator Access</h3>' +
          '<p style="margin:0">Platform administrators sign in through the same secure email-code interface using their authorized account. Role permissions are enforced server-side via the database.</p>' +
        '</div>' +
      '</div>' +
      '<div class="form-actions" style="margin-top:16px">' +
        '<button class="btn btn-primary btn-small" type="button" data-action="close-modal">Got it, back to sign in</button>' +
      '</div>';
  }
  function renderLogin(nextDest='dashboard'){
    return '<main class="container section">' +
      '<div class="panel" style="max-width:480px;margin:40px auto;padding:36px;border-radius:24px;box-shadow:var(--shadow)">' +
        '<div class="eyebrow">CREOVA Member Access</div>' +
        '<h1 class="serif" style="font-size:32px;margin:8px 0 10px">Sign in to CREOVA</h1>' +
        '<p class="muted" style="margin-bottom:20px">Sign in or create an account with a secure email verification code. No password needed.</p>' +
        '<form data-form="auth-login" id="auth-login-form">' +
          '<input type="hidden" name="next_dest" value="'+esc(nextDest)+'">' +
          '<div id="auth-email-step">' +
            '<label class="field">' +
              '<span>Email address</span>' +
              '<input type="email" name="email" id="auth-email-input" class="search-input" style="width:100%;margin-top:6px;box-sizing:border-box" placeholder="you@studio.com" required autocomplete="username webauthn">' +
            '</label>' +
            '<button class="btn btn-primary" type="submit" style="width:100%;margin-top:16px">Send access code ↗</button>' +
            '<div style="margin-top:12px;text-align:center"><button class="btn btn-soft btn-small" type="button" data-action="passkey-login" style="width:100%">Sign in with passkey on this device</button></div>' +
            '<div style="margin-top:10px;text-align:center"><button class="btn btn-soft btn-small" type="button" data-action="open-login-help" style="width:100%">How to sign in? ⓘ</button></div>' +
          '</div>' +
          '<div id="auth-code-step" style="display:none;margin-top:16px">' +
            '<div class="notice success" id="auth-code-notice">We sent a six-digit verification code to your email.</div>' +
            '<label class="field" style="margin-top:12px">' +
              '<span>6-digit verification code</span>' +
              '<input type="text" name="code" id="auth-code-input" class="search-input" style="width:100%;margin-top:6px;letter-spacing:6px;font-size:22px;text-align:center;box-sizing:border-box" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="000000" autocomplete="one-time-code">' +
            '</label>' +
            '<button class="btn btn-primary" type="submit" style="width:100%;margin-top:16px">Verify code & enter workspace ↗</button>' +
            '<div style="margin-top:12px;text-align:center"><button type="button" class="btn btn-soft btn-small" data-action="auth-back-to-email">← Change email</button></div>' +
          '</div>' +
          '<div id="auth-error" class="notice" style="display:none;margin-top:14px;background:#f7e4df;color:#963c2d;border-color:#ebd1cb"></div>' +
        '</form>' +
        '<div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;font-size:12px">' +
          '<a href="#/home" data-go="home">← Back to home</a>' +
          '<a href="#/discover" data-go="discover">Explore creators</a>' +
        '</div>' +
      '</div>' +
    '</main>';
  }
  async function render(){
    const route=routeFromLocation();
    S.route=route.name;
    S.anchor=route.anchor;
    S.params=route.params;
    const user=S.user;

    if(S.route==='creator') return renderCreatorLanding();
    if(S.route==='home'||S.route==='discover'||S.route==='briefs-public'){
      return renderLanding();
    }
    if(S.route==='login'){
      const nextDest=S.params.get('next')||'dashboard';
      if(user){ go(nextDest); return; }
      root.innerHTML=publicHeader()+renderLogin(nextDest)+footer()+toastHtml();
      return;
    }
    if(!user){
      const nextTarget=S.route+(S.params&&S.params.toString()?'?'+S.params.toString():'');
      root.innerHTML=publicHeader()+renderLogin(nextTarget)+footer()+toastHtml();
      return;
    }
    if(!S.profile && S.route!=='dashboard') {
      const p=await api('/api/profile').catch(()=>({profile:null}));
      S.profile=p.profile;
    }
    if(!S.profile) { root.innerHTML=onboarding(); root.insertAdjacentHTML('beforeend',toastHtml()); return; }
    try{
      const content=await renderPage();
      root.innerHTML=shell(content,S.route==='engagement-detail'?'engagements':S.route);
    }catch(e){
      root.innerHTML=shell('<div class="panel"><div class="eyebrow">Something needs attention</div><h1 class="serif" style="font-size:36px">We could not load this view.</h1><p class="muted">'+esc(e.message)+'</p><button class="btn btn-primary" data-action="retry">Try again</button></div>',S.route);
    }
  }
  function valuesFromForm(form, arrayFields=[]){
    const fd=new FormData(form), out={};
    for(const [k,v] of fd.entries()) if(!(v instanceof File)) out[k]=typeof v==='string'?v.trim():v;
    arrayFields.forEach(k=>{out[k]=String(out[k]||'').split(',').map(s=>s.trim()).filter(Boolean);});
    return out;
  }
  function profilePayload(form, role){
    const p=valuesFromForm(form,['skills','tools','categories','formats','languages']);
    p.role=role;p.price_min=Number(p.price_min||0);p.price_max=Number(p.price_max||0);
    p.public_profile=!!form.elements.public_profile?.checked;p.commercial_use_declared=!!form.elements.commercial_use_declared?.checked;
    if(!p.currency)p.currency='USD';
    return p;
  }
  function uploadFile(file, onProgress){
    return new Promise((resolve, reject) => {
      const val = validateUploadFile(file);
      if (!val.ok) return reject(new Error(val.error));

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/uploads', true);
      xhr.withCredentials = true;

      if (xhr.upload && typeof onProgress === 'function') {
        xhr.upload.onprogress = e => {
          if (e.lengthComputable) {
            const percent = Math.min(100, Math.round((e.loaded / e.total) * 100));
            onProgress(percent, e.loaded, e.total);
          }
        };
      }

      xhr.onload = () => {
        let d = {};
        try { d = JSON.parse(xhr.responseText); } catch (e) {}
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(d);
        } else {
          const msg = d.error || ('Upload failed (' + xhr.status + ').');
          reject(new Error(msg));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during media upload. Check your connection and try again.'));
      };

      xhr.onabort = () => {
        reject(new Error('Upload was cancelled.'));
      };

      const fd = new FormData();
      fd.append('file', file);
      xhr.send(fd);
    });
  }
  async function handleSubmit(event){
    const form=event.target.closest('form[data-form]');if(!form)return;
    event.preventDefault();const kind=form.dataset.form;const submitter=event.submitter;
    const btn=submitter; if(btn){btn.disabled=true;btn.dataset.oldText=btn.textContent;btn.textContent='Saving…';}
    try{
      if(kind==='onboarding'){
        const data=valuesFromForm(form,['skills','tools']);data.role=data.role==='brand'?'brand':'creator';
        data.headline=data.headline||'';data.categories=[];data.formats=[];data.languages=[];
        const res=await api('/api/profile',{method:'POST',body:data});S.profile=res.profile;toast('Your workspace is ready.');go('dashboard');
      }else if(kind==='profile'){
        const data=profilePayload(form,S.profile.role);const res=await api('/api/profile',{method:'POST',body:data});S.profile=res.profile;toast('Profile saved.');await render();
      }else if(kind==='discover'){
        S.search=valuesFromForm(form);S.page=1;S.search.page=1;await renderLanding();
      }else if(kind==='ai-brief'){
        const data=valuesFromForm(form);S.aiIdea=data.idea;
        try {
          const r=await api('/api/ai/brief-builder',{method:'POST',body:{idea:data.idea}});
          S.currentBrief={...(S.currentBrief||{}),...r.brief,status:'draft'};
          S.aiNotice=r.notice||'AI draft loaded. Review and edit every field before saving.';
          toast('AI draft ready to edit.');await render();
        } catch(e) {
          const fallback = BRIEF_TEMPLATES.film;
          S.currentBrief = { ...fallback, status: 'draft' };
          S.aiNotice = 'AI generation is paused to maintain the zero-cost demo environment. Loaded the "Festive Cinematic Brand Film" guided campaign template as a production-ready fallback.';
          toast('AI API paused: Loaded guided campaign template.');
          await render();
        }
      }else if(kind==='brief'){
        const data=valuesFromForm(form,['reference_urls','required_skills','required_tools','deliverables','formats','aspect_ratios','channels']);
        data.budget_min=Number(data.budget_min||0);data.budget_max=Number(data.budget_max||0);const commercialValue=data.commercial_use;if(!commercialValue){toast('Choose whether commercial use is required before saving.');return;}data.commercial_use=commercialValue==='true';
        data.status=submitter&&submitter.value?submitter.value:(data.status||'draft');
        const id=data.id;delete data.id;
        const r=await api('/api/briefs',{method:id?'PUT':'POST',body:{...data,id:id?Number(id):undefined}});
        S.currentBrief=null;S.aiNotice='';toast(r.brief.status==='published'?'Brief published.':'Brief saved as draft.');go('briefs');
      }else if(kind==='portfolio'){
        const data=valuesFromForm(form,['tools','workflow','skills','formats']);
        const files=Array.from(form.elements.media_file&&form.elements.media_file.files||[]);
        const progWrap = $('#upload-progress-wrap', form);
        const progFill = $('#upload-progress-fill', form);
        const progLabel = $('#upload-progress-label', form);
        const progStatus = $('#upload-progress-status', form);
        const errBox = $('#media-upload-error', form);
        const succBox = $('#media-upload-success', form);

        if(errBox) { errBox.style.display = 'none'; errBox.textContent = ''; }
        if(succBox) { succBox.style.display = 'none'; succBox.textContent = ''; }
        if(files.length>8){
          const message='Choose no more than 8 files per save.';
          if(errBox){errBox.textContent=message;errBox.style.display='block';}
          toast(message);return;
        }
        for(const file of files){
          const val=validateUploadFile(file);
          if(!val.ok){
            if(errBox){errBox.textContent=file.name+': '+val.error;errBox.style.display='block';}
            toast(file.name+': '+val.error);return;
          }
        }

        if(!files.length){
          data.id=data.id?Number(data.id):undefined;
          await api('/api/portfolio',{method:data.id?'PUT':'POST',body:data});
        }else{
          if(progWrap)progWrap.style.display='block';
          const baseTitle=data.title;
          const existingId=data.id?Number(data.id):undefined;
          for(let i=0;i<files.length;i++){
            const file=files[i];
            const val=validateUploadFile(file);
            if(progFill)progFill.style.width='0%';
            if(progLabel)progLabel.textContent=(i+1)+' of '+files.length+' · 0%';
            if(progStatus)progStatus.textContent='Uploading '+file.name+' ('+formatFileSize(file.size)+')…';
            if(btn)btn.textContent='Uploading '+(i+1)+'/'+files.length+'…';
            const uploaded=await uploadFile(file,(percent,loaded,total)=>{
              if(progFill)progFill.style.width=percent+'%';
              if(progLabel)progLabel.textContent=(i+1)+' of '+files.length+' · '+percent+'%';
              if(progStatus)progStatus.textContent='Uploading '+file.name+' ('+formatFileSize(loaded)+' / '+formatFileSize(total)+')';
              if(btn)btn.textContent='Uploading '+(i+1)+'/'+files.length+' ('+percent+'%)…';
            });
            const itemData={...data};
            itemData.title=i===0?baseTitle:(baseTitle+' — '+file.name.replace(/\.[^.]+$/,'').slice(0,70));
            itemData.media_key=uploaded.key;
            itemData.media_url='';
            itemData.media_type=val.isVideo?'video':'image';
            itemData.id=i===0?existingId:undefined;
            if(btn)btn.textContent='Saving item '+(i+1)+'/'+files.length+'…';
            await api('/api/portfolio',{method:itemData.id?'PUT':'POST',body:itemData});
          }
          if(succBox){succBox.textContent='✓ Uploaded and saved '+files.length+' portfolio item(s).';succBox.style.display='block';}
        }
        S.currentPortfolio=null;
        toast(files.length>1?'Saved '+files.length+' portfolio gallery items.':(files.length===1?'Portfolio item saved with uploaded media.':'Portfolio item saved.'));
        await render();
      }else if(kind==='hire-request'){
        const data=valuesFromForm(form,['deliverables','formats']);
        data.commercial_use=!!form.elements.commercial_use?.checked;
        const result=await api('/api/hire-requests',{method:'POST',body:data});
        S.modal='';
        toast(result.message||'Hire request submitted.');
        go('hiring');
      }else if(kind==='proposal'){
        const data=valuesFromForm(form,['milestones']);data.brief_id=Number(data.brief_id);data.proposed_price=Number(data.proposed_price);data.delivery_days=Number(data.delivery_days);
        const r=await api('/api/proposals',{method:'POST',body:data});S.modal='';toast('Proposal submitted.');await render();
      }else if(kind==='deliverable'){
        const data=valuesFromForm(form);const file=form.elements.media_file&&form.elements.media_file.files[0];
        if(file){const uploaded=await uploadFile(file);data.file_key=uploaded.key;}
        const r=await api('/api/deliverables',{method:'POST',body:data});toast('Deliverable version submitted.');await render();
      }else if(kind==='deliverable-review'){
        const data=valuesFromForm(form);data.id=Number(data.id);data.engagement_id=Number(data.engagement_id);
        await api('/api/deliverables',{method:'PUT',body:data});toast(data.action==='approve'?'Deliverable approved.':'Revision requested with feedback.');await render();
      }else if(kind==='verification'){
        const data=valuesFromForm(form);data.portfolio_item_id=data.portfolio_item_id?Number(data.portfolio_item_id):null;
        await api('/api/verification',{method:'POST',body:data});toast('Claim submitted. Its status reflects the evidence you provided.');await render();
      }else if(kind==='auth-login'){
        const emailInput=form.querySelector('#auth-email-input');
        const codeInput=form.querySelector('#auth-code-input');
        const emailStep=form.querySelector('#auth-email-step');
        const codeStep=form.querySelector('#auth-code-step');
        const errBox=form.querySelector('#auth-error');
        const nextDest=form.elements.next_dest?.value||'dashboard';
        if(errBox){errBox.style.display='none';errBox.textContent='';}
        const auth=window.hatchable&&window.hatchable.auth;
        if(!auth)throw new Error('Authentication service is initializing. Please wait a moment or reload.');
        const emailVal=emailInput?emailInput.value.trim():'';
        const codeVal=codeInput?codeInput.value.trim():'';
        if(codeStep&&codeStep.style.display!=='none'){
          if(!codeVal)throw new Error('Please enter the 6-digit verification code sent to your email.');
          const result=await auth.verifyCode({email:emailVal,code:codeVal});
          S.user=result.user;
          const p=await api('/api/profile').catch(()=>({profile:null}));
          S.profile=p.profile;
          toast('Welcome to CREOVA!');
          go(nextDest);
        }else{
          if(!emailVal)throw new Error('Please enter your email address.');
          const r=await auth.startLogin({email:emailVal});
          if(r.has_passkey&&auth.supportsPasskeys()){
            try{
              const pass=await auth.signInWithPasskey({email:emailVal});
              S.user=pass.user;
              const p=await api('/api/profile').catch(()=>({profile:null}));
              S.profile=p.profile;
              toast('Signed in with passkey.');
              go(nextDest);
              return;
            }catch(passErr){}
          }
          if(emailStep)emailStep.style.display='none';
          if(codeStep)codeStep.style.display='block';
          if(codeInput){codeInput.required=true;codeInput.focus();}
          const notice=form.querySelector('#auth-code-notice');
          if(notice)notice.textContent='We sent a 6-digit access code to '+emailVal+'. Enter it below to sign in.';
          toast('Access code sent to '+emailVal);
        }
      }
    }catch(e){
      const errBox=form&&form.querySelector('#auth-error');
      if(errBox&&kind==='auth-login'){
        errBox.textContent=e.message||'Authentication failed.';
        errBox.style.display='block';
      }
      toast(e.message||'Something went wrong.');
    }
    finally{if(btn&&btn.isConnected){btn.disabled=false;btn.textContent=btn.dataset.oldText||btn.textContent;}}
  }
  root.addEventListener('submit',handleSubmit);
  root.addEventListener('click',async event=>{
    const a=event.target.closest('[data-action]');const g=event.target.closest('[data-go]');
    const anc=event.target.closest('[data-anchor]');
    if(anc&&!a){
      event.preventDefault();
      const targetId=anc.dataset.anchor;
      if(S.route==='home'){
        const el=document.getElementById(targetId);
        if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
        history.replaceState(null,'','#/'+targetId);
      } else {
        go(targetId);
      }
      return;
    }
    if(g&&!a){event.preventDefault();go(g.dataset.go);return;}
    if(!a)return;
    const action=a.dataset.action;
    try{
      if(action==='logout'){await window.hatchable.auth.signOut();S.user=null;S.profile=null;location.href='/';}
      else if(action==='retry'){await render();}
      else if(action==='passkey-login'){
        const auth=window.hatchable&&window.hatchable.auth;
        const emailInput=document.getElementById('auth-email-input');
        const emailVal=emailInput?emailInput.value.trim():'';
        if(auth&&auth.supportsPasskeys()){
          try{
            const pass=await auth.signInWithPasskey({email:emailVal});
            S.user=pass.user;
            const p=await api('/api/profile').catch(()=>({profile:null}));
            S.profile=p.profile;
            toast('Signed in with passkey.');
            const form=document.querySelector('form[data-form="auth-login"]');
            const nextDest=form?.elements?.next_dest?.value||'dashboard';
            go(nextDest);
          }catch(err){toast(err.message||'Passkey sign-in was cancelled or failed.');}
        }else{toast('Passkeys are not supported on this device/browser.');}
      }
      else if(action==='auth-back-to-email'){
        const emailStep=document.getElementById('auth-email-step');
        const codeStep=document.getElementById('auth-code-step');
        if(emailStep&&codeStep){codeStep.style.display='none';emailStep.style.display='block';}
      }
      else if(action==='clear-discover'){S.search={};await renderLanding();}
      else if(action==='discover-page'){S.search.page=a.dataset.page;await renderLanding();}
      else if(action==='search-briefs'){S.search.briefQ=$('#brief-search')?.value||'';const d=await api('/api/briefs?q='+encodeURIComponent(S.search.briefQ));S.resultBriefs=d.briefs||[];root.querySelector('#public-main').innerHTML='<section class="section"><div class="container"><div class="eyebrow">Opportunities</div><h2 class="serif">Search results</h2><div class="grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px">'+(S.resultBriefs.length?S.resultBriefs.map(b=>briefCard(b,false)).join(''):'<div class="empty">No briefs matched.</div>')+'</div></div></section>'; }
      else if(action==='new-brief'){S.currentBrief=null;S.aiNotice='';S.aiIdea='';go('brief-editor');}
      else if(action==='load-brief-template'){
        const tId=a.dataset.template;
        const tmpl=BRIEF_TEMPLATES[tId];
        if(tmpl){
          S.currentBrief={...tmpl,status:'draft'};
          S.aiNotice='Loaded "'+tmpl.title+'" guided template. Review or adjust any fields before saving or publishing.';
          toast('Loaded template: '+tmpl.title);
          await render();
        }
      }
      else if(action==='edit-brief'){const id=Number(a.dataset.briefId);S.currentBrief=S.lastBriefs.find(b=>Number(b.id)===id)||null;go('brief-editor');}
      else if(action==='brief-detail'){const b=([...S.lastBriefs,...S.resultBriefs]).find(x=>String(x.id)===String(a.dataset.briefId));if(b)S.modal='<button class="modal-close" data-action="close-modal">×</button><div class="eyebrow">Creative brief</div><h2>'+esc(b.title)+'</h2><p class="muted">'+esc(b.content_type)+' · '+pill(b.status||'published')+'</p><h3>Objective</h3><p>'+esc(b.objective||'')+'</p><h3>Requirements</h3><p style="white-space:pre-wrap">'+esc(b.details||'')+'</p><div class="tags">'+chips(b.required_skills)+' '+chips(b.required_tools)+' '+chips(b.formats)+'</div><h3>Deliverables</h3><p>'+esc(asArray(b.deliverables).join(', '))+'</p><h3>Budget & timing</h3><p>'+money(b.budget_min,b.currency)+' – '+money(b.budget_max,b.currency)+' · Due '+esc(b.deadline?String(b.deadline).slice(0,10):'Flexible')+'</p><h3>Rights & usage</h3><p>Commercial use: '+(b.commercial_use?'required':'not marked as required')+'. '+esc(b.licensing_requirements||'No additional licensing note supplied.')+'</p><div class="form-actions"><button class="btn btn-primary" data-action="apply-brief" data-brief-id="'+esc(b.id)+'">Apply to this brief</button></div>';root.insertAdjacentHTML('beforeend',modalHtml());}
      else if(action==='apply-brief'){const id=a.dataset.briefId;const b=([...S.lastBriefs,...S.resultBriefs]).find(x=>String(x.id)===String(id))||{};S.modal='<button class="modal-close" data-action="close-modal">×</button><div class="eyebrow">Creator proposal</div><h2>Apply to '+esc(b.title||'this brief')+'</h2><form data-form="proposal">'+formField('Brief ID','brief_id',id,{type:'number',required:true})+formField('Cover letter','cover_letter','',{type:'textarea',full:true,required:true,placeholder:'Why is your approach a good fit?'})+formField('Proposed price','proposed_price',b.budget_min||'',{type:'number',min:1,required:true})+formField('Currency','currency',b.currency||'USD',{required:true})+formField('Delivery time (days)','delivery_days','14',{type:'number',min:1,max:365,required:true})+formField('Milestones (comma separated)','milestones','Concept, First draft, Final delivery',{placeholder:'Concept, draft, final'})+'<div class="form-actions"><button class="btn btn-soft" type="button" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit">Submit proposal</button></div></form>';root.insertAdjacentHTML('beforeend',modalHtml());}
      else if(action==='close-modal'){S.modal='';const m=$('.modal-backdrop');if(m)m.remove();}
      else if(action==='open-login-help'){S.modal=renderLoginHelpModal();root.insertAdjacentHTML('beforeend',modalHtml());}
      else if(action==='inspect-media'){
        if(event.target.tagName === 'VIDEO' || event.target.closest('video')) return;
        const title=a.dataset.mediaTitle||'Creative Asset';
        const url=a.dataset.mediaUrl;
        const type=a.dataset.mediaType||'image';
        const tools=a.dataset.mediaTools||'';
        const rights=a.dataset.mediaRights||'self-reported';
        const isFixture=a.dataset.isFixture==='true';
        if(url){
          S.modal='<button class="modal-close" data-action="close-modal" aria-label="Close viewer">×</button>' +
            '<div style="max-width:960px;width:100%">' +
              '<div style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:start;gap:12px;flex-wrap:wrap">' +
                '<div>' +
                  '<div class="eyebrow">' + (isFixture ? 'Demonstration Asset · High Resolution' : 'Asset Lightbox · Full Resolution Preview') + '</div>' +
                  '<h2 style="font:500 26px Georgia,serif;margin:4px 0">' + esc(title) + '</h2>' +
                  (tools ? '<p class="muted" style="font-size:13px;margin:2px 0">AI Tools: ' + esc(tools) + '</p>' : '') +
                '</div>' +
                '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' +
                  (isFixture ? '<span class="pill" style="background:#f5ede3;color:#85542b;border:1px solid #decab4;font-size:10px">✦ Demo Artwork Sample</span>' : '') +
                  '<span class="pill ' + (rights === 'verified' ? 'pill-green' : '') + '">' + esc(rights) + '</span>' +
                '</div>' +
              '</div>' +
              '<div style="background:#0c0b09;border-radius:16px;overflow:hidden;display:flex;justify-content:center;align-items:center;min-height:340px;max-height:74vh;position:relative">' +
                (type === 'video'
                  ? '<video src="' + esc(url) + '" controls playsinline preload="metadata" style="max-width:100%;max-height:74vh;display:block" onerror="this.parentElement.innerHTML=\'<div class=\\\'media-fail-fallback\\\' style=\\\'display:flex\\\'><strong>Video could not be loaded</strong><p>The asset URL could not be opened.</p></div>\'"></video>'
                  : '<img src="' + esc(url) + '" alt="' + esc(title) + '" style="max-width:100%;max-height:74vh;object-fit:contain;display:block" onerror="this.parentElement.innerHTML=\'<div class=\\\'media-fail-fallback\\\' style=\\\'display:flex\\\'><strong>Image could not be loaded</strong><p>The asset URL could not be opened.</p></div>\'">') +
              '</div>' +
              '<div style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;font-size:12px">' +
                (isFixture
                  ? '<span class="muted" style="color:#85542b">Demonstration artwork sample for showcase browsing. Not independently verified creator work.</span>'
                  : '<span class="muted">Declared creator rights apply. Separate commercial clearance needed for commercial deployment.</span>') +
                '<a class="btn btn-soft btn-small" href="' + esc(url) + '" target="_blank" rel="noopener">Open direct asset link ↗</a>' +
              '</div>' +
            '</div>';
          root.insertAdjacentHTML('beforeend', modalHtml());
        }
      }
      else if(action==='hire-creator'){
        if(!S.profile||S.profile.role!=='brand'){
          toast('Sign in with a Brand / Agency account to hire a creator.');
          go('login?next=discover');return;
        }
        const creatorId=a.dataset.creatorId;
        let creator=(S.resultCreators||[]).find(c=>String(c.user_id)===String(creatorId));
        if(!creator){
          const detail=await api('/api/creator?user_id='+encodeURIComponent(creatorId));
          creator=detail.creator||{};
        }
        const today=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
        S.modal='<button class="modal-close" data-action="close-modal" aria-label="Close hire form">×</button>'+
          '<div class="eyebrow">Direct creator commission</div><h2 class="serif" style="font-size:28px;margin:6px 0">Hire '+esc(creator.display_name||'this creator')+'</h2>'+
          '<p class="muted">Send a structured request with scope, budget, schedule and licensing terms. The creator can accept or decline.</p>'+
          '<form data-form="hire-request" class="form-grid">'+
          '<input type="hidden" name="creator_user_id" value="'+esc(creatorId)+'">'+
          formField('Project / campaign title','project_title','',{required:true,placeholder:'e.g. Diwali launch film'})+
          formField('Content type','content_type',creator.categories&&creator.categories[0]||'AI filmmaking',{type:'select',options:['AI filmmaking','animation','image generation','advertising','motion graphics','social media','product visualization','brand identity','other'].map(v=>({value:v,label:v}))})+
          formField('Proposed budget','proposed_budget',creator.price_min||500,{type:'number',min:0,step:'100',required:true})+
          formField('Currency','currency','INR',{type:'select',options:[{value:'INR',label:'INR ₹'},{value:'USD',label:'USD $'},{value:'EUR',label:'EUR €'},{value:'GBP',label:'GBP £'}],required:true})+
          formField('Work requirements','work_description','',{type:'textarea',full:true,required:true,placeholder:'Describe the campaign objective, audience, style, and what the creator needs to produce.'})+
          formField('Preferred date','requested_date',today,{type:'date',min:today,required:true})+
          formField('Preferred start time','requested_time','10:00',{type:'time',required:true})+
          formField('Time zone','timezone','Asia/Kolkata',{type:'select',options:[{value:'Asia/Kolkata',label:'India Standard Time (IST)'},{value:'UTC',label:'UTC'},{value:'Europe/London',label:'UK time'},{value:'America/New_York',label:'US Eastern time'},{value:'Asia/Singapore',label:'Singapore time'}],required:true})+
          formField('Expected duration','duration','2 weeks',{required:true,placeholder:'e.g. 2 weeks / 3 working days'})+
          formField('Deliverables (comma separated)','deliverables','1 hero film, 3 social cutdowns',{full:true,required:true,placeholder:'Hero film, reels, stills…'})+
          formField('Formats / aspect ratios','formats','16:9, 9:16',{placeholder:'16:9, 9:16, 1:1'})+
          '<div class="field full"><label><input style="width:auto" type="checkbox" name="commercial_use"> Commercial use is required</label><small class="field-hint">The creator must confirm licensing, model terms, source-asset rights, territories and duration before production.</small></div>'+
          formField('Licensing requirements','licensing_requirements','',{type:'textarea',full:true,placeholder:'Usage duration, territories, exclusivity, paid media, source-file requirements…'})+
          formField('Additional notes','extra_notes','',{type:'textarea',full:true,placeholder:'Reference links, meeting notes, milestones, or other requirements.'})+
          '<div class="form-actions field full"><button type="button" class="btn btn-soft" data-action="close-modal">Cancel</button><button type="submit" class="btn btn-primary">Send hire request ↗</button></div></form>';
        root.insertAdjacentHTML('beforeend',modalHtml());
      }
      else if(action==='view-portfolio'){
        const id=a.dataset.creatorId;
        const data=await api('/api/portfolio?creator='+encodeURIComponent(id));
        const creator=(S.resultCreators||[]).find(c=>String(c.user_id)===String(id))||{};
        S.modal='<button class="modal-close" data-action="close-modal">×</button>' +
          '<div class="profile-hero" style="margin-bottom:20px">' + cardAvatar(creator) + '<div style="flex:1">' +
            '<div class="eyebrow">Quick Look · Creative Case Studies</div>' +
            '<h2 style="font:500 28px Georgia,serif;margin:4px 0">' + esc(creator.display_name||'Creator portfolio') + '</h2>' +
            '<p style="font-size:13px;color:#5c544a;margin:0 0 6px">' + esc(creator.headline||'AI creative') + ' · ⌁ ' + esc(creator.location||'Remote') + '</p>' +
            (creator.bio ? '<p style="font-size:13px;color:#443f38;margin:6px 0 10px">' + esc(creator.bio) + '</p>' : '') +
            '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
              (creator.commercial_use_declared ? '<span class="pill pill-green">✓ Commercial-use declared</span>' : '<span class="pill pill-terracotta">Commercial rights: consult</span>') +
              '<a class="btn btn-soft btn-small" href="#/creator?id=' + encodeURIComponent(id) + '" data-go="creator?id=' + encodeURIComponent(id) + '">Full Profile & Verification ↗</a>' +
              (S.profile&&S.profile.role==='brand' ? '<button class="btn btn-primary btn-small" data-action="hire-creator" data-creator-id="'+esc(id)+'">Hire creator ↗</button>' : '') +
            '</div>' +
          '</div></div>' +
          '<div class="case-study-list" style="margin-top:16px">' +
            ((data.items||[]).length ? data.items.map(p => caseStudyCard(p, [], { compact: true })).join('') : '<div class="empty">This creator has not published portfolio items yet.</div>') +
          '</div>';
        root.insertAdjacentHTML('beforeend',modalHtml());
      }
      else if(action==='shortlist'){await api('/api/shortlist',{method:'POST',body:{creator_user_id:a.dataset.creatorId}});toast('Creator saved to your shortlist.');}
      else if(action==='hire-response'){
        const decision=a.dataset.decision;
        if(decision==='decline'&&!confirm('Decline this hire request?'))return;
        if(decision==='accept'&&!confirm('Accept this hire request? Confirm the final scope, budget, schedule and licensing before work begins.'))return;
        const result=await api('/api/hire-requests',{method:'PUT',body:{id:Number(a.dataset.id),action:decision}});
        toast(result.message||('Hire request '+decision+'ed.'));
        await render();
      }
      else if(action==='cancel-hire-request'){
        if(!confirm('Cancel this pending hire request?'))return;
        await api('/api/hire-requests',{method:'PUT',body:{id:Number(a.dataset.id),action:'cancel'}});
        toast('Hire request cancelled.');await render();
      }
      else if(action==='match-brief'){go('matches?briefId='+encodeURIComponent(a.dataset.briefId));}
      else if(action==='open-engagement'){go('engagement-detail?id='+encodeURIComponent(a.dataset.id));}
      else if(action==='new-portfolio'){S.currentPortfolio=null;go('portfolio');}
      else if(action==='clear-portfolio'){S.currentPortfolio=null;go('portfolio');}
      else if(action==='edit-portfolio'){S.currentPortfolio=S.lastPortfolio.find(p=>String(p.id)===String(a.dataset.id))||null;go('portfolio');}
      else if(action==='delete-portfolio'){if(confirm('Delete this portfolio item?')){await api('/api/portfolio',{method:'DELETE',body:{id:Number(a.dataset.id)}});toast('Portfolio item deleted.');S.currentPortfolio=null;await render();}}
      else if(action==='proposal-decision'){
        const actionValue=a.dataset.decision;
        const id=Number(a.dataset.id);
        if(actionValue!=='accept'&&!confirm('Decline or withdraw this proposal?'))return;
        if(actionValue==='accept'&&!confirm('Accept this proposal and create an engagement?'))return;
        const res=await api('/api/proposals',{method:'PUT',body:{id,action:actionValue}});
        if(actionValue==='accept'&&res.engagement){
          toast('Proposal accepted; engagement #' + res.engagement.id + ' created.');
          go('engagement-detail?id='+encodeURIComponent(res.engagement.id));
          return;
        }
        toast(actionValue==='accept'?'Proposal accepted; engagement created.':'Proposal action updated.');
        await render();
      }
      else if(action==='cancel-engagement'){if(confirm('Cancel this engagement?')){await api('/api/engagements',{method:'PUT',body:{id:Number(a.dataset.id),action:'cancel'}});toast('Engagement cancelled.');await render();}}
      else if(action==='verification-decision'){const notes=prompt('Review note (optional):','');if(notes===null)return;await api('/api/verification',{method:'PUT',body:{id:Number(a.dataset.id),action:a.dataset.decision,review_notes:notes}});toast('Verification decision recorded.');await render();}
      else if(action==='manage-passkeys'){const box=$('#passkey-list');if(!window.hatchable?.auth?.passkeys){toast('Passkeys are not available in this browser.');return;}const keys=await window.hatchable.auth.passkeys.list();if(box)box.innerHTML=keys.length?keys.map(k=>'<div class="row-card"><span>'+esc(k.name||'Passkey')+'</span><button class="btn btn-soft btn-small" data-action="remove-passkey" data-id="'+esc(k.id)+'">Remove</button></div>').join(''):'<p class="muted">No passkeys are registered yet. Sign out and choose “Add a passkey” after email verification to register one.</p>';}
      else if(action==='remove-passkey'){await window.hatchable.auth.passkeys.remove(a.dataset.id);toast('Passkey removed.');const b=$('[data-action="manage-passkeys"]');if(b)b.click();}
      else if(action==='backdrop'&&event.target===a){S.modal='';a.remove();}
    }catch(e){toast(e.message||'Action failed.');}
  });
  root.addEventListener('change',event=>{
    if(event.target.name==='role'&&root.querySelector('form[data-form="onboarding"]')){
      const box=$('#onboarding-extra');if(box)box.innerHTML=event.target.value==='brand'?formField('Organization name','organization','',{required:true}):formField('Headline','headline','',{placeholder:'AI filmmaker · art direction'});
    }
    if(event.target.name==='media_file'){
      const form=event.target.closest('form');
      if(!form) return;
      const files=Array.from(event.target.files||[]);
      const infoBox=$('#media-file-info', form);
      const errBox=$('#media-upload-error', form);
      const succBox=$('#media-upload-success', form);
      const progWrap=$('#upload-progress-wrap', form);

      if(errBox){errBox.style.display='none';errBox.textContent='';}
      if(succBox){succBox.style.display='none';succBox.textContent='';}
      if(progWrap)progWrap.style.display='none';
      if(!files.length){if(infoBox){infoBox.style.display='none';infoBox.innerHTML='';}return;}
      if(files.length>8){
        const message='Choose no more than 8 files per save.';
        if(errBox){errBox.textContent=message;errBox.style.display='block';}
        event.target.value='';toast(message);return;
      }
      for(const file of files){
        const val=validateUploadFile(file);
        if(!val.ok){
          if(infoBox)infoBox.style.display='none';
          if(errBox){errBox.textContent=file.name+': '+val.error;errBox.style.display='block';}
          event.target.value='';toast(file.name+': '+val.error);return;
        }
      }
      if(infoBox){
        infoBox.innerHTML='<strong>'+files.length+' file(s) selected</strong><div style="width:100%;margin-top:8px;display:grid;gap:6px">'+files.map(file=>{
          const val=validateUploadFile(file);
          return '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="file-pill">'+(val.isVideo?'▶ Video':'✦ Image')+'</span><span>'+esc(file.name)+'</span><span class="muted">('+formatFileSize(file.size)+')</span><span style="color:#2f5934;font-weight:600">✓ Ready</span></div>';
        }).join('')+'</div>';
        infoBox.style.display='block';
      }
    }
  });
  window.addEventListener('hashchange',()=>render());
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&S.modal){S.modal='';const m=$('.modal-backdrop');if(m)m.remove();}});
  async function init(){
    try{const session=await window.hatchable?.auth?.getSession();S.user=session&&session.user||null;}catch(e){S.user=null;}
    if(S.user){try{const p=await api('/api/profile');S.profile=p.profile;}catch(e){S.profile=null;}}
    await render();
  }
  init();
})();