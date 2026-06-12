import { Sprite } from "./bits";

export function ChampionBox({ team, results, onReset }) {
  return (
    <div className="finale win-box">
      <div className="finale-eyebrow">HALL DA FAMA · JOHTO</div>
      <div className="finale-title">VOCÊ É O NOVO CAMPEÃO!</div>
      <div className="finale-team">
        {team.map((m, i) => {
          const total = results.reduce((s, r) => s + (r.koBy[m.name] || 0), 0);
          return (
            <div className="hof-row" key={m.id + "-" + i}>
              <span className="hof-mon">
                <Sprite src={m.image.sprite} alt={m.name} size={40} />
                {m.name.toUpperCase()}
              </span>
              <span className="hof-ko">{total > 0 ? `${total} K.O.` : "—"}</span>
            </div>
          );
        })}
      </div>
      <button className="btn btn-gold" onClick={onReset}>
        NOVA JORNADA ▸
      </button>
    </div>
  );
}

export function DefeatBox({ trainer, result, stage, onReset }) {
  return (
    <div className="finale lose-box">
      <div className="finale-eyebrow">FIM DE JORNADA</div>
      <div className="finale-title red">{trainer.name} APAGOU TODAS AS LUZES</div>
      <p className="finale-sub">
        Seu time caiu por {result.score[1]} a {result.score[0]} no confronto {stage} de 5.
      </p>
      <button className="btn btn-gold" onClick={onReset}>
        TENTAR DE NOVO ▸
      </button>
    </div>
  );
}
