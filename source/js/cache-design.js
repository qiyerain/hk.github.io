(function () {
  'use strict';

  var lab = document.getElementById('cache-design-lab');
  if (!lab || lab.dataset.ready === 'true') return;
  lab.dataset.ready = 'true';

  var initial = function () {
    return { db: 1, l1: null, l2: null, l2WrittenAt: 0, minute: 0, hits: 0, dbReads: 0 };
  };
  var state = initial();
  var result = document.getElementById('cache-lab-result');
  var log = document.getElementById('cache-lab-log');
  var nodes = {
    l1: document.getElementById('cache-lab-l1'),
    l2: document.getElementById('cache-lab-l2'),
    db: document.getElementById('cache-lab-db')
  };

  function note(message, stale) {
    result.textContent = message;
    result.classList.toggle('is-stale', Boolean(stale));
    var item = document.createElement('li');
    item.textContent = '第 ' + state.minute + ' 分钟：' + message;
    log.prepend(item);
    while (log.children.length > 6) log.lastElementChild.remove();
  }

  function render(active) {
    document.getElementById('cache-lab-l1-value').textContent = state.l1 === null ? '空' : 'v' + state.l1;
    document.getElementById('cache-lab-l2-value').textContent = state.l2 === null ? '空' : 'v' + state.l2;
    document.getElementById('cache-lab-db-value').textContent = 'v' + state.db;
    document.getElementById('cache-lab-l2-age').textContent = state.l2 === null
      ? '10 分钟 TTL'
      : '已存 ' + (state.minute - state.l2WrittenAt) + ' / 10 分钟';
    document.getElementById('cache-lab-stats').textContent = '缓存命中 ' + state.hits + ' 次 · 数据库读取 ' + state.dbReads + ' 次';
    Object.keys(nodes).forEach(function (key) {
      nodes[key].dataset.active = String(key === active);
      nodes[key].dataset.stale = String(key !== 'db' && state[key] !== null && state[key] !== state.db);
    });
  }

  function expireL2() {
    if (state.l2 !== null && state.minute - state.l2WrittenAt >= 10) state.l2 = null;
  }

  function read() {
    expireL2();
    if (state.l1 !== null) {
      state.hits++;
      note('L1 命中 v' + state.l1 + (state.l1 !== state.db ? '，旧数据' : '，最新数据'), state.l1 !== state.db);
      render('l1');
      return;
    }
    if (state.l2 !== null) {
      state.hits++;
      state.l1 = state.l2;
      note('L2 命中 v' + state.l2 + '，装入 L1' + (state.l2 !== state.db ? '；仍是旧数据' : ''), state.l2 !== state.db);
      render('l2');
      return;
    }
    state.dbReads++;
    state.l2 = state.db;
    state.l2WrittenAt = state.minute;
    state.l1 = state.db;
    note('两级均未命中，读取数据库 v' + state.db + ' 并回填', false);
    render('db');
  }

  lab.addEventListener('click', function (event) {
    var button = event.target.closest('button[data-action]');
    if (!button || !lab.contains(button)) return;
    switch (button.dataset.action) {
      case 'read': read(); return;
      case 'update':
        state.db++;
        note('数据库更新为 v' + state.db + '；旧缓存尚未失效', false);
        render('db');
        return;
      case 'clear-l1':
        state.l1 = null;
        note('只清除 L1；下次读取仍可能命中旧的 L2', false);
        render('l1');
        return;
      case 'clear-all':
        state.l1 = null;
        state.l2 = null;
        note('两级缓存均已清除', false);
        render(null);
        return;
      case 'advance':
        state.minute += 11;
        expireL2();
        note('时间前进 11 分钟；L2 到期，L1 无自动过期', false);
        render(null);
        return;
      case 'reset':
        state = initial();
        log.replaceChildren();
        note('已重置：缓存为空，数据库为 v1', false);
        render(null);
    }
  });

  render(null);
}());
