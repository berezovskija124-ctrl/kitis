/* Код страницы login.html (собран из макета) */
window.__dcDefine = function (DCLogic) {
class Component extends DCLogic {
  renderVals() {
    const A = window.KitisAccount;
    const s = this.state || {};
    const accent = this.props.accent ?? '#2D5BE3';
    const me = A ? A.current() : null;
    return {
      accent: accent,
      loggedIn: !!me, loggedOut: !me, meName: me ? me.fullName : '', meRole: me ? me.roleLabel : '',
      email: s.email || '', error: s.error || '', hasError: !!s.error,
      submitLabel: s.busy ? 'Проверяем…' : 'Войти',
      busy: !!s.busy, remember: s.remember !== false,
      onRemember: (e) => this.setState({ remember: !!e.target.checked }),
      onEmail: (e) => {
        const v = A.cleanEmail(e.target.value);
        if (e.target.value !== v) e.target.value = v;
        this.setState({ email: v, error: '' });
      },
      onPass: (e) => this.setState({ pass: e.target.value, error: '' }),
      submit: (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const st = this.state || {};
        if (st.busy) return;
        this.setState({ busy: true, error: '' });
        A.login(st.email || '', st.pass || '', st.remember !== false).then((r) => {
          if (r.ok) window.location.href = 'profile.html';
          else this.setState({ error: r.error, busy: false });
        });
      },
      logout: () => { A.logout(); this.setState({ out: Date.now() }); }
    };
  }
}
;return Component;
};
