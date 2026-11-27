import { useEffect, useId, useState } from "react";
import { demoPath } from "../demoPassport";
import { listPublishedPassports, publishedPassportPath, type PublishedPassport } from "../services/portfolioDemo";

export default function PassportPicker({ newTab = false }: { newTab?: boolean }) {
  const id = useId();
  const [passports, setPassports] = useState<PublishedPassport[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [catalog, setCatalog] = useState<"loading" | "ready" | "unavailable">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    void listPublishedPassports().then((published) => {
      if (!current) return;
      setPassports(published);
      setSelectedId((previous) => published.some((item) => item.id === previous)
        ? previous
        : (published.find((item) => item.featured) ?? published[0])?.id ?? "");
      setCatalog("ready");
    }).catch(() => {
      if (current) setCatalog("unavailable");
    });
    return () => { current = false; };
  }, [attempt]);

  const selected = passports.find((passport) => passport.id === selectedId);
  return (
    <div className="passport-picker">
      <label htmlFor={id}>
        Produto e lote
        <select id={id} value={selectedId} disabled={!passports.length}
          onChange={(event) => setSelectedId(event.target.value)}>
          {!passports.length && <option value="">
            {catalog === "loading" ? "Carregando passaportes…" : catalog === "ready" ? "Nenhum lote publicado" : "Catálogo temporariamente indisponível"}
          </option>}
          {passports.map(({ id: passportId, product, code }) =>
            <option value={passportId} key={passportId}>{product} · {code}</option>)}
        </select>
      </label>
      {(selected || catalog === "unavailable") && <a className="landing-passport-link"
        href={selected ? publishedPassportPath(selected.id) : demoPath}
        target={newTab ? "_blank" : undefined} rel={newTab ? "noreferrer" : undefined}>
        {selected ? "Ver Passaporte" : "Ver passaporte em destaque"}
      </a>}
      {catalog === "unavailable" && <button className="secondary-button" type="button"
        onClick={() => { setCatalog("loading"); setAttempt((value) => value + 1); }}>Recarregar lotes</button>}
    </div>
  );
}
