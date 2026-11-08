/* Код страницы register.html (собран из макета) */
window.__dcDefine = function (DCLogic) {
class Component extends DCLogic {
  renderVals() {
    const A = window.KitisAccount;
    const M = window.KitisModel;
    const s = this.state || {};
    const f = s.form || { role: 'student' };
    const err = s.errors || {};
    const accent = this.props.accent ?? '#2D5BE3';
    const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(accent);
    const rgb = m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [45, 91, 227];
    const accentSoft = 'rgba(' + rgb.join(', ') + ', 0.10)';
    const setForm = (patch) => {
      const cur = (this.state && this.state.form) || { role: 'student' };
      const errors = Object.assign({}, (this.state && this.state.errors) || {});
      Object.keys(patch).forEach((k) => { delete errors[k]; });
      delete errors.form;
      this.setState({ form: Object.assign({}, cur, patch), errors: errors });
    };
    const groups = M.groups().map((g) => g.name);
    const teachers = M.teachers().map((t) => t.name);
    const RED = '#D93A2B';

    const roles = [['student', 'Студент'], ['teacher', 'Преподаватель'], ['abitur', 'Абитуриент']].map((x) => {
      const on = x[0] === (f.role || 'student');
      return { label: x[1], checked: on ? 'true' : 'false', border: on ? '2px solid ' + accent : '1px solid #DCE0E6', bg: on ? accentSoft : '#FFFFFF', pick: () => setForm({ role: x[0] }) };
    });

    const nameField = (key, label, ph, auto, required) => {
      const e = err[key];
      return {
        label: label + (required ? '' : ' (если есть)'), value: f[key] || '', ph: ph, auto: auto,
        note: e || 'Только русские буквы', noteFg: e ? '#A1261B' : '#5B6270', border: e ? RED : '#C9CED6',
        on: (ev) => {
          const raw = ev.target.value;
          const v = A.cleanName(raw);
          if (raw !== v) ev.target.value = v;
          const patch = {}; patch[key] = v;
          setForm(patch);
          if (v && A.hasProfanity(v)) {
            const errors = Object.assign({}, (this.state && this.state.errors) || {});
            errors[key] = label + ': недопустимое слово';
            this.setState({ errors: errors });
          }
        }
      };
    };
    const nameFields = [nameField('last', 'Фамилия', 'Иванов', 'family-name', true), nameField('first', 'Имя', 'Иван', 'given-name', true), nameField('middle', 'Отчество', 'Иванович', 'additional-name', false)];

    const gq = (s.gq || '').trim().toLowerCase();
    const groupOpts = groups.filter((g) => !gq || g.toLowerCase().indexOf(gq) >= 0).slice(0, 60).map((g) => {
      const on = g === f.group;
      return { name: g, pressed: on ? 'true' : 'false', bg: on ? accent : '#FFFFFF', fg: on ? '#FFFFFF' : '#15171C', border: on ? accent : '#DCE0E6', pick: () => setForm({ group: g }) };
    });
    const tq = (s.tq || '').trim().toLowerCase();
    const teacherOpts = teachers.filter((t) => !tq || t.toLowerCase().indexOf(tq) >= 0).slice(0, tq ? 30 : 12).map((t) => {
      const on = t === f.teacher;
      return { name: t, pressed: on ? 'true' : 'false', bg: on ? accent : '#FFFFFF', fg: on ? '#FFFFFF' : '#15171C', border: on ? accent : '#DCE0E6', pick: () => setForm({ teacher: t }) };
    });
    const specs = ['Веб-разработка', 'Разработка компьютерных игр', 'Сетевое и системное администрирование', 'Информационное моделирование в строительстве',
      'Строительство и эксплуатация зданий', 'Эксплуатация многоквартирного дома', 'Туризм и гостеприимство', 'Сварщик', 'Мастер отделочных работ', 'Мастер столярного производства'].map((x) => {
      const on = x === f.interest;
      return { name: x, pressed: on ? 'true' : 'false', bg: on ? accent : '#FFFFFF', fg: on ? '#FFFFFF' : '#15171C', border: on ? accent : '#DCE0E6', pick: () => setForm({ interest: on ? '' : x }) };
    });

    const errView = {};
    ['group', 'teacher', 'email', 'password', 'password2', 'consent', 'form'].forEach((k) => {
      errView[k] = err[k] || '';
      errView['has' + k.charAt(0).toUpperCase() + k.slice(1)] = !!err[k];
    });

    return {
      accent: accent, accentSoft: accentSoft, roles: roles, nameFields: nameFields,
      roleStudent: (f.role || 'student') === 'student', roleTeacher: f.role === 'teacher', roleAbitur: f.role === 'abitur',
      gq: s.gq || '', tq: s.tq || '', groupOpts: groupOpts, teacherOpts: teacherOpts, specs: specs,
      groupPicked: f.group ? 'выбрана ' + f.group : 'не выбрана', teacherPicked: f.teacher ? 'выбрано: ' + f.teacher : 'выберите себя',
      email: f.email || '', err: errView,
      emailBorder: err.email ? RED : '#C9CED6', passBorder: err.password ? RED : '#C9CED6', pass2Border: err.password2 ? RED : '#C9CED6',
      submitLabel: s.busy ? 'Сохраняем…' : 'Зарегистрироваться',
      onGq: (e) => this.setState({ gq: e.target.value }),
      onTq: (e) => this.setState({ tq: e.target.value }),
      onEmail: (e) => {
        const v = A.cleanEmail(e.target.value);
        if (e.target.value !== v) e.target.value = v;
        setForm({ email: v });
      },
      onPass: (e) => setForm({ password: e.target.value }),
      onPass2: (e) => setForm({ password2: e.target.value }),
      onConsent: (e) => setForm({ consent: !!e.target.checked }),
      submit: (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const form = Object.assign({ role: 'student' }, (this.state && this.state.form) || {});
        this.setState({ busy: true });
        A.register(form, { groups: groups, teachers: teachers }).then((r) => {
          if (r.ok) { window.location.href = 'profile.html'; return; }
          this.setState({ errors: r.errors, busy: false });
        });
      }
    };
  }
}
;return Component;
};
