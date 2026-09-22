// CN HR 工作量分析仪表板 v5 — 9项全面升级
(function () {
  'use strict';

  var RECORDS = window.HR_RECORDS || [];
  var META = window.HR_META || {};
  var QUOTE_SERVICES = window.QUOTE_SERVICES || [];
  var QUOTE_MODULES = window.QUOTE_MODULES || [];

  // ★ 清洗：剔除报价表表头行（price 为非数字字符串）与脏模块名「服务模块」
  QUOTE_SERVICES = QUOTE_SERVICES.filter(function (s) { return s && typeof s.price === 'number'; });
  QUOTE_MODULES = QUOTE_MODULES.filter(function (m) { return m && m !== '服务模块'; });
  window.QUOTE_SERVICES = QUOTE_SERVICES;
  window.QUOTE_MODULES = QUOTE_MODULES;

  // ══════════════ ★ v7.0 专家团队口径调整 ══════════════
  //  · SDC 共享中心专家：Yuki / Queenie —— 匹配所有业务（不参与工时排行）
  //  · HR 人才发展与组织规划：Chris Zhang —— 单一专案内容，价格另算
  //  · HR 招聘专家：Roc Tian —— 单一专案内容，价格另算
  //  Chris / Roc 的工时统计资料已从版面剔除（不进入任何人效排行与图表）
  var STAT_EXCLUDED_PERSONS = ['Chris Zhang', 'Roc Tian'];
  var EXPERT_TEAM = [
    { name:'Yuki',        role:'SDC 共享中心专家',        tag:'SDC 共享中心', note:'匹配所有业务 · 可承接全部定价服务', scope:'all',     icon:'🏢', color:'#6366f1' },
    { name:'Queenie',     role:'SDC 共享中心专家',        tag:'SDC 共享中心', note:'匹配所有业务 · 可承接全部定价服务', scope:'all',     icon:'🏢', color:'#8b5cf6' },
    { name:'Chris Zhang', role:'HR 人才发展与组织规划',   tag:'专案专家',     note:'单一专案内容 · 价格另算',           scope:'project', icon:'🎓', color:'#fac858' },
    { name:'Roc Tian',    role:'HR 招聘专家',            tag:'专案专家',     note:'单一专案内容 · 价格另算',           scope:'project', icon:'🎯', color:'#ee6666' }
  ];
  function getExpertInfo(person) {
    for (var i = 0; i < EXPERT_TEAM.length; i++) { if (EXPERT_TEAM[i].name === person) return EXPERT_TEAM[i]; }
    return null;
  }
  // ★ 剔除 Chris / Roc 的统计资料（工时、记录、图表全部不再计入）
  RECORDS = RECORDS.filter(function (r) { return STAT_EXCLUDED_PERSONS.indexOf(r.person) < 0; });
  META = Object.assign({}, META, {
    persons: (META.persons || []).filter(function (p) { return STAT_EXCLUDED_PERSONS.indexOf(p) < 0; })
  });

  // ---------- 颜色 ----------
  var MODULE_COLORS = {
    '人力资源规划': '#5470c6',
    '劳动关系管理': '#91cc75',
    '培训与开发': '#fac858',
    '招聘与配置作业': '#ee6666',
    '绩效管理': '#73c0de',
    '薪酬福利管理': '#3ba272'
  };
  var DAILY_COLOR = '#2f7ed8';
  var PROJ_COLOR = '#f59e0b';
  var SERVICE_COLORS = ['#5470c6','#91cc75','#fac858','#ee6666','#73c0de','#3ba272','#fc8452','#9a60b4','#ea7ccc'];
  var PERSON_PALETTE = ['#5470c6','#91cc75','#fac858','#ee6666','#73c0de','#3ba272','#fc8452','#9a60b4','#ea7ccc','#4e79a7','#59a14f','#edc948','#e15759','#76b7b2','#ff9da7','#b07aa1','#86bcb6','#f28e2b','#8cd17d','#bc82c4','#ffb000','#5b8def'];

  // ★ v6.3 专精领域图标映射（HR模块 → 图标+简称）
  var SPECIALTY_ICON_MAP = {
    '招聘与配置作业':            { icon: '🎯', abbr: '招聘', color: '#ee6666' },
    '人力资源规划':              { icon: '📋', abbr: '规划', color: '#5470c6' },
    '培训与开发':                { icon: '🎓', abbr: '培训', color: '#fac858' },
    '薪酬福利':                  { icon: '💰', abbr: '薪酬', color: '#91cc75' },
    '薪酬福利与税务管理':        { icon: '💰', abbr: '薪税', color: '#91cc75' },
    '绩效管理':                  { icon: '📊', abbr: '绩效', color: '#73c0de' },
    '社保公积金管理':            { icon: '🛡️', abbr: '社保', color: '#3ba272' },
    '劳动关系与证件办理':        { icon: '⚖️', abbr: '劳关', color: '#fc8452' },
    '员工关系':                  { icon: '🤝', abbr: '员工', color: '#9a60b4' },
    'HRIS/HRIP数字化':           { icon: '💻', abbr: '数智', color: '#4e79a7' },
    'HRIS/系统运维':             { icon: '🔧', abbr: '运维', color: '#f28e2b' },
    '职称等级':                  { icon: '🏆', abbr: '职称', color: '#ea7ccc' },
    '福利与企业关怀':            { icon: '❤️', abbr: '福利', color: '#e15759' }
  };
  // 默认专精图标（无匹配时使用）
  // ★ v7.0 文案调整：无明确模块专精者统一标注为「行政SDC专精」（原为「HR专精」）
  var DEFAULT_SPECIALTY = { icon: '⭐', abbr: '行政SDC', color: '#6366f1' };

  // ★ 顾问头像映射（v6.3 去除卡通emoji，改为专精领域图标；bg色保留用于渐变背景）
  // emoji 字段现在存的是占位符，实际渲染时由 getPersonIcon() 动态取专精图标
  var AVATAR_MAP = {
    'Bill Tsang':   { bg: '#5470c6' },   // 综合管理型
    'Cako Yang':    { bg: '#ee6666' },   // 招聘配置
    'Chloe Fang':   { bg: '#91cc75' },   // 劳动关系
    'Chris Zhang':  { bg: '#3ba272' },   // 薪酬福利
    'Grace Wang':   { bg: '#fac858' },   // 培训开发
    'Heison Wong':  { bg: '#73c0de' },   // 绩效管理
    'Hope Zhan':    { bg: '#9a60b4' },   // 综合管理
    'Iris Li':      { bg: '#fc8452' },   // 运维支持
    'Janet Au-Yeung': { bg: '#ea7ccc' }, // 福利关怀
    'Jessie Yang':  { bg: '#ee6666' },
    'Lily Qiu':     { bg: '#4e79a7' },   // 数据分析
    'Mandy Hu':     { bg: '#59a14f' },
    'Mia Meng':     { bg: '#edc948' },   // 创意设计
    'Olivia Ye':    { bg: '#e15759' },
    'Penny Pan':    { bg: '#76b7b2' },   // 目标导向
    'Rin Shen':     { bg: '#ff9da7' },   // 研究型
    'Roc Tian':     { bg: '#b07aa1' },   // 快速响应
    'Sherry Jiang': { bg: '#86bcb6' },   // 文档专家
    'Skye Yu':      { bg: '#f28e2b' },   // 流程优化
    'Tammy Tao':    { bg: '#8cd17d' },   // 客户服务
    'Tia Yang':     { bg: '#bc82c4' },   // 协调支持
    'Zoe Lin':      { bg: '#ffb000' }    // 全球化
  };

  // ★ v6.3 根据人员姓名获取其专精图标（基于 topMod 动态匹配）
  function getPersonIcon(person) {
    try {
      // ★ v7.0 专家团队成员优先返回其专家身份（不计入工时统计）
      var ex = getExpertInfo(person);
      if (ex) return { icon: ex.icon, abbr: ex.role, color: ex.color, isExpert: true };
      var prof = getAdvisorProfile(person);
      var modName = prof.topMod;
      if(modName && modName !== '-' && SPECIALTY_ICON_MAP[modName]) return SPECIALTY_ICON_MAP[modName];
    } catch(e) {}
    return DEFAULT_SPECIALTY;
  }

  // ★ v7.0 人员身份标签：专家显示其专家头衔，其余显示「XX专精」
  function personRoleLabel(person) {
    var ex = getExpertInfo(person);
    if (ex) return ex.role;
    return getPersonIcon(person).abbr + '专精';
  }
  // ★ v7.0 是否为「匹配所有业务」的 SDC 共享中心专家
  function isAllScopeExpert(person) {
    var ex = getExpertInfo(person);
    return !!(ex && ex.scope === 'all');
  }
  // ★ v7.0 是否为「单一专案 · 价格另算」的专案专家
  function isProjectExpert(person) {
    var ex = getExpertInfo(person);
    return !!(ex && ex.scope === 'project');
  }

  // ★ 顾问英文名短名（用于介绍页团队墙显示）
  var EN_NAME_MAP = {
    'Bill Tsang': 'Bill', 'Cako Yang': 'Cako', 'Chloe Fang': 'Chloe',
    'Chris Zhang': 'Chris', 'Grace Wang': 'Grace', 'Heison Wong': 'Heison',
    'Hope Zhan': 'Hope', 'Iris Li': 'Iris', 'Janet Au-Yeung': 'Janet',
    'Jessie Yang': 'Jessie', 'Lily Qiu': 'Lily', 'Mandy Hu': 'Mandy',
    'Mia Meng': 'Mia', 'Olivia Ye': 'Olivia', 'Penny Pan': 'Penny',
    'Rin Shen': 'Rin', 'Roc Tian': 'Roc', 'Sherry Jiang': 'Sherry',
    'Skye Yu': 'Skye', 'Tammy Tao': 'Tammy', 'Tia Yang': 'Tia',
    'Zoe Lin': 'Zoe'
  };

  // ★ 收费模式标签（从报价单 unit/spec 字段推断）— 返回 {type, label, color, icon}
  function getPricingType(s) {
    var u = (s.unit || '').toLowerCase();
    var sp = (s.spec || '').toLowerCase();
    var hasPerson = (u.indexOf('人') >= 0 || sp.indexOf('人') >= 0);
    var hasTime   = (u.indexOf('月') >= 0 || u.indexOf('年') >= 0 || sp.indexOf('月') >= 0 || sp.indexOf('年') >= 0);
    var hasHouse  = (u.indexOf('户') >= 0 || sp.indexOf('户') >= 0);
    var hasItem   = (u.indexOf('项') >= 0 || u.indexOf('件') >= 0 || u.indexOf('份') >= 0 || sp.indexOf('项') >= 0 || sp.indexOf('件') >= 0 || sp.indexOf('份') >= 0);
    var hasOnce   = (u.indexOf('次') >= 0 || sp.indexOf('次') >= 0 || u.indexOf('场') >= 0 || sp.indexOf('场') >= 0);
    var hasProj   = (u.indexOf('项目') >= 0 || u.indexOf('岗位') >= 0 || sp.indexOf('项目') >= 0 || sp.indexOf('岗位') >= 0);

    if (hasOnce && !hasPerson && !hasHouse) return { type: 'once', label: '单次/场次', color: '#5470c6', icon: '🎫' };
    if (hasPerson && hasTime)            return { type: 'person_time', label: '按人·按期', color: '#ee6666', icon: '👤' };
    if (hasPerson)                      return { type: 'person', label: '按人头', color: '#ee6666', icon: '👥' };
    if (hasHouse && hasTime)            return { type: 'house_time', label: '按户·按期', color: '#91cc75', icon: '🏠' };
    if (hasHouse)                       return { type: 'house', label: '按户', color: '#91cc75', icon: '🏢' };
    if (hasProj)                        return { type: 'project', label: '按项目', color: '#f59e0b', icon: '📦' };
    if (hasItem)                        return { type: 'item', label: '按件/份', color: '#73c0de', icon: '📄' };
    if (hasTime)                        return { type: 'period', label: '按期间', color: '#9a60b4', icon: '📅' };
    return { type: 'standard', label: '标准报价', color: '#999', icon: '💰' };
  }

  // ★ 格式化价格 + 规格（醒目显示计费单位）
  function formatPriceWithUnit(s) {
    if (s.price == null || s.price === '') return '<span class="price-na">按需定制</span>';
    var priceStr = (typeof s.price === 'number') ? ('¥' + s.price) : String(s.price);
    var specStr = (s.spec || '').trim();
    if (specStr) return '<span class="price-amount">' + priceStr + '</span><span class="price-spec">/' + specStr + '</span>';
    return '<span class="price-amount">' + priceStr + '</span>';
  }

  // ★ v5.4 标签→服务关联映射（每个能力标签对应可匹配的报价服务模块 + 关键词）
  var TAG_SERVICE_MAP = {
    // ★ 模块专精标签（最重要，始终置顶）
    '社保公积金管理专精':   { modules: ['社保公积金管理服务模块'],           keywords: ['社保', '公积金', '账户', '基数', '增减员', '待遇申领'], desc: '精通社保公积金全流程操作', priority: 1 },
    '薪酬福利与税务管理专精': { modules: ['薪酬福利与税务管理服务模块'],     keywords: ['薪酬', '工资', '个税', '报税', '工资单', '成本分摊'], desc: '擅长薪酬核算与税务申报', priority: 1 },
    '劳动关系与证件办理专精': { modules: ['劳动关系与证件办理服务模块'],     keywords: ['入离职', '合同', '证件', '纠纷', '仲裁', '补偿金'], desc: '精通劳动关系管理与风险防控', priority: 1 },
    '招聘与培训开发专精':   { modules: ['招聘与培训开发服务模块'],           keywords: ['招聘', '培训', '入职', '盘点', '人才'], desc: '专注招聘配置与培训开发', priority: 1 },
    '职称等级专精':         { modules: ['职称'],                             keywords: ['职称', '评审', '技能', '补贴'], desc: '熟悉职称评审与技能认定流程', priority: 1 },
    // ★ 业务能力标签（次重要）
    '专案驱动型':       { modules: ['招聘与培训开发服务模块'],              keywords: ['专案', '项目', '盘点', '调研'], desc: '擅长各类 HR 专案推进与项目制管理', priority: 2 },
    '高产能顾问':       { modules: [],                                     keywords: [],                          desc: '月均产出高于团队平均，高效交付', priority: 3 },
    '高吞吐量':         { modules: [],                                     keywords: [],                          desc: '累计处理量大，擅长批量事务', priority: 3 },
    '多面手':           { modules: [],                                     keywords: [],                          desc: '跨多个 HR 模块，综合服务能力强', priority: 4 },
    '全年稳定输出':     { modules: [],                                     keywords: [],                          desc: '全年持续在岗，交付稳定可靠', priority: 4 },
    '会议协调能手':     { modules: [],                                     keywords: ['协调', '沟通', '会议', '对接'], desc: '跨部门协作与会议组织', priority: 5 },
    '稳健实干型':       { modules: [],                                     keywords: [],                          desc: '扎实稳健，按质按量交付', priority: 5 }
  };

  // ★ HR 工作模块 ↔ 报价服务模块 对齐映射（两套口径不同，必须显式对齐才能按人过滤）
  var HR_TO_QUOTE = {
    '劳动关系管理':     ['劳动关系与证件办理服务模块'],
    '培训与开发':       ['招聘与培训开发服务模块'],
    '薪酬福利管理':     ['薪酬福利与税务管理服务模块', '社保公积金管理服务模块'],
    '人力资源规划':     ['职称'],
    '招聘与配置作业':   ['招聘与培训开发服务模块'],
    '绩效管理':         []   // 暂无对应报价服务模块
  };
  var QUOTE_TO_HR = {
    '劳动关系与证件办理服务模块': ['劳动关系管理'],
    '招聘与培训开发服务模块':     ['培训与开发', '招聘与配置作业'],
    '薪酬福利与税务管理服务模块': ['薪酬福利管理'],
    '社保公积金管理服务模块':     ['薪酬福利管理'],
    '职称':                       ['人力资源规划']
  };
  // 报价模块 → 友好标签（用于生成「XX专精」标签）
  var QUOTE_LABEL = {
    '劳动关系与证件办理服务模块': '劳动关系与证件办理',
    '招聘与培训开发服务模块':     '招聘与培训开发',
    '薪酬福利与税务管理服务模块': '薪酬福利与税务管理',
    '社保公积金管理服务模块':     '社保公积金管理',
    '职称':                       '职称等级'
  };

  // ★ 根据标签列表匹配报价服务（可选传入 profile 按人员实际工作模块过滤）
  function matchServicesByTags(tags, profile) {
    var allPriced = QUOTE_SERVICES.filter(function(s){ return s.price != null && s.price !== ''; });
    if (!tags || !tags.length) {
      // ★ 有 profile 时，空标签 = 返回该人工作范围内的全部有定价服务
      if(profile && profile.modHours) {
        var personQuoteMods = {};
        Object.keys(profile.modHours).forEach(function(m){
          var aligned = HR_TO_QUOTE[m];
          if(aligned) aligned.forEach(function(q){ personQuoteMods[q] = true; });
        });
        if(Object.keys(personQuoteMods).length > 0) {
          return allPriced.filter(function(s){ return !!personQuoteMods[s.module]; });
        }
      }
      return allPriced;
    }
    var matchedModules = [];
    var matchedKeywords = [];
    tags.forEach(function(tag){
      var map = TAG_SERVICE_MAP[tag];
      if(map) {
        matchedModules = matchedModules.concat(map.modules || []);
        matchedKeywords = matchedKeywords.concat(map.keywords || []);
      }
    });
    // 去重
    matchedModules = matchedModules.filter(function(m,i){ return matchedModules.indexOf(m) === i; });
    matchedKeywords = matchedKeywords.filter(function(k,i){ return matchedKeywords.indexOf(k) === i; });

    // ★ 该顾问实际工作过的【报价服务模块】集合（通过 HR 模块→报价模块对齐映射）
    var personQuoteMods = {};
    if(profile && profile.modHours) {
      Object.keys(profile.modHours).forEach(function(m){
        var aligned = HR_TO_QUOTE[m];
        if(aligned) aligned.forEach(function(q){ personQuoteMods[q] = true; });
      });
    }
    var hasPersonScope = Object.keys(personQuoteMods).length > 0;

    return QUOTE_SERVICES.filter(function(s){
      if(s.price == null || s.price === '') return false;
      // 模块匹配（标签指向的具体报价模块）
      if(matchedModules.length && matchedModules.indexOf(s.module) >= 0) {
        // 有 profile 时，仅当该顾问实际工作过该模块方向才计入
        if(profile && !personQuoteMods[s.module]) return false;
        return true;
      }
      // 关键词匹配（在 item/content/module 中搜索）
      if(matchedKeywords.length) {
        var fullText = (s.item||'') + (s.content||'') + (s.module||'');
        for(var ki=0;ki<matchedKeywords.length;ki++){
          if(fullText.indexOf(matchedKeywords[ki]) >= 0) return true;
        }
      }
      // 通用标签（无具体模块/关键词）：按顾问实际工作范围过滤
      if(!matchedModules.length && !matchedKeywords.length) {
        if(profile) {
          if(!hasPersonScope) return true;          // 无模块对齐信息时不强行过滤
          return !!personQuoteMods[s.module];
        }
        return true;
      }
      return false;
    });
  }

  // ---------- 状态 ----------
  var state = {
    page: 'landing',
    ym: 'all',
    region: 'all',
    module: 'all',
    type: 'all',
    persons: new Set(),
    bu: 'all',
    detail: 'all',
    dailyDetailSearch: '',
    projDetailSearch: '',
    svcModule: 'all',
    svcSearch: '',
    svcMode: 'priced',        // ★ 默认只显示可定价服务
    svcHR: '',
    selectedServices: new Set(),
    serviceQuantities: {},     // ★ 服务数量 {idx: qty}
    customHours: '',
    feeType: 'total',
    customFee: '',
    advisorPerson: '',          // ★ 当前查看的顾问
    svcTagFilters: [],          // ★ v5.4 标签筛选（从顾问页多选带入）
    calcSearch: '',             // ★ v6.1 计费区搜索关键词
    calcPricingFilter: '',       // ★ v6.1 计费区计费模式筛选
    // ★ v7.0.5 服务需求单表单（与专案需求单同构：联系人/联系方式/期望交付时间/备注）
    //   计费区遇搜索等操作会重建 DOM，故表单值入 state，重建后不丢
    svcReqForm: { name: '', contact: '', due: '', remark: '' },
    prevPage: 'landing'          // ★ v6.3 上一页（用于返回上一步）
  };

  var charts = {};

  // ---------- 工具 ----------
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function fmt(n, d) { d = (d == null ? 1 : d); return (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toLocaleString('en-US'); }
  function opt(val, label) { var o = document.createElement('option'); o.value = val; o.textContent = label; return o; }
  function moduleColor(m) { return MODULE_COLORS[m] || '#999'; }
  // ★ v7.0 首页 Hero 统计（按剔除后的统计口径实时计算，避免写死数字与实际脱节）
  function _heroTotalHours() { var s = 0; for (var i = 0; i < RECORDS.length; i++) s += RECORDS[i].hours; return s; }
  function _heroPricedCount() { return QUOTE_SERVICES.filter(function (s) { return s.price != null && s.price !== ''; }).length; }

  // ★ v7.0 统一「按服务模块浏览」入口
  //   模块口径唯一：清空顾问/标签残留，避免「顾问专精 ∩ 所选模块 = 空集 → 计费区无服务」
  function selectServiceModule(mod) {
    state.svcModule = mod || 'all';
    state.svcMode = 'priced';
    state.advisorPerson = '';
    state.svcTagFilters = [];
    switchPage('services');
  }

  // ---------- 核心过滤 ----------
  function baseFilter(opts) {
    opts = opts || {};
    var out = [];
    for (var i = 0; i < RECORDS.length; i++) {
      var r = RECORDS[i];
      if (opts.type && r.type !== opts.type) continue;
      if (state.ym !== 'all' && r.ym !== state.ym) continue;
      if (state.region !== 'all' && r.region !== state.region) continue;
      if (state.module !== 'all' && r.module !== state.module) continue;
      if (state.persons.size > 0 && !state.persons.has(r.person)) continue;
      if (opts.bu && state.bu !== 'all' && r.type === 'daily' && r.bu !== state.bu) continue;
      if (opts.detail && state.detail !== 'all' && r.detail !== state.detail) continue;
      out.push(r);
    }
    return out;
  }

  function sumHours(rows) { var s = 0; for (var i = 0; i < rows.length; i++) s += rows[i].hours; return s; }
  function sumQty(rows) { var s = 0; for (var i = 0; i < rows.length; i++) s += rows[i].qty; return s; }
  function meetingRows(rows) { return rows.filter(function (r) { return r.meeting; }); }

  function distinctSorted(rows, key) {
    var set = {};
    rows.forEach(function (r) { if (r[key] != null) set[r[key]] = 1; });
    return Object.keys(set).sort();
  }

  function activeYMs(rows) {
    var set = {};
    rows.forEach(function (r) { if (r.ym) set[r.ym] = 1; });
    return Object.keys(set).sort();
  }

  // ★ v6.6 根据服务模块获取推荐顾问（按该模块方向工时降序排列）
  function getRecommendedAdvisorsForModule(svcModule) {
    // 报价服务模块 → HR工作模块
    var hrMods = QUOTE_TO_HR[svcModule] || [];
    if(!hrMods.length) return [];
    // 遍历所有顾问，计算在该HR模块方向的工时
    var ranked = [];
    META.persons.forEach(function(p){
      var prof = getAdvisorProfile(p);
      var modH = 0;
      hrMods.forEach(function(hm){ modH += (prof.modHours[hm] || 0); });
      if(modH > 0) {
        // 计算该人可承接的匹配服务数
        var matched = matchServicesByTags([], prof);
        ranked.push({ person: p, modHours: modH, matchCount: matched.length, prof: prof });
      }
    });
    // 按工时降序，取 Top
    ranked.sort(function(a,b){ return b.modHours - a.modHours; });
    return ranked.slice(0, 5); // 最多显示5个推荐
  }

  // ★ 获取顾问的主要工作模块和工时分布
  function getAdvisorProfile(person) {
    var rows = RECORDS.filter(function(r){ return r.person === person; });
    var modHours = {};
    var totalH = 0, dailyH = 0, projH = 0, meetH = 0, totalQty = 0;
    var topDetails = [];
    rows.forEach(function(r){
      totalH += r.hours;
      totalQty += r.qty;
      if(r.type === 'daily') dailyH += r.hours;
      else projH += r.hours;
      if(r.meeting) meetH += r.hours;
      modHours[r.module] = (modHours[r.module]||0) + r.hours;
    });
    // Top 3 细项
    var detailMap = {};
    rows.forEach(function(r){
      var key = r.module + '||' + r.detail;
      if(!detailMap[key]) detailMap[key] = {module:r.module, detail:r.detail, hours:0};
      detailMap[key].hours += r.hours;
    });
    var details = Object.keys(detailMap).map(function(k){ return detailMap[k]; });
    details.sort(function(a,b){ return b.hours - a.hours; });
    topDetails = details.slice(0, 5);

    var mods = Object.keys(modHours).sort(function(a,b){ return modHours[b]-modHours[a]; });
    var topMod = mods[0] || '-';
    var yms = activeYMs(rows);

    return {
      person: person, totalH: totalH, dailyH: dailyH, projH: projH,
      meetH: meetH, totalQty: totalQty, modHours: modHours,
      topMod: topMod, topDetails: topDetails, months: yms.length,
      avgMonthly: yms.length ? totalH / yms.length : 0
    };
  }

  // ★ v5.4 生成顾问亮点标签（返回对象数组，含关联服务信息）
  function getAdvisorHighlights(profile) {
    var hls = [];

    // ★ 第一优先：模块专精（基于 topMod 经 HR→报价对齐映射）— 这是最核心的信息，始终置顶
    if(profile.topMod && HR_TO_QUOTE[profile.topMod] && HR_TO_QUOTE[profile.topMod].length) {
      var qmods = HR_TO_QUOTE[profile.topMod];
      var primaryQ = qmods[0];
      var modTag = (QUOTE_LABEL[primaryQ] || profile.topMod) + '专精';
      if(!TAG_SERVICE_MAP[modTag]) TAG_SERVICE_MAP[modTag] = { modules: qmods.slice(), keywords: [], desc: profile.topMod + '方向专精', priority: 1 };
      var modColors = {'社保公积金管理':'#5470c6','薪酬福利与税务管理':'#91cc75','劳动关系与证件办理':'#fac858','招聘与培训开发':'#ee6666','职称等级':'#73c0de'};
      hls.push({ tag: modTag, color: modColors[QUOTE_LABEL[primaryQ]] || '#6366f1', icon: '🏆' });
    }

    // ★ 第二优先：业务能力标签（按数据特征生成）
    if(profile.projH > profile.totalH * 0.3) hls.push({ tag: '专案驱动型', color: '#8b5cf6', icon: '🎯' });
    if(profile.avgMonthly > 80) hls.push({ tag: '高产能顾问', color: '#f59e0b', icon: '⚡' });
    if(profile.totalQty > 500) hls.push({ tag: '高吞吐量', color: '#3b82f6', icon: '📦' });

    // ★ 第三优先：通用属性标签（辅助信息）
    if(Object.keys(profile.modHours).length >= 4) hls.push({ tag: '多面手', color: '#ec4899', icon: '🔧' });
    if(profile.months >= 12) hls.push({ tag: '全年稳定输出', color: '#10b981', icon: '📅' });
    if(profile.meetH > 20) hls.push({ tag: '会议协调能手', color: '#06b6d4', icon: '🤝' });

    // 保证至少1个
    if(hls.length === 0) hls.push({ tag: '稳健实干型', color: '#6b7280', icon: '💪' });

    // ★ 为每个标签计算关联的服务数量（基于该顾问实际工作模块过滤）
    hls.forEach(function(h){
      var matched = matchServicesByTags([h.tag], profile);
      h.serviceCount = matched.length;
      h.desc = (TAG_SERVICE_MAP[h.tag] && TAG_SERVICE_MAP[h.tag].desc) || '';
      h.priority = (TAG_SERVICE_MAP[h.tag] && TAG_SERVICE_MAP[h.tag].priority) || 9;
      // 取前3个关联服务名作为预览
      h.previewServices = matched.slice(0, 3).map(function(s){ return s.item; });
    });

    // ★ 按优先级排序（priority 小的排前面），同优先级按 serviceCount 多的排前
    hls.sort(function(a, b){
      if(a.priority !== b.priority) return a.priority - b.priority;
      return b.serviceCount - a.serviceCount;
    });

    // ★ 过滤掉匹配数为 0 的标签（0 项服务 = 该标签对此人无意义）
    hls = hls.filter(function(h){ return h.serviceCount > 0; });

    // ★ 去重：如果多个通用标签 serviceCount 相同且都是全部可承接数，只保留优先级最高的一个
    var maxCount = 0;
    hls.forEach(function(h){ if(h.serviceCount > maxCount) maxCount = h.serviceCount; });
    var seenGeneric = {};
    hls = hls.filter(function(h){
      // 专精和业务能力不过滤
      if(h.priority <= 2) return true;
      // 通用标签：如果已有相同 count 的通用标签则跳过
      var key = h.serviceCount + '_' + h.priority;
      if(seenGeneric[key]) return false;
      seenGeneric[key] = true;
      return true;
    });

    return hls.slice(0, 6);  // 最多显示6个标签
  }

  // ---------- KPI 卡片 ----------
  function kpiCard(cls, label, value, sub) {
    var c = el('div', 'kpi ' + (cls || ''));
    c.appendChild(el('div', 'kpi-label', label));
    c.appendChild(el('div', 'kpi-value', value));
    if (sub) c.appendChild(el('div', 'kpi-sub', sub));
    return c;
  }

  // ---------- 图表工具 ----------
  function chartBox(id, title, height) {
    var b = el('div', 'chart-box');
    b.appendChild(el('div', 'chart-title', title));
    var c = el('div', 'chart'); c.id = id;
    if(height) c.style.height = height + 'px';   // ★ v6.10 支持自定义高度（用于多人横向柱图）
    b.appendChild(c);
    return b;
  }

  function ensureChart(id) {
    var dom = document.getElementById(id);
    if (!dom) return null;
    if (charts[id]) { try { charts[id].dispose(); } catch(e){} delete charts[id]; }
    var rect = dom.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) { dom._pendingInit = true; return null; }
    try { charts[id] = echarts.init(dom); return charts[id]; }
    catch(e) { console.warn('echarts.init failed for', id, e.message); return null; }
  }

  function resizeAllCharts() {
    Object.keys(charts).forEach(function(k) { try { charts[k] && charts[k].resize(); } catch(e){} });
  }

  // ========== 图表 Option 工厂 ==========
  function stackedByModule(rows, yms) {
    var modules = META.modules.slice();
    var series = modules.map(function (m) {
      var data = yms.map(function (ym) {
        var s = 0; rows.forEach(function (r) { if (r.module === m && r.ym === ym) s += r.hours; });
        return Math.round(s * 10) / 10;
      });
      return { name: m, type: 'bar', stack: 't', data: data, itemStyle: { color: moduleColor(m) } };
    });
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { type: 'scroll', top: 0, textStyle: { fontSize: 11 } },
      grid: { left: 50, right: 16, top: 38, bottom: 28 },
      xAxis: { type: 'category', data: yms, axisLabel: { fontSize: 10, rotate: yms.length > 8 ? 35 : 0 } },
      yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
      series: series
    };
  }

  function pctOption(rows, yms) {
    var modules = META.modules.slice();
    var series = modules.map(function (m) {
      var data = yms.map(function (ym) {
        var s = 0; rows.forEach(function (r) { if (r.module === m && r.ym === ym) s += r.hours; });
        return Math.round(s * 10) / 10;
      });
      return { name: m, type: 'bar', stack: 't', data: data, itemStyle: { color: moduleColor(m) } };
    });
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: function (v) { return v + ' h'; } },
      legend: { type: 'scroll', top: 0, textStyle: { fontSize: 11 } },
      grid: { left: 50, right: 16, top: 38, bottom: 28 },
      xAxis: { type: 'category', data: yms, axisLabel: { fontSize: 10, rotate: yms.length > 8 ? 35 : 0 } },
      yAxis: { type: 'value', max: 100, axisLabel: { fontSize: 10, formatter: '{value}%' } },
      series: series
    };
  }

  function buOption(daily) {
    var bus = distinctSorted(daily, 'bu');
    var hours = bus.map(function (b) { var s = 0; daily.forEach(function (r) { if (r.bu === b) s += r.hours; }); return Math.round(s * 10) / 10; });
    var qty = bus.map(function (b) { var s = 0; daily.forEach(function (r) { if (r.bu === b) s += r.qty; }); return Math.round(s * 10) / 10; });
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } }, legend: { top: 0, textStyle: { fontSize: 11 } },
      grid: { left: 55, right: 50, top: 36, bottom: 28 },
      xAxis: { type: 'category', data: bus, axisLabel: { fontSize: 10, rotate: bus.length > 8 ? 35 : 0 } },
      yAxis: [{ type: 'value', name: '工时', axisLabel: { fontSize: 10 } }, { type: 'value', name: '数量', axisLabel: { fontSize: 10 } }],
      series: [{ name: '工时(h)', type: 'bar', data: hours, itemStyle: { color: DAILY_COLOR } }, { name: '数量', type: 'line', yAxisIndex: 1, data: qty, itemStyle: { color: PROJ_COLOR } }]
    };
  }

  function moduleCompareOption(daily, proj) {
    var modules = META.modules.slice();
    var dh = modules.map(function (m) { var s = 0; daily.forEach(function (r) { if (r.module === m) s += r.hours; }); return Math.round(s * 10) / 10; });
    var ph = modules.map(function (m) { var s = 0; proj.forEach(function (r) { if (r.module === m) s += r.hours; }); return Math.round(s * 10) / 10; });
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } }, legend: { top: 0, textStyle: { fontSize: 11 } },
      grid: { left: 55, right: 16, top: 36, bottom: 28 },
      xAxis: { type: 'category', data: modules, axisLabel: { fontSize: 10, rotate: 18 } },
      yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
      series: [{ name: '日常类', type: 'bar', data: dh, itemStyle: { color: DAILY_COLOR } }, { name: '专案类', type: 'bar', data: ph, itemStyle: { color: PROJ_COLOR } }]
    };
  }

  function monthCompareOption(daily, proj, isMeet) {
    var ymsD = activeYMs(daily), ymsP = activeYMs(proj);
    var all = {}; ymsD.concat(ymsP).forEach(function (y) { all[y] = 1; });
    var yms = Object.keys(all).sort();
    var dh = yms.map(function (ym) { var s = 0; daily.forEach(function (r) { if (r.ym === ym) s += r.hours; }); return Math.round(s * 10) / 10; });
    var ph = yms.map(function (ym) { var s = 0; proj.forEach(function (r) { if (r.ym === ym) s += r.hours; }); return Math.round(s * 10) / 10; });
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } }, legend: { top: 0, textStyle: { fontSize: 11 } },
      grid: { left: 55, right: 16, top: 36, bottom: 28 },
      xAxis: { type: 'category', data: yms, axisLabel: { fontSize: 10, rotate: yms.length > 8 ? 35 : 0 } },
      yAxis: { type: 'value', name: isMeet ? '会议工时' : '工时', axisLabel: { fontSize: 10 } },
      series: [{ name: '日常类', type: 'bar', stack: 't', data: dh, itemStyle: { color: DAILY_COLOR } }, { name: '专案类', type: 'bar', stack: 't', data: ph, itemStyle: { color: PROJ_COLOR } }]
    };
  }

  // ========== 渲染：总览 ==========
  function renderOverview() {
    var wrap = $('#page-overview'); wrap.innerHTML = '';
    var allRows = baseFilter({});
    var daily = allRows.filter(function (r) { return r.type === 'daily'; });
    var proj = allRows.filter(function (r) { return r.type === 'project'; });
    var dh = sumHours(daily), ph = sumHours(proj);
    var dMeet = meetingRows(daily), pMeet = meetingRows(proj);
    var total = dh + ph;
    var dPersons = distinctSorted(daily, 'person').length;
    var pPersons = distinctSorted(proj, 'person').length;

    var kpis = el('div', 'kpi-row');
    var kDaily = el('div', 'kpi-group daily');
    kDaily.appendChild(el('div', 'kpi-group-title', '日常类工作量'));
    kDaily.appendChild(kpiCard('daily', '日常总工时 (h)', fmt(dh), '处理时长合计'));
    kDaily.appendChild(kpiCard('daily', '日常平均月工时/人', fmt(dPersons ? dh / dPersons : 0), dPersons + ' 人参与'));
    kDaily.appendChild(kpiCard('daily', '日常会议时长 (h)', fmt(sumHours(dMeet)), dMeet.length + ' 次会议'));
    kDaily.appendChild(kpiCard('daily', '日常会议次数', dMeet.length + '', '含会议标记行'));
    kDaily.appendChild(kpiCard('daily', '日常工时占比', total ? (dh / total * 100).toFixed(1) + '%' : '0%', '占总工作量'));
    kpis.appendChild(kDaily);
    var kProj = el('div', 'kpi-group project');
    kProj.appendChild(el('div', 'kpi-group-title', '专案类工作量'));
    kProj.appendChild(kpiCard('project', '专案总工时 (h)', fmt(ph), '处理时长合计'));
    kProj.appendChild(kpiCard('project', '专案平均月工时/人', fmt(pPersons ? ph / pPersons : 0), pPersons + ' 人参与'));
    kProj.appendChild(kpiCard('project', '专案会议时长 (h)', fmt(sumHours(pMeet)), pMeet.length + ' 次会议'));
    kProj.appendChild(kpiCard('project', '专案会议次数', pMeet.length + '', '含会议标记行'));
    kProj.appendChild(kpiCard('project', '专案工时占比', total ? (ph / total * 100).toFixed(1) + '%' : '0%', '占总工作量'));
    kpis.appendChild(kProj);
    wrap.appendChild(kpis);
    wrap.appendChild(el('div', 'note', '说明：日常类 + 专案类 两类工时相加 = 该范围下 HR 完整工作量。会议指标取自含「会议ID」的记录。'));

    var grid = el('div', 'chart-grid');
    grid.appendChild(chartBox('ov_daily_month', '日常类每月工时对比（按模块堆叠）'));
    grid.appendChild(chartBox('ov_daily_month_pct', '日常类每月工时结构（100% 堆叠）'));
    grid.appendChild(chartBox('ov_proj_month_pct', '专案类每月工时结构（100% 堆叠）'));
    grid.appendChild(chartBox('ov_bu', '各 BU 工作量 & 工时对比（日常类）'));
    grid.appendChild(chartBox('ov_daily_meet', '日常类每月会议时长对比（按模块）'));
    grid.appendChild(chartBox('ov_proj_meet', '专案类每月会议时长对比（按模块）'));
    wrap.appendChild(grid);

    // 汇总区
    wrap.appendChild(el('div', 'section-title', '日常 & 专案类 总分析'));
    var sd = (state.type === 'project') ? [] : daily;
    var sp = (state.type === 'daily') ? [] : proj;
    var grid2 = el('div', 'chart-grid');
    grid2.appendChild(chartBox('ov_pie', '日常 & 专案 工时占比'));
    grid2.appendChild(chartBox('ov_module', '各模块 日常 vs 专案 工时对比'));
    grid2.appendChild(chartBox('ov_month', '每月 日常 vs 专案 工时对比'));
    grid2.appendChild(chartBox('ov_meet', '每月 日常 vs 专案 会议工时对比'));
    wrap.appendChild(grid2);

    var stats = el('div', 'stat-row');
    stats.appendChild(kpiCard('', '覆盖人数（合计）', distinctSorted(allRows, 'person').length + '', '日常 ' + dPersons + ' / 专案 ' + pPersons));
    stats.appendChild(kpiCard('', '覆盖月数', activeYMs(allRows).length + '', activeYMs(allRows)[0] + ' ~ ' + activeYMs(allRows)[activeYMs(allRows).length - 1]));
    stats.appendChild(kpiCard('', '活跃 BU 数（日常）', distinctSorted(daily, 'bu').length + '', '仅日常类含 BU'));
    stats.appendChild(kpiCard('', '总处理数量', fmt(sumQty(allRows), 0), '日常+专案合计'));
    wrap.appendChild(stats);

    // ★ 服务报价交叉分析区（仅可定价服务）
    wrap.appendChild(el('div', 'section-title', '💰 工作量 ↔ 可定价服务 交叉分析'));
    var svcCrossGrid = el('div', 'chart-grid');
    svcCrossGrid.appendChild(chartBox('ov_svc_value', '各模块工时对应服务报价价值'));
    svcCrossGrid.appendChild(chartBox('ov_svc_coverage', '可定价服务覆盖率'));
    svcCrossGrid.appendChild(chartBox('ov_svc_pie', '各服务模块报价占比'));
    // ★ v5.2 新增：计费模式分布（按人/按户/单次/项目/按件/按期）
    svcCrossGrid.appendChild(chartBox('ov_pricing_mode_dist', '计费模式分布（按收费单位分类）'));
    wrap.appendChild(svcCrossGrid);
    var svcKPIs = el('div', 'stat-row');
    var pricedSvc = QUOTE_SERVICES.filter(function(s){ return s.price != null && s.price !== ''; });
    svcKPIs.appendChild(kpiCard('', '可定价服务项', pricedSvc.length + ' 项', '共 ' + QUOTE_SERVICES.length + ' 项服务', '#e74c3c'));
    wrap.appendChild(svcKPIs);

    drawOverviewCharts(allRows, daily, proj, sd, sp, svcCrossGrid);
  }

  function drawOverviewCharts(allRows, daily, proj, sd, sp, svcCrossGrid) {
    var ymsD = activeYMs(daily), ymsP = activeYMs(proj);
    safeSetOption('ov_daily_month', stackedByModule(daily, ymsD));
    safeSetOption('ov_daily_month_pct', pctOption(daily, ymsD));
    safeSetOption('ov_proj_month_pct', pctOption(proj, ymsP));
    safeSetOption('ov_bu', buOption(daily));
    safeSetOption('ov_daily_meet', stackedByModule(meetingRows(daily), ymsD));
    safeSetOption('ov_proj_meet', stackedByModule(meetingRows(proj), ymsP));

    var pieData = [];
    if (sd.length) pieData.push({ name: '日常类', value: Math.round(sumHours(sd) * 10) / 10, itemStyle: { color: DAILY_COLOR } });
    if (sp.length) pieData.push({ name: '专案类', value: Math.round(sumHours(sp) * 10) / 10, itemStyle: { color: PROJ_COLOR } });
    safeSetOption('ov_pie', {
      tooltip: { trigger: 'item', formatter: '{b}: {c} h ({d}%)' }, legend: { bottom: 0 },
      series: [{ type: 'pie', radius: ['38%', '68%'], center: ['50%', '45%'], data: pieData, label: { formatter: '{b}\n{d}%' } }]
    });
    safeSetOption('ov_module', moduleCompareOption(sd, sp));
    safeSetOption('ov_month', monthCompareOption(sd, sp, false));
    safeSetOption('ov_meet', monthCompareOption(meetingRows(sd), meetingRows(sp), true));

    bindChartClick('ov_daily_month', 'daily');
    bindChartClick('ov_daily_month_pct', 'daily');
    bindChartClick('ov_proj_month_pct', 'project');
    bindChartClick('ov_module', function(p) { return p.seriesName === '专案类' ? 'project' : 'daily'; });

    drawSvcCrossCharts(allRows, svcCrossGrid);
  }

  function drawSvcCrossCharts(allRows, svcCrossGrid) {
    var modHours = {};
    allRows.forEach(function(r){ modHours[r.module] = (modHours[r.module]||0) + r.hours; });
    var mods = Object.keys(modHours).sort();
    var hData = mods.map(function(m){ return Math.round(modHours[m]*10)/10; });

    var quoteModMap = {
      '薪酬福利管理': ['社保公积金管理服务模块','薪酬福利与税务管理服务模块'],
      '劳动关系管理': ['劳动关系与证件办理服务模块'],
      '招聘与配置作业': ['招聘与培训开发服务模块'],
      '培训与开发': ['招聘与培训开发服务模块'],
      '人力资源规划': [], '绩效管理': []
    };
    var modQuoteVal = mods.map(function(m){
      var qms = quoteModMap[m] || [];
      var val = 0;
      QUOTE_SERVICES.forEach(function(s){
        if(qms.indexOf(s.module) >= 0 && s.price != null) val += Number(s.price)||0;
      });
      return Math.round(val);
    });

    safeSetOption('ov_svc_value', {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: function(p){
        if(!p.length) return '';
        var d = p[0];
        return mods[d.dataIndex] + '\n工时: ' + hData[d.dataIndex] + 'h\n报价: ¥' + fmt(modQuoteVal[d.dataIndex],0) + '\n👆 点击查看该模块服务详情';
      }},
      grid: { left: 55, right: 55, top: 36, bottom: 28 },
      xAxis: { type: 'category', data: mods, axisLabel: { fontSize: 10, rotate: 18 } },
      yAxis: [{ type: 'value', name: '工时(h)', axisLabel: { fontSize: 10 } }, { type: 'value', name: '报价(¥)', axisLabel: { fontSize: 10 } }],
      series: [
        { name: '工时(h)', type: 'bar', data: hData, itemStyle: { color: function(p){ return moduleColor(mods[p.dataIndex]); } } },
        { name: '报价(¥)', type: 'line', yAxisIndex: 1, data: modQuoteVal, itemStyle: { color: '#e74c3c' }, lineStyle: { width: 3 } }
      ]
    });

    // ★ 点击模块柱子跳转到服务展示页（预筛选该模块）
    var svcValueChart = charts['ov_svc_value'];
    if(svcValueChart) {
      svcValueChart.on('click', function(p){
        if(p.componentType !== 'series') return;
        var modName = mods[p.dataIndex];
        // 映射到报价单模块
        var qms = quoteModMap[modName] || [];
        if(qms.length > 0) {
          state.svcModule = qms[0];
        } else {
          state.svcModule = 'all';
        }
        state.svcMode = 'priced';
        switchPage('services');
      });
    }

    // ★ 仅展示有报价的服务覆盖率
    var modCoverage = {};
    QUOTE_SERVICES.forEach(function(s){
      if(s.price == null || s.price === '') return;  // ★ 只统计有报价的
      if(!modCoverage[s.module]) modCoverage[s.module] = { total: 0, priced: 0 };
      modCoverage[s.module].total++;
      modCoverage[s.module].priced++;
    });
    var covMods = Object.keys(modCoverage).sort();
    safeSetOption('ov_svc_coverage', {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: function(p){
        if(!p.length) return '';
        var d = p[0], m = covMods[d.dataIndex], c = modCoverage[m];
        return m.replace(/服务模块$/,'') + '\n可定价: ' + c.priced + '项\n总计: ' + c.total + '项\n👆 点击查看该模块服务';
      }},
      legend: { top: 0, textStyle: { fontSize: 11 } },
      grid: { left: 55, right: 16, top: 36, bottom: 50 },
      xAxis: { type: 'category', data: covMods.map(function(m){ return m.replace(/服务模块$/,''); }), axisLabel: { fontSize: 10, rotate: 20 } },
      yAxis: { type: 'value', axisLabel: { fontSize: 10, formatter: '{value} 项' } },
      series: [{ name: '可定价', type: 'bar', data: covMods.map(function(m){ return modCoverage[m].priced; }), itemStyle: { color: '#f39c12' } }]
    });
    // ★ 覆盖率图点击跳转
    var covChart = charts['ov_svc_coverage'];
    if(covChart) {
      covChart.on('click', function(p){
        if(p.componentType !== 'series') return;
        state.svcModule = covMods[p.dataIndex];
        state.svcMode = 'priced';
        switchPage('services');
      });
    }

    var pieData = covMods.map(function(m){
      var val = 0;
      QUOTE_SERVICES.forEach(function(s){ if(s.module === m && s.price != null) val += Number(s.price)||0; });
      return { name: m.replace(/服务模块$/,''), value: Math.round(val) };
    }).filter(function(d){ return d.value > 0; });

    safeSetOption('ov_svc_pie', {
      tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)\n👆 点击查看服务详情' }, legend: { bottom: 0, textStyle: { fontSize: 10 } },
      series: [{ type: 'pie', radius: ['35%', '65%'], center: ['50%', '48%'], data: pieData, label: { formatter: '{b}\n¥{c}' },
        itemStyle: { color: function(p){ return SERVICE_COLORS[p.dataIndex % SERVICE_COLORS.length]; } } }]
    });
    // ★ 饼图点击跳转
    var pieChart = charts['ov_svc_pie'];
    if(pieChart) {
      pieChart.on('click', function(p){
        if(p.componentType !== 'series') return;
        state.svcModule = covMods[p.dataIndex];
        state.svcMode = 'priced';
        switchPage('services');
      });
    }

    // ★ v5.2 计费模式分布图（横向柱状：按收费单位分类统计服务数量）
    var modeGroups = {};
    var modeServices = {}; // ★ 存储每个模式下的服务列表（用于点击详情）
    QUOTE_SERVICES.forEach(function(s){
      if(s.price == null || s.price === '') return;
      var pt = getPricingType(s);
      var key = pt.icon + ' ' + pt.label;
      if(!modeGroups[key]) { modeGroups[key] = { label: key, count: 0, totalVal: 0, color: pt.color }; modeServices[key] = []; }
      modeGroups[key].count++;
      modeGroups[key].totalVal += Number(s.price) || 0;
      modeServices[key].push(s);
    });
    var modeArr = Object.keys(modeGroups).map(function(k){ return modeGroups[k]; });
    safeSetOption('ov_pricing_mode_dist', {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: function(p){
        if(!p.length) return '';
        var d = p[0];
        var mg = modeArr[d.dataIndex];
        return mg.label + '\n服务数: ' + mg.count + ' 项\n报价合计: ¥' + fmt(mg.totalVal,0) + '\n👆 点击查看详情';
      }},
      grid: { left: 100, right: 30, top: 16, bottom: 20 },
      xAxis: { type: 'value', axisLabel: { fontSize: 10, formatter: '{value} 项' } },
      yAxis: { type: 'category', data: modeArr.map(function(m){ return m.label; }), axisLabel: { fontSize: 11 } },
      series: [{
        type: 'bar',
        data: modeArr.map(function(m){ return { value: m.count, itemStyle: { color: m.color } }; }),
        label: { show: true, position: 'right', fontSize: 11, formatter: '{c} 项' }
      }]
    });

    // ★ 点击柱子显示该计费模式下的服务详情（延迟绑定确保图表已初始化）
    // 先无条件创建详情面板容器
    var detailBox = el('div', 'pricing-mode-detail');
    detailBox.style.display = 'none';
    svcCrossGrid.appendChild(detailBox);

    // 延迟绑定 click 事件（确保 echarts.init 已完成）
    (function bindPmClick(){
      var pmChart = charts['ov_pricing_mode_dist'];
      if(pmChart) {
        pmChart.on('click', function(p){
          if(p.componentType !== 'series') return;
          var mg = modeArr[p.dataIndex];
          var key = mg.label;
          var svcs = modeServices[key] || [];
          // 渲染详情
          detailBox.style.display = '';
          detailBox.innerHTML = '<div class="pmd-head" style="padding:8px 12px;background:' + mg.color + '22;color:' + mg.color + ';border-radius:6px;margin-bottom:8px;font-weight:600;font-size:13px;">▸ ' + key + ' — ' + svcs.length + ' 项服务 <span style="float:right;cursor:pointer;font-weight:normal;" onclick="this.closest(\'.pricing-mode-detail\').style.display=\'none\'">✕ 关闭</span></div>';
          var list = el('div', 'pmd-list');
          svcs.forEach(function(s){
            var row = el('div', 'pmd-item');
            row.innerHTML = '<span class="pmd-item-name">' + s.item + '</span>' +
              '<span class="pmd-item-price">' + formatPriceWithUnit(s) + '</span>' +
              '<span class="pmd-item-mod">' + (s.module||'').replace(/服务模块$/,'') + '</span>';
            list.appendChild(row);
          });
          detailBox.appendChild(list);
          // 滚动到可见区域
          setTimeout(function(){ detailBox.scrollIntoView({behavior:'smooth',block:'nearest'}); }, 50);
        });
      } else {
        // 图表还未初始化，稍后重试
        setTimeout(bindPmClick, 100);
      }
    })();
  }

  function safeSetOption(id, option) { var c = ensureChart(id); if (c) { c.setOption(option); } }

  function bindChartClick(id, getPage) {
    var c = charts[id];
    if (!c) return;
    c.on('click', function (p) {
      if (p.componentType === 'series') {
        var target = typeof getPage === 'function' ? getPage(p) : getPage;
        jumpToDetail(target, p.name);
      }
    });
  }

  // ========== ★ 多目标返回按钮 ==========
  function renderBackBtn(targets) {
    // targets: [{label:'返回总览', page:'overview'}, ...]
    // ★ v6.3 如果 targets 中有 __prev__ 占位，替换为实际的上一页
    var hasPrev = false;
    targets = targets.map(function(t){
      if(t.page === '__prev__'){ hasPrev = true; return {label:'← 返回上一步', page: state.prevPage || 'landing'}; }
      return t;
    });
    if (targets.length === 1 && !hasPrev) {
      var btn = el('button', 'back-btn', '← ' + targets[0].label);
      btn.addEventListener('click', function () { switchPage(targets[0].page); });
      return btn;
    }
    // 多目标 → 下拉式返回按钮
    var wrapper = el('div', 'back-nav');
    var btn = el('button', 'back-btn', '← ' + targets[0].label + ' ▾');
    var menu = el('div', 'back-menu');
    targets.forEach(function(t){
      var mi = el('div', 'back-menu-item', t.label);
      mi.addEventListener('click', function(){ switchPage(t.page); menu.classList.remove('open'); });
      menu.appendChild(mi);
    });
    btn.addEventListener('click', function(e){
      e.stopPropagation(); menu.classList.toggle('open');
    });
    document.addEventListener('click', function(){ menu.classList.remove('open'); });
    wrapper.appendChild(btn);
    wrapper.appendChild(menu);
    return wrapper;
  }

  // ========== 渲染：明细页 ==========
  function renderDetail(typeKey) {
    var isDaily = typeKey === 'daily';
    var wrap = isDaily ? $('#page-daily') : $('#page-project');
    wrap.innerHTML = '';

    // ★ 多目标返回键（三页完整导航）
    var fromPage = state.page;
    wrap.appendChild(renderBackBtn([
      {label:'返回总览', page:'overview'},
      {label:'介绍页', page:'landing'},
      {label:'服务展示', page:'services'},
      {label:'顾问页', page:'advisor'}
    ]));

    var rows = baseFilter({ type: typeKey });
    var h = sumHours(rows);
    var meet = meetingRows(rows);

    var kpis = el('div', 'kpi-row');
    var g = el('div', 'kpi-group ' + (isDaily ? 'daily' : 'project'));
    g.appendChild(el('div', 'kpi-group-title', isDaily ? '日常类工时' : '专案类工时'));
    g.appendChild(kpiCard(isDaily ? 'daily' : 'project', (isDaily ? '日常' : '专案') + '总工时 (h)', fmt(h), '处理时长合计'));
    g.appendChild(kpiCard(isDaily ? 'daily' : 'project', (isDaily ? '日常' : '专案') + '会议时长 (h)', fmt(sumHours(meet)), meet.length + ' 次会议'));
    g.appendChild(kpiCard(isDaily ? 'daily' : 'project', (isDaily ? '日常' : '专案') + '会议次数', meet.length + '', '含会议标记行'));
    g.appendChild(kpiCard('', '处理数量合计', fmt(sumQty(rows), 0), '日常+专案'));
    g.appendChild(kpiCard('', '参与人数', distinctSorted(rows, 'person').length + '', '去重'));
    kpis.appendChild(g);
    wrap.appendChild(kpis);

    var grid = el('div', 'chart-grid');
    grid.appendChild(chartBox(isDaily ? 'd_month_person' : 'p_month_person', '每月工时对比（按人员 100% 堆叠）'));
    grid.appendChild(chartBox(isDaily ? 'd_meet_person' : 'p_meet_person', '每月会议时长对比（按人员 100% 堆叠）'));
    grid.appendChild(chartBox(isDaily ? 'd_person_bar' : 'p_person_bar', '各 HR ' + (isDaily ? '日常' : '专案') + '工时对比'));
    wrap.appendChild(grid);

    wrap.appendChild(el('div', 'section-title', (isDaily ? '日常类' : '专案类') + ' 工作细项明细'));
    var tblWrap = el('div', 'table-wrap'); tblWrap.id = isDaily ? 'd_table' : 'p_table';
    wrap.appendChild(tblWrap);

    // ★ v5.4 可承接服务 CTA（根据当前筛选人员显示）
    var currentPersons = Array.from(state.persons || new Set());
    if(currentPersons.length === 0) currentPersons = META.persons;  // 未选人时显示全部
    var ctaArea = el('div', 'detail-cta-area');
    if(currentPersons.length === 1) {
      // 单人模式：直接跳到该顾问页或按人员过滤服务
      var p = currentPersons[0];
      // ★ v6.5 去除CTA按钮图标前缀 | ★ v6.10 改用详情页专用样式（原 land-btn-primary 白底白字在浅色页不可见）
      var prof = getAdvisorProfile(p);
      var matchedSvc = matchServicesByTags([]);
      ctaArea.innerHTML = '<button class="land-btn detail-cta-btn detail-cta-primary" style="width:100%;max-width:400px;margin:16px auto;">' +
        '查看 ' + p.split(' ')[0] + ' 可承接的服务 (' + matchedSvc.length + '项) →</button>';
      ctaArea.querySelector('.detail-cta-btn').addEventListener('click', function(){
        state.advisorPerson = p;
        state.svcTagFilters = [];  // 清空标签，用人员维度
        state.svcModule = 'all';  // 重置模块筛选避免残留
        switchPage('services');
      });
    } else {
      // 多人或全部模式
      // ★ v6.10 改用详情页专用描边样式（原 land-btn-secondary 是深色Hero专用：白字+半透明白底，在白底页面上完全不可见）
      ctaArea.innerHTML = '<button class="land-btn detail-cta-btn detail-cta-outline" style="width:100%;max-width:400px;margin:16px auto;">' +
        '📋 浏览可定价服务目录 (' + (QUOTE_SERVICES.filter(function(s){return s.price!=null&&s.price!=='';}).length) + '项) →</button>';
      ctaArea.querySelector('.detail-cta-btn').addEventListener('click', function(){
        state.svcTagFilters = [];
        state.svcModule = 'all';  // 重置模块筛选避免残留
        switchPage('services');
      });
    }
    wrap.appendChild(ctaArea);

    drawDetailCharts(typeKey, rows);
    renderDetailTable(typeKey, rows);
  }

  function drawDetailCharts(typeKey, rows) {
    var isDaily = typeKey === 'daily';
    var persons = distinctSorted(rows, 'person');
    // ★ v6.10 不再截断前12人，显示全部人员（配合图例单选，用户点谁看谁）
    var showPersons = persons;
    var yms = activeYMs(rows);

    var monthData = showPersons.map(function (p) {
      var data = yms.map(function (ym) { var s = 0; rows.forEach(function (r) { if (r.person === p && r.ym === ym) s += r.hours; }); return Math.round(s * 10) / 10; });
      return { name: p, type: 'bar', stack: 't', data: data, itemStyle: { color: PERSON_PALETTE[persons.indexOf(p) % PERSON_PALETTE.length] } };
    });
    // ★ v6.10 图例改为单选模式：点击某人 → 只显示该人数据；再点一次恢复全部
    //   原为 ECharts 默认 multiple 模式（点击 = 隐藏该人），与用户直觉相反
    safeSetOption(isDaily ? 'd_month_person' : 'p_month_person', {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { type: 'scroll', top: 0, textStyle: { fontSize: 10 }, selectedMode: 'single' },
      grid: { left: 50, right: 16, top: 28, bottom: 28 },
      xAxis: { type: 'category', data: yms, axisLabel: { fontSize: 10, rotate: yms.length > 8 ? 35 : 0 } },
      yAxis: { type: 'value', axisLabel: { fontSize: 10 } }, series: monthData
    });

    var meetRows = meetingRows(rows);
    var meetData = showPersons.map(function (p) {
      var data = yms.map(function (ym) { var s = 0; meetRows.forEach(function (r) { if (r.person === p && r.ym === ym) s += r.hours; }); return Math.round(s * 10) / 10; });
      return { name: p, type: 'bar', stack: 't', data: data, itemStyle: { color: PERSON_PALETTE[persons.indexOf(p) % PERSON_PALETTE.length] } };
    });
    safeSetOption(isDaily ? 'd_meet_person' : 'p_meet_person', {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { type: 'scroll', top: 0, textStyle: { fontSize: 10 }, selectedMode: 'single' },
      grid: { left: 50, right: 16, top: 28, bottom: 28 },
      xAxis: { type: 'category', data: yms, axisLabel: { fontSize: 10, rotate: yms.length > 8 ? 35 : 0 } },
      yAxis: { type: 'value', axisLabel: { fontSize: 10 } }, series: meetData
    });

    var ph = persons.map(function (p) { var s = 0; rows.forEach(function (r) { if (r.person === p) s += r.hours; }); return { name: p, value: Math.round(s * 10) / 10 }; }).sort(function (a, b) { return a.value - b.value; });
    // ★ v6.10 横向柱图：按人数动态撑高容器，确保全部人员的人名标签都能显示
    //   根因：容器固定 280px，22人时 ECharts 类目轴自动隔行隐藏标签（axisLabel.interval auto），
    //         导致看起来"没显示所有人"（实际柱子都在，只是名字被藏了一半）
    var barId = isDaily ? 'd_person_bar' : 'p_person_bar';
    var barDom = document.getElementById(barId);
    if (barDom) barDom.style.height = Math.max(280, ph.length * 28 + 60) + 'px';
    safeSetOption(barId, {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: function (v) { return v + ' h'; } },
      grid: { left: 110, right: 55, top: 16, bottom: 20 },
      xAxis: { type: 'value', axisLabel: { fontSize: 10 } },
      yAxis: { type: 'category', data: ph.map(function (x) { return x.name; }), axisLabel: { fontSize: 11, interval: 0 } },
      series: [{ type: 'bar', data: ph.map(function (x) { return x.value; }), itemStyle: { color: isDaily ? DAILY_COLOR : PROJ_COLOR }, label: { show: true, position: 'right', fontSize: 10, formatter: '{c}' } }]
    });
  }

  function renderDetailTable(typeKey, rows) {
    var isDaily = typeKey === 'daily';
    var wrap = document.getElementById(isDaily ? 'd_table' : 'p_table'); if (!wrap) return;
    var map = {};
    rows.forEach(function (r) {
      var key = r.module + '||' + r.workitem + '||' + r.detail;
      if (!map[key]) map[key] = { module: r.module, workitem: r.workitem, detail: r.detail, hours: 0, qty: 0, persons: {} };
      map[key].hours += r.hours; map[key].qty += r.qty; map[key].persons[r.person] = (map[key].persons[r.person] || 0) + 1;
    });
    var arr = Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.hours - a.hours; });
    var search = isDaily ? state.dailyDetailSearch : state.projDetailSearch;
    if (search) { var q = search.toLowerCase(); arr = arr.filter(function (x) { return (x.module + x.workitem + x.detail).toLowerCase().indexOf(q) >= 0; }); }

    // ★ v6.10 关键修复：工具栏只创建一次，搜索时仅重建表格区域
    //   原实现每次 input 都 wrap.innerHTML='' 重建整个容器，导致输入框被销毁 → 焦点丢失 → 无法打字
    var searchBox = wrap.querySelector('.table-toolbar');
    var tableHost = wrap.querySelector('.detail-table-host');
    if (!searchBox || !tableHost) {
      wrap.innerHTML = '';
      searchBox = el('div', 'table-toolbar');
      var input = el('input', 'table-search'); input.placeholder = '搜索 模块 / 项目 / 细项…'; input.value = search;
      input.addEventListener('input', function () {
        if (isDaily) state.dailyDetailSearch = input.value; else state.projDetailSearch = input.value;
        state.d_page = 0; state.p_page = 0;              // 搜索变更回到第1页
        renderDetailTable(typeKey, rows);                // 工具栏不会被销毁，焦点保留
      });
      searchBox.appendChild(input);
      searchBox.appendChild(el('span', 'table-count', '共 ' + arr.length + ' 个细项'));
      wrap.appendChild(searchBox);
      tableHost = el('div', 'detail-table-host');
      wrap.appendChild(tableHost);
    } else {
      var cntEl = searchBox.querySelector('.table-count');
      if (cntEl) cntEl.textContent = '共 ' + arr.length + ' 个细项';
      var curInput = searchBox.querySelector('.table-search');
      if (curInput && curInput.value !== (search || '')) curInput.value = search || '';
    }
    tableHost.innerHTML = '';

    var table = el('table', 'data-table'); var head = el('tr');
    ['HR模块', isDaily ? 'HR工作项目' : 'HR相关专案', '工作细项', '处理时长(h)', '处理数量', '主要负责人员'].forEach(function (h) { head.appendChild(el('th', null, h)); });
    table.appendChild(head);
    var PAGE = 50; var pageKey = isDaily ? 'd_page' : 'p_page';
    if (state[pageKey] == null) state[pageKey] = 0;
    var totalPages = Math.max(1, Math.ceil(arr.length / PAGE)); if (state[pageKey] >= totalPages) state[pageKey] = totalPages - 1;
    var slice = arr.slice(state[pageKey] * PAGE, state[pageKey] * PAGE + PAGE);
    slice.forEach(function (x) {
      var topPerson = Object.keys(x.persons).sort(function (a, b) { return x.persons[b] - x.persons[a]; })[0] || '-';
      var tr = el('tr');
      tr.appendChild(el('td', null, x.module)); tr.appendChild(el('td', null, x.workitem)); tr.appendChild(el('td', null, x.detail));
      tr.appendChild(el('td', 'num', fmt(x.hours))); tr.appendChild(el('td', 'num', fmt(x.qty, 0))); tr.appendChild(el('td', null, topPerson));
      tr.style.cursor = 'pointer'; tr.addEventListener('click', function () { state.detail = x.detail; syncDetailFilters(); renderDetail(typeKey); });
      table.appendChild(tr);
    });
    tableHost.appendChild(table);
    var pager = el('div', 'pager');
    var prev = el('button', 'pg-btn', '上一页'); prev.disabled = state[pageKey] === 0; prev.addEventListener('click', function () { state[pageKey]--; renderDetailTable(typeKey, rows); });
    var next = el('button', 'pg-btn', '下一页'); next.disabled = state[pageKey] >= totalPages - 1; next.addEventListener('click', function () { state[pageKey]++; renderDetailTable(typeKey, rows); });
    pager.appendChild(prev); pager.appendChild(el('span', 'pg-info', '第 ' + (state[pageKey] + 1) + ' / ' + totalPages + ' 页')); pager.appendChild(next); tableHost.appendChild(pager);
  }

  // ========== 渲染：服务展示页（★ v5 重构：去掉亮点卡，突出服务选择）==========
  function renderServices() {
    var wrap = $('#page-services'); wrap.innerHTML = '';

    // ★ 多目标返回键（含返回上一步 + 三页完整导航）
    wrap.appendChild(renderBackBtn([
      {label:'← 返回上一步', page:'__prev__'},
      {label:'介绍页', page:'landing'},
      {label:'服务展示', page:'services'},
      {label:'顾问页', page:'advisor'}
    ]));

    // 顶部 Hero
    var hero = el('div', 'svc-hero');
    hero.innerHTML = '<div class="svc-hero-inner"><h2>HR 共享服务中心 · 服务产品目录</h2><p>专业 · 合规 · 高效 — 一站式 HR 服务解决方案</p></div>';
    wrap.appendChild(hero);

    // ★ v6.4 当前顾问指示条（从顾问页跳转过来时显示）
    if(state.advisorPerson) {
      var advBar = el('div', 'svc-advisor-bar');
      var advIcon = getPersonIcon(state.advisorPerson);
      var curExpert = getExpertInfo(state.advisorPerson);
      advBar.innerHTML = '<span class="svc-advisor-bar-icon">' + advIcon.icon + '</span>' +
        '<span class="svc-advisor-bar-text">' + (curExpert ? '当前专家' : '当前顾问') + '：<b>' + state.advisorPerson + '</b> (' +
          (curExpert ? (curExpert.role + ' · ' + curExpert.note) : personRoleLabel(state.advisorPerson)) + ')</span>' +
        '<button class="svc-advisor-bar-clear" id="svcAdvClear">✕ 切换顾问</button>';
      wrap.appendChild(advBar);
      // 延迟绑定（因为元素刚插入DOM）
      setTimeout(function(){
        var clr = document.getElementById('svcAdvClear');
        if(clr) clr.addEventListener('click', function(){ state.advisorPerson = ''; renderServices(); });
      }, 0);
    }

    // ★ v6.6 推荐顾问区（从介绍页点选模块过来时，显示该模块的推荐顾问）
    if(state.svcModule && state.svcModule !== 'all') {
      var recAdvisors = getRecommendedAdvisorsForModule(state.svcModule);
      if(recAdvisors.length > 0) {
        var recSec = el('div', 'svc-rec-advisor-section');
        var modLabel = QUOTE_LABEL[state.svcModule] || state.svcModule.replace('服务模块','');
        // ★ v7.0.1 卡片专精标签必须与上方模块标题严格对应
        //   （原用 personRoleLabel = 个人全局专精，与模块无关联 → 出现「薪酬福利与税务管理」模块下全都写「行政SDC专精」）
        var modSpecLabel = modLabel + '专精';
        recSec.innerHTML = '<div class="svc-rec-title">💡 「' + modLabel + '」推荐顾问 — 基于实际工时专精匹配</div>';
        var recGrid = el('div', 'svc-rec-grid');
        recAdvisors.forEach(function(ra){
          var av = AVATAR_MAP[ra.person] || { bg: '#999' };
          var raIcon = getPersonIcon(ra.person);
          var card = el('div', 'svc-rec-card');
          card.style.borderLeftColor = av.bg || '#999';
          card.innerHTML =
            '<div class="svc-rec-name">' + ra.person + '</div>' +
            '<div class="svc-rec-role">' + modSpecLabel + ' · ' + fmt(ra.modHours,1) + 'h</div>' +
            '<div class="svc-rec-desc">在该方向投入工时最多，可承接 <b>' + ra.matchCount + '</b> 项相关服务</div>' +
            '<div class="svc-rec-cta">查看详细介绍 →</div>';
          card.addEventListener('click', function(){
            state.advisorPerson = ra.person;
            switchPage('advisor');
          });
          recGrid.appendChild(card);
        });
        recSec.appendChild(recGrid); wrap.appendChild(recSec);
      }
    }

    // ★ v7.0 专家团队区（SDC 共享中心专家 · 匹配所有业务 / 专案专家 · 价格另算）
    var expSec = el('div', 'svc-expert-section');
    expSec.appendChild(el('div', 'svc-expert-title', '🏢 专家团队 — SDC 共享中心 & 专案专家'));
    var expGrid = el('div', 'svc-expert-grid');
    EXPERT_TEAM.forEach(function (ex) {
      var card = el('div', 'svc-expert-card svc-expert-card-' + (ex.scope === 'all' ? 'sdc' : 'proj'));
      card.style.borderLeftColor = ex.color;
      card.setAttribute('data-expert', ex.name);
      card.innerHTML =
        '<div class="svc-expert-badge" style="background:' + ex.color + '1a;color:' + ex.color + ';border-color:' + ex.color + '66">' + ex.tag + '</div>' +
        '<div class="svc-expert-name">' + ex.icon + ' ' + ex.name + '</div>' +
        '<div class="svc-expert-role">' + ex.role + '</div>' +
        '<div class="svc-expert-note">' + ex.note + '</div>' +
        '<div class="svc-expert-cta">' + (ex.scope === 'all' ? '查看全部可承接服务 →' : '查看专案服务说明 →') + '</div>';
      card.addEventListener('click', function () {
        state.advisorPerson = ex.name;
        state.svcModule = 'all';           // 专家口径独立，清掉模块/标签残留
        state.svcTagFilters = [];
        switchPage('services');
      });
      expGrid.appendChild(card);
    });
    expSec.appendChild(expGrid);
    wrap.appendChild(expSec);

    // ★ 接单 HR 选择区（点击名字跳转顾问介绍页）
    var hrPick = el('div', 'hr-pick-section');
    hrPick.innerHTML = '<div class="hr-pick-label">👤 请选择你的顾问（点击查看详细介绍与服务承接能力）</div>';
    var hrPickGrid = el('div', 'hr-pick-grid');
    META.persons.forEach(function (p) {
      var av = AVATAR_MAP[p] || { bg: '#999' };
      // ★ v6.5 去除接单HR按钮图标前缀，仅显示全名
      var isActive = (state.svcHR === p || state.advisorPerson === p);
      var btn = el('button', 'hr-pick-btn' + (isActive ? ' active' : ''), p);
      btn.style.borderColor = isActive ? av.bg : '';
      btn.addEventListener('click', function () {
        state.advisorPerson = p;
        switchPage('advisor');
      });
      hrPickGrid.appendChild(btn);
    });
    hrPick.appendChild(hrPickGrid);
    wrap.appendChild(hrPick);

    // ★ 服务选择 & 自动计费区（提升到前面）
    var calcSec = el('div', 'svc-calc-section');
    calcSec.innerHTML = '<div class="svc-calc-title">🛒 服务选择计费（勾选服务后自动加总费用）</div>';

    // ★ v5.2 计费模式说明区（解释内部工时 vs 外部计费单位的区别）
    var legendBox = el('div', 'pricing-legend-box');
    legendBox.innerHTML =
      '<div class="legend-title">💡 计费模式说明 — 内部工时投入 ≠ 外部收费单位</div>' +
      '<div class="legend-body">' +
        '<div class="legend-example">' +
          '<span class="legend-icon">⚠️</span>' +
          '<span class="legend-text"><b>举例：</b>「算薪」内部做一次可能花费 40h，但对外报价是 <b>¥20/人/月</b>——按每个员工每月收取。数量框填写的「人数」即计费基数。</span>' +
        '</div>' +
        '<div class="legend-modes">' +
          '<span class="lm-tag" style="background:#ee666620;border-color:#ee6666;color:#ee6666">👥 按人头</span> 按每人/每次/每月收' +
          '<span class="lm-tag" style="background:#91cc7520;border-color:#91cc75;color:#91cc75">🏠 按户</span> 按每户/每年收' +
          '<span class="lm-tag" style="background:#5470c620;border-color:#5470c6;color:#5470c6">🎫 单次</span> 按每场次/每次收' +
          '<span class="lm-tag" style="background:#f59e0b20;border-color:#f59e0b;color:#f59e0b">📦 项目</span> 按整个项目收' +
          '<span class="lm-tag" style="background:#73c0de20;border-color:#73c0de;color:#73c0de">📄 按件</span> 按每份/每项收' +
        '</div>' +
      '</div>';
    calcSec.appendChild(legendBox);

    // ★ 只显示有报价的服务（v5.6：如果有 advisorPerson，只显示该顾问可承接的服务）
    // ★ v5.7：如果还有标签筛选，进一步按标签匹配结果过滤（确保计费区数量=匹配数）
    // ★ v7.0 模块优先：一旦用户在介绍页/图表点选了具体服务模块，就以「模块」为唯一口径，
    //   不再叠加「顾问能力 ∩ 模块」的交集 —— 旧逻辑里顾问专精与所选模块不一致时交集为空，
    //   会出现「选了模块 → 计费区一个服务都没有」的问题。
    var moduleLocked = !!(state.svcModule && state.svcModule !== 'all');
    var isAllExpert = state.advisorPerson ? isAllScopeExpert(state.advisorPerson) : false;   // SDC 专家：匹配所有业务
    var isProjExpert = state.advisorPerson ? isProjectExpert(state.advisorPerson) : false;   // 专案专家：价格另算
    var advProf = state.advisorPerson ? getAdvisorProfile(state.advisorPerson) : null;
    var pricedServices = QUOTE_SERVICES.filter(function(s){ return s.price != null && s.price !== ''; });
    if(advProf && !moduleLocked && !isAllExpert && !isProjExpert) {
      var advCapable = matchServicesByTags([], advProf);  // 通用标签+profile = 该人工作范围内全部服务
      pricedServices = pricedServices.filter(function(s){ return advCapable.indexOf(s) >= 0; });
    }
    // ★ v5.7 关键修复：有标签筛选时，计费区只保留标签匹配的服务（模块优先时标签让位）
    if(!moduleLocked && state.svcTagFilters && state.svcTagFilters.length > 0) {
      var tagMatched = matchServicesByTags(state.svcTagFilters, advProf);
      pricedServices = pricedServices.filter(function(s){ return tagMatched.indexOf(s) >= 0; });
    }
    // ★ v6.0：从介绍页/详情页点选模块后，计费区也只显示该模块的服务
    if(moduleLocked) {
      pricedServices = pricedServices.filter(function(s){ return s.module === state.svcModule; });
    }
    // ★ v6.1：计费区搜索筛选
    var calcFilterBar = el('div', 'svc-calc-filter-bar');
    var calcSearchInput = el('input', 'table-search svc-calc-search');
    calcSearchInput.placeholder = '🔍 搜索计费项名称…';
    calcSearchInput.style.width = '220px';
    calcSearchInput.value = state.calcSearch || '';
    // 计费模式快捷筛选（按 getPricingType 的 type 分组）
    var calcPricingSel = el('select', 'filter-select svc-calc-pricing-sel');
    var cpAll = el('option'); cpAll.value = ''; cpAll.textContent = '全部计费模式'; calcPricingSel.appendChild(cpAll);
    calcPricingSel.appendChild(opt('_person', '👥 按人头'));
    calcPricingSel.appendChild(opt('_house', '🏠 按户'));
    calcPricingSel.appendChild(opt('_once', '🎫 单次'));
    calcPricingSel.appendChild(opt('project', '📦 项目'));
    calcPricingSel.appendChild(opt('_item', '📄 按件'));
    calcPricingSel.value = state.calcPricingFilter || '';
    // ★ v6.11 计费内容宿主：筛选变化时只重建这里
    //   （旧写法调用 renderServices() 会连筛选框一起销毁 → 焦点丢失，只能输入1个字符）
    var calcBodyHost = el('div', 'svc-calc-body-host');
    function refreshCalcArea(){
      state.calcSearch = calcSearchInput.value;
      state.calcPricingFilter = calcPricingSel.value;
      renderCalcBody();          // 只刷新内容区，筛选栏 DOM 原地保留
    }
    calcSearchInput.addEventListener('input', refreshCalcArea);
    calcPricingSel.addEventListener('change', refreshCalcArea);
    calcFilterBar.appendChild(calcSearchInput);
    calcFilterBar.appendChild(el('span', null, '  '));
    calcFilterBar.appendChild(el('label', null, '计费模式：'));
    calcFilterBar.appendChild(calcPricingSel);
    // ★ v6.4 取消筛选按钮（v6.9 重写：事件委托，不依赖闭包DOM引用）
    var calcClearBtn = el('button', 'svc-calc-clear', '✕ 取消筛选');
    calcClearBtn.type = 'button';
    calcClearBtn.setAttribute('data-action', 'clear-calc-filter');
    calcClearBtn.style.marginLeft = '8px';
    calcClearBtn.style.fontSize = '13px';
    calcClearBtn.style.padding = '6px 16px';
    calcClearBtn.style.cursor = 'pointer';
    calcClearBtn.style.position = 'relative';
    calcClearBtn.style.zIndex = '20';
    calcClearBtn.style.pointerEvents = 'auto';
    calcFilterBar.appendChild(calcClearBtn);

    // ★ 事件委托：在父容器上监听点击，避免闭包引用被销毁的DOM元素
    calcFilterBar.addEventListener('click', function(e){
      var target = e.target;
      // 向上查找 data-action 按钮（兼容点击到子元素的情况）
      while(target && target !== calcFilterBar) {
        if(target.getAttribute && target.getAttribute('data-action') === 'clear-calc-filter') {
          e.preventDefault();
          e.stopPropagation();
          // 直接修改 state + 同步清空输入控件（筛选栏存活，不依赖重渲染）
          state.calcSearch = '';
          state.calcPricingFilter = '';
          calcSearchInput.value = '';
          calcPricingSel.value = '';
          renderCalcBody();
          // 视觉反馈（按钮不会被销毁，可安全改样式）
          var btn = target;
          var oldText = btn.textContent;
          btn.textContent = '✔ 已重置';
          btn.style.background = '#f0fdf4';
          btn.style.color = '#16a34a';
          btn.style.borderColor = '#86efac';
          setTimeout(function(){
            btn.textContent = oldText;
            btn.style.background = '';
            btn.style.color = '';
            btn.style.borderColor = '';
          }, 900);
          return;
        }
        target = target.parentNode;
      }
    });
    calcSec.appendChild(calcFilterBar);
    calcSec.appendChild(calcBodyHost);

    // ★ v6.11 计费区内容渲染（独立函数：只重建 calcBodyHost，筛选栏保持存活）
    function renderCalcBody() {
    calcBodyHost.innerHTML = '';

    // ★ v7.0 专案专家（Chris / Roc）：单一专案内容，不适用标准报价单
    if(isProjExpert) {
      var projExp = getExpertInfo(state.advisorPerson);
      var _speNo = _reqOrderNo();
      var projNotice = el('div', 'svc-project-expert-notice');
      projNotice.innerHTML =
        '<div class="spe-notice-head">' + projExp.icon + ' ' + projExp.name + ' · ' + projExp.role + '</div>' +
        '<div class="spe-notice-body">' +
          '该专家提供的是 <b>单一专案内容</b>，<b>价格另算</b>，不适用下方标准报价单。<br>' +
          '如需其他业务报价，请联系 <b>SDC 共享中心专家（Yuki / Queenie）</b> 获取对应方案与单独报价。' +
        '</div>' +
        // ★ v7.0.2 专案需求填写栏
        '<div class="spe-req-form">' +
          '<div class="spe-req-title">📝 填写专案需求 — 提交后由 SDC 共享中心专家评估并单独报价</div>' +
          '<div class="spe-req-row">' +
            '<label class="spe-req-label" for="speReqDesc">专案需求说明<i class="spe-req-need">必填</i></label>' +
            '<textarea id="speReqDesc" class="spe-req-input spe-req-textarea" rows="3" placeholder="请描述需要的专案内容，例如：年度人才盘点与组织架构优化、关键岗位招聘专案…"></textarea>' +
          '</div>' +
          '<div class="spe-req-2col">' +
            '<div class="spe-req-row">' +
              '<label class="spe-req-label" for="speReqName">联系人<i class="spe-req-need">必填</i></label>' +
              '<input type="text" id="speReqName" class="spe-req-input" placeholder="您的姓名" />' +
            '</div>' +
            '<div class="spe-req-row">' +
              '<label class="spe-req-label" for="speReqContact">联系方式<i class="spe-req-need">必填</i></label>' +
              '<input type="text" id="speReqContact" class="spe-req-input" placeholder="电话 / 邮箱" />' +
            '</div>' +
          '</div>' +
          '<div class="spe-req-2col">' +
            '<div class="spe-req-row">' +
              '<label class="spe-req-label" for="speReqDue">期望交付时间</label>' +
              '<input type="date" id="speReqDue" class="spe-req-input" />' +
            '</div>' +
            '<div class="spe-req-row">' +
              '<label class="spe-req-label" for="speReqBudget">预算范围 / 备注</label>' +
              '<input type="text" id="speReqBudget" class="spe-req-input" placeholder="如：预算 5–10 万，或补充说明" />' +
            '</div>' +
          '</div>' +
          '<div class="spe-req-actions">' +
            '<button class="spe-req-btn spe-req-btn-primary" type="button" id="speReqSubmit">生成需求单</button>' +
            '<button class="spe-req-btn spe-req-btn-ghost" type="button" id="speReqExport">导出 PDF</button>' +
            '<button class="mini-btn spe-req-btn-clear" type="button" id="speReqReset">清空</button>' +
            '<span class="spe-req-hint" id="speReqHint"></span>' +
          '</div>' +
          '<div class="spe-req-output" id="speReqOutput" style="display:none;">' +
            '<div class="spe-req-output-head">📄 专案需求单（可复制，或点右侧按钮直接发送）</div>' +
            '<textarea id="speReqOutputText" class="spe-req-output-text" rows="10" readonly></textarea>' +
            '<div class="spe-req-output-actions">' +
              '<button class="mini-btn spe-req-output-btn" type="button" id="speReqCopy">📋 一键复制</button>' +
              '<button class="mini-btn spe-req-output-btn" type="button" id="speReqMail">✉️ 发送邮件</button>' +
              '<span class="spe-req-mailto">收件人：' + REQ_MAIL_TO + '　·　点击即直接发送</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<button class="land-btn land-btn-primary spe-notice-btn" type="button">👥 联系 SDC 共享中心专家 →</button>';

      // ---- v7.0.2 专案需求填写栏交互 ----
      var _rDesc = projNotice.querySelector('#speReqDesc');
      var _rName = projNotice.querySelector('#speReqName');
      var _rContact = projNotice.querySelector('#speReqContact');
      var _rDue = projNotice.querySelector('#speReqDue');
      var _rBudget = projNotice.querySelector('#speReqBudget');
      var _rHint = projNotice.querySelector('#speReqHint');
      var _rOutput = projNotice.querySelector('#speReqOutput');
      var _rOutText = projNotice.querySelector('#speReqOutputText');

      function _speHint(msg, kind){
        _rHint.textContent = msg || '';
        _rHint.className = 'spe-req-hint' + (kind ? ' spe-req-hint-' + kind : '');
      }
      function _speCollect(){
        return {
          desc: (_rDesc.value || '').trim(),
          name: (_rName.value || '').trim(),
          contact: (_rContact.value || '').trim(),
          due: (_rDue.value || '').trim(),
          budget: (_rBudget.value || '').trim()
        };
      }
      // 校验：返回空串表示通过
      function _speCheck(d){
        if(!d.desc) return '请填写「专案需求说明」';
        if(!d.name) return '请填写「联系人」';
        if(!d.contact) return '请填写「联系方式」';
        return '';
      }
      function _speFocusByErr(err){
        if(err.indexOf('说明') > -1) _rDesc.focus();
        else if(err.indexOf('联系人') > -1) _rName.focus();
        else _rContact.focus();
      }
      // 生成需求单纯文本
      function _speBuildText(d){
        var exp = getExpertInfo(state.advisorPerson);
        return [
          REQ_MAIL_HEADER,                          // ★ v7.0.5 邮件抬头
          '【专案需求单】' + _speNo,
          '日期：' + _todayCN(),
          '委托专家：' + exp.name + '（' + exp.role + '）',
          '计费方式：单一专案内容，价格另算',
          '',
          '一、专案需求说明',
          d.desc,
          '',
          '二、委托与联系信息',
          '联系人：' + d.name,
          '联系方式：' + d.contact,
          '期望交付时间：' + _cnDate(d.due),
          '预算范围 / 备注：' + (d.budget || '待确认'),
          '',
          '受理单位：中国人资服务处',
          '说明：本单为专案需求登记，正式报价由人资部专家评估后单独提供。'
        ].join('\n');
      }
      // 生成需求单
      projNotice.querySelector('#speReqSubmit').addEventListener('click', function(){
        var d = _speCollect();
        var err = _speCheck(d);
        if(err){ _speHint('⚠️ ' + err, 'err'); _speFocusByErr(err); return; }
        _rOutText.value = _speBuildText(d);
        _rOutput.style.display = 'block';
        _speHint('✔ 需求单已生成，可复制或导出 PDF', 'ok');
      });
      // 一键复制
      projNotice.querySelector('#speReqCopy').addEventListener('click', function(){
        var btn = this;
        var txt = _rOutText.value;
        if(!txt){ _speHint('⚠️ 请先点击「生成需求单」', 'err'); return; }
        _copyFromTextarea(_rOutText, function(){
          btn.textContent = '✔ 已复制';
          _speHint('✔ 已复制到剪贴板，可粘贴发送给 SDC 专家', 'ok');
          setTimeout(function(){ btn.textContent = '📋 一键复制'; }, 1600);
        }, function(){
          _speHint('⚠️ 复制失败，请手动全选复制', 'err');
        });
      });
      // ★ v7.0.4 发送邮件：点击后直接投递到 REQ_MAIL_TO（无需再在客户端点发送）
      projNotice.querySelector('#speReqMail').addEventListener('click', function(){
        if (this.disabled) return;
        var txt = _rOutText.value;
        if(!txt){ _speHint('⚠️ 请先点击「生成需求单」', 'err'); return; }
        var expN = getExpertInfo(state.advisorPerson);
        // ★ v7.0.5 标题不带【】，抬头由 _deliverReqMail 统一加「中国区人资服务接单中心」
        _deliverReqMail('专案需求单 ' + _speNo + (expN ? ' — ' + expN.name : ''), txt, { btn: this, hint: _speHint });
      });
      // 清空
      projNotice.querySelector('#speReqReset').addEventListener('click', function(){
        _rDesc.value = ''; _rName.value = ''; _rContact.value = ''; _rDue.value = ''; _rBudget.value = '';
        _rOutText.value = ''; _rOutput.style.display = 'none';
        _speHint('已清空');
      });
      // 导出 PDF：走打印窗口（jsPDF 内置字体无中文字形，直接生成会乱码）
      projNotice.querySelector('#speReqExport').addEventListener('click', function(){
        var d = _speCollect();
        var err = _speCheck(d);
        if(err){ _speHint('⚠️ ' + err, 'err'); _speFocusByErr(err); return; }
        var html = buildProjectReqPrintHTML(d, getExpertInfo(state.advisorPerson), _speNo, _todayCN());
        var pw = window.open('', '_blank');
        if(!pw){ _speHint('⚠️ 浏览器拦截了打印窗口，请允许弹窗后重试', 'err'); return; }
        pw.document.write(html);
        pw.document.close();
        _speHint('✔ 已打开打印窗口，请选择「另存为 PDF」', 'ok');
      });

      projNotice.querySelector('.spe-notice-btn').addEventListener('click', function(){
        state.advisorPerson = 'Yuki';
        state.svcModule = 'all';
        state.svcTagFilters = [];
        renderServices();
      });
      calcBodyHost.appendChild(projNotice);
      return;   // 专案专家不展示标准计费清单
    }

    // ★ 计费区最终过滤（搜索 + 计费模式）
    var finalServices = pricedServices.filter(function(s){
      if(state.calcSearch){
        var q = state.calcSearch.toLowerCase();
        if((s.item||'').toLowerCase().indexOf(q) < 0 && s.content.toLowerCase().indexOf(q) < 0) return false;
      }
      if(state.calcPricingFilter){
        var pt = getPricingType(s);
        var cat = state.calcPricingFilter;
        var pricingMap = { '_person': ['person','person_time'], '_house': ['house','house_time'], '_once': ['once'], 'project': ['project'], '_item': ['item'] };
        var allowed = pricingMap[cat];
        if(!allowed || allowed.indexOf(pt.type) < 0) return false;
      }
      return true;
    });
    var calcGroups = {};
    finalServices.forEach(function(s){ if(!calcGroups[s.module]) calcGroups[s.module] = []; calcGroups[s.module].push(s); });

    // ★ v7.0 空结果友好提示（避免出现「一片空白、以为坏了」的观感）
    if(finalServices.length === 0) {
      var emptyHint = el('div', 'svc-calc-empty');
      emptyHint.innerHTML = '🔍 当前条件下没有可选服务。<br><span>可点击「✕ 取消筛选」，或切换服务模块 / 计费模式后再试。</span>';
      calcBodyHost.appendChild(emptyHint);
    }

    var calcGrid = el('div', 'svc-calc-grid');
    Object.keys(calcGroups).sort().forEach(function(modName){
      var grp = el('div', 'svc-calc-group');
      grp.appendChild(el('div', 'svc-calc-group-name', modName.replace(/服务模块$/, '')));
      calcGroups[modName].forEach(function(s){
        var idx = QUOTE_SERVICES.indexOf(s);
        var lbl = el('label', 'svc-calc-item');
        var cb = el('input'); cb.type = 'checkbox'; cb.dataset.idx = idx;
        cb.checked = state.selectedServices.has(idx);
        cb.addEventListener('change', function(){
          if(cb.checked) state.selectedServices.add(idx); else state.selectedServices.delete(idx);
          updateSvcTotal();
        });
        lbl.appendChild(cb);

        // ★ 服务名称
        lbl.appendChild(el('span', 'svc-calc-item-name', s.item || s.content.slice(0,25)));

        // ★ 数量输入框
        var qty = state.serviceQuantities[idx] || 1;
        var qtyInput = el('input', 'svc-calc-qty'); qtyInput.type = 'number'; qtyInput.min = '1'; qtyInput.max = '999'; qtyInput.value = qty; qtyInput.dataset.idx = idx;
        qtyInput.addEventListener('change', function(){
          var v = parseInt(qtyInput.value) || 1;
          state.serviceQuantities[idx] = v;
          updateSvcTotal();
        });
        var qtyWrap = el('span', 'svc-calc-qty-wrap'); qtyWrap.textContent = '× '; qtyWrap.appendChild(qtyInput);

        // ★ 报价 + 规格 + 收费模式标签（v5.2 增强：醒目标记计费单位）
        var priceArea = el('span', 'svc-calc-price-area');
        var pt = getPricingType(s);
        priceArea.innerHTML =
          '<span class="svc-price-main">' + formatPriceWithUnit(s) + '</span>' +
          '<span class="svc-pricing-tag" style="background:' + pt.color + '20;border-color:' + pt.color + ';color:' + pt.color + '">' + pt.icon + ' ' + pt.label + '</span>';

        lbl.appendChild(qtyWrap);
        lbl.appendChild(priceArea);
        grp.appendChild(lbl);
      });
      calcGrid.appendChild(grp);
    });
    calcBodyHost.appendChild(calcGrid);

    // ★ 费用汇总栏
    var totalBar = el('div', 'svc-total-bar');
    var totalLeft = el('div', 'svc-total-left');
    totalLeft.appendChild(el('span', 'svc-total-label', '费用类型：'));
    var feeSel = el('select', 'filter-select svc-fee-select');
    feeSel.appendChild(opt('total', '服务报价总计')); feeSel.appendChild(opt('monthly', '月度预估费用')); feeSel.appendChild(opt('custom', '自定义金额'));
    feeSel.value = state.feeType || 'total';
    feeSel.addEventListener('change', function(){ state.feeType = feeSel.value; updateSvcTotal(); });
    totalLeft.appendChild(feeSel);
    var customInputWrap = el('div', 'svc-custom-wrap' + (state.feeType === 'custom' ? '' : ' hidden'));
    var ci = el('input', 'svc-custom-input'); ci.type = 'number'; ci.placeholder = '输入金额...'; ci.value = state.customFee || '';
    ci.addEventListener('input', function(){ state.customFee = ci.value; updateSvcTotal(); });
    customInputWrap.appendChild(ci); totalLeft.appendChild(customInputWrap);
    totalBar.appendChild(totalLeft);
    var totalRight = el('div', 'svc-total-right'); totalBar.appendChild(totalRight);
    calcBodyHost.appendChild(totalBar);

    // ★ v7.0.7 移除独立的「生成服务清单 PDF」虚线按钮（需求单表单已含「导出 PDF」，此处冗余），
    //   原位改为服务时效承诺文案
    var slaNote = el('div', 'svc-sla-note');
    slaNote.innerHTML = '🕐 提交服务需求后，我们将在 <b>24 小时内</b>与您联系，确认服务方案与交付安排';
    calcBodyHost.appendChild(slaNote);

    // ★ v7.0.3：生成需求单 / 一键复制 / 发送邮件（收件邮箱固定 REQ_MAIL_TO）
    // ★ v7.0.5：与「专案需求单」同构 —— 需求内容自动代入上方已勾选服务、预算报价自动带入上方加总价格，
    //   另加 联系人 / 联系方式 / 期望交付时间 / 备注（选填）。表单值存入 state，
    //   计费区因搜索等操作重建 DOM 时不会丢失（沿用 v6.10/v6.11 的教训）。
    var _svcReqSeq = '';
    var _svcForm = state.svcReqForm = state.svcReqForm || { name: '', contact: '', due: '', remark: '' };

    var reqForm = el('div', 'spe-req-form svc-req-form');
    reqForm.innerHTML =
      '<div class="spe-req-title">📝 填写服务需求 — 需求内容与预算报价自动代入上方所选，提交后由 SDC 共享中心承接</div>' +
      '<div class="spe-req-row">' +
        '<label class="spe-req-label" for="svcReqDesc">需求内容<i class="spe-req-auto">自动代入上方已选服务</i></label>' +
        '<textarea id="svcReqDesc" class="spe-req-input spe-req-textarea spe-req-input-auto" rows="4" readonly></textarea>' +
      '</div>' +
      '<div class="spe-req-2col">' +
        '<div class="spe-req-row">' +
          '<label class="spe-req-label" for="svcReqName">联系人<i class="spe-req-auto">选填</i></label>' +
          '<input type="text" id="svcReqName" class="spe-req-input" placeholder="您的姓名" />' +
        '</div>' +
        '<div class="spe-req-row">' +
          '<label class="spe-req-label" for="svcReqContact">联系方式<i class="spe-req-auto">选填</i></label>' +
          '<input type="text" id="svcReqContact" class="spe-req-input" placeholder="电话 / 邮箱" />' +
        '</div>' +
      '</div>' +
      '<div class="spe-req-2col">' +
        '<div class="spe-req-row">' +
          '<label class="spe-req-label" for="svcReqDue">期望交付时间</label>' +
          '<input type="date" id="svcReqDue" class="spe-req-input" />' +
        '</div>' +
        '<div class="spe-req-row">' +
          '<label class="spe-req-label" for="svcReqQuote">预算报价<i class="spe-req-auto">自动带入上方加总价格</i></label>' +
          '<input type="text" id="svcReqQuote" class="spe-req-input spe-req-input-auto" readonly />' +
        '</div>' +
      '</div>' +
      '<div class="spe-req-row">' +
        '<label class="spe-req-label" for="svcReqRemark">备注</label>' +
        '<input type="text" id="svcReqRemark" class="spe-req-input" placeholder="补充说明（选填）" />' +
      '</div>' +
      '<div class="spe-req-actions">' +
        '<button class="spe-req-btn spe-req-btn-primary" type="button" id="svcReqGen">生成需求单</button>' +
        '<button class="spe-req-btn spe-req-btn-ghost" type="button" id="svcReqExport">导出 PDF</button>' +
        '<button class="mini-btn spe-req-btn-clear" type="button" id="svcReqReset">清空</button>' +
        '<span class="svc-req-hint" id="svcReqHint"></span>' +
      '</div>' +
      '<div class="svc-req-output" id="svcReqOutput" style="display:none;">' +
        '<div class="svc-req-output-head">📄 服务需求单（可复制，或点右侧按钮直接发送）</div>' +
        '<textarea id="svcReqOutputText" class="svc-req-output-text" rows="12" readonly></textarea>' +
        '<div class="spe-req-output-actions">' +
          '<button class="mini-btn spe-req-output-btn" type="button" id="svcReqCopy">📋 一键复制</button>' +
          '<button class="mini-btn spe-req-output-btn" type="button" id="svcReqMail">✉️ 发送邮件</button>' +
          '<span class="spe-req-mailto">收件人：' + REQ_MAIL_TO + '　·　点击即直接发送（抬头：' + REQ_MAIL_HEADER + '）</span>' +
        '</div>' +
      '</div>';
    calcBodyHost.appendChild(reqForm);

    var reqGen = reqForm.querySelector('#svcReqGen');
    var reqCopy = reqForm.querySelector('#svcReqCopy');
    var reqMail = reqForm.querySelector('#svcReqMail');
    var reqExport = reqForm.querySelector('#svcReqExport');
    var reqReset = reqForm.querySelector('#svcReqReset');
    var reqHint = reqForm.querySelector('#svcReqHint');
    var reqOut = reqForm.querySelector('#svcReqOutput');
    var reqOutText = reqForm.querySelector('#svcReqOutputText');
    var reqDesc = reqForm.querySelector('#svcReqDesc');
    var reqName = reqForm.querySelector('#svcReqName');
    var reqContact = reqForm.querySelector('#svcReqContact');
    var reqDue = reqForm.querySelector('#svcReqDue');
    var reqRemark = reqForm.querySelector('#svcReqRemark');

    // 回填表单（重建计费区后保留已填内容）+ 变更即写回 state
    reqDesc.value = _svcReqContentDigest();
    reqName.value = _svcForm.name || '';
    reqContact.value = _svcForm.contact || '';
    reqDue.value = _svcForm.due || '';
    reqRemark.value = _svcForm.remark || '';
    [['name', reqName], ['contact', reqContact], ['due', reqDue], ['remark', reqRemark]].forEach(function(pair){
      var key = pair[0], node = pair[1];
      var sync = function(){
        _svcForm[key] = node.value;
        // 已生成过需求单 → 表单变更后同步刷新，避免发出旧内容
        if (reqOutText.value) _svcReqBuild(false);
      };
      node.addEventListener('input', sync);
      node.addEventListener('change', sync);
    });

    function _svcReqHint(msg, kind){
      reqHint.textContent = msg || '';
      reqHint.className = 'svc-req-hint' + (kind ? ' svc-req-hint-' + kind : '');
    }
    function _svcReqInfo(){
      return {
        name: (reqName.value || '').trim(),
        contact: (reqContact.value || '').trim(),
        due: (reqDue.value || '').trim(),
        remark: (reqRemark.value || '').trim()
      };
    }
    // 生成需求单：需求内容代入上方所选服务，预算报价带入上方加总价格
    function _svcReqBuild(newSeq){
      updateSvcTotal();                           // 同步「预算报价」栏与费用汇总条
      if(newSeq || !_svcReqSeq) _svcReqSeq = _svcOrderNo();
      reqDesc.value = _svcReqContentDigest();     // 需求内容始终跟随上方勾选
      reqOutText.value = buildServiceReqText(_svcReqSeq, _todayCN(), _svcReqInfo());
      reqOut.style.display = 'block';
      return reqOutText.value;
    }
    // 复制 / 发信前若尚未生成，自动补生成，避免多一步操作
    function _svcReqEnsure(){
      if(reqOutText.value) return reqOutText.value;
      if(state.selectedServices.size === 0){ _svcReqHint('⚠️ 请先勾选至少一项服务', 'err'); return ''; }
      return _svcReqBuild(false);
    }
    reqGen.addEventListener('click', function(){
      if(state.selectedServices.size === 0){ _svcReqHint('⚠️ 请先勾选至少一项服务', 'err'); return; }
      _svcReqBuild(true);
      _svcReqHint('✔ 需求单已生成，可复制、导出 PDF 或发送邮件', 'ok');
    });
    reqCopy.addEventListener('click', function(){
      var btn = this;
      if(!_svcReqEnsure()) return;
      _copyFromTextarea(reqOutText, function(){
        btn.textContent = '✔ 已复制';
        _svcReqHint('✔ 已复制到剪贴板', 'ok');
        setTimeout(function(){ btn.textContent = '📋 一键复制'; }, 1600);
      }, function(){ _svcReqHint('⚠️ 复制失败，请手动全选复制', 'err'); });
    });
    reqMail.addEventListener('click', function(){
      if (this.disabled) return;
      if(!_svcReqEnsure()) return;
      // ★ v7.0.5 标题不带【】，抬头由 _deliverReqMail 统一加「中国区人资服务接单中心」
      _deliverReqMail('HR 服务需求单 ' + _svcReqSeq, reqOutText.value, { btn: this, hint: _svcReqHint });
    });
    // 导出 PDF：走打印窗口（与专案需求单同一方案，中文由浏览器渲染，不会乱码）
    reqExport.addEventListener('click', function(){
      if(state.selectedServices.size === 0){ _svcReqHint('⚠️ 请先勾选至少一项服务', 'err'); return; }
      var html = buildServiceReqPrintHTML(_svcReqSeq || _svcOrderNo(), _todayCN(), _svcReqInfo());
      var pw = window.open('', '_blank');
      if(!pw){ _svcReqHint('⚠️ 浏览器拦截了打印窗口，请允许弹窗后重试', 'err'); return; }
      pw.document.write(html);
      pw.document.close();
      _svcReqHint('✔ 已打开打印窗口，请选择「另存为 PDF」', 'ok');
    });
    reqReset.addEventListener('click', function(){
      _svcForm = state.svcReqForm = { name: '', contact: '', due: '', remark: '' };
      reqName.value = ''; reqContact.value = ''; reqDue.value = ''; reqRemark.value = '';
      reqDesc.value = _svcReqContentDigest();
      reqOutText.value = ''; reqOut.style.display = 'none';
      _svcReqHint('已清空');
    });

    // 重建后同步费用汇总显示（保持已选服务金额不丢失）
    updateSvcTotal();
    }   // ← renderCalcBody 结束

    wrap.appendChild(calcSec);   // 先入 DOM，再渲染内容（updateSvcTotal 需要能查询到节点）
    renderCalcBody();            // 首次渲染计费内容区

    // 模块筛选 + 作业模式筛选 + 搜索
    var toolbar = el('div', 'svc-toolbar');
    var modSel = el('select', 'filter-select');
    var optA = el('option'); optA.value = 'all'; optA.textContent = '全部模块'; modSel.appendChild(optA);
    QUOTE_MODULES.forEach(function (m) { var o = el('option'); o.value = m; o.textContent = m.replace(/服务模块$/, ''); modSel.appendChild(o); });
    modSel.value = state.svcModule;
    // ★ v7.0 模块下拉影响计费区范围，改为整页重渲染确保计费区同步
    modSel.addEventListener('change', function () {
      state.svcModule = modSel.value;
      state.advisorPerson = '';          // 模块口径独立，清掉顾问残留
      state.svcTagFilters = [];
      renderServices();
    });
    toolbar.appendChild(el('label', null, '服务模块：')); toolbar.appendChild(modSel);
    var modeSel = el('select', 'filter-select');
    var mA = el('option'); mA.value = 'all'; mA.textContent = '全部模式'; modeSel.appendChild(mA);
    modeSel.appendChild(opt('online', '线上服务')); modeSel.appendChild(opt('offline', '线下服务')); modeSel.appendChild(opt('system', '系统服务'));
    modeSel.appendChild(opt('priced', '有报价')); modeSel.value = state.svcMode || 'priced';
    modeSel.addEventListener('change', function () { state.svcMode = modeSel.value; renderServiceCards(); });
    toolbar.appendChild(el('label', null, '  作业模式：')); toolbar.appendChild(modeSel);
    var searchInput = el('input', 'table-search'); searchInput.placeholder = '搜索服务内容…'; searchInput.value = state.svcSearch; searchInput.style.width = '260px';
    searchInput.addEventListener('input', function () { state.svcSearch = searchInput.value; renderServiceCards(); });
    toolbar.appendChild(searchInput);
    // ★ v5.8 重置按钮：一键清除模块/模式/搜索/标签筛选
    var svcReset = el('button', 'mini-btn svc-toolbar-reset', '↺ 重置筛选');
    svcReset.addEventListener('click', function(){
      state.svcModule = 'all'; state.svcMode = 'priced'; state.svcSearch = '';
      state.svcTagFilters = []; state.selectedServices = new Set(); state.serviceQuantities = {};
      state.calcSearch = ''; state.calcPricingFilter = '';  // ★ v6.1 清空计费区筛选
      modSel.value = 'all'; modeSel.value = 'priced'; searchInput.value = '';
      renderServices();  // 重新渲染整个服务页（含卡片+计费区+标签栏）
    });
    toolbar.appendChild(svcReset); wrap.appendChild(toolbar);

    // ★ v5.4 标签筛选状态栏（从顾问页带入时显示）
    if(state.svcTagFilters && state.svcTagFilters.length > 0) {
      var tagBar = el('div', 'svc-tag-filter-bar');
      var tagLabel = el('span', 'svc-tag-filter-label', '🏷️ 当前标签筛选：');
      tagBar.appendChild(tagLabel);
      state.svcTagFilters.forEach(function(tag){
        var tg = el('span', 'svc-tag-chip', tag);
        var map = TAG_SERVICE_MAP[tag];
        if(map && map.color) tg.style.background = map.color + '18'; tg.style.borderColor = map ? map.color : '#999';
        // 单个移除按钮
        var rm = el('span', 'svc-tag-rm', '×'); rm.title = '移除此标签';
        rm.addEventListener('click', function(e){
          e.stopPropagation();
          state.svcTagFilters = state.svcTagFilters.filter(function(t){ return t !== tag; });
          renderServices();  // 重新渲染服务页
        });
        tg.appendChild(rm); tagBar.appendChild(tg);
      });
      var clrTags = el('button', 'mini-btn', '清除全部标签');
      clrTags.addEventListener('click', function(){ state.svcTagFilters = []; renderServices(); });
      tagBar.appendChild(clrTags);
      wrap.appendChild(tagBar);
    }

    // 服务卡片列表
    var cardsArea = el('div', 'svc-cards-area'); cardsArea.id = 'svc_cards'; wrap.appendChild(cardsArea);
    renderServiceCards();

    // ★ v7.0.2 底部联动图表 —— 仅查看「顾问」时显示；查看专家团队时隐藏
    //   专家（SDC 共享中心专家 / 专案专家）的职责口径与「全 HR 工时分布」无关，
    //   显示反而干扰阅读，故选中专家时不渲染该区块。
    if (!getExpertInfo(state.advisorPerson)) {
      wrap.appendChild(el('div', 'section-title', '🔗 服务 ↔ 负责人员 联动'));
      var linkGrid = el('div', 'chart-grid');
      linkGrid.appendChild(chartBox('svc_module_hours', '各服务模块对应 HR 工时分布'));
      linkGrid.appendChild(chartBox('svc_person_svc', '各 HR 人员主要服务领域'));
      wrap.appendChild(linkGrid);
      drawServiceLinkCharts();
    }
  }

  function renderServiceCards() {
    var area = document.getElementById('svc_cards'); if (!area) return; area.innerHTML = '';

    // ★ v7.0 专案专家：标准报价目录不适用，改为专案说明卡
    if(isProjectExpert(state.advisorPerson)) {
      var pex = getExpertInfo(state.advisorPerson);
      var pexBox = el('div', 'svc-project-expert-notice');
      pexBox.innerHTML =
        '<div class="spe-notice-head">' + pex.icon + ' ' + pex.name + ' · ' + pex.role + '</div>' +
        '<div class="spe-notice-body">该专家提供 <b>单一专案内容</b>，<b>价格另算</b>，因此不展示标准服务报价目录。<br>如需报价请联系 SDC 共享中心专家（Yuki / Queenie）。</div>';
      area.appendChild(pexBox);
      return;
    }

    // ★ v5.4 标签筛选：如果从顾问页带入了标签，用 matchServicesByTags 过滤（带顾问profile）
    var tagFiltered = null;
    var advProf = state.advisorPerson ? getAdvisorProfile(state.advisorPerson) : null;
    // ★ v7.0 模块优先 / SDC 共享中心专家（匹配所有业务）：不再叠加顾问工作范围过滤
    var moduleLocked = !!(state.svcModule && state.svcModule !== 'all');
    var skipAdvisorScope = moduleLocked || isAllScopeExpert(state.advisorPerson);
    // ★ v5.6 有 advisorPerson 时，即使无标签也按该人工作范围过滤
    var personScope = null;
    if(advProf && !skipAdvisorScope && (!state.svcTagFilters || state.svcTagFilters.length === 0)) {
      personScope = matchServicesByTags([], advProf);
    }
    if(!moduleLocked && state.svcTagFilters && state.svcTagFilters.length > 0) {
      tagFiltered = matchServicesByTags(state.svcTagFilters, advProf);
    }

    var services = QUOTE_SERVICES.filter(function (s) {
      if (state.svcModule !== 'all' && s.module !== state.svcModule) return false;
      if (state.svcMode && state.svcMode !== 'all') {
        if (state.svcMode === 'online' && !s.online) return false;
        if (state.svcMode === 'offline' && !s.offline) return false;
        if (state.svcMode === 'system' && !s.system) return false;
        if (state.svcMode === 'priced' && (s.price == null || s.price === '')) return false;
      }
      if (state.svcSearch) { var q = state.svcSearch.toLowerCase(); return (s.content + s.item + s.module).toLowerCase().indexOf(q) >= 0; }
      // ★ v5.4 标签筛选
      if(tagFiltered && tagFiltered.indexOf(s) < 0) return false;
      // ★ v5.6 顾问工作范围过滤（无标签时）
      if(personScope && personScope.indexOf(s) < 0) return false;
      return true;
    });
    var groups = {}; services.forEach(function (s) { if (!groups[s.module]) groups[s.module] = []; groups[s.module].push(s); });
    Object.keys(groups).sort().forEach(function (modName) {
      var section = el('div', 'svc-section');
      section.appendChild(el('div', 'svc-mod-header', modName.replace(/服务模块$/, '') || modName));
      var cards = el('div', 'svc-card-list');
      groups[modName].forEach(function (s) {
        var card = el('div', 'svc-card');
        var hasPrice = s.price != null && s.price !== '';
        card.classList.add(hasPrice ? 'has-price' : 'no-price');
        var tags = el('div', 'svc-tags');
        if (s.online) tags.appendChild(el('span', 'tag tag-online', '线上'));
        if (s.offline) tags.appendChild(el('span', 'tag tag-offline', '线下'));
        if (s.system) tags.appendChild(el('span', 'tag tag-system', '系统'));
        var body = el('div', 'svc-card-body');
        body.appendChild(el('div', 'svc-item-name', s.item || s.content.slice(0, 30)));
        body.appendChild(el('div', 'svc-content', s.content));
        if (s.remark) body.appendChild(el('div', 'svc-remark', s.remark));
        var priceRow = el('div', 'svc-price-row');
        if (hasPrice) {
          // ★ v5.2 增强：价格+规格一体化显示 + 彩色计费模式标签
          var priceEl = el('span', 'svc-price'); priceEl.innerHTML = formatPriceWithUnit(s); priceRow.appendChild(priceEl);
          var pt = getPricingType(s);
          var tagEl = el('span', 'svc-pricing-tag');
          tagEl.style.background = pt.color + '18'; tagEl.style.borderColor = pt.color; tagEl.style.color = pt.color;
          tagEl.textContent = pt.icon + ' ' + pt.label; priceRow.appendChild(tagEl);
          if (s.unit) { var uEl = el('span', 'svc-unit', '(' + s.unit + ')'); priceRow.appendChild(uEl); }
          if (s.market) priceRow.appendChild(el('span', 'svc-market', '市场 ' + s.market));
        } else {
          priceRow.appendChild(el('span', 'svc-price-na', '按需定制'));
        }
        card.appendChild(tags); card.appendChild(body); card.appendChild(priceRow);
        card.style.cursor = 'pointer';
        card.addEventListener('click', function () {
          // ★ 点击跳转到服务选择区并预选该模块
          state.svcModule = modName;
          state.svcMode = 'priced';
          switchPage('services');
        });
        cards.appendChild(card);
      });
      section.appendChild(cards); area.appendChild(section);
    });
  }

  function mapQuoteToHRMod(quoteMod) {
    var map = { '社保公积金管理服务模块': '薪酬福利管理', '薪酬福利与税务管理服务模块': '薪酬福利管理', '劳动关系与证件办理服务模块': '劳动关系管理', '招聘与培训开发服务模块': '招聘与配置作业' };
    return map[quoteMod] || null;
  }

  // ★ 服务选择自动计费（支持数量）
  // ★ v7.0.5 已选服务加总（费用汇总条 + 服务需求单「预算报价」共用同一口径）
  function _svcSelectedTotal() {
    var t = 0;
    state.selectedServices.forEach(function(idx){
      var s = QUOTE_SERVICES[idx];
      if (s && s.price != null) {
        var qty = state.serviceQuantities[idx] || 1;
        t += (Number(s.price) || 0) * qty;
      }
    });
    return t;
  }
  // ★ v7.0.5 预算报价文案（跟随「费用类型」下拉：服务报价总计 / 月度预估 / 自定义金额）
  function _svcQuoteText() {
    var feeType = state.feeType || 'total';
    if (feeType === 'custom') return '¥' + (state.customFee || '0');
    if (feeType === 'monthly') return '¥' + fmt(_svcSelectedTotal() / 12, 0);
    return '¥' + fmt(_svcSelectedTotal(), 0);
  }
  function updateSvcTotal() {
    var selectedTotal = _svcSelectedTotal();
    var feeType = state.feeType || 'total';
    // ★ v7.0.5 同步服务需求单表单的「预算报价」（只读，自动带入上方加总价格）
    var _quoteBox = document.getElementById('svcReqQuote');
    if (_quoteBox) _quoteBox.value = _svcQuoteText();
    // ★ v7.0.7 同步「需求内容」（只读，自动代入上方已勾选服务）
    //   修复：勾选/取消服务后需求内容不刷新的问题（此前只在渲染/生成时写入一次）
    var _descBox = document.getElementById('svcReqDesc');
    if (_descBox) _descBox.value = _svcReqContentDigest();
    var totalRight = document.querySelector('.svc-total-right'); if (!totalRight) return;
    var displayVal = '', displaySub = '';
    if (feeType === 'custom') { displayVal = '¥' + (state.customFee || '0'); displaySub = '自定义金额'; }
    else if (feeType === 'monthly') { displayVal = '¥' + fmt(selectedTotal / 12, 0); displaySub = '月均（' + state.selectedServices.size + '项服务 ÷ 12月）'; }
    else { displayVal = '¥' + fmt(selectedTotal, 0); displaySub = '已选 ' + state.selectedServices.size + ' 项服务'; }
    totalRight.innerHTML = '<div class="svc-total-val">' + displayVal + '</div><div class="svc-total-sub">' + displaySub + '</div>';
    var customWrap = document.querySelector('.svc-custom-wrap');
    if (customWrap) { if (feeType === 'custom') customWrap.classList.remove('hidden'); else customWrap.classList.add('hidden'); }
  }

  // ========== v5.9：生成服务报价清单 PDF ==========
  // ★ v7.0.2 专案需求单相关工具
  //   关于中文 PDF：
  //   · 专案需求单 → 生成可打印 HTML，交给浏览器渲染中文后「另存为 PDF」（轻量、无字体依赖）。
  //   · 服务报价清单 → 走 jsPDF + 内嵌中文子集字体（v7.0.4），可直接下载真正的 PDF 文件。
  //   两者都不会出现中文乱码。
  function _cnDate(v){
    if(!v) return '待确认';
    var p = String(v).split('-');
    if(p.length !== 3) return String(v);
    return p[0] + '年' + parseInt(p[1], 10) + '月' + parseInt(p[2], 10) + '日';
  }
  function _todayCN(){
    var t = new Date();
    return t.getFullYear() + '年' + (t.getMonth() + 1) + '月' + t.getDate() + '日';
  }
  function _reqOrderNo(){
    var t = new Date();
    return 'WPG-HR-PRJ-' + t.getFullYear() +
      String(t.getMonth() + 1).padStart(2, '0') +
      String(t.getDate()).padStart(2, '0') + '-' +
      String(Math.floor(Math.random() * 9000) + 1000);
  }
  // ★ v7.0.3 服务需求单号（与专案需求单区分前缀）
  function _svcOrderNo(){
    var t = new Date();
    return 'WPG-HR-SVC-' + t.getFullYear() +
      String(t.getMonth() + 1).padStart(2, '0') +
      String(t.getDate()).padStart(2, '0') + '-' +
      String(Math.floor(Math.random() * 9000) + 1000);
  }
  // ★ v7.0.3 需求单统一收件邮箱
  var REQ_MAIL_TO = 'yuki.ye@cn.wpgholdings.com';
  // ★ v7.0.5 需求单邮件抬头 —— 邮件「主题」与「正文首行」均以此开头
  var REQ_MAIL_HEADER = '中国区人资服务接单中心';
  // ★ v7.0.4 「点击直接发送」：不再依赖本机邮件客户端多按一次发送。
  //   纯前端站点没有后端，无法自行投递 SMTP，因此改走「邮件中继」HTTP 接口（FormSubmit，免注册）。
  //   · 首次使用：中继会往收件箱发一封激活邮件，点一次激活链接后长期有效；
  //     之后每次点击 = 直接发送。
  //   · 如公司提供内部接口 / SMTP 网关，只需把 MAIL_RELAY 换成该地址，其余逻辑不变。
  //   · 中继不可用时自动降级为唤起本机邮件客户端（mailto），保证功能不失效。
  var MAIL_RELAY = 'https://formsubmit.co/ajax/' + REQ_MAIL_TO;
  function _mailtoUrl(subject, body){
    return 'mailto:' + REQ_MAIL_TO +
      '?subject=' + encodeURIComponent(subject || '') +
      '&body=' + encodeURIComponent(body || '');
  }
  function _openMailClient(subject, body){
    var url = _mailtoUrl(subject, body);
    try{
      var a = document.createElement('a');
      a.href = url;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }catch(e){
      try{ window.location.href = url; }catch(e2){ /* 被浏览器拦截时静默降级 */ }
    }
    return url;
  }
  // ★ v7.0.4 走中继接口直接投递邮件（返回 Promise<{ok,status,text,message,needActivation}>）
  function _mailRelaySend(subject, body){
    if (typeof fetch !== 'function') return Promise.reject(new Error('当前浏览器不支持 fetch'));
    return fetch(MAIL_RELAY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        _subject: subject || ('【HR 需求单】' + REQ_MAIL_TO),
        _template: 'box',
        _captcha: 'false',
        '抬头': REQ_MAIL_HEADER,
        '收件人': REQ_MAIL_TO,
        '主题': subject || '',
        '需求单内容': body || ''
      })
    }).then(function(r){
      return r.text().then(function(t){
        var j = null; try { j = JSON.parse(t); } catch (e) { }
        var ok = !!r.ok && !!j && (j.success === 'true' || j.success === true);
        var msg = (j && j.message) ? String(j.message) : String(t || '');
        msg = msg.replace(/\s+/g, ' ').trim();
        // ★ v7.0.5 中继「首次使用需激活」会以 success:false 返回：识别为待激活状态，
        //   而不是当作「通道不可用」，避免界面弹出原始 JSON 报错。
        var needAct = !ok && /activat/i.test(msg);
        return { ok: ok, status: r.status, json: j, text: t, message: msg, needActivation: needAct };
      });
    });
  }
  // ★ v7.0.5 把中继返回的原始报文翻译成一句人话（不把 JSON 原样抛到界面）
  function _relayReason(res){
    if (!res) return '未知原因';
    if (res.status === 429) return '发送过于频繁，请稍后再试';
    var msg = String(res.message || '').replace(/\s+/g, ' ').trim();
    if (/activat/i.test(msg)) return '中继待激活';
    // 以 file:// 直接打开本地 html 时，中继会拒绝（无来源站点）
    if (/web server|HTML files/i.test(msg)) return '当前以本地文件方式打开，请改用线上网址访问后再发送';
    if (/origin|referer|domain|not allowed/i.test(msg)) return '中继不认可当前站点来源';
    if (msg) return 'HTTP ' + res.status + '：' + msg.slice(0, 60);
    return 'HTTP ' + res.status;
  }
  // ★ v7.0.4 统一投递入口：优先「直接发送」，失败自动降级 mailto，功能不会失效
  //   ★ v7.0.5 主题统一加邮件抬头「中国区人资服务接单中心」
  //   ui: { btn: 按钮元素, hint: 提示函数(msg, kind) }
  function _deliverReqMail(subject, body, ui){
    var btn = ui && ui.btn;
    var hint = ui && ui.hint;
    var original = btn ? btn.textContent : '';
    // 抬头 + 原标题（原标题已带【】，此处直接并列，避免出现【】【】）
    var mailSubject = '【' + REQ_MAIL_HEADER + '】' + String(subject || 'HR 需求单');
    function _busy(t){ if (btn){ btn.disabled = true; btn.textContent = t; } }
    function _done(t){
      if (!btn) return;
      btn.disabled = false; btn.textContent = t;
      setTimeout(function(){ if (btn) btn.textContent = original; }, 2200);
    }
    if (hint) hint('⏳ 正在直接发送到 ' + REQ_MAIL_TO + ' …', '');
    _busy('⏳ 发送中…');
    return _mailRelaySend(mailSubject, body).then(function(res){
      if (res.ok){
        _done('✔ 已发送');
        if (hint) hint('✔ 邮件已直接发送到 ' + REQ_MAIL_TO + '（抬头：' + REQ_MAIL_HEADER + '）', 'ok');
        return true;
      }
      if (res.needActivation){
        // 中继首次使用需收件人点一次激活链接；本次同时唤起本机客户端兜底，不丢件
        _openMailClient(mailSubject, body);
        _done('✉️ 发送邮件');
        if (hint) hint('📮 直发通道待激活：中继已向 ' + REQ_MAIL_TO + ' 发出激活邮件，请到该邮箱点一次激活链接'
          + '（建议把 submissions@formsubmit.co 加入安全发件人）。激活后即可一键直发；本次已同时唤起本机邮件客户端兜底。', 'warn');
        return false;
      }
      throw new Error(_relayReason(res));
    }).catch(function(err){
      // 降级：唤起本机邮件客户端（mailto），用户只需再点一次发送
      _openMailClient(mailSubject, body);
      _done('✉️ 发送邮件');
      if (hint) hint('⚠️ 直发通道暂时不可用（' + (err && err.message ? err.message : err) + '），已唤起本机邮件客户端，点一次发送即可。', 'err');
      return false;
    });
  }
  // ★ v7.0.3 通用剪贴板复制：优先 Clipboard API，降级 execCommand
  function _copyFromTextarea(ta, onOk, onFail){
    var fallback = function(){
      try{
        ta.removeAttribute('readonly');
        ta.select();
        document.execCommand('copy');
        ta.setAttribute('readonly', 'readonly');
        if(onOk) onOk();
      }catch(e){
        ta.setAttribute('readonly', 'readonly');
        if(onFail) onFail();
      }
    };
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(ta.value).then(function(){ if(onOk) onOk(); }, fallback);
      } else { fallback(); }
    }catch(e){ fallback(); }
  }
  // ★ v7.0.3 服务需求单纯文本（依据计费区已勾选服务生成）
  // ★ v7.0.5 与专案需求单同构：正文首行加邮件抬头 + 增「委托与联系信息」；
  //   需求内容自动代入上方已选服务，预算报价自动带入加总价格。
  function buildServiceReqText(orderNo, dateStr, info){
    info = info || {};
    var lines = [];
    lines.push(REQ_MAIL_HEADER);                  // ← 邮件抬头
    lines.push('【HR 服务需求单】' + orderNo);
    lines.push('日期：' + dateStr);
    lines.push('');
    lines.push('一、服务需求清单');
    var total = 0, n = 0;
    // 注意：selectedServices 是 Set，Set 无 length 属性，
    // 不能用 Array.prototype.slice.call 转数组（会得到空数组），须显式收集。
    var idxList = [];
    state.selectedServices.forEach(function(v){ idxList.push(v); });
    idxList.sort(function(a, b){ return a - b; });
    idxList.forEach(function(idx){
      var s = QUOTE_SERVICES[idx];
      if(!s) return;
      n++;
      var qty = state.serviceQuantities[idx] || 1;
      var sub = (Number(s.price) || 0) * qty;
      total += sub;
      // 注意：formatPriceWithUnit 返回的是 HTML，纯文本需求单需另行拼接
      var specTxt = String(s.spec || '').trim();
      var priceTxt = (s.price == null || s.price === '')
        ? '按需定制'
        : ('¥' + s.price + (specTxt ? '/' + specTxt : ''));
      lines.push(n + '. ' + (s.item || s.content) + '　× ' + qty + '　' +
        priceTxt + '　小计 ¥' + fmt(sub, 0));
    });
    if(n === 0) lines.push('（尚未勾选任何服务）');
    lines.push('');
    lines.push('二、预算报价');
    var feeType = state.feeType || 'total';
    if(feeType === 'custom'){
      lines.push('费用类型：自定义金额');
      lines.push('金额：¥' + (state.customFee || '0'));
    } else if(feeType === 'monthly'){
      lines.push('费用类型：月度预估费用');
      lines.push('金额：¥' + fmt(total / 12, 0) + '（' + n + ' 项服务 ÷ 12 月）');
    } else {
      lines.push('费用类型：服务报价总计');
      lines.push('金额：¥' + fmt(total, 0) + '（已选 ' + n + ' 项服务）');
    }
    lines.push('');
    // ★ v7.0.5 第三段：委托与联系信息（与专案需求单同构）
    lines.push('三、委托与联系信息');
    lines.push('联系人：' + (info.name || '待确认'));
    lines.push('联系方式：' + (info.contact || '待确认'));
    lines.push('期望交付时间：' + (info.due ? _cnDate(info.due) : '待确认'));
    lines.push('备注：' + (info.remark || '无'));
    lines.push('');
    lines.push('受理单位：中国人资服务处');
    lines.push('说明：本单为服务需求登记，正式报价由人资部专家评估后单独提供。');
    return lines.join('\n');
  }
  // ★ v7.0.5 服务需求单「需求内容」自动摘要（代入上方已选服务，作为需求内容栏与打印版正文）
  function _svcReqContentDigest(){
    var out = [];
    var idxList = [];
    state.selectedServices.forEach(function(v){ idxList.push(v); });
    idxList.sort(function(a, b){ return a - b; });
    var n = 0;
    idxList.forEach(function(idx){
      var s = QUOTE_SERVICES[idx];
      if(!s) return;
      n++;
      var qty = state.serviceQuantities[idx] || 1;
      var specTxt = String(s.spec || '').trim();
      out.push(n + '. ' + (s.item || s.content) + '　× ' + qty +
        (specTxt ? '（' + specTxt + '）' : ''));
    });
    if(n === 0) out.push('（尚未勾选任何服务）');
    return out.join('\n');
  }
  function _escHtml(s){
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  // 生成可打印的专案需求单 HTML
  function buildProjectReqPrintHTML(d, exp, orderNo, dateStr){
    var rows = [
      ['委托专家', _escHtml(exp.name) + '（' + _escHtml(exp.role) + '）'],
      ['计费方式', '单一专案内容，价格另算'],
      ['联系人', _escHtml(d.name)],
      ['联系方式', _escHtml(d.contact)],
      ['期望交付时间', _escHtml(_cnDate(d.due))],
      ['预算范围 / 备注', _escHtml(d.budget || '待确认')]
    ];
    var trs = rows.map(function(r){
      return '<tr><th>' + r[0] + '</th><td>' + r[1] + '</td></tr>';
    }).join('');
    return '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">' +
      '<title>' + _escHtml(orderNo) + ' 专案需求单</title><style>' +
      '*{box-sizing:border-box;}' +
      'body{font-family:"Microsoft YaHei","PingFang SC","Hiragino Sans GB","Noto Sans CJK SC",sans-serif;' +
        'color:#1e293b;margin:0;padding:34px 42px;}' +
      '.noprint{margin-bottom:18px;}' +
      '.noprint button{padding:10px 24px;font-size:13px;border-radius:8px;border:none;' +
        'background:#f59e0b;color:#fff;font-weight:700;cursor:pointer;}' +
      '.band{height:6px;background:linear-gradient(90deg,#f59e0b,#fcd34d);border-radius:3px;margin-bottom:20px;}' +
      'h1{font-size:25px;margin:0 0 6px;color:#0f172a;letter-spacing:2px;}' +
      '.sub{font-size:12.5px;color:#64748b;margin-bottom:18px;}' +
      '.meta{font-size:12.5px;color:#475569;margin-bottom:24px;}' +
      '.meta b{color:#0f172a;}' +
      '.sec{font-size:13.5px;font-weight:700;color:#0f172a;margin:0 0 9px;padding-left:9px;border-left:4px solid #f59e0b;}' +
      '.desc{border:1px solid #e2e8f0;border-radius:6px;padding:13px 15px;font-size:13px;line-height:1.9;' +
        'white-space:pre-wrap;word-break:break-word;margin-bottom:24px;background:#fffdf7;min-height:64px;}' +
      'table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;}' +
      'th{width:150px;text-align:left;background:#f8fafc;color:#475569;font-weight:600;' +
        'padding:10px 13px;border:1px solid #e2e8f0;vertical-align:top;}' +
      'td{padding:10px 13px;border:1px solid #e2e8f0;white-space:pre-wrap;word-break:break-word;}' +
      '.foot{font-size:11.5px;color:#64748b;line-height:1.85;border-top:1px dashed #cbd5e1;padding-top:14px;}' +
      '@page{margin:12mm;}' +
      '@media print{.noprint{display:none;} body{padding:0;}}' +
      '</style></head><body>' +
      '<div class="noprint"><button onclick="window.print()">🖨️ 打印 / 另存为 PDF</button></div>' +
      '<div class="band"></div>' +
      '<h1>专案需求单</h1>' +
      '<div class="sub">中国人资服务处</div>' +
      '<div class="meta">单号：<b>' + _escHtml(orderNo) + '</b> &nbsp;|&nbsp; 日期：<b>' + _escHtml(dateStr) + '</b></div>' +
      '<div class="sec">一、专案需求说明</div>' +
      '<div class="desc">' + _escHtml(d.desc) + '</div>' +
      '<div class="sec">二、委托与联系信息</div>' +
      '<table>' + trs + '</table>' +
      '<div class="foot">受理单位：中国人资服务处<br>' +
        '说明：本单为专案需求登记，正式报价由人资部专家评估后单独提供。</div>' +
      '</body></html>';
  }
  // ★ v7.0.5 生成可打印的服务需求单 HTML
  //   需求内容 = 上方已勾选服务（自动代入）；预算报价 = 上方加总价格（自动带入）
  function buildServiceReqPrintHTML(orderNo, dateStr, info){
    info = info || {};
    var idxList = [];
    state.selectedServices.forEach(function(v){ idxList.push(v); });
    idxList.sort(function(a, b){ return a - b; });
    var total = 0, n = 0;
    var svcTrs = '';
    idxList.forEach(function(idx){
      var s = QUOTE_SERVICES[idx];
      if(!s) return;
      n++;
      var qty = state.serviceQuantities[idx] || 1;
      var sub = (Number(s.price) || 0) * qty;
      total += sub;
      var specTxt = String(s.spec || '').trim();
      var priceTxt = (s.price == null || s.price === '') ? '按需定制'
        : ('¥' + s.price + (specTxt ? '/' + specTxt : ''));
      svcTrs += '<tr><td class="c">' + n + '</td><td>' + _escHtml(s.item || s.content) + '</td>' +
        '<td class="c">' + qty + '</td><td class="c">' + _escHtml(priceTxt) + '</td>' +
        '<td class="r">¥' + _escHtml(fmt(sub, 0)) + '</td></tr>';
    });
    if(!n) svcTrs = '<tr><td colspan="5" class="c">（尚未勾选任何服务）</td></tr>';
    var feeType = state.feeType || 'total';
    var quoteTxt;
    if(feeType === 'custom') quoteTxt = '¥' + (state.customFee || '0') + '（自定义金额）';
    else if(feeType === 'monthly') quoteTxt = '¥' + fmt(total / 12, 0) + '（月度预估 · ' + n + ' 项服务 ÷ 12 月）';
    else quoteTxt = '¥' + fmt(total, 0) + '（服务报价总计 · 已选 ' + n + ' 项服务）';

    var infoRows = [
      ['联系人', _escHtml(info.name || '待确认')],
      ['联系方式', _escHtml(info.contact || '待确认')],
      ['期望交付时间', _escHtml(info.due ? _cnDate(info.due) : '待确认')],
      ['预算报价', quoteTxt],
      ['备注', _escHtml(info.remark || '无')]
    ];
    var infoTrs = infoRows.map(function(r){
      return '<tr><th>' + r[0] + '</th><td>' + r[1] + '</td></tr>';
    }).join('');

    return '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">' +
      '<title>' + _escHtml(orderNo) + ' 服务需求单</title><style>' +
      '*{box-sizing:border-box;}' +
      'body{font-family:"Microsoft YaHei","PingFang SC","Hiragino Sans GB","Noto Sans CJK SC",sans-serif;' +
        'color:#1e293b;margin:0;padding:34px 42px;}' +
      '.noprint{margin-bottom:18px;}' +
      '.noprint button{padding:10px 24px;font-size:13px;border-radius:8px;border:none;' +
        'background:#4f46e5;color:#fff;font-weight:700;cursor:pointer;}' +
      '.band{height:6px;background:linear-gradient(90deg,#4f46e5,#a5b4fc);border-radius:3px;margin-bottom:20px;}' +
      'h1{font-size:25px;margin:0 0 6px;color:#0f172a;letter-spacing:2px;}' +
      '.sub{font-size:12.5px;color:#64748b;margin-bottom:18px;}' +
      '.meta{font-size:12.5px;color:#475569;margin-bottom:24px;}' +
      '.meta b{color:#0f172a;}' +
      '.sec{font-size:13.5px;font-weight:700;color:#0f172a;margin:0 0 9px;padding-left:9px;border-left:4px solid #4f46e5;}' +
      'table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;}' +
      'th{width:150px;text-align:left;background:#f8fafc;color:#475569;font-weight:600;' +
        'padding:10px 13px;border:1px solid #e2e8f0;vertical-align:top;}' +
      'td{padding:10px 13px;border:1px solid #e2e8f0;white-space:pre-wrap;word-break:break-word;}' +
      'thead th{width:auto;background:#eef2ff;color:#3730a3;}' +
      'td.c{text-align:center;white-space:nowrap;}td.r{text-align:right;white-space:nowrap;font-weight:600;}' +
      '.foot{font-size:11.5px;color:#64748b;line-height:1.85;border-top:1px dashed #cbd5e1;padding-top:14px;}' +
      '@page{margin:12mm;}' +
      '@media print{.noprint{display:none;} body{padding:0;}}' +
      '</style></head><body>' +
      '<div class="noprint"><button onclick="window.print()">🖨️ 打印 / 另存为 PDF</button></div>' +
      '<div class="band"></div>' +
      '<h1>服务需求单</h1>' +
      '<div class="sub">中国人资服务处</div>' +
      '<div class="meta">单号：<b>' + _escHtml(orderNo) + '</b> &nbsp;|&nbsp; 日期：<b>' + _escHtml(dateStr) + '</b>' +
        ' &nbsp;|&nbsp; 呈送：<b>中国区人资服务接单中心</b></div>' +
      '<div class="sec">一、服务需求清单</div>' +
      '<table><thead><tr><th>#</th><th>服务项目</th><th>数量</th><th>单价</th><th>小计</th></tr></thead>' +
        '<tbody>' + svcTrs + '</tbody></table>' +
      '<div class="sec">二、预算报价</div>' +
      '<table><tr><th>费用类型</th><td>' + (feeType === 'custom' ? '自定义金额'
        : (feeType === 'monthly' ? '月度预估费用' : '服务报价总计')) + '</td></tr>' +
        '<tr><th>加总报价</th><td><b>' + quoteTxt + '</b></td></tr></table>' +
      '<div class="sec">三、委托与联系信息</div>' +
      '<table>' + infoTrs + '</table>' +
      '<div class="foot">受理单位：中国人资服务处<br>' +
        '说明：本单为服务需求登记，正式报价由人资部专家评估后单独提供。</div>' +
      '</body></html>';
  }

  // ═══════════ ★ v7.0.4 中文 PDF 字形支持 ═══════════
  // 乱码根因：jsPDF 内置字体只有 Helvetica 等 14 种西文字体，没有中文字形，
  //   doc.text('中文') 会画成乱码/空白。
  // 解决方案：随站点附带「按需子集化」的开源思源黑体（Noto Sans SC 子集，OFL 许可），
  //   仅在点击生成 PDF 时按需拉取（约 480KB/字重，同源、可被浏览器缓存），
  //   再用 addFileToVFS + addFont 以 Identity-H 方式嵌入 → 输出真正的矢量中文 PDF。
  var PDF_CJK_FONT = {
    regular: 'assets/pdf-cjk-regular.ttf',
    bold: 'assets/pdf-cjk-bold.ttf',
    name: 'PDFCJK'
  };
  var _pdfFontB64 = null;            // 已加载的字体（base64）缓存
  var _pdfFontRegistered = false;    // jsPDF 字库是全局的，只注册一次

  function _bufToBase64(buf){
    var bytes = new Uint8Array(buf), bin = '', CHUNK = 0x8000;
    for (var i = 0; i < bytes.length; i += CHUNK){
      bin += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + CHUNK, bytes.length)));
    }
    return btoa(bin);
  }
  function _fetchFontB64(url){
    return fetch(url).then(function(r){
      if (!r.ok) throw new Error('字体请求失败 HTTP ' + r.status);
      return r.arrayBuffer();
    }).then(_bufToBase64);
  }
  function _loadPdfCjkFont(){
    if (_pdfFontB64) return Promise.resolve(_pdfFontB64);
    if (typeof fetch !== 'function') return Promise.reject(new Error('当前浏览器不支持 fetch'));
    return Promise.all([
      _fetchFontB64(PDF_CJK_FONT.regular),
      _fetchFontB64(PDF_CJK_FONT.bold)
    ]).then(function(res){
      _pdfFontB64 = { regular: res[0], bold: res[1] };
      return _pdfFontB64;
    });
  }
  // 注册中文字库到 jsPDF，并把文档当前字体切到中文
  // 注意：按「实例」判断是否已注册（jsPDF 字库挂在 API 上，跨实例共享），
  //   用 getFontList() 探测比全局布尔标记更稳，避免误判导致字体没注册就使用。
  function _applyPdfCjkFont(doc){
    if (!_pdfFontB64) return false;
    var need = false;
    try {
      var list = (typeof doc.getFontList === 'function') ? doc.getFontList() : null;
      need = !(list && list[PDF_CJK_FONT.name]);
    } catch (e) {
      need = !_pdfFontRegistered;
    }
    if (need){
      doc.addFileToVFS('pdf-cjk-regular.ttf', _pdfFontB64.regular);
      doc.addFont('pdf-cjk-regular.ttf', PDF_CJK_FONT.name, 'normal');
      doc.addFileToVFS('pdf-cjk-bold.ttf', _pdfFontB64.bold);
      doc.addFont('pdf-cjk-bold.ttf', PDF_CJK_FONT.name, 'bold');
      _pdfFontRegistered = true;
    }
    doc.setFont(PDF_CJK_FONT.name, 'normal');
    return true;
  }
  // 十六进制色值 → RGB 三元组
  // 注意：getPricingType().color 是 '#ee6666' 这样的**字符串**，
  //   旧代码直接取 color[0]/color[1]/color[2] 会得到 '#','e','e'，
  //   使 PDF 内容流里写出非法颜色操作符，导致部分阅读器解析失败。
  function _hexToRgb(hex){
    var h = String(hex == null ? '' : hex).replace('#', '').trim();
    if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return [100, 116, 139];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  // 兜底：字体拉取失败时改用浏览器打印（中文由浏览器渲染，绝不乱码）
  function _serviceQuotePrintFallback(){
    var today = new Date();
    var orderNo = 'WPG-HR-' + today.getFullYear() +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0') + '-' +
      String(Math.floor(Math.random() * 9000) + 1000);
    var rows = '', total = 0;
    var idxList = []; state.selectedServices.forEach(function(v){ idxList.push(v); });
    idxList.sort(function(a, b){ return a - b; });
    idxList.forEach(function(idx, i){
      var s = QUOTE_SERVICES[idx]; if(!s) return;
      var qty = state.serviceQuantities[idx] || 1;
      var sub = (Number(s.price) || 0) * qty; total += sub;
      var spec = String(s.spec || '').trim();
      var modName = String(s.module || '').replace(/服务模块$/, '');
      rows += '<tr><td>' + (i + 1) + '</td><td>' + _escHtml(s.item || s.content) + '</td>' +
        '<td>' + _escHtml(modName) + '</td><td>' + getPricingType(s).label + '</td>' +
        '<td class="r">' + (s.price == null || s.price === '' ? '按需定制' : ('¥' + s.price + (spec ? '/' + _escHtml(spec) : ''))) + '</td>' +
        '<td class="c">' + qty + '</td><td class="r strong">¥' + fmt(sub, 0) + '</td></tr>';
    });
    var feeType = state.feeType || 'total';
    var feeLabel = ({ total: '服务报价总计', monthly: '月度预估费用', custom: '自定义金额' })[feeType] || '';
    var feeVal = feeType === 'custom' ? ('¥' + (state.customFee || '0'))
      : (feeType === 'monthly' ? ('¥' + fmt(total / 12, 0)) : ('¥' + fmt(total, 0)));
    var html = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">' +
      '<title>' + _escHtml(orderNo) + ' HR 服务报价清单</title><style>' +
      'body{font-family:"Microsoft YaHei","PingFang SC","Noto Sans CJK SC",sans-serif;color:#1e293b;margin:0;padding:30px 36px;}' +
      '.noprint{margin-bottom:16px;}.noprint button{padding:10px 24px;font-size:13px;border-radius:8px;border:none;background:#4f46e5;color:#fff;font-weight:700;cursor:pointer;}' +
      '.band{height:6px;background:linear-gradient(90deg,#4f46e5,#818cf8);border-radius:3px;margin-bottom:18px;}' +
      'h1{font-size:24px;margin:0 0 6px;color:#0f172a;letter-spacing:2px;}.sub{font-size:12.5px;color:#64748b;margin-bottom:8px;}' +
      '.meta{font-size:12px;color:#64748b;margin-bottom:20px;}' +
      'table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px;}' +
      'th{background:#f1f5f9;color:#475569;font-weight:600;padding:8px 9px;border:1px solid #e2e8f0;text-align:left;white-space:nowrap;}' +
      'td{padding:7px 9px;border:1px solid #e2e8f0;}.r{text-align:right;}.c{text-align:center;}.strong{color:#dc2626;font-weight:700;}' +
      '.sum{margin-top:14px;padding:14px 18px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;}' +
      '.sum .v{font-size:20px;font-weight:800;color:#dc2626;}' +
      '.foot{margin-top:20px;font-size:11px;color:#64748b;line-height:1.9;border-top:1px dashed #cbd5e1;padding-top:12px;}' +
      '@page{margin:12mm;}@media print{.noprint{display:none;}body{padding:0;}}' +
      '</style></head><body>' +
      '<div class="noprint"><button onclick="window.print()">🖨️ 打印 / 另存为 PDF</button></div>' +
      '<div class="band"></div><h1>HR 服务报价清单</h1>' +
      '<div class="sub">中国人资服务处</div>' +
      '<div class="meta">单号：' + _escHtml(orderNo) + ' &nbsp;|&nbsp; 日期：' + _escHtml(_todayCN()) +
        (state.advisorPerson ? (' &nbsp;|&nbsp; 专属顾问：' + _escHtml(state.advisorPerson)) : '') + '</div>' +
      '<table><thead><tr><th>#</th><th>服务名称</th><th>所属模块</th><th>计费模式</th><th style="text-align:right">单价</th><th style="text-align:center">数量</th><th style="text-align:right">小计</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table>' +
      '<div class="sum"><span>费用类型：' + feeLabel + '（已选 ' + state.selectedServices.size + ' 项服务）</span><span class="v">' + feeVal + '</span></div>' +
      '<div class="foot">受理单位：中国人资服务处<br>' +
        '说明：以上报价为标准参考价格，实际费用根据企业规模、服务频次及定制需求可能有所调整。<br>' +
        '本清单由 HR 仪表板系统自动生成，有效期 30 天。</div>' +
      '</body></html>';
    var pw = window.open('', '_blank');
    if (!pw){ alert('浏览器拦截了打印窗口，请允许弹窗后重试'); return; }
    pw.document.write(html);
    pw.document.close();
  }

  function generateServiceQuotePDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) { alert('PDF 库未加载，请刷新页面重试'); return; }
    if (state.selectedServices.size === 0) { alert('请先勾选至少一项服务再生成清单'); return; }

    var btn = document.querySelector('.svc-pdf-btn');
    var btnTxt = btn ? btn.innerHTML : '';
    function _restore(){ if (btn){ btn.disabled = false; btn.innerHTML = btnTxt; } }
    if (btn){ btn.disabled = true; btn.innerHTML = '⏳ 正在生成 PDF…'; }

    _loadPdfCjkFont().then(function(){
      try {
        var built = _buildServiceQuotePdf();
        built.doc.save(built.filename);
      } catch (e) {
        alert('PDF 生成失败：' + (e && e.message ? e.message : e));
      }
      _restore();
    }, function(err){
      _restore();
      alert('中文字体加载失败：' + (err && err.message ? err.message : err) +
        '\n\n已自动改用「打印 / 另存为 PDF」方式导出（中文同样不会乱码）。');
      try { _serviceQuotePrintFallback(); } catch (e) { /* 兜底失败时静默 */ }
    });
  }

  function _buildServiceQuotePdf() {
    var JSPDF = window.jspdf.jsPDF;
    // putOnlyUsedFonts：只嵌入实际用到的字形，避免 PDF 体积过大
    var doc = new JSPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', putOnlyUsedFonts: true });
    _applyPdfCjkFont(doc);
    var pageW = doc.internal.pageSize.getWidth();
    var pageH = doc.internal.pageSize.getHeight();
    var margin = 15;
    var contentW = pageW - margin * 2;
    var y = margin;

    // ── 颜色定义 ──
    var primaryColor = [79, 70, 229];     // indigo-600
    var accentColor  = [220, 38, 38];      // red-600
    var textDark     = [30, 41, 59];       // slate-800
    var textMuted    = [100, 116, 139];    // slate-500
    var lineLight    = [226, 232, 240];    // slate-200

    // ── 1. 抬头区 ──
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageW, 42, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('HR 服务报价清单', pageW / 2, 18, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text('中国人资服务处', pageW / 2, 27, { align: 'center' });

    var today = new Date();
    var dateStr = today.getFullYear() + '年' + (today.getMonth() + 1) + '月' + today.getDate() + '日';
    doc.setFontSize(9);
    doc.setTextColor(200, 210, 230);
    doc.text('单号：WPG-HR-' + today.getFullYear() + String(today.getMonth() + 1).padStart(2, '0') + String(today.getDate()).padStart(2, '0') + '-' + String(Math.floor(Math.random() * 9000) + 1000), margin, 37);
    doc.text('日期：' + dateStr, pageW - margin, 37, { align: 'right' });

    y = 50;

    // ── 2. 顾问信息卡片 ──
    if (state.advisorPerson) {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, contentW, 18, 2, 2, 'F');
      doc.setTextColor(...textDark);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('专属顾问', margin + 5, y + 7);

      doc.setFont(undefined, 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...primaryColor);
      doc.text(state.advisorPerson, margin + 5, y + 14);

      var advProf = getAdvisorProfile(state.advisorPerson);
      if (advProf && advProf.topMod) {
        doc.setTextColor(...textMuted);
        doc.setFontSize(8);
        doc.text('主要强项：' + advProf.topMod, margin + 55, y + 14);
      }
      y += 23;
    }

    // ── 3. 服务明细表 ──
    doc.setTextColor(...textDark);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('服务明细', margin, y); y += 3;

    // 表头
    var colX = [margin, margin + 6, margin + 58, margin + 108, margin + 138, margin + 158];
    var colW = [6, 52, 50, 30, 20, contentW - 158]; // 序号|名称|计费模式|单价|数量|小计

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.setTextColor(...textMuted);
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('#', colX[0] + 1, y + 5);
    doc.text('服务名称', colX[1] + 1, y + 5);
    doc.text('计费模式', colX[2] + 1, y + 5);
    doc.text('单价', colX[3] + 1, y + 5);
    doc.text('数量', colX[4] + 1, y + 5);
    doc.text('小计', colX[5] + 1, y + 5);
    y += 8;

    // 按模块分组收集选中服务
    var selectedList = [];
    state.selectedServices.forEach(function(idx){
      selectedList.push({ idx: idx, svc: QUOTE_SERVICES[idx] });
    });
    // 按 module 排序
    selectedList.sort(function(a, b){ return (a.svc.module || '').localeCompare(b.svc.module || ''); });

    var grandTotal = 0;
    var currentModule = '';
    selectedList.forEach(function(row, ri){
      var s = row.svc;
      var qty = state.serviceQuantities[row.idx] || 1;
      var price = Number(s.price) || 0;
      var subtotal = price * qty;
      grandTotal += subtotal;

      var modName = (s.module || '').replace(/服务模块$/, '');
      if (modName !== currentModule) {
        currentModule = modName;
        // 模块分隔行
        if (ri > 0) { y += 1; doc.setDrawColor(...lineLight); doc.line(margin, y, margin + contentW, y); y += 2; }
        doc.setFillColor(238, 242, 255);
        doc.rect(margin, y, contentW, 5, 'F');
        doc.setTextColor(...primaryColor);
        doc.setFontSize(7.5);
        doc.setFont(undefined, 'bold');
        doc.text('▎ ' + modName, margin + 2, y + 3.5);
        y += 6;
      }

      // 数据行
      if (y > pageH - 35) { doc.addPage(); y = margin; } // 分页

      doc.setTextColor(...textDark);
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');

      doc.text(String(ri + 1), colX[0] + 1, y + 4);

      // 名称（截断过长）
      var name = (s.item || s.content || '').slice(0, 20);
      doc.text(name, colX[1] + 1, y + 4);

      // 计费模式标签
      var pt = getPricingType(s);
      var ptRgb = _hexToRgb(pt.color);
      doc.setTextColor(ptRgb[0], ptRgb[1], ptRgb[2]);
      doc.setFontSize(7);
      doc.text(pt.label, colX[2] + 1, y + 4);

      // 单价
      doc.setTextColor(...textDark);
      doc.setFontSize(8);
      var specStr = (s.spec || '').trim();
      var priceText = '¥' + price + (specStr ? '/' + specStr : '');
      doc.text(priceText, colX[3] + 1, y + 4, { width: colW[3] - 2, align: 'right' });

      // 数量
      doc.text(String(qty), colX[4] + 2, y + 4, { align: 'center' });

      // 小计
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...accentColor);
      doc.text('¥' + fmt(subtotal, 0), colX[5] + 1, y + 4, { width: colW[5] - 2, align: 'right' });

      y += 6.5;
    });

    y += 3;

    // ── 4. 费用汇总区 ──
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + contentW, y);
    y += 3;

    doc.setFillColor(250, 252, 255);
    doc.roundedRect(margin, y, contentW, 22, 2, 2, 'F');

    var feeType = state.feeType || 'total';
    var displayVal, displaySub;
    if (feeType === 'custom') { displayVal = '¥' + (state.customFee || '0'); displaySub = '自定义金额'; }
    else if (feeType === 'monthly') { displayVal = '¥' + fmt(grandTotal / 12, 0); displaySub = '月均费用（' + state.selectedServices.size + '项 ÷ 12月）'; }
    else { displayVal = '¥' + fmt(grandTotal, 0); displaySub = '已选 ' + state.selectedServices.size + ' 项服务'; }

    doc.setTextColor(...textMuted);
    doc.setFontSize(9);
    doc.text('费用类型：' + ({ total:'服务报价总计', monthly:'月度预估费用', custom:'自定义金额' })[feeType] || '', margin + 5, y + 8);

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...accentColor);
    doc.text(displayVal, pageW - margin, y + 12, { align: 'right' });

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...textMuted);
    doc.text(displaySub, pageW - margin, y + 18, { align: 'right' });

    y += 26;

    // ── 5. 备注与条款 ──
    if (y > pageH - 40) { doc.addPage(); y = margin; }

    doc.setTextColor(...textMuted);
    doc.setFontSize(7.5);
    var notes = [
      '备注：',
      '• 以上报价为标准参考价格，实际费用根据企业规模、服务频次及定制需求可能有所调整。',
      '• 「按人头/按户」类服务按实际人数或户数结算；「单次/项目」类服务以实际发生次数为准。',
      '• 本清单由 HR 仪表板系统自动生成，有效期 30 天。如有疑问请联系您的专属顾问。',
      ''
    ];
    notes.forEach(function(n){
      doc.text(n, margin, y); y += 3.5;
    });

    // ── 6. 页脚 ──
    var footerY = pageH - 12;
    doc.setDrawColor(...lineLight);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 3, margin + contentW, footerY - 3);
    doc.setTextColor(...textMuted);
    doc.setFontSize(7);
    doc.text('WPG Holdings Co., Ltd. · 大联大控股 · HR Shared Service Center', margin, footerY + 1);
    doc.text('本文件由 CN 区 HR 服务指标仪表板自动生成 · 第 ' + doc.internal.getNumberOfPages() + ' 页', pageW - margin, footerY + 1, { align: 'right' });

    // ── 文件名（保存动作由 generateServiceQuotePDF 负责） ──
    var filename = 'WPG-HR服务报价单_' + (state.advisorPerson || '全部') + '_' +
      today.getFullYear() + String(today.getMonth()+1).padStart(2,'0') + String(today.getDate()).padStart(2,'0') + '.pdf';
    return { doc: doc, filename: filename };
  }

  // ========== 第5页：炫彩介绍页 ==========
  function renderLanding() {
    var wrap = $('#page-landing'); if (!wrap) return; wrap.innerHTML = '';

    // ★ v6.4 从其他页返回时显示返回上一步按钮（三页完整导航）
    if (state.prevPage && state.prevPage !== 'landing') {
      wrap.appendChild(renderBackBtn([
        {label:'← 返回上一步', page:'__prev__'},
        {label:'介绍页', page:'landing'},
        {label:'服务展示', page:'services'},
        {label:'顾问页', page:'advisor'}
      ]));
    }

    // Hero 区
    var hero = el('div', 'land-hero');
    hero.innerHTML =
      '<div class="land-hero-bg"></div>' +
      '<div class="land-hero-content">' +
        '<div class="land-badge">🚀 WPG HR 共享服务中心</div>' +
        '<h1 class="land-title">专业 · 高效<br><span class="land-highlight">值得信赖</span> 的 HR 服务伙伴</h1>' +
        '<p class="land-subtitle">数据驱动 · 合规保障 · 灵活响应 · 持续增值</p>' +
        '<div class="land-cta-row">' +
          '<button class="land-btn land-btn-primary" onclick="document.querySelector(\'.tab[data-page=services]\').click()">📋 浏览服务目录</button>' +
          '<button class="land-btn land-btn-secondary" onclick="document.querySelector(\'.tab[data-page=advisor]\').click()">👥 选择您的顾问</button>' +
        '</div>' +
        '<div class="land-stats-row">' +
          '<div class="land-stat"><b>' + fmt(_heroTotalHours(), 0) + '+</b><span>累计交付工时</span></div>' +
          '<div class="land-stat"><b>' + _heroPricedCount() + '+</b><span>项可定价服务</span></div>' +
          '<div class="land-stat"><b>' + META.persons.length + '</b><span>位统计顾问</span></div>' +
          '<div class="land-stat"><b>' + EXPERT_TEAM.length + '</b><span>位专家（SDC / 专案）</span></div>' +
        '</div>' +
      '</div>';
    wrap.appendChild(hero);

    // 价值主张区（直接展示）
    var valueSec = el('div', 'land-section');
    valueSec.appendChild(el('h2', 'land-section-title', '💡 为什么选择我们'));
    var valueGrid = el('div', 'land-value-grid');
    [
      { icon: '⚡', title: '高效响应', desc: 'AI 智能客服 + 人工专员双轨协同，平均响应时间 < 2小时', color: '#5470c6', points: ['7×24 在线自助答疑','智能工单自动分派','SLA 可视化追踪'] },
      { icon: '🛡️', title: '合规保障', desc: '深耕劳动法规，覆盖全国 300+ 城市政策口径', color: '#91cc75', points: ['经济补偿金精准计算','仲裁风险前置预警','政策变更实时同步'] },
      { icon: '💰', title: '降本增效', desc: '从事务性工作中释放 HR 聚焦高价值战略工作', color: '#f59e0b', points: ['标准化流程减少 60% 重复工时','专案制管理提升产出质量','数据驱动的人力决策'] }
    ].forEach(function (vc) {
      var card = el('div', 'land-value-card'); card.style.borderTop = '4px solid ' + vc.color;
      card.innerHTML = '<div class="lvc-icon">' + vc.icon + '</div><h3 class="lvc-title">' + vc.title + '</h3><p class="lvc-desc">' + vc.desc + '</p><ul class="lvc-points">' + vc.points.map(function(p){ return '<li>' + p + '</li>'; }).join('') + '</ul>';
      valueGrid.appendChild(card);
    });
    valueSec.appendChild(valueGrid); wrap.appendChild(valueSec);

    // 服务版图区（直接展示）
    var svcSec = el('div', 'land-section');
    svcSec.appendChild(el('h2', 'land-section-title', '🗺️ 服务版图 — 点击选择您需要的服务'));
    var svcMap = el('div', 'land-svc-map');
    var modData = [
      { name: '社保公积金', icon: '🏠', count: 27, color: '#5470c6', mod: '社保公积金管理服务模块', desc: '账户管理/增减员/补缴退费/基数调整/待遇申领' },
      { name: '薪酬税务', icon: '💵', count: 8, color: '#91cc75', mod: '薪酬福利与税务管理服务模块', desc: '薪酬核算/个税申报/工资单/成本分摊' },
      { name: '劳动关系', icon: '📋', count: 21, color: '#fac858', mod: '劳动关系与证件办理服务模块', desc: '入离职/合同管理/证件办理/纠纷处理' },
      { name: '招聘培训', icon: '🎯', count: 15, color: '#ee6666', mod: '招聘与培训开发服务模块', desc: '招聘发布/面试安排/培训组织/人才盘点' },
      { name: '职称等级', icon: '🏆', count: 2, color: '#73c0de', mod: '职称', desc: '职称评审/技能认定/补贴申请' }
    ];
    modData.forEach(function (md) {
      var bubble = el('div', 'land-svc-bubble land-svc-clickable');
      bubble.style.borderColor = md.color;
      bubble.innerHTML = '<div class="lsb-icon">' + md.icon + '</div><div class="lsb-name">' + md.name + '</div><div class="lsb-count"><b>' + md.count + '</b> 项服务</div><div class="lsb-desc">' + md.desc + '</div>';
      // ★ 点击跳转到服务展示页并预选该模块（v7.0：统一入口，清掉顾问残留）
      bubble.addEventListener('click', function () {
        selectServiceModule(md.mod);
      });
      svcMap.appendChild(bubble);
    });
    svcSec.appendChild(svcMap); wrap.appendChild(svcSec);

    // CTA 底部
    var cta = el('div', 'land-cta');
    cta.innerHTML = '<h3>准备好开启 HR 服务转型了吗？</h3><p>点击上方气泡浏览服务目录，或从顶部导航选择您的专属顾问获取定制方案</p><button class="land-btn land-btn-primary" onclick="document.querySelector(\'.tab[data-page=services]\').click()">立即探索服务 →</button>';
    wrap.appendChild(cta);
  }

  // 颜色辅助函数
  function adjustColor(hex, amount) {
    var c = hex.replace('#','');
    var num = parseInt(c, 16);
    var r = Math.min(255, ((num >> 16) & 0xFF) + amount);
    var g = Math.min(255, ((num >> 8) & 0xFF) + amount);
    var b = Math.min(255, (num & 0xFF) + amount);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) | b).toString(16).slice(1);
  }

  // ========== ★ 第6页：顾问介绍页 ==========
  function renderAdvisor() {
    var wrap = $('#page-advisor'); if (!wrap) return; wrap.innerHTML = '';

    // 返回键（含返回上一步 + 三页完整导航）
    wrap.appendChild(renderBackBtn([
      {label:'← 返回上一步', page:'__prev__'},
      {label:'介绍页', page:'landing'},
      {label:'服务展示', page:'services'},
      {label:'顾问页', page:'advisor'}
    ]));

    var targetPerson = state.advisorPerson || META.persons[0];

    // ★ 顾问选择器（顶部横向滚动）
    var selector = el('div', 'advisor-selector');
    selector.innerHTML = '<div class="advisor-sel-label">👤 选择顾问：</div>';
    var selScroll = el('div', 'advisor-sel-scroll');
    META.persons.forEach(function (p) {
      var av = AVATAR_MAP[p] || { bg: '#999' };
      // ★ v6.5 去除顾问选择器按钮中的图标前缀，仅显示短名
      var btn = el('button', 'advisor-sel-btn' + (p === targetPerson ? ' active' : ''), p.split(' ')[0]);
      if (p === targetPerson) btn.style.borderColor = av.bg || '#999';
      btn.addEventListener('click', function () {
        state.advisorPerson = p;
        renderAdvisor();
      });
      selScroll.appendChild(btn);
    });
    // ★ v7.0 专家团队（SDC 共享中心专家 + 专案专家）加入选择器
    selScroll.appendChild(el('span', 'advisor-sel-divider', '｜专家'));
    EXPERT_TEAM.forEach(function (ex) {
      var eBtn = el('button', 'advisor-sel-btn advisor-sel-btn-expert' + (ex.name === targetPerson ? ' active' : ''), ex.name.split(' ')[0]);
      eBtn.setAttribute('data-expert', ex.name);
      if (ex.name === targetPerson) eBtn.style.borderColor = ex.color;
      eBtn.addEventListener('click', function () {
        state.advisorPerson = ex.name;
        renderAdvisor();
      });
      selScroll.appendChild(eBtn);
    });
    selector.appendChild(selScroll); wrap.appendChild(selector);

    // ★ v7.0 专家档案卡（SDC 共享中心专家 / 专案专家：无工时统计，改展示定位与可承接范围）
    var curExpertInfo = getExpertInfo(targetPerson);
    if (curExpertInfo && META.persons.indexOf(targetPerson) < 0) {
      var allPricedCnt = QUOTE_SERVICES.filter(function(s){ return s.price != null && s.price !== ''; }).length;
      var expCard = el('div', 'advisor-profile-card expert-profile-card');
      expCard.innerHTML =
        '<div class="ap-header" style="background:linear-gradient(135deg,' + curExpertInfo.color + ',' + adjustColor(curExpertInfo.color, 40) + ')">' +
          '<div class="ap-name">' + curExpertInfo.icon + ' ' + curExpertInfo.name + '</div>' +
          '<div class="ap-role">' + curExpertInfo.role + '</div>' +
        '</div>' +
        '<div class="ap-body">' +
          '<div class="expert-scope-box" style="border-left-color:' + curExpertInfo.color + '">' +
            '<div class="expert-scope-tag" style="color:' + curExpertInfo.color + '">' + curExpertInfo.tag + '</div>' +
            '<div class="expert-scope-note">' + curExpertInfo.note + '</div>' +
            '<div class="expert-scope-desc">' +
              (curExpertInfo.scope === 'all'
                ? '该专家属于 <b>SDC 共享服务中心</b>，作为统一服务窗口 <b>匹配所有业务方向</b>，可承接全部 <b>' + allPricedCnt + '</b> 项定价服务，无需按专精范围限制。'
                : '该专家提供的是 <b>单一专案内容</b>（' + curExpertInfo.role + '），采用 <b>专案制计价、价格另算</b>，不适用标准报价单。') +
            '</div>' +
            '<div class="expert-scope-desc">📌 说明：该专家为专案制/共享中心角色，<b>不参与日常工作量排行</b>，因此本页不显示工时统计资料。</div>' +
          '</div>' +
          '<div class="ap-cta"><button class="land-btn land-btn-primary expert-cta-btn">' +
            (curExpertInfo.scope === 'all' ? '查看全部可承接服务 (' + allPricedCnt + '项) →' : '查看专案服务说明 →') +
          '</button></div>' +
        '</div>';
      wrap.appendChild(expCard);
      expCard.querySelector('.expert-cta-btn').addEventListener('click', function () {
        state.svcModule = 'all';
        state.svcTagFilters = [];
        switchPage('services');
      });
      return;   // 专家无工时数据，跳过后续指标/图表渲染
    }

    // ★ 顾问详情卡
    var prof = getAdvisorProfile(targetPerson);
    var av = AVATAR_MAP[targetPerson] || { bg: '#999' };
    var avBg = av.bg || '#999';
    var icon = getPersonIcon(targetPerson);

    var profileCard = el('div', 'advisor-profile-card');
    profileCard.innerHTML =
      '<div class="ap-header" style="background:linear-gradient(135deg,' + avBg + ',' + adjustColor(avBg,40) + ')">' +
        '<div class="ap-name">' + targetPerson + '</div>' +
        '<div class="ap-role">' + icon.abbr + '专精 · ' + prof.months + '个月在岗</div>' +
      '</div>' +
      '<div class="ap-body">';
    wrap.appendChild(profileCard);
    var apBody = profileCard.querySelector('.ap-body');

    // 核心指标
    var metrics = el('div', 'ap-metrics');
    metrics.appendChild(advisorMetric('⏱️ 累计时长', fmt(prof.totalH, 1) + ' h', '日常 ' + fmt(prof.dailyH,1) + ' + 专案 ' + fmt(prof.projH,1)));
    metrics.appendChild(advisorMetric('📊 月均产出', fmt(prof.avgMonthly,1) + ' h/月', '覆盖 ' + prof.months + ' 个月'));
    metrics.appendChild(advisorMetric('📋 处理数量', fmt(prof.totalQty,0) + ' 件', '全量工作记录'));
    metrics.appendChild(advisorMetric('🤝 会议参与', fmt(prof.meetH, 1) + ' h', '跨部门协作'));
    apBody.appendChild(metrics);

    // ★ v5.4 亮点标签 — 可复选多选控件 + 服务匹配
    var highlights = getAdvisorHighlights(prof);
    var hlSec = el('div', 'ap-highlights');

    // ★ v5.6 个人主要强项（基于 topMod 经 HR_TO_QUOTE 对齐，置顶高亮显示）
    if(prof.topMod && HR_TO_QUOTE[prof.topMod] && HR_TO_QUOTE[prof.topMod].length) {
      var primaryQ = HR_TO_QUOTE[prof.topMod][0];
      var primaryLabel = QUOTE_LABEL[primaryQ] || prof.topMod;
      var primaryTag = primaryLabel + '专精';
      var primaryMatched = matchServicesByTags([primaryTag], prof);
      var primaryColors = {'社保公积金管理':'#5470c6','薪酬福利与税务管理':'#91cc75','劳动关系与证件办理':'#fac858','招聘与培训开发':'#ee6666','职称等级':'#73c0de'};
      var pColor = primaryColors[primaryLabel] || '#6366f1';
      var strengthBadge = el('div', 'ap-strength-badge');
      strengthBadge.style.background = 'linear-gradient(135deg,' + pColor + '22,' + pColor + '08)';
      strengthBadge.style.borderColor = pColor;
      strengthBadge.style.borderLeftWidth = '4px';
      strengthBadge.innerHTML =
        '<div class="ap-strength-icon">🏆</div>' +
        '<div class="ap-strength-body">' +
          '<div class="ap-strength-label" style="color:' + pColor + '">个人主要强项</div>' +
          '<div class="ap-strength-name">' + primaryLabel + '</div>' +
          '<div class="ap-strength-desc">基于工作量表判断，该顾问在「' + prof.topMod + '」方向投入工时最多，可承接 <b>' + primaryMatched.length + '</b> 项相关服务</div>' +
        '</div>';
      hlSec.appendChild(strengthBadge);
    }
    // ★ v6.7 简化：只保留个人主要强项，去除标签多选/匹配按钮区域
    apBody.appendChild(hlSec);

    // 模块分布饼图
    apBody.appendChild(el('div', 'ap-section-title', '📈 工作模块分布'));
    var modChartBox = chartBox('adv_mod_pie', '各模块工时占比');
    apBody.appendChild(modChartBox);

    // 月度趋势
    apBody.appendChild(el('div', 'ap-section-title', '📅 月度工时趋势'));
    var trendBox = chartBox('adv_trend', '月度工时趋势（日常+专案）');
    apBody.appendChild(trendBox);

    // TOP 细项
    apBody.appendChild(el('div', 'ap-section-title', '🎯 主要工作细项 TOP5'));
    var topList = el('div', 'ap-top-list');
    prof.topDetails.forEach(function(d, i){
      var row = el('div', 'ap-top-item');
      row.innerHTML = '<span class="ap-top-rank">#' + (i+1) + '</span><span class="ap-top-detail">' + d.detail + '</span><span class="ap-top-mod">' + d.module + '</span><span class="ap-top-hours">' + fmt(d.hours,1) + 'h</span>';
      topList.appendChild(row);
    });
    apBody.appendChild(topList);

    // ★ 联系 CTA（使用标签筛选跳转，带profile过滤）
    var ctaArea = el('div', 'ap-cta');
    var ctaMatched = matchServicesByTags(state.svcTagFilters, prof);
    ctaArea.innerHTML = '<button class="land-btn land-btn-primary ap-match-btn" onclick="document.querySelector(\'.tab[data-page=services]\').click()">查看 ' + targetPerson.split(' ')[0] + ' 可承接的服务' + (ctaMatched.length ? ' (' + ctaMatched.length + '项匹配)' : '') + ' →</button>';
    apBody.appendChild(ctaArea);

    // 渲染图表
    setTimeout(function(){
      // 模块饼图
      var modPieData = Object.keys(prof.modHours).map(function(m){
        return {name:m, value:Math.round(prof.modHours[m]*10)/10, itemStyle:{color:moduleColor(m)}};
      });
      safeSetOption('adv_mod_pie', {
        tooltip: {trigger:'item', formatter:'{b}: {c}h ({d}%)'}, legend:{bottom:0, textStyle:{fontSize:10}},
        series:[{type:'pie', radius:['35%','65%'], center:['50%','48%'], data:modPieData, label:{formatter:'{b}\n{d}%'}}]
      });
      // 月度趋势
      var personRows = RECORDS.filter(function(r){ return r.person === targetPerson; });
      var actYMs = activeYMs(personRows);
      var dData = actYMs.map(function(ym){ var s=0; personRows.forEach(function(r){ if(r.ym===ym&&r.type==='daily') s+=r.hours; }); return Math.round(s*10)/10; });
      var pData = actYMs.map(function(ym){ var s=0; personRows.forEach(function(r){ if(r.ym===ym&&r.type==='project') s+=r.hours; }); return Math.round(s*10)/10; });
      safeSetOption('adv_trend', {
        tooltip:{trigger:'axis', axisPointer:{type:'shadow'}}, legend:{top:0,textStyle:{fontSize:10}},
        grid:{left:50,right:16,top:36,bottom:28},
        xAxis:{type:'category',data:actYMs,axisLabel:{fontSize:9,rotate:actYMs.length>8?35:0}},
        yAxis:{type:'value',axisLabel:{fontSize:10}},
        series:[
          {name:'日常',type:'bar',stack:'t',data:dData,itemStyle:{color:DAILY_COLOR}},
          {name:'专案',type:'bar',stack:'t',data:pData,itemStyle:{color:PROJ_COLOR}}
        ]
      });
    }, 100);
  }

  function advisorMetric(icon, value, sub) {
    var m = el('div', 'ap-metric');
    m.innerHTML = '<div class="ap-metric-icon">' + icon + '</div><div class="ap-metric-value">' + value + '</div><div class="ap-metric-sub">' + sub + '</div>';
    return m;
  }

  // ========== 联动图表 ==========
  function drawServiceLinkCharts() {
    var modMap = {}; var allRows = baseFilter({});
    allRows.forEach(function (r) { if (!modMap[r.module]) modMap[r.module] = 0; modMap[r.module] += r.hours; });
    var mods = Object.keys(modMap).sort(); var hours = mods.map(function (m) { return Math.round(modMap[m] * 10) / 10; });
    safeSetOption('svc_module_hours', {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: function(v){return v+' h';} },
      grid: { left: 55, right: 16, top: 16, bottom: 28 },
      xAxis: { type: 'category', data: mods, axisLabel: { fontSize: 11, rotate: 18 } },
      yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
      series: [{ type: 'bar', data: hours, itemStyle: { color: function(p) { return moduleColor(mods[p.dataIndex]); } }, label: { show: true, position: 'top', fontSize: 10, formatter: '{c}' } }]
    });
    var personMods = {}; allRows.forEach(function (r) { if (!personMods[r.person]) personMods[r.person] = {}; personMods[r.person][r.module] = (personMods[r.person][r.module] || 0) + r.hours; });
    var plist = META.persons.slice();
    var pmData = plist.map(function (p) { var m = personMods[p] || {}; var top = Object.keys(m).sort(function(a,b){return m[b]-m[a]}); return { name: p, value: Math.round((m[top[0]]||0)*10)/10, module: top[0]||'-' }; }).sort(function(a,b){return b.value-a.value});
    safeSetOption('svc_person_svc', {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: function(v){return v+' h';} },
      grid: { left: 110, right: 30, top: 16, bottom: 20 },
      xAxis: { type: 'value', axisLabel: { fontSize: 10 } },
      yAxis: { type: 'category', data: pmData.map(function(x){return x.name;}), axisLabel: { fontSize: 11 } },
      series: [{ type: 'bar', data: pmData.map(function(x){return x.value;}), itemStyle: { color: function(p) { return moduleColor(pmData[p.dataIndex].module); } }, label: { show: true, position: 'right', fontSize: 10, formatter: function(p){ return pmData[p.dataIndex].module; } } }]
    });
  }

  // ========== 跳转 ==========
  function jumpToDetail(typeKey, module) { state.module = module || 'all'; state.detail = 'all'; if (typeKey === 'daily') { state.bu = 'all'; } syncDetailFilters(); switchPage(typeKey); }

  // ========== 过滤栏 ==========
  function renderFilterBar() {
    var bar = $('#filterbar'); bar.innerHTML = '';
    // ★ v6.7 仅在数据分析页显示筛选栏（总览/日常/专案），介绍/服务/顾问页不需要
    var dataPages = ['overview', 'daily', 'project'];
    if(dataPages.indexOf(state.page) < 0) { bar.style.display = 'none'; return; }
    bar.style.display = '';
    bar.appendChild(ymFilter());
    bar.appendChild(selectFilter('区域', META.regions, state.region, function (v) { state.region = v; }));
    bar.appendChild(selectFilter('HR模块', META.modules, state.module, function (v) { state.module = v; }));
    if (state.page === 'overview') { bar.appendChild(selectFilter('工作量类型', ['all', 'daily', 'project'], state.type, function (v) { state.type = v; }, { 'all': '全部(日常+专案)', 'daily': '仅日常类', 'project': '仅专案类' })); }
    if (state.page === 'daily') { bar.appendChild(selectFilter('BU', META.bus, state.bu, function (v) { state.bu = v; })); }
    var reset = el('button', 'btn-reset', '重置筛选');
    reset.addEventListener('click', function () {
      state.ym = 'all'; state.region = 'all'; state.module = 'all'; state.type = 'all';
      state.persons = new Set(); state.bu = 'all'; state.detail = 'all';
      state.dailyDetailSearch = ''; state.projDetailSearch = ''; state.d_page = 0; state.p_page = 0;
      state.svcModule = 'all'; state.svcSearch = ''; state.svcMode = 'priced'; state.svcHR = '';
      state.selectedServices = new Set(); state.serviceQuantities = {}; state.customHours = '';
      renderSidebar(); renderFilterBar(); updateAll();
    });
    bar.appendChild(reset);
    var apply = el('button', 'btn-apply', '应用筛选'); apply.addEventListener('click', function () { updateAll(); }); bar.appendChild(apply);
  }

  // ★ 年月筛选组件（修复月份显示bug）
  function ymFilter() {
    var box = el('div', 'filter-item');
    box.appendChild(el('label', null, '年月'));

    // 从 META.yms 获取（已格式化为 YYYY-MM）
    var allYMs = (META.yms || []).slice();
    // 也从 RECORDS 补充
    RECORDS.forEach(function(r){ if(r.ym && allYMs.indexOf(r.ym)<0) allYMs.push(r.ym); });
    allYMs.sort();

    // 按年分组
    var years = {};
    allYMs.forEach(function(ym){
      // ★ 兼容 YYYY-MM 和 YYYYMM 两种格式
      var y = ym.slice(0, 4);
      if(!years[y]) years[y] = [];
      if(years[y].indexOf(ym)<0) years[y].push(ym);
    });
    var yearList = Object.keys(years).sort().reverse();

    var row = el('div', 'ym-row');
    var yearSel = el('select', 'filter-select');
    var yOpt0 = el('option'); yOpt0.value = ''; yOpt0.textContent = '全部'; yearSel.appendChild(yOpt0);
    yearList.forEach(function(y){ var o = el('option'); o.value = y; o.textContent = y + '年'; yearSel.appendChild(o); });

    var monthSel = el('select', 'filter-select');
    var mOpt0 = el('option'); mOpt0.value = 'all'; mOpt0.textContent = '全部月份'; monthSel.appendChild(mOpt0);

    // 设置初始值
    if(state.ym !== 'all' && state.ym.length >= 6){
      var curY = state.ym.slice(0, 4);
      yearSel.value = curY;
      rebuildMonthOptions();
      monthSel.value = state.ym;
    }

    yearSel.addEventListener('change', function(){
      rebuildMonthOptions();
      var options = monthSel.querySelectorAll('option');
      if(options.length > 1){
        monthSel.value = options[1].value;
        state.ym = monthSel.value;
      } else { state.ym = 'all'; }
      updateAll();
    });

    monthSel.addEventListener('change', function(){ state.ym = monthSel.value; updateAll(); });

    // ★ 重建月份选项（核心修复）
    function rebuildMonthOptions(){
      var y = yearSel.value;
      monthSel.innerHTML = '';
      var mA = el('option'); mA.value = 'all'; mA.textContent = '全部月份'; monthSel.appendChild(mA);
      if(y && years[y]){
        years[y].forEach(function(ymFull){
          // ★ 解析月份：兼容 "2025-08" 和 "202508"
          var mStr = ymFull.replace(/^\d{4}-?/, '');
          var mNum = parseInt(mStr, 10);
          var label = (mNum >= 1 && mNum <= 12) ? mNum + '月' : ymFull;
          var o = el('option'); o.value = ymFull; o.textContent = label; monthSel.appendChild(o);
        });
      }
    }

    row.appendChild(yearSel); row.appendChild(monthSel); box.appendChild(row);
    return box;
  }

  function selectFilter(label, values, current, onChange, mapLabel) {
    var box = el('div', 'filter-item'); box.appendChild(el('label', null, label));
    var sel = el('select', 'filter-select');
    var opt0 = el('option'); opt0.value = 'all'; opt0.textContent = '全部'; sel.appendChild(opt0);
    values.forEach(function (v) { var o = el('option'); o.value = v; o.textContent = mapLabel ? (mapLabel[v] || v) : v; sel.appendChild(o); });
    sel.value = current; sel.addEventListener('change', function () { onChange(sel.value); updateAll(); }); box.appendChild(sel); return box;
  }

  // ========== 左侧侧栏 ==========
  function renderSidebar() {
    var sb = $('#person-list'); sb.innerHTML = '';
    // ★ 标题 + 折叠按钮
    var head = el('div', 'sidebar-head');
    head.innerHTML = '<span>负责人员 (' + META.persons.length + ')</span><span class="sidebar-toggle" title="折叠/展开">◀</span>';
    var actions = el('div', 'sidebar-actions');
    var all = el('button', 'mini-btn', '全选'); all.addEventListener('click', function () { state.persons = new Set(META.persons); renderSidebar(); updateAll(); });
    var none = el('button', 'mini-btn', '清空'); none.addEventListener('click', function () { state.persons = new Set(); renderSidebar(); updateAll(); });
    actions.appendChild(all); actions.appendChild(none); head.appendChild(actions); sb.appendChild(head);
    // ★ 折叠交互
    var toggle = head.querySelector('.sidebar-toggle');
    var asideEl = sb.closest('aside') || sb.parentElement;
    toggle.addEventListener('click', function(){
      asideEl.classList.toggle('collapsed');
      toggle.textContent = asideEl.classList.contains('collapsed') ? '▶' : '◀';
      setTimeout(function(){ resizeAllCharts(); }, 300);
    });
    META.persons.forEach(function (p) {
      var row = el('label', 'person-row');
      var cb = el('input'); cb.type = 'checkbox'; cb.checked = state.persons.has(p);
      cb.addEventListener('click', function (e) {
        e.stopPropagation();
        if (cb.checked) state.persons.add(p); else state.persons.delete(p); updateAll();
      });
      row.appendChild(cb);
      // ★ v6.5 去除侧边栏小图标，仅保留名字
      row.appendChild(el('span', 'person-name', p));
      // ★ 点击名字也跳转到顾问页
      row.style.cursor = 'pointer';
      row.addEventListener('dblclick', function () {
        state.advisorPerson = p;
        switchPage('advisor');
      });
      sb.appendChild(row);
    });
    sb.appendChild(el('div', 'sidebar-info', state.persons.size === 0 ? '当前：全部人员（双击名字查看顾问介绍）' : '已选 ' + state.persons.size + ' 人'));
  }

  function syncDetailFilters() { renderFilterBar(); }

  // ========== 页面切换 ==========
  function switchPage(page) {
    // ★ v6.3 记录上一页（用于返回上一步）
    if (page !== state.page) state.prevPage = state.page;
    state.page = page;
    var tabs = document.querySelectorAll('.tab');
    for (var ti = 0; ti < tabs.length; ti++) { if (tabs[ti].getAttribute('data-page') === page) tabs[ti].classList.add('active'); else tabs[ti].classList.remove('active'); }
    document.getElementById('page-overview').style.display = (page === 'overview') ? '' : 'none';
    document.getElementById('page-daily').style.display = (page === 'daily') ? '' : 'none';
    document.getElementById('page-project').style.display = (page === 'project') ? '' : 'none';
    document.getElementById('page-services').style.display = (page === 'services') ? '' : 'none';
    document.getElementById('page-landing').style.display = (page === 'landing') ? '' : 'none';
    var advPage = document.getElementById('page-advisor');
    if (advPage) advPage.style.display = (page === 'advisor') ? '' : 'none';

    renderFilterBar();
    try { updateAll(); } catch(e) { console.error('render error:', e); }
    setTimeout(function () { resizeAllCharts(); }, 50);
    requestAnimationFrame(function () { resizeAllCharts(); });
  }

  function updateAll() {
    if (state.page === 'overview') renderOverview();
    else if (state.page === 'daily') renderDetail('daily');
    else if (state.page === 'project') renderDetail('project');
    else if (state.page === 'services') renderServices();
    else if (state.page === 'landing') renderLanding();
    else if (state.page === 'advisor') renderAdvisor();
  }

  // ========== 初始化 ==========
  function init() {
    $all('.tab').forEach(function (t) { t.addEventListener('click', function () { switchPage(t.dataset.page); }); });
    $('#btn-info').addEventListener('click', function () {
      alert('指标口径说明：\n' +
        '1. 日常类 = 「CN HR工作量表-HR填写」；专案类 = 「CN HR工作量表 -HR填写（专案类）」。\n' +
        '2. 工时 = 处理时长(H/月) 之和；数量 = 处理数量 之和。\n' +
        '3. 会议指标取自含「会议ID」的记录。\n' +
        '4. 日常类 + 专案类 = HR 完整工作量。\n' +
        '5. 服务展示页默认仅显示可定价服务；收费模式分为单次/按人/按月/按户/按件。\n' +
        '6. 点击顾问头像或双击侧栏名字可进入顾问介绍页。\n' +
        '7. 数据清洗：人员/BU 大小写重复已归一化。');
    });
    renderSidebar(); renderFilterBar(); updateAll();
    // ★ 确保默认页可见（各页面容器默认 display:none，需 switchPage 切换）
    switchPage(state.page);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
