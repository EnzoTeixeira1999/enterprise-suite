import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

type PassportQrCodeProps = {
  passportId: string;
  productName: string;
  batchCode: string;
};

function PassportQrCode({
  passportId,
  productName,
  batchCode,
}: PassportQrCodeProps) {
  const qrContainerRef =
    useRef<HTMLDivElement | null>(null);

  const publicUrl = window.location.href;

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
          Leve este passaporte com o produto.
        </h2>

        <span>
          Imprima ou adicione este QR Code à embalagem.
          Clientes, transportadoras e parceiros poderão
          consultar a jornada completa.
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
            fgColor="#061521"
            title={`Passaporte digital do lote ${batchCode}`}
          />
        </div>

        <strong>
          Escaneie para verificar
        </strong>

        <span>
          Documento público emitido pelo TracePass
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