CREATE TABLE portfolio_demo (
    singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
    revision BIGINT NOT NULL,
    snapshot TEXT
);

INSERT INTO portfolio_demo (singleton, revision, snapshot) VALUES (1, 1, $demo$
{
  "featuredBatchId": "48a4ee40-24f0-46a8-ab09-4d28b2084fbf",
  "companies": [
    {
      "id": "3ca4fcd3-2230-4efd-87c2-dac74d9543aa",
      "legalName": "Conecta Litoral Componentes",
      "tradeName": "Conecta Litoral Componentes",
      "taxId": "DEMO-CONECTA",
      "status": "ACTIVE",
      "createdAt": "2026-11-27T21:50:00Z",
      "updatedAt": "2026-11-27T21:50:00Z"
    }
  ],
  "suppliers": [
    {
      "id": "85138391-88c8-44fc-a085-fa014694b26c",
      "companyId": "3ca4fcd3-2230-4efd-87c2-dac74d9543aa",
      "companyName": "Conecta Litoral Componentes",
      "legalName": "Conecta Litoral Componentes",
      "tradeName": "Conecta Litoral Componentes",
      "city": "Santos",
      "state": "São Paulo",
      "country": "Brasil",
      "status": "ACTIVE",
      "createdAt": "2026-11-27T21:50:00Z",
      "updatedAt": "2026-11-27T21:50:00Z"
    }
  ],
  "products": [
    {
      "id": "d1ec6ee5-9116-4dc4-8d0c-5510e35769e7",
      "companyId": "3ca4fcd3-2230-4efd-87c2-dac74d9543aa",
      "companyName": "Conecta Litoral Componentes",
      "sku": "CONEC-KIT-01",
      "name": "Kit de conectores elétricos",
      "unit": "BOX",
      "status": "ACTIVE",
      "createdAt": "2026-11-27T21:50:00Z",
      "updatedAt": "2026-11-27T21:50:00Z"
    }
  ],
  "batches": [
    {
      "id": "48a4ee40-24f0-46a8-ab09-4d28b2084fbf",
      "companyId": "3ca4fcd3-2230-4efd-87c2-dac74d9543aa",
      "companyName": "Conecta Litoral Componentes",
      "productId": "d1ec6ee5-9116-4dc4-8d0c-5510e35769e7",
      "supplierId": "85138391-88c8-44fc-a085-fa014694b26c",
      "batchCode": "ELE-SP-001",
      "manufactureDate": "2026-11-23",
      "expirationDate": null,
      "initialQuantity": 120,
      "currentQuantity": 120,
      "status": "REGISTERED",
      "createdAt": "2026-11-27T21:50:00Z",
      "updatedAt": "2026-11-27T21:50:00Z"
    }
  ],
  "movements": [],
  "incidents": []
}
$demo$);
