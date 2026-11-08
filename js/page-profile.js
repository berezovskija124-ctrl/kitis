/* Код страницы profile.html (собран из макета) */
window.__dcDefine = function (DCLogic) {
class Component extends DCLogic {
  renderVals() {
    const A = window.KitisAccount;
    const M = window.KitisModel;
    const s = this.state || {};
    const accent = this.props.accent ?? '#2D5BE3';
    const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(accent);
    const rgb = m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [45, 91, 227];
    const accentSoft = 'rgba(' + rgb.join(', ') + ', 0.10)';
    const me = A.current();
    const groups = M.groups().map((g) => g.name);
    const teachers = M.teachers().map((t) => t.name);
    const lists = { groups: groups, teachers: teachers };
    const RED = '#D93A2B';
    if (!me) {
      return { accent: accent, accentSoft: accentSoft, loggedIn: false, loggedOut: true, scheduleHref: 'desktop.html' };
    }
    const f = Object.assign({ last: me.last, first: me.first, middle: me.middle, group: me.group, teacher: me.teacher }, s.form || {});
    const err = s.errors || {};
    const setForm = (patch) => {
      const cur = (this.state && this.state.form) || {};
      this.setState({ form: Object.assign({}, cur, patch), errors: {}, msg: '' });
    };
    const nameField = (key, label, required) => ({
      label: label + (required ? '' : ' (если есть)'), value: f[key] || '',
      note: err[key] || 'Только русские буквы', noteFg: err[key] ? '#A1261B' : '#5B6270', border: err[key] ? RED : '#C9CED6',
      on: (ev) => {
        const raw = ev.target.value;
        const v = A.cleanName(raw);
        if (raw !== v) ev.target.value = v;
        const patch = {}; patch[key] = v;
        setForm(patch);
      }
    });
    const gq = (s.gq || '').trim().toLowerCase();
    const tq = (s.tq || '').trim().toLowerCase();
    const opt = (name, on, pick) => ({ name: name, pressed: on ? 'true' : 'false', bg: on ? accent : '#FFFFFF', fg: on ? '#FFFFFF' : '#15171C', border: on ? accent : '#DCE0E6', pick: pick });
    const scheduleHref = me.role === 'teacher' && me.teacher ? 'desktop.html#tab=teachers&teacher=' + encodeURIComponent(me.teacher)
      : (me.group ? 'desktop.html#group=' + encodeURIComponent(me.group) : 'desktop.html');
    const removeArmed = !!s.armRemove;
    return {
      accent: accent, accentSoft: accentSoft, loggedIn: true, loggedOut: false, scheduleHref: scheduleHref,
      hasPhoto: !!me.photo, noPhoto: !me.photo, photo: me.photo || '', initials: me.initials,
      photoLabel: me.photo ? 'Сменить фото' : 'Добавить фото', photoError: s.photoError || '', hasPhotoError: !!s.photoError,
      fullName: me.fullName, roleLine: me.roleLabel + (me.group ? ' · группа ' + me.group : '') + (me.teacher ? ' · ' + me.teacher : '') + ' · ' + me.email,
      nameFields: [nameField('last', 'Фамилия', true), nameField('first', 'Имя', true), nameField('middle', 'Отчество', false)],
      isStudent: me.role === 'student', isTeacher: me.role === 'teacher',
      gq: s.gq || '', tq: s.tq || '', groupNow: f.group || 'не выбрана', teacherNow: f.teacher || 'не выбрано',
      groupOpts: groups.filter((g) => !gq || g.toLowerCase().indexOf(gq) >= 0).map((g) => opt(g, g === f.group, () => setForm({ group: g }))),
      teacherOpts: teachers.filter((t) => !tq || t.toLowerCase().indexOf(tq) >= 0).slice(0, tq ? 30 : 12).map((t) => opt(t, t === f.teacher, () => setForm({ teacher: t }))),
      email: me.email,
      msg: s.msg || Object.keys(err).map((k) => err[k]).join(' · '), hasMsg: !!(s.msg || Object.keys(err).length),
      msgBg: Object.keys(err).length ? '#FDECEC' : '#E3F5EA', msgFg: Object.keys(err).length ? '#A1261B' : '#17663A',
      removeLabel: 'Удалить аккаунт', removeBg: removeArmed ? '#FDECEC' : '#FFFFFF', removeBorder: removeArmed ? '#D93A2B' : '#F2C4BF',
      removeArmed: removeArmed, removeExpanded: removeArmed ? 'true' : 'false',
      delErr: s.delErr || '', hasDelErr: !!s.delErr, delBusy: !!s.delBusy, delLabel: s.delBusy ? 'Проверяем пароль…' : 'Удалить навсегда',
      pwMsg: s.pwMsg || '', hasPwMsg: !!s.pwMsg, pwMsgBg: s.pwOk ? '#E3F5EA' : '#FDECEC', pwMsgFg: s.pwOk ? '#17663A' : '#A1261B',
      pwBusy: !!s.pwBusy, pwLabel: s.pwBusy ? 'Сохраняем…' : 'Сменить пароль',
      onPwOld: (e) => { this._pw = Object.assign({}, this._pw, { old: e.target.value }); if (s.pwMsg) this.setState({ pwMsg: '' }); },
      onPwNew: (e) => { this._pw = Object.assign({}, this._pw, { n1: e.target.value }); if (s.pwMsg) this.setState({ pwMsg: '' }); },
      onPwNew2: (e) => { this._pw = Object.assign({}, this._pw, { n2: e.target.value }); if (s.pwMsg) this.setState({ pwMsg: '' }); },
      changePw: (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (this.state && this.state.pwBusy) return;
        const form = e && e.target;
        const pw = this._pw || {};
        this.setState({ pwBusy: true, pwMsg: '' });
        A.changePassword(pw.old || '', pw.n1 || '', pw.n2 || '').then((r) => {
          if (r.ok) { this._pw = {}; if (form && form.reset) form.reset(); }
          this.setState({ pwBusy: false, pwOk: r.ok, pwMsg: r.ok ? 'Пароль изменён' : r.error });
        });
      },
      onDelPw: (e) => { this._delPw = e.target.value; if (s.delErr) this.setState({ delErr: '' }); },
      cancelRemove: () => { this._delPw = ''; this.setState({ armRemove: false, delErr: '' }); },
      removeConfirm: (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (this.state && this.state.delBusy) return;
        this.setState({ delBusy: true, delErr: '' });
        A.remove(this._delPw || '').then((r) => {
          this._delPw = '';
          if (r.ok) this.setState({ delBusy: false, armRemove: false, out: Date.now(), msg: '' });
          else this.setState({ delBusy: false, delErr: r.error });
        });
      },
      onGq: (e) => this.setState({ gq: e.target.value }),
      onTq: (e) => this.setState({ tq: e.target.value }),
      onPhoto: (e) => {
        const file = e.target.files && e.target.files[0];
        A.photoFromFile(file).then((url) => {
          const r = A.update({ photo: url }, lists);
          this.setState({ photoError: r.ok ? '' : (r.errors.form || 'Не удалось сохранить фото'), msg: r.ok ? 'Фото сохранено' : '' });
        }).catch((er) => this.setState({ photoError: er.message }));
        e.target.value = '';
      },
      removePhoto: () => { A.update({ photo: '' }, lists); this.setState({ msg: 'Фото убрано', photoError: '' }); },
      save: (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const form = Object.assign({}, (this.state && this.state.form) || {});
        const r = A.update(form, lists);
        if (r.ok) this.setState({ form: null, errors: {}, msg: 'Сохранено' });
        else this.setState({ errors: r.errors, msg: '' });
      },
      logout: () => { A.logout(); this.setState({ out: Date.now() }); },
      remove: () => this.setState({ armRemove: !(this.state && this.state.armRemove), delErr: '' })
    };
  }
}
;return Component;
};
