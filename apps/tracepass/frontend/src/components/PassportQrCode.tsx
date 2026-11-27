import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { getPassportShareUrl } from "../services/passportShare";

type PassportQrCodeProps = {
  passportId: string;
  productName: string;
  batchCode: string;
  example?: boolean;
  workspace?: boolean;
};


function PassportQrCode({
  passportId,
  productName,
  batchCode,
  example = false,
  workspace = false,
}: PassportQrCodeProps) {
  const qrContainerRef =
    useRef<HTMLDivElement | null>(null);

  const publicUrl = getPassportShareUrl();

  function downloadQrCode() {
    const qrCanvas =
      qrContainerRef.current?.querySelector("canvas");

    if (!qrCanvas) {
      return;
    }

    const padding = 32;

    const exportCanvas =
      document.createElement("canvas");

    exportCanvas.width =
      qrCanvas.width + padding * 2;

    exportCanvas.height =
      qrCanvas.height + padding * 2;

    const context =
      exportCanvas.getContext("2d");

    if (!context) {
      return;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(
      0,
      0,
      exportCanvas.width,
      exportCanvas.height,
    );

    context.drawImage(
      qrCanvas,
      padding,
      padding,
    );

    const imageUrl =
      exportCanvas.toDataURL("image/png");

    const downloadLink =
      document.createElement("a");

    downloadLink.href = imageUrl;
    downloadLink.download =
      `tracepass-${batchCode.toLowerCase()}.png`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
  }

  return (
    <section className="passport-qr-section">
      <div className="passport-qr-content">
        <p>ACESSO INSTANTÂNEO</p>

        <h2>
          {workspace ? "Acesse o passaporte de teste" : example ? "Compartilhe este exemplo" : "Compartilhe o passaporte"}
        </h2>

        <span>
          {workspace ? "Os registros de teste ficam neste navegador. Este endereço só encontra o lote onde ele foi cadastrado." : example ? "No site publicado, o QR Code abre este exemplo no navegador do celular." : "Baixe o QR Code para incluir na embalagem ou em um documento. Quem escanear abre este passaporte."}
        </span>

        <div className="passport-qr-details">
          <div>
            <small>PRODUTO</small>
            <strong>{productName}</strong>
          </div>

          <div>
            <small>LOTE</small>
            <strong>{batchCode}</strong>
          </div>

          <div>
            <small>ID PÚBLICO</small>
            <code>{passportId}</code>
          </div>
        </div>
      </div>

      <div className="passport-qr-card">
        <div
          className="passport-qr-code"
          ref={qrContainerRef}
        >
          <QRCodeCanvas
            value={publicUrl}
            size={210}
            level="H"
            bgColor="#ffffff"
            fgColor="#141014"
            title={`Passaporte digital do lote ${batchCode}`}
          />
        </div>

        <strong>
          Escaneie para abrir
        </strong>

        <span>
          {example || workspace ? "Passaporte demonstrativo do TracePass" : "Documento público emitido pelo TracePass"}
        </span>

        <button
          type="button"
          onClick={downloadQrCode}
        >
          Baixar QR Code
        </button>
      </div>
    </section>
  );
}

export default PassportQrCode;