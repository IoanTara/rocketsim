import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import PageLabel from '../PageLabel/index.jsx';

/* ─────────────────────────  reusable bits  ───────────────────────── */

const M = ({ children }) => <InlineMath math={children} />;

function Section({ num, title, id, children }) {
  return (
    <section id={id} style={sectionCard}>
      <div style={secNum}>{num}</div>
      <h2 style={secTitle}>{title}</h2>
      {children}
    </section>
  );
}

function Sub({ children }) {
  return <h3 style={subsec}>{children}</h3>;
}

function Formula({ label, math, note }) {
  return (
    <div style={formulaBlock}>
      {label && <div style={formulaLabel}>{label}</div>}
      <div style={{ overflowX: 'auto' }}>
        {Array.isArray(math)
          ? math.map((m, i) => <BlockMath key={i} math={m} />)
          : <BlockMath math={math} />}
      </div>
      {note && <p style={formulaNote}>{note}</p>}
    </div>
  );
}

function Note({ children }) {
  return <div style={noteBox}>{children}</div>;
}
function Tip({ children }) {
  return <div style={tipBox}>{children}</div>;
}

function Table({ head, rows }) {
  return (
    <div style={{ overflowX: 'auto', margin: '20px 0' }}>
      <table style={tableStyle}>
        <thead>
          <tr>{head.map((h, i) => <th key={i} style={thStyle}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} style={{ background: ri % 2 ? '#f5f5f5' : 'transparent' }}>
              {r.map((c, ci) => <td key={ci} style={tdStyle}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const PHASE_COLORS = ['#2e7d32', '#1565c0', '#6a1b9a', '#e65100', '#37474f'];
function PhaseCard({ idx, num, name, val, desc }) {
  const c = PHASE_COLORS[idx];
  return (
    <div style={{ ...phaseCard, borderTop: `4px solid ${c}` }}>
      <div style={phaseNum}>{num}</div>
      <div style={phaseName}>{name}</div>
      <div style={{ ...phaseVal, color: c }}>{val}</div>
      <div style={phaseDesc}>{desc}</div>
    </div>
  );
}

/* ─────────────────────────  main component  ───────────────────────── */

export default function PhysicsDoc({ onBack }) {
  return (
    <div style={root}>
      <div style={bg} />
      <PageLabel icon="chart" text="Документация" dark />

      <div className="physdoc-scroll" style={scrollArea}>
        {/* header */}
        <div style={cover}>
          <button onClick={onBack} style={backBtn}>‹ Назад</button>
          <h1 style={coverTitle}>Физика симуляции</h1>
          <div style={coverSub}>Математическая модель водяной ракеты · СПбПУ Политех</div>
        </div>

        <div style={content}>
          {/* TOC */}
          <div style={toc}>
            <div style={tocHead}>Содержание</div>
            <ol style={tocList}>
              {TOC.map(([href, label]) => (
                <li key={href} style={{ margin: '5px 0' }}>
                  <a href={href} style={tocLink}>{label}</a>
                </li>
              ))}
            </ol>
          </div>

          {/* 01 */}
          <Section num="01" id="s1" title="Введение и параметры модели">
            <p style={p}>Водяная ракета - пневматический метательный снаряд, где рабочим телом служит вода, вытесняемая сжатым воздухом. Симулятор воспроизводит полный цикл полёта: от страгивания с пусковой трубы до апогея.</p>
            <p style={p}>Модель описывает движение как одномерную задачу (вертикальный запуск) и включает четыре процесса: адиабатическое расширение воздуха, истечение воды по теореме Бернулли, истечение воздуха в фазе продувки и баллистический полёт с учётом сопротивления.</p>

            <Sub>Входные параметры</Sub>
            <div style={paramsGrid}>
              {[
                [<M>{`V_{bak}`}</M>, 'объём бака (л) - полный внутренний объём'],
                [<M>{`V_w`}</M>, 'объём воды (л) - начальный объём'],
                [<M>{`p_{gauge}`}</M>, 'давление (бар, избыт.) - сверх атмосферы'],
                [<M>{`m_0`}</M>, 'сухая масса (г) - корпус без воды'],
                [<M>{`d`}</M>, 'диаметр ракеты (мм)'],
                [<M>{`C_D`}</M>, 'коэф. сопр. - 0.3–0.6 типично'],
                [<M>{`d_{noz}`}</M>, 'диаметр сопла (мм)'],
                [<M>{`L_{tube}`}</M>, 'длина пусковой трубы - 0.02 м'],
              ].map(([sym, txt], i) => (
                <div key={i} style={paramRow}>
                  <span style={paramName}>{sym}</span>
                  <span style={paramVal}>{txt}</span>
                </div>
              ))}
            </div>

            <Sub>Физические константы модели</Sub>
            <Table
              head={['Символ', 'Величина', 'Значение', 'Пояснение']}
              rows={[
                [<M>{`p_{atm}`}</M>, 'Атмосферное давление', '101 325 Па', 'Стандартная атмосфера'],
                [<M>{`\\rho_w`}</M>, 'Плотность воды', '1000 кг/м³', 'При 20 °C'],
                [<M>{`\\rho_{air}`}</M>, 'Плотность воздуха', '1.225 кг/м³', 'Уровень моря, 15 °C'],
                [<M>{`\\gamma`}</M>, 'Показатель адиабаты', '1.4', 'Двухатомный газ'],
                [<M>{`C_{d,noz}`}</M>, 'Коэф. расхода сопла', '0.98', 'Острая кромка'],
                [<M>{`g`}</M>, 'Ускорение св. падения', '9.81 м/с²', ''],
                [<M>{`dt`}</M>, 'Шаг интегрирования', '0.001 с', 'Метод Эйлера'],
              ]}
            />
          </Section>

          {/* 02 */}
          <Section num="02" id="s2" title="Пять фаз полёта">
            <p style={p}>Полёт разбит на пять последовательных фаз. Переход происходит автоматически по физическим критериям (вода закончилась, давление сравнялось с атмосферным, скорость стала отрицательной).</p>
            <div style={phasesGrid}>
              <PhaseCard idx={0} num="Фаза 1" name="Пусковая труба" val="2.0 м/с" desc="Скорость схода с трубы" />
              <PhaseCard idx={1} num="Фаза 2" name="Водяная тяга" val="19.2 м/с" desc="Скорость конца горения воды" />
              <PhaseCard idx={2} num="Фаза 3" name="Воздушный импульс" val="26.1 м/с" desc="Максимальная скорость" />
              <PhaseCard idx={3} num="Фаза 4" name="Апогей" val="34.1 м" desc="Максимальная высота" />
              <PhaseCard idx={4} num="Итого" name="Полёт до апогея" val="2.68 с" desc="Полное время до апогея" />
            </div>
          </Section>

          {/* 03 */}
          <Section num="03" id="s3" title="Фаза 1 - Пусковая труба">
            <p style={p}>Пока ракета не сошла с пусковой трубы (<M>{`0 \\leq y \\leq L_{tube} = 0.02`}</M> м), она движется по направляющей. Это критичная начальная фаза - здесь ракета набирает скорость, необходимую для устойчивого полёта.</p>
            <Sub>Уравнение движения на трубе</Sub>
            <Formula label="ОДУ движения (2-й закон Ньютона)"
              math={String.raw`m(t)\,\ddot{y} = F_{thrust}(t) - F_{drag}(t) - m(t)\,g`} />
            <p style={p}>В фазе 1 тяга уже действует, но ракета ограничена трубой. Начальная скорость <M>{`v_0 = 0`}</M>. Скорость схода находится из кинематики:</p>
            <Formula label="Скорость схода с пусковой трубы"
              math={String.raw`v_{tube} = \sqrt{\frac{2\,F_{net,0}\,L_{tube}}{m_0}}`}
              note={<>где <M>{`F_{net,0} = F_{thrust,0} - m_0 g`}</M> - начальная результирующая сила, <M>{`L_{tube} = 0.02`}</M> м</>} />
            <Tip><strong style={{ color: '#2e7d32' }}>Пример:</strong> При <M>{`F_{thrust,0} = 83.0`}</M> Н, <M>{`m_0 = 0.75`}</M> кг: <M>{`a_0 = (83.0 - 7.36)/0.75 = 100.8`}</M> м/с², <M>{`v_{tube} = \\sqrt{2 \\times 100.8 \\times 0.02} \\approx 2.0`}</M> м/с</Tip>
            <Note><strong style={{ color: '#e65100' }}>Важно:</strong> Без учёта пусковой трубы (<M>{`L_{tube} = 0`}</M>) симулятор неверно считает нестандартные параметры. Труба гарантирует устойчивость при старте.</Note>
          </Section>

          {/* 04 */}
          <Section num="04" id="s4" title="Фаза 2 - Водяная тяга">
            <p style={p}>Основная двигательная фаза. Сжатый воздух расширяется адиабатически и выталкивает воду через сопло. Длится от конца трубы до момента, когда вся вода вытекла или давление упало до атмосферного.</p>
            <Sub>Адиабатическое расширение воздуха</Sub>
            <Formula label="Закон адиабатного процесса"
              math={String.raw`p_i \cdot V_{a,i}^{\gamma} = \text{const} \implies p_i = p_0 \left(\frac{V_{a,0}}{V_{a,i}}\right)^{\gamma}`}
              note={<><M>{`V_{a,i}`}</M> - текущий объём воздуха (растёт по мере вытекания воды), <M>{`\\gamma = 1.4`}</M></>} />
            <Sub>Скорость истечения воды (теорема Бернулли)</Sub>
            <Formula label="Уравнение Бернулли для скорости в сопле"
              math={String.raw`u_e = C_{d,noz}\sqrt{\frac{2\,(p_i - p_{atm})}{\rho_w}}`}
              note={<><M>{`C_{d,noz} = 0.98`}</M> - коэффициент расхода (потери на входе в отверстие)</>} />
            <Sub>Массовый расход воды</Sub>
            <Formula label="Уравнение неразрывности (расход)"
              math={[String.raw`\dot{m}_w = \rho_w \cdot u_e \cdot A_{noz}`,
                     String.raw`\frac{dV_w}{dt} = -\frac{\dot{m}_w}{\rho_w}, \quad \frac{dV_a}{dt} = +\frac{\dot{m}_w}{\rho_w}`]} />
            <Sub>Сила тяги от водяного импульса</Sub>
            <Formula label="Тяга (теорема об импульсе)"
              math={String.raw`F_{thrust} = \dot{m}_w \cdot u_e = \rho_w \cdot u_e^2 \cdot A_{noz}`} />
            <Sub>Дифференциальные уравнения фазы 2 (система ОДУ)</Sub>
            <Formula label="Полная система ОДУ"
              math={[String.raw`\frac{dy}{dt} = v`,
                     String.raw`\frac{dv}{dt} = \frac{F_{thrust}(t) - F_{drag}(v) - m(t)\,g}{m(t)}`,
                     String.raw`\frac{dm_w}{dt} = -\dot{m}_w(t), \quad \frac{dV_a}{dt} = \frac{\dot{m}_w}{\rho_w}`,
                     String.raw`p_i = p_0\left(\frac{V_{a,0}}{V_{a,i}}\right)^{1.4}, \quad m(t) = m_0 + m_w(t) + m_a`]} />
            <Sub>Динамика водяной фазы (первые 0.06 с)</Sub>
            <Table
              head={['t, с', 'p, бар', 'uₑ, м/с', 'ṁw, кг/с', 'F, Н', 'v, м/с', 'y, м']}
              rows={[
                ['0.001', '6.492', '32.50', '2.553', '82.97', '2.11', '0.022'],
                ['0.011', '6.289', '31.89', '2.505', '79.89', '3.10', '0.049'],
                ['0.021', '6.101', '31.32', '2.460', '77.03', '4.10', '0.085'],
                ['0.031', '5.925', '30.77', '2.417', '74.35', '5.09', '0.132'],
                ['0.041', '5.760', '30.25', '2.376', '71.85', '6.08', '0.188'],
                ['0.051', '5.606', '29.75', '2.337', '69.51', '7.08', '0.254'],
                ['0.181', '~1.013', '~0', '~0', '~0', '19.15', '1.68'],
              ]}
            />
            <p style={smallMuted}>Последняя строка - момент конца водяной тяги: давление упало до атмосферного, вода закончилась.</p>
          </Section>

          {/* 05 */}
          <Section num="05" id="s5" title="Фаза 3 - Воздушный импульс (продувка)">
            <p style={p}>После вытекания воды в баке остаётся сжатый воздух. Он продолжает создавать тягу, вытекая через сопло. Фаза завершается, когда давление выравнивается с атмосферным.</p>
            <Sub>Плотность воздуха в баке</Sub>
            <Formula label="Уравнение состояния идеального газа"
              math={String.raw`\rho_{a,i} = \frac{p_i}{R_{spec} \cdot T} = \frac{p_i}{287 \cdot 293}`}
              note={<><M>{`R_{spec} = 287`}</M> Дж/(кг·К), <M>{`T = 293`}</M> К (20 °C) - температура принята постоянной</>} />
            <Sub>Скорость истечения воздуха</Sub>
            <Formula label="Истечение сжимаемого газа (дозвуковой режим)"
              math={String.raw`u_{e,a} = \sqrt{\frac{2\,(p_i - p_{atm})}{\rho_{a,i}}}`} />
            <Sub>Тяга в фазе продувки</Sub>
            <Formula label="Тяга с учётом давления на срезе сопла"
              math={[String.raw`F_{thrust} = \dot{m}_a \cdot u_{e,a} + A_{noz}\,(p_i - p_{atm})`,
                     String.raw`\dot{m}_a = \rho_{a,i} \cdot u_{e,a} \cdot A_{noz}`]} />
            <Sub>Изменение давления при продувке</Sub>
            <Formula label="Давление через оставшуюся массу воздуха"
              math={[String.raw`m_{a,i+1} = m_{a,i} - \dot{m}_a \cdot dt`,
                     String.raw`p_{i+1} = \frac{m_{a,i+1} \cdot R_{spec} \cdot T}{V_{tank}}`]} />
            <Tip><strong style={{ color: '#2e7d32' }}>Результат фазы 3:</strong> к концу продувки ракета достигает максимальной скорости ~26.1 м/с на высоте ~4.9 м. Дальше - только инерция и сопротивление.</Tip>
          </Section>

          {/* 06 */}
          <Section num="06" id="s6" title="Фаза 4 - Свободный полёт до апогея">
            <p style={p}>После продувки двигатель не работает. Ракета движется по баллистической траектории под действием тяжести и сопротивления.</p>
            <Formula label="ОДУ свободного полёта"
              math={[String.raw`\frac{dv}{dt} = -g - \frac{F_{drag}(v)}{m_0}`,
                     String.raw`\frac{dy}{dt} = v`]} />
            <p style={p}>Апогей достигается при <M>{`v = 0`}</M>. Высота без учёта сопротивления:</p>
            <Formula label="Оценка апогея без сопротивления (верхняя граница)"
              math={String.raw`h_{apogee} \approx y_3 + \frac{v_3^2}{2g}`}
              note={<><M>{`y_3 = 4.9`}</M> м, <M>{`v_3 = 26.1`}</M> м/с ⇒ <M>{`h \\approx 4.9 + \\frac{26.1^2}{2 \\times 9.81} = 39.7`}</M> м (без сопр.). С учётом сопротивления симулятор даёт <strong>34.1 м</strong> - потеря 5.6 м (14 %).</>} />
          </Section>

          {/* 07 */}
          <Section num="07" id="s7" title="Аэродинамическое сопротивление">
            <p style={p}>Сила сопротивления воздуха учитывается во всех фазах полёта:</p>
            <Formula label="Закон Ньютона для лобового сопротивления"
              math={[String.raw`F_{drag} = C_D \cdot \tfrac{1}{2}\,\rho_{air} \cdot A_{front} \cdot v^2 \cdot \text{sign}(v)`,
                     String.raw`A_{front} = \frac{\pi d^2}{4}`]} />
            <Table
              head={['Параметр', 'Обозн.', 'Эталон', 'Влияние']}
              rows={[
                ['Коэф. лобового сопр.', <M>{`C_D`}</M>, '0.5', 'Задаётся пользователем'],
                ['Плотность воздуха', <M>{`\\rho_{air}`}</M>, '1.225 кг/м³', 'Константа'],
                ['Площадь миделя', <M>{`A_{front}`}</M>, '0.00665 м²', 'Из диаметра 92 мм'],
                ['Сопр. при v=26 м/с', <M>{`F_{drag}`}</M>, '~5.5 Н', '~7 % от тяги'],
              ]}
            />
            <Note><strong style={{ color: '#e65100' }}>Замечание:</strong> модель не учитывает зависимость <M>{`C_D`}</M> от числа Рейнольдса и трансзвуковые эффекты. Для типичных ракет (<M>{`v < 50`}</M> м/с) постоянный <M>{`C_D = 0.4{-}0.6`}</M> - хорошее приближение.</Note>
          </Section>

          {/* 08 */}
          <Section num="08" id="s8" title="Численный метод решения (Эйлер)">
            <p style={p}>Система ОДУ не имеет аналитического решения из-за нелинейных зависимостей <M>{`F_{thrust}(t)`}</M>, <M>{`m(t)`}</M>, <M>{`F_{drag}(v)`}</M>. Используется явный метод Эйлера с шагом <M>{`dt = 0.001`}</M> с.</p>
            <Formula label="Явная схема Эйлера (первый порядок точности)"
              math={[String.raw`y_{n+1} = y_n + v_n \cdot dt`,
                     String.raw`v_{n+1} = v_n + a_n \cdot dt, \quad a_n = \frac{F_{net}(y_n, v_n, t_n)}{m_n}`,
                     String.raw`m_{n+1} = m_n - \dot{m}(t_n) \cdot dt, \quad p_{n+1} = p_0\left(\frac{V_{a,0}}{V_{a,n+1}}\right)^{\gamma}`]} />
            <pre style={codeBlock}>{`// Основной цикл симуляции (упрощённо)
while (!apogeeReached) {
  t += dt;
  // 1. Давление воздуха (адиабатика)
  p_cur = p0 * Math.pow(V_air0 / V_air, 1.4);
  // 2. Скорость истечения (Бернулли)
  u_e = Cd_noz * Math.sqrt(2 * (p_cur - P_ATM) / rho_water);
  // 3. Массовый расход и тяга
  m_dot = rho_water * u_e * A_nozzle;
  thrust = m_dot * u_e;
  // 4. Обновление состояния бака
  m_water -= m_dot * dt;
  V_air   += (m_dot * dt) / rho_water;
  // 5. Ускорение и движение
  drag = Cd * 0.5 * rho_air * A_body * v * Math.abs(v);
  a = (thrust - drag - m_total * g) / m_total;
  v += a * dt;  y += v * dt;
  // 6. Переходы фаз
  if (m_water <= 0) phase = "blowdown";
  if (p_cur <= P_ATM) phase = "coast";
  if (v < 0) apogeeReached = true;
}`}</pre>
            <Sub>Оценка погрешности метода Эйлера</Sub>
            <p style={p}>Локальная погрешность <M>{`\\sim O(dt^2)`}</M>, глобальная <M>{`\\sim O(dt)`}</M>. При <M>{`dt = 0.001`}</M> с - ~300 шагов на активную фазу, достаточно для инженерной точности.</p>
            <Table
              head={['Шаг dt', 'Апогей, м', 'Отклонение', 'Время расчёта']}
              rows={[
                ['0.01 с', '34.5', '+1.2 %', 'мгновенно'],
                ['0.001 с', '34.1', 'базовый', '~5 мс'],
                ['0.0001 с', '34.0', '-0.3 %', '~50 мс'],
              ]}
            />
            <p style={smallMuted}>Шаг 0.001 с обеспечивает менее 1.5 % погрешности при минимальном времени вычисления.</p>
          </Section>

          {/* 09 */}
          <Section num="09" id="s9" title="Полный разбор эталонного примера">
            <p style={p}>Реальный запуск ракеты Политеха. Все расчёты верифицированы в симуляторе.</p>
            <Sub>Входные данные</Sub>
            <div style={paramsGrid}>
              {[
                ['Объём бака', '1.5 л = 0.0015 м³'],
                ['Объём воды', '0.4 л = 0.0004 м³'],
                ['Давление', '5.5 бар = 550 000 Па'],
                ['Сухая масса', '350 г = 0.350 кг'],
                ['Диаметр ракеты', '92 мм = 0.092 м'],
                ['Коэф. сопротивления', '0.5'],
                ['Диаметр сопла', '10 мм'],
                ['Длина трубы', '20 мм'],
              ].map(([n, v], i) => (
                <div key={i} style={paramRow}>
                  <span style={paramName}>{n}</span>
                  <span style={paramVal}>{v}</span>
                </div>
              ))}
            </div>
            <Sub>Вычисление начальных параметров</Sub>
            <Table
              head={['Параметр', 'Формула', 'Результат']}
              rows={[
                ['Абс. давление p₀', <M>{`p_{gauge} + p_{atm}`}</M>, '651 325 Па'],
                ['Объём воздуха V₀', <M>{`V_{tank} - V_w`}</M>, '1.10 л'],
                ['Масса воды', <M>{`\\rho_w \\cdot V_w`}</M>, '0.400 кг'],
                ['Масса воздуха', <M>{`V_{a,0} \\cdot p_0 / (R T)`}</M>, '0.00852 кг'],
                ['Площадь сопла', <M>{`\\pi (d_{noz}/2)^2`}</M>, '78.54 мм²'],
                ['Площадь миделя', <M>{`\\pi (d/2)^2`}</M>, '6648 мм²'],
                ['Нач. скорость истеч.', <M>{`0.98\\sqrt{2(p_0 - p_{atm})/\\rho_w}`}</M>, '32.50 м/с'],
                ['Начальная тяга', <M>{`\\rho_w u_{e,0}^2 A_{noz}`}</M>, '82.97 Н'],
                ['Стартовая масса', <M>{`m_0 + m_w + m_a`}</M>, '0.759 кг'],
                ['Тяговооружённость', <M>{`F_0 / (m_{total} g)`}</M>, '11.2'],
              ]}
            />
            <Sub>Сводная таблица фаз</Sub>
            <Table
              head={['#', 'Фаза', 'Высота, м', 'v, м/с', 'Время, с', 'Тяга, Н']}
              rows={[
                ['1', 'Старт с трубы', '0 → 0.02', '0 → 2.0', '0 → 0.020', '83 → 82'],
                ['2', 'Конец водяной тяги', '0.02 → 1.68', '2.0 → 19.2', '0.02 → 0.181', '83 → ~0'],
                ['3', 'Конец возд. импульса', '1.68 → 4.89', '19.2 → 26.1', '0.181 → 0.309', 'мал → 0'],
                ['4', 'Апогей', '4.89 → 34.1', '26.1 → 0', '0.309 → 2.681', '0'],
              ]}
            />
            <div style={resultBanner}>
              <div><div style={bannerLabel}>Апогей</div><div style={bannerBig}>34.1 <small>м</small></div></div>
              <div style={bannerSep}>|</div>
              <div><div style={bannerLabel}>Макс. скорость</div><div style={bannerBig}>26.1 <small>м/с</small></div></div>
              <div style={bannerSep}>|</div>
              <div><div style={bannerLabel}>Время до апогея</div><div style={bannerBig}>2.68 <small>с</small></div></div>
              <div style={bannerSep}>|</div>
              <div><div style={bannerLabel}>Тяговооруж.</div><div style={bannerBig}>11.2×</div></div>
            </div>
          </Section>

          {/* 10 */}
          <Section num="10" id="s10" title="Сравнение с экспериментом и границы модели">
            <Sub>Верификация - сравнение с h2orocks.com</Sub>
            <Table
              head={['Тест', 'Параметры', 'Наш', 'h2orocks', 'Δ']}
              rows={[
                ['Реальный запуск', '1.5л, 0.4л, 5.5бар, 350г, ⌀92, сопло 10', '34.1 м', '29.1 м', '+17 %'],
                ['Большая ракета', '15л, 4л, 55бар, 3500г, ⌀920, сопло 100', '6.9 м', '6.2 м', '+11 %'],
              ]}
            />
            <p style={smallMuted}>Расхождение 10–20 % - норма для упрощённых моделей (изотермический vs адиабатический процесс, учёт/неучёт числа Рейнольдса и др.).</p>

            <Sub>Допущения и ограничения модели</Sub>
            <Table
              head={['Допущение', 'Реальность', 'Влияние']}
              rows={[
                ['Вертикальный запуск', 'Угол может отличаться', 'Малое'],
                [<>{<M>{`C_D`}</M>} = const</>, <>зависит от <M>{`Re`}</M>, числа Маха</>, 'Среднее (~5–10 %)'],
                ['Изотермич. истечение воздуха', 'Охлаждение при расширении', 'Малое'],
                ['Вода несжимаема', 'Верно до 100 бар', 'Пренебрежимое'],
                ['Плотность воздуха const', 'Меняется с высотой', 'Пренебрежимое при h<100 м'],
                ['Нет учёта ветра', 'Ветер влияет на траекторию', 'Малое (вертик. запуск)'],
              ]}
            />
            <Sub>Область применимости</Sub>
            <Tip><strong style={{ color: '#2e7d32' }}>Модель корректна при:</strong> давление 1–15 бар, объём бака 0.1–5 л, масса 50–2000 г, диаметр 40–150 мм, диаметр сопла &lt; 0.8 × диаметра ракеты. Вне этих диапазонов точность снижается.</Tip>
          </Section>

          <div style={footer}>
            RocketSim - Симулятор водяной ракеты · СПбПУ Политех · 2026<br />
            Модель основана на: Bernoulli · Newton 2nd Law · Adiabatic gas law
          </div>
        </div>
      </div>

      <style>{`.physdoc-scroll::-webkit-scrollbar { display: none; }
        .physdoc-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        #s1, #s2, #s3, #s4, #s5, #s6, #s7, #s8, #s9, #s10 { scroll-margin-top: 16px; }
        .katex { font-size: 1.05em; }`}</style>
    </div>
  );
}

const TOC = [
  ['#s1', 'Введение и параметры модели'],
  ['#s2', 'Пять фаз полёта'],
  ['#s3', 'Фаза 1 - Пусковая труба'],
  ['#s4', 'Фаза 2 - Водяная тяга'],
  ['#s5', 'Фаза 3 - Воздушный импульс'],
  ['#s6', 'Фаза 4 - Свободный полёт'],
  ['#s7', 'Аэродинамическое сопротивление'],
  ['#s8', 'Численный метод (Эйлер)'],
  ['#s9', 'Эталонный пример'],
  ['#s10', 'Границы модели'],
];

/* ─────────────────────────  styles  ───────────────────────── */
const FONT = 'var(--font-body)';
const root = { position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', background: '#ede8e0' };
const bg = { position: 'absolute', inset: 0, backgroundImage: 'url(/images/param_phone.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', opacity: 0.5, filter: 'blur(1px)', zIndex: 0 };
const scrollArea = { position: 'relative', zIndex: 2, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' };

const cover = { background: 'linear-gradient(135deg, #1b5e20, #2e7d32)', color: '#fff', padding: '64px clamp(20px,5vw,48px) 40px', position: 'relative' };
const backBtn = { position: 'absolute', top: 18, right: 'clamp(16px,4vw,40px)', color: 'rgba(255,255,255,0.92)', fontSize: 14, fontFamily: FONT, fontWeight: 600, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 100, padding: '6px 16px', cursor: 'pointer' };
const coverTitle = { fontFamily: FONT, fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', fontWeight: 800, lineHeight: 1.15, margin: '0 0 10px', letterSpacing: '-0.5px' };
const coverSub = { fontSize: 'clamp(0.85rem, 1.6vw, 1.05rem)', opacity: 0.85, maxWidth: 640, fontFamily: FONT };

const content = { maxWidth: 900, margin: '0 auto', padding: '0 clamp(14px,3vw,40px) 60px' };

const toc = { background: '#fff', borderLeft: '4px solid #4caf50', margin: '28px 0', padding: '22px 26px', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' };
const tocHead = { fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: '#546e7a', marginBottom: 12, fontWeight: 700, fontFamily: FONT };
const tocList = { paddingLeft: 22, margin: 0, fontFamily: FONT };
const tocLink = { color: '#1565c0', textDecoration: 'none', fontSize: 14 };

const sectionCard = { background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderRadius: 16, padding: 'clamp(18px,3vw,30px)', marginTop: 26, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', fontFamily: FONT };
const secNum = { display: 'inline-block', background: '#2e7d32', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 4, marginBottom: 12, letterSpacing: 1 };
const secTitle = { fontSize: 'clamp(1.3rem,2.6vw,1.55rem)', fontWeight: 700, color: '#37474f', borderBottom: '2px solid #cfd8dc', paddingBottom: 8, marginBottom: 18, fontFamily: FONT };
const subsec = { fontSize: '1.08rem', fontWeight: 600, color: '#2e7d32', margin: '26px 0 10px', fontFamily: FONT };
const p = { margin: '0 0 14px', fontSize: 14.5, lineHeight: 1.75, color: '#263238', fontFamily: FONT };
const smallMuted = { fontSize: 13, color: '#546e7a', fontFamily: FONT, margin: '6px 0 0' };

const formulaBlock = { background: 'rgba(227,242,253,0.8)', borderLeft: '4px solid #1565c0', padding: '16px 22px', margin: '18px 0', borderRadius: 8 };
const formulaLabel = { fontSize: 11.5, color: '#1565c0', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, fontFamily: FONT };
const formulaNote = { fontSize: 13, color: '#546e7a', marginTop: 8, fontFamily: FONT, lineHeight: 1.6 };

const noteBox = { background: '#fff3e0', borderLeft: '4px solid #e65100', padding: '14px 18px', borderRadius: 8, margin: '18px 0', fontSize: 14, lineHeight: 1.65, color: '#263238', fontFamily: FONT };
const tipBox = { background: '#e8f5e9', borderLeft: '4px solid #4caf50', padding: '14px 18px', borderRadius: 8, margin: '18px 0', fontSize: 14, lineHeight: 1.65, color: '#263238', fontFamily: FONT };

const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: 13.5, fontFamily: FONT };
const thStyle = { background: '#2e7d32', color: '#fff', padding: '10px 13px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' };
const tdStyle = { padding: '9px 13px', borderBottom: '1px solid #cfd8dc', color: '#263238', verticalAlign: 'middle' };

const codeBlock = { background: '#263238', color: '#cfd8dc', padding: '18px 22px', borderRadius: 10, fontFamily: 'var(--font-mono, monospace)', fontSize: 12.5, lineHeight: 1.6, overflowX: 'auto', margin: '18px 0', whiteSpace: 'pre' };

const phasesGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, margin: '22px 0' };
const phaseCard = { background: '#fff', borderRadius: 10, padding: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' };
const phaseNum = { fontSize: 11, fontWeight: 700, color: '#546e7a', textTransform: 'uppercase', letterSpacing: 1 };
const phaseName = { fontSize: 14, fontWeight: 600, margin: '4px 0', color: '#263238' };
const phaseVal = { fontSize: 21, fontWeight: 800 };
const phaseDesc = { fontSize: 12, color: '#546e7a', marginTop: 4 };

const paramsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10, margin: '16px 0' };
const paramRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, padding: '9px 13px', background: '#fff', borderRadius: 8, border: '1px solid #cfd8dc' };
const paramName = { fontSize: 13.5, color: '#37474f', fontWeight: 600 };
const paramVal = { fontSize: 12.5, color: '#546e7a', textAlign: 'right' };

const resultBanner = { background: 'linear-gradient(90deg, #2e7d32, #43a047)', color: '#fff', padding: '20px 26px', borderRadius: 12, margin: '26px 0 0', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' };
const bannerLabel = { fontSize: 12, opacity: 0.8 };
const bannerBig = { fontSize: '2.2rem', fontWeight: 800, lineHeight: 1 };
const bannerSep = { opacity: 0.4, fontSize: '1.8rem' };

const footer = { textAlign: 'center', color: '#546e7a', fontSize: 13, padding: '40px 0 10px', lineHeight: 1.8, fontFamily: FONT };
