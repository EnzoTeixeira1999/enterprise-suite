import { useRef, useState, type FormEvent } from "react";
import { apiFetch } from "../services/api";

type Entity = "companies" | "products" | "suppliers" | "batches" | "movements";
type Option = { value: string; label: string };
type Field = {
  key: string; label: string; type?: "email" | "date" | "number" | "textarea";
  required?: boolean; maxLength?: number; step?: string; min?: number; max?: number; options?: Option[];
};

const statuses = { ACTIVE: "Ativo", INACTIVE: "Inativo", SUSPENDED: "Suspenso", DISCONTINUED: "Descontinuado" };
const options = (values: Record<string, string>) => Object.entries(values).map(([value, label]) => ({ value, label }));
const organizationFields: Field[] = [
  { key: "legalName", label: "Razão social", required: true, maxLength: 160 },
  { key: "tradeName", label: "Nome fantasia", required: true, maxLength: 120 },
];
const organizationStatus = { key: "status", label: "Status", options: options({ ACTIVE: statuses.ACTIVE, INACTIVE: statuses.INACTIVE, SUSPENDED: statuses.SUSPENDED }) };
const fieldsByEntity: Record<Entity, Field[]> = {
  companies: [...organizationFields, { key: "taxId", label: "Documento", required: true, maxLength: 32 }, organizationStatus],
  products: [
    { key: "sku", label: "SKU", required: true, maxLength: 64 },
    { key: "name", label: "Produto", required: true, maxLength: 160 },
    { key: "category", label: "Categoria", maxLength: 100 },
    { key: "unit", label: "Unidade", options: options({ UNIT: "Unidade", KG: "Quilograma", LITER: "Litro", BOX: "Caixa", METER: "Metro" }) },
    { key: "status", label: "Status", options: options({ ACTIVE: statuses.ACTIVE, INACTIVE: statuses.INACTIVE, DISCONTINUED: statuses.DISCONTINUED }) },
    { key: "description", label: "Descrição", type: "textarea", maxLength: 500 },
  ],
  suppliers: [
    ...organizationFields,
    { key: "taxId", label: "Documento", maxLength: 32 },
    { key: "email", label: "E-mail", type: "email", maxLength: 160 },
    { key: "phone", label: "Telefone", maxLength: 32 },
    { key: "city", label: "Cidade", maxLength: 120 },
    { key: "state", label: "Estado", maxLength: 80 },
    { key: "country", label: "País", maxLength: 80 },
    organizationStatus,
  ],
  batches: [
    { key: "batchCode", label: "Código do lote", required: true, maxLength: 64 },
    { key: "manufactureDate", label: "Fabricação", type: "date", required: true },
    { key: "expirationDate", label: "Validade", type: "date" },
    { key: "currentQuantity", label: "Quantidade atual", type: "number", step: "0.001", min: 0, required: true },
  ],
  movements: [
    { key: "title", label: "Título", required: true, maxLength: 120 },
    { key: "locationName", label: "Local", maxLength: 160 },
    { key: "responsibleName", label: "Responsável", maxLength: 120 },
    { key: "latitude", label: "Latitude", type: "number", step: "0.000001", min: -90, max: 90 },
    { key: "longitude", label: "Longitude", type: "number", step: "0.000001", min: -180, max: 180 },
    { key: "description", label: "Descrição", type: "textarea", maxLength: 500 },
  ],
};

type Props = {
  entity: Entity; record: { id: string }; name: string; editPath?: string;
  suppliers?: Option[]; archiveDisabled?: boolean; onSaved: () => void | Promise<void>;
};

export default function RecordActions({ entity, record, name, editPath, suppliers, archiveDisabled, onSaved }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<"edit" | "archive">("edit");
  const [values, setValues] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const row = record as Record<string, unknown>;
  const currentSupplier = String(row.supplierId ?? "");
  const supplierChoices = suppliers && !suppliers.some(({ value }) => value === currentSupplier)
    ? [{ value: currentSupplier, label: String(row.supplierName ?? "Sem fornecedor vinculado") }, ...suppliers]
    : suppliers;
  const fields: Field[] = supplierChoices ? [...fieldsByEntity[entity],
    { key: "supplierId", label: "Fornecedor", options: supplierChoices },
  ] : fieldsByEntity[entity];
  const archivePath = `/api/audit/${entity}/${record.id}`;

  function open(next: typeof mode) {
    setMode(next);
    setValues(Object.fromEntries(fields.map(({ key }) => [key, String(row[key] ?? "")])));
    setReason("");
    setError("");
    dialog.current?.showModal();
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    const payload = Object.fromEntries(fields.map(({ key, type }) => {
      const value = values[key]?.trim() ?? "";
      return [key, value === "" ? null : type === "number" ? Number(value) : value];
    }));
    if (entity === "batches") payload.status = String(row.status);
    try {
      const response = await apiFetch(mode === "archive" ? archivePath : editPath ?? archivePath, {
        method: mode === "archive" ? "DELETE" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "archive" ? { reason } : payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(body?.message ?? "Não foi possível salvar a alteração.");
      }
      dialog.current?.close();
      await onSaved();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível salvar a alteração.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="record-actions">
      <button className="secondary-button" type="button" onClick={() => open("edit")} aria-label={`Editar ${name}`}>Editar</button>
      <button className="secondary-button record-actions__archive" type="button" onClick={() => open("archive")}
        disabled={archiveDisabled} title={archiveDisabled ? "Eventos de bloqueio e liberação ficam no histórico de segurança" : undefined}
        aria-label={`Arquivar ${name}`}>Apagar</button>
      <dialog ref={dialog} className="record-dialog" aria-label={`${mode === "edit" ? "Editar" : "Arquivar"} ${name}`}
        onCancel={(event) => { if (pending) event.preventDefault(); }}>
        <form onSubmit={(event) => void save(event)}>
          <h3>{mode === "edit" ? "Editar registro" : "Arquivar registro"}</h3>
          <p>{name}</p>
          {mode === "archive" ? (
            <>
              <p>O registro sai da lista ativa. A versão original e o motivo ficam no Histórico de alterações.</p>
              <label>Motivo do arquivamento (opcional)
                <textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} rows={3} />
              </label>
            </>
          ) : (
            <>
              {entity === "movements" && <p>O tipo, o horário e a quantidade do evento são preservados por fazerem parte do registro operacional.</p>}
              <div className="record-dialog__fields">
                {fields.map(({ key, label, type, options: choices, ...attributes }) => {
                  const value = values[key] ?? "";
                  const onValue = (event: { target: { value: string } }) => setValues((old) => ({ ...old, [key]: event.target.value }));
                  return <label key={key}>{label}
                    {choices ? <select value={value} onChange={onValue}>{choices.map((choice) => (
                      <option key={choice.value} value={choice.value}>{choice.label}</option>
                    ))}</select> : type === "textarea" ? <textarea value={value} onChange={onValue} maxLength={attributes.maxLength} rows={3} />
                      : <input type={type ?? "text"} value={value} onChange={onValue} {...attributes} />}
                  </label>;
                })}
              </div>
            </>
          )}
          {error && <p role="alert" className="record-dialog__error">{error}</p>}
          <div className="record-actions">
            <button className="secondary-button" type="button" disabled={pending} onClick={() => dialog.current?.close()}>Cancelar</button>
            <button className="primary-button" type="submit" disabled={pending}>{pending ? "Salvando…" : mode === "edit" ? "Salvar edição" : "Confirmar arquivamento"}</button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
