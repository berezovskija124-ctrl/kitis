/* Код страницы structure.html (собран из макета) */
window.__dcDefine = function (DCLogic) {
class Component extends DCLogic {
  renderVals() {
    const accent = this.props.accent ?? '#2D5BE3';
    const names = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const counts = [3, 4, 5, 3, 3, 3];
    const widths = [82, 64, 90, 72];
    const days = names.map((name, i) => {
      const today = i === 3;
      const bars = [];
      for (let k = 0; k < counts[i]; k++) {
        const now = today && k === 1;
        bars.push({ w: widths[(k + i) % 4], dot: now ? '#E06A1B' : '#DDE1E7', fill: now ? '#F2B48A' : '#C9CED6' });
      }
      return { name: today ? name + ' · сегодня' : name, color: today ? accent : '#3A404C', border: today ? accent : '#E3E6EB', bars: bars };
    });
    const times = ['08:30 – 10:00', '10:10 – 11:40', '12:10 – 13:40', '13:50 – 15:20', '15:30 – 17:00', '17:10 – 18:40'];
    const bells = times.map((t, i) => ({ n: i + 1, time: t, bg: i === 1 ? '#FFF4EA' : 'transparent', dot: i === 1 ? '#B4530F' : '#DDE1E7', fg: i === 1 ? '#FFFFFF' : '#3A404C' }));
    const flow = [
      { title: 'Сайт колледжа', text: '94.72.18.202:8083 — страницы групп, преподавателей, аудиторий' },
      { title: 'Парсер', text: 'Забирает HTML по расписанию, разбирает таблицы в пары' },
      { title: 'База данных', text: 'Группы, преподаватели, аудитории, пары, звонки, контакты' },
      { title: 'Наш сайт', text: 'Красивое расписание, избранное, уведомления' },
      { title: 'Студент', text: 'Браузер на компьютере или телефоне' }
    ].map((f, i, arr) => ({ title: f.title, text: f.text, arrow: i < arr.length - 1, bg: i === 3 ? 'rgba(45, 91, 227, 0.08)' : '#F7F8FA', border: i === 3 ? accent : '#E3E6EB' }));
    return {
      accent: accent,
      days: days,
      bells: bells,
      favRows: [{ w: 70 }, { w: 85 }, { w: 60 }, { w: 75 }],
      flow: flow
    };
  }
}
;return Component;
};
