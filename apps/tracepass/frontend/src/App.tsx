import { useEffect, useState } from "react";
import "./App.css";

type ApiStatus = "checking" | "online" | "offline";

function App() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");

  useEffect(() => {
    fetch("/actuator/health")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Falha ao consultar a API");
        }

        return response.json();
      })
      .then((data) => {
        setApiStatus(data.status === "UP" ? "online" : "offline");
      })
      .catch(() => {
        setApiStatus("offline");
      });
  }, []);

  const statusText = {
    checking: "Verificando API...",
    online: "API conectada",
    offline: "API desconectada",
  };

  return (
    <main className="app">
      <header className="header">
        <div className="brand">
          <div className="brand__symbol">TP</div>

          <div>
            <h1>TracePass</h1>
            <p>Rastreabilidade e passaporte digital</p>
          </div>
        </div>

        <div className={`status status--${apiStatus}`}>
          <span className="status__dot" />
          {statusText[apiStatus]}
        </div>
      </header>

      <section className="hero">
        <p className="hero__label">CONTROLE DE PONTA A PONTA</p>

        <h2>Acompanhe toda a jornada de um produto.</h2>

        <p className="hero__description">
          Registre produtos, lotes, fornecedores e movimentações em uma linha
          do tempo confiável e transparente.
        </p>

        <button type="button">Iniciar demonstração</button>
      </section>

      <section className="features">
        <article>
          <span>01</span>
          <h3>Produtos e lotes</h3>
          <p>Identificação individual e histórico centralizado.</p>
        </article>

        <article>
          <span>02</span>
          <h3>Movimentações</h3>
          <p>Acompanhamento da origem até o destino final.</p>
        </article>

        <article>
          <span>03</span>
          <h3>Passaporte digital</h3>
          <p>Consulta pública por QR Code para clientes e parceiros.</p>
        </article>
      </section>
    </main>
  );
}

export default App;